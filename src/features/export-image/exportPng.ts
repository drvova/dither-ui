import type { Artboard } from "@/entities/artboard"

/** A frame's drawn surface on the canvas (what a picture or a reading
 * takes), or null when it is not on the page. */
export function surfaceOf(id: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-artboard-id]"))
    if (el.dataset.artboardId === id) return el.querySelector<HTMLElement>("[data-artboard-surface]")
  return null
}

/**
 * Render an artboard's DOM node (canvases + SVG chrome + HTML legend) to a
 * PNG data URL, or null when it is not on the page or cannot be drawn. The
 * download, the agent's pictures and its PNG export all use it.
 */
export async function artboardPng(artboard: Artboard, scale = 2): Promise<string | null> {
  const node = surfaceOf(artboard.id)
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
