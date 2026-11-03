import type { Artboard } from "@/entities/artboard"

/**
 * Render an artboard's DOM node (canvases + SVG chrome + HTML legend) to a
 * PNG data URL, or null when it is not on the page or cannot be drawn. The
 * node is located by the data attribute the canvas Artboard component
 * stamps on its frame. The download and the agent's pictures both use it.
 */
export async function artboardPng(artboard: Artboard, scale = 2): Promise<string | null> {
  const node = document.querySelector<HTMLElement>(`[data-artboard-id="${artboard.id}"] [data-artboard-surface]`)
  if (!node) return null
  try {
    const { toPng } = await import("html-to-image")
    return await toPng(node, { pixelRatio: scale, width: artboard.w, height: artboard.h })
  } catch {
    return null
  }
}

/** Download an artboard as a PNG named after it. */
export async function exportArtboardPng(artboard: Artboard, scale = 2): Promise<boolean> {
  const url = await artboardPng(artboard, scale)
  if (!url) return false
  const a = document.createElement("a")
  a.href = url
  a.download = `${artboard.name.replace(/[^\w-]+/g, "-").toLowerCase() || "artboard"}.png`
  a.click()
  return true
}
