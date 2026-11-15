import { createMutable } from "solid-js/store"
import { createEffect, createSignal, For, on, Show } from "solid-js"
import { DitherAvatar, DitherButton, DitherInput } from "@dither-kit"

/* Team channel — flat rows, author grouping, toggleable reactions */
type ChannelMsg = {
  author: string
  color: "blue" | "green" | "purple"
  text: string
  at: string
  reactions: { label: string; count: number; mine: boolean }[]
}

const CHANNEL: ChannelMsg[] = [
  {
    author: "Rei Toma",
    color: "purple",
    text: "Palette v3 is in staging. Poke at the orange ramp.",
    at: "09:12",
    reactions: [{ label: "+1", count: 2, mine: false }],
  },
  {
    author: "Rei Toma",
    color: "purple",
    text: "Charts pick it up automatically, no prop changes.",
    at: "09:12",
    reactions: [],
  },
  {
    author: "Kai Raster",
    color: "green",
    text: "Export bug #214 is reproduced. Fix lands today.",
    at: "09:20",
    reactions: [{ label: "ship it", count: 1, mine: false }],
  },
  { author: "You", color: "blue", text: "I will take the docs pass once both land.", at: "09:24", reactions: [] },
]

export default function Example() {
  const channelMessages = createMutable<ChannelMsg[]>(structuredClone(CHANNEL))
  const [channelDraft, setChannelDraft] = createSignal("")
  let channelScroller: HTMLDivElement | undefined
  const stamp = () => new Date().toTimeString().slice(0, 5)
  createEffect(
    on(
      () => channelMessages.length,
      () => queueMicrotask(() => channelScroller?.scrollTo({ top: channelScroller.scrollHeight })),
      { defer: true },
    ),
  )
  /** Consecutive rows from one author collapse: avatar and name print once. */
  const grouped = (i: number) => i > 0 && channelMessages[i - 1].author === channelMessages[i].author
  function channelPost() {
    const text = channelDraft().trim()
    if (!text) return
    channelMessages.push({ author: "You", color: "blue", text, at: stamp(), reactions: [] })
    setChannelDraft("")
  }
  function react(m: ChannelMsg, label: string) {
    const r = m.reactions.find((x) => x.label === label)
    if (!r) {
      m.reactions.push({ label, count: 1, mine: true })
      return
    }
    r.mine = !r.mine
    r.count += r.mine ? 1 : -1
    if (r.count <= 0) m.reactions.splice(m.reactions.indexOf(r), 1)
  }

  // a row by the author above it joins their group: avatar and name print once
  return (
    <div class="mx-auto flex h-96 max-w-lg flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <span class="text-[12px] text-foreground">#dither-dev</span>
        <span class="ml-auto text-[10px] tabular-nums text-muted-foreground">4 members</span>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto p-3" ref={(el) => (channelScroller = el)}>
        <div class="pb-2 text-center text-[11px] text-muted-foreground">Today</div>
        <For each={channelMessages}>
          {(m, i) => (
            <div
              class={`flex gap-2.5 rounded-md px-1.5 transition-colors hover:bg-card/40 ${grouped(i()) ? "py-0.5" : "pt-2.5 pb-0.5"}`}
            >
              <Show when={!grouped(i())} fallback={<div class="w-6 shrink-0" aria-hidden="true" />}>
                <DitherAvatar class="mt-0.5 shrink-0" name={m.author} size={24} color={m.color} />
              </Show>
              <div class="min-w-0 flex-1">
                <Show when={!grouped(i())}>
                  <p class="flex items-baseline gap-2">
                    <span class="text-[11px] text-foreground">{m.author}</span>
                    <time class="text-[9px] tabular-nums text-muted-foreground">{m.at}</time>
                  </p>
                </Show>
                <p class="text-[11px] leading-relaxed text-muted-foreground">{m.text}</p>
                <Show when={m.reactions.length}>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <For each={m.reactions}>
                      {(r) => (
                        <button
                          class={`rounded-full border px-1.5 py-px text-[9px] tabular-nums transition-colors ${
                            r.mine
                              ? "border-accent/50 bg-accent/10 text-foreground"
                              : "border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                          type="button"
                          aria-pressed={r.mine}
                          onClick={() => react(m, r.label)}
                        >
                          {r.label} {r.count}
                        </button>
                      )}
                    </For>
                    <button
                      class="rounded-full border border-border/60 px-1.5 py-px text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                      type="button"
                      aria-label="Add reaction"
                      onClick={() => react(m, "+1")}
                    >
                      +
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
      <form
        class="flex shrink-0 items-center gap-2 border-t border-border/60 p-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          channelPost()
        }}
      >
        <DitherInput
          class="min-w-0 flex-1 text-[11px]"
          modelValue={channelDraft()}
          onUpdateModelValue={setChannelDraft}
          placeholder="Message #dither-dev…"
        />
        <DitherButton class="shrink-0 px-3 py-1.5 text-[11px]" color="blue" disabled={!channelDraft().trim()}>
          Post
        </DitherButton>
      </form>
    </div>
  )
}
