<script setup lang="ts">
// Text notes on the stage. Written in place: Enter keeps the note,
// Shift+Enter breaks the line, Escape or leaving the field keeps it too;
// an empty note goes. Double-click a note (Select or any annotate tool)
// to write in it again.
import { nextTick, ref, watch } from "vue"
import { useBench } from "../context"

const b = useBench()
const field = ref<HTMLTextAreaElement[]>([])
const text = ref("")

watch(
  () => b.editing.value,
  async (id) => {
    text.value = b.ws.value.notes.find((n) => n.id === id)?.text ?? ""
    await nextTick()
    field.value[0]?.focus()
  },
  { immediate: true },
)

function done(id: string) {
  if (b.editing.value === id) b.commitNote(id, text.value)
}

function key(e: KeyboardEvent, id: string) {
  if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
    e.preventDefault()
    e.stopPropagation()
    done(id)
  }
}
</script>

<template>
  <div class="wb-notes">
    <div
      v-for="n in b.ws.value.notes"
      :key="n.id"
      class="note"
      :class="{ on: b.isSelected({ kind: 'notes', id: n.id }) }"
      :data-note="n.id"
      :style="{ left: `${n.at.x}px`, top: `${n.at.y}px`, color: n.color, fontSize: `${n.size}px` }"
    >
      <textarea
        v-if="b.editing.value === n.id"
        ref="field"
        v-model="text"
        class="field"
        :rows="Math.max(1, text.split('\n').length)"
        :cols="Math.max(8, ...text.split('\n').map((l) => l.length + 1))"
        aria-label="Note text"
        placeholder="Write a note"
        @keydown="key($event, n.id)"
        @blur="done(n.id)"
      />
      <span v-else>{{ n.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.wb-notes {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.note {
  position: absolute;
  max-width: 280px;
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1.35;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: color-mix(in oklab, var(--color-background) 82%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, currentColor 30%, transparent);
}

/* The field's ring is the note's own outline while it is written in. */
.note:focus-within {
  outline: 1px solid var(--wb-hl);
  outline-offset: 2px;
}

.note.on {
  outline: 1px dashed var(--wb-hl);
  outline-offset: 2px;
}

.field {
  display: block;
  min-width: 8ch;
  max-width: 270px;
  padding: 0;
  border: 0;
  font: inherit;
  line-height: inherit;
  color: inherit;
  background: none;
  resize: none;
  outline: none;
  pointer-events: auto;
  field-sizing: content;
}

@media (prefers-reduced-transparency: reduce) {
  .note {
    background: var(--color-background);
  }
}
</style>
