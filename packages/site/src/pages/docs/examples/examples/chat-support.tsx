import { createMutable } from "solid-js/store"
import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js"
import { DitherAvatar, DitherButton, DitherInput } from "@dither-kit"

/* Support chat — quick replies, agent typing, ticket escalation */
type SupportMsg = { from: "me" | "agent" | "system"; text: string; at: string }

const SUPPORT_REPLIES: Record<string, string> = {
  "Where is my order?": "Order #1187 shipped yesterday. Tracking says it arrives Thursday.",
  "Reset my password": "Done. A reset link is in your inbox. It expires in 15 minutes.",
  "Talk to a human": "Connecting you. A teammate picks this up from here.",
}

export default function Example() {
  const supportMessages = createMutable<SupportMsg[]>([
    { from: "agent", text: "Hi, you have reached dither support. How can I help?", at: "10:02" },
  ])
  const [supportTyping, setSupportTyping] = createSignal(false)
  const [supportDraft, setSupportDraft] = createSignal("")
  let supportScroller: HTMLDivElement | undefined
  const stamp = () => new Date().toTimeString().slice(0, 5)
  createEffect(
    on(
      [() => supportMessages.length, supportTyping],
      () => queueMicrotask(() => supportScroller?.scrollTo({ top: supportScroller.scrollHeight })),
      { defer: true },
    ),
  )
  // every pending reply parks its timer here; unmount clears the lot
  const timers = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
    return id
  }
  onCleanup(() => timers.forEach((id) => clearTimeout(id)))
  function supportAsk(prompt: string) {
    const text = prompt.trim()
    if (!text || supportTyping()) return
    supportMessages.push({ from: "me", text, at: stamp() })
    setSupportDraft("")
    setSupportTyping(true)
    later(() => {
      const reply = SUPPORT_REPLIES[text] ?? "Let me check that for you. One moment."
      supportMessages.push({ from: "agent", text: reply, at: stamp() })
      setSupportTyping(false)
      if (text === "Talk to a human")
        later(
          () =>
            supportMessages.push({
              from: "system",
              text: "Ticket #4821 opened. Rei joined the conversation.",
              at: stamp(),
            }),
          900,
        )
    }, 1100)
  }

  // a human takes over: a system line opens the ticket
  return (
    <div class="mx-auto flex h-96 max-w-md flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <DitherAvatar name="Nia Grid" size={20} color="green" />
        <span class="text-[12px] text-foreground">Support</span>
        <span class="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span class="size-1.5 rounded-full" style={{ background: "var(--swatch-green)" }} aria-hidden="true" />
          <span>online</span>
          <span class="ml-1.5">~2 min</span>
        </span>
      </div>
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3" ref={(el) => (supportScroller = el)}>
        <div class="text-center text-[11px] text-muted-foreground">Today</div>
        <For each={supportMessages}>
          {(m) => (
            <>
              <Show
                when={m.from === "system"}
                fallback={
                  <div class={`flex items-end gap-2 ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <Show when={m.from === "agent"}>
                      <DitherAvatar class="shrink-0" name="Nia Grid" size={20} color="green" />
                    </Show>
                    <div
                      class={`max-w-[75%] rounded-lg border px-2.5 py-1.5 ${m.from === "me" ? "border-accent/40 bg-accent/10" : "border-border/60 bg-card/40"}`}
                    >
                      <p class="text-[11px] leading-relaxed text-foreground">{m.text}</p>
                      <span class="mt-0.5 block text-right text-[9px] text-muted-foreground tabular-nums">{m.at}</span>
                    </div>
                  </div>
                }
              >
                <p class="px-4 text-center text-[10px] text-muted-foreground">{m.text}</p>
              </Show>
            </>
          )}
        </For>
        <Show when={supportTyping()}>
          <div class="flex items-end gap-2" aria-live="polite">
            <DitherAvatar class="shrink-0" name="Nia Grid" size={20} color="green" />
            <div class="rounded-lg border border-border/60 bg-card/40 px-2.5 py-2" aria-label="Agent typing">
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
      <div class="shrink-0 border-t border-border/60 p-2.5">
        <div class="flex flex-wrap gap-1.5 pb-2" role="group" aria-label="Quick replies">
          <For each={Object.keys(SUPPORT_REPLIES)}>
            {(q) => (
              <button
                class="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
                type="button"
                disabled={supportTyping()}
                onClick={() => supportAsk(q)}
              >
                {q}
              </button>
            )}
          </For>
        </div>
        <form
          class="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            supportAsk(supportDraft())
          }}
        >
          <DitherInput
            class="min-w-0 flex-1 text-[11px]"
            modelValue={supportDraft()}
            onUpdateModelValue={setSupportDraft}
            placeholder="Write a message…"
          />
          <DitherButton
            class="shrink-0 px-3 py-1.5 text-[11px]"
            color="green"
            disabled={!supportDraft().trim() || supportTyping()}
          >
            Send
          </DitherButton>
        </form>
      </div>
    </div>
  )
}
