// Generated from @dither-ui/kit/solid/Link.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  a: {
    textDecorationLine: "underline",
    textDecorationColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 60%, transparent)",
      },
    },
    textUnderlineOffset: "4px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})

/** The anchor, dressed: house underline treatment (hairline, grows its
 * offset, brightens on hover) and inheritable color so it sits in prose. */
type Own = {
  href: string
  external?: boolean
  class?: string
  xstyle?: StyleProp
}
const OWN = ["href", "external", "class", "xstyle", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything an `<a>` takes (listeners, ARIA) reaches the anchor. */
export type LinkProps = Own & Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof Own>

export default function Link(raw: LinkProps) {
  const merged = mergeProps({ external: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  return (
    <a
      href={props.href}
      target={props.external ? "_blank" : undefined}
      rel={props.external ? "noreferrer" : undefined}
      {...rest}
      class={cn(styles.a, props.xstyle, props.class)}
    >
      {props.children}
    </a>
  )
}
