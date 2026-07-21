<script setup lang="ts">
import { computed, nextTick, onUnmounted, reactive, ref, watch } from "vue"
import { DitherAvatar, DitherBadge, DitherButton, DitherInput } from "@dither-kit"
import DemoCard from "../DemoCard.vue"

type Msg = { from: "me" | "them"; text: string; at: string }
type Thread = {
  id: string
  name: string
  color: "green" | "purple" | "blue"
  unread: number
  replies: string[]
  messages: Msg[]
}

const threads = reactive<Thread[]>([
  {
    id: "rei",
    name: "Rei Toma",
    color: "purple",
    unread: 0,
    replies: ["On it — give me ten minutes.", "Pushed. Check the preview link."],
    messages: [
      { from: "them", text: "Morning — the new palette landed in staging.", at: "09:12" },
      { from: "me", text: "Saw it. The green reads much better on dark.", at: "09:14" },
      { from: "them", text: "Agreed. I still want to tune the orange ramp.", at: "09:15" },
    ],
  },
  {
    id: "kai",
    name: "Kai Raster",
    color: "green",
    unread: 2,
    replies: ["Ticket closed — customer confirmed.", "Done. Anything else today?"],
    messages: [
      { from: "them", text: "Two tickets left in the queue.", at: "08:40" },
      { from: "them", text: "One looks like the export bug again.", at: "08:41" },
    ],
  },
])

const activeId = ref("rei")
const active = computed(() => threads.find((t) => t.id === activeId.value)!)
function openThread(id: string) {
  activeId.value = id
  const t = threads.find((x) => x.id === id)
  if (t) t.unread = 0
}

