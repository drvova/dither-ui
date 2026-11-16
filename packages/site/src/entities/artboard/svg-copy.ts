// Frames as an SVG a design tool keeps editing (Figma, Illustrator, Sketch,
// Penpot): copied to the clipboard or saved as a file. The canvas bar and
// the export dialog both take it from here; the picture is `framesSvg`'s.
import { copyText } from "@dither-ui/kit/engine"
import { download } from "@/shared/lib/files"
import { fileBase } from "./model/name"
import type { Artboard } from "./model/types"
import { framesSvg } from "./vector"

/** How the SVG reached the clipboard: as an SVG picture with its text, as
 * its text alone (the browser refuses `image/svg+xml`; Figma, Penpot and
 * Illustrator read SVG text on paste all the same), or failed (a frame
 * not drawn, or a clipboard refused). */
export type SvgCopy = "svg" | "text" | "failed"
/** What the Studio says of each, where the copy was asked. */
export const SVG_COPY_SAID: Record<SvgCopy, string> = {
  svg: "Copied as SVG",
  text: "Copied as SVG text",
  failed: "Nothing copied: the frame is not drawn",
}

/** The file name of frames: a lone frame's name, else `selection`. */
export const svgFileOf = (frames: Artboard[]): string =>
  `${frames.length === 1 ? fileBase(frames[0].name) : "selection"}.svg`

/** Whether the async clipboard takes an SVG picture here, by its own word
 * (`ClipboardItem.supports`): Chromium does, from 124; Safari and Firefox
 * take text, HTML and PNG only. */
function takesSvg(): boolean {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false
  const supports = (ClipboardItem as unknown as { supports?: (type: string) => boolean }).supports
  return typeof supports === "function" && supports.call(ClipboardItem, "image/svg+xml")
}

/** Copy frames as SVG: `image/svg+xml` with `text/plain` where the browser
 * takes both, else the text alone. */
export async function copyFramesSvg(frames: Artboard[]): Promise<SvgCopy> {
  const svg = framesSvg(frames)
  return svg ? copySvg(svg) : "failed"
}

/** Copy an SVG file's text: `image/svg+xml` with `text/plain` where the
 * browser takes both, else the text alone (the docs previews' copy too). */
export async function copySvg(svg: string): Promise<SvgCopy> {
  if (takesSvg()) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/svg+xml": new Blob([svg], { type: "image/svg+xml" }),
          "text/plain": new Blob([svg], { type: "text/plain" }),
        }),
      ])
      return "svg"
    } catch {
      // refused (the page without focus, a permission): the text below
    }
  }
  return (await copyText(svg)) ? "text" : "failed"
}

/** Save frames as an SVG file named after them; false when one is not drawn. */
export function saveFramesSvg(frames: Artboard[]): boolean {
  const svg = framesSvg(frames)
  if (!svg) return false
  saveSvg(svg, svgFileOf(frames))
  return true
}

/** Save an SVG file's text under a name. */
export const saveSvg = (svg: string, name: string): void => download(new Blob([svg], { type: "image/svg+xml" }), name)
