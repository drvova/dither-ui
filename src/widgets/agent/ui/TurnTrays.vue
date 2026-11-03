<script setup lang="ts">
import { computed, ref } from "vue"
import { DitherIcon } from "@dither-kit"
import type { Changed } from "../model/steps"
import type { Todo } from "../model/thread"

// Over the composer: the turn's plan as to-dos, the queue, the run (what
// the harness is doing, for how long, Stop) and, once it ends, what the
// turn changed on the canvas (Undo all, Keep, each frame to show).
const props = defineProps<{
  todos: Todo[] | null
  queue: string[]
  /** The run, while it lasts: what the harness is doing and for how long. */
  run: { doing: string; time: string } | null
  changes: { frames: Changed[] } | null
  /** Frames still on the canvas (a removed one has nothing to show). */
  shown: (id: string) => boolean
}>()
const emit = defineEmits<{ stop: []; unqueue: [at: number]; undo: []; keep: []; show: [id: string] }>()
const todosOpen = ref(true)
const changesOpen = ref(false)
const done = computed(() => props.todos?.filter((t) => t.status === "completed").length ?? 0)
</script>

<template>
  <div v-if="todos?.length" class="tray">
    <button type="button" class="tray-head" :aria-expanded="todosOpen" @click="todosOpen = !todosOpen">
      <DitherIcon :name="todosOpen ? 'ChevronDown' : 'ChevronRight'" :size="11" :stroke-width="1.5" />
      <span>{{ todos.length }} {{ todos.length === 1 ? "to-do" : "to-dos" }}</span>
      <span class="dim">{{ done }} of {{ todos.length }} done</span>
    </button>
    <ul v-if="todosOpen" class="rows">
      <li v-for="(t, j) in todos" :key="j" class="row" :data-status="t.status">
        <DitherIcon v-if="t.status === 'completed'" name="CheckCircle" :size="12" :stroke-width="1.5" /><span
          v-else
          class="circle"
          aria-hidden="true"
        ></span
        ><span class="row-text">{{ t.content }}</span>
      </li>
    </ul>
  </div>
  <div v-if="queue.length" class="tray">
    <p class="tray-head">
      <span>{{ queue.length }} in queue</span>
    </p>
    <ul class="rows">
      <li v-for="(s, j) in queue" :key="j" class="row">
        <span class="circle" aria-hidden="true"></span><span class="row-text" :title="s">{{ s }}</span>
        <button type="button" class="row-key" :aria-label="`Remove ${s} from the queue`" @click="emit('unqueue', j)">
          <DitherIcon name="Close" :size="11" :stroke-width="1.5" />
        </button>
      </li>
    </ul>
  </div>
  <div v-if="run" class="tray generating">
    <span class="spin" aria-hidden="true"></span>
    <span>{{ run.doing }}… {{ run.time }}</span>
    <button type="button" class="key stop" title="Stop (esc)" @click="emit('stop')">Stop</button>
  </div>
  <div v-else-if="changes" class="tray">
    <div class="tray-head is-split">
      <button type="button" class="tray-toggle" :aria-expanded="changesOpen" @click="changesOpen = !changesOpen">
        <DitherIcon :name="changesOpen ? 'ChevronDown' : 'ChevronRight'" :size="11" :stroke-width="1.5" />
        <span>{{ changes.frames.length }} {{ changes.frames.length === 1 ? "frame" : "frames" }} changed</span>
      </button>
      <button type="button" class="key" @click="emit('undo')">Undo all</button>
      <button type="button" class="key is-primary" @click="emit('keep')">Keep</button>
    </div>
    <ul v-if="changesOpen" class="rows">
      <li v-for="f in changes.frames" :key="f.id" class="row">
        <DitherIcon name="Layout" :size="12" :stroke-width="1.5" /><span class="row-text">{{ f.name }}</span>
        <button v-if="shown(f.id)" type="button" class="row-key is-word" @click="emit('show', f.id)">Show</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tray {
  display: grid;
  gap: 2px;
  border-radius: 10px;
  padding: 4px 6px;
  background: var(--color-card);
  font-size: 11px;
}
.tray-head,
.tray-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 1.5rem;
  min-width: 0;
  margin: 0;
  border-radius: 6px;
  padding-inline: 4px;
  text-align: left;
  color: var(--color-foreground);
}
.tray-head .dim {
  margin-left: auto;
}
.tray-head.is-split {
  padding: 0;
  gap: 4px;
}
.tray-toggle {
  flex: 1;
}
.rows {
  display: grid;
  max-height: 8.5rem;
  overflow-y: auto;
  margin: 0;
  padding: 0 0 2px;
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
.row[data-status="completed"] {
  color: var(--color-muted-foreground);
}
.row[data-status="completed"] .row-text {
  text-decoration: line-through;
}
.row-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.circle {
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
.generating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 10px;
  color: var(--color-muted-foreground);
}
.generating .stop {
  margin-left: auto;
}
.tray-head:focus-visible,
.tray-toggle:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 1px;
}
</style>
