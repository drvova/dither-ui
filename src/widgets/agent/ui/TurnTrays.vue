<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { DitherIcon } from "@dither-kit"
import type { Queued } from "../model/compose"
import type { Changed } from "../model/steps"
import type { Todo } from "../model/thread"

// The stack over the input, rows on the composer's own surface (one piece
// with the card under it): what to ask next, the turn's plan as to-dos,
// the queue (each message to edit, send now, move up or remove; paused
// after a stop until you send the next), the run (what the harness does, for how long, a quiet Stop)
// and, last and resting on the card, what the turn changed on the canvas
// (Undo all, Keep, each frame to show).
const props = defineProps<{
  /** Next prompts to offer, one tap each. */
  next: string[]
  todos: Todo[] | null
  queue: Queued[]
  /** The queue waits after a stop until Send next or a new message. */
  paused: boolean
  /** The run, while it lasts; `stuck`: a stop the harness has not answered. */
  run: { doing: string; time: string; stopping: boolean; stuck: boolean } | null
  changes: { frames: Changed[] } | null
  /** Frames still on the canvas (a removed one has nothing to show). */
  shown: (id: string) => boolean
}>()
const emit = defineEmits<{
  ask: [text: string]
  stop: []
  forceStop: []
  unqueue: [id: string]
  editQueued: [id: string]
  sendNow: [id: string]
  moveUp: [id: string]
  clearQueue: []
  resume: []
  undo: []
  keep: []
  show: [id: string]
}>()
const changesOpen = ref(false)
const done = computed(() => props.todos?.filter((t) => t.status === "completed").length ?? 0)
/** The to-dos stay open while there is work left and fold once all are
 * done, unless the reader opened or closed them. */
const todosChosen = ref<boolean | null>(null)
const todosOpen = computed(() => todosChosen.value ?? done.value < (props.todos?.length ?? 0))
// A new turn's plan starts from the default again.
watch(
  () => !!props.todos?.length,
  (has) => has || (todosChosen.value = null),
)
</script>

<template>
  <div v-if="next.length" class="part">
    <button
      v-for="s in next"
      :key="s"
      type="button"
      class="row is-key first-line"
      :title="`Send: ${s}`"
      @click="emit('ask', s)"
    >
      <DitherIcon name="Sparkles" :size="12" :stroke-width="1.5" /><span class="row-text row-label is-wrap">{{
        s
      }}</span
      ><DitherIcon class="go" name="ArrowUp" :size="11" :stroke-width="1.5" />
    </button>
  </div>
  <div v-if="todos?.length" class="part">
    <button type="button" class="head" :aria-expanded="todosOpen" @click="todosChosen = !todosOpen">
      <DitherIcon :name="todosOpen ? 'ChevronDown' : 'ChevronRight'" :size="12" :stroke-width="1.5" />
      <span class="row-label">{{ todos.length }} {{ todos.length === 1 ? "to-do" : "to-dos" }}</span>
      <span class="row-label dim">{{ done }} of {{ todos.length }} done</span>
    </button>
    <ul v-if="todosOpen" class="rows">
      <li v-for="(t, j) in todos" :key="j" class="row first-line" :data-status="t.status">
        <DitherIcon v-if="t.status === 'completed'" name="CheckCircle" :size="12" :stroke-width="1.5" /><span
          v-else
          class="circle"
          aria-hidden="true"
        ></span
        ><span class="row-text row-label is-wrap">{{ t.content }}</span>
      </li>
    </ul>
  </div>
  <div v-if="queue.length" class="part">
    <div class="head is-split">
      <p class="grow is-static">
        <span class="row-label">{{ queue.length }} in queue</span>
      </p>
      <button v-if="paused && !run" type="button" class="key is-primary" @click="emit('resume')">
        <span class="row-label">Send next</span>
      </button>
      <button type="button" class="key" @click="emit('clearQueue')"><span class="row-label">Clear</span></button>
    </div>
    <p v-if="paused" class="row first-line dim">
      <DitherIcon name="Pause" :size="12" :stroke-width="1.5" /><span class="row-text row-label is-wrap"
        >Paused after the stop. Send next, or Enter in an empty field, goes on.</span
      >
    </p>
    <ul class="rows">
      <li v-for="(q, j) in queue" :key="q.id" class="row first-line">
        <span class="circle" aria-hidden="true"></span
        ><span class="row-text row-label is-wrap" :title="q.text"
          >{{ q.text || "(no words)"
          }}<template v-if="q.attachments.length">
            <span class="dim">
              with {{ q.attachments.length }} {{ q.attachments.length === 1 ? "attachment" : "attachments" }}</span
            ></template
          ></span
        >
        <button
          v-if="j > 0"
          type="button"
          class="row-key"
          :aria-label="`Move up: ${q.text}`"
          title="Move up"
          @click="emit('moveUp', q.id)"
        >
          <DitherIcon name="ArrowUp" :size="11" :stroke-width="1.5" />
        </button>
        <button
          type="button"
          class="row-key"
          :aria-label="`Edit: ${q.text}`"
          title="Edit (alt ↑ takes the last back)"
          @click="emit('editQueued', q.id)"
        >
          <DitherIcon name="Edit" :size="11" :stroke-width="1.5" />
        </button>
        <button
          type="button"
          class="row-key is-word"
          :title="run ? 'Stop the turn and send this next' : 'Send this now'"
          @click="emit('sendNow', q.id)"
        >
          <span class="row-label">Send now</span>
        </button>
        <button
          type="button"
          class="row-key"
          :aria-label="`Remove: ${q.text}`"
          title="Remove"
          @click="emit('unqueue', q.id)"
        >
          <DitherIcon name="Close" :size="11" :stroke-width="1.5" />
        </button>
      </li>
    </ul>
  </div>
  <div v-if="run" class="part run">
    <span class="spin" aria-hidden="true"></span>
    <span class="row-label run-time">{{ run.doing }} for {{ run.time }}</span>
    <button
      v-if="run.stuck"
      type="button"
      class="quiet text-destructive"
      title="The harness is not answering the stop: end its process"
      @click="emit('forceStop')"
    >
      <span class="row-label">Force stop</span>
    </button>
    <button v-else type="button" class="quiet" title="Stop (esc)" :disabled="run.stopping" @click="emit('stop')">
      <span class="row-label">{{ run.stopping ? "Stopping…" : "Stop" }}</span
      ><kbd v-if="!run.stopping" class="row-label">esc</kbd>
    </button>
  </div>
  <div v-else-if="changes" class="part">
    <div class="head is-split">
      <button type="button" class="toggle" :aria-expanded="changesOpen" @click="changesOpen = !changesOpen">
        <DitherIcon :name="changesOpen ? 'ChevronDown' : 'ChevronRight'" :size="12" :stroke-width="1.5" />
        <span class="row-label"
          >{{ changes.frames.length }} {{ changes.frames.length === 1 ? "frame" : "frames" }} changed</span
        >
      </button>
      <button type="button" class="key" @click="emit('undo')"><span class="row-label">Undo all</span></button>
      <button type="button" class="key is-primary" @click="emit('keep')"><span class="row-label">Keep</span></button>
    </div>
    <ul v-if="changesOpen" class="rows">
      <li v-for="f in changes.frames" :key="f.id" class="row first-line">
        <DitherIcon name="Layout" :size="12" :stroke-width="1.5" /><span class="row-text row-label is-wrap">{{
          f.name
        }}</span>
        <button v-if="shown(f.id)" type="button" class="row-key is-word" @click="emit('show', f.id)">
          <span class="row-label">Show</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* A part of the stack: rows straight on the composer's surface, a hairline
   between parts (none over the card, whose edge is its own), every glyph
   and key on the composer's `--inset` line (rows pad 4px of it). */
