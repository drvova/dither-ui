// The workbench's pointer (`../bench.ts`): what a press, a drag and a
// release do with each tool (pin, sample, guides placed and dragged off,
// select and transform, arrows docked to the preview's boxes, ink, the
// eraser, notes, comments, a capture's region), a guide pulled out of a
// ruler, the loupe's wheel and the pointer leaving.
import { boxFrom, dock, edgesOf, intersects, snap, type Box, type Point } from "@/shared/lib/inspect/geometry"
import { boxOf, labelOf } from "@/shared/lib/inspect/measure"
import { erase } from "@/widgets/workbench/model/ink"
import { swatch } from "@/widgets/workbench/model/settings"
import { uid, type Item } from "@/widgets/workbench/model/workspace"
import { clone, HOVER_TOOLS, ownKeys, type State } from "@/widgets/workbench/model/state"
import type { Selection } from "@/widgets/workbench/model/selection"
import type { Notes } from "@/widgets/workbench/model/notes"
import type { Pixels } from "@/widgets/workbench/model/pixels"
import type { Recorder } from "@/widgets/workbench/model/recorder"

type GestureDeps = Pick<
  Selection,
  | "guideNear"
  | "boundsOfItem"
  | "itemAt"
  | "isSelected"
  | "selectionBox"
  | "handleAt"
  | "scaleTo"
  | "rotateTo"
  | "translate"
> &
  Pick<Notes, "addNote" | "startThread"> &
  Pick<Pixels, "pixelAt" | "addSample"> &
  Pick<Recorder, "shoot" | "record">

