// Generated from ../solid/Thumbnail.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "../solid/Thumbnail.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    position: "absolute",
    inset: "0px",
    display: "block",
    overflow: "hidden",
    borderRadius: "inherit",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
  },
  img: {
    height: "100%",
    width: "100%",
    objectFit: "cover",
    opacity: "70%",
    transitionProperty: { default: "opacity, scale", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
    transitionDuration: "300ms",
  },
  layer2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    opacity: "100%",
    transitionProperty: { default: "opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
    transitionDuration: "300ms",
  },
  a: {
    position: "relative",
    display: "block",
    cursor: "zoom-in",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    outlineStyle: "none",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) var(--ring)",
    },
  },
})

// The interactive thumbnail: a parent link is the trigger, a masked frame
// (radius + hairline border + overflow hidden) holds a cover-fit image that
// rests recessed — 70% opacity under a Bayer dot veil — and on hover the
// whole thing wakes: the image scales up a touch while fading to full
// opacity as the veil dissolves. One transition block, interruptible mid-
// flight, clipped by the frame so the zoom never escapes it. zoom-in cursor
// announces the affordance before the first pixel moves.
type Own = {
  src: string
  alt: string
  href: string
  /** aspect ratio of the frame, width/height — the house default is phi. */
  ratio?: string
  /** dither veil cell size in css px. */
  veilCell?: number
  class?: string
  xstyle?: StyleProp
}
const OWN = ["src", "alt", "href", "ratio", "veilCell", "class", "xstyle"] as const satisfies readonly (keyof Own)[]

/** Everything an `<a>` takes (listeners, ARIA) reaches the link. */
export type ThumbnailProps = Own & Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof Own | "children">

export default function Thumbnail(raw: ThumbnailProps) {
  const merged = mergeProps({ ratio: "1.618", veilCell: 4 }, raw)
  const [props, rest] = splitProps(merged, OWN)

  return (
    <a
      {...rest}
      href={props.href}
      aria-label={props.alt}
      class={cn([styles.a, "dk-thumb"], props.xstyle, props.class)}
      style={{ "aspect-ratio": props.ratio }}
    >
      <span {...stylex.props(styles.layer)}>
        <img src={props.src} alt={props.alt} loading="lazy" decoding="async" class={cn(styles.img, "dk-thumb-img")} />
        {/* The recessed veil: the house Bayer lattice as a dot overlay. It is
            what makes the resting state feel sunk into the page rather than
            merely dimmed, and it dissolves as the image wakes. */}
        <span
          aria-hidden="true"
          class={cn(styles.layer2, "dither-veil")}
          style={{ "background-size": `${props.veilCell * 4}px ${props.veilCell * 4}px` }}
        />
      </span>
    </a>
  )
}
