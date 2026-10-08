// Delivering a composition: the Studio's own download, the live preview link,
// and the two agent paths (a browser download for the in-page loop, files for
// the bridge to write under the harness's project).
import type { Artboard } from "@/entities/artboard"
import { editor } from "@/entities/editor"
import { assetPath, routePath, toBase64Url } from "@/shared/lib"
import { compositionHtml, normalizeVideoOptions, slugOf, type VideoOptions } from "./composition"

export const videoFileName = (a: Artboard): string => `${slugOf(a.name)}.hyperframes.html`
export const renderCommand = (a: Artboard): string => `npx hyperframes render -c ${videoFileName(a)} -o ${slugOf(a.name)}.mp4`

/** The player route with the frame in the hash — animations free-run there. */
export function playerUrl(a: Artboard, theme: VideoOptions["theme"]): string {
  return `${location.origin}${routePath("/play/")}#doc=${toBase64Url(JSON.stringify({ artboards: [a] }))}&artboard=${encodeURIComponent(a.id)}&theme=${theme}`
}

/** The player's public files, as a composition that writes a directory
 * references them. Absolute, so any consumer can fetch them. */
export const playerAssetUrls = (): { path: string; url: string }[] =>
  ["player.js", "player.css"].map((path) => ({ path, url: `${location.origin}${assetPath(`play/${path}`)}` }))

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url)
  // A dev or preview server answers unknown paths with the app shell.
  if (!r.ok || /text\/html/.test(r.headers.get("content-type") ?? "")) {
    throw new Error(`player bundle missing at ${url} — run npm run build (it ends with the player), or export from dither-ui.com`)
  }
  return r.text()
}

let assets: Promise<{ js: string; css: string }> | null = null
/** The built player (dist/play/player.js + player.css), fetched once. */
export function playerAssets(): Promise<{ js: string; css: string }> {
  assets ??= Promise.all(playerAssetUrls().map((a) => fetchText(a.url))).then(([js, css]) => ({ js, css }))
  assets.catch(() => (assets = null))
  return assets
}

/** One self-contained file: the player inline, no network at render time. */
export async function selfContainedComposition(a: Artboard, o: VideoOptions): Promise<string> {
  return compositionHtml(a, o, await playerAssets())
}

export async function downloadComposition(a: Artboard, o: VideoOptions): Promise<string> {
  const html = await selfContainedComposition(a, o)
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
  const link = document.createElement("a")
  link.href = url
  link.download = videoFileName(a)
  link.click()
  URL.revokeObjectURL(url)
  return videoFileName(a)
}

/** The `video.export` protocol result's data. */
export type VideoExportData = { id: string; name: string; file: string; options: VideoOptions; index: string; assets: { path: string; url: string }[]; render: string }

/** Finish an `export_video` tool call. "download": the browser saves the
 * self-contained file for the user (the in-page loop). "files": the
 * composition rides the result to the bridge, which writes it under the
 * harness's project so the agent can render it there. */
export async function deliverVideo(
  data: VideoExportData,
  mode: "download" | "files",
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const a = editor.artboards.find((x) => x.id === data.id)
  if (!a) return { ok: false, error: `no frame ${data.id}` }
  const o = normalizeVideoOptions(data.options)
  try {
    if (mode === "download") {
      const file = await downloadComposition(a, o)
      return { ok: true, data: { downloaded: file, render: renderCommand(a), note: "The browser saved the composition to the user's downloads; the user renders it with the HyperFrames CLI (Node 22 + FFmpeg)." } }
    }
    const slug = slugOf(a.name)
    const html = await selfContainedComposition(a, o)
    return { ok: true, data: { files: [{ path: `video/${slug}/index.html`, content: html }], render: `npx hyperframes render video/${slug} -o ${slug}.mp4`, note: "Written under the project by the bridge; render it with the HyperFrames CLI (Node 22 + FFmpeg). Simulation backgrounds need --workers 1." } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
