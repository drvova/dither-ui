<script setup lang="ts">
// A film's pause control: a toggle button (stable name, `aria-pressed`
// while paused) whose square glyph morphs pause ↔ play, plus whatever the
// slot says (a timecode, a name). 32px tall — the chrome hit-area floor.
const playing = defineModel<boolean>({ required: true })
defineProps<{ label: string }>()
</script>

<template>
  <button type="button" class="film-chip" :aria-pressed="!playing" :aria-label="label" @click="playing = !playing">
    <span class="film-glyph" :data-paused="playing ? undefined : 'true'" aria-hidden="true"></span>
    <span class="micro tabular-nums" aria-hidden="true"><slot /></span>
  </button>
</template>

<style scoped>
.film-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 12px 0 10px;
  color: var(--color-foreground);
  background: #000;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-border) 90%, transparent);
  transition:
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.film-chip:hover {
  background: color-mix(in oklab, var(--color-foreground) 7%, #000);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 28%, transparent);
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
