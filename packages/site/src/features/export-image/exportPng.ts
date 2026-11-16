import { type Artboard, artboardPng, fileBase } from "@/entities/artboard"

/** Download an artboard as a PNG named after it. */
export async function exportArtboardPng(artboard: Artboard, scale = 2): Promise<boolean> {
  const url = await artboardPng(artboard, scale)
  if (!url) return false
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileBase(artboard.name)}.png`
  a.click()
  return true
}