const draft = ref("")
const scroller = ref<HTMLDivElement | null>(null)
const stamp = () => new Date().toTimeString().slice(0, 5)
const typing = ref(false)
/** Chat stays pinned to the newest message — on send, reply, typing, and thread switch. */
watch(
  [() => active.value.messages.length, typing, activeId],
  () => nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight })),
  { flush: "post" }
)
let timer = 0
function send() {
  const text = draft.value.trim()
  if (!text || typing.value) return
  const t = active.value
  t.messages.push({ from: "me", text, at: stamp() })
  draft.value = ""
  typing.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    t.messages.push({ from: "them", text: t.replies[t.messages.length % t.replies.length], at: stamp() })
    typing.value = false
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
onUnmounted(() => {
  window.clearTimeout(timer)
  timers.forEach((id) => window.clearTimeout(id))
  if (streamId) window.clearInterval(streamId)
})

/* AI assistant — streamed replies, suggestion chips, stop control */
type AiMsg = { role: "user" | "assistant"; text: string }
const AI_ANSWERS: Record<string, string> = {
  "What can a seed do?": "One integer derives a full visual personality — texture, easing, bloom, entrance, even the dither matrix. Same seed, same picture, forever.",
  "Theme the charts": "Override the shadcn-style tokens — background, foreground, border, accent — and every chart chrome follows. The dither reads the same vars.",
  "Export an artboard": "Open Studio, select the artboard, and use Export — PNG for pixels, or copy the Vue snippet to keep it live.",
}
const AI_FALLBACK = "Try a seed — pass any integer to a chart and watch the texture, easing and bloom derive from it. Explicit props always win."
const aiMessages = reactive<AiMsg[]>([
  { role: "assistant", text: "Hi — ask me about seeds, theming, or exporting. Or pick a suggestion below." },
])
const aiDraft = ref("")
const aiStreaming = ref(false)
let streamId = 0
const aiScroller = ref<HTMLDivElement | null>(null)
watch(
  [() => aiMessages.length, () => aiMessages[aiMessages.length - 1]?.text],
  () => nextTick(() => aiScroller.value?.scrollTo({ top: aiScroller.value.scrollHeight })),
  { flush: "post" }
)
function aiAsk(prompt: string) {
  const text = prompt.trim()
  if (!text || aiStreaming.value) return
  aiMessages.push({ role: "user", text })
  aiDraft.value = ""
  const answer = AI_ANSWERS[text] ?? AI_FALLBACK
  const target = aiMessages.push({ role: "assistant", text: "" }) - 1
  aiStreaming.value = true
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    aiMessages[target].text = answer
    aiStreaming.value = false
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
  aiStreaming.value = false
  const last = aiMessages[aiMessages.length - 1]
  if (last.role === "assistant" && !last.text) last.text = "—"
}

/* Support chat — quick replies, agent typing, ticket escalation */
type SupportMsg = { from: "me" | "agent" | "system"; text: string; at: string }
const SUPPORT_REPLIES: Record<string, string> = {
  "Where is my order?": "Order #1187 shipped yesterday — tracking says it arrives Thursday.",
  "Reset my password": "Done — a reset link is in your inbox. It expires in 15 minutes.",
  "Talk to a human": "Connecting you — a teammate picks this up from here.",
}
const supportMessages = reactive<SupportMsg[]>([
  { from: "agent", text: "Hi, you have reached dither support. How can I help?", at: "10:02" },
])
const supportTyping = ref(false)
const supportDraft = ref("")
const supportScroller = ref<HTMLDivElement | null>(null)
watch(
  [() => supportMessages.length, supportTyping],
  () => nextTick(() => supportScroller.value?.scrollTo({ top: supportScroller.value.scrollHeight })),
  { flush: "post" }
)
function supportAsk(prompt: string) {
  const text = prompt.trim()
  if (!text || supportTyping.value) return
  supportMessages.push({ from: "me", text, at: stamp() })
  supportDraft.value = ""
  supportTyping.value = true
  later(() => {
    const reply = SUPPORT_REPLIES[text] ?? "Let me check that for you — one moment."
    supportMessages.push({ from: "agent", text: reply, at: stamp() })
    supportTyping.value = false
    if (text === "Talk to a human") later(() => supportMessages.push({ from: "system", text: "Ticket #4821 opened — Rei joined the conversation", at: stamp() }), 900)
  }, 1100)
}

/* Team channel — flat rows, author grouping, toggleable reactions */
type ChannelMsg = { author: string; color: "blue" | "green" | "purple"; text: string; at: string; reactions: { label: string; count: number; mine: boolean }[] }
const channelMessages = reactive<ChannelMsg[]>([
  { author: "Rei Toma", color: "purple", text: "Palette v3 is in staging — poke at the orange ramp.", at: "09:12", reactions: [{ label: "+1", count: 2, mine: false }] },
  { author: "Rei Toma", color: "purple", text: "Charts pick it up automatically, no prop changes.", at: "09:12", reactions: [] },
  { author: "Kai Raster", color: "green", text: "Export bug #214 is reproduced — fix lands today.", at: "09:20", reactions: [{ label: "ship it", count: 1, mine: false }] },
  { author: "You", color: "blue", text: "I will take the docs pass once both land.", at: "09:24", reactions: [] },
])
const channelDraft = ref("")
const channelScroller = ref<HTMLDivElement | null>(null)
watch(
  () => channelMessages.length,
  () => nextTick(() => channelScroller.value?.scrollTo({ top: channelScroller.value.scrollHeight })),
  { flush: "post" }
)
/** Consecutive rows from one author collapse — avatar and name print once. */
const grouped = (i: number) => i > 0 && channelMessages[i - 1].author === channelMessages[i].author
function channelPost() {
  const text = channelDraft.value.trim()
  if (!text) return
  channelMessages.push({ author: "You", color: "blue", text, at: stamp(), reactions: [] })
  channelDraft.value = ""
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

const SNIPPET = `<!-- conversation list -->
<button v-for="t in threads" :aria-pressed="active === t.id"
  @click="open(t.id)" class="flex items-center gap-2">
  <DitherAvatar :name="t.name" :size="24" :color="t.color" />
  <span>{{ t.name }} — {{ t.messages.at(-1).text }}</span>
  <DitherBadge v-if="t.unread" color="green">{{ t.unread }}</DitherBadge>
</button>

<!-- thread -->
<div v-for="m in active.messages"
  :class="m.from === 'me' ? 'justify-end' : 'justify-start'" class="flex">
  <div class="max-w-[75%] rounded-lg border px-2.5 py-1.5"
    :class="m.from === 'me' ? 'border-accent/40 bg-accent/10' : 'bg-card/40'">
    {{ m.text }} <span>{{ m.at }}</span>
  </div>
</div>
<div v-if="typing" aria-live="polite">…typing dots…</div>

<!-- composer -->
<form @submit.prevent="send">
  <DitherInput v-model="draft" placeholder="Message…" />
  <DitherButton color="green" type="submit">Send</DitherButton>
</form>`

const SNIPPET_AI = `<!-- assistant thread: chips ask, replies stream, stop cancels -->
<div v-for="m in messages" :class="m.role === 'user' ? 'justify-end' : ''" class="flex">
  <div :class="m.role === 'user' ? 'border-accent/40 bg-accent/10' : 'bg-card/40'"
    class="max-w-[80%] rounded-lg border px-2.5 py-1.5">{{ m.text }}</div>
</div>

<div v-if="!streaming" role="group" aria-label="Suggestions">   <!-- chips -->
  <button v-for="s in suggestions" @click="ask(s)">{{ s }}</button>
</div>
<button v-else @click="stop">Stop generating</button>

<form @submit.prevent="ask(draft)">
  <DitherInput v-model="draft" placeholder="Ask about the kit…" />
  <DitherButton color="purple" type="submit" :disabled="streaming">Ask</DitherButton>
</form>

<!-- reduced motion: the reply lands whole instead of streaming -->`

const SNIPPET_SUPPORT = `<!-- support: status header · quick replies · escalation -->
<header>Support · <span class="size-1.5 rounded-full bg-green" /> online</header>

<div v-for="m in messages">
  <p v-if="m.from === 'system'" class="text-center">{{ m.text }}</p>  <!-- ticket line -->
  <div v-else :class="m.from === 'me' ? 'justify-end' : ''">{{ m.text }}</div>
</div>
<div v-if="typing">…agent typing…</div>

<div role="group" aria-label="Quick replies">
  <button v-for="q in quickReplies" @click="ask(q)">{{ q }}</button>
</div>
<!-- "Talk to a human" answers, then a system line opens the ticket -->`

const SNIPPET_CHANNEL = `<!-- channel: flat rows · author grouping · reactions -->
<div v-for="(m, i) in messages" class="flex gap-2.5">
  <DitherAvatar v-if="!grouped(i)" :name="m.author" :size="24" :color="m.color" />
  <div v-else class="w-6" />                <!-- same author → no avatar -->
  <div>
    <p v-if="!grouped(i)"><b>{{ m.author }}</b> <time>{{ m.at }}</time></p>
    <p>{{ m.text }}</p>
    <button v-for="r in m.reactions" :aria-pressed="r.mine"
      @click="react(m, r.label)">{{ r.label }} {{ r.count }}</button>
  </div>
</div>

<form @submit.prevent="post">
  <DitherInput v-model="draft" placeholder="Message #dither-dev…" />
</form>`
</script>

<template>
  <section id="chat-thread" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Chat thread</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Conversation list beside a live thread — unread badges clear when you
      open them, sending appends your bubble, and the other side types back.
      The typing dots hold still under reduced motion.
    </p>
    <DemoCard :code="SNIPPET">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <aside class="flex w-52 shrink-0 flex-col border-r border-border/60" aria-label="Conversations">
          <div class="border-b border-border/60 p-2.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Messages
          </div>
          <div class="grid content-start gap-0.5 p-1.5">
            <button
              v-for="t in threads"
              :key="t.id"
              type="button"
              :aria-pressed="activeId === t.id"
              class="flex min-w-0 items-center gap-2 rounded-md p-2 text-left transition-colors"
              :class="activeId === t.id ? 'bg-card' : 'hover:bg-card/60'"
              @click="openThread(t.id)"
            >
              <DitherAvatar :name="t.name" :size="24" :color="t.color" />
              <span class="min-w-0 flex-1 leading-tight">
                <span class="block truncate text-[11px] text-foreground">{{ t.name }}</span>
                <span class="block truncate text-[10px] text-muted-foreground">
                  {{ t.messages[t.messages.length - 1].text }}
                </span>
              </span>
              <DitherBadge v-if="t.unread" color="green" class="shrink-0 text-[9px]">{{ t.unread }}</DitherBadge>
            </button>
          </div>
        </aside>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
            <DitherAvatar :name="active.name" :size="20" :color="active.color" />
            <span class="text-[12px] text-foreground">{{ active.name }}</span>
            <span class="ml-auto text-[10px] text-muted-foreground">today</span>
          </div>
          <div ref="scroller" class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
            <div
              v-for="(m, i) in active.messages"
              :key="i"
              class="flex items-end gap-2"
              :class="m.from === 'me' ? 'justify-end' : 'justify-start'"
            >
              <DitherAvatar v-if="m.from === 'them'" :name="active.name" :size="20" :color="active.color" class="shrink-0" />
              <div
                class="max-w-[75%] rounded-lg border px-2.5 py-1.5"
                :class="m.from === 'me' ? 'border-accent/40 bg-accent/10' : 'border-border/60 bg-card/40'"
              >
                <p class="text-[11px] leading-relaxed text-foreground">{{ m.text }}</p>
                <span class="mt-0.5 block text-right text-[9px] text-muted-foreground/70 tabular-nums">{{ m.at }}</span>
              </div>
            </div>
            <div v-if="typing" class="flex items-end gap-2" aria-live="polite">
              <DitherAvatar :name="active.name" :size="20" :color="active.color" class="shrink-0" />
              <div class="rounded-lg border border-border/60 bg-card/40 px-2.5 py-2" aria-label="Typing">
                <span class="flex gap-1">
                  <span v-for="d in 3" :key="d" class="size-1 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none" :style="{ animationDelay: `${d * 150}ms` }" />
                </span>
              </div>
            </div>
          </div>
          <form class="flex shrink-0 items-center gap-2 border-t border-border/60 p-2.5" @submit.prevent="send">
            <DitherInput v-model="draft" placeholder="Message…" class="min-w-0 flex-1 text-[11px]" />
            <DitherButton color="green" class="shrink-0 px-3 py-1.5 text-[11px]" :disabled="!draft.trim() || typing">
              Send
            </DitherButton>
          </form>
        </div>
      </div>
    </DemoCard>
  </section>

  <!-- AI assistant -->
  <section id="chat-assistant" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">AI assistant</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An assistant thread — suggestion chips ask for you, replies stream in
      character by character, and Stop cancels mid-sentence. Under reduced
      motion the answer lands whole.
    </p>
    <DemoCard :code="SNIPPET_AI">
      <div class="mx-auto flex h-96 max-w-md flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
          <DitherAvatar name="dither assistant" :size="20" color="purple" />
          <span class="text-[12px] text-foreground">Assistant</span>
          <span class="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span class="size-1.5 rounded-full" :style="{ background: 'var(--swatch-purple)' }" aria-hidden="true" />
            {{ aiStreaming ? "thinking" : "ready" }}
          </span>
        </div>
        <div ref="aiScroller" class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
          <div v-for="(m, i) in aiMessages" :key="i" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[80%] rounded-lg border px-2.5 py-1.5"
              :class="m.role === 'user' ? 'border-accent/40 bg-accent/10' : 'border-border/60 bg-card/40'"
            >
              <p class="text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">{{ m.text }}<span v-if="aiStreaming && i === aiMessages.length - 1" class="animate-pulse motion-reduce:animate-none" aria-hidden="true">▍</span></p>
            </div>
          </div>
        </div>
        <div class="shrink-0 border-t border-border/60 p-2.5">
          <div v-if="!aiStreaming" class="flex flex-wrap gap-1.5 pb-2" role="group" aria-label="Suggestions">
            <button
              v-for="s in Object.keys(AI_ANSWERS)"
              :key="s"
              type="button"
              class="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              @click="aiAsk(s)"
            >
              {{ s }}
            </button>
          </div>
          <div v-else class="pb-2">
            <button
              type="button"
              class="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              @click="aiStop"
            >
              Stop generating
            </button>
          </div>
          <form class="flex items-center gap-2" @submit.prevent="aiAsk(aiDraft)">
            <DitherInput v-model="aiDraft" placeholder="Ask about the kit…" class="min-w-0 flex-1 text-[11px]" />
            <DitherButton color="purple" class="shrink-0 px-3 py-1.5 text-[11px]" :disabled="!aiDraft.trim() || aiStreaming">Ask</DitherButton>
          </form>
        </div>
      </div>
    </DemoCard>
  </section>

  <!-- Support chat -->
  <section id="chat-support" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Support chat</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A support widget — online status in the header, quick-reply chips that
      really answer, and “Talk to a human” escalates: the agent replies, then
      a system line opens the ticket.
    </p>
    <DemoCard :code="SNIPPET_SUPPORT">
      <div class="mx-auto flex h-96 max-w-md flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
          <DitherAvatar name="Nia Grid" :size="20" color="green" />
          <span class="text-[12px] text-foreground">Support</span>
          <span class="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span class="size-1.5 rounded-full" :style="{ background: 'var(--swatch-green)' }" aria-hidden="true" />
            online · ~2 min
          </span>
        </div>
        <div ref="supportScroller" class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          <div class="text-center text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">Today</div>
          <template v-for="(m, i) in supportMessages" :key="i">
            <p v-if="m.from === 'system'" class="px-4 text-center text-[10px] text-muted-foreground">
              {{ m.text }}
            </p>
            <div v-else class="flex items-end gap-2" :class="m.from === 'me' ? 'justify-end' : 'justify-start'">
              <DitherAvatar v-if="m.from === 'agent'" name="Nia Grid" :size="20" color="green" class="shrink-0" />
              <div
                class="max-w-[75%] rounded-lg border px-2.5 py-1.5"
                :class="m.from === 'me' ? 'border-accent/40 bg-accent/10' : 'border-border/60 bg-card/40'"
              >
                <p class="text-[11px] leading-relaxed text-foreground">{{ m.text }}</p>
                <span class="mt-0.5 block text-right text-[9px] text-muted-foreground/70 tabular-nums">{{ m.at }}</span>
              </div>
            </div>
          </template>
          <div v-if="supportTyping" class="flex items-end gap-2" aria-live="polite">
            <DitherAvatar name="Nia Grid" :size="20" color="green" class="shrink-0" />
            <div class="rounded-lg border border-border/60 bg-card/40 px-2.5 py-2" aria-label="Agent typing">
              <span class="flex gap-1">
                <span v-for="d in 3" :key="d" class="size-1 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none" :style="{ animationDelay: `${d * 150}ms` }" />
              </span>
            </div>
          </div>
        </div>
        <div class="shrink-0 border-t border-border/60 p-2.5">
          <div class="flex flex-wrap gap-1.5 pb-2" role="group" aria-label="Quick replies">
            <button
              v-for="q in Object.keys(SUPPORT_REPLIES)"
              :key="q"
              type="button"
              class="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
              :disabled="supportTyping"
              @click="supportAsk(q)"
            >
              {{ q }}
            </button>
          </div>
          <form class="flex items-center gap-2" @submit.prevent="supportAsk(supportDraft)">
            <DitherInput v-model="supportDraft" placeholder="Write a message…" class="min-w-0 flex-1 text-[11px]" />
            <DitherButton color="green" class="shrink-0 px-3 py-1.5 text-[11px]" :disabled="!supportDraft.trim() || supportTyping">Send</DitherButton>
          </form>
        </div>
      </div>
    </DemoCard>
  </section>

  <!-- Team channel -->
  <section id="chat-channel" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Team channel</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A channel, not bubbles — flat rows where consecutive messages from one
      author group under a single name, and reactions toggle with a click.
      Post something and watch your rows group too.
    </p>
    <DemoCard :code="SNIPPET_CHANNEL">
      <div class="mx-auto flex h-96 max-w-lg flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-3">
          <span class="text-[12px] text-foreground">#dither-dev</span>
          <span class="ml-auto text-[10px] tabular-nums text-muted-foreground">4 members</span>
        </div>
        <div ref="channelScroller" class="min-h-0 flex-1 overflow-y-auto p-3">
          <div class="pb-2 text-center text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">Today</div>
          <div
            v-for="(m, i) in channelMessages"
            :key="i"
            class="flex gap-2.5 rounded-md px-1.5 transition-colors hover:bg-card/40"
            :class="grouped(i) ? 'py-0.5' : 'pt-2.5 pb-0.5'"
          >
            <DitherAvatar v-if="!grouped(i)" :name="m.author" :size="24" :color="m.color" class="mt-0.5 shrink-0" />
            <div v-else class="w-6 shrink-0" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p v-if="!grouped(i)" class="flex items-baseline gap-2">
                <span class="text-[11px] text-foreground">{{ m.author }}</span>
                <time class="text-[9px] tabular-nums text-muted-foreground/70">{{ m.at }}</time>
              </p>
              <p class="text-[11px] leading-relaxed text-muted-foreground">{{ m.text }}</p>
              <div v-if="m.reactions.length" class="mt-1 flex flex-wrap gap-1">
                <button
                  v-for="r in m.reactions"
                  :key="r.label"
                  type="button"
                  :aria-pressed="r.mine"
                  class="rounded-full border px-1.5 py-px text-[9px] tabular-nums transition-colors"
                  :class="r.mine ? 'border-accent/50 bg-accent/10 text-foreground' : 'border-border/60 text-muted-foreground hover:text-foreground'"
                  @click="react(m, r.label)"
                >
                  {{ r.label }} {{ r.count }}
                </button>
                <button
                  type="button"
                  aria-label="Add reaction"
                  class="rounded-full border border-border/60 px-1.5 py-px text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                  @click="react(m, '+1')"
                >+</button>
              </div>
            </div>
          </div>
        </div>
        <form class="flex shrink-0 items-center gap-2 border-t border-border/60 p-2.5" @submit.prevent="channelPost">
          <DitherInput v-model="channelDraft" placeholder="Message #dither-dev…" class="min-w-0 flex-1 text-[11px]" />
          <DitherButton color="blue" class="shrink-0 px-3 py-1.5 text-[11px]" :disabled="!channelDraft.trim()">Post</DitherButton>
        </form>
      </div>
    </DemoCard>
  </section>
</template>
