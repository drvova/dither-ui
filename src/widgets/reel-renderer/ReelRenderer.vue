<script lang="ts">
import type { InjectionKey, Ref } from "vue"
import type { Artboard } from "@/entities/artboard"

/** The frames a reel may cut to — the player provides its document's; the Studio falls back to the editor's. */
export const REEL_POOL: InjectionKey<Ref<Artboard[]>> = Symbol("reel-pool")
</script>

<script setup lang="ts">
// A reel on screen: the clip of the moment, the previous one underneath while
// a transition runs, and the kit's DitherReveal masking the newcomer by the
// transition's progress. Time is the kit clock — free-running it loops,
// directed (the player under HyperFrames) it is the composition's moment, so
// a reel seeks like any surface. Reduced motion turns transitions into cuts.
// Every clip keeps one element for as long as it is on screen (keyed by its
// slot in the reel), so a frame's surfaces are not remounted when it goes
// from coming in to going out.
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { directedTime, DitherReveal, isDirected, onSeek } from "@dither-kit"
import { editor } from "@/entities/editor"
import type { ReelModel } from "@/entities/widget"
import { reelAt, reelDuration, reelLoop, wipeDirectionOf } from "@/features/reel"
import ReelClip from "./ReelClip.vue"

const props = defineProps<{ reel: ReelModel; artboardId: string }>()

const provided = inject(REEL_POOL, null)
const pool = computed(() => provided?.value ?? editor.artboards)
const frames = computed(() =>
  props.reel.clips.map((clip) => ({ clip, artboard: pool.value.find((a) => a.id === clip.id && a.id !== props.artboardId && a.widget?.kind !== "reel") ?? null }))
)

const wrapRef = ref<HTMLElement | null>(null)
const box = ref({ w: 0, h: 0 })
const time = ref(0)
const total = computed(() => reelDuration(props.reel.clips))
const moment = computed(() => reelAt(props.reel.clips, time.value))
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
/** The layers on screen: the outgoing clip (when a transition runs) under the incoming one. */
const layers = computed(() => {
  const m = moment.value
  if (!m) return []
  const progress = reduced() ? 1 : m.progress
  return [m.outgoing, m.index]
    .filter((i): i is number => i !== null)
    .map((i) => ({ i, ...frames.value[i], progress: i === m.index ? progress : 1 }))
    .filter((l) => l.artboard)
})
const scaleOf = (w: number, h: number) => Math.min(1, box.value.w ? box.value.w / w : 1, box.value.h ? box.value.h / h : 1)

let raf = 0
let last = 0
let ro: ResizeObserver | null = null

function frame(now: number) {
  raf = 0
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
  last = now
  time.value = reelLoop(props.reel.clips, time.value + dt)
  raf = requestAnimationFrame(frame)
}

function play() {
  if (isDirected()) {
    seekTo(directedTime() ?? 0)
    return
  }
  if (!raf) {
    last = 0
    raf = requestAnimationFrame(frame)
  }
}

function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

/** Directed: the composition's moment, held past the end rather than looped. */
function seekTo(ms: number) {
  stop()
  time.value = ms / 1000
}

const unseek = onSeek((ms) => (ms === null ? play() : seekTo(ms)))
watch(() => editor.replayToken, () => (time.value = 0))

onMounted(() => {
  if (wrapRef.value && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(([entry]) => {
      if (entry) box.value = { w: entry.contentRect.width, h: entry.contentRect.height }
    })
    ro.observe(wrapRef.value)
  }
  play()
})
onBeforeUnmount(() => {
  unseek()
  stop()
  ro?.disconnect()
})
</script>

<template>
  <div ref="wrapRef" class="relative h-full w-full overflow-hidden" :data-reel-clip="moment?.index ?? -1" :data-reel-time="time.toFixed(2)" :data-reel-total="total">
    <DitherReveal
      v-for="layer in layers"
      :key="layer.i"
      class="absolute inset-0"
      :progress="layer.progress"
      :direction="wipeDirectionOf(layer.clip.transition.kind)"
      :cell="layer.clip.transition.cell"
      :seed="layer.clip.transition.seed ?? undefined"
      :data-reel-layer="layer.i"
    >
      <ReelClip :artboard="layer.artboard!" :scale="scaleOf(layer.artboard!.w, layer.artboard!.h)" />
    </DitherReveal>
    <p v-if="!layers.length" class="absolute inset-0 grid place-items-center font-mono text-[11px] text-muted-foreground">
      {{ reel.clips.length ? "a clip's frame is missing" : "no clips — select frames and press reel" }}
    </p>
  </div>
</template>
