import { children, createEffect, createMemo, Index, type JSX, mergeProps, on, onMount, Show } from "solid-js"
import { cn } from "../tailwind/lib"

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
    <div
      class={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/60",
        props.class,
      )}
    >
      <div class="flex h-8 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <span class="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
        <span class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{props.title}</span>
        <Show when={actions()}>
          <span class="ml-auto flex items-center gap-1.5">{actions()}</span>
        </Show>
      </div>
      <div
        ref={(el) => (body = el)}
        role="log"
        aria-live="polite"
        class="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed"
      >
        <Show when={!rows().length}>
          <p class="text-muted-foreground">No output yet.</p>
        </Show>
        <Index each={rows()}>
          {(l) => (
            <p class="flex gap-2 whitespace-pre-wrap">
              <Show when={l().at}>
                <span class="shrink-0 text-muted-foreground tabular-nums">{l().at}</span>
              </Show>
              <span style={{ color: LEVEL_VAR[l().level ?? "info"] }}>{l().text}</span>
            </p>
          )}
        </Index>
        <Show when={props.caret}>
          <span
            aria-hidden="true"
            class="mt-0.5 inline-block h-3 w-1.5 animate-pulse bg-muted-foreground/70 motion-reduce:animate-none"
          />
        </Show>
      </div>
    </div>
  )
}
