// The glide (the user's call, after a page they made): one filled ground
// travels under the pointer from link to link in a row, so a hover reads
// as one hand moving rather than many lights switching. It leaves where it
// stands on the first entry (nothing travels in from nowhere), then moves
// on the glide for a hand's movement and fades on a colour's time when the
// pointer leaves. Only a mouse or a pen drives it (a finger has no hover);
// a keyboard's focus ring stays the one indicator for keys. Under reduced
// motion it moves without travel. Framework-free.

/** What the ground stands under: a host's items it goes to. */
export const GLIDE_ITEMS = "a, button"

/** The ground's box in the host's coordinates, from the two rects. */
export function glideBox(host: DOMRectReadOnly, item: DOMRectReadOnly) {
  return { x: item.left - host.left, y: item.top - host.top, width: item.width, height: item.height }
}

/** Put a glide in `host`: its items (`GLIDE_ITEMS` among its descendants)
 * get the one ground under them as the pointer crosses them. */
export function glide(host: HTMLElement): { destroy(): void } {
  const ground = document.createElement("span")
  ground.className = "glide-ground"
  ground.setAttribute("aria-hidden", "true")
  host.prepend(ground)
  host.classList.add("glide-host")
  let shown = false
  const to = (item: Element) => {
    const b = glideBox(host.getBoundingClientRect(), item.getBoundingClientRect())
    ground.classList.toggle("is-placed", !shown)
    ground.style.width = `${b.width}px`
    ground.style.height = `${b.height}px`
    ground.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
    if (!shown) {
      // Placed at once on the first entry, then travels from there.
      void ground.offsetWidth
      ground.classList.remove("is-placed")
    }
    shown = true
    ground.classList.add("is-shown")
  }
  const over = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    const item = (e.target as Element | null)?.closest?.(GLIDE_ITEMS)
    if (item && item !== ground && host.contains(item)) to(item)
  }
  const out = () => {
    shown = false
    ground.classList.remove("is-shown")
  }
  host.addEventListener("pointerover", over)
  host.addEventListener("pointerleave", out)
  return {
    destroy() {
      host.removeEventListener("pointerover", over)
      host.removeEventListener("pointerleave", out)
      ground.remove()
      host.classList.remove("glide-host")
    },
  }
}
