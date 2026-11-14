// The player page's mount — for both the site's `/play/` page and the
// single-file bundle an exported HyperFrames composition carries inline.
// Nothing runs as the module loads: mounting is one call, `mountPlayer`,
// so the module can be read on a server. The app's stylesheet is the
// entry's to bring (the site's app shell, the bundle's entry in
// `build/standalone.ts`), never a page's.
//
// HyperFrames' runtime dispatches `hf-seek` for every frame it captures and
// waits on `window.__hf.buildReady` before the first one. The hold here is
// fonts + one macrotask (Solid mounts in the call itself), never an
// animation frame: the renderer drives Chrome with begin-frame control, so
// frames (and rAF) only happen when it captures one — a readiness promise
// that waited for a frame would wait forever. Every surface paints its
// moment synchronously on seek.
import { directedTime, directFromHyperframes, isDirected, release, seek } from "@dither-ui/kit"
import { createComponent } from "solid-js"
import { render } from "solid-js/web"
import { STAGE_ID } from "@/shared/config/player"
import PlayPage from "./PlayPage"
import { readPlaySource } from "./source"

declare global {
  interface Window {
    __hf?: { buildReady?: Record<string, Promise<unknown>> }
    /** The clock for any driver: `ditherClock.seek(seconds)` holds the frame at a moment. */
    ditherClock?: {
      seek: (seconds: number) => void
      release: () => void
      directed: () => boolean
      time: () => number | null
    }
  }
}

/** Read the page's document, open the clock's two doors, say when the build
 * is ready, and mount the player in the stage. Returns its unmount. */
export function mountPlayer(): () => void {
  const source = readPlaySource()
  document.documentElement.classList.toggle("dark", source.theme !== "light")
  // Two doors onto the same clock: HyperFrames' `hf-seek` DOM event (any
  // driver can dispatch it: CDP, WebDriver, Playwright, a test) and a global
  // for `evaluate` calls — both plain web platform, every engine.
  directFromHyperframes()
  window.ditherClock = {
    seek: (seconds) => seek(Math.max(0, Number(seconds) || 0) * 1000),
    release,
    directed: isDirected,
    time: () => {
      const ms = directedTime()
      return ms === null ? null : ms / 1000
    },
  }

  const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
  const ready = (fonts?.ready ?? Promise.resolve()).then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
  window.__hf = window.__hf ?? {}
  window.__hf.buildReady = window.__hf.buildReady ?? {}
  window.__hf.buildReady["dither-ui"] = ready

  const stage = document.getElementById(STAGE_ID)
  if (!stage) throw new Error(`The player needs a #${STAGE_ID} element to mount in.`)
  return render(() => createComponent(PlayPage, { source }), stage)
}
