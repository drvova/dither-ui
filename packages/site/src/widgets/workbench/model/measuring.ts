// The workbench's measuring loop (`../bench.ts`): every frame it reads what
// the tool in hand points at (the box and its CSS, the type, the
// accessibility reading, a comment's aim, Alt's distances, the threads'
// pins), every 300 ms X-ray and the audit, and writes a signal only when the
// reading changed.
import {
  audit,
  boxOf,
  controlOf,
  focusOrder,
  interactive,
  labelOf,
  nameOf,
  readingOf,
  resolvePath,
  roleOf,
  statesOf,
  textHolder,
  typeOf,
} from "@/shared/lib/inspect/measure"
import { distances, type Point } from "@/shared/lib/inspect/geometry"
import { same, TARGET_TOOLS, type A11yReading, type State, type XrayBox } from "@/widgets/workbench/model/state"

export function createMeasuring(s: State) {
  const {
    o,
    overlay,
    tool,
    ws,
    size,
    setSize,
    hovered,
    pinned,
    setPinned,
    reading,
    setReading,
    ghost,
    setGhost,
    typeReading,
    setTypeReading,
    a11y,
    setA11y,
    aim,
    setAim,
    order,
    setOrder,
    marks,
    setMarks,
    xray,
    setXray,
    alt,
    altFrom,
    altMeasure,
    setAltMeasure,
    pins,
    setPins,
    capturing,
    elementAt,
  } = s

  function a11yOf(el: Element, frame: Element): A11yReading {
    const tab = (el as HTMLElement).tabIndex
    return {
      label: labelOf(el),
      box: boxOf(el, frame),
      role: roleOf(el) ?? "generic",
      name: nameOf(el),
      states: statesOf(el),
      tabindex: el.hasAttribute("tabindex") || tab >= 0 ? tab : null,
      control: interactive(el),
    }
  }

  function xrayOf(frame: Element): XrayBox[] {
    const out: XrayBox[] = []
    const visit = (el: Element, depth: number) => {
      for (const c of el.children) {
        if (out.length >= 1500) return
        const r = c.getBoundingClientRect()
        if (r.width || r.height)
          out.push({ box: boxOf(c, frame), depth, layout: /flex|grid/.test(getComputedStyle(c).display) })
        if (c.tagName.toLowerCase() !== "svg") visit(c, depth + 1)
      }
    }
    visit(o.content, 0)
    return out
  }

  let raf = 0
  let slow = 0
  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const ov = overlay()
    if (!ov || capturing()) return
    const w = ov.clientWidth
    const h = ov.clientHeight
    if (w !== size().w || h !== size().h) setSize({ w, h })
    if (pinned() && !pinned()!.isConnected) setPinned(null)
    const t = tool()
    const pin = pinned()
    const over = hovered()
    const target = pin ?? over
    const live = target?.isConnected && TARGET_TOOLS.has(t) ? target : null

    const r = live && (t === "inspect" || t === "xray") ? readingOf(live, ov) : null
    if (!same(r, reading())) setReading(r)
    const g = pin && over && over !== pin && over.isConnected && TARGET_TOOLS.has(t) ? boxOf(over, ov) : null
    if (!same(g, ghost())) setGhost(g)

    const text = live && t === "type" ? textHolder(live, o.content) : null
    const tr = text ? { ...typeOf(text, ov), label: labelOf(text), box: boxOf(text, ov) } : null
    if (!same(tr, typeReading())) setTypeReading(tr)

    const ar = live && t === "a11y" ? a11yOf(live, ov) : null
    if (!same(ar, a11y())) setA11y(ar)

    const aimed = t === "comment" && over?.isConnected ? controlOf(over, o.content) : null
    const am0 = aimed ? { box: boxOf(aimed, ov), label: labelOf(aimed) } : null
    if (!same(am0, aim())) setAim(am0)

    if (now - slow > 300) {
      slow = now
      const xr = t === "xray" ? xrayOf(ov) : []
      if (!same(xr, xray())) setXray(xr)
      const ord = t === "a11y" ? focusOrder(o.content).map((el) => boxOf(el, ov)) : []
      if (!same(ord, order())) setOrder(ord)
      const mk = t === "a11y" ? audit(o.content, ov).map(({ box, kind, note }) => ({ box, kind, note })) : []
      if (!same(mk, marks())) setMarks(mk)
    }

    let am: ReturnType<typeof altMeasure> = null
    if (alt() && s.client) {
      const from = pin ?? altFrom()
      const to = elementAt(s.client.x, s.client.y)
      if (from?.isConnected) {
        const fb = boxOf(from, ov)
        const tb = to && to !== from ? boxOf(to, ov) : { x: 0, y: 0, w, h }
        am = {
          from: fb,
          to: tb,
          fromLabel: labelOf(from),
          toLabel: to && to !== from ? labelOf(to) : "stage",
          segments: distances(fb, tb),
        }
      }
    }
    if (!same(am, altMeasure())) setAltMeasure(am)

    const p: Record<string, Point> = {}
    for (const th of ws().threads) {
      const el = resolvePath(o.content, th.anchor.path)
      const b = el ? boxOf(el, ov) : th.anchor.box
      p[th.id] = { x: b.x + Math.min(th.anchor.offset.x, b.w), y: b.y + Math.min(th.anchor.offset.y, b.h) }
    }
    if (!same(p, pins())) setPins(p)
  }

  function start() {
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    cancelAnimationFrame(raf)
  }

  return { start, stop }
}
