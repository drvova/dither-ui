import { createMutable } from "solid-js/store"
import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js"
import { DitherAvatar, DitherButton, DitherInput } from "@dither-kit"

/* AI assistant — streamed replies, suggestion chips, stop control */
type AiMsg = { role: "user" | "assistant"; text: string }

const AI_ANSWERS: Record<string, string> = {
  "What can a seed do?":
    "One integer derives a full visual personality: texture, easing, bloom, entrance, even the dither matrix. Same seed, same picture, forever.",
  "Theme the charts":
    "Override the shadcn-style tokens (background, foreground, border, accent) and every chart chrome follows. The dither reads the same vars.",
  "Export an artboard":
    "Open Studio, select the artboard, and use Export: PNG for pixels, or copy the Solid snippet to keep it live.",
}

const AI_FALLBACK =
  "Try a seed: pass any integer to a chart and watch the texture, easing and bloom derive from it. Explicit props always win."

export default function Example() {
  const aiMessages = createMutable<AiMsg[]>([
    { role: "assistant", text: "Hi, ask me about seeds, theming, or exporting. Or pick a suggestion below." },
  ])
  const [aiDraft, setAiDraft] = createSignal("")
  const [aiStreaming, setAiStreaming] = createSignal(false)
  let streamId = 0
  let aiScroller: HTMLDivElement | undefined
  createEffect(
    on(
      [() => aiMessages.length, () => aiMessages[aiMessages.length - 1]?.text],
      () => queueMicrotask(() => aiScroller?.scrollTo({ top: aiScroller.scrollHeight })),
      { defer: true },
    ),
  )
  onCleanup(() => clearInterval(streamId))
  // the answer streams in a few characters at a time; reduced motion shows it whole
  function aiAsk(prompt: string) {
    const text = prompt.trim()
    if (!text || aiStreaming()) return
    aiMessages.push({ role: "user", text })
    setAiDraft("")
    const answer = AI_ANSWERS[text] ?? AI_FALLBACK
    const target = aiMessages.push({ role: "assistant", text: "" }) - 1
    setAiStreaming(true)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      aiMessages[target].text = answer
      setAiStreaming(false)
      return
    }
    let i = 0
    streamId = window.setInterval(() => {
      i = Math.min(i + 3, answer.length)
      aiMessages[target].text = answer.slice(0, i)
      if (i >= answer.length) aiStop()
    }, 24)
  }
  function aiStop() {
    window.clearInterval(streamId)
    streamId = 0
    setAiStreaming(false)
    const last = aiMessages[aiMessages.length - 1]
    if (last.role === "assistant" && !last.text) last.text = "Stopped."
  }

  // reduced motion: the reply lands whole instead of streaming
  // chips ask, a reply streams in, Stop cancels
  return (
    <div class="mx-auto flex h-96 max-w-md flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <DitherAvatar name="dither assistant" size={20} color="purple" />
        <span class="text-[12px] text-foreground">Assistant</span>
        <span class="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span class="size-1.5 rounded-full" style={{ background: "var(--swatch-purple)" }} aria-hidden="true" />{" "}
          {aiStreaming() ? "thinking" : "ready"}
        </span>
      </div>
      <div
        class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3"
        ref={(el) => (aiScroller = el)}
        aria-live="polite"
      >
        <For each={aiMessages}>
          {(m, i) => (
            <div class={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                class={`max-w-[80%] rounded-lg border px-2.5 py-1.5 ${m.role === "user" ? "border-accent/40 bg-accent/10" : "border-border/60 bg-card/40"}`}
              >
                <p class="text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">
                  {/* the space before the text shows under pre-wrap */} {m.text}
                  <Show when={aiStreaming() && i() === aiMessages.length - 1}>
                    <span class="animate-pulse motion-reduce:animate-none" aria-hidden="true">
                      ▍
                    </span>
                  </Show>
                </p>
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="shrink-0 border-t border-border/60 p-2.5">
        <Show
          when={!aiStreaming()}
          fallback={
            <div class="pb-2">
              <button
                class="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                type="button"
                onClick={aiStop}
              >
                Stop generating
              </button>
            </div>
          }
        >
          <div class="flex flex-wrap gap-1.5 pb-2" role="group" aria-label="Suggestions">
            <For each={Object.keys(AI_ANSWERS)}>
              {(s) => (
                <button
                  class="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                  onClick={() => aiAsk(s)}
                >
                  {s}
                </button>
              )}
            </For>
          </div>
        </Show>
        <form
          class="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            aiAsk(aiDraft())
          }}
        >
          <DitherInput
            class="min-w-0 flex-1 text-[11px]"
            modelValue={aiDraft()}
            onUpdateModelValue={setAiDraft}
            placeholder="Ask about the kit…"
          />
          <DitherButton
            class="shrink-0 px-3 py-1.5 text-[11px]"
            color="purple"
            disabled={!aiDraft().trim() || aiStreaming()}
          >
            Ask
          </DitherButton>
        </form>
      </div>
    </div>
  )
}
