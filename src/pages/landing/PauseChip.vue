<script setup lang="ts">
// The pause control of a surface that moves by itself (WCAG 2.2.2): a round
// toggle button (stable name, `aria-pressed` while paused) whose glyph
// morphs pause ↔ play. 32px, the chrome hit-area floor.
const playing = defineModel<boolean>({ required: true })
defineProps<{ label: string }>()
</script>

<template>
  <button type="button" class="pause-chip" :aria-pressed="!playing" :aria-label="label" @click="playing = !playing">
    <span class="pause-glyph" :data-paused="playing ? undefined : 'true'" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
/* Soft glass over the surface. */
.pause-chip {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  color: var(--color-foreground);
  background: color-mix(in oklab, #000 62%, transparent);
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.pause-chip:hover {
  background: color-mix(in oklab, #000 40%, transparent);
}

@media (prefers-reduced-transparency: reduce) {
  .pause-chip {
    background-color: #000;
  }
}

/* Pause: two bars. Play: a triangle. */
.pause-glyph {
  width: 10px;
  height: 10px;
  background:
    linear-gradient(currentColor, currentColor) left / 3px 100% no-repeat,
    linear-gradient(currentColor, currentColor) right / 3px 100% no-repeat;
}

.pause-glyph[data-paused] {
  background: currentColor;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}
</style>
