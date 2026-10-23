<script setup lang="ts">
// Comment threads pinned to live elements: a numbered pin rides its element
// through re-renders (found again by its child path), opens its thread —
// messages, a reply field, resolve / reopen, delete. A new thread starts
// where the Comment tool clicks. Enter posts, Shift+Enter breaks the line,
// Escape closes.
import { computed, nextTick, ref, watch } from "vue"
import { useBench } from "../context"
import { ICONS } from "../model/tools"
import Icon from "./Icon.vue"

const b = useBench()
const text = ref("")
const field = ref<HTMLTextAreaElement | null>(null)

const thread = computed(() => b.ws.value.threads.find((t) => t.id === b.openThread.value) ?? null)
/** Where the popover opens: beside the pin, kept on the stage. */
const place = computed(() => {
  const p = thread.value ? b.pins.value[thread.value.id] : b.draftThread.value?.at
  if (!p) return null
  const w = 264
  const left = Math.min(Math.max(8, p.x + 14), Math.max(8, b.size.value.w - w - 8))
  return { left: `${left}px`, top: `${p.y + 14}px`, width: `${w}px` }
})

watch(
  () => [b.openThread.value, b.draftThread.value],
  async () => {
    text.value = ""
    await nextTick()
    field.value?.focus()
  },
)

function send() {
  if (!text.value.trim()) return
  if (b.draftThread.value) b.submitThread(text.value)
  else if (thread.value) b.reply(thread.value.id, text.value)
  text.value = ""
}

function toggle(id: string) {
  b.draftThread.value = null
  b.openThread.value = b.openThread.value === id ? null : id
}

function close() {
  b.openThread.value = null
  b.draftThread.value = null
}

function key(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    send()
  } else if (e.key === "Escape") {
    e.preventDefault()
    e.stopPropagation()
    close()
  }
}

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000)
  return s < 60
    ? "now"
    : s < 3600
      ? `${Math.round(s / 60)}m`
      : s < 86400
        ? `${Math.round(s / 3600)}h`
        : `${Math.round(s / 86400)}d`
}
</script>

<template>
  <div class="wb-comments">
    <button
      v-for="t in b.ws.value.threads"
      v-show="b.pins.value[t.id]"
      :key="t.id"
      type="button"
      class="pin"
      :class="{ resolved: t.resolved, open: b.openThread.value === t.id }"
      :style="{ left: `${b.pins.value[t.id]?.x}px`, top: `${b.pins.value[t.id]?.y}px` }"
      :aria-label="`Comment ${t.n}${t.resolved ? ', resolved' : ''}: ${t.messages[0]?.text}`"
      :aria-expanded="b.openThread.value === t.id"
      @pointerdown.stop
      @click="toggle(t.id)"
    >
      {{ t.n }}
    </button>
    <span
      v-if="b.draftThread.value"
      class="pin draft"
      :style="{ left: `${b.draftThread.value.at.x}px`, top: `${b.draftThread.value.at.y}px` }"
      >+</span
    >

    <div
      v-if="place && (thread || b.draftThread.value)"
      class="pop"
      role="dialog"
      :aria-label="thread ? `Comment ${thread.n} on ${thread.anchor.label}` : 'New comment'"
      :style="place"
      @pointerdown.stop
    >
      <header class="head">
        <span class="micro"
          >{{ thread ? `#${thread.n}` : "New" }} · {{ thread?.anchor.label ?? b.draftThread.value?.label }}</span
        >
        <button type="button" class="icon" aria-label="Close" @click="close">
          <Icon :d="ICONS.close" :size="14" />
        </button>
      </header>
      <ol v-if="thread" class="msgs">
        <li v-for="m in thread.messages" :key="m.id" class="msg">
          <p>{{ m.text }}</p>
          <span class="meta">
            {{ ago(m.at) }}
            <button
              type="button"
              class="link"
              :aria-label="`Delete: ${m.text.slice(0, 40)}`"
              @click="b.removeMessage(thread.id, m.id)"
            >
              delete
            </button>
          </span>
        </li>
      </ol>
      <textarea
        ref="field"
        v-model="text"
        class="field"
        rows="2"
        :aria-label="thread ? 'Reply' : `Comment on ${b.draftThread.value?.label}`"
        :placeholder="thread ? 'Reply…' : 'What should change here?'"
        @keydown="key"
      />
      <footer class="foot">
        <template v-if="thread">
          <button type="button" class="act" @click="b.setResolved(thread.id, !thread.resolved)">
            {{ thread.resolved ? "Reopen" : "Resolve" }}
          </button>
          <button type="button" class="act" @click="b.moveThread(thread.id)">Move</button>
          <button type="button" class="act" @click="b.removeThread(thread.id)">Delete</button>
        </template>
        <button type="button" class="act primary" :disabled="!text.trim()" @click="send">
          {{ thread ? "Reply" : "Comment" }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.wb-comments {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}

.pin {
  position: absolute;
  display: grid;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  place-items: center;
  border-radius: 10px 10px 10px 2px;
  font-size: 10px;
  font-weight: 600;
  transform: translate(-2px, -100%);
  color: black;
  background: var(--wb-hl);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  pointer-events: auto;
}

.pin.resolved {
  color: var(--color-muted-foreground);
  background: var(--color-card);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.pin.open {
  outline: 2px solid var(--color-foreground);
  outline-offset: 1px;
}

.pin.draft {
  pointer-events: none;
}

.pop {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 11.5px;
  color: var(--color-foreground);
  background: var(--color-background);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
  pointer-events: auto;
}

.head,
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.head .micro {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-muted-foreground);
}

.foot {
  justify-content: flex-end;
}

.icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
}

.icon:hover {
  color: var(--color-foreground);
}

.msgs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.msg p {
  margin: 0;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.meta {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: var(--color-muted-foreground);
}

.link {
  min-height: 24px;
  color: var(--color-muted-foreground);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:hover {
  color: var(--color-foreground);
}

.field {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font: inherit;
  color: inherit;
  background: var(--color-card);
  resize: vertical;
}

.field:focus {
  border-color: color-mix(in oklab, var(--color-foreground) 40%, transparent);
}

.act {
  min-height: 26px;
  padding: 0 9px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--color-muted-foreground);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.act:hover:not(:disabled) {
  color: var(--color-foreground);
}

.act.primary {
  color: var(--color-background);
  background: var(--color-foreground);
  box-shadow: none;
}

.act:disabled {
  opacity: 0.4;
}
</style>
