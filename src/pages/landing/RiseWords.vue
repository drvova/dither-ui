<script setup lang="ts">
// A headline's words for the rise (`vRise`): each its own box, so each can
// travel, with the spaces between them left as text, so the line still
// breaks and reads as one. `word` is a class every word wears (the hero's
// chrome ramp sits on each word, one horizon per line).
import { computed } from "vue"

const props = defineProps<{ text: string; word?: string }>()
const words = computed(() => props.text.split(" "))
</script>

<template>
  <template v-for="(w, i) in words" :key="i"
    ><span data-rise="word" class="rise-word" :class="word">{{ w }}</span
    ><template v-if="i < words.length - 1">{{ " " }}</template></template
  >
</template>

<style scoped>
.rise-word {
  display: inline-block;
}
</style>
