// The workbench's selection (`../bench.ts`): what an annotation's box is,
// what lies under a point, the selection box and its handles, and the
// moves, scales and rotations that map the gesture's origin snapshot.
import { boxOf } from "@/shared/lib/inspect/measure"
import { distances, type Box, type Point } from "@/shared/lib/inspect/geometry"
import { boundsOf, hitLine, toSegment } from "@/widgets/workbench/model/ink"
import type { Item, Workspace } from "@/widgets/workbench/model/workspace"
import type { Draft, Handle, State } from "@/widgets/workbench/model/state"

export function createSelection(s: State) {
  const { overlay, say, ws, change, size, selection, setSelection } = s

  function guideNear(p: Point) {
    return ws().guides.find((g) => Math.abs((g.axis === "x" ? p.x : p.y) - g.at) <= 4) ?? null
  }

  // --- selection --------------------------------------------------------------

  function noteBox(id: string): Box | null {
    const ov = overlay()
    const el = ov?.querySelector(`[data-note="${id}"]`)
    return el && ov ? boxOf(el, ov) : null
  }

  function boundsOfItem(item: Item): Box | null {
    const w = ws()
    switch (item.kind) {
      case "arrows": {
        const a = w.arrows.find((x) => x.id === item.id)
        return a ? boundsOf([a.from, a.to], a.width + 3) : null
      }
      case "strokes": {
        const s = w.strokes.find((x) => x.id === item.id)
        return s
          ? boundsOf(
              s.points.map(([x, y]) => ({ x, y })),
              s.width / 2 + 2,
            )
          : null
      }
      case "notes":
        return noteBox(item.id)
      case "guides": {
        const g = w.guides.find((x) => x.id === item.id)
        if (!g) return null
        return g.axis === "x" ? { x: g.at - 2, y: 0, w: 4, h: size().h } : { x: 0, y: g.at - 2, w: size().w, h: 4 }
      }
      case "measures": {
        const m = w.measures.find((x) => x.id === item.id)
        if (!m) return null
        const pts = distances(m.from.box, m.to.box).flatMap((s) => [
          { x: s.x1, y: s.y1 },
          { x: s.x2, y: s.y2 },
        ])
        return pts.length ? boundsOf(pts, 4) : null
      }
    }
  }

  function itemAt(p: Point): Item | null {
    const w = ws()
    for (const n of [...w.notes].reverse()) {
      const b = noteBox(n.id)
      if (b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { kind: "notes", id: n.id }
    }
    for (const a of [...w.arrows].reverse())
      if (toSegment(p, a.from, a.to) <= a.width + 4) return { kind: "arrows", id: a.id }
    for (const s of [...w.strokes].reverse())
      if (
        hitLine(
          s.points.map(([x, y]) => ({ x, y })),
          p,
          s.width / 2 + 4,
        )
      )
        return { kind: "strokes", id: s.id }
    for (const m of [...w.measures].reverse()) {
      const b = boundsOfItem({ kind: "measures", id: m.id })
      if (b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { kind: "measures", id: m.id }
    }
    const g = guideNear(p)
    return g ? { kind: "guides", id: g.id } : null
  }

  const isSelected = (item: Item) => selection().some((s) => s.kind === item.kind && s.id === item.id)

  /** What a transform moves: arrows, strokes and notes (guides only move,
   * measurements are where they were measured). */
  const transformable = () =>
    selection().filter((s) => s.kind === "arrows" || s.kind === "strokes" || s.kind === "notes")

  /** The box around the transformable selection, or null. */
  function selectionBox(): Box | null {
    const boxes = transformable()
      .map((item) => boundsOfItem(item))
      .filter((b): b is Box => !!b)
    if (!boxes.length) return null
    const x = Math.min(...boxes.map((b) => b.x))
    const y = Math.min(...boxes.map((b) => b.y))
    return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y }
  }

  function handleAt(p: Point): Handle | null {
    const b = selectionBox()
    if (!b) return null
    const near = (x: number, y: number) => Math.hypot(p.x - x, p.y - y) <= 7
    if (near(b.x + b.w / 2, b.y - 20)) return "rotate"
    if (near(b.x, b.y)) return "nw"
    if (near(b.x + b.w, b.y)) return "ne"
    if (near(b.x, b.y + b.h)) return "sw"
    if (near(b.x + b.w, b.y + b.h)) return "se"
    return null
  }

  /** Map every point of the selected items in `origin` through `f` (and
   * scale note text by `k`) into `d`. */
  function remap(d: Workspace, origin: Workspace, map: (p: Point) => Point, k = 1) {
    const r1 = (v: number) => Math.round(v * 10) / 10
    const f = (p: Point) => {
      const q = map(p)
      return { x: r1(q.x), y: r1(q.y) }
    }
    const items = transformable()
    const has = (kind: Item["kind"], id: string) => items.some((s) => s.kind === kind && s.id === id)
    for (const a of d.arrows) {
      const o0 = origin.arrows.find((x) => x.id === a.id)
      if (o0 && has("arrows", a.id)) {
        a.from = f(o0.from)
        a.to = f(o0.to)
      }
    }
    for (const st of d.strokes) {
      const o0 = origin.strokes.find((x) => x.id === st.id)
      if (o0 && has("strokes", st.id))
        st.points = o0.points.map(([x, y, t, pr]) => {
          const q = f({ x, y })
          return [q.x, q.y, t, pr]
        })
    }
    for (const n of d.notes) {
      const o0 = origin.notes.find((x) => x.id === n.id)
      if (o0 && has("notes", n.id)) {
        n.at = f(o0.at)
        n.size = Math.min(48, Math.max(9, Math.round(o0.size * k)))
      }
    }
  }

  function scaleTo(d: Extract<Draft, { kind: "scale" }>, p: Point, uniform: boolean) {
    const b = d.box
    const ax = d.handle === "nw" || d.handle === "sw" ? b.x + b.w : b.x
    const ay = d.handle === "nw" || d.handle === "ne" ? b.y + b.h : b.y
    const hx = ax === b.x ? b.x + b.w : b.x
    const hy = ay === b.y ? b.y + b.h : b.y
    let sx = (p.x - ax) / (hx - ax || 1)
    let sy = (p.y - ay) / (hy - ay || 1)
    if (uniform) sx = sy = Math.max(Math.abs(sx), Math.abs(sy)) * Math.sign(sx || 1)
    change(
      (w) =>
        remap(
          w,
          d.origin,
          (q) => ({ x: ax + (q.x - ax) * sx, y: ay + (q.y - ay) * sy }),
          Math.max(Math.abs(sx), Math.abs(sy)),
        ),
      false,
    )
  }

  function rotateTo(d: Extract<Draft, { kind: "rotate" }>, p: Point, snapped: boolean) {
    let a = Math.atan2(p.y - d.center.y, p.x - d.center.x) - d.from
    if (snapped) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12)
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const { x: cx, y: cy } = d.center
    change(
      (w) =>
        remap(w, d.origin, (q) => ({
          x: cx + (q.x - cx) * cos - (q.y - cy) * sin,
          y: cy + (q.x - cx) * sin + (q.y - cy) * cos,
        })),
      false,
    )
  }

  function translate(d: Workspace, items: Item[], dx: number, dy: number) {
    const has = (kind: Item["kind"], id: string) => items.some((s) => s.kind === kind && s.id === id)
    for (const a of d.arrows)
      if (has("arrows", a.id)) {
        a.from = { x: a.from.x + dx, y: a.from.y + dy }
        a.to = { x: a.to.x + dx, y: a.to.y + dy }
      }
    for (const s of d.strokes)
      if (has("strokes", s.id)) s.points = s.points.map(([x, y, t, p]) => [x + dx, y + dy, t, p])
    for (const n of d.notes) if (has("notes", n.id)) n.at = { x: n.at.x + dx, y: n.at.y + dy }
    for (const g of d.guides) if (has("guides", g.id)) g.at += g.axis === "x" ? dx : dy
  }

  function removeSelection(): boolean {
    const items = selection()
    if (!items.length) return false
    change((d) => {
      const keep = (kind: Item["kind"]) => (x: { id: string }) => !items.some((s) => s.kind === kind && s.id === x.id)
      d.arrows = d.arrows.filter(keep("arrows"))
      d.strokes = d.strokes.filter(keep("strokes"))
      d.notes = d.notes.filter(keep("notes"))
      d.guides = d.guides.filter(keep("guides"))
      d.measures = d.measures.filter(keep("measures"))
    })
    say(`Deleted ${items.length} annotation${items.length === 1 ? "" : "s"}`)
    setSelection([])
    return true
  }

  function selectAll() {
    const w = ws()
    setSelection([
      ...w.arrows.map((x) => ({ kind: "arrows" as const, id: x.id })),
      ...w.strokes.map((x) => ({ kind: "strokes" as const, id: x.id })),
      ...w.notes.map((x) => ({ kind: "notes" as const, id: x.id })),
      ...w.guides.map((x) => ({ kind: "guides" as const, id: x.id })),
      ...w.measures.map((x) => ({ kind: "measures" as const, id: x.id })),
    ])
    say(`${selection().length} selected`)
  }

  return {
    guideNear,
    boundsOfItem,
    itemAt,
    isSelected,
    selectionBox,
    handleAt,
    scaleTo,
    rotateTo,
    translate,
    removeSelection,
    selectAll,
  }
}

export type Selection = ReturnType<typeof createSelection>
