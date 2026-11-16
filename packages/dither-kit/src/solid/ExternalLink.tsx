import { mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"
import Icon from "./Icon"
import Link, { type LinkProps } from "./Link"

/** External link: new-tab semantics done right (`target=_blank rel=noreferrer`)
 * plus the ExternalLink glyph after the label — the pattern every outbound
 * link in this kit follows. */
export type ExternalLinkProps = Omit<LinkProps, "external"> & {
  /** @docs number (px) */
  iconSize?: number
}

export default function ExternalLink(raw: ExternalLinkProps) {
  const merged = mergeProps({ iconSize: 12 }, raw)
  const [props, rest] = splitProps(merged, ["iconSize", "class", "children"])
  return (
    <Link {...rest} external class={cn("inline-flex items-center gap-1", props.class)}>
      {props.children}
      <Icon name="ExternalLink" size={props.iconSize} class="shrink-0 opacity-70" />
    </Link>
  )
}
