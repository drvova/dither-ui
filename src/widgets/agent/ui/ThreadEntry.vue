<script setup lang="ts">
import { DitherIcon } from "@dither-kit"
import { type Entry, secondsOf } from "../model/thread"
import Prose from "./Prose.vue"

// One entry of the composer's thread, as the panel hands it: your message
// as a bubble (its restore key beside it), the reply as prose with a copy
// key, the harness's reasoning and each step as folds, a permission prompt
// answered in place, the turn's close. The panel owns every state; this
// only draws it and says what was asked.
defineProps<{
  entry: Entry
  /** The reply streaming now / the thought streaming now. */
  live?: boolean
  /** The reply was just copied. */
  copied?: boolean
  /** The message's checkpoint can be restored. */
  restorable?: boolean
}>()
const emit = defineEmits<{ restore: []; copy: []; answer: [id: string]; toggle: [open: boolean] }>()
const toggled = (e: Event) => emit("toggle", (e.target as HTMLDetailsElement).open)
</script>

<template>
  <div v-if="entry.kind === 'user' || entry.kind === 'followup'" class="msg-row">
    <button
      v-if="restorable"
      type="button"
      class="restore"
      aria-label="Restore checkpoint"
      title="Restore checkpoint: the canvas as it was before this message"
      @click="emit('restore')"
    >
      <DitherIcon name="Undo" :size="12" :stroke-width="1.5" />
    </button>
    <div class="msg">
      <div v-if="entry.context?.length" class="chips">
        <span
          v-for="c in entry.context"
          :key="c.id"
          class="ctx"
          :title="entry.pictured ? `${c.name}, sent with a picture` : c.name"
          ><DitherIcon :name="entry.pictured ? 'Image' : 'Layout'" :size="11" :stroke-width="1.5" />{{ c.name }}</span
        >
      </div>
      <p class="msg-text">{{ entry.text }}</p>
    </div>
  </div>
  <div v-else-if="entry.kind === 'assistant'" class="reply">
    <Prose :text="entry.text" :live="live" />
    <div v-if="!live" class="reply-actions">
      <button
        type="button"
        class="row-key"
        :aria-label="copied ? 'Copied' : 'Copy reply'"
        :title="copied ? 'Copied' : 'Copy reply'"
        @click="emit('copy')"
      >
        <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="12" :stroke-width="1.5" />
      </button>
    </div>
  </div>
  <details v-else-if="entry.kind === 'thought'" class="thought fold" :open="entry.open" @toggle="toggled">
    <summary>
      <span v-if="live" class="spin" aria-hidden="true"></span
      ><DitherIcon v-else name="Sparkles" :size="12" :stroke-width="1.5" /><span>{{
        live ? "Thinking" : entry.ms ? `Thought for ${secondsOf(entry.ms)}` : "Thought"
      }}</span
      ><DitherIcon class="chev" name="ChevronRight" :size="11" :stroke-width="1.5" />
    </summary>
    <p class="thought-text">{{ entry.text.trim() }}</p>
  </details>
  <details
    v-else-if="entry.kind === 'tool'"
    class="step fold"
    :open="entry.open"
    :data-ok="String(entry.ok)"
    @toggle="toggled"
  >
    <summary :title="entry.summary">
      <DitherIcon :name="entry.icon ?? 'Terminal'" :size="12" :stroke-width="1.5" /><span class="step-title">{{
        entry.title || entry.name
      }}</span
      ><DitherIcon class="chev" name="ChevronRight" :size="11" :stroke-width="1.5" />
    </summary>
    <pre class="detail">{{ entry.detail }}</pre>
  </details>
  <div v-else-if="entry.kind === 'activity'" class="step activity" :data-status="entry.status">
    <span v-if="entry.status === 'pending' || entry.status === 'in_progress'" class="spin" aria-hidden="true"></span>
    <DitherIcon
      v-else
      :name="entry.status === 'failed' ? 'XCircle' : 'CheckCircle'"
      :size="12"
      :stroke-width="1.5"
    /><span class="step-title">{{ entry.title }}</span>
  </div>
  <div v-else-if="entry.kind === 'approval'" class="approval" :data-answered="String(entry.answered !== null)">
    <p class="approval-title"><DitherIcon name="AlertTriangle" :size="12" :stroke-width="1.5" />{{ entry.title }}</p>
    <div v-if="entry.answered === null" class="choices">
      <button
        v-for="o in entry.options"
        :key="o.id"
        type="button"
        class="key"
        :class="o.primary ? 'is-primary' : ''"
        @click="emit('answer', o.id)"
      >
        {{ o.label }}
      </button>
    </div>
    <p v-else class="note">Answered {{ entry.answered }}</p>
  </div>
  <p v-else-if="entry.kind === 'worked'" class="worked">
    <DitherIcon name="Clock" :size="11" :stroke-width="1.5" />Worked for {{ secondsOf(entry.ms) }}
  </p>
  <p v-else-if="entry.kind === 'error'" class="line-error">{{ entry.text }}</p>
  <p v-else-if="entry.kind === 'system'" class="line-system">{{ entry.text }}</p>
