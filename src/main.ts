import { Plugin } from "obsidian";

/**
 * Pointer event types we intercept. Covers everything Obsidian's Canvas drag
 * handler listens to.
 */
const POINTER_EVENTS = [
	"pointerdown",
	"pointermove",
	"pointerup",
	"pointerover",
	"pointerout",
	"pointerenter",
	"pointerleave",
	"pointercancel",
] as const;

/**
 * Canvas Drag Fix
 *
 * Workaround for an Electron/Chromium bug on Linux where an ordinary mouse is
 * misclassified as a pen device. PointerEvent.pointerType is reported as "pen"
 * instead of "mouse", which trips Obsidian's Canvas drag handler:
 *
 *     e.targetNode === this.wrapperEl && "mouse" === e.pointerType && 0 === e.button
 *
 * The handler rejects the event and the drag never starts. Other Canvas
 * interactions (click, resize from corner, arrow-key movement) keep working
 * because they don't gate on pointerType.
 *
 * Affected setups include Linux guests in VMware/VirtualBox, ChromeOS Crostini
 * containers, and various Wayland configurations. Reproducible regardless of
 * sandboxing (firejail, snap, flatpak, AppImage) — the misclassification
 * happens inside Chromium based on how XInput2 enumerates the pointer device.
 *
 * This plugin registers capture-phase listeners on `window` for every relevant
 * pointer event type. When a "pen" event fires, it rewrites `pointerType` to
 * "mouse" in place using Object.defineProperty. Because we mutate the original
 * event rather than dispatching a synthetic clone, target/currentTarget/view/
 * propagation path all stay correct, and Obsidian's downstream handlers see a
 * normal mouse event.
 *
 * Caveat: this rewrites all pen events globally. If you connect a real stylus,
 * disable the plugin first.
 */
export default class CanvasDragFixPlugin extends Plugin {
	private handler!: (e: PointerEvent) => void;

	override onload(): void {
		this.handler = (e: PointerEvent): void => {
			if (e.pointerType !== "pen") return;
			try {
				Object.defineProperty(e, "pointerType", {
					value: "mouse",
					configurable: true,
				});
			} catch {
				// Property already redefined or frozen — no-op.
			}
		};

		for (const type of POINTER_EVENTS) {
			window.addEventListener(type, this.handler, { capture: true });
		}
	}

	override onunload(): void {
		for (const type of POINTER_EVENTS) {
			window.removeEventListener(type, this.handler, { capture: true });
		}
	}
}
