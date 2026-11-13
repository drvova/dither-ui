// Generated from ../solid/DitherStepper.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { For, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherSeparator from "./DitherSeparator"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  li: { display: "flex", flex: "1", flexDirection: "column", alignItems: "center" },
  row: { display: "flex", width: "100%", alignItems: "center" },
  text: { flex: "1" },
  svg: { width: "0.875rem", height: "0.875rem" },
  text2: { textAlign: "center", fontSize: "11px", color: "var(--muted-foreground)" },
  ol: { display: "flex", alignItems: "flex-start" },
  separator: { flex: "1", opacity: "30%" },
  row2: {
    display: "inline-flex",
    width: "1.75rem",
    height: "1.75rem",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    fontSize: "11px",
    fontVariantNumeric: "   tabular-nums ",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  borderForeground30: {
    borderColor: "color-mix(in oklab, var(--foreground) 30%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
    color: "var(--foreground)",
  },
  borderForeground: {
    borderColor: "var(--foreground)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  borderBorder: { borderColor: "var(--border)", color: "var(--muted-foreground)" },
  opacity30: { opacity: "30%" },
  text3: { marginTop: "0.5rem", textAlign: "center", fontSize: "12px" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
})

export type Step = { label: string; hint?: string }

export type DitherStepperProps = {
  steps: Step[]
  current: number // index of the active step
  class?: string
  xstyle?: StyleProp
}

export default function DitherStepper(props: DitherStepperProps) {
  const state = (i: number) => (i < props.current ? "done" : i === props.current ? "active" : "todo")

  return (
    <ol class={cn(styles.ol, props.xstyle, props.class)} role="list" aria-label="Progress">
      <For each={props.steps}>
        {(s, i) => (
          <li {...stylex.props(styles.li)} aria-current={i() === props.current ? "step" : undefined}>
            <div {...stylex.props(styles.row)}>
              <Show when={i() > 0} fallback={<span {...stylex.props(styles.text)} />}>
                <DitherSeparator xstyle={state(i()) === "todo" ? styles.separator : styles.text} />
              </Show>
              <span
                class={cn(
                  styles.row2,
                  state(i()) === "done" && styles.borderForeground30,
                  state(i()) === "active" && styles.borderForeground,
                  state(i()) === "todo" && styles.borderBorder,
                )}
              >
                <Show when={state(i()) === "done"} fallback={i() + 1}>
                  <svg
                    viewBox="0 0 24 24"
                    {...stylex.props(styles.svg)}
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </Show>
              </span>
              <Show when={i() < props.steps.length - 1} fallback={<span {...stylex.props(styles.text)} />}>
                <DitherSeparator
                  xstyle={[
                    styles.text,
                    ((state(i() + 1) === "todo" && state(i()) !== "active") || state(i()) === "todo") &&
                      styles.opacity30,
                  ]}
                />
              </Show>
            </div>
            <span class={cn(styles.text3, i() === props.current ? styles.textForeground : styles.textMutedForeground)}>
              {s.label}
            </span>
            <Show when={s.hint}>
              <span {...stylex.props(styles.text2)}>{s.hint}</span>
            </Show>
          </li>
        )}
      </For>
    </ol>
  )
}
