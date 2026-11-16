// Generated from @dither-ui/kit/solid/DitherSchedule.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps, Show } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", width: "2.5rem", flexShrink: "0", textAlign: "right" },
  layer: {
    position: "absolute",
    right: "0px",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    fontSize: "9px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  frame2: {
    position: "relative",
    minHeight: "12rem",
    flex: "1",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
  },
  layer2: {
    position: "absolute",
    insetInline: "0px",
    height: "1px",
    backgroundColor: "color-mix(in oklab, var(--border) 30%, transparent)",
  },
  layer3: {
    position: "absolute",
    insetInline: "0.375rem",
    overflow: "hidden",
    borderRadius: "4px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
  },
  layer4: { position: "absolute", insetBlock: "0px", left: "0px", width: "2px" },
  p: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: "0.375rem",
    fontSize: "10px",
    color: "var(--foreground)",
  },
  p2: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: "0.375rem",
    fontSize: "9px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  layer5: { position: "absolute", insetInline: "0px", zIndex: "10" },
  layer6: {
    position: "absolute",
    top: "-3px",
    left: "0px",
    width: "7px",
    height: "7px",
    borderRadius: "calc(infinity * 1px)",
  },
  text: { display: "block", height: "1px", width: "100%" },
  text2: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  row: { display: "flex", gap: "0.5rem", fontFamily: "var(--font-mono)" },
})

export type ScheduleEvent = { start: number; end: number; label: string; color?: PixelColor }

/** Day timeline — an hour rail with events placed proportionally, and an
 * optional now line. Hours are fractional (9.5 is half past nine). */
export type DitherScheduleProps = {
  /** @docs { start, end, label, color? }[]: fractional hours
   * @default required */
  events: ScheduleEvent[]
  /** Day window, fractional hours.
   * @docs number: day window */
  from?: number
  /** @docs number: day window */
  to?: number
  /** Draw the now line at this hour; omit to hide.
   * @docs number: draws the now line; omit to hide
   * @default undefined */
  now?: number
  class?: string
  xstyle?: StyleProp
}

export default function DitherSchedule(raw: DitherScheduleProps) {
  const props = mergeProps({ from: 8, to: 18 }, raw)

  const span = createMemo(() => Math.max(1, props.to - props.from))
  const pct = (h: number) => `${((Math.min(Math.max(h, props.from), props.to) - props.from) / span()) * 100}%`
  const hours = createMemo(() =>
    Array.from({ length: Math.floor(props.to) - Math.ceil(props.from) + 1 }, (_, i) => Math.ceil(props.from) + i),
  )
  const fmt = (h: number) =>
    `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
  const now = () =>
    props.now !== undefined && props.now >= props.from && props.now <= props.to ? props.now : undefined

  return (
    <div class={cn(styles.row, props.xstyle, props.class)} role="group" aria-label="Day schedule">
      <div {...stylex.props(styles.frame)} aria-hidden="true">
        <For each={hours()}>
          {(h) => (
            <span {...stylex.props(styles.layer)} style={{ top: pct(h) }}>
              {String(h).padStart(2, "0")}
            </span>
          )}
        </For>
      </div>
      <div {...stylex.props(styles.frame2)}>
        <For each={hours()}>
          {(h) => <span aria-hidden="true" {...stylex.props(styles.layer2)} style={{ top: pct(h) }} />}
        </For>
        <For each={props.events}>
          {(e) => (
            <div
              {...stylex.props(styles.layer3)}
              style={{
                top: pct(e.start),
                height: `calc(${((Math.min(e.end, props.to) - Math.max(e.start, props.from)) / span()) * 100}% - 2px)`,
              }}
            >
              <span
                aria-hidden="true"
                {...stylex.props(styles.layer4)}
                style={{ background: cssColor(e.color ?? "blue") }}
              />
              <p {...stylex.props(styles.p)}>{e.label}</p>
              <p {...stylex.props(styles.p2)}>
                {fmt(e.start)}–{fmt(e.end)}
              </p>
            </div>
          )}
        </For>
        <Show when={now() !== undefined}>
          <div {...stylex.props(styles.layer5)} style={{ top: pct(now()!) }} role="presentation">
            <span {...stylex.props(styles.layer6)} style={{ background: cssColor("red") }} aria-hidden="true" />
            <span {...stylex.props(styles.text)} style={{ background: cssColor("red") }} aria-hidden="true" />
            <span {...stylex.props(styles.text2)}>Current time {fmt(now()!)}</span>
          </div>
        </Show>
      </div>
    </div>
  )
}
