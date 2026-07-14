<script lang="ts">
import type { InjectionKey } from "vue"

export type DrawerSide = "right" | "left" | "bottom"

/** Nested-drawer channel: a child drawer tells its parent (or an app-level
 * DitherDrawerIndent) to push back while it is open. */
export type DrawerChannel = { notify: (delta: number) => void }
export const DRAWER_CHANNEL: InjectionKey<DrawerChannel> = Symbol("dither-drawer")

/** Snap points: 0..1 = fraction of viewport height, >1 = px. */
const resolveSnap = (s: number) => (s <= 1 ? s * window.innerHeight : s)
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
    /** Bottom sheets only: preset visible heights (0..1 viewport fraction, >1 px). */
    snapPoints?: number[]
    /** Active snap point (v-model:snapPoint). Defaults to the first. */
    snapPoint?: number
    /** false renders no backdrop and leaves the page interactive. */
    modal?: boolean
    /** false keeps the drawer open on backdrop clicks (Escape still closes). */
    dismissible?: boolean
  }>(),
  { side: "right", swipe: true, modal: true, dismissible: true }
)
const emit = defineEmits<{ close: []; "update:snapPoint": [number] }>()

const closeRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v && props.modal) nextTick(() => closeRef.value?.focus())
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

// --- snap points (bottom sheets) ---------------------------------------------
const hasSnaps = computed(
  () => props.side === "bottom" && !!props.snapPoints && props.snapPoints.length > 0
)
const internalSnap = ref<number | null>(null)
const activeSnap = computed(
  () => props.snapPoint ?? internalSnap.value ?? props.snapPoints?.[0] ?? 1
)
watch(
  () => props.open,
  (v) => {
    if (v) internalSnap.value = props.snapPoint ?? props.snapPoints?.[0] ?? null
  }
)
const maxSnapPx = computed(() =>
  hasSnaps.value ? Math.max(...props.snapPoints!.map(resolveSnap)) : 0
)
const activeSnapPx = computed(() => (hasSnaps.value ? resolveSnap(activeSnap.value) : 0))
/** Resting translateY for the current snap: hide everything below it. */
const snapBase = computed(() => (hasSnaps.value ? maxSnapPx.value - activeSnapPx.value : 0))

function setSnap(s: number) {
  internalSnap.value = s
  emit("update:snapPoint", s)
}

// --- swipe: 1:1 tracking, rubber-band, momentum projection -------------------
const axis = computed(() => (props.side === "bottom" ? "y" : "x"))
const dismissSign = computed(() => (props.side === "left" ? -1 : 1))
const dragging = ref(false)
const offset = ref(0) // px toward dismissal (negative = upward / rubber-banded)
const settleMs = ref(200)
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
  if (hasSnaps.value) {
    // Upward headroom until the largest snap, rubber-band past it.
    const headroom = snapBase.value
    offset.value = d >= -headroom ? d : -headroom - rubberband(-d - headroom, size)
  } else {
    offset.value = d >= 0 ? d : -rubberband(-d, size)
  }
}
function onUp() {
  if (!dragging.value) return
  dragging.value = false
  const v = velocityFrom(samples) * dismissSign.value
  // A hard flick settles faster — scale the release duration by swipe strength.
  settleMs.value = Math.round(200 * Math.min(1, Math.max(0.3, 1 - Math.abs(v) / 3000)))
  const projected = offset.value + project(v)

  if (hasSnaps.value) {
    // Projected visible height picks the snap; below half the smallest = dismiss.
    const projectedVisible = activeSnapPx.value - projected
    const snaps = props.snapPoints!
    const smallest = Math.min(...snaps.map(resolveSnap))
    if (projectedVisible < smallest * 0.5) {
      dismiss()
      return
    }
    const nearest = snaps.reduce((a, b) =>
      Math.abs(resolveSnap(b) - projectedVisible) < Math.abs(resolveSnap(a) - projectedVisible)
        ? b
        : a
    )
    setSnap(nearest)
    offset.value = 0
    return
  }

  // Velocity sign decides on a flick; projection decides on a slow drag.
  if (offset.value > 0 && (v > 500 || (projected > size * 0.5 && v > -100))) {
    dismiss()
  } else {
    offset.value = 0
  }
}
function dismiss() {
  if (pixelPrefersReducedMotion()) {
    offset.value = 0
    emit("close")
    return
  }
  offset.value = size * 1.05
  window.setTimeout(() => {
    emit("close")
    offset.value = 0
  }, settleMs.value)
}

/** 0..1 how far the drawer has been swiped toward dismissal. */
const progress = computed(() => {
  const travelled = snapBase.value + offset.value
  const total = hasSnaps.value ? maxSnapPx.value : size
  return Math.min(1, Math.max(0, travelled / total))
})

const panelStyle = computed(() => {
  if (childOpen.value > 0) {
    const push =
      props.side === "bottom" ? "translateY(10px)" : `translateX(${12 * dismissSign.value}px)`
    return { transform: `${push} scale(0.97)`, filter: "brightness(0.75)" }
  }
  const style: Record<string, string> = { transitionDuration: `${settleMs.value}ms` }
  if (hasSnaps.value) style.height = `${maxSnapPx.value}px`
  const delta = snapBase.value + offset.value
  if (delta !== 0) {
    style.transform =
      axis.value === "y"
        ? `translateY(${delta}px)`
        : `translateX(${offset.value * dismissSign.value}px)`
  }
  return style
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-fade">
      <div
        v-if="props.open && props.modal"
        aria-hidden="true"
        class="fixed inset-0 z-50 bg-black/60"
        :style="{
          opacity: dragging || offset > 0 ? 1 - progress : undefined,
          transition: dragging ? 'none' : undefined,
        }"
        @click="props.dismissible && emit('close')"
      />
    </Transition>
    <Transition :name="props.side === 'bottom' ? 'dk-slide-b' : props.side === 'right' ? 'dk-slide-r' : 'dk-slide-l'">
      <div
        v-if="props.open"
        ref="panelRef"
        role="dialog"
        :aria-modal="props.modal ? 'true' : undefined"
        :aria-label="props.title"
        class="fixed z-50 flex flex-col border-border bg-card p-4"
        :class="[
          props.side === 'bottom'
            ? 'inset-x-0 bottom-0 rounded-t-xl border-t'
            : 'inset-y-0 w-80 max-w-[85vw]',
          props.side === 'bottom' && !hasSnaps ? 'max-h-[85vh]' : '',
          props.side === 'right' ? 'right-0 border-l' : props.side === 'left' ? 'left-0 border-r' : '',
          dragging ? 'select-none' : 'transition-[transform,filter] motion-reduce:transition-none',
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
