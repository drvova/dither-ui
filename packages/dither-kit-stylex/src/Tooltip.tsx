// Generated from @dither-ui/kit/solid/Tooltip.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps, Show } from "solid-js"
import { rgb } from "@dither-ui/kit/engine/palette.ts"
import { cn, type StyleProp } from "./lib"
import { chartLayer } from "./runtime/chart-layer"
import { useCommonChart } from "@dither-ui/kit/solid/runtime/common-context.ts"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/Tooltip.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    marginBottom: "0.125rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--muted-foreground)",
  },
  stack: { display: "flex", flexDirection: "column", gap: "0.125rem" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--popover-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "1px" },
  text2: { color: "var(--muted-foreground)" },
  text3: { marginLeft: "auto", paddingLeft: "0.5rem", color: "var(--foreground)" },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    zIndex: "10",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  variantDefault: { backgroundColor: "var(--popover)" },
  variantFrostedGlass: {
    backgroundColor: "color-mix(in oklab, var(--popover) 70%, transparent)",
    WebkitBackdropFilter: "blur(8px)        ",
    backdropFilter: "blur(8px)        ",
  },
})

export type TooltipVariant = "default" | "frosted-glass"

export type TooltipProps = {
  labelKey?: string
  valueFormatter?: (value: number, name: string) => string
  variant?: TooltipVariant
}

const VARIANT: Record<TooltipVariant, StyleProp> = {
  default: styles.variantDefault,
  "frosted-glass": styles.variantFrostedGlass,
}

export default function Tooltip(raw: TooltipProps) {
  const props = mergeProps({ variant: "default" as TooltipVariant }, raw)

  const chart = useCommonChart()
  const show = createMemo(() => chart.ready && chart.hoverIndex != null)

  // Retain the last hovered index so the card keeps its content while fading out.
  const index = createMemo<number>((last) => chart.hoverIndex ?? last, 0)
  const heading = createMemo(() => chart.heading(index(), props.labelKey))
  const items = createMemo(() => chart.itemsAt(index()))

  return chartLayer(
    "dom",
    <Presence when={show() && items().length > 0} name="dk-tooltip">
      <div
        class={cn([styles.layer, "dk-tooltip-card"], VARIANT[props.variant])}
        style={{
          top: `${chart.tooltipTop}px`,
          left: `${chart.tooltipLeft}px`,
          transform: "translate(-50%, -115%)",
        }}
      >
        <Show when={heading()}>
          <div {...stylex.props(styles.box)}>{heading()}</div>
        </Show>
        <div {...stylex.props(styles.stack)}>
          <For each={items()}>
            {(item) => (
              <div {...stylex.props(styles.row)} style={{ opacity: item.dimmed ? 0.4 : 1 }}>
                <span {...stylex.props(styles.text)} style={{ "background-color": rgb(item.seed.fill) }} />
                <span {...stylex.props(styles.text2)}>{item.label}</span>
                <span {...stylex.props(styles.text3)}>
                  {props.valueFormatter ? props.valueFormatter(item.value, item.name) : item.value.toLocaleString()}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </Presence>,
  )
}
