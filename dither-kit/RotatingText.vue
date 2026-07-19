<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    texts?: string[]
    interval?: number
    class?: string
  }>(),
  { texts: () => ["Vue", "canvas", "dither"], interval: 2000 }
)

const list = computed(() => (props.texts.length ? props.texts : [""]))
const idx = ref(0)
let timer = 0

function start() {
  clearInterval(timer)
  if (list.value.length < 2) return
  timer = window.setInterval(() => {
    idx.value = (idx.value + 1) % list.value.length
  }, Math.max(300, props.interval))
}

onMounted(start)
watch(() => [props.texts, props.interval], () => { idx.value = 0; start() })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <span :class="cn('dither-rotating', props.class)">
    <Transition name="dither-rot" mode="out-in">
      <span :key="idx" class="inline-block">{{ list[idx] }}</span>
    </Transition>
  </span>
</template>

<style scoped>
.dither-rotating {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}
.dither-rot-enter-active,
.dither-rot-leave-active {
  transition: opacity 300ms cubic-bezier(0.2, 0, 0, 1), transform 300ms cubic-bezier(0.2, 0, 0, 1);
}
.dither-rot-enter-from {
  opacity: 0;
  transform: translateY(0.7em);
}
.dither-rot-leave-to {
  opacity: 0;
  transform: translateY(-0.7em);
}
@media (prefers-reduced-motion: reduce) {
  .dither-rot-enter-active,
  .dither-rot-leave-active {
    transition: opacity 200ms;
  }
  .dither-rot-enter-from,
  .dither-rot-leave-to {
    transform: none;
  }
}
</style>
