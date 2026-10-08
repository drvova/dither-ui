// The kit's theme from JavaScript: the custom properties theme.css declares,
// as an object any styling system can write — an inline style, a StyleX or
// vanilla-extract vars contract, a stylesheet string, or applied to an
// element at runtime. Components never read these from JS; their CSS does.

export const THEME_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "muted",
  "muted-foreground",
  "border",
  "ring",
  "accent",
  "accent-foreground",
  "radius",
  "font-sans",
  "font-mono",
  "swatch-green",
  "swatch-blue",
  "swatch-purple",
  "swatch-pink",
  "swatch-orange",
  "swatch-red",
  "swatch-grey",
] as const
export type ThemeToken = (typeof THEME_TOKENS)[number]
/** Token values as CSS text: a colour, a length, a font stack. */
export type ThemeInput = Partial<Record<ThemeToken, string>>
export type ThemeVars = Partial<Record<`--${ThemeToken}`, string>>

const known = new Set<string>(THEME_TOKENS)

/** Token overrides as custom properties; unknown keys and empty values drop. */
export function themeVars(theme: ThemeInput): ThemeVars {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme)) if (known.has(key) && typeof value === "string" && value.trim()) out[`--${key}`] = value.trim()
  return out as ThemeVars
}

/** A stylesheet block of overrides — `:root {}` by default, `.dark` for the dark values. */
export function themeCss(theme: ThemeInput, selector = ":root"): string {
  const lines = Object.entries(themeVars(theme)).map(([k, v]) => `  ${k}: ${v};`)
  return lines.length ? `${selector} {\n${lines.join("\n")}\n}\n` : ""
}

/** Write the overrides onto an element — the document root by default — and get the undo back. */
export function applyTheme(theme: ThemeInput, el: HTMLElement | null = typeof document !== "undefined" ? document.documentElement : null): () => void {
  if (!el) return () => {}
  const previous = new Map<string, string>()
  for (const [k, v] of Object.entries(themeVars(theme))) {
    previous.set(k, el.style.getPropertyValue(k))
    el.style.setProperty(k, v as string)
  }
  return () => {
    for (const [k, v] of previous) {
      if (v) el.style.setProperty(k, v)
      else el.style.removeProperty(k)
    }
  }
}
