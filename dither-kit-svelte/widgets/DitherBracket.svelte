<script lang="ts" module>
  export type BracketMatch = { a: string; b: string; winner?: "a" | "b" }
</script>

<script lang="ts">
  import { cssColor } from "../engine/palette"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Knockout bracket — columns of matches with connector rails between
   * rounds. Winners carry the accent; when interactive, clicking a side
   * reports the pick and the consumer advances the data. */
  type Props = {
    /** rounds[r] is the list of matches in round r, left to right. */
    rounds: BracketMatch[][]
    color?: PixelColor
    /** Enables picking winners by click. */
    interactive?: boolean
    class?: string
    onpick?: (round: number, match: number, side: "a" | "b") => void
  }

  let { rounds, color = "green", interactive = false, class: className, onpick }: Props = $props()

  const accent = $derived(cssColor(color))

  const sideClass = (m: BracketMatch, side: "a" | "b") =>
    cn(
      "flex h-7 min-w-0 items-center gap-2 px-2.5 text-left text-[11px] transition-colors",
      m.winner === side ? "text-foreground" : m.winner ? "text-muted-foreground/50 line-through" : "text-muted-foreground",
      interactive && !m.winner && "cursor-pointer hover:bg-card/60 hover:text-foreground"
    )
</script>

{#snippet side(m: BracketMatch, r: number, i: number, which: "a" | "b")}
  {#if interactive && !m.winner}
    <button
      type="button"
      class={cn(sideClass(m, which), "w-full", which === "a" && "border-b border-border/40", CONTROL_BUTTON)}
      onclick={() => onpick?.(r, i, which)}
    >
      <span aria-hidden="true" class="size-1.5 shrink-0 rounded-[1px]" style:background="var(--border)"></span>
      <span class="min-w-0 flex-1 truncate">{which === "a" ? m.a : m.b}</span>
    </button>
  {:else}
    <div class={cn(sideClass(m, which), "w-full", which === "a" && "border-b border-border/40")}>
      <span
        aria-hidden="true"
        class="size-1.5 shrink-0 rounded-[1px]"
        style:background={m.winner === which ? accent : "var(--border)"}
      ></span>
      <span class="min-w-0 flex-1 truncate">{which === "a" ? m.a : m.b}</span>
      {#if m.winner === which}<span class="sr-only">winner</span>{/if}
    </div>
  {/if}
{/snippet}

<div class={cn("flex items-stretch gap-6 overflow-x-auto font-mono", className)} role="group" aria-label="Tournament bracket">
  {#each rounds as round, r (r)}
    <div class="flex min-w-36 flex-col justify-around gap-3">
      {#each round as m, i (i)}
        <div class="relative">
          <div class="overflow-hidden rounded-md border border-border/60 bg-background/60">
            {@render side(m, r, i, "a")}
            {@render side(m, r, i, "b")}
          </div>
          {#if r < rounds.length - 1}
            <span aria-hidden="true" class="absolute top-1/2 -right-6 h-px w-6 bg-border/60"></span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>
