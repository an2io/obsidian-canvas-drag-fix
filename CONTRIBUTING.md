# Contributing

Thanks for your interest in improving Canvas Drag Fix.

## Reporting bugs

Open an issue with:

- Your OS, and whether Obsidian runs in a VM, container, or bare metal.
- The output of the pointer-event snippet in the README's "How to verify the
  bug applies to you" section.
- Which Canvas interactions are broken versus working.

## Development

```sh
npm install
npm run dev    # rebuilds main.js on change
```

Load the plugin into a test vault under
`<vault>/.obsidian/plugins/canvas-drag-fix/`. The Hot Reload community plugin
picks up rebuilds without restarting Obsidian.

## Before opening a pull request

- Run `npm run lint && npm run build`; both must exit clean.
- Keep the change focused on the pointer-type workaround — this plugin is
  deliberately small and single-purpose.
- Describe the setup you tested on, since the bug is environment-specific.

## License

By contributing you agree your contributions are licensed under 0BSD, the same
license as the project.
