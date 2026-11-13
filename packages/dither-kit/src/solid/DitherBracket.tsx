import { createMemo, For, mergeProps, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

export type BracketMatch = { a: string; b: string; winner?: "a" | "b" }

/** Knockout bracket — columns of matches with connector rails between
 * rounds. Winners carry the accent; when interactive, clicking a side
 * reports the pick and the consumer advances the data. */
export type DitherBracketProps = {
  /** rounds[r] is the list of matches in round r, left to right. */
  rounds: BracketMatch[][]
  color?: PixelColor
  /** Enables picking winners by click. */
  interactive?: boolean
  class?: string
  onPick?: (round: number, match: number, side: "a" | "b") => void
}

export default function DitherBracket(raw: DitherBracketProps) {
  const props = mergeProps({ color: "green" as PixelColor, interactive: false }, raw)

  const accent = createMemo(() => cssColor(props.color))

  const sideClass = (m: BracketMatch, side: "a" | "b") => [
    "flex h-7 min-w-0 items-center gap-2 px-2.5 text-left text-[11px] transition-colors",
    m.winner === side ? "text-foreground" : m.winner ? "text-muted-foreground line-through" : "text-muted-foreground",
    props.interactive && !m.winner && "cursor-pointer hover:bg-card/60 hover:text-foreground",
  ]

  const side = (m: BracketMatch, r: number, i: number, which: "a" | "b") => {
    const open = () => props.interactive && !m.winner
    return (
      <Dynamic
        component={open() ? "button" : "div"}
        type={open() ? "button" : undefined}
        class={cn(sideClass(m, which), "w-full", which === "a" && "border-b border-border/40", CONTROL_BUTTON)}
        onClick={() => open() && props.onPick?.(r, i, which)}
      >
        <span
          aria-hidden="true"
          class="size-1.5 shrink-0 rounded-[1px]"
          style={{ background: m.winner === which ? accent() : "var(--border)" }}
        />
        <span class="min-w-0 flex-1 truncate">{m[which]}</span>
        <Show when={m.winner === which}>
          <span class="sr-only">winner</span>
        </Show>
      </Dynamic>
    )
  }

  return (
    <div
      class={cn("flex items-stretch gap-6 overflow-x-auto font-mono", props.class)}
      role="group"
      aria-label="Tournament bracket"
    >
      <For each={props.rounds}>
        {(round, r) => (
          <div class="flex min-w-36 flex-col justify-around gap-3">
            <For each={round}>
              {(m, i) => (
                <div class="relative">
                  <div class="overflow-hidden rounded-md border border-border/60 bg-background/60">
                    {side(m, r(), i(), "a")}
                    {side(m, r(), i(), "b")}
                  </div>
                  <Show when={r() < props.rounds.length - 1}>
                    <span aria-hidden="true" class="absolute top-1/2 -right-6 h-px w-6 bg-border/60" />
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
