<script setup lang="ts">
// A Clayzo film: one document from public/films/ played by the Clayzo WebGL
// player (the runtime is ~350KB gzipped, so it is a lazy chunk fetched only
// once the page has loaded and the film is near the viewport). Until the
// first frame draws — and wherever WebGL2 or the player is missing — the
// `fallback` slot holds the frame. Landing is the page's runtime latch
// (`data-live`, which the prerender strips), so the static bytes always
// ship the fallback. `playing` is the pause control (WCAG 2.2.2: motion
// longer than five seconds can be stopped) — bound by the page, or the
// film's own corner chip with `chip`, the chip's name (each film's own, so
// a page of films never has two buttons called the same). Reduced motion starts it paused on
// the film's `still` marker, the resting frame every film authors; pressing
// play is the visitor's explicit ask, so it plays. `time` reports the
// playhead in seconds for a timecode. `inputs` feeds the document's own
// inputs (the page's state the film answers), and `hit` reports a click on
// one of its hit areas by id. With `scrub` the pointer's place across the
// film is its moment (a mouse or pen held over it holds the film there,
// frame by frame; leaving lets it play on from that frame). Under reduced
// motion a film answers no pointer at all: no loupe, parallax, hover or
// scrub (read when the player starts).
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { PlayerHandle, PlayerInputValue } from "@clayzo/webgl-player"
import { assetPath } from "@/shared/lib"
import FilmChip from "./FilmChip.vue"

const props = defineProps<{
  film: string
  label: string
  chip?: string
  inputs?: Record<string, PlayerInputValue>
  scrub?: boolean
}>()
const playing = defineModel<boolean>("playing", { default: true })
const time = defineModel<number>("time", { default: 0 })
const emit = defineEmits<{ ready: [duration: number]; hit: [area: string] }>()

const wrap = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)

let player: PlayerHandle | null = null
let tps = 240
let still = 0
let frames = 1
let frame = 8
let scrubbing = false
let io: IntersectionObserver | null = null
let motion: MediaQueryList | null = null
let disposed = false

function sync() {
  if (!player) return
  if (playing.value) return player.play()
  player.pause()
  if (motion?.matches) void player.seek(still)
}

function feed() {
  for (const [name, value] of Object.entries(props.inputs ?? {})) player?.setInput(name, value)
}

function onScrub(e: PointerEvent) {
  if (!props.scrub || !player || !wrap.value || e.pointerType === "touch" || motion?.matches) return
  const box = wrap.value.getBoundingClientRect()
  const at = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
  if (player.playing) player.pause()
  scrubbing = true
  void player.seek(Math.round(at * (frames - 1)) * frame)
}

function onScrubEnd() {
  if (!scrubbing) return
  scrubbing = false
  sync()
}

function onMotion() {
  if (motion?.matches) playing.value = false
  sync()
}

async function start() {
  if (player || disposed || !canvas.value) return
  try {
    const [{ createPlayer }, doc] = await Promise.all([
      import("@clayzo/webgl-player"),
      fetch(assetPath(`/films/${props.film}.json`)).then((r) => {
        if (!r.ok) throw new Error(`film ${props.film}: ${r.status}`)
        return r.json()
      }),
    ])
    if (disposed || !canvas.value) return
    tps = doc.timing.ticksPerSecond
    frame = (tps * doc.timing.frameRate.denominator) / doc.timing.frameRate.numerator
    frames = Math.floor(doc.timing.durationTicks / frame)
    still = doc.markers.find((m: { id: string }) => m.id === "still")?.tick ?? 0
    let last = -1
    player = await createPlayer({
      canvas: canvas.value,
      document: doc,
      loop: true,
      interactive: !motion?.matches,
      interactionElement: wrap.value ?? undefined,
      onPointer: (e) => e.kind === "click" && e.hitAreaId && emit("hit", e.hitAreaId),
      onFrame: () => {
        // A quarter-second timecode: the readout never re-renders per frame.
        const t = Math.floor(((player?.tick ?? 0) / tps) * 4) / 4
        if (t !== last) time.value = last = t
      },
    })
    if (disposed) return player.dispose()
    feed()
    sync()
    ready.value = true
    emit("ready", doc.timing.durationTicks / tps)
  } catch {
    // No WebGL2, a blocked chunk or a missing document: the fallback stays.
    player?.dispose()
    player = null
  }
}

onMounted(() => {
  motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  motion.addEventListener("change", onMotion)
  if (motion.matches) playing.value = false
  // Off the critical path: after the page's own load, and only once the
  // film is within a screen of the viewport.
  const go = () => {
    if (typeof IntersectionObserver === "undefined") return void start()
    io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io?.disconnect()
        void start()
      },
      { rootMargin: "100% 0px" },
    )
    if (wrap.value) io.observe(wrap.value)
  }
  if (document.readyState === "complete") go()
  else window.addEventListener("load", go, { once: true })
})

watch(playing, sync)
watch(() => props.inputs, feed, { deep: true })

onBeforeUnmount(() => {
  disposed = true
  io?.disconnect()
  motion?.removeEventListener("change", onMotion)
  player?.dispose()
  player = null
})
</script>

<template>
  <div
    ref="wrap"
    class="film"
    :data-live="ready ? 'true' : undefined"
    @pointermove="onScrub"
    @pointerleave="onScrubEnd"
  >
    <div class="film-fallback" aria-hidden="true">
      <slot name="fallback" />
    </div>
    <canvas ref="canvas" role="img" :aria-label="label" class="film-canvas" />
    <FilmChip v-if="chip && ready" v-model="playing" :label="chip" class="film-corner" />
  </div>
</template>

<style scoped>
.film {
  position: relative;
}

.film-fallback {
  position: absolute;
  inset: 0;
}

.film-corner {
  position: absolute;
  top: 8px;
  right: 8px;
}

.film-canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
}

/* The film lands on four steps — a pixel fade, not a cross-dissolve — and
   the stand-in steps out under it. */
.film[data-live] .film-canvas {
  opacity: 1;
  transition: opacity 480ms steps(4, jump-end);
}

.film[data-live] .film-fallback {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 480ms steps(4, jump-end),
    visibility 0s 480ms;
}

@media (prefers-reduced-motion: reduce) {
  .film[data-live] .film-canvas,
  .film[data-live] .film-fallback {
    transition: none;
  }
}
</style>
