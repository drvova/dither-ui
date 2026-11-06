<script setup lang="ts">
// The Studio's tour (`../guide.ts`): the mascot flies, rotor turning, to
// each part of the window, lands, and says what it is for in a bubble
// beside it.
// Next flies on; Skip, Done or Escape ends it and gives the focus back.
// Under reduced motion it moves straight there, its rotor still.
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import Mascot from "@/shared/ui/Mascot.vue"
import { type GuideStop, placeGuide } from "../guide"

const props = defineProps<{ open: boolean; stops: GuideStop[] }>()
const emit = defineEmits<{ close: [] }>()

const at = ref(0)
const pos = ref({ x: 0, y: 0 })
// Not placed yet: the first spot is taken without a flight.
const placed = ref(false)
const flying = ref(false)
const box = ref<HTMLElement | null>(null)
const nextKey = ref<HTMLButtonElement | null>(null)
const stop = computed(() => props.stops[at.value])
const last = computed(() => at.value === props.stops.length - 1)
const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

async function place(fly: boolean) {
  const s = stop.value
  await nextTick()
  const el = box.value
  if (!s || !el) return
  const view = { width: window.innerWidth, height: window.innerHeight }
  const size = { width: el.offsetWidth, height: el.offsetHeight }
  const part = s.target()?.getBoundingClientRect()
  const to = part
    ? placeGuide(part, size, view, s.end)
    : { x: Math.round((view.width - size.width) / 2), y: Math.round(view.height / 3) }
  flying.value = fly && placed.value && !still() && (to.x !== pos.value.x || to.y !== pos.value.y)
  pos.value = to
  // It lands when the flight's transition ends, or after it at the latest.
  clearTimeout(landing)
  if (flying.value) landing = setTimeout(() => (flying.value = false), 700)
}
let landing: ReturnType<typeof setTimeout> | undefined

async function go(i: number) {
  at.value = i
  props.stops[i]?.show?.()
  await place(true)
  placed.value = true
  nextKey.value?.focus({ preventScroll: true })
}

let before: HTMLElement | null = null
function close() {
  emit("close")
}
function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape") return
  e.preventDefault()
  close()
}
const onResize = () => void place(false)
watch(
  () => props.open,
  (open) => {
    if (open) {
      before = document.activeElement instanceof HTMLElement ? document.activeElement : null
      placed.value = false
      void go(0)
      window.addEventListener("keydown", onKey)
      window.addEventListener("resize", onResize)
    } else {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
      flying.value = false
      before?.focus({ preventScroll: true })
      before = null
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  clearTimeout(landing)
  window.removeEventListener("keydown", onKey)
  window.removeEventListener("resize", onResize)
})
</script>

<template>
  <div
    v-if="props.open && stop"
    ref="box"
    class="guide"
    :class="{ 'is-placed': placed, 'is-end': stop.end }"
    :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }"
    role="dialog"
    aria-label="Studio tour"
    @transitionend.self="flying = false"
  >
    <Mascot :size="40" :pose="flying ? 'fly' : 'idle'" :alive="!flying" class="guide-mascot" />
    <div class="bubble">
      <p class="line" aria-live="polite">{{ stop.line }}</p>
      <div class="keys">
        <span class="count">{{ at + 1 }} of {{ props.stops.length }}</span>
        <button v-if="!last" type="button" class="skip" @click="close">Skip</button>
        <button ref="nextKey" type="button" class="key-chrome next" @click="last ? close() : go(at + 1)">
          {{ last ? "Done" : "Next" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fixed at the window's corner and moved by its transform, so a flight is
   one transition of one layer. */
.guide {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 55;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: min(20rem, calc(100vw - 16px));
}
/* By a key on the right, the mascot sits at the right end, under it. */
.guide.is-end {
  flex-direction: row-reverse;
}
@media (prefers-reduced-motion: no-preference) {
  .guide.is-placed {
    transition: transform 500ms var(--ease-settle);
  }
}
.guide-mascot {
  color: var(--color-foreground);
}
.bubble {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 10px;
  margin-top: 6px;
  border-radius: 14px;
  padding: 12px 12px 10px 14px;
  background: var(--popover);
  color: var(--popover-foreground);
  box-shadow: 0 18px 44px -16px rgb(0 0 0 / 0.55);
}
.line {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  text-wrap: pretty;
}
.keys {
  display: flex;
  align-items: center;
  gap: 6px;
}
.count {
  margin-right: auto;
  font-size: 11px;
  color: var(--color-muted-foreground);
}
.skip {
  min-height: 1.75rem;
  border-radius: 8px;
  padding-inline: 8px;
  font-size: 12px;
  color: var(--color-muted-foreground);
  transition: color 200ms var(--ease-settle);
}
.skip:hover {
  color: var(--color-foreground);
}
.next {
  min-height: 1.75rem;
  padding-inline: 14px;
  font-size: 12px;
  font-weight: 500;
}
.skip:focus-visible,
.next:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .skip {
    transition: none;
  }
}
</style>
