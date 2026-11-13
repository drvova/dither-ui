// Generated from dither-kit/solid/Text.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  tonesDefault: { color: "var(--foreground)" },
  tonesMuted: { color: "var(--muted-foreground)" },
  sizesXs: { fontSize: "11px" },
  sizesSm: { fontSize: "12px" },
  sizesMd: { fontSize: "13px" },
  sizesLg: { fontSize: "15px" },
})

/** Text primitive on the site's native type scale. `as` picks the element
 * (p default; span/h3/li/… for context), `tone` maps to the shadcn token
 * utilities (`faint` shares the muted ink: no text drops under AA), `size` to the 11–15px scale the docs use — anything else
 * (leading, tracking, weight) rides along in `class`. */
type Own = {
  as?: string
  tone?: "default" | "muted" | "faint"
  size?: "xs" | "sm" | "md" | "lg"
  class?: string
  xstyle?: StyleProp
}
const OWN = ["as", "tone", "size", "class", "xstyle", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything an element takes (an id, ARIA, listeners) reaches the element. */
export type TextProps = Own & Omit<JSX.HTMLAttributes<HTMLElement>, keyof Own>

const TONES = {
  default: styles.tonesDefault,
  muted: styles.tonesMuted,
  faint: styles.tonesMuted,
} as const

const SIZES = {
  xs: styles.sizesXs,
  sm: styles.sizesSm,
  md: styles.sizesMd,
  lg: styles.sizesLg,
} as const

export default function Text(raw: TextProps) {
  const merged = mergeProps({ as: "p", tone: "default" as const }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const classes = createMemo(() => cn(props.size && SIZES[props.size], TONES[props.tone], props.xstyle, props.class))

  return (
    <Dynamic component={props.as} {...rest} class={classes()}>
      {props.children}
    </Dynamic>
  )
}
