<script setup lang="ts">
// The build: the brand as a model (`build.ts`, every cell of the lockup a
// block, standing on a floor of tiles that lays itself first) raised by the kit's world engine as the page scrolls past it. A
// tall run holds the stage pinned while the scroll drives it (`stageAt`):
// the dotted cage, the cells landing hot in the ember from the bottom up,
// the whole turning, then the cells coming apart as the page leaves. A
// pointer over it leans the cells away; a drag turns it. It moves only
// when the reader does: the surface holds still a beat after the last
// scroll or pointer move. Reduced motion gets the lockup whole and still.
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherWorld } from "@dither-kit"
import { BUILD_CELLS, lockupModel, stageAt } from "./build"

const MODEL = lockupModel()
/** The brand in metal, lit low-key: the shadowed sides sink into the
 * obsidian, the lit faces climb through graphite and titanium to chrome
 * and bone. */
const RAMP = ["#101214", "#1d2023", "#3a3e43", "#6f747a", "#a6abb1", "#d4dce1", "#e4e1d8"]
/** The kit's ember: the signal light the cells land in. */
const HEAT = "orange"

const run = ref<HTMLElement | null>(null)
const still = ref(false)
const stage = ref(stageAt(0.6))
const awake = ref(false)
const zoom = ref(1)

/** The camera frames the model's bounding sphere in the stage's shorter
 * side; the lockup is long and flat, so on a wide stage it zooms in until
 * the word nearly spans it, and on a narrow one it stays framed whole. */
function fit() {
  const box = run.value?.firstElementChild?.getBoundingClientRect()
  if (box && box.height > 0) zoom.value = Math.min(1.75, Math.max(1, (box.width / box.height) * 0.92))
}

let io: IntersectionObserver | null = null
let near = false
let frame = 0
let sleep: ReturnType<typeof setTimeout> | undefined

function measure() {
  frame = 0
  const el = run.value
  if (!el) return
  const r = el.getBoundingClientRect()
  fit()
  // 0 as the run's top reaches the viewport's top, 1 as its foot leaves.
  const travel = Math.max(1, r.height - window.innerHeight)
  stage.value = stageAt(-r.top / travel)
}

/** The reader moved: paint while they do, hold still a beat after. */
function stir() {
  awake.value = true
  clearTimeout(sleep)
  sleep = setTimeout(() => (awake.value = false), 1200)
  if (!frame) frame = requestAnimationFrame(measure)
}

function onScroll() {
  if (near) stir()
}

onMounted(() => {
  still.value = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  fit()
  window.addEventListener("resize", fit, { passive: true })
  if (still.value) {
    stage.value = { build: 1, scatter: 0, yaw: -14 }
    return
  }
  measure()
  if (typeof IntersectionObserver !== "undefined" && run.value) {
    io = new IntersectionObserver(([e]) => {
      near = !!e?.isIntersecting
      if (near) stir()
    })
    io.observe(run.value)
  }
  window.addEventListener("scroll", onScroll, { passive: true })
})

onBeforeUnmount(() => {
  io?.disconnect()
  window.removeEventListener("scroll", onScroll)
  window.removeEventListener("resize", fit)
  cancelAnimationFrame(frame)
  clearTimeout(sleep)
})
</script>

<template>
  <div ref="run" class="build-run" :class="{ still }">
    <div class="build-stage" @pointermove="stir" @pointerdown="stir">
      <DitherWorld
        :source="MODEL"
        format="vrml"
        :colors="RAMP"
        :heat="HEAT"
        :build="stage.build"
        :scatter="stage.scatter"
        :yaw="stage.yaw"
        :pitch="22"
        :zoom="zoom"
        :fov="30"
        :auto-rotate="0"
        :fog="0.25"
        :grain="0.22"
        :grain-scale="9"
        :cell="3"
        :nudge="!still"
        :paused="still || !awake"
        engine="cpu"
        :label="`The dither-ui mark and wordmark in ${BUILD_CELLS} cells on a tiled floor, built by the kit's world engine as the page scrolls`"
        class="h-full w-full"
      />
    </div>
  </div>
</template>

<style scoped>
/* The run: the scroll the stage plays over, pinned under the header. */
.build-run {
  position: relative;
  height: 260svh;
}
.build-stage {
  position: sticky;
  top: 64px;
  height: calc(100svh - 64px);
  max-height: 56rem;
}
.build-run.still {
  height: auto;
}
.build-run.still .build-stage {
  position: relative;
  top: 0;
  height: clamp(16rem, 50svh, 30rem);
}
</style>
