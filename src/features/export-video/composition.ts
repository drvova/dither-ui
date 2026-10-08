// A Studio frame as a HyperFrames composition (hyperframes.dev): one HTML
// file that `npx hyperframes render` turns into a deterministic MP4. The
// file is the player page with the frame's document embedded: the root
// carries the composition contract (`data-composition-id`, `data-width/
// height`, `data-duration`, `data-fps`), the player renders the frame with
// the Studio's own renderers, and the kit's clock takes the renderer's
// `hf-seek` events, so the frame's seeds and the requested time are the only
// inputs to every pixel. `data-no-timeline` tells the renderer not to wait for
// a GSAP timeline: the kit is the animation runtime here.
import type { Artboard } from "@/entities/artboard"

export type VideoOptions = { seconds: number; fps: 24 | 30 | 60; theme: "dark" | "light" }
export const DEFAULT_VIDEO: VideoOptions = { seconds: 6, fps: 30, theme: "dark" }

/** The player's two files: inline for a self-contained composition, or by
 * reference (relative to index.html) when the consumer writes a directory. */
export type PlayerAssets = { js: string; css: string } | { jsRef: string; cssRef: string }

export const slugOf = (name: string): string => name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "frame"

export function normalizeVideoOptions(o?: Partial<Record<keyof VideoOptions, unknown>> | null): VideoOptions {
  const s = Number(o?.seconds)
  return {
    seconds: Number.isFinite(s) && s > 0 ? Math.min(600, Math.max(1, Math.round(s * 100) / 100)) : DEFAULT_VIDEO.seconds,
    fps: o?.fps === 24 || o?.fps === 60 ? o.fps : 30,
    theme: o?.theme === "light" ? "light" : "dark",
  }
}

/** JSON safe inside a <script> block: no `<` can close it or open a comment. */
export const embedJson = (v: unknown): string => JSON.stringify(v).replace(/</g, "\\u003c")

const attr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
const text = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export function compositionHtml(artboard: Artboard, o: VideoOptions, assets: PlayerAssets): string {
  const slug = slugOf(artboard.name)
  const w = Math.max(1, Math.round(artboard.w))
  const h = Math.max(1, Math.round(artboard.h))
  const css = "js" in assets ? `<style>${assets.css}</style>` : `<link rel="stylesheet" href="${attr(assets.cssRef)}" />`
  // A bundle may spell `</script>` in a string; the escaped slash is the same
  // string to JavaScript and no longer a closing tag to the parser.
  const js = "js" in assets ? `<script>${assets.js.replace(/<\/script/gi, "<\\/script")}</script>` : `<script src="${attr(assets.jsRef)}"></script>`
  return `<!doctype html>
<html lang="en"${o.theme === "light" ? "" : ' class="dark"'}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=${w}, height=${h}" />
<title>${text(artboard.name)} — dither-ui</title>
<!--
  A HyperFrames composition exported by dither-ui Studio (https://dither-ui.com/studio).
  Render:  npx hyperframes render -c ${slug}.hyperframes.html -o ${slug}.mp4
  The frame's seeds and the renderer's time are the only inputs, so the same
  file renders the same pixels every time. Simulation backgrounds (particles,
  fluids) advance frame by frame: render those with --workers 1.
-->
${css}
<style>
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: var(--color-background); }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; }
#dither-stage { position: absolute; inset: 0; }
</style>
</head>
<body>
<div id="root" data-composition-id="dither-${slug}" data-start="0" data-width="${w}" data-height="${h}" data-duration="${o.seconds}" data-fps="${o.fps}" data-no-timeline>
  <div id="dither-stage" data-artboard="${attr(artboard.id)}" data-theme="${o.theme}"></div>
</div>
<script type="application/json" id="dither-document">${embedJson({ artboards: [artboard] })}</script>
${js}
</body>
</html>
`
}
