<script setup lang="ts">
// The mascot (`mascot.ts`): the brand's diamond come alive, drawn cell by
// cell in the ink around it with an ember heart and antenna tips. `size` is
// its height in px. `alive` lets it blink now and then, never under reduced
// motion; a pointer on it makes it hop. Posed to fly, its rotor turns (held
// still under reduced motion). Decorative: what it stands beside says what
// it means.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { MASCOT_H, MASCOT_ROTOR_STEPS, MASCOT_W, type MascotPose, mascotCells } from "./mascot"

const props = withDefaults(defineProps<{ size: number; pose?: MascotPose; alive?: boolean }>(), {
  pose: "idle",
  alive: false,
})

const now = ref<MascotPose | null>(null)
// Flying, neither a blink nor a hop takes it out of the air.
const shown = computed(() => (props.pose === "fly" ? "fly" : (now.value ?? props.pose)))
const turn = ref(0)
const cells = computed(() => mascotCells(shown.value, turn.value))

let timer: ReturnType<typeof setTimeout> | undefined
const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
function blinkLater() {
  timer = setTimeout(
    () => {
      now.value = "blink"
      timer = setTimeout(() => {
        now.value = null
        blinkLater()
      }, 140)
    },
    3200 + Math.random() * 3600,
  )
}
onMounted(() => {
  if (props.alive && !still()) blinkLater()
})
// The rotor: a step every 60ms while it flies, a quarter turn a frame.
let spin: ReturnType<typeof setInterval> | undefined
watch(
  () => shown.value === "fly",
  (flying) => {
    clearInterval(spin)
    turn.value = 0
    if (flying && !still()) spin = setInterval(() => (turn.value = (turn.value + 1) % MASCOT_ROTOR_STEPS), 60)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  clearTimeout(timer)
  clearInterval(spin)
})

function hop() {
  if (still() || shown.value === "fly") return
  now.value = "hop"
  clearTimeout(timer)
  timer = setTimeout(() => {
    now.value = null
    if (props.alive) blinkLater()
  }, 220)
}
</script>

<template>
  <svg
    class="mascot"
    :viewBox="`0 0 ${MASCOT_W} ${MASCOT_H}`"
    :height="props.size"
    :width="(props.size * MASCOT_W) / MASCOT_H"
    aria-hidden="true"
    focusable="false"
    shape-rendering="crispEdges"
    @pointerenter="hop"
  >
    <rect
      v-for="c in cells"
      :key="`${c.x}.${c.y}`"
      :x="c.x"
      :y="c.y"
      width="1"
      height="1"
      :fill="c.ink === 'ember' ? 'var(--signal, var(--swatch-orange))' : 'currentColor'"
    />
  </svg>
</template>

<style scoped>
.mascot {
  flex-shrink: 0;
  overflow: visible;
}
</style>
