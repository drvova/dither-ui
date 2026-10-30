import { onMounted, ref } from "vue"
import { ditherTransition } from "@dither-kit/engine/transition"
import { storage } from "./storage"

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
 * remembers the choice, and can reveal the new theme as a dithered iris
 * growing from the control that asked for it (the kit's transition engine). */
export function useTheme() {
  const dark = ref(true)
  const apply = () => document.documentElement.classList.toggle("dark", dark.value)
  const persist = () => storage.set(STORAGE_KEY, dark.value ? "dark" : "light")

  const toggle = () =>
    withoutTransitions(() => {
      dark.value = !dark.value
      apply()
      persist()
    })

  /** Theme swap through an iris from the event's control. A plain toggle
   * without the View Transitions API or under reduced motion. */
  const revealToggle = (e?: MouseEvent) => {
    const r = e?.currentTarget instanceof HTMLElement ? e.currentTarget.getBoundingClientRect() : null
    void ditherTransition(toggle, {
      direction: "iris",
      origin: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth - 24, y: 24 },
      band: 8,
      duration: 480,
      easing: [0.22, 1, 0.36, 1],
    })
  }

  onMounted(() => {
    const stored = storage.get(STORAGE_KEY)
    if (stored) dark.value = stored === "dark"
    apply()
  })
  return { dark, toggle, revealToggle }
}
