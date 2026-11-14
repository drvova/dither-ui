// The walk's audits of what a reader sees (`walk.mjs`): a page at a phone's
// width (overflow, targets, fields, clipped text, a demo spilling out of its
// card) and the contrast of text on the page as it is painted. Each page
// script runs in the page as the body of an async function given `arg`,
// over the recorder's helpers (`__walk`, walk-drivers.mjs); the contrast is
// measured here, from a screenshot.

/** Where an element stands, in words a finding can carry. */
const WHERE = `
const where = (el) => {
  const card = el.closest("[data-demo-card]")
  const cards = card ? [...document.querySelectorAll("[data-demo-card]")] : []
  const place = card ? "card " + (cards.indexOf(card) + 1) : el.closest("header") ? "header" : el.closest("footer") ? "footer" : el.closest("nav,aside") ? "rail" : "page"
  const name = (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.getAttribute("name") || el.getAttribute("placeholder") || "").replace(/\\s+/g, " ").trim().slice(0, 40)
  const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").split(/\\s+/).filter(Boolean).slice(0, 3).join(".")
  return place + ": <" + el.tagName.toLowerCase() + (cls ? "." + cls : "") + ">" + (name ? " " + JSON.stringify(name) : "")
}
const shown = (el) => {
  if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  const s = getComputedStyle(el)
  return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0 && el.getClientRects().length > 0
}
`

/** A page at a phone's width: what spills, what a finger cannot hit, what
 * zooms the page when focused, what is cut off. The site's iOS rules (the
 * rules under `@supports (-webkit-touch-callout: none)`, which only iOS
 * WebKit reads) are applied first, as an iPhone applies them. */
