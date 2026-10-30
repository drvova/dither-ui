// iOS fires no `contextmenu` on a long press, so every right-click menu
// would be out of a finger's reach. Under `root`, a touch held still for
// `hold` ms dispatches one at the finger, and the click its release would
// make is swallowed (it would land on the menu that just opened under it).
// A platform that fires its own (Android) cancels ours; text fields keep
// their own long press (the caret loupe and the edit menu).

const SLOP = 10

const editable = (t: EventTarget | null) =>
  t instanceof HTMLElement && t.closest("input, textarea, select, [contenteditable]") !== null

export function installLongPress(root: HTMLElement | Document = document, hold = 500): () => void {
  let press: { id: number; x: number; y: number; target: EventTarget; timer: ReturnType<typeof setTimeout> } | null =
    null
  let fired: number | null = null

  const end = () => {
    if (press) clearTimeout(press.timer)
    press = null
  }
  const swallow = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const down = (e: Event) => {
    const ev = e as PointerEvent
    if (ev.pointerType !== "touch" || !ev.isPrimary || editable(ev.target)) return end()
    end()
    const { pointerId: id, clientX: x, clientY: y, target } = ev
    press = {
      id,
      x,
      y,
      target: target!,
      timer: setTimeout(() => {
        press = null
        fired = id
        target!.dispatchEvent(
          new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }),
        )
      }, hold),
    }
  }
  const move = (e: Event) => {
    const ev = e as PointerEvent
    if (press && ev.pointerId === press.id && Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > SLOP) end()
  }
  const up = (e: Event) => {
    const ev = e as PointerEvent
    if (press?.id === ev.pointerId) end()
    if (fired !== ev.pointerId) return
    fired = null
    window.addEventListener("click", swallow, { capture: true, once: true })
    setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 400)
  }
  // The platform's own menu (a trusted event) wins over ours.
  const native = (e: Event) => {
    if (e.isTrusted) end()
  }

  root.addEventListener("pointerdown", down, true)
  root.addEventListener("pointermove", move, true)
  root.addEventListener("pointerup", up, true)
  root.addEventListener("pointercancel", up, true)
  root.addEventListener("contextmenu", native, true)
  return () => {
    end()
    root.removeEventListener("pointerdown", down, true)
    root.removeEventListener("pointermove", move, true)
    root.removeEventListener("pointerup", up, true)
    root.removeEventListener("pointercancel", up, true)
    root.removeEventListener("contextmenu", native, true)
  }
}
