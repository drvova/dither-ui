<script setup lang="ts">
// A film's pause control: a toggle button (stable name, `aria-pressed`
// while paused) whose glyph morphs pause ↔ play, plus whatever the slot
// says (a timecode), if anything — without it, a round icon button. 32px
// tall — the chrome hit-area floor.
const playing = defineModel<boolean>({ required: true })
defineProps<{ label: string }>()
</script>

<template>
  <button type="button" class="film-chip" :aria-pressed="!playing" :aria-label="label" @click="playing = !playing">
    <span class="film-glyph" :data-paused="playing ? undefined : 'true'" aria-hidden="true"></span>
    <span v-if="$slots.default" class="film-text tabular-nums" aria-hidden="true"><slot /></span>
  </button>
</template>

<style scoped>
/* Soft glass over the film: a round icon button, or a pill with its
   timecode. */
.film-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 32px;
  height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  color: var(--color-foreground);
  background: color-mix(in oklab, #000 62%, transparent);
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.film-chip:hover {
  background: color-mix(in oklab, #000 40%, transparent);
}

.film-text {
  font-size: 0.75rem;
}

@media (prefers-reduced-transparency: reduce) {
  .film-chip {
    background-color: #000;
  }
}

/* Pause: two bars. Play: a triangle. */
.film-glyph {
  width: 10px;
  height: 10px;
  background:
    linear-gradient(currentColor, currentColor) left / 3px 100% no-repeat,
    linear-gradient(currentColor, currentColor) right / 3px 100% no-repeat;
}

.film-glyph[data-paused] {
  background: currentColor;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}
</style>
