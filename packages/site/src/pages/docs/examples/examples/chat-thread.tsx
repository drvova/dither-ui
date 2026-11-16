import { createMutable } from "solid-js/store"
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from "solid-js"
import { DitherAvatar, DitherBadge, DitherButton, DitherInput } from "@dither-kit"

type Msg = { from: "me" | "them"; text: string; at: string }

type Thread = {
  id: string
  name: string
  color: "green" | "purple" | "blue"
  unread: number
  replies: string[]
  messages: Msg[]
}

const THREADS: Thread[] = [
  {
    id: "rei",
    name: "Rei Toma",
    color: "purple",
    unread: 0,
    replies: ["On it. Give me ten minutes.", "Pushed. Check the preview link."],
    messages: [
      { from: "them", text: "Morning. The new palette landed in staging.", at: "09:12" },
      { from: "me", text: "Saw it. The green reads much better on dark.", at: "09:14" },
      { from: "them", text: "Agreed. I still want to tune the orange ramp.", at: "09:15" },
    ],
  },
  {
    id: "kai",
    name: "Kai Raster",
    color: "green",
    unread: 2,
    replies: ["Ticket closed. Customer confirmed.", "Done. Anything else today?"],
    messages: [
      { from: "them", text: "Two tickets left in the queue.", at: "08:40" },
      { from: "them", text: "One looks like the export bug again.", at: "08:41" },
    ],
  },
]

export default function Example() {
  const threads = createMutable<Thread[]>(structuredClone(THREADS))
  const [activeId, setActiveId] = createSignal("rei")
  const active = createMemo(() => threads.find((t) => t.id === activeId())!)
  function openThread(id: string) {
    setActiveId(id)
    const t = threads.find((x) => x.id === id)
    if (t) t.unread = 0
  }
  const [draft, setDraft] = createSignal("")
  let scroller: HTMLDivElement | undefined
  const stamp = () => new Date().toTimeString().slice(0, 5)
  const [typing, setTyping] = createSignal(false)
  /** The chat stays pinned to the newest message: on send, reply, typing and thread switch. */
  createEffect(
    on(
      [() => active().messages.length, typing, activeId],
      () => queueMicrotask(() => scroller?.scrollTo({ top: scroller.scrollHeight })),
      { defer: true },
    ),
  )
  let timer = 0
  onCleanup(() => clearTimeout(timer))
  function send() {
    const text = draft().trim()
    if (!text || typing()) return
    const t = active()
    t.messages.push({ from: "me", text, at: stamp() })
    setDraft("")
    setTyping(true)
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      t.messages.push({ from: "them", text: t.replies[t.messages.length % t.replies.length], at: stamp() })
      setTyping(false)
    }, 1200)
  }

  return (
    <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <aside class="flex w-52 shrink-0 flex-col border-r border-border/60" aria-label="Conversations">
        <div class="border-b border-border/60 p-2.5 text-[11px] text-muted-foreground">Messages</div>
        <div class="grid content-start gap-0.5 p-1.5">
          <For each={threads}>
            {(t) => (
              <button
                class={`flex min-w-0 items-center gap-2 rounded-md p-2 text-left transition-colors ${activeId() === t.id ? "bg-card" : "hover:bg-card/60"}`}
                type="button"
                aria-pressed={activeId() === t.id}
                onClick={() => openThread(t.id)}
              >
                <DitherAvatar name={t.name} size={24} color={t.color} />
                <span class="min-w-0 flex-1 leading-tight">
                  <span class="block truncate text-[11px] text-foreground">{t.name}</span>
                  <span class="block truncate text-[10px] text-muted-foreground">
                    {t.messages[t.messages.length - 1].text}
                  </span>
                </span>
                <Show when={t.unread}>
                  <DitherBadge class="shrink-0 text-[9px]" color="green">
                    {t.unread}
                  </DitherBadge>
                </Show>
              </button>
            )}
          </For>
        </div>
      </aside>
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
          <DitherAvatar name={active().name} size={20} color={active().color} />
          <span class="text-[12px] text-foreground">{active().name}</span>
          <span class="ml-auto text-[10px] text-muted-foreground">today</span>
        </div>
        <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3" ref={(el) => (scroller = el)}>
          <For each={active().messages}>
            {(m) => (
              <div class={`flex items-end gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <Show when={m.from === "them"}>
                  <DitherAvatar class="shrink-0" name={active().name} size={20} color={active().color} />
                </Show>
                <div
                  class={`max-w-[75%] rounded-lg border px-2.5 py-1.5 ${m.from === "me" ? "border-accent/40 bg-accent/10" : "border-border/60 bg-card/40"}`}
                >
                  <p class="text-[11px] leading-relaxed text-foreground">{m.text}</p>
                  <span class="mt-0.5 block text-right text-[9px] text-muted-foreground tabular-nums">{m.at}</span>
                </div>
              </div>
            )}
          </For>
          <Show when={typing()}>
            <div class="flex items-end gap-2" aria-live="polite">
              <DitherAvatar class="shrink-0" name={active().name} size={20} color={active().color} />
              <div class="rounded-lg border border-border/60 bg-card/40 px-2.5 py-2" aria-label="Typing">
                <span class="flex gap-1">
                  <For each={Array.from({ length: 3 }, (_, k) => k + 1)}>
                    {(d) => (
                      <span
                        class="size-1 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                        style={{ "animation-delay": `${d * 150}ms` }}
                      />
                    )}
                  </For>
                </span>
              </div>
            </div>
          </Show>
        </div>
        <form
          class="flex shrink-0 items-center gap-2 border-t border-border/60 p-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <DitherInput
            class="min-w-0 flex-1 text-[11px]"
            modelValue={draft()}
            onUpdateModelValue={setDraft}
            placeholder="Message…"
          />
          <DitherButton class="shrink-0 px-3 py-1.5 text-[11px]" color="green" disabled={!draft().trim() || typing()}>
            Send
          </DitherButton>
        </form>
      </div>
    </div>
  )
}
