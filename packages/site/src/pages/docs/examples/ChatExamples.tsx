import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from "solid-js"
import { createMutable } from "solid-js/store"
import { DitherAvatar, DitherBadge, DitherButton, DitherInput } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { dataCode } from "../snippet"

type Msg = { from: "me" | "them"; text: string; at: string }

type Thread = {
  id: string
  name: string
  color: "green" | "purple" | "blue"
  unread: number
  replies: string[]
  messages: Msg[]
}

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

/* Support chat — quick replies, agent typing, ticket escalation */
type SupportMsg = { from: "me" | "agent" | "system"; text: string; at: string }

const SUPPORT_REPLIES: Record<string, string> = {
  "Where is my order?": "Order #1187 shipped yesterday. Tracking says it arrives Thursday.",
  "Reset my password": "Done. A reset link is in your inbox. It expires in 15 minutes.",
  "Talk to a human": "Connecting you. A teammate picks this up from here.",
}

/* Team channel — flat rows, author grouping, toggleable reactions */
type ChannelMsg = {
  author: string
  color: "blue" | "green" | "purple"
  text: string
  at: string
  reactions: { label: string; count: number; mine: boolean }[]
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

/** A fresh copy of a list the demo mutates, its sample left as the example prints it. */
const copy = <T,>(list: T[]): T[] => JSON.parse(JSON.stringify(list)) as T[]

const SNIPPET = `${dataCode("start", THREADS)}
const [threads, setThreads] = createSignal(start)
const [activeId, setActiveId] = createSignal("rei")
const active = createMemo(() => threads().find((t) => t.id === activeId())!)
const [draft, setDraft] = createSignal("")
const [typing, setTyping] = createSignal(false)

function pick(id: string) {
  setActiveId(id)
  setThreads(threads().map((t) => (t.id === id ? { ...t, unread: 0 } : t)))
}
function say(id: string, from: string, text: string) {
  const at = new Date().toTimeString().slice(0, 5)
  setThreads(threads().map((t) => (t.id === id ? { ...t, messages: [...t.messages, { from, text, at }] } : t)))
}
function send() {
  const text = draft().trim()
  if (!text || typing()) return
  const t = active()
  say(t.id, "me", text)
  setDraft("")
  setTyping(true)
  setTimeout(() => {
    say(t.id, "them", t.replies[t.messages.length % t.replies.length])
    setTyping(false)
  }, 1200)
}

<div class="grid grid-cols-[140px_1fr] rounded-lg border">
  {/* conversation list */}
  <nav class="border-r p-1">
    <For each={threads()}>
      {(t) => (
        <button type="button" aria-pressed={activeId() === t.id}
          class="flex w-full items-center gap-2 p-1.5 text-left text-[11px]" onClick={() => pick(t.id)}>
          <DitherAvatar name={t.name} size={24} color={t.color} />
          <span class="min-w-0 flex-1 truncate">{t.name}</span>
          <Show when={t.unread}><DitherBadge color="green">{t.unread}</DitherBadge></Show>
        </button>
      )}
    </For>
  </nav>
  <div class="flex flex-col p-2">
    {/* thread */}
    <div class="grid flex-1 content-start gap-1.5">
      <For each={active().messages}>
        {(m) => (
          <div class={\`flex \${m.from === 'me' ? 'justify-end' : 'justify-start'}\`}>
            <div class={\`max-w-[75%] rounded-lg border px-2.5 py-1.5 text-[11px] \${m.from === 'me' ? 'border-accent/40 bg-accent/10' : 'bg-card/40'}\`}>
              {m.text} <span class="text-[9px] text-muted-foreground">{m.at}</span>
            </div>
          </div>
        )}
      </For>
      <Show when={typing()}><p aria-live="polite" class="text-[10px] text-muted-foreground">{active().name} is typing</p></Show>
    </div>
    {/* composer */}
    <form class="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
      <DitherInput modelValue={draft()} onUpdateModelValue={setDraft} placeholder="Message…" aria-label="Message" />
      <DitherButton color="green" type="submit">Send</DitherButton>
    </form>
  </div>
</div>`

const SNIPPET_AI = `${dataCode("answers", AI_ANSWERS)}
const suggestions = Object.keys(answers)
const [messages, setMessages] = createSignal([{ role: "assistant", text: "Hi, ask me about seeds, theming, or exporting. Or pick a suggestion below." }])
const [draft, setDraft] = createSignal("")
const [streaming, setStreaming] = createSignal(false)
let timer = 0

function reply(text: string) {
  setMessages([...messages().slice(0, -1), { role: "assistant", text }])
}
function stop() {
  clearInterval(timer)
  setStreaming(false)
}
function ask(prompt: string) {
  const text = prompt.trim()
  if (!text || streaming()) return
  const answer = answers[text] ?? ${JSON.stringify(AI_FALLBACK)}
  setMessages([...messages(), { role: "user", text }, { role: "assistant", text: "" }])
  setDraft("")
  setStreaming(true)
  // reduced motion: the reply lands whole instead of streaming
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return (reply(answer), stop())
  let i = 0
  timer = window.setInterval(() => {
    i = Math.min(i + 3, answer.length)
    reply(answer.slice(0, i))
    if (i >= answer.length) stop()
  }, 24)
}
onCleanup(stop)

<div class="grid gap-1.5">
  <Index each={messages()}>
    {(m, i) => (
      <div class={\`flex \${m().role === 'user' ? 'justify-end' : ''}\`}>
        <div class={\`max-w-[80%] rounded-lg border px-2.5 py-1.5 text-[11px] \${m().role === 'user' ? 'border-accent/40 bg-accent/10' : 'bg-card/40'}\`}>{m().text}</div>
      </div>
    )}
  </Index>
</div>

{/* chips ask, a reply streams in, Stop cancels */}
<Show
  when={!streaming()}
  fallback={
    <button type="button" class="mt-2 text-[10px]" onClick={stop}>Stop generating</button>
  }
>
  <div role="group" aria-label="Suggestions" class="mt-2 flex flex-wrap gap-1.5">
    <For each={suggestions}>
      {(s) => (
        <button type="button" class="rounded border px-2 py-0.5 text-[10px]"
          onClick={() => ask(s)}>{s}</button>
      )}
    </For>
  </div>
</Show>

<form class="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(draft()) }}>
  <DitherInput modelValue={draft()} onUpdateModelValue={setDraft} placeholder="Ask about the kit…" aria-label="Ask" />
  <DitherButton color="purple" type="submit" disabled={streaming()}>Ask</DitherButton>
</form>`

const SNIPPET_SUPPORT = `${dataCode("replies", SUPPORT_REPLIES)}
const quickReplies = Object.keys(replies)
const [messages, setMessages] = createSignal([{ from: "agent", text: "Hi, you have reached dither support. How can I help?" }])
const [typing, setTyping] = createSignal(false)

function say(from: string, text: string) {
  setMessages([...messages(), { from, text }])
}
function ask(text: string) {
  if (typing()) return
  say("me", text)
  setTyping(true)
  setTimeout(() => {
    say("agent", replies[text])
    setTyping(false)
    // a human takes over: a system line opens the ticket
    if (text === "Talk to a human")
      setTimeout(() => say("system", "Ticket #4821 opened. Rei joined the conversation."), 900)
  }, 1100)
}

<header class="flex items-center gap-1.5 text-[11px]">
  Support <span class="size-1.5 rounded-full" style={{ background: 'var(--swatch-green)' }} /> online
</header>

<div class="mt-2 grid gap-1.5 text-[11px]">
  <Index each={messages()}>
    {(m, i) => (
      <div>
        {/* the ticket line */}
        <Show
          when={m().from === 'system'}
          fallback={
            <div class={\`flex \${m().from === 'me' ? 'justify-end' : ''}\`}>
              <span class="max-w-[80%] rounded-lg border px-2.5 py-1.5">{m().text}</span>
            </div>
          }
        >
          <p class="text-center text-[10px] text-muted-foreground">{m().text}</p>
        </Show>
      </div>
    )}
  </Index>
  <Show when={typing()}><p class="text-[10px] text-muted-foreground">An agent is typing</p></Show>
</div>

<div role="group" aria-label="Quick replies" class="mt-2 flex flex-wrap gap-1.5">
  <For each={quickReplies}>
    {(q) => (
      <button type="button" class="rounded border px-2 py-0.5 text-[10px]"
        onClick={() => ask(q)}>{q}</button>
    )}
  </For>
</div>`

const SNIPPET_CHANNEL = `${dataCode("start", CHANNEL)}
const [messages, setMessages] = createSignal(start)
const [draft, setDraft] = createSignal("")
// a row by the author above it joins their group: avatar and name print once
const grouped = (i: number) => i > 0 && messages()[i - 1].author === messages()[i].author

function react(i: number, label: string) {
  setMessages(messages().map((m, k) =>
    k !== i
      ? m
      : { ...m, reactions: m.reactions.map((r) => (r.label !== label ? r : { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) })) },
  ))
}
function post() {
  const text = draft().trim()
  if (!text) return
  const at = new Date().toTimeString().slice(0, 5)
  setMessages([...messages(), { author: "You", color: "blue", text, at, reactions: [] }])
  setDraft("")
}

<Index each={messages()}>
  {(m, i) => (
    <div class="flex gap-2.5 text-[11px]">
      <Show when={!grouped(i)} fallback={<div class="w-6" />}><DitherAvatar name={m().author} size={24} color={m().color} /></Show>
      <div>
        <Show when={!grouped(i)}><p><b>{m().author}</b> <time class="text-[10px]">{m().at}</time></p></Show>
        <p>{m().text}</p>
        <For each={m().reactions}>
          {(r) => (
            <button type="button" aria-pressed={r.mine}
              class="mr-1 rounded border px-1.5 text-[10px]" onClick={() => react(i, r.label)}>{r.label} {r.count}</button>
          )}
        </For>
      </div>
    </div>
  )}
</Index>

<form class="mt-2" onSubmit={(e) => { e.preventDefault(); post() }}>
  <DitherInput modelValue={draft()} onUpdateModelValue={setDraft} placeholder="Message #dither-dev…" aria-label="Message" />
</form>`

export default function ChatExamples() {
  const threads = createMutable<Thread[]>(copy(THREADS))

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

  /** Chat stays pinned to the newest message — on send, reply, typing, and thread switch. */
  createEffect(
    on(
      [() => active().messages.length, typing, activeId],
      () => queueMicrotask(() => scroller?.scrollTo({ top: scroller.scrollHeight })),
      { defer: true },
    ),
  )

  let timer = 0

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

  /* Every variant parks its pending timer here; unmount clears the lot. */
  const timers = new Set<number>()

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
    return id
  }

  // The globals, not `window.`: a server render cleans up too.
  onCleanup(() => {
    clearTimeout(timer)
    timers.forEach((id) => clearTimeout(id))
    if (streamId) clearInterval(streamId)
  })

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

  const supportMessages = createMutable<SupportMsg[]>([
    { from: "agent", text: "Hi, you have reached dither support. How can I help?", at: "10:02" },
  ])

  const [supportTyping, setSupportTyping] = createSignal(false)

  const [supportDraft, setSupportDraft] = createSignal("")

  let supportScroller: HTMLDivElement | undefined

  createEffect(
    on(
      [() => supportMessages.length, supportTyping],
      () => queueMicrotask(() => supportScroller?.scrollTo({ top: supportScroller.scrollHeight })),
      { defer: true },
    ),
  )

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

  const channelMessages = createMutable<ChannelMsg[]>(copy(CHANNEL))

  const [channelDraft, setChannelDraft] = createSignal("")

  let channelScroller: HTMLDivElement | undefined

  createEffect(
    on(
      () => channelMessages.length,
      () => queueMicrotask(() => channelScroller?.scrollTo({ top: channelScroller.scrollHeight })),
      { defer: true },
    ),
  )

  /** Consecutive rows from one author collapse — avatar and name print once. */
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

  return (
    <>
      <section class="mt-16 scroll-mt-24" id="chat-thread">
        <h2 class="text-lg tracking-tight">Chat thread</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Conversation list beside a live thread: unread badges clear when you open them, sending appends your bubble,
          and the other side types back. The typing dots hold still under reduced motion.
        </p>
        <DemoCard code={SNIPPET}>
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
                        <span class="mt-0.5 block text-right text-[9px] text-muted-foreground tabular-nums">
                          {m.at}
                        </span>
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
                <DitherButton
                  class="shrink-0 px-3 py-1.5 text-[11px]"
                  color="green"
                  disabled={!draft().trim() || typing()}
                >
                  Send
                </DitherButton>
              </form>
            </div>
          </div>
        </DemoCard>
      </section>
      {/* AI assistant */}
      <section class="mt-16 scroll-mt-24" id="chat-assistant">
        <h2 class="text-lg tracking-tight">AI assistant</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An assistant thread: suggestion chips ask for you, replies stream in character by character, and Stop cancels
          mid-sentence. Under reduced motion the answer lands whole.
        </p>
        <DemoCard code={SNIPPET_AI}>
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
        </DemoCard>
      </section>
      {/* Support chat */}
      <section class="mt-16 scroll-mt-24" id="chat-support">
        <h2 class="text-lg tracking-tight">Support chat</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A support widget: online status in the header and quick-reply chips that really answer. “Talk to a human”
          escalates: the agent replies, then a system line opens the ticket.
        </p>
        <DemoCard code={SNIPPET_SUPPORT}>
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
                            <span class="mt-0.5 block text-right text-[9px] text-muted-foreground tabular-nums">
                              {m.at}
                            </span>
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
        </DemoCard>
      </section>
      {/* Team channel */}
      <section class="mt-16 scroll-mt-24" id="chat-channel">
        <h2 class="text-lg tracking-tight">Team channel</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A channel, not bubbles: flat rows where consecutive messages from one author group under a single name, and
          reactions toggle with a click. Post something and watch your rows group too.
        </p>
        <DemoCard code={SNIPPET_CHANNEL}>
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
        </DemoCard>
      </section>
    </>
  )
}
