# Canvas Drag Fix

An Obsidian plugin that fixes Canvas drag-and-drop on Linux when an ordinary
mouse is misclassified as a pen device by Chromium/Electron.

## Symptoms this fixes

- Cards in Canvas can't be moved by click-and-drag
- Resizing Canvas cards from the sides doesn't work (corners may still work)
- Click-and-drag selection of canvas regions doesn't work
- Arrow connections can't be drawn from card handles
- Click, double-click, keyboard arrow movement, and corner-resize all still work

If only drag interactions are broken while clicks work fine, this is almost
certainly the bug this plugin fixes.

## Affected setups

- Linux guests in VMware Workstation/Fusion/Player
- Linux guests in VirtualBox
- ChromeOS Crostini Linux containers
- Some Wayland configurations
- Some bare-metal Linux setups with unusual XInput2 device topology

The bug is reproducible with or without sandboxing (firejail, snap, flatpak,
AppImage). It's not specific to any sandbox or distribution.

## How to verify the bug applies to you

Open Obsidian DevTools (`Ctrl+Shift+I`), go to the Console tab, type
`allow pasting` and Enter, then paste:

```javascript
(() => {
  const log = e => console.log(e.type, 'pointerType:', e.pointerType, 'button:', e.button);
  ['pointerdown','pointermove','pointerup'].forEach(t =>
    document.addEventListener(t, log, true));
  setTimeout(() => ['pointerdown','pointermove','pointerup'].forEach(t =>
    document.removeEventListener(t, log, true)), 10000);
})();
```

Try to drag a Canvas card. If the console logs `pointerType: pen` for an
ordinary mouse, this plugin will fix it.

## How it works

Obsidian's Canvas drag handler uses a strict equality check on the pointer
type:

```js
e.targetNode === this.wrapperEl && "mouse" === e.pointerType && 0 === e.button
```

Under the affected configurations, Chromium reports `pointerType` as `"pen"`
even for a regular mouse, so the handler rejects the event and the drag never
starts. This plugin registers capture-phase listeners on `window` for every
relevant pointer event type. When a pen event fires, it rewrites
`pointerType` to `"mouse"` in place using `Object.defineProperty`. Because we
mutate the original event rather than dispatch a synthetic clone, the event's
target, currentTarget, view, and propagation path stay correct. By the time
Obsidian's downstream handlers see the event, it looks like a normal mouse
event.

## Caveats

- **All pen events are rewritten as mouse events globally.** If you have a real
  graphics tablet or stylus connected to this machine, disable the plugin first
  — it will mask pen pressure, tilt, and other stylus-specific data.
- The plugin only loads on desktop. It's a no-op on Obsidian Mobile, since the
  bug doesn't manifest there.
- This is a workaround, not an upstream fix. The underlying issue is in
  Chromium's XInput2 device classification. If/when Chromium fixes it or
  Obsidian relaxes the strict `"mouse"` check, this plugin becomes unnecessary.

## Manual installation

1. Download `main.js` and `manifest.json` from the latest release.
2. Place them in your vault under
   `<vault>/.obsidian/plugins/canvas-drag-fix/`.
3. In Obsidian: Settings → Community plugins → reload installed plugins, then
   enable Canvas Drag Fix.

## Building from source

```sh
npm install
npm run build
```

This produces `main.js` next to `manifest.json`. Copy both into your vault's
plugin folder.

For development, use `npm run dev` which rebuilds on changes.

## License

0BSD. See LICENSE in the repository root.