.part {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  padding: 3px calc(var(--inset, 10px) - 4px) 4px;
  font-size: 11px;
}
.part + .part {
  box-shadow: inset 0 1px 0 var(--color-border);
}
.head,
.toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 1.5rem;
  min-width: 0;
  margin: 0;
  border-radius: 6px;
  padding-inline: 4px;
  text-align: left;
  color: var(--color-foreground);
}
.row.dim {
  margin: 0;
  color: var(--color-muted-foreground);
}
.head .dim {
  margin-left: auto;
}
.head.is-split {
  padding: 0 4px 0 0;
  gap: 4px;
}
.toggle,
.grow {
  flex: 1;
}
.grow {
  margin: 0;
  padding-left: 4px;
}
.rows {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  max-height: 8.5rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 1.5rem;
  padding-inline: 4px;
  color: var(--color-foreground);
}
.row.is-key {
  border-radius: 6px;
  text-align: left;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.row.is-key:hover {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 7%, transparent);
}
.row.is-key .go {
  --glyph: 11px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 200ms var(--ease-settle);
}
.row.is-key:hover .go,
.row.is-key:focus-visible .go {
  opacity: 1;
}
.row[data-status="completed"] {
  color: var(--color-muted-foreground);
}
.row[data-status="completed"] .row-text {
  text-decoration: line-through;
}
.row-text {
  flex: 1;
}
.circle {
  --glyph: 10px;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-inline: 1px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.25px var(--color-muted-foreground);
}
.row[data-status="in_progress"] .circle {
  box-shadow:
    inset 0 0 0 1.25px var(--color-foreground),
    inset 0 0 0 3px var(--color-card),
    inset 0 0 0 5px var(--color-foreground);
}
/* The spinner on the line, its words on the text column, Stop's words
   ending on the line (its key pads 6px past them). */
.run {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-inline: var(--inset, 10px) calc(var(--inset, 10px) - 6px);
  color: var(--color-muted-foreground);
}
.run-time {
  font-variant-numeric: tabular-nums;
}
/* Stop is quiet: a word and its key, never the loudest thing on screen. */
.quiet {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 1.5rem;
  margin-left: auto;
  border-radius: 6px;
  padding-inline: 6px;
  color: var(--color-muted-foreground);
  transition:
    color 200ms var(--ease-settle),
    background-color 200ms var(--ease-settle);
}
.quiet:hover:not(:disabled) {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 7%, transparent);
}
.quiet.text-destructive {
  color: var(--color-destructive);
}
.quiet kbd {
  font: inherit;
  font-size: 10px;
  color: var(--color-muted-foreground);
}
.head:focus-visible,
.toggle:focus-visible,
.row.is-key:focus-visible,
.quiet:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
@media (prefers-reduced-motion: reduce) {
  .row.is-key,
  .row.is-key .go,
  .quiet {
    transition: none;
  }
}
</style>
