// The Vue site's `src/features/agent/inspect.ts`, line for line, its imports of ported
// modules pointed at their Solid twins (it reaches the editor store through
// them, so it cannot be shared). Held to its source by `tests/site/state.spec.tsx`.
// The workbench's Inspect for a harness: what a frame on the canvas reads
// as, from the live DOM: its controls in Tab order (role, name, states and
// box) and what the accessibility floor finds (names, 24px targets,
// contrast, alt, tabindex). Boxes are the frame's own CSS px, whatever the
// canvas's zoom.
import type { Artboard } from "@/entities/artboard"
import { editor } from "../../entities/editor"
import { surfaceOf } from "@/features/export-image"
import { audit, boxOf, focusOrder, nameOf, roleOf, statesOf } from "@/shared/lib/inspect/measure"

/** At most this many controls come back, so a busy screen stays a short answer. */
export const INSPECT_CONTROLS = 60

export function inspectFrame(a: Artboard) {
  const surface = surfaceOf(a.id)
  if (!surface) return null
  const scale = editor.viewport.zoom || 1
  const order = focusOrder(surface)
  const issues = audit(surface, surface, scale)
  return {
    id: a.id,
    name: a.name,
    w: a.w,
    h: a.h,
    controls: order.slice(0, INSPECT_CONTROLS).map((el) => ({
      role: roleOf(el),
      name: nameOf(el),
      states: statesOf(el),
      box: boxOf(el, surface, scale),
    })),
    more: Math.max(0, order.length - INSPECT_CONTROLS),
    issues: issues.map(({ kind, note, box }) => ({ kind, note, box })),
    passes: issues.length === 0,
  }
}