export const PHONE = `
${WHERE}
const out = { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, wide: [], targets: [], fields: [], clipped: [], spills: [], counts: {} }
if (!(window.CSS && CSS.supports("-webkit-touch-callout: none")) && !document.querySelector("style[data-walk-ios]")) {
  let ios = ""
  const visit = (list) => {
    for (const r of list) {
      if (typeof CSSSupportsRule !== "undefined" && r instanceof CSSSupportsRule) {
        if (/-webkit-touch-callout:\\s*none/.test(r.conditionText)) ios += [...r.cssRules].map((x) => x.cssText).join("\\n") + "\\n"
      } else if (r.cssRules && !(r instanceof CSSStyleRule)) visit(r.cssRules)
    }
  }
  for (const sheet of document.styleSheets) { try { visit(sheet.cssRules) } catch (e) {} }
  const style = document.createElement("style")
  style.dataset.walkIos = ""
  style.textContent = ios
  document.head.append(style)
  out.ios = ios.length
  await window.__walk.frames(2)
}
const view = document.documentElement.clientWidth
// what reaches past the window's right edge, the outermost of each
if (out.overflow > 1) {
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect()
    if (r.right <= view + 1 || r.width === 0 || !shown(el)) continue
    if (el.parentElement && el.parentElement.getBoundingClientRect().right > view + 1 && el.parentElement !== document.body) continue
    out.wide.push(where(el) + " reaches " + Math.round(r.right) + "px")
    if (out.wide.length >= 8) break
  }
}

// targets: 24 by 24 at least, or spaced so a 24px circle on each meets no other (WCAG 2.5.8)
const TARGET = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=switch],[role=checkbox],[role=radio],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=slider],[role=spinbutton],[role=combobox]'
const inSentence = (el) => {
  if (!(el.matches("a[href],[role=link]")) || getComputedStyle(el).display !== "inline") return false
  const block = el.parentElement
  return !!block && block.textContent.replace(/\\s+/g, " ").trim().length > el.textContent.replace(/\\s+/g, " ").trim().length + 1
}
const all = []
for (let el of document.querySelectorAll(TARGET)) {
  if (el.closest("[inert],[aria-hidden=true]") || el.matches(":disabled,[aria-disabled=true]")) continue
  let r = el.getBoundingClientRect()
  // a field drawn by its label (a native box hidden under a styled one): the label is what a finger meets
  if ((r.width < 2 || r.height < 2 || !shown(el)) && el.matches("input")) {
    const label = el.closest("label") || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]'))
    if (!label || !shown(label)) continue
    el = label
    r = el.getBoundingClientRect()
  }
  if (r.width < 2 || r.height < 2 || !shown(el)) continue
  all.push({ el, r })
}
out.counts.targets = all.length
const small = all.filter((t) => (t.r.width < 23.5 || t.r.height < 23.5) && !inSentence(t.el))
const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2]
const meets = (c, r) => { const x = Math.max(r.left, Math.min(c[0], r.right)), y = Math.max(r.top, Math.min(c[1], r.bottom)); return Math.hypot(c[0] - x, c[1] - y) < 12 }
const related = (a, b) => a.contains(b) || b.contains(a)
const smallSet = new Set(small)
for (const t of small) {
  // a native box whose label is wide enough is hit through the label
  const label = t.el.matches("input") && t.el.closest("label")
  if (label && label.getBoundingClientRect().height >= 23.5 && label.getBoundingClientRect().width >= 23.5) continue
  const c = centre(t.r)
  const crowded = all.some((o) => o !== t && !related(o.el, t.el) && (smallSet.has(o) ? Math.hypot(...centre(o.r).map((v, i) => v - c[i])) < 24 : meets(c, o.r)))
  if (crowded) out.targets.push(where(t.el) + " " + Math.round(t.r.width) + "x" + Math.round(t.r.height))
}

// fields at 16px at least: a smaller one zooms the page on iOS when focused
const FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=button]):not([type=submit]):not([type=reset]):not([type=hidden]):not([type=file]):not([type=image]),select,textarea,[contenteditable=""],[contenteditable=true]'
let fields = 0
for (const el of document.querySelectorAll(FIELD)) {
  if (el.matches(":disabled,[readonly]") || el.closest("[inert]") || !shown(el)) continue
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) continue
  fields++
  const size = parseFloat(getComputedStyle(el).fontSize)
  if (size < 15.5) out.fields.push(where(el) + " " + size + "px")
}
out.counts.fields = fields

// text cut off by a box that hides its overflow: a run of text partly in the box, partly past it
const animated = new Set()
for (const a of document.getAnimations ? document.getAnimations() : []) if (a.playState === "running" && a.effect && a.effect.target) animated.add(a.effect.target)
const clips = (s) => /hidden|clip/.test(s.overflowX) || /hidden|clip/.test(s.overflowY)
let boxes = 0
for (const box of document.body.querySelectorAll("*")) {
  if (box.scrollWidth <= box.clientWidth + 1 && box.scrollHeight <= box.clientHeight + 1) continue
  const s = getComputedStyle(box)
  if (!clips(s) || box.clientWidth < 4 || box.clientHeight < 4 || box.closest("[aria-hidden=true],[inert]") || !shown(box)) continue
  boxes++
  const b = box.getBoundingClientRect()
  const inner = { left: b.left + box.clientLeft, top: b.top + box.clientTop, right: b.left + box.clientLeft + box.clientWidth, bottom: b.top + box.clientTop + box.clientHeight }
  const x = /hidden|clip/.test(s.overflowX), y = /hidden|clip/.test(s.overflowY)
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim()
    const p = node.parentElement
    if (!text || !p || p.closest("[aria-hidden=true],svg,canvas") || !shown(p)) continue
    // a box between the text and this one handles it: it scrolls, or it clips (and is checked itself)
    let mine = true, moving = false
    for (let e = p; e && e !== box; e = e.parentElement) {
      const es = getComputedStyle(e)
      // moving, or moved: a stage panned under a pointer (an infinite canvas), a carousel's track
      if (animated.has(e) || (e !== p && es.transform !== "none")) moving = true
      if (es.overflowX !== "visible" || es.overflowY !== "visible") { mine = false; break }
      if (es.textOverflow === "ellipsis" || (es.webkitLineClamp && es.webkitLineClamp !== "none")) { mine = false; break }
    }
    if (!mine || moving || animated.has(box) || s.textOverflow === "ellipsis" || (s.webkitLineClamp && s.webkitLineClamp !== "none")) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
    const inside = (r) => r.right > inner.left + 1 && r.left < inner.right - 1 && r.bottom > inner.top + 1 && r.top < inner.bottom - 1
    const past = (r) => (x && (r.left < inner.left - 2 || r.right > inner.right + 2)) || (y && (r.top < inner.top - 2 || r.bottom > inner.bottom + 2))
    if (rects.some(inside) && rects.some(past)) {
      out.clipped.push(where(box) + " cuts " + JSON.stringify(text.slice(0, 40)))
      break
    }
  }
  if (out.clipped.length >= 12) break
}
out.counts.boxes = boxes

// a demo past its card: an element of the preview whose visible box leaves the well
for (const well of document.querySelectorAll("[data-demo-card] .demo-well")) {
  if (!shown(well)) continue
  const w = well.getBoundingClientRect()
  let found = null
  // each element's box as its clipping ancestors inside the well leave it
  const visit = (el, clip) => {
    if (!el || found) return
    for (const child of el.children) {
      const s = getComputedStyle(child)
      if (s.position === "fixed" || s.display === "none" || child.closest("[aria-hidden=true]")) continue
      const r = child.getBoundingClientRect()
      const seen = { left: Math.max(r.left, clip.left), right: Math.min(r.right, clip.right), top: Math.max(r.top, clip.top), bottom: Math.min(r.bottom, clip.bottom) }
      if (r.width > 0 && r.height > 0 && seen.right > seen.left && seen.bottom > seen.top && s.visibility !== "hidden" && (seen.left < w.left - 1 || seen.right > w.right + 1)) {
        found = where(child) + " spans " + Math.round(r.left - w.left) + ".." + Math.round(r.right - w.left) + " of a " + Math.round(w.width) + "px well"
        return
      }
      const next = /hidden|clip|auto|scroll/.test(s.overflowX) ? { left: Math.max(clip.left, r.left), right: Math.min(clip.right, r.right), top: clip.top, bottom: clip.bottom } : clip
      visit(child, next)
    }
  }
  visit(well, { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity })
  if (found) out.spills.push(found)
}
out.counts.wells = [...document.querySelectorAll("[data-demo-card] .demo-well")].filter(shown).length
return out
`

/** The text the window shows, for its contrast: each element's text runs in
 * view, with the ink it is drawn in, the opacity it is drawn at and whether
 * it is large (24px, or 18.66px bold: 3:1 is enough). Text in motion, in a
 * disabled control, hidden from assistive technology, drawn by a gradient
 * through transparent glyphs or covered by something else is not sampled. */
