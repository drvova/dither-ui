import { type Accessor, createSignal, onMount } from "solid-js"
import { storage } from "@/shared/lib/storage"
import { STORAGE_KEYS } from "@/shared/config/storage"

/** The head's script on a page that turns with the reader's theme: the
 * stored theme on the root before the first paint, as `useTheme` sets it
 * when the app mounts (the bytes are rendered dark). */
export const THEME_HEAD_SCRIPT = `try{document.documentElement.classList.toggle("dark",localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)})!=="light")}catch(e){}`

/** The view transition's type a theme turn runs as: the stylesheet prints
 * the new theme in over the old one through the Bayer matrix under it
 * (`app/styles.css`, `theme-print`). */
export const THEME_TURN = "theme"

type TurningDocument = Document & {
  startViewTransition?: (o: { update: () => void; types: string[] }) => unknown
}

/** Whether the browser takes a view transition with a type (Chromium 125,
 * Safari 18.2): one without types plays none and turns at once. */
const typed = () => typeof ViewTransition !== "undefined" && "types" in ViewTransition.prototype

/** Dark/light toggle on <html>. Defaults to dark (the dither aesthetic),
 * remembers the choice, and can print the new theme in over the old one
 * (`turn`): the one view transition the toggle starts, its motion all the
 * stylesheet's; at once without typed view transitions or under reduced
 * motion.
 *
 * The browser's own chrome (iOS Safari's bar) wears the page's ground in
 * the theme the reader picked, whatever the system's scheme: `ground` is
 * that ground as the page computes it (unset until the page has loaded),
 * for the page's own `<Meta name="theme-color">` to carry. */
export function useTheme(): {
  dark: Accessor<boolean>
  ground: Accessor<string | undefined>
  toggle: () => void
  turn: () => void
} {
  const [dark, setDark] = createSignal(true)
  const [ground, setGround] = createSignal<string>()
  const tintChrome = () => setGround(getComputedStyle(document.body).backgroundColor || undefined)
  const apply = () => {
    document.documentElement.classList.toggle("dark", dark())
    tintChrome()
  }
  const persist = () => storage.set(STORAGE_KEYS.theme, dark() ? "dark" : "light")

  const toggle = () => {
    setDark(!dark())
    apply()
    persist()
  }

  /** The theme turned through the matrix, where the browser can. */
  const turn = () => {
    const doc = document as TurningDocument
    if (!doc.startViewTransition || !typed() || matchMedia("(prefers-reduced-motion: reduce)").matches) return toggle()
    doc.startViewTransition({ update: toggle, types: [THEME_TURN] })
  }

  onMount(() => {
    const stored = storage.get(STORAGE_KEYS.theme)
    if (stored) setDark(stored === "dark")
    document.documentElement.classList.toggle("dark", dark())
    // The tint reads the page's computed ground: inside the mount it forced
    // a style pass over the whole fresh page (583ms on the docs at 4x CPU);
    // once the page has loaded, styles are clean and the read free.
    whenLoaded(tintChrome)
  })
  return { dark, ground, toggle, turn }
}

/** `then` once the page has loaded (now if it has). */
export function whenLoaded(then: () => void) {
  if (document.readyState === "complete") setTimeout(then)
  else addEventListener("load", () => setTimeout(then), { once: true })
}