</template>

<style scoped>
.msg-row {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 4px;
  padding-left: 1.5rem;
}
.msg {
  display: grid;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  border-radius: 12px 12px 4px 12px;
  padding: 7px 10px;
  background: var(--color-card);
}
.msg-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--color-foreground);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.restore {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  margin-top: 3px;
  place-items: center;
  border-radius: 7px;
  color: var(--color-muted-foreground);
  opacity: 0;
  transition:
    opacity 200ms var(--ease-settle),
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.msg-row:hover .restore,
.restore:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .restore {
    opacity: 1;
  }
}
.restore:hover {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
.reply {
  display: grid;
  gap: 2px;
}
.reply-actions {
  display: flex;
  margin: -2px 0 -6px -4px;
  opacity: 0;
  transition: opacity 200ms var(--ease-settle);
}
.reply:hover .reply-actions,
.reply-actions:focus-within,
.reply:last-child .reply-actions {
  opacity: 1;
}
@media (hover: none) {
  .reply-actions {
    opacity: 1;
  }
}
/* The harness's reasoning: a quiet fold, open while it streams. */
.thought {
  font-size: 11.5px;
  color: var(--color-muted-foreground);
}
.thought-text {
  max-height: 9rem;
  overflow-y: auto;
  margin: 4px 0 2px 5px;
  padding-left: 13px;
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-shadow: inset 1px 0 0 var(--color-border);
}
.step {
  font-size: 11.5px;
  color: var(--color-muted-foreground);
}
.step-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.step[data-ok="false"],
.activity[data-status="failed"] {
  color: var(--color-destructive);
}
.detail {
  margin: 4px 0 2px 19px;
  max-height: 14rem;
  overflow: auto;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 10.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--color-muted-foreground);
  background: var(--well);
  box-shadow: var(--recess-sm);
}
.approval {
  display: grid;
  gap: 8px;
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--color-card);
}
.approval[data-answered="true"] {
  background: none;
  padding-block: 0;
}
.approval-title {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
}
.approval-title :deep(svg) {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--swatch-orange);
}
.approval[data-answered="true"] .approval-title {
  color: var(--color-muted-foreground);
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.line-system,
.line-error {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--color-muted-foreground);
}
.line-error {
  color: var(--color-destructive);
}
.msg .ctx {
  color: var(--color-muted-foreground);
}
.activity {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 1.5rem;
  line-height: 1.4;
}
.step summary {
  line-height: 1.4;
}
.worked {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  font-size: 10.5px;
  color: var(--color-muted-foreground);
}
@media (prefers-reduced-motion: reduce) {
  .restore,
  .reply-actions {
    transition: none;
  }
}
</style>