export const CONTRAST = `
const W = window.__walk
await W.frames(2)
const cache = new Map()
const probe = document.createElement("canvas")
probe.width = probe.height = 1
const g = probe.getContext("2d", { willReadFrequently: true })
const rgba = (c) => {
  if (cache.has(c)) return cache.get(c)
  g.clearRect(0, 0, 1, 1)
  g.fillStyle = "#000"
  g.fillStyle = c
  g.fillRect(0, 0, 1, 1)
  const d = g.getImageData(0, 0, 1, 1).data
  const v = [d[0], d[1], d[2], d[3] / 255]
  cache.set(c, v)
  return v
}
const animated = new Set()
for (const a of document.getAnimations ? document.getAnimations() : []) if (a.playState === "running" && a.effect && a.effect.target) animated.add(a.effect.target)
const opacityOf = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o }
const vw = document.documentElement.clientWidth, vh = innerHeight
const parents = new Map()
const inside = (el, x, y) => { const b = el.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom }
const covers = [...document.querySelectorAll("canvas,[aria-hidden=true]")].filter((c) => c.getClientRects().length && getComputedStyle(c).pointerEvents === "none" && (c.tagName === "CANVAS" || /absolute|fixed/.test(getComputedStyle(c).position)))
const opaque = (el, x, y) => el.tagName === "CANVAS" || [el, ...el.querySelectorAll("*")].some((e) => inside(e, x, y) && rgba(getComputedStyle(e).backgroundColor)[3] > 0.5 && Number(getComputedStyle(e).opacity) > 0.5)
const covered = (p, x, y) => covers.some((c) => !c.contains(p) && (p.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) && inside(c, x, y) && opaque(c, x, y))
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
for (let node = walker.nextNode(); node; node = walker.nextNode()) {
  if (!node.textContent.trim()) continue
  const p = node.parentElement
  if (!p) continue
  let entry = parents.get(p)
  if (entry === null) continue
  if (!entry) {
    if (p.closest("svg,canvas,script,style,noscript,textarea,template,[aria-hidden=true],[inert],[aria-disabled=true]") || p.closest("button:disabled,fieldset:disabled,select:disabled,option")) { parents.set(p, null); continue }
    if (p.checkVisibility && !p.checkVisibility({ opacityProperty: true, visibilityProperty: true })) { parents.set(p, null); continue }
    let moving = false
    for (let e = p; e; e = e.parentElement) if (animated.has(e)) moving = true
    const opacity = opacityOf(p)
    const s = getComputedStyle(p)
    const fill = rgba(s.webkitTextFillColor || s.color)
    if (moving || opacity < 0.05 || fill[3] === 0) { parents.set(p, null); continue }
    const size = parseFloat(s.fontSize), weight = parseInt(s.fontWeight, 10) || 400
    entry = { p, ink: fill, opacity, size, large: size >= 24 || (size >= 18.66 && weight >= 700), rects: [], text: "" }
    parents.set(p, entry)
  }
  const range = document.createRange()
  range.selectNodeContents(node)
  for (const r of range.getClientRects()) {
    if (r.width < 4 || r.height < 4 || r.left < 0 || r.top < 0 || r.right > vw || r.bottom > vh) continue
    // covered by something else (a sticky bar, an overlay): what shows there is not this text's ground
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const hit = document.elementFromPoint(cx, cy)
    if (!hit || !(p.contains(hit) || hit.contains(p))) continue
    // a cover laid over it that lets the pointer through (a canvas, cells that dissolve under a hover)
    if (covered(p, cx, cy)) continue
    entry.rects.push([r.left, r.top, r.width, r.height])
  }
  entry.text = (entry.text + " " + node.textContent.replace(/\\s+/g, " ")).trim().slice(0, 60)
}
// text a script is fading (a stagger, a reveal) is in motion too: read again a moment later
await W.sleep(300)
for (const [p, e] of parents) if (e && Math.abs(opacityOf(p) - e.opacity) > 0.01) parents.set(p, null)
const card = (el) => { const c = el.closest("[data-demo-card]"); return c ? "card " + ([...document.querySelectorAll("[data-demo-card]")].indexOf(c) + 1) : el.closest("header") ? "header" : el.closest("nav,aside") ? "rail" : "page" }
const samples = []
for (const e of parents.values()) {
  if (!e || !e.rects.length) continue
  samples.push({ rects: e.rects.slice(0, 6), ink: e.ink, opacity: e.opacity, large: e.large, size: e.size, text: e.text, where: card(e.p) + ": <" + e.p.tagName.toLowerCase() + ">" })
  if (samples.length >= (arg && arg.limit || 160)) break
}
return samples
`

const channel = (v) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
/** WCAG's contrast ratio of two opaque colours. */
export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const over = (ink, alpha, ground) => ink.slice(0, 3).map((v, i) => v * alpha + ground[i] * (1 - alpha))

/** Each sample's contrast, measured: its ground is what the screenshot shows
 * under its text, less the glyphs' own pixels, read as its mean in linear
 * light (one colour, or a raster's cells), its ink the text's colour laid
 * over that ground at the opacity it is drawn at. */
