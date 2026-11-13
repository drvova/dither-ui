// Generated from ../solid/DitherDrawerIndent.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX } from "solid-js"
import { cn, type StyleProp } from "./lib"
import { DRAWER_CHANNEL } from "./DitherDrawer"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    transformOrigin: "top",
    transitionProperty: {
      default: "transform, filter, border-radius",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  scale098: { scale: "0.98", borderRadius: "0.75rem", filter: " brightness(75%)       " },
})

export type DitherDrawerIndentProps = { class?: string; xstyle?: StyleProp; children?: JSX.Element }

/** Wrap your app's main UI: it scales back while any root drawer inside is
 * open — the same channel nested drawers use, provided at app level. */
export default function DitherDrawerIndent(props: DitherDrawerIndentProps) {
  const [openCount, setOpenCount] = createSignal(0)
  return (
    <div class={cn(styles.box, openCount() > 0 ? styles.scale098 : null, props.xstyle, props.class)}>
      <DRAWER_CHANNEL.Provider value={{ notify: (d) => setOpenCount((n) => n + d) }}>
        {props.children}
      </DRAWER_CHANNEL.Provider>
    </div>
  )
}
