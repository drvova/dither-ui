import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"

/** The anchor, dressed: house underline treatment (hairline, grows its
 * offset, brightens on hover) and inheritable color so it sits in prose. */
type Own = {
  href: string
  external?: boolean
  class?: string
}
const OWN = ["href", "external", "class", "children"] as const satisfies readonly (keyof Own | "children")[]

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
      class={cn(
        "underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60",
        props.class,
      )}
    >
      {props.children}
    </a>
  )
}
