import { type Accessor, createSignal, onMount, onCleanup } from "solid-js"
import { ditherTransition } from "@dither-ui/kit/engine/transition.ts"
import { storage } from "@/shared/lib/storage"

const STORAGE_KEY = "dither-theme"

/** The head's script on a page that turns with the reader's theme: the
 * stored theme on the root before the first paint, as `useTheme` sets it
 * when the app mounts (the bytes are rendered dark). */
export const THEME_HEAD_SCRIPT = `try{document.documentElement.classList.toggle("dark",localStorage.getItem(${JSON.stringify(STORAGE_KEY)})!=="light")}catch(e){}`

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
 * growing from the control that asked for it (the kit's transition engine).
 *
 * The browser's own chrome (iOS Safari's bar) wears the page's ground in
 * the theme the reader picked, whatever the system's scheme: `ground` is
 * that ground as the page computes it (unset until the first frame has
 * painted), for the page's own `<Meta name="theme-color">` to carry. */
export function useTheme(): {
  dark: Accessor<boolean>
  ground: Accessor<string | undefined>
  toggle: () => void
  revealToggle: (e?: MouseEvent) => void
} {
  const [dark, setDark] = createSignal(true)
  const [ground, setGround] = createSignal<string>()
  const tintChrome = () => setGround(getComputedStyle(document.body).backgroundColor || undefined)
  const apply = () => {
    document.documentElement.classList.toggle("dark", dark())
    tintChrome()
  }
  const persist = () => storage.set(STORAGE_KEY, dark() ? "dark" : "light")

  const toggle = () =>
    withoutTransitions(() => {
      setDark(!dark())
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
      easing: "glide",
    })
  }

  onMount(() => {
    const stored = storage.get(STORAGE_KEY)
    if (stored) setDark(stored === "dark")
    document.documentElement.classList.toggle("dark", dark())
    // The tint reads the page's computed ground: inside the mount it forced
    // a style pass over the whole fresh page (583ms on the docs at 4x CPU);
    // after the first frame has painted, styles are clean and the read free.
    // (let go if the page leaves first: the read needs a page to stand)
    let timer: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => (timer = setTimeout(tintChrome)))
    onCleanup(() => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    })
  })
  return { dark, ground, toggle, revealToggle }
}
