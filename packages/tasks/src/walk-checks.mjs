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
