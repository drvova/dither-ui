// Colour for the workbench: what `getComputedStyle` and a sampled pixel hand
// back, read into one RGBA, printed in the format the reader copies, and
// held against WCAG's contrast rule. sRGB in 0–255 with alpha 0–1.

export type RGBA = { r: number; g: number; b: number; a: number }
export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch"
export const COLOR_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"]

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

/** A CSS number, percentage (of `pct`) or `none`. */
function num(token: string | undefined, pct = 1): number {
  if (!token || token === "none") return 0
  return token.endsWith("%") ? (parseFloat(token) / 100) * pct : parseFloat(token)
}

function alphaOf(token: string | undefined): number {
  return token === undefined ? 1 : clamp(num(token, 1), 0, 1)
}

/** Linear-light sRGB (0–1) → RGBA, gamut-clipped. */
function fromLinear(r: number, g: number, b: number, a: number): RGBA {
  const ch = (c: number) => Math.round(clamp(toGamma(clamp(c, 0, 1)), 0, 1) * 255)
  return { r: ch(r), g: ch(g), b: ch(b), a }
}

function oklabToRgba(L: number, A: number, B: number, a: number): RGBA {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return fromLinear(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    a,
  )
}

function hslToRgba(h: number, s: number, l: number, a: number): RGBA {
  const k = (n: number) => (n + h / 30) % 12
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a }
}

/** Read any colour a browser computes or a canvas yields; null when it is
 * not a colour this reader knows. */
export function parseColor(css: string): RGBA | null {
  const s = css.trim().toLowerCase()
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 }
  const hex = s.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("")
    if (h.length !== 6 && h.length !== 8) return null
    const v = (i: number) => parseInt(h.slice(i, i + 2), 16)
    return { r: v(0), g: v(2), b: v(4), a: h.length === 8 ? Math.round((v(6) / 255) * 1000) / 1000 : 1 }
  }
  const fn = s.match(/^([a-z-]+)\((.*)\)$/)
  if (!fn) return null
  const [name, body] = [fn[1], fn[2]]
  const [main, slash] = body.split("/").map((p) => p.trim())
  const parts = main.split(/[\s,]+/).filter(Boolean)
  // Legacy `rgba(r, g, b, a)` carries alpha as a fourth part; `color(space
  // r g b)` has four parts and no alpha unless after a slash.
  const alpha = alphaOf(slash ?? (name !== "color" && parts.length === 4 ? parts[3] : undefined))
  switch (name) {
    case "rgb":
    case "rgba": {
      if (parts.length < 3) return null
      const ch = (t: string) => Math.round(clamp(num(t, 255), 0, 255))
      return { r: ch(parts[0]), g: ch(parts[1]), b: ch(parts[2]), a: alpha }
    }
    case "hsl":
    case "hsla":
      if (parts.length < 3) return null
      // Saturation and lightness are 0–100 with or without the `%`.
      return hslToRgba(parseFloat(parts[0]), parseFloat(parts[1]) / 100, parseFloat(parts[2]) / 100, alpha)
    case "oklab":
      if (parts.length < 3) return null
      return oklabToRgba(num(parts[0], 1), num(parts[1], 0.4), num(parts[2], 0.4), alpha)
    case "oklch": {
      if (parts.length < 3) return null
      const C = num(parts[1], 0.4)
      const h = (num(parts[2]) * Math.PI) / 180
      return oklabToRgba(num(parts[0], 1), C * Math.cos(h), C * Math.sin(h), alpha)
    }
    case "color": {
      const [space, ...rest] = parts
      if (rest.length < 3) return null
      const [r, g, b] = rest.map((t) => num(t, 1))
      if (space === "srgb") return fromLinear(toLinear(r), toLinear(g), toLinear(b), alpha)
      if (space === "srgb-linear") return fromLinear(r, g, b, alpha)
      if (space === "display-p3") {
        const [lr, lg, lb] = [r, g, b].map(toLinear)
        return fromLinear(
          1.2249401 * lr - 0.2249404 * lg,
          -0.0420569 * lr + 1.0420571 * lg,
          -0.0196376 * lr - 0.0786361 * lg + 1.0982735 * lb,
          alpha,
        )
      }
      return null
    }
  }
  return null
}

const hex2 = (n: number) =>
  Math.round(clamp(n, 0, 255))
    .toString(16)
    .padStart(2, "0")
const trim = (n: number, digits: number) => String(+n.toFixed(digits))

function toOklch({ r, g, b }: RGBA): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map((c) => toLinear(c / 255))
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(A, B)
  const H = C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return [L, C, H]
}

function toHsl({ r, g, b }: RGBA): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

/** A colour as the reader copies it. Alpha shows only when it is not 1. */
export function formatColor(c: RGBA, format: ColorFormat): string {
  const alpha = c.a < 1 ? ` / ${trim(c.a, 3)}` : ""
  switch (format) {
    case "hex":
      return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 ? hex2(c.a * 255) : ""}`
    case "rgb":
      return `rgb(${c.r} ${c.g} ${c.b}${alpha})`
    case "hsl": {
      const [h, s, l] = toHsl(c)
      return `hsl(${trim(h, 1)} ${trim(s * 100, 1)}% ${trim(l * 100, 1)}%${alpha})`
    }
    case "oklch": {
      const [L, C, H] = toOklch(c)
      return `oklch(${trim(L * 100, 1)}% ${trim(C, 3)} ${trim(H, 1)}${alpha})`
    }
  }
}

/** A computed colour as hex — `#rrggbb`, `#rrggbbaa` when translucent,
 * `transparent` at alpha 0. Anything unparseable passes through. */
export function hex(css: string): string {
  const c = parseColor(css)
  if (!c) return css
  return c.a === 0 ? "transparent" : formatColor(c, "hex")
}

/** `top` laid over `bottom` (straight alpha). */
export function over(top: RGBA, bottom: RGBA): RGBA {
  const a = top.a + bottom.a * (1 - top.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (t: number, b: number) => Math.round((t * top.a + b * bottom.a * (1 - top.a)) / a)
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a }
}

/** WCAG 2 relative luminance of an opaque colour. */
export function luminance({ r, g, b }: RGBA): number {
  const [R, G, B] = [r, g, b].map((c) => toLinear(c / 255))
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** WCAG 2 contrast ratio of `fg` over an opaque `bg` (1–21). */
export function contrast(fg: RGBA, bg: RGBA): number {
  const a = luminance(over(fg, { ...bg, a: 1 }))
  const b = luminance({ ...bg, a: 1 })
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** WCAG 2.2 text grades for a ratio: large text is ≥ 24px, or ≥ 18.66px bold. */
export function grade(ratio: number, large: boolean): { aa: boolean; aaa: boolean } {
  return { aa: ratio >= (large ? 3 : 4.5), aaa: ratio >= (large ? 4.5 : 7) }
}
