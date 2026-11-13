// Generated from dither-kit/solid/ExternalLink.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { mergeProps, splitProps } from "solid-js"

import Icon from "./Icon"
import Link, { type LinkProps } from "./Link"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  icon: { flexShrink: "0", opacity: "70%" },
  link: { display: "inline-flex", alignItems: "center", gap: "0.25rem" },
})

/** External link: new-tab semantics done right (`target=_blank rel=noreferrer`)
 * plus the ExternalLink glyph after the label — the pattern every outbound
 * link in this kit follows. */
export type ExternalLinkProps = Omit<LinkProps, "external"> & { iconSize?: number }

export default function ExternalLink(raw: ExternalLinkProps) {
  const merged = mergeProps({ iconSize: 12 }, raw)
  const [props, rest] = splitProps(merged, ["iconSize", "class", "xstyle", "children"])
  return (
    <Link {...rest} external xstyle={[styles.link, props.xstyle, props.class]}>
      {props.children}
      <Icon name="ExternalLink" size={props.iconSize} xstyle={styles.icon} />
    </Link>
  )
}
