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
// A film over the reel: each clip's camera moves it (a transform about the
// stage's centre), its callouts are drawn on leaders from points of the
// frame that the same camera arithmetic places, and a chapter band sits
// under the stage once any clip sets a chapter. Under reduced motion the
// camera holds its first key and callouts appear drawn.
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { directedTime, DitherReveal, isDirected, onSeek } from "@dither-kit"
import { editor } from "@/entities/editor"
import type { ReelModel } from "@/entities/widget"
import {
  cameraAt,
  cameraPoint,
  cameraTransform,
  calloutsAt,
  chapterAt,
  hasChapters,
  reelAt,
  reelDuration,
  reelLoop,
  wipeDirectionOf,
} from "@/features/reel"
import ReelBand from "./ReelBand.vue"
import ReelClip from "./ReelClip.vue"

const props = defineProps<{ reel: ReelModel; artboardId: string }>()

const provided = inject(REEL_POOL, null)
const pool = computed(() => provided?.value ?? editor.artboards)
const frames = computed(() =>
  props.reel.clips.map((clip) => ({
    clip,
    artboard:
      pool.value.find((a) => a.id === clip.id && a.id !== props.artboardId && a.widget?.kind !== "reel") ?? null,
  })),
)

const stageRef = ref<HTMLElement | null>(null)
/** The stage's size: the whole frame, or the frame above the chapter band. */
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
const scaleOf = (w: number, h: number) =>
  Math.min(1, box.value.w ? box.value.w / w : 1, box.value.h ? box.value.h / h : 1)
/** The lens the camera leans through, in px. */
const lens = computed(() => 2.5 * Math.max(box.value.w, box.value.h, 1))

/** A clip's camera at `local` seconds into it (an outgoing clip runs on past its end). */
function cameraOf(i: number, local: number) {
  const clip = props.reel.clips[i]
  if (reduced()) return cameraAt(clip.camera, 0)
  return cameraAt(clip.camera, clip.seconds > 0 ? local / clip.seconds : 0)
}
/** Seconds into clip `i` at this moment. */
const localOf = (i: number) => {
  const m = moment.value
  if (!m) return 0
  return i === m.index ? m.local : props.reel.clips[i].seconds + m.local
}
function transformOf(i: number, w: number, h: number) {
  const s = scaleOf(w, h)
  return cameraTransform(cameraOf(i, localOf(i)), w * s, h * s, lens.value)
}

/** The callouts up on the clip on screen, placed through its camera. */
const callouts = computed(() => {
  const m = moment.value
  const art = m ? frames.value[m.index]?.artboard : null
  if (!m || !art || !box.value.w) return []
  const s = scaleOf(art.w, art.h)
  const cam = cameraOf(m.index, m.local)
  const { w: W, h: H } = box.value
  return calloutsAt(props.reel.clips[m.index], m.local).map((c, k) => {
    const [dx, dy] = cameraPoint(cam, art.w * s, art.h * s, lens.value, c.x, c.y)
    const x = W / 2 + dx
    const y = H / 2 + dy
    const dir = c.side === "left" ? -1 : 1
    // Up and out, unless the point is near the top: then down.
    const rise = (y < H * 0.32 ? 1 : -1) * H * 0.09
    const kx = x + dir * Math.abs(rise) * 0.75
    const ky = y + rise
    const ex = kx + dir * W * 0.08
    const length = Math.hypot(kx - x, ky - y) + Math.abs(ex - kx)
    const drawn = reduced() ? 1 : c.drawn
    return {
      key: `${m.index}-${k}`,
      label: c.label,
      note: c.note,
      side: c.side,
      x,
      y,
      path: `M${x} ${y}L${kx} ${ky}L${ex} ${ky}`,
      length,
      shown: length * Math.min(1, drawn / 0.6),
      text: Math.min(1, Math.max(0, (drawn - 0.5) / 0.4)) * c.fade,
      fade: c.fade,
      left: dir > 0 ? ex : null,
      right: dir < 0 ? W - ex : null,
      top: ky,
    }
  })
})

const banded = computed(() => hasChapters(props.reel.clips))
const chapter = computed(() => chapterAt(props.reel.clips, moment.value))

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
watch(
  () => editor.replayToken,
  () => (time.value = 0),
)

onMounted(() => {
  if (stageRef.value && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(([entry]) => {
      if (entry) box.value = { w: entry.contentRect.width, h: entry.contentRect.height }
    })
    ro.observe(stageRef.value)
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
  <div
    class="relative flex h-full w-full flex-col overflow-hidden bg-background"
    :data-reel-clip="moment?.index ?? -1"
    :data-reel-time="time.toFixed(2)"
    :data-reel-total="total"
  >
    <div ref="stageRef" class="reel-stage relative min-h-0 flex-1 overflow-hidden">
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
        <div
          class="absolute inset-0"
          :style="{ transform: transformOf(layer.i, layer.artboard!.w, layer.artboard!.h), transformOrigin: '50% 50%' }"
          data-reel-camera
        >
          <ReelClip :artboard="layer.artboard!" :scale="scaleOf(layer.artboard!.w, layer.artboard!.h)" />
        </div>
      </DitherReveal>
      <svg
        v-if="callouts.length"
        class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <g v-for="c in callouts" :key="c.key" :opacity="c.fade">
          <path
            :d="c.path"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="text-foreground/75"
            :stroke-dasharray="`${c.shown} ${c.length}`"
          />
          <circle
            :cx="c.x"
            :cy="c.y"
            r="7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="text-foreground"
          />
          <rect :x="c.x - 2.5" :y="c.y - 2.5" width="5" height="5" fill="var(--swatch-orange)" />
        </g>
      </svg>
      <div
        v-for="c in callouts"
        :key="`t-${c.key}`"
        class="callout pointer-events-none absolute"
        :class="c.side === 'left' ? 'text-right' : 'text-left'"
        :style="{
          left: c.left === null ? undefined : `calc(${c.left}px + 1.6cqh)`,
          right: c.right === null ? undefined : `calc(${c.right}px + 1.6cqh)`,
          top: `${c.top}px`,
          opacity: c.text,
        }"
        :data-reel-callout="c.label"
      >
        <span class="block text-foreground">{{ c.label }}</span>
        <span v-if="c.note" class="note block text-muted-foreground">{{ c.note }}</span>
      </div>
      <p
        v-if="!layers.length"
        class="absolute inset-0 grid place-items-center font-mono text-[11px] text-muted-foreground"
      >
        {{ reel.clips.length ? "a clip's frame is missing" : "No clips. Select frames and press Reel." }}
      </p>
    </div>
    <ReelBand v-if="banded && chapter" class="reel-band-slot shrink-0" :state="chapter" :reduced="reduced()" />
    <div v-else-if="banded" class="reel-band-slot shrink-0 border-t border-border bg-background" />
  </div>
</template>

<style scoped>
/* The stage is a size container: callouts scale with the frame. */
.reel-stage {
  container-type: size;
}
.callout {
  font-family: var(--font-mono);
  font-size: 3.6cqh;
  line-height: 1.25;
  white-space: nowrap;
  transform: translateY(-0.62em);
  text-shadow: 0 0 1.2em var(--background);
}
.callout .note {
  font-size: 0.72em;
}
.reel-band-slot {
  height: 22%;
}
</style>
