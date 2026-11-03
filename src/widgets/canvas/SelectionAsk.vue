<script setup lang="ts">
import { computed, ref } from "vue"
import { DitherIcon } from "@dither-kit"
import { editor } from "@/entities/editor"
import { askAgent, handoff } from "@/features/agent/handoff"

// A small composer at the selection: one frame selected, a line under it
// to ask the agent about that frame. The message goes to the agent panel
// (which opens) with the frame as its context, like one typed there. It
// stays out of the way while a pointer moves frames, while picking, and
// when the frame is off the canvas; it moves above the frame when there is
// no room under it.
const props = defineProps<{
  /** A pointer is down on the canvas (a drag, a resize, a marquee). */
  held: boolean
  /** The canvas's size, to keep the line on it. */
  bounds: { w: number; h: number }
}>()

const MIN = 240
const MAX = 380
const H = 36
const GAP = 10

const frame = computed(() => {
  if (props.held || handoff.picking || editor.selectedIds.length !== 1) return null
  const a = editor.artboards.find((x) => x.id === editor.selectedIds[0])
  return a && !a.hidden ? a : null
})
const place = computed(() => {
  const a = frame.value
  if (!a) return null
  const { x, y, zoom } = editor.viewport
  const left = a.x * zoom + x
  const top = a.y * zoom + y
  const bottom = (a.y + a.h) * zoom + y
  const width = Math.min(MAX, Math.max(MIN, a.w * zoom))
  // Under the frame, else above its label, else not at all.
  const at = bottom + GAP + H <= props.bounds.h ? bottom + GAP : top - 28 - GAP - H >= 0 ? top - 28 - GAP - H : null
  if (at === null || left + width < 0 || left > props.bounds.w) return null
  return { left: Math.min(Math.max(8, left), Math.max(8, props.bounds.w - width - 8)), top: at, width }
})

const text = ref("")
const field = ref<HTMLInputElement | null>(null)
function go() {
  if (!frame.value || !text.value.trim()) return
  askAgent(text.value, [frame.value.id])
  text.value = ""
  field.value?.blur()
}
</script>

<template>
  <form
    v-if="frame && place"
    class="ask"
    :style="{ left: `${place.left}px`, top: `${place.top}px`, width: `${place.width}px` }"
    @submit.prevent="go"
    @pointerdown.stop
  >
    <DitherIcon class="mark" name="Bot" :size="13" :stroke-width="1.5" />
    <input
      ref="field"
      v-model="text"
      name="selection-ask"
      type="text"
      :placeholder="`Ask about ${frame.name}`"
      :aria-label="`Ask the agent about ${frame.name}`"
      autocomplete="off"
      spellcheck="false"
      @keydown.esc="field?.blur()"
    />
    <button
      type="submit"
      class="go"
      :class="text.trim() ? 'key-chrome' : ''"
      :disabled="!text.trim()"
      aria-label="Send to the agent"
    >
      <DitherIcon name="ArrowUp" :size="12" :stroke-width="2" />
    </button>
  </form>
</template>

<style scoped>
.ask {
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  border-radius: 12px;
  padding: 0 4px 0 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--color-card);
  box-shadow:
    var(--float-shadow),
    0 0 0 1px var(--color-border);
  transition: box-shadow 200ms var(--ease-settle);
}
.ask:focus-within {
  box-shadow:
    var(--float-shadow),
    0 0 0 1px var(--color-ring);
}
.mark {
  flex-shrink: 0;
  color: var(--color-muted-foreground);
}
input {
  min-width: 0;
  flex: 1;
  height: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--color-foreground);
  outline: none;
}
input::placeholder {
  color: var(--color-muted-foreground);
}
.go {
  display: grid;
  width: 1.625rem;
  height: 1.625rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  color: var(--color-muted-foreground);
  background: color-mix(in oklab, var(--color-foreground) 10%, transparent);
}
.go:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 1px;
}
@media (prefers-reduced-motion: reduce) {
  .ask {
    transition: none;
  }
}
</style>
