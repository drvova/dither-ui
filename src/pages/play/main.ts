// Entry of the player page — both the site's `/play/` route and the
// single-file bundle (`vite.player.config.ts` → dist/play/player.js) that an
// exported HyperFrames composition carries inline.
//
// HyperFrames' runtime dispatches `hf-seek` for every frame it captures and
// waits on `window.__hf.buildReady` before the first one. The hold here is
// fonts + Vue's mount flush + one macrotask, never an animation frame: the
// renderer drives Chrome with begin-frame control, so frames (and rAF) only
// happen when it captures one — a readiness promise that waited for a frame
// would wait forever. Every surface paints its moment synchronously on seek.
import { createApp, h, nextTick } from "vue"
import { directedTime, directFromHyperframes, isDirected, release, seek } from "@dither-kit"
import "@/app/styles.css"
import PlayPage from "./PlayPage.vue"
import { readPlaySource } from "./source"

declare global {
  interface Window {
    __hf?: { buildReady?: Record<string, Promise<unknown>> }
    /** The clock for any driver: `ditherClock.seek(seconds)` holds the frame at a moment. */
    ditherClock?: { seek: (seconds: number) => void; release: () => void; directed: () => boolean; time: () => number | null }
  }
}

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
const ready = (fonts?.ready ?? Promise.resolve())
  .then(() => nextTick())
  .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
window.__hf = window.__hf ?? {}
window.__hf.buildReady = window.__hf.buildReady ?? {}
window.__hf.buildReady["dither-ui"] = ready

createApp({ render: () => h(PlayPage, { source }) }).mount("#dither-stage")
