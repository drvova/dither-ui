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
import { directFromHyperframes } from "@dither-kit"
import "@/app/styles.css"
import PlayPage from "./PlayPage.vue"
import { readPlaySource } from "./source"

declare global {
  interface Window {
    __hf?: { buildReady?: Record<string, Promise<unknown>> }
  }
}

const source = readPlaySource()
document.documentElement.classList.toggle("dark", source.theme !== "light")
directFromHyperframes()

const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
const ready = (fonts?.ready ?? Promise.resolve())
  .then(() => nextTick())
  .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
window.__hf = window.__hf ?? {}
window.__hf.buildReady = window.__hf.buildReady ?? {}
window.__hf.buildReady["dither-ui"] = ready

createApp({ render: () => h(PlayPage, { source }) }).mount("#dither-stage")
