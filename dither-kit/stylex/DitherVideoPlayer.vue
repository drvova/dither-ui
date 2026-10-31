<!-- Generated from ../tailwind/DitherVideoPlayer.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 80%, transparent)",
    fontFamily: "var(--font-mono)",
  },
  frame: { position: "relative", aspectRatio: "16 / 9", backgroundColor: "var(--background)" },
  video: { height: "100%", width: "100%", objectFit: "contain" },
  grid: { display: "grid", height: "100%", width: "100%", placeItems: "center" },
  box2: { textAlign: "center" },
  text: {
    marginInline: "auto",
    display: "block",
    width: "0.75rem",
    height: "0.75rem",
    borderRadius: "2px",
    backgroundColor: "var(--border)",
  },
  p: { marginTop: "0.5rem", fontSize: "11px", color: "var(--muted-foreground)" },
  grid2: {
    display: "grid",
    gap: "0.375rem",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    padding: "0.5rem",
  },
  slider: { width: "100%" },
  row: { display: "flex", alignItems: "center", gap: "0.25rem" },
  slider2: { width: "5rem" },
  button: { width: "2.5rem", fontSize: "10px", fontVariantNumeric: "   tabular-nums " },
  text2: {
    paddingInline: "0.375rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  button2: { marginLeft: "auto" },
  grid3: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    borderRadius: "var(--radius)",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--card)" } },
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import DitherSlider from "./DitherSlider.vue"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import type { PixelColor } from "../engine/pixel"

/** Native video under dither chrome — play, a dithered scrubber, volume,
 * playback rate, tabular time, mute, fullscreen, and player keyboard:
 * Space/K play · ←→ seek 5s · ↑↓ volume · M mute · F fullscreen.
 * No src renders an honest empty face so previews never look broken. */
const props = withDefaults(
  defineProps<{
    src?: string
    poster?: string
    label?: string
    color?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  { label: "Video", color: "blue" },
)

const video = ref<HTMLVideoElement | null>(null)
const host = ref<HTMLDivElement | null>(null)
const playing = ref(false)
const muted = ref(false)
const time = ref(0)
const duration = ref(0)
const volume = ref(1)
const rate = ref(1)
const RATES = [1, 1.25, 1.5, 2]
// iOS ties a media element's volume to the hardware buttons and ignores a
// write, so the volume slider shows only where a write sticks.
const volumeWritable = (() => {
  if (typeof document === "undefined") return true
  const probe = document.createElement("video")
  try {
    // WebKit says so where it knows (a write there can read back, then revert).
    if (probe.matches(":volume-locked")) return false
  } catch {
    // an engine without the selector: the write below tells
  }
  probe.volume = 0.5
  return probe.volume === 0.5
})()

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
function setVolume(v: number | [number, number]) {
  const el = video.value
  if (!el || typeof v !== "number") return
  el.volume = Math.min(1, Math.max(0, v))
  el.muted = el.volume === 0
}
function cycleRate() {
  const el = video.value
  if (!el) return
  const next = RATES[(RATES.indexOf(rate.value) + 1) % RATES.length]
  el.playbackRate = next
  rate.value = next
}
function bump(delta: number) {
  const el = video.value
  if (el) setVolume(el.volume + delta)
}
function nudge(delta: number) {
  const el = video.value
  if (el) el.currentTime = Math.min(duration.value, Math.max(0, el.currentTime + delta))
}
/** Player keyboard — skipped while a control inside owns the key. */
function onKey(e: KeyboardEvent) {
  if (!props.src || !video.value) return
  const tag = (e.target as HTMLElement).tagName
  if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return
  if (tag === "INPUT" || (e.target as HTMLElement).getAttribute("role") === "slider") return
  const k = e.key.toLowerCase()
  if (e.key === " " || k === "k") (e.preventDefault(), toggle())
  else if (e.key === "ArrowLeft") (e.preventDefault(), nudge(-5))
  else if (e.key === "ArrowRight") (e.preventDefault(), nudge(5))
  else if (e.key === "ArrowUp") (e.preventDefault(), bump(0.1))
  else if (e.key === "ArrowDown") (e.preventDefault(), bump(-0.1))
  else if (k === "m") toggleMute()
  else if (k === "f") fullscreen()
}
function fullscreen() {
  // An iPhone has no element fullscreen; its video takes the system's own.
  if (host.value?.requestFullscreen) void host.value.requestFullscreen()
  else (video.value as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.()
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}
const timeLabel = computed(() => `${fmt(time.value)} / ${fmt(duration.value)}`)
const btn = cn(styles.grid3, CONTROL_BUTTON)
</script>

<template>
  <div
    ref="host"
    role="group"
    :aria-label="props.label"
    tabindex="0"
    :class="cn(styles.box, CONTROL_BUTTON, props.xstyle, props.class)"
    @keydown="onKey"
  >
    <div v-bind="stylex.attrs(styles.frame)">
      <video
        v-if="props.src"
        ref="video"
        :src="props.src"
        :poster="props.poster"
        :aria-label="props.label"
        v-bind="stylex.attrs(styles.video)"
        playsinline
        @click="toggle"
        @play="playing = true"
        @pause="playing = false"
        @timeupdate="time = video?.currentTime ?? 0"
        @durationchange="duration = video?.duration ?? 0"
        @volumechange="((muted = video?.muted ?? false), (volume = video?.volume ?? 1))"
      />
      <div v-else v-bind="stylex.attrs(styles.grid)" aria-hidden="true">
        <div v-bind="stylex.attrs(styles.box2)">
          <span v-bind="stylex.attrs(styles.text)" />
          <p v-bind="stylex.attrs(styles.p)">No source.</p>
        </div>
      </div>
    </div>
    <div v-bind="stylex.attrs(styles.grid2)">
      <DitherSlider
        :model-value="time"
        :min="0"
        :max="Math.max(1, duration)"
        :step="0.1"
        label="Seek"
        :color="props.color"
        :disabled="!props.src"
        :xstyle="styles.slider"
        @update:model-value="seek"
      />
      <div v-bind="stylex.attrs(styles.row)">
        <button
          type="button"
          :class="cn(btn)"
          :aria-label="playing ? 'Pause' : 'Play'"
          :disabled="!props.src"
          @click="toggle"
        >
          <span aria-hidden="true">{{ playing ? "❚❚" : "▶" }}</span>
        </button>
        <button
          type="button"
          :class="cn(btn)"
          :aria-label="muted ? 'Unmute' : 'Mute'"
          :disabled="!props.src"
          @click="toggleMute"
        >
          <span aria-hidden="true">{{ muted ? "○" : "●" }}</span>
        </button>
        <DitherSlider
          v-if="volumeWritable"
          :model-value="muted ? 0 : volume"
          :min="0"
          :max="1"
          :step="0.05"
          label="Volume"
          :color="props.color"
          :disabled="!props.src"
          :xstyle="styles.slider2"
          @update:model-value="setVolume"
        />
        <button
          type="button"
          :class="cn(btn, styles.button)"
          :aria-label="`Playback speed ${rate}x`"
          :disabled="!props.src"
          @click="cycleRate"
        >
          {{ rate }}×
        </button>
        <span v-bind="stylex.attrs(styles.text2)">{{ timeLabel }}</span>
        <button
          type="button"
          :class="cn(btn, styles.button2)"
          aria-label="Fullscreen"
          :disabled="!props.src"
          @click="fullscreen"
        >
          <span aria-hidden="true">⛶</span>
        </button>
      </div>
    </div>
  </div>
</template>
