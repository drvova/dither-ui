// The keys the kit's keyboard paths listen for, read the same in every
// engine, and the keyboard paths several components share: a menu's
// arrows and Escape, a roving group's arrows, a modal's Tab trap and a
// slider's steps. WebKitGTK names Shift+Tab "Unidentified" (GTK's
// ISO_Left_Tab) and keeps its code "Tab": a trap that read the name alone
// let Shift+Tab leave a modal there. Framework-free.

/** Whether a key event is Tab, with Shift or without. */
export const isTab = (e: Pick<KeyboardEvent, "key" | "code">): boolean => e.key === "Tab" || e.code === "Tab"

/** What Tab stops on inside a trap. */
export const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The elements Tab stops on inside `root`, in document order. */
export const focusablesIn = (root: ParentNode | undefined): HTMLElement[] => [
  ...(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
]

/** Move focus `dir` steps along `items` (those still in the page), wrapping;
 * from outside them, to the first going on and the last going back. */
export function moveFocus(items: readonly (HTMLElement | null | undefined)[], dir: number): void {
  const els = items.filter((el): el is HTMLElement => !!el && el.isConnected)
  if (!els.length) return
  const i = els.indexOf(document.activeElement as HTMLElement)
  const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
  els[next]?.focus()
}

/** An open menu's keys: Escape closes it (and stops there), ArrowDown and
 * ArrowUp walk its items. */
export function menuKeys(
  e: KeyboardEvent,
  items: readonly (HTMLElement | null | undefined)[],
  close: () => void,
): void {
  if (e.key === "Escape") {
    e.stopPropagation()
    close()
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault()
    moveFocus(items, e.key === "ArrowDown" ? 1 : -1)
  }
}

/** A modal's keys: Escape closes it (and stops there); Tab never leaves
 * `items`, wrapping from the last to the first and, with Shift, back, and
 * held where there is nothing to focus. */
export function trapKeys(e: KeyboardEvent, items: readonly HTMLElement[], close: () => void): void {
  if (e.key === "Escape") {
    e.stopPropagation()
    close()
    return
  }
  if (!isTab(e)) return
  if (!items.length) return e.preventDefault()
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

/** The option `dir` steps from `from` that is not disabled, wrapping, or -1
 * when every one is. */
export function nextEnabled(options: readonly { disabled?: boolean }[], from: number, dir: number): number {
  const n = options.length
  let i = from
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n
    if (!options[i].disabled) return i
  }
  return -1
}

/** A roving group's arrows (Down and Right on, Up and Left back): the
 * enabled option the arrow reaches from `from`, or -1 for any other key
 * or none to reach. An arrow's default is prevented. */
export function rovingKeys(e: KeyboardEvent, options: readonly { disabled?: boolean }[], from: number): number {
  const dir =
    e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
  if (!dir) return -1
  e.preventDefault()
  return nextEnabled(options, from, dir)
}

/** A slider's keys: the value an arrow (a step), PageUp or PageDown (ten)
 * or Home and End (the bounds) asks for, unclamped, or null for any other
 * key. A key that asks is the slider's: its default is prevented. */
export function sliderKeys(
  e: KeyboardEvent,
  s: { value: number; step: number; min: number; max: number },
): number | null {
  const big = s.step * 10
  let next: number | null = null
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = s.value - s.step
  else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = s.value + s.step
  else if (e.key === "PageDown") next = s.value - big
  else if (e.key === "PageUp") next = s.value + big
  else if (e.key === "Home") next = s.min
  else if (e.key === "End") next = s.max
  if (next !== null) e.preventDefault()
  return next
}
