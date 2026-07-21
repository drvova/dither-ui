<script lang="ts" module>
  export type ConsoleLevel = "info" | "success" | "warn" | "error"
  export type ConsoleLine = { text: string; level?: ConsoleLevel; at?: string }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  /** Monospace log surface — level-tinted lines, an optional blinking caret,
   * and follow mode that keeps the newest line in view. */
  type Props = {
    lines?: (string | ConsoleLine)[]
    title?: string
    /** Pin the view to the newest line as output arrives. */
    follow?: boolean
    /** Blinking block caret after the last line (still under reduced motion). */
    caret?: boolean
    class?: string
    actions?: Snippet
  }

  let { lines = [], title = "console", follow = true, caret = true, class: className, actions }: Props = $props()

  const rows = $derived(lines.map((l) => (typeof l === "string" ? { text: l } : l)) as ConsoleLine[])

  const LEVEL_VAR: Record<ConsoleLevel, string> = {
    info: "var(--muted-foreground)",
    success: "var(--swatch-green, currentColor)",
    warn: "var(--swatch-orange, currentColor)",
    error: "var(--swatch-red, currentColor)",
  }

  /** Follow-mode scroll lives in an action: `update` fires when params change. */
  function followBottom(node: HTMLElement, params: { count: number; follow: boolean }) {
    const pin = (p: { count: number; follow: boolean }) => {
      if (p.follow) requestAnimationFrame(() => node.scrollTo({ top: node.scrollHeight }))
    }
    pin(params)
    return { update: pin }
  }
</script>

<div class={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/60", className)}>
  <div class="flex h-8 shrink-0 items-center gap-2 border-b border-border/60 px-3">
    <span class="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true"></span>
    <span class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{title}</span>
    {#if actions}
      <span class="ml-auto flex items-center gap-1.5">
        {@render actions()}
      </span>
    {/if}
  </div>
  <div
    role="log"
    aria-live="polite"
    class="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed"
    use:followBottom={{ count: rows.length, follow }}
  >
    {#if !rows.length}
      <p class="text-muted-foreground/50">No output yet.</p>
    {/if}
    {#each rows as l, i (i)}
      <p class="flex gap-2 whitespace-pre-wrap">
        {#if l.at}
          <span class="shrink-0 text-muted-foreground/40 tabular-nums">{l.at}</span>
        {/if}
        <span style:color={LEVEL_VAR[l.level ?? "info"]}>{l.text}</span>
      </p>
    {/each}
    {#if caret}
      <span
        aria-hidden="true"
        class="mt-0.5 inline-block h-3 w-1.5 animate-pulse bg-muted-foreground/70 motion-reduce:animate-none"
      ></span>
    {/if}
  </div>
</div>
