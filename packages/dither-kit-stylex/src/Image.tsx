// Generated from dither-kit/solid/Image.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"

type Own = {
  src: string
  alt: string
  loading?: "lazy" | "eager"
  decoding?: "async" | "auto" | "sync"
  class?: string
  xstyle?: StyleProp
}
const OWN = ["src", "alt", "loading", "decoding", "class", "xstyle"] as const satisfies readonly (keyof Own)[]

/** width/height and anything else an `<img>` takes reach the img. */
export type ImageProps = Own & Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, keyof Own>

/** Plain image primitive with the modern loading contract built in:
 * `loading="lazy"`, `decoding="async"`, and a required `alt` (empty string is
 * the explicit decorative choice — the type will not let you forget it).
 * width/height and anything else fall through to the img untouched. */
export default function Image(raw: ImageProps) {
  const merged = mergeProps({ loading: "lazy" as const, decoding: "async" as const }, raw)
  const [props, rest] = splitProps(merged, OWN)
  return (
    <img
      {...rest}
      src={props.src}
      alt={props.alt}
      loading={props.loading}
      decoding={props.decoding}
      class={cn(null, props.xstyle, props.class)}
    />
  )
}
