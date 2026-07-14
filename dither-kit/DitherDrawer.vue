<script lang="ts">
import type { InjectionKey } from "vue"

export type DrawerSide = "right" | "left" | "bottom"

/** Nested-drawer channel: a child drawer tells its parent to push back. */
export type DrawerChannel = { notify: (delta: number) => void }
export const DRAWER_CHANNEL: InjectionKey<DrawerChannel> = Symbol("dither-drawer")
</script>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, provide, ref, watch } from "vue"
import { project, rubberband, velocityFrom, type VelocitySample } from "./gesture"
import { pixelPrefersReducedMotion } from "./pixel"

const props = withDefaults(
  defineProps<{
    open: boolean
    side?: DrawerSide
    title?: string
    /** Swipe-to-dismiss gesture on the panel. */
    swipe?: boolean
  }>(),
  { side: "right", swipe: true }
)
const emit = defineEmits<{ close: [] }>()

const closeRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v) nextTick(() => closeRef.value?.focus())
  }
)

// --- nesting: push this drawer back while a child drawer is open ------------
const parent = inject(DRAWER_CHANNEL, null)
const childOpen = ref(0)
provide(DRAWER_CHANNEL, { notify: (d) => (childOpen.value += d) })
watch(
  () => props.open,
  (v, old) => {
    if (parent && v !== !!old) parent.notify(v ? 1 : -1)
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  if (parent && props.open) parent.notify(-1)
})

// --- swipe to dismiss: 1:1 tracking, rubber-band, momentum projection -------
const axis = computed(() => (props.side === "bottom" ? "y" : "x"))
const dismissSign = computed(() => (props.side === "left" ? -1 : 1))
const dragging = ref(false)
const offset = ref(0) // px toward dismissal (negative = rubber-banded peek)
let start = 0
let size = 320
let samples: VelocitySample[] = []

const pos = (e: PointerEvent) => (axis.value === "y" ? e.clientY : e.clientX)

function onDown(e: PointerEvent) {
  if (!props.swipe || childOpen.value > 0) return
  const t = e.target as HTMLElement
  if (t.closest("button, a, input, textarea, select, [data-no-swipe]")) return
  const panel = panelRef.value
  if (!panel) return
  dragging.value = true
  start = pos(e)
  size = axis.value === "y" ? panel.offsetHeight : panel.offsetWidth
  samples = [{ t: e.timeStamp, p: pos(e) }]
  panel.setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (!dragging.value) return
  samples.push({ t: e.timeStamp, p: pos(e) })
  if (samples.length > 6) samples.shift()
  const d = (pos(e) - start) * dismissSign.value
  offset.value = d >= 0 ? d : -rubberband(-d, size)
}
function onUp() {
  if (!dragging.value) return
  dragging.value = false
  const v = velocityFrom(samples) * dismissSign.value
  const projected = offset.value + project(v)
  // Velocity sign decides on a flick; projection decides on a slow drag.
  if (offset.value > 0 && (v > 500 || (projected > size * 0.5 && v > -100))) {
    dismiss()
  } else {
    offset.value = 0 // settle back through the transition
  }
}
function dismiss() {
  if (pixelPrefersReducedMotion()) {
    offset.value = 0
    emit("close")
    return
  }
  offset.value = size * 1.05 // glide out from the presentation value…
  window.setTimeout(() => {
    emit("close") // …then unmount where the leave transition is a no-op
    offset.value = 0
  }, 180)
}

const panelStyle = computed(() => {
  if (childOpen.value > 0) {
    const push =
      props.side === "bottom" ? "translateY(10px)" : `translateX(${12 * dismissSign.value}px)`
    return { transform: `${push} scale(0.97)`, filter: "brightness(0.75)" }
  }
  if (offset.value === 0) return {}
  const t =
    axis.value === "y"
      ? `translateY(${offset.value}px)`
      : `translateX(${offset.value * dismissSign.value}px)`
  return { transform: t }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-fade">
      <div
        v-if="props.open"
        aria-hidden="true"
        class="fixed inset-0 z-50 bg-black/60"
        @click="emit('close')"
      />
    </Transition>
    <Transition :name="props.side === 'bottom' ? 'dk-slide-b' : props.side === 'right' ? 'dk-slide-r' : 'dk-slide-l'">
      <div
        v-if="props.open"
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
        class="fixed z-50 flex flex-col border-border bg-card p-4"
        :class="[
          props.side === 'bottom'
            ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl border-t'
            : 'inset-y-0 w-80 max-w-[85vw]',
          props.side === 'right' ? 'right-0 border-l' : props.side === 'left' ? 'left-0 border-r' : '',
          dragging ? 'select-none' : 'transition-[transform,filter] duration-200 motion-reduce:transition-none',
          props.swipe && props.side !== 'bottom' ? 'touch-pan-y' : '',
        ]"
        :style="panelStyle"
        @keydown.esc.stop="emit('close')"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <div
          v-if="props.side === 'bottom'"
          aria-hidden="true"
          class="mx-auto mb-3 h-1 w-10 shrink-0 touch-none rounded-full bg-border"
        />
        <div class="flex touch-none items-center justify-between gap-2 pb-3">
          <span class="text-sm font-medium">{{ props.title }}</span>
          <button
            ref="closeRef"
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
        <div
          class="min-h-0 flex-1 overflow-y-auto"
          :data-no-swipe="props.side === 'bottom' ? true : undefined"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-fade-enter-active,
.dk-fade-leave-active {
  transition: opacity 200ms ease;
}
.dk-fade-enter-from,
.dk-fade-leave-to {
  opacity: 0;
}
.dk-slide-r-enter-active,
.dk-slide-r-leave-active,
.dk-slide-l-enter-active,
.dk-slide-l-leave-active,
.dk-slide-b-enter-active,
.dk-slide-b-leave-active {
  transition: transform 200ms ease;
}
.dk-slide-r-enter-from,
.dk-slide-r-leave-to {
  transform: translateX(100%);
}
.dk-slide-l-enter-from,
.dk-slide-l-leave-to {
  transform: translateX(-100%);
}
.dk-slide-b-enter-from,
.dk-slide-b-leave-to {
  transform: translateY(100%);
}
@media (prefers-reduced-motion: reduce) {
  .dk-fade-enter-active,
  .dk-fade-leave-active,
  .dk-slide-r-enter-active,
  .dk-slide-r-leave-active,
  .dk-slide-l-enter-active,
  .dk-slide-l-leave-active,
  .dk-slide-b-enter-active,
  .dk-slide-b-leave-active {
    transition: none;
  }
}
</style>
