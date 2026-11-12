import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./Thumbnail.css"

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
}
const OWN = ["src", "alt", "href", "ratio", "veilCell", "class"] as const satisfies readonly (keyof Own)[]

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
      class={cn(
        "dk-thumb relative block cursor-zoom-in overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        props.class,
      )}
      style={{ "aspect-ratio": props.ratio }}
    >
      <span class="absolute inset-0 block overflow-hidden rounded-[inherit] border border-border/70">
        <img
          src={props.src}
          alt={props.alt}
          loading="lazy"
          decoding="async"
          class="dk-thumb-img h-full w-full object-cover opacity-70 transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        />
        {/* The recessed veil: the house Bayer lattice as a dot overlay. It is
            what makes the resting state feel sunk into the page rather than
            merely dimmed, and it dissolves as the image wakes. */}
        <span
          aria-hidden="true"
          class="dither-veil pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ "background-size": `${props.veilCell * 4}px ${props.veilCell * 4}px` }}
        />
      </span>
    </a>
  )
}
