<script setup lang="ts">
import { computed, ref } from "vue"
import DitherSlider from "./DitherSlider.vue"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Native video under dither chrome — play, a dithered scrubber, tabular
 * time, mute, fullscreen. No src renders an honest empty face so previews
 * never look broken. */
const props = withDefaults(
  defineProps<{
    src?: string
    poster?: string
    label?: string
    color?: PixelColor
    class?: string
  }>(),
  { label: "Video", color: "blue" }
)

const video = ref<HTMLVideoElement | null>(null)
const host = ref<HTMLDivElement | null>(null)
const playing = ref(false)
const muted = ref(false)
const time = ref(0)
const duration = ref(0)

function toggle() {
  const v = video.value
  if (!v) return
  if (v.paused) v.play()
  else v.pause()
}
function seek(t: number | [number, number]) {
  const v = video.value
  if (v && typeof t === "number") v.currentTime = t
}
function toggleMute() {
  const v = video.value
  if (!v) return
  v.muted = !v.muted
  muted.value = v.muted
}
function fullscreen() {
  host.value?.requestFullscreen?.()
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}
const timeLabel = computed(() => `${fmt(time.value)} / ${fmt(duration.value)}`)
const btn = cn(
  "grid size-8 place-items-center rounded-md text-[12px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
  CONTROL_BUTTON
)
</script>

<template>
  <div ref="host" :class="cn('overflow-hidden rounded-lg border border-border/60 bg-background/80 font-mono', props.class)">
    <div class="relative aspect-video bg-background">
      <video
        v-if="props.src"
        ref="video"
        :src="props.src"
        :poster="props.poster"
        :aria-label="props.label"
        class="h-full w-full object-contain"
        playsinline
        @click="toggle"
        @play="playing = true"
        @pause="playing = false"
        @timeupdate="time = video?.currentTime ?? 0"
        @durationchange="duration = video?.duration ?? 0"
        @volumechange="muted = video?.muted ?? false"
      />
      <div v-else class="grid h-full w-full place-items-center" aria-hidden="true">
        <div class="text-center">
          <span class="mx-auto block size-3 rounded-[2px] bg-border" />
          <p class="mt-2 text-[11px] text-muted-foreground/60">No source.</p>
        </div>
      </div>
    </div>
    <div class="grid gap-1.5 border-t border-border/60 p-2">
      <DitherSlider
        :model-value="time"
        :min="0"
        :max="Math.max(1, duration)"
        :step="0.1"
        label="Seek"
        :color="props.color"
        :disabled="!props.src"
        class="w-full"
        @update:model-value="seek"
      />
      <div class="flex items-center gap-1">
        <button type="button" :class="btn" :aria-label="playing ? 'Pause' : 'Play'" :disabled="!props.src" @click="toggle">
          <span aria-hidden="true">{{ playing ? "❚❚" : "▶" }}</span>
        </button>
        <button type="button" :class="btn" :aria-label="muted ? 'Unmute' : 'Mute'" :disabled="!props.src" @click="toggleMute">
          <span aria-hidden="true">{{ muted ? "○" : "●" }}</span>
        </button>
        <span class="px-1.5 text-[10px] tabular-nums text-muted-foreground">{{ timeLabel }}</span>
        <button type="button" :class="cn(btn, 'ml-auto')" aria-label="Fullscreen" :disabled="!props.src" @click="fullscreen">
          <span aria-hidden="true">⛶</span>
        </button>
      </div>
    </div>
  </div>
</template>
