/** Roving keyboard navigation for a `role="menu"`: ArrowUp/ArrowDown move
 * focus between its enabled `menuitem`s (wrapping), Home/End jump. Attach
 * to the menu element's keydown. */
export function menuKeydown(e: KeyboardEvent) {
  const menu = (e.currentTarget as HTMLElement | null) ?? (e.target as HTMLElement).closest<HTMLElement>("[role=menu]")
  if (!menu) return
  // A text field inside the menu (inline naming) keeps its own keys.
  const t = e.target as HTMLElement
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable) return
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return
  const items = [...menu.querySelectorAll<HTMLElement>("[role=menuitem]:not([disabled])")]
  if (items.length === 0) return
  const i = items.indexOf(document.activeElement as HTMLElement)
  const next =
    e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length
  e.preventDefault()
  items[next].focus()
}

/** Focus a menu's first enabled item (call after it mounts). */
export function focusFirstMenuItem(menu: HTMLElement | null) {
  menu?.querySelector<HTMLElement>("[role=menuitem]:not([disabled])")?.focus()
}
