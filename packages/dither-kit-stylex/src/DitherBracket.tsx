// Generated from @dither-ui/kit/solid/DitherBracket.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { width: "0.375rem", height: "0.375rem", flexShrink: "0", borderRadius: "1px" },
  text2: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text3: {
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
  stack: {
    display: "flex",
    minWidth: "9rem",
    flexDirection: "column",
    justifyContent: "space-around",
    gap: "0.75rem",
  },
  frame: { position: "relative" },
  box: {
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
  },
  layer: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "-1.5rem",
    height: "1px",
    width: "1.5rem",
    backgroundColor: "color-mix(in oklab, var(--border) 60%, transparent)",
  },
  dynamic: { width: "100%" },
  borderB: {
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
  },
  row: {
    display: "flex",
    alignItems: "stretch",
    gap: "1.5rem",
    overflowX: "auto",
    fontFamily: "var(--font-mono)",
  },
  sideClass: {
    display: "flex",
    height: "1.75rem",
    minWidth: "0px",
    alignItems: "center",
    gap: "0.5rem",
    paddingInline: "0.625rem",
    textAlign: "left",
    fontSize: "11px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)", textDecorationLine: "line-through" },
  textMutedForeground2: { color: "var(--muted-foreground)" },
  cursorPointer: {
    cursor: "pointer",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
    color: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" } },
  },
})

export type BracketMatch = { a: string; b: string; winner?: "a" | "b" }

/** Knockout bracket — columns of matches with connector rails between
 * rounds. Winners carry the accent; when interactive, clicking a side
 * reports the pick and the consumer advances the data. */
export type DitherBracketProps = {
  /** rounds[r] is the list of matches in round r, left to right.
   * @docs { a, b, winner? }[][]: columns left to right
   * @default required */
  rounds: BracketMatch[][]
  /** @docs PixelColor: winner accent */
  color?: PixelColor
  /** Enables picking winners by click.
   * @docs boolean: click a side to pick */
  interactive?: boolean
  class?: string
  xstyle?: StyleProp
  /** @docs (round, match, side): consumer advances the data */
  onPick?: (round: number, match: number, side: "a" | "b") => void
}

export default function DitherBracket(raw: DitherBracketProps) {
  const props = mergeProps({ color: "green" as PixelColor, interactive: false }, raw)

  const accent = createMemo(() => cssColor(props.color))

  const sideClass = (m: BracketMatch, side: "a" | "b") => [
    styles.sideClass,
    m.winner === side ? styles.textForeground : m.winner ? styles.textMutedForeground : styles.textMutedForeground2,
    props.interactive && !m.winner && styles.cursorPointer,
  ]

  const side = (m: BracketMatch, r: number, i: number, which: "a" | "b") => {
    const open = () => props.interactive && !m.winner
    return (
      <Dynamic
        component={open() ? "button" : "div"}
        type={open() ? "button" : undefined}
        class={cn(sideClass(m, which), styles.dynamic, which === "a" && styles.borderB, CONTROL_BUTTON)}
        onClick={() => open() && props.onPick?.(r, i, which)}
      >
        <span
          aria-hidden="true"
          {...stylex.props(styles.text)}
          style={{ background: m.winner === which ? accent() : "var(--border)" }}
        />
        <span {...stylex.props(styles.text2)}>{m[which]}</span>
        <Show when={m.winner === which}>
          <span {...stylex.props(styles.text3)}>winner</span>
        </Show>
      </Dynamic>
    )
  }

  return (
    <div class={cn(styles.row, props.xstyle, props.class)} role="group" aria-label="Tournament bracket">
      <For each={props.rounds}>
        {(round, r) => (
          <div {...stylex.props(styles.stack)}>
            <For each={round}>
              {(m, i) => (
                <div {...stylex.props(styles.frame)}>
                  <div {...stylex.props(styles.box)}>
                    {side(m, r(), i(), "a")}
                    {side(m, r(), i(), "b")}
                  </div>
                  <Show when={r() < props.rounds.length - 1}>
                    <span aria-hidden="true" {...stylex.props(styles.layer)} />
                  </Show>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  )
}
