// A frame as drawn on the canvas: its surface (what a picture or a reading
// takes) and that surface as a PNG. The download, the agent's pictures and
// its PNG export and inspection all read the frame through here.
import type { Artboard } from "./model/types"

/** A frame's drawn surface on the canvas, or null when it is not on the page. */
export function surfaceOf(id: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-artboard-id]"))
    if (el.dataset.artboardId === id) return el.querySelector<HTMLElement>("[data-artboard-surface]")
  return null
}

/**
 * Render an artboard's DOM node (canvases + SVG chrome + HTML legend) to a
 * PNG data URL, or null when it is not on the page or cannot be drawn.
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
