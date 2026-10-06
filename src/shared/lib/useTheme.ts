import { onMounted, ref } from "vue"

const STORAGE_KEY = "dither-theme"

let killSwitch: HTMLStyleElement | null = null

/** Run a DOM change with every CSS transition disabled for one frame, so a
 * theme flip snaps instead of smearing color/background/border transitions
 * across the whole page. The override is removed on the frame after the
 * change has painted. */
function withoutTransitions(fn: () => void) {
  if (killSwitch) {
    // A flip is already in flight: transitions are off, just commit the change.
    fn()
    return
  }
  killSwitch = document.createElement("style")
  killSwitch.textContent = "*,*::before,*::after{transition:none !important}"
  document.head.appendChild(killSwitch)
  fn()
  document.body.offsetHeight // synchronous style flush while the override applies
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      killSwitch?.remove()
      killSwitch = null
    })
  })
}

/** Dark/light toggle on <html>. Defaults to dark (the dither aesthetic),
 * remembers the choice, and can reveal the new theme as a circle growing
 * from the control that asked for it (View Transitions API). */
export function useTheme() {
  const dark = ref(true)
  const apply = () => document.documentElement.classList.toggle("dark", dark.value)
  const persist = () => localStorage.setItem(STORAGE_KEY, dark.value ? "dark" : "light")

  const toggle = () => withoutTransitions(() => {
    dark.value = !dark.value
    apply()
    persist()
  })

  /** Theme swap wrapped in a circular reveal from the event's control.
   * Falls back to a plain toggle without the API or under reduced motion. */
  const revealToggle = (e?: MouseEvent) => {
    const doc = document as Document & { startViewTransition?: (fn: () => void) => { ready: Promise<void> } }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!doc.startViewTransition || still) {
      toggle()
      return
    }
    const target = e?.currentTarget instanceof HTMLElement ? e.currentTarget : null
    const r = target?.getBoundingClientRect()
    const cx = r ? r.left + r.width / 2 : window.innerWidth - 24
    const cy = r ? r.top + r.height / 2 : 24
    const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy))
    doc.startViewTransition(() => withoutTransitions(toggle)).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
        { duration: 480, easing: "cubic-bezier(0.3, 0.9, 0.4, 1)", pseudoElement: "::view-transition-new(root)" }
      )
    })
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) dark.value = stored === "dark"
    apply()
  })
  return { dark, toggle, revealToggle }
}
