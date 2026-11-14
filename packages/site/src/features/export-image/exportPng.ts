import type { Artboard } from "@/entities/artboard"
import { artboardPng } from "@/entities/artboard/picture"

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
