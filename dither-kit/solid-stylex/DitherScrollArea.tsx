// Generated from ../solid/DitherScrollArea.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "../solid/DitherScrollArea.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { overflow: "auto" },
})

export type DitherScrollAreaProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

export default function DitherScrollArea(props: DitherScrollAreaProps) {
  return <div class={cn([styles.box, "dk-scroll"], props.xstyle, props.class)}>{props.children}</div>
}
