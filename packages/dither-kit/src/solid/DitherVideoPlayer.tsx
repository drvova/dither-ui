import { createMemo, createSignal, mergeProps, onMount, Show } from "solid-js"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import DitherSlider from "./DitherSlider"

export type DitherVideoPlayerProps = {
  /** @docs string: no src renders an honest empty face
   * @default undefined */
  src?: string
  /** @default undefined */
  poster?: string
  /** @docs string: accessible name */
  label?: string
  /** @docs PixelColor: scrubber and volume hue */
  color?: PixelColor
  class?: string
}

const RATES = [1, 1.25, 1.5, 2]

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}
const btn = [
  "grid size-8 place-items-center rounded-md text-[12px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
  CONTROL_BUTTON,
]

/** Native video under dither chrome — play, a dithered scrubber, volume,
 * playback rate, tabular time, mute, fullscreen, and player keyboard:
 * Space/K play · ←→ seek 5s · ↑↓ volume · M mute · F fullscreen.
 * No src renders an honest empty face so previews never look broken. */
export default function DitherVideoPlayer(raw: DitherVideoPlayerProps) {
  const props = mergeProps({ label: "Video", color: "blue" as PixelColor }, raw)

  let element: HTMLVideoElement | undefined
  /** The video, while there is one to play. */
  const video = () => (props.src ? element : undefined)
  let host: HTMLDivElement | undefined
  const [playing, setPlaying] = createSignal(false)
  const [muted, setMuted] = createSignal(false)
  const [time, setTime] = createSignal(0)
  const [duration, setDuration] = createSignal(0)
  const [volume, setVolume] = createSignal(1)
  const [rate, setRate] = createSignal(1)
  // iOS ties a media element's volume to the hardware buttons and ignores a
  // write, so the volume slider shows only where a write sticks. Probed once
  // in the page (a server render has no element to ask, and shows it).
  const [volumeWritable, setVolumeWritable] = createSignal(true)
  onMount(() => {
    const probe = document.createElement("video")
    try {
      // WebKit says so where it knows (a write there can read back, then revert).
      if (probe.matches(":volume-locked")) return setVolumeWritable(false)
    } catch {
      // an engine without the selector: the write below tells
    }
    probe.volume = 0.5
    setVolumeWritable(probe.volume === 0.5)
  })

  function toggle() {
    const v = video()
    if (!v) return
    // a source this browser cannot play, or a play it refuses (autoplay
    // rules), leaves it paused: the element's own events say so, nothing throws
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }
  function seek(t: number | [number, number]) {
    const v = video()
    if (v && typeof t === "number") v.currentTime = t
  }
  function toggleMute() {
    const v = video()
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }
  function writeVolume(v: number | [number, number]) {
    const el = video()
    if (!el || typeof v !== "number") return
    el.volume = Math.min(1, Math.max(0, v))
    el.muted = el.volume === 0
  }
  function cycleRate() {
    const el = video()
    if (!el) return
    const next = RATES[(RATES.indexOf(rate()) + 1) % RATES.length]
    el.playbackRate = next
    setRate(next)
  }
  function bump(delta: number) {
    const el = video()
    if (el) writeVolume(el.volume + delta)
  }
  function nudge(delta: number) {
    const el = video()
    if (el) el.currentTime = Math.min(duration(), Math.max(0, el.currentTime + delta))
  }
  /** Player keyboard — skipped while a control inside owns the key. */
  function onKey(e: KeyboardEvent) {
    if (!props.src || !video()) return
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
    // A request the browser refuses (a window without focus, a frame not
    // allowed it) leaves the player as it stands.
    if (host?.requestFullscreen) host.requestFullscreen().catch(() => {})
    else (video() as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | undefined)?.webkitEnterFullscreen?.()
  }

  const timeLabel = createMemo(() => `${fmt(time())} / ${fmt(duration())}`)

  return (
    <div
      ref={(el) => (host = el)}
      role="group"
      aria-label={props.label}
      tabindex="0"
      class={cn(
        "overflow-hidden rounded-lg border border-border/60 bg-background/80 font-mono",
        CONTROL_BUTTON,
        props.class,
      )}
      onKeyDown={onKey}
    >
      <div class="relative aspect-video bg-background">
        <Show
          when={props.src}
          fallback={
            <div class="grid h-full w-full place-items-center" aria-hidden="true">
              <div class="text-center">
                <span class="mx-auto block size-3 rounded-[2px] bg-border" />
                <p class="mt-2 text-[11px] text-muted-foreground">No source.</p>
              </div>
            </div>
          }
        >
          <video
            ref={(el) => (element = el)}
            src={props.src}
            poster={props.poster}
            aria-label={props.label}
            class="h-full w-full object-contain"
            playsinline
            onClick={toggle}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={() => setTime(element?.currentTime ?? 0)}
            onDurationChange={() => setDuration(element?.duration ?? 0)}
            onVolumeChange={() => (setMuted(element?.muted ?? false), setVolume(element?.volume ?? 1))}
          />
        </Show>
      </div>
      <div class="grid gap-1.5 border-t border-border/60 p-2">
        <DitherSlider
          modelValue={time()}
          min={0}
          max={Math.max(1, duration())}
          step={0.1}
          label="Seek"
          color={props.color}
          disabled={!props.src}
          class="w-full"
          onUpdateModelValue={seek}
        />
        <div class="flex items-center gap-1">
          <button
            type="button"
            class={cn(btn)}
            aria-label={playing() ? "Pause" : "Play"}
            disabled={!props.src}
            onClick={toggle}
          >
            <span aria-hidden="true">{playing() ? "❚❚" : "▶"}</span>
          </button>
          <button
            type="button"
            class={cn(btn)}
            aria-label={muted() ? "Unmute" : "Mute"}
            disabled={!props.src}
            onClick={toggleMute}
          >
            <span aria-hidden="true">{muted() ? "○" : "●"}</span>
          </button>
          <Show when={volumeWritable()}>
            <DitherSlider
              modelValue={muted() ? 0 : volume()}
              min={0}
              max={1}
              step={0.05}
              label="Volume"
              color={props.color}
              disabled={!props.src}
              class="w-20"
              onUpdateModelValue={writeVolume}
            />
          </Show>
          <button
            type="button"
            class={cn(btn, "w-10 text-[10px] tabular-nums")}
            aria-label={`Playback speed ${rate()}x`}
            disabled={!props.src}
            onClick={cycleRate}
          >
            {rate()}×
          </button>
          <span class="px-1.5 text-[10px] tabular-nums text-muted-foreground">{timeLabel()}</span>
          <button
            type="button"
            class={cn(btn, "ml-auto")}
            aria-label="Fullscreen"
            disabled={!props.src}
            onClick={fullscreen}
          >
            <span aria-hidden="true">⛶</span>
          </button>
        </div>
      </div>
    </div>
  )
}
