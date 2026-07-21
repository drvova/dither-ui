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
onUnmounted(() => window.clearTimeout(timer))

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
</template>
