// Generated from @dither-ui/kit/solid/Legend.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For, mergeProps } from "solid-js"
import { Dynamic } from "solid-js/web"
import { rgb } from "@dither-ui/kit/engine/palette.ts"
import { cn } from "./lib"
import { chartLayer } from "./runtime/chart-layer"
import { useCommonChart } from "@dither-ui/kit/solid/runtime/common-context.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "1px" },
  row: {
    pointerEvents: "none",
    position: "absolute",
    insetInline: "0px",
    top: "0px",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    paddingInline: "0.25rem",
  },
  justifyEnd: { justifyContent: "flex-end" },
  justifyCenter: { justifyContent: "center" },
  justifyStart: { justifyContent: "flex-start" },
  dynamic: {
    marginBlock: "-0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    paddingBlock: "0.25rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--muted-foreground)",
    transitionProperty: "opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  pointerEventsAuto: {
    pointerEvents: "auto",
    cursor: "pointer",
    color: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" } },
  },
  opacity40: { opacity: "40%" },
})

export type LegendProps = {
  isClickable?: boolean
  align?: "left" | "center" | "right"
}

export default function Legend(raw: LegendProps) {
  const props = mergeProps({ isClickable: false, align: "right" as const }, raw)

  const chart = useCommonChart()

  function dimmed(name: string): boolean {
    const emphasis = chart.selectedDataKey ?? chart.focusDataKey
    return emphasis !== null && emphasis !== name
  }

  return chartLayer(
    "dom",
    <div
      class={cn(
        styles.row,
        props.align === "right" && styles.justifyEnd,
        props.align === "center" && styles.justifyCenter,
        props.align === "left" && styles.justifyStart,
      )}
    >
      {/* A key you can press is a button; a plain key is a label, never a
          disabled button. The padding pulled back by the margin gives the
          button a 24px target without moving a pixel. */}
      <For each={chart.names}>
        {(name) => (
          <Dynamic
            component={props.isClickable ? "button" : "span"}
            type={props.isClickable ? "button" : undefined}
            class={cn(styles.dynamic, props.isClickable && styles.pointerEventsAuto, dimmed(name) && styles.opacity40)}
            onClick={() => props.isClickable && chart.selectDataKey(chart.selectedDataKey === name ? null : name)}
            onPointerEnter={() => chart.setFocusDataKey(name)}
            onPointerLeave={() => chart.setFocusDataKey(null)}
            onFocus={() => chart.setFocusDataKey(name)}
            onBlur={() => chart.setFocusDataKey(null)}
          >
            <span {...stylex.props(styles.text)} style={{ "background-color": rgb(chart.seedOf(name).fill) }} />
            {chart.labelOf(name)}
          </Dynamic>
        )}
      </For>
    </div>,
  )
}
