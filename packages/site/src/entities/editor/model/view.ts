// The canvas view: where the viewport looks and how near, steered over the
// stage the canvas measured. The canvas's bar and keys, its gestures and the
// agent's `view` command all move it through these, so a zoom reads the same
// from a key, a wheel or a harness.
import type { Artboard } from "@/entities/artboard"
import { MAX_ZOOM, MIN_ZOOM } from "./document"
import { centreOn, editor, selectedArtboard } from "./store"
import { clamp } from "@dither-ui/kit/engine/pixel.ts"

/** A zoom key's step: in multiplies, out divides. */
export const ZOOM_STEP = 1.2
/** What a fit keeps clear around the frames, in screen px. */
const FIT_PAD = 96
/** Room over a frame for its title label, in world px. */
const LABEL_ROOM = 28

/** Zoom to `next` about a point of the stage (its centre unless given), the
 * world under that point staying put. The viewport is read at each use,
 * never kept: the editor replaces it when a document loads or a project
 * switches. While the workbench inspects, the zoom holds at what it read. */
export function zoomTo(next: number, cx = editor.stage.w / 2, cy = editor.stage.h / 2): void {
  if (editor.inspecting) return
  const v = editor.viewport
  const z = clamp(next, MIN_ZOOM, MAX_ZOOM)
  const k = z / v.zoom
  v.x = cx - (cx - v.x) * k
  v.y = cy - (cy - v.y) * k
  v.zoom = z
}

export const zoomIn = () => zoomTo(editor.viewport.zoom * ZOOM_STEP)
export const zoomOut = () => zoomTo(editor.viewport.zoom / ZOOM_STEP)

/** 100%, the stage's centre kept on what it shows. */
export const actualSize = () => zoomTo(1)

/** Frame the given artboards on the stage, never past 100%; nothing to
 * frame is 100% at the origin. */
export function frame(boards: Pick<Artboard, "x" | "y" | "w" | "h">[]): void {
  if (editor.inspecting) return
  if (!boards.length) {
    editor.viewport = { x: FIT_PAD, y: FIT_PAD - 8, zoom: 1 }
    return
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const a of boards) {
    minX = Math.min(minX, a.x)
    minY = Math.min(minY, a.y - LABEL_ROOM)
    maxX = Math.max(maxX, a.x + a.w)
    maxY = Math.max(maxY, a.y + a.h)
  }
  const { w, h } = editor.stage
  const cw = maxX - minX || 1
  const ch = maxY - minY || 1
  const z = clamp(Math.min((w - FIT_PAD) / cw, (h - FIT_PAD) / ch), MIN_ZOOM, 1)
  editor.viewport = { x: (w - cw * z) / 2 - minX * z, y: (h - ch * z) / 2 - minY * z, zoom: z }
}

/** Every frame in view. */
export const fitAll = () => frame(editor.artboards)
/** The selection in view (everything when nothing is selected). */
export function fitSelection(): void {
  const sel = editor.artboards.filter((a) => editor.selectedIds.includes(a.id))
  frame(sel.length ? sel : editor.artboards)
}

/** The workbench over the canvas reads the frames' own px, so Inspect looks
 * at 100%, on the selection, and the zoom holds there until it ends. */
export function startInspecting(): void {
  actualSize()
  if (selectedArtboard.value) centreOn(selectedArtboard.value)
  editor.inspecting = true
}
export const stopInspecting = (): void => {
  editor.inspecting = false
}