export function createGestures(s: State, deps: GestureDeps) {
  const {
    o,
    me,
    settings,
    overlay,
    tool,
    say,
    ws,
    history,
    change,
    settle,
    size,
    setPointer,
    setHovered,
    setPinned,
    guideAxis,
    setGuideHover,
    setHandleHover,
    draft,
    setDraft,
    selection,
    setSelection,
    editing,
    setEditing,
    capture,
    busy,
    loupeZoom,
    setLoupeZoom,
    toStage,
    elementAt,
  } = s
  const {
    guideNear,
    boundsOfItem,
    itemAt,
    isSelected,
    selectionBox,
    handleAt,
    scaleTo,
    rotateTo,
    translate,
    addNote,
    startThread,
    pixelAt,
    addSample,
    shoot,
    record,
  } = deps

  // --- element boxes for snapping and docking ---------------------------------

  function elementBoxes(): Box[] {
    const ov = overlay()
    if (!ov) return []
    return [...o.content.querySelectorAll("*")]
      .slice(0, 600)
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => boxOf(el, ov))
  }

  function snapGuide(v: number, axis: "x" | "y", skip?: string): number {
    if (!settings.snap) return v
    const boxes = elementBoxes()
    const lines = boxes.flatMap((b) => (axis === "x" ? edgesOf(b).xs : edgesOf(b).ys))
    const guides = ws()
      .guides.filter((g) => g.axis === axis && g.id !== skip)
      .map((g) => g.at)
    return snap(v, [...lines, ...guides, 0, axis === "x" ? size().w : size().h], 5).value
  }

  let dockBoxes: Box[] = []
  function dockAt(p: Point): Point {
    return settings.snap ? (dock(p, dockBoxes, 8) ?? p) : p
  }

  // --- pointer -----------------------------------------------------------------

  function down(e: PointerEvent) {
    if (e.button !== 0 || !overlay()) return
    ownKeys(me)
    const p = toStage(e)
    const t = tool()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    e.preventDefault()
    switch (t) {
      case "inspect":
      case "xray":
      case "type":
      case "a11y": {
        const hit = elementAt(e.clientX, e.clientY)
        setPinned(hit)
        if (hit) say(`Pinned ${labelOf(hit)}`)
        o.host.focus({ preventScroll: true })
        break
      }
      case "color":
      case "loupe": {
        const c = pixelAt(p)
        if (c) void addSample(c)
        break
      }
      case "guides": {
        const before = JSON.stringify(ws())
        history.record(ws())
        const hit = guideNear(p)
        if (hit) setDraft({ kind: "guide", id: hit.id, before })
        else {
          const id = uid("g")
          const axis = guideAxis()
          const at = snapGuide(axis === "x" ? p.x : p.y, axis)
          change((d) => d.guides.push({ id, axis, at }), false)
          setDraft({ kind: "guide", id, before })
        }
        break
      }
      case "select": {
        const handle = handleAt(p)
        if (handle) {
          const box = selectionBox()!
          const before = JSON.stringify(ws())
          history.record(ws())
          const origin = clone(ws())
          const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
          setDraft(
            handle === "rotate"
              ? { kind: "rotate", center, from: Math.atan2(p.y - center.y, p.x - center.x), origin, before }
              : { kind: "scale", handle, box, origin, before },
          )
          break
        }
        const hit = itemAt(p)
        if (hit) {
          if (!isSelected(hit)) setSelection(e.shiftKey ? [...selection(), hit] : [hit])
          const before = JSON.stringify(ws())
          history.record(ws())
          setDraft({ kind: "move", last: p, before })
        } else setDraft({ kind: "marquee", from: p, to: p, base: e.shiftKey ? selection() : [] })
        break
      }
      case "arrow":
        dockBoxes = elementBoxes()
        setDraft({ kind: "arrow", from: dockAt(p), to: p })
        break
      case "pen": {
        const q = toStage(e, true)
        setDraft({ kind: "stroke", points: [[q.x, q.y, e.timeStamp, e.pointerType === "pen" ? e.pressure : -1]] })
        break
      }
      case "eraser": {
        const before = JSON.stringify(ws())
        history.record(ws())
        setDraft({ kind: "erase", before })
        eraseAt(p)
        break
      }
      case "text":
        if (!editing()) addNote(p)
        break
      case "comment":
        startThread(e, p)
        break
      case "shot":
      case "video":
        if (capture()?.kind === "recording" || busy()) break
        setDraft({ kind: "region", from: p, to: p, for: t })
        break
    }
  }

  function eraseAt(p: Point) {
    const radius = Math.max(8, settings.inkWidth * 2)
    const hit = ws().strokes.some((s) => s.points.some(([x, y]) => Math.hypot(x - p.x, y - p.y) <= radius))
    if (!hit) return
    change((d) => {
      d.strokes = d.strokes.flatMap((s) => {
        const runs = erase(s.points, p, radius)
        if (runs.length === 1 && runs[0].length === s.points.length) return [s]
        return runs.map((points, i) => ({ ...s, id: i ? uid("s") : s.id, points }))
      })
    }, false)
  }

  const clampStage = (p: Point): Point => ({
    x: Math.min(size().w, Math.max(0, p.x)),
    y: Math.min(size().h, Math.max(0, p.y)),
  })

  function move(e: PointerEvent) {
    if (!overlay()) return
    const p = toStage(e)
    setPointer(p)
    s.client = { x: e.clientX, y: e.clientY }
    const d = draft()
    const t = tool()
    if (!d) {
      if (HOVER_TOOLS.has(t)) setHovered(elementAt(e.clientX, e.clientY))
      if (t === "guides") setGuideHover(guideNear(p) ? null : snapGuide(guideAxis() === "x" ? p.x : p.y, guideAxis()))
      if (t === "select") setHandleHover(selection().length ? handleAt(p) : null)
      return
    }
    switch (d.kind) {
      case "arrow":
        setDraft({ ...d, to: dockAt(p) })
        break
      case "stroke": {
        const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : []
        const points = [...d.points]
        for (const ev of events.length ? events : [e]) {
          const q = toStage(ev, true)
          points.push([q.x, q.y, ev.timeStamp, ev.pointerType === "pen" ? ev.pressure : -1])
        }
        setDraft({ ...d, points })
        break
      }
      case "region":
        setDraft({ ...d, to: clampStage(p) })
        break
      case "marquee": {
        setDraft({ ...d, to: p })
        const r = boxFrom(d.from, p)
        const all: Item[] = [
          ...ws().arrows.map((x) => ({ kind: "arrows" as const, id: x.id })),
          ...ws().strokes.map((x) => ({ kind: "strokes" as const, id: x.id })),
          ...ws().notes.map((x) => ({ kind: "notes" as const, id: x.id })),
          ...ws().measures.map((x) => ({ kind: "measures" as const, id: x.id })),
        ]
        const hit = all.filter((item) => {
          const b = boundsOfItem(item)
          return b && intersects(b, r)
        })
        setSelection([...d.base, ...hit.filter((h) => !d.base.some((s) => s.kind === h.kind && s.id === h.id))])
        break
      }
      case "guide": {
        const g = ws().guides.find((x) => x.id === d.id)
        if (g) {
          const at = snapGuide(g.axis === "x" ? p.x : p.y, g.axis, g.id)
          change((w) => (w.guides.find((x) => x.id === d.id)!.at = at), false)
        }
        break
      }
      case "move": {
        const dx = p.x - d.last.x
        const dy = p.y - d.last.y
        if (dx || dy) {
          const items = selection()
          change((w) => translate(w, items, dx, dy), false)
          setDraft({ ...d, last: p })
        }
        break
      }
      case "erase":
        eraseAt(p)
        break
      case "scale":
        scaleTo(d, p, e.shiftKey)
        break
      case "rotate":
        rotateTo(d, p, e.shiftKey)
        break
    }
  }

  function up(e: PointerEvent) {
    const d = draft()
    setDraft(null)
    if (!d || !overlay()) return
    const p = toStage(e)
    switch (d.kind) {
      case "arrow":
        if (Math.hypot(d.to.x - d.from.x, d.to.y - d.from.y) > 4)
          change((w) =>
            w.arrows.push({ id: uid("a"), from: d.from, to: d.to, color: swatch(settings.annotate), width: 2 }),
          )
        break
      case "stroke": {
        const marker = settings.pen === "marker"
        change((w) =>
          w.strokes.push({
            id: uid("s"),
            kind: settings.pen,
            color: swatch(marker ? settings.markerSwatch : settings.inkSwatch),
            width: marker ? settings.markerWidth : settings.inkWidth,
            points: d.points.map(([x, y, t, pr]) => [
              Math.round(x * 10) / 10,
              Math.round(y * 10) / 10,
              Math.round(t),
              pr,
            ]),
          }),
        )
        break
      }
      case "region": {
        const r = boxFrom(d.from, d.to)
        const region = r.w < 4 || r.h < 4 ? { x: 0, y: 0, w: size().w, h: size().h } : r
        void (d.for === "shot" ? shoot(region) : record(region))
        break
      }
      case "guide": {
        const out = p.x < -8 || p.y < -8 || p.x > size().w + 8 || p.y > size().h + 8
        if (out) {
          change((w) => (w.guides = w.guides.filter((g) => g.id !== d.id)), false)
          say("Guide removed")
        }
        settle(d.before)
        break
      }
      case "move":
      case "erase":
      case "scale":
      case "rotate":
        settle(d.before)
        break
    }
  }

  /** Double-click a note (any annotate tool, or Select) to write in it again. */
  function editAt(e: MouseEvent) {
    if (!overlay()) return
    const hit = itemAt(toStage(e))
    if (hit?.kind === "notes") setEditing(hit.id)
  }

  /** The loupe zooms with the wheel (2–32 px per pixel). */
  function wheel(e: WheelEvent) {
    if (tool() !== "loupe" && tool() !== "color") return
    e.preventDefault()
    setLoupeZoom(Math.min(32, Math.max(2, Math.round(loupeZoom() * (e.deltaY < 0 ? 1.25 : 0.8)))))
  }

  function leave() {
    if (!draft()) setHovered(null)
    setPointer(null)
    setGuideHover(null)
  }

  /** A guide pulled out of a ruler: the top ruler gives a horizontal
   * guide, the left one a vertical guide; dropped back off the stage, it
   * goes. */
  function pullGuide(e: PointerEvent, axis: "x" | "y") {
    if (e.button !== 0 || !overlay()) return
    e.preventDefault()
    const before = JSON.stringify(ws())
    history.record(ws())
    const id = uid("g")
    const p = toStage(e)
    change((w) => w.guides.push({ id, axis, at: axis === "x" ? p.x : p.y }), false)
    const onMove = (ev: PointerEvent) => {
      const q = toStage(ev)
      const at = snapGuide(axis === "x" ? q.x : q.y, axis, id)
      change((w) => (w.guides.find((g) => g.id === id)!.at = at), false)
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      const q = toStage(ev)
      const at = axis === "x" ? q.x : q.y
      if (at < 0 || at > (axis === "x" ? size().w : size().h))
        change((w) => (w.guides = w.guides.filter((g) => g.id !== id)), false)
      settle(before)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  return { down, move, up, editAt, wheel, leave, pullGuide }
}

export type Gestures = ReturnType<typeof createGestures>
