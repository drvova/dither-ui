// The hand the reader last reached for the page with: a finger (or a pen),
// a mouse, or the keyboard. What opens under a finger keeps the on-screen
// keyboard down and draws no focus ring: a popup opened by a touch leaves
// its field and its first item unfocused (focus moves in when the keyboard
// or a mouse opens it), and focus handed back to a key after a touch is
// handed back unringed. One listener pair on the document, installed once
// by the entry. Framework-free: it touches the DOM only when installed.

/** The hand: a finger or a pen (`touch`), a mouse (`pointer`), the keys. */
type Hand = "touch" | "pointer" | "keyboard"

let last: Hand = "pointer"

/** The hand the reader last reached for the page with. */
export const lastHand = (): Hand => last

/** Whether a popup opening now takes focus in: not under a finger, where a
 * focused field raises the on-screen keyboard over half the screen. */
export const focusOnOpen = (): boolean => last !== "touch"

/** Focus handed back to `el` (a popup's key as it closes): after a touch
 * without the ring a keyboard's focus shows. A field the finger focused
 * matches `:focus-visible` (every field does) and would pass it on to the
 * key: it is let go first, and the engines that take `focusVisible` are
 * told so. */
export function focusBack(el: HTMLElement | null | undefined): void {
  if (!el) return
  if (last !== "touch") return el.focus()
  const at = document.activeElement
  if (at instanceof HTMLElement && at !== el) at.blur()
  el.focus({ focusVisible: false } as FocusOptions)
}

/** Install on `doc`: every pointer down and key down names the hand. */
export function installHand(doc: Document = document): () => void {
  const pointer = (e: Event) => {
    last = (e as PointerEvent).pointerType === "mouse" ? "pointer" : "touch"
  }
  const key = () => {
    last = "keyboard"
  }
  doc.addEventListener("pointerdown", pointer, true)
  doc.addEventListener("keydown", key, true)
  return () => {
    doc.removeEventListener("pointerdown", pointer, true)
    doc.removeEventListener("keydown", key, true)
  }
}
