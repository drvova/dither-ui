// A frame's video: the frames a reel carries, its length and score, the
// player's files, the self-contained composition and its download, and the
// live preview link. The video dialog and the agent's `video.export` and
// `export_video` all read it.
import type { Artboard } from "@/entities/artboard"
import { editor } from "@/entities/editor"
import { reelDuration, scorePlanOf } from "@/entities/widget"
import { scoreCut, wavBytes } from "@dither-ui/kit"
import { bytesToBase64, toBase64Url } from "@/shared/lib/base64"
import { assetPath, routePath } from "@/shared/lib/routes"
import { download } from "@/shared/lib/files"
import { compositionHtml, DEFAULT_VIDEO, slugOf, type VideoOptions } from "./composition"

export const videoFileName = (a: Artboard): string => `${slugOf(a.name)}.hyperframes.html`
export const renderCommand = (a: Artboard): string =>
  `npx hyperframes render -c ${videoFileName(a)} -o ${slugOf(a.name)}.mp4`

/** The frames a reel cuts between (none for any other frame), each once. */
export function reelClips(a: Artboard): Artboard[] {
  if (a.widget?.kind !== "reel") return []
  const seen = new Set<string>([a.id])
  const out: Artboard[] = []
  for (const clip of a.widget.clips) {
    const frame = editor.artboards.find((x) => x.id === clip.id)
    if (frame && !seen.has(frame.id) && frame.widget?.kind !== "reel") {
      seen.add(frame.id)
      out.push(frame)
    }
  }
  return out
}

/** A reel's natural length; the house default for any other frame. */
export const defaultSeconds = (a: Artboard): number =>
  a.widget?.kind === "reel"
    ? Math.min(600, Math.max(1, Math.round(reelDuration(a.widget.clips) * 100) / 100))
    : DEFAULT_VIDEO.seconds

/** The player route with the frame in the hash — animations free-run there. */
export function playerUrl(a: Artboard, theme: VideoOptions["theme"]): string {
  return `${location.origin}${routePath("/play/")}#doc=${toBase64Url(JSON.stringify({ artboards: [a, ...reelClips(a)] }))}&artboard=${encodeURIComponent(a.id)}&theme=${theme}`
}

/** The player's public files, as a composition that writes a directory
 * references them. Absolute, so any consumer can fetch them. */
export const playerAssetUrls = (): { path: string; url: string }[] =>
  ["player.js", "player.css"].map((path) => ({ path, url: `${location.origin}${assetPath(`play/${path}`)}` }))

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url)
  // A dev or preview server answers unknown paths with the app shell.
  if (!r.ok || /text\/html/.test(r.headers.get("content-type") ?? "")) {
    throw new Error(
      `The player bundle is missing at ${url}. Run npm run build (it ends with the player), or export from dither-ui.com.`,
    )
  }
  return r.text()
}

let assets: Promise<{ js: string; css: string }> | null = null
/** The built player (play/player.js + player.css), fetched once. */
function playerAssets(): Promise<{ js: string; css: string }> {
  assets ??= Promise.all(playerAssetUrls().map((a) => fetchText(a.url))).then(([js, css]) => ({ js, css }))
  assets.catch(() => (assets = null))
  return assets
}

/** A reel's score for a video `seconds` long, as a WAV (null without one):
 * the kit's synthesis of the cut, so every export of the reel sounds the same. */
export function scoreWav(a: Artboard, seconds: number): Uint8Array | null {
  if (a.widget?.kind !== "reel" || !a.widget.score) return null
  return wavBytes(scoreCut(scorePlanOf(a.widget, seconds)), a.widget.score.seed)
}

/** One self-contained file: the player inline, the score as a data URI, no
 * network at render time. */
export async function selfContainedComposition(a: Artboard, o: VideoOptions): Promise<string> {
  const wav = scoreWav(a, o.seconds)
  return compositionHtml(
    a,
    o,
    await playerAssets(),
    reelClips(a),
    wav ? `data:audio/wav;base64,${bytesToBase64(wav)}` : undefined,
  )
}

export async function downloadComposition(a: Artboard, o: VideoOptions): Promise<string> {
  download(new Blob([await selfContainedComposition(a, o)], { type: "text/html" }), videoFileName(a))
  return videoFileName(a)
}
