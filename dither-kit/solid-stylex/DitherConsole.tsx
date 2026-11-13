// Generated from ../solid/DitherConsole.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { children, createEffect, createMemo, Index, type JSX, mergeProps, on, onMount, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "flex",
    height: "2rem",
    flexShrink: "0",
    alignItems: "center",
    gap: "0.5rem",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.75rem",
  },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "color-mix(in oklab, var(--muted-foreground) 50%, transparent)",
  },
  text2: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  row2: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem" },
  box: {
    minHeight: "0px",
    flex: "1",
    overflowY: "auto",
    padding: "0.75rem",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    lineHeight: "1.625",
  },
  p: { color: "var(--muted-foreground)" },
  p2: { display: "flex", gap: "0.5rem", whiteSpace: "pre-wrap" },
  text3: { flexShrink: "0", color: "var(--muted-foreground)", fontVariantNumeric: "   tabular-nums " },
  text4: {
    marginTop: "0.125rem",
    display: "inline-block",
    height: "0.75rem",
    width: "0.375rem",
    animation: {
      default: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    backgroundColor: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
  },
  stack: {
    display: "flex",
    minHeight: "0px",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
  },
})

export type ConsoleLevel = "info" | "success" | "warn" | "error"
export type ConsoleLine = { text: string; level?: ConsoleLevel; at?: string }

/** Monospace log surface — level-tinted lines, an optional blinking caret,
 * and follow mode that keeps the newest line in view. */
export type DitherConsoleProps = {
  lines?: (string | ConsoleLine)[]
  title?: string
  /** Pin the view to the newest line as output arrives. */
  follow?: boolean
  /** Blinking block caret after the last line (still under reduced motion). */
  caret?: boolean
  class?: string
  xstyle?: StyleProp
  /** Controls at the end of the title bar. */
  actions?: JSX.Element
}

const LEVEL_VAR: Record<ConsoleLevel, string> = {
  info: "var(--muted-foreground)",
  success: "var(--swatch-green, currentColor)",
  warn: "var(--swatch-orange, currentColor)",
  error: "var(--swatch-red, currentColor)",
}

const NO_LINES: (string | ConsoleLine)[] = []

export default function DitherConsole(raw: DitherConsoleProps) {
  const props = mergeProps({ lines: NO_LINES, title: "console", follow: true, caret: true }, raw)
  const actions = children(() => props.actions)
  let body: HTMLDivElement | undefined

  const rows = createMemo<ConsoleLine[]>(() => props.lines.map((l) => (typeof l === "string" ? { text: l } : l)))

  onMount(() => {
    createEffect(
      on(
        () => rows().length,
        () => {
          if (props.follow) queueMicrotask(() => body?.scrollTo({ top: body.scrollHeight }))
        },
        { defer: true },
      ),
    )
  })

  return (
    <div class={cn(styles.stack, props.xstyle, props.class)}>
      <div {...stylex.props(styles.row)}>
        <span {...stylex.props(styles.text)} aria-hidden="true" />
        <span {...stylex.props(styles.text2)}>{props.title}</span>
        <Show when={actions()}>
          <span {...stylex.props(styles.row2)}>{actions()}</span>
        </Show>
      </div>
      <div ref={(el) => (body = el)} role="log" aria-live="polite" {...stylex.props(styles.box)}>
        <Show when={!rows().length}>
          <p {...stylex.props(styles.p)}>No output yet.</p>
        </Show>
        <Index each={rows()}>
          {(l) => (
            <p {...stylex.props(styles.p2)}>
              <Show when={l().at}>
                <span {...stylex.props(styles.text3)}>{l().at}</span>
              </Show>
              <span style={{ color: LEVEL_VAR[l().level ?? "info"] }}>{l().text}</span>
            </p>
          )}
        </Index>
        <Show when={props.caret}>
          <span aria-hidden="true" {...stylex.props(styles.text4)} />
        </Show>
      </div>
    </div>
  )
}
