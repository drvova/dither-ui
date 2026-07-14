import { toPng } from "html-to-image"
import type { Artboard } from "@/entities/artboard"

/**
 * Render an artboard's DOM node (canvases + SVG chrome + HTML legend) to a
 * PNG and download it. The node is located by the data attribute the canvas
 * Artboard component stamps on its frame.
 */
export async function exportArtboardPng(
  artboard: Artboard,
  scale = 2
): Promise<boolean> {
  const node = document.querySelector<HTMLElement>(
    `[data-artboard-id="${artboard.id}"] [data-artboard-surface]`
  )
  if (!node) return false
  try {
    const url = await toPng(node, {
      pixelRatio: scale,
      width: artboard.w,
      height: artboard.h,
    })
    const a = document.createElement("a")
    a.href = url
    a.download = `${artboard.name.replace(/[^\w-]+/g, "-").toLowerCase() || "artboard"}.png`
    a.click()
    return true
  } catch {
    return false
  }
}
