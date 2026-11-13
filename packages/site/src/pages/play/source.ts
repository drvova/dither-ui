// Where the player's document comes from: the composition's embedded JSON
// first (an exported HyperFrames file), then the hash a live preview link
// carries (`/play/#doc=<base64url document>&artboard=<id>&theme=light`).
import { fromBase64Url } from "@/shared/lib"

export type PlaySource = { document: unknown; artboardId: string | null; theme: "dark" | "light" }

export function readPlaySource(): PlaySource {
  const stage = document.getElementById("dither-stage")
  const embedded = document.getElementById("dither-document")?.textContent
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""))
  let doc: unknown
  try {
    const encoded = hash.get("doc")
    doc = embedded ? JSON.parse(embedded) : encoded ? JSON.parse(fromBase64Url(encoded)) : null
  } catch {
    doc = null
  }
  const theme = (stage?.dataset.theme ?? hash.get("theme")) === "light" ? "light" : "dark"
  return { document: doc, artboardId: stage?.dataset.artboard || hash.get("artboard") || null, theme }
}