export function measureContrast(png, samples, scale) {
  const found = []
  let measured = 0
  for (const s of samples) {
    const counts = new Map()
    let total = 0
    for (const [x, y, w, h] of s.rects) {
      const x0 = Math.max(0, Math.round(x * scale))
      const y0 = Math.max(0, Math.round(y * scale))
      const x1 = Math.min(png.width, Math.round((x + w) * scale))
      const y1 = Math.min(png.height, Math.round((y + h) * scale))
      for (let py = y0; py < y1; py++)
        for (let px = x0; px < x1; px++) {
          const o = (py * png.width + px) * 4
          const k = (png.data[o] << 16) | (png.data[o + 1] << 8) | png.data[o + 2]
          counts.set(k, (counts.get(k) ?? 0) + 1)
          total++
        }
    }
    if (total < 16) continue
    measured++
    const ranked = [...counts].sort((a, b) => b[1] - a[1])
    const rgb = (k) => [(k >> 16) & 255, (k >> 8) & 255, k & 255]
    const alpha = s.ink[3] * s.opacity
    const first = rgb(ranked[0][0])
    const ink = luminance(over(s.ink, alpha, first))
    // the ground: every pixel farther from the ink than 92% of the way to the commonest colour (the glyphs and
    // their edges are the rest). One colour is the ground; many are a raster (an ordered-dither fill, a
    // screen), which reads as its cells' mean in linear light, as the kit inks its own labels for it
    const reach = Math.abs(luminance(first) - ink) * 0.92
    const sum = [0, 0, 0]
    let n = 0
    let top = 0
    for (const [k, c] of ranked) {
      const g = rgb(k)
      if (Math.abs(luminance(g) - ink) < reach) continue
      for (let i = 0; i < 3; i++) sum[i] += channel(g[i]) * c
      n += c
      top = Math.max(top, c)
    }
    const ground = sum.map((v) => {
      const lin = v / n
      return 255 * (lin <= 0.0031308 ? lin * 12.92 : 1.055 * lin ** (1 / 2.4) - 0.055)
    })
    const worst = { r: ratio(over(s.ink, alpha, ground), ground), ground, raster: top < n * 0.9 }
    const need = s.large ? 3 : 4.5
    if (worst.r < need - 0.05) {
      const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`
      found.push(
        `${s.where} ${JSON.stringify(s.text)} ${worst.r.toFixed(2)}:1 (${hex(over(s.ink, alpha, worst.ground))} on ${hex(worst.ground)}${worst.raster ? ", a raster's mean" : ""}, ${s.size}px${s.large ? ", large" : ""}; needs ${need}:1)`,
      )
    }
  }
  return { measured, found }
}

// ---------------------------------------------------------------- what assistive technology meets
// These rules are functions, not strings: the walk sends their source into
// the page (`A11Y`, `KEYS`, `FOCUSED`), and `tests/walk-checks.spec.ts` calls
// them on a DOM of its own, so each rule is written once.

/** Whether assistive technology passes `el` by: under `aria-hidden` or
 * `inert`, in a closed dialog, or not rendered (no box, `visibility:
 * hidden`). A `display: contents` box has no box of its own and is as
 * shown as its parent. */
export function concealed(el) {
  for (let x = el; x && x.nodeType === 1; x = x.parentElement)
    if (
      x.getAttribute("aria-hidden") === "true" ||
      x.hasAttribute("inert") ||
      x.hidden ||
      x.localName === "template" ||
      (x.localName === "dialog" && !x.hasAttribute("open"))
    )
      return true
  const view = el.ownerDocument.defaultView
  let box = el
  while (box && view.getComputedStyle(box).display === "contents") box = box.parentElement
  if (!box) return false
  if (box.checkVisibility) return !box.checkVisibility({ visibilityProperty: true })
  for (let x = box; x && x.nodeType === 1; x = x.parentElement)
    if (view.getComputedStyle(x).display === "none") return true
  return view.getComputedStyle(box).visibility === "hidden"
}

/** The ARIA role `el` stands in: its own, else the one its tag implies. */
export function roleOf(el) {
  const own = (el.getAttribute("role") || "").trim().split(/\s+/)[0]
  if (own) return own
  const tag = el.localName
  if (tag === "a" || tag === "area") return el.hasAttribute("href") ? "link" : ""
  if (tag === "button" || tag === "summary") return "button"
  if (tag === "select") return el.multiple || el.size > 1 ? "listbox" : "combobox"
  if (tag === "textarea") return "textbox"
  if (/^h[1-6]$/.test(tag)) return "heading"
  if (tag === "img") return el.getAttribute("alt") === "" ? "presentation" : "img"
  if (tag === "input") {
    const type = (el.getAttribute("type") || "text").toLowerCase()
    if (/^(button|submit|reset|image)$/.test(type)) return "button"
    if (type === "checkbox" || type === "radio") return type
    if (type === "range") return "slider"
    if (type === "number") return "spinbutton"
    if (type === "search") return "searchbox"
    return "textbox"
  }
  return { main: "main", nav: "navigation", aside: "complementary", option: "option", dialog: "dialog" }[tag] || ""
}

/** An element's accessible name, as assistive technology computes it (the
 * parts of accname a page here meets): `aria-labelledby`, `aria-label`, a
 * field's labels, an image's alt, an SVG's title, the text of what takes
 * its name from its content (with the names of what it holds), then a
 * title or a placeholder. */
export function accessibleName(el) {
  const doc = el.ownerDocument
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim()
  const content = (node, seen) => {
    let out = ""
    for (const child of node.childNodes) {
      if (child.nodeType === 3) out += child.textContent
      else if (child.nodeType === 1 && !seen.has(child) && !concealed(child)) out += ` ${held(child, seen)} `
    }
    return out
  }
  const held = (child, seen) => {
    seen.add(child)
    const tag = child.localName
    if (clean(child.getAttribute("aria-labelledby"))) return byIds(child)
    if (clean(child.getAttribute("aria-label"))) return child.getAttribute("aria-label")
    if (tag === "img" || (tag === "input" && child.type === "image")) return child.getAttribute("alt") || ""
    if (tag === "svg") return (child.querySelector("title") || {}).textContent || ""
    if (tag === "input" || tag === "textarea") return child.value || ""
    if (tag === "select")
      return child.selectedOptions && child.selectedOptions[0] ? child.selectedOptions[0].textContent : ""
    const inner = content(child, seen)
    return clean(inner) ? inner : child.getAttribute("title") || ""
  }
  const byIds = (from) =>
    from
      .getAttribute("aria-labelledby")
      .split(/\s+/)
      .map((id) => doc.getElementById(id))
      .filter(Boolean)
      .map((ref) => clean(ref.getAttribute("aria-label")) || clean(content(ref, new Set([from]))))
      .join(" ")
  if (clean(el.getAttribute("aria-labelledby"))) {
    const named = clean(byIds(el))
    if (named) return named
  }
  if (clean(el.getAttribute("aria-label"))) return clean(el.getAttribute("aria-label"))
  const tag = el.localName
  const type = (el.getAttribute("type") || "").toLowerCase()
  if (tag === "input" && /^(button|submit|reset)$/.test(type))
    return clean(el.value) || (type === "submit" ? "Submit" : type === "reset" ? "Reset" : "")
  if (tag === "input" && type === "image") return clean(el.getAttribute("alt") || el.value || el.title)
  if (/^(button|input|select|textarea|meter|progress|output)$/.test(tag)) {
    const labels = [...(el.labels || [])].map((l) => clean(content(l, new Set([el])))).filter(Boolean)
    if (labels.length) return labels.join(" ")
  }
  if (tag === "img") return clean(el.getAttribute("alt") || el.title)
  if (tag === "svg") {
    const title = [...el.children].find((c) => c.localName === "title")
    if (title && clean(title.textContent)) return clean(title.textContent)
  }
  // what takes its name from its content; a bare element put in the tab order is read by its text too
  const fromContent =
    /^(button|link|tab|menuitem|menuitemcheckbox|menuitemradio|option|treeitem|checkbox|radio|switch|cell|gridcell|columnheader|rowheader|heading|tooltip|row)$/
  if (fromContent.test(roleOf(el)) || (el.hasAttribute("tabindex") && !el.getAttribute("role"))) {
    const text = clean(content(el, new Set([el])))
    if (text) return text
  }
  return clean(el.getAttribute("title") || el.getAttribute("placeholder"))
}

/** What a reader can operate: links, controls, the widget roles and
 * anything put in the tab order. */
export const INTERACTIVE =
  'a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=switch],[role=checkbox],[role=radio],[role=slider],[role=spinbutton],[role=combobox],[role=searchbox],[role=textbox],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=treeitem],[tabindex]:not([tabindex^="-"])'

/** Where an element stands and what it is, in words a finding can carry. */
export function describe(el) {
  const card = el.closest("[data-demo-card]")
  const cards = card ? [...el.ownerDocument.querySelectorAll("[data-demo-card]")] : []
  const place = card
    ? `card ${cards.indexOf(card) + 1}`
    : el.closest("[role=dialog],[role=alertdialog],dialog")
      ? "dialog"
      : el.closest("header")
        ? "header"
        : el.closest("footer")
          ? "footer"
          : el.closest("nav,aside")
            ? "rail"
            : "page"
  const cls = String(el.getAttribute("class") || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(".")
  const role = el.getAttribute("role")
  const label = el.getAttribute("aria-label")
  const text = (label || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30)
  return `${place}: <${el.localName}${role ? ` role=${role}` : ""}${cls ? `.${cls}` : ""}>${text ? ` ${JSON.stringify(text)}` : ""}`
}

/** The page as assistive technology reads it, a list of findings a rule:
 * every operable element named (`names`); ids unique (`ids`) and every id
 * an ARIA reference or a label names standing (`refs`; a collapsed key's
 * `aria-controls` may name a popup not there yet); one h1 and no level
 * skipped going down inside main (`headings`); one main, and the other
 * landmarks each named, apart, when a page holds more than one of a kind
 * (`landmarks`; a header or a footer inside a sectioning element is no
 * landmark; demos of one component on its docs page may share its default
 * name); every image given a text or hidden (`images`). */
export function auditA11y(doc) {
  const out = { names: [], ids: [], refs: [], headings: [], landmarks: [], images: [], counts: {} }
  const exposed = (el) => !concealed(el)

  const controls = [...doc.querySelectorAll(INTERACTIVE)].filter(
    (el) => exposed(el) && !/^(presentation|none)$/.test(el.getAttribute("role") || ""),
  )
  out.counts.controls = controls.length
  for (const el of controls) if (!accessibleName(el)) out.names.push(describe(el))

  const ids = new Map()
  for (const el of doc.querySelectorAll("[id]")) if (!el.closest("template")) ids.set(el.id, (ids.get(el.id) || 0) + 1)
  out.counts.ids = ids.size
  for (const [id, n] of ids) if (n > 1) out.ids.push(`#${id} on ${n} elements`)

  for (const attr of ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant"])
    for (const el of doc.querySelectorAll(`[${attr}]`)) {
      if (el.closest("template")) continue
      if (attr === "aria-controls" && el.getAttribute("aria-expanded") === "false") continue
      for (const id of el.getAttribute(attr).split(/\s+/).filter(Boolean))
        if (!doc.getElementById(id)) out.refs.push(`${describe(el)} ${attr}="${id}": no such id`)
    }
  for (const label of doc.querySelectorAll("label[for]"))
    if (label.htmlFor && !doc.getElementById(label.htmlFor))
      out.refs.push(`${describe(label)} for="${label.htmlFor}": no such id`)

  const headings = [
    ...doc.querySelectorAll(
      "h1:not([role]),h2:not([role]),h3:not([role]),h4:not([role]),h5:not([role]),h6:not([role]),[role=heading]",
    ),
  ].filter(exposed)
  const level = (h) => Number(h.getAttribute("aria-level")) || Number(/^h([1-6])$/.exec(h.localName)?.[1]) || 2
  const ones = headings.filter((h) => level(h) === 1)
  out.counts.headings = headings.length
  if (ones.length !== 1)
    out.headings.push(
      `${ones.length} h1${ones.length ? `: ${ones.map((h) => JSON.stringify(h.textContent.replace(/\s+/g, " ").trim().slice(0, 40))).join(", ")}` : ""}`,
    )
  let last = 0
  for (const h of headings) {
    const n = level(h)
    if (last && n > last + 1 && h.closest("main,[role=main]")) out.headings.push(`h${last} then h${n}: ${describe(h)}`)
    last = n
  }

  // a tag counts as its landmark unless a role of its own says otherwise
  const LANDMARKS = {
    main: "main:not([role]),[role=main]",
    navigation: "nav:not([role]),[role=navigation]",
    complementary: "aside:not([role]),[role=complementary]",
    contentinfo: "footer:not([role]),[role=contentinfo]",
    banner: "header:not([role]),[role=banner]",
  }
  const SECTIONING = "article,aside,main,nav,section,[role=article],[role=complementary],[role=main],[role=navigation]"
  for (const [kind, selector] of Object.entries(LANDMARKS)) {
    let found = [...doc.querySelectorAll(selector)].filter(exposed)
    if (kind === "banner" || kind === "contentinfo")
      found = found.filter((el) => el.getAttribute("role") || !el.parentElement.closest(SECTIONING))
    out.counts[kind] = found.length
    if (kind === "main") {
      if (found.length !== 1) out.landmarks.push(`${found.length} main landmarks`)
      continue
    }
    if (found.length < 2) continue
    const names = new Set()
    for (const el of found) {
      const named = el.hasAttribute("aria-labelledby") || el.hasAttribute("aria-label")
      const name = named ? accessibleName(el).toLowerCase() : ""
      if (!name) out.landmarks.push(`${found.length} ${kind} landmarks, this one unnamed: ${describe(el)}`)
      // several demos of one component on its docs page wear its default name, each named all the same
      else if (names.has(name) && !el.closest("[data-demo-card]"))
        out.landmarks.push(`two ${kind} landmarks named ${JSON.stringify(name)}: ${describe(el)}`)
      names.add(name)
    }
  }

  const images = [...doc.querySelectorAll("img,[role=img]")].filter(exposed)
  out.counts.images = images.length
  for (const el of images) {
    if (el.localName === "img" && el.hasAttribute("alt") && !el.getAttribute("role")) continue
    if (!accessibleName(el)) out.images.push(describe(el))
  }
  return out
}

/** The marks of focus an element wears, read from its style and its
 * nearest boxes' (three of its ancestors, its siblings and children, its
 * pseudo-elements):
 * a ring may stand on a wrapper (`:focus-within`), a sibling (`peer-focus`)
 * or a child (`group-focus`). */
export function focusMarks(el) {
  const view = el.ownerDocument.defaultView
  const PROPS = [
    "outline-style",
    "outline-width",
    "outline-color",
    "box-shadow",
    "border-top-color",
    "border-bottom-color",
    "background-color",
    "background-image",
    "color",
    "text-decoration-line",
    "opacity",
    "transform",
  ]
  const read = (node, pseudo) => {
    const s = view.getComputedStyle(node, pseudo)
    return PROPS.map((p) => s.getPropertyValue(p)).join("|")
  }
  const parent = el.parentElement
  const grand = parent && parent.parentElement
  const boxes = [
    el,
    parent,
    grand,
    grand && grand.parentElement,
    el.previousElementSibling,
    el.nextElementSibling,
    ...el.children,
  ].filter(Boolean)
  return [...boxes.map((b) => read(b, null)), read(el, "::before"), read(el, "::after")]
}

/** Whether focusing changed how an element looks: its marks unfocused
 * (`before`) against focused (`after`), an outline only when it shows. */
export function indicated(before, after) {
  if (before.length !== after.length) return true
  return before.some((b, i) => b !== after[i])
}

/** Where focus landed that a reader cannot see or a screen reader is not
 * told of: `""` when it is fine. A box revealed by its focus (a skip link)
 * is read as it stands focused; a native field laid transparent over the
 * face it drives (a range over its drawing) shows through that face.
 * "transparent" is read again once the page settles (a scene fading in as
 * focus scrolls it into view). */
export function hiddenFocus(el) {
  if (el.closest("[aria-hidden=true]")) return "under aria-hidden"
  if (el.closest("[inert]")) return "inside inert"
  if (concealed(el)) return "not rendered"
  const shows = (x) => !x.checkVisibility || x.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  const face = /^(input|select)$/.test(el.localName) && el.parentElement && shows(el.parentElement)
  if (!shows(el) && !face) return "transparent"
  const r = el.getBoundingClientRect()
  if (el.getClientRects().length && (r.width < 1 || r.height < 1) && !el.querySelector("*")) return "no size"
  return ""
}

/** Which of the elements a page puts in its tab order Tab never reached:
 * `stops` the operable elements in view (with `roving`, the composite
 * widget each one is a member of, whose one stop stands for the members
 * it keeps out of the tab order, `out`),
 * `reached` the ones focus landed on, `widgetsReached` the composite
 * widgets focus landed on themselves (a listbox holding its options by
 * `aria-activedescendant`). */
export function unreached(stops, reached, widgetsReached = []) {
  const got = new Set(reached)
  const widgets = new Set([...widgetsReached, ...stops.filter((s) => got.has(s.key) && s.roving).map((s) => s.roving)])
  return stops.filter((s) => !got.has(s.key) && !(s.out && s.roving && widgets.has(s.roving)))
}

/** A dialog's keyboard record judged: focus moved in as it opened, Tab and
 * Shift+Tab kept it inside (a modal), Escape closed it and focus came back
 * to the key that opened it. */
export function dialogFindings(r) {
  const found = []
  if (!r.opened) return [`${r.opener}: Enter opened no dialog`]
  if (!r.focusIn)
    found.push(`${r.opener}: focus stayed outside the dialog as it opened (on ${r.focusAt || "the page"})`)
  if (!r.named) found.push(`${r.opener}: the dialog has no name`)
  if (r.modal && r.escaped.length) found.push(`${r.opener}: Tab left the modal dialog for ${r.escaped[0]}`)
  if (!r.closed) found.push(`${r.opener}: Escape left the dialog open`)
  else if (!r.returned)
    found.push(`${r.opener}: focus did not return to the key that opened it (on ${r.returnedTo || "the page"})`)
  return found
}

/** How many pixels of a box differ between two screenshots by enough to
 * see (a channel 48 apart); the box in CSS pixels, `scale` the device's. */
export function changedPixels(a, b, [x, y, w, h], scale) {
  const x0 = Math.max(0, Math.round(x * scale))
  const y0 = Math.max(0, Math.round(y * scale))
  const x1 = Math.min(a.width, b.width, Math.round((x + w) * scale))
  const y1 = Math.min(a.height, b.height, Math.round((y + h) * scale))
  let n = 0
  for (let py = y0; py < y1; py++)
    for (let px = x0; px < x1; px++) {
      const o = (py * a.width + px) * 4
      const q = (py * b.width + px) * 4
      const d = Math.max(
        Math.abs(a.data[o] - b.data[q]),
        Math.abs(a.data[o + 1] - b.data[q + 1]),
        Math.abs(a.data[o + 2] - b.data[q + 2]),
      )
      if (d >= 48) n++
    }
  return n
}

/** The rules as source, for the page scripts below. */
const RULES = [
  `const INTERACTIVE = ${JSON.stringify(INTERACTIVE)}`,
  ...[concealed, roleOf, accessibleName, describe, auditA11y, focusMarks, indicated, hiddenFocus, unreached].map(
    String,
  ),
].join("\n")

/** What a screen reader is told of the page (`auditA11y`). */
export const A11Y = `
${RULES}
await window.__walk.frames(2)
return auditA11y(document)
`

/** The keyboard pass begins: the page at its top, every operable element
 * that shows (outside a dialog, which is walked on its own) counted as a
 * stop with its marks unfocused, focus put before the first, and a
 * recorder on every focus Tab moves (where it landed, whether a reader
 * sees it there and whether it shows a mark) and on every Tab pressed. */
export const KEYS_START = `
${RULES}
const W = window.__walk
scrollTo(0, 0)
await W.frames(2)
// the widgets that rove one Tab stop among their members (a group of keys that arrows move through, too)
const COMPOSITE = "[role=tablist],[role=radiogroup],[role=menu],[role=menubar],[role=listbox],[role=toolbar],[role=grid],[role=tree],[role=treegrid],[role=group]"
const widgets = new Map()
W.widgetOf = (el) => widgets.get(el)
const widgetOf = (el) => {
  if (el.localName === "input" && el.type === "radio" && el.name) return "radio " + el.name
  const w = el.parentElement && el.parentElement.closest(COMPOSITE)
  if (!w) return ""
  if (!widgets.has(w)) widgets.set(w, "widget " + widgets.size)
  return widgets.get(w)
}
const shows = (el) => (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true)
// focus put before the page first (a field the page focused as it loaded lets go), its marks gone
const start = document.createElement("span")
start.tabIndex = -1
start.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;outline:none"
document.body.prepend(start)
start.focus()
W.keyStart = start
await W.frames(2)
for (const a of document.getAnimations()) if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) a.finish()
W.keyOf = new Map()
W.stops = []
for (const el of document.querySelectorAll(INTERACTIVE)) {
  if (concealed(el) || el.matches(":disabled,[aria-disabled=true]") || el.closest("dialog,[role=dialog],[role=alertdialog]") || !shows(el)) continue
  const r = el.getBoundingClientRect()
  if (r.width < 1 || r.height < 1) continue
  const key = W.stops.length
  W.keyOf.set(el, key)
  W.stops.push({ key, el, roving: widgetOf(el), out: el.tabIndex < 0, where: describe(el), marks: focusMarks(el) })
}
W.focusLog = []
W.tabLog = []
W.onFocus = (e) => {
  const el = e.target
  if (el === start) return
  // a composite widget that holds focus itself stands for its members
  if (W.widgetOf(el)) (W.widgetsReached ||= []).push(W.widgetOf(el))
  // the mark drawn in full: a transition into it ends at once
  const root = (el.parentElement && el.parentElement.parentElement) || el
  for (const a of root.getAnimations({ subtree: true })) if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) a.finish()
  let key = W.keyOf.get(el)
  // a stop that did not show before focus came to it (a key shown on focus): its marks are looked at on screen
  const late = key === undefined
  if (late) {
    key = W.stops.length
    W.keyOf.set(el, key)
    W.stops.push({ key, el, roving: "", where: describe(el), marks: null })
  }
  const marked = late ? false : indicated(W.stops[key].marks, focusMarks(el))
  W.focusLog.push({ key, where: describe(el), hidden: hiddenFocus(el), marked })
}
W.onKey = (e) => {
  if (e.key !== "Tab") return
  const at = document.activeElement
  const entry = { key: !at || at === start || at === document.body ? -2 : W.keyOf.has(at) ? W.keyOf.get(at) : -1, where: at && at !== document.body ? describe(at) : "the page" }
  W.tabLog.push(entry)
  setTimeout(() => { entry.prevented = e.defaultPrevented }, 0)
}
addEventListener("keydown", W.onKey, true)
document.addEventListener("focusin", W.onFocus, true)
return { stops: W.stops.length }
`

/** How far Tab has come: whether focus has gone round the page to where it
 * began, or is held where Tab no longer moves it. */
export const KEYS_READ = `
const W = window.__walk
const log = W.focusLog.filter((f) => f.key >= 0)
const first = log.length ? log[0].key : -3
const wrapped = log.some((f, i) => i > 0 && f.key === first && log[i - 1].key !== first)
const tail = W.tabLog.slice(-8)
const held = tail.length === 8 && tail[0].key !== -2 && tail.every((t) => t.where === tail[0].where && t.prevented)
return { tabs: W.tabLog.length, wrapped, held: held ? tail[0].where : "" }
`

/** The keyboard pass read: the stops Tab never reached (that still show),
 * the places focus landed a reader cannot see, the stops whose style no
 * focus changed (the walk then looks at them on screen). */
export const KEYS_END = `
${RULES}
const W = window.__walk
removeEventListener("keydown", W.onKey, true)
document.removeEventListener("focusin", W.onFocus, true)
const reached = W.focusLog.map((f) => f.key).filter((k) => k >= 0)
const shows = (el) => (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true)
const live = W.stops.filter((s) => s.el.isConnected && !concealed(s.el) && shows(s.el))
const hidden = new Map()
for (const f of W.focusLog) if (f.hidden) hidden.set(f.where, { key: f.key, where: f.where, why: f.hidden })
const unmarked = [...new Set(W.focusLog.filter((f) => f.marked === false).map((f) => f.key))]
return { stops: W.stops.length, reached: new Set(reached).size, missed: unreached(live, reached, W.widgetsReached || []).map((s) => s.where), hidden: [...hidden.values()],
  unmarked: unmarked.map((key) => ({ key, where: W.stops[key].where })) }
`

/** One stop looked at again as Tab brings a reader to it: focus put on the
 * stop Tab reached before it (the walk then presses Tab, so the page
 * scrolls and reveals as it does for a reader). */
export const FOCUS_BEFORE = `
const W = window.__walk
const keys = W.focusLog.map((f) => f.key)
const at = keys.indexOf(arg.key)
const prev = at > 0 ? W.stops[keys[at - 1]] : null
if (prev && prev.el.isConnected) prev.el.focus()
else W.keyStart.focus()
await W.frames(2)
return true
`

/** The stop Tab arrived at, once the page has settled around it: whether
 * it is the one asked for, where it stands (its box, padded for a ring,
 * and whether any of it is in the window) and whether a reader sees it. */
export const FOCUS_ARRIVED = `
${RULES}
const W = window.__walk
const s = W.stops[arg.key]
// a smooth scroll to it ends first (it starts a frame or two after the key), then what it reveals settles
let last = scrollY, since = Date.now()
for (const end = Date.now() + 3000; Date.now() - since < 250 && Date.now() < end; ) {
  await W.frames(1)
  if (scrollY !== last) { last = scrollY; since = Date.now() }
}
await W.sleep(600)
if (!s || document.activeElement !== s.el) return { arrived: false }
const r = s.el.getBoundingClientRect()
const inView = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < document.documentElement.clientWidth
return { arrived: true, box: [r.left - 6, r.top - 6, r.width + 12, r.height + 12], inView, hidden: hiddenFocus(s.el) }
`

/** Focus put back before the page without moving it, every mark let go. */
export const FOCUS_OFF = `
const W = window.__walk
W.keyStart.focus({ preventScroll: true })
await W.frames(3)
await W.sleep(350)
return true
`

/** The dialog Tabbed through: where focus left it for, the recorder off. */
export const DIALOG_TABBED = `
const W = window.__walk
document.removeEventListener("focusin", W.onDialogFocus, true)
return W.escaped.slice(0, 3)
`

export const KEYS_DONE = `const W = window.__walk; if (W.keyStart) W.keyStart.remove(); W.keyStart = null; return true`

/** The keys that open a dialog: every key that says it opens one
 * (aria-haspopup=dialog), the keys arg.labels names, and with arg.wells
 * every plain button of a docs demo (each one is tried: those that open
 * no dialog are passed by). */
export const DIALOG_KEYS = `
${RULES}
const W = window.__walk
const shows = (el) => !concealed(el) && el.getClientRects().length > 0 && (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true)
const list = []
const add = (el, why) => { if (!list.some((x) => x.el === el) && shows(el) && !el.matches(":disabled,[aria-disabled=true]")) list.push({ el, why }) }
for (const el of document.querySelectorAll("[aria-haspopup=dialog]")) add(el, "says")
for (const label of arg.labels || []) for (const el of document.querySelectorAll("button,[role=button]")) if (accessibleName(el) === label) add(el, "named")
if (arg.wells) for (const el of document.querySelectorAll("[data-demo-card] .demo-well button:not([aria-pressed]):not([role]):not([type=submit])")) if (!el.closest("form")) add(el, "tried")
W.openers = list
return list.map((o) => ({ where: describe(o.el), why: o.why }))
`

const OPEN_DIALOGS = `const openDialogs = () => [...document.querySelectorAll("[role=dialog],[role=alertdialog],dialog[open]")].filter((d) => !concealed(d) && !(W.dialogsBefore || new Set()).has(d))`

/** A key focused, the dialogs already open noted. */
export const DIALOG_FOCUS = `
${RULES}
const W = window.__walk
const o = W.openers[arg.i]
if (!o || !o.el.isConnected) return false
W.dialogsBefore = null
${OPEN_DIALOGS}
W.dialogsBefore = new Set(openDialogs())
o.el.scrollIntoView({ block: "center" })
await W.frames(2)
o.el.focus()
return document.activeElement === o.el
`

/** After Enter: the dialog that opened, where focus went, its name, whether
 * it is modal and how many stops it holds; a recorder on focus leaving it. */
export const DIALOG_OPENED = `
${RULES}
const W = window.__walk
${OPEN_DIALOGS}
const d = await W.until(() => openDialogs()[0], arg.wait)
if (!d) return { opened: false }
// a sheet's wipe, focus set as it lands
await W.sleep(500)
const dialog = openDialogs()[0] || d
W.dialog = dialog
const at = document.activeElement
let modal = dialog.getAttribute("aria-modal") === "true"
try { modal = modal || dialog.matches(":modal") } catch (e) {}
const stops = [...dialog.querySelectorAll(INTERACTIVE)].filter((el) => !concealed(el) && el.tabIndex >= 0 && !el.matches(":disabled")).length
W.escaped = []
W.onDialogFocus = (e) => { if (W.dialog && !W.dialog.contains(e.target)) W.escaped.push(describe(e.target)) }
document.addEventListener("focusin", W.onDialogFocus, true)
return { opened: true, dialog: describe(dialog), focusIn: dialog.contains(at), focusAt: at && at !== document.body ? describe(at) : "", named: !!accessibleName(dialog), modal, stops }
`

/** After Escape: whether the dialog went and focus came back to its key
 * (the same key, or the one standing in its place). */
export const DIALOG_CLOSED = `
${RULES}
const W = window.__walk
const o = W.openers[arg.i]
const gone = await W.until(() => !W.dialog || !W.dialog.isConnected || concealed(W.dialog), 2000)
const same = () => { const at = document.activeElement; return at && (at === o.el || (!o.el.isConnected && describe(at) === describe(o.el))) }
const back = gone ? await W.until(same, 1000) : null
const at = document.activeElement
W.dialog = null
return { closed: !!gone, returned: !!back, returnedTo: at && at !== document.body ? describe(at) : "" }
`
