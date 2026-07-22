<script lang="ts">
  import DitherSlider from "../controls/DitherSlider.svelte"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Native video under dither chrome — play, a dithered scrubber, volume,
   * playback rate, tabular time, mute, fullscreen, and player keyboard:
   * Space/K play · ←→ seek 5s · ↑↓ volume · M mute · F fullscreen.
   * No src renders an honest empty face so previews never look broken. */
  type Props = {
    src?: string
    poster?: string
    label?: string
    color?: PixelColor
    class?: string
  }

  let { src, poster, label = "Video", color = "blue", class: className }: Props = $props()

  let video = $state<HTMLVideoElement | null>(null)
  let host = $state<HTMLDivElement | null>(null)
  let playing = $state(false)
  let muted = $state(false)
  let time = $state(0)
  let duration = $state(0)
  let volume = $state(1)
  let rate = $state(1)
  const RATES = [1, 1.25, 1.5, 2]

  function toggle() {
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }
  function seek(t: number | [number, number]) {
    if (video && typeof t === "number") video.currentTime = t
  }
  function toggleMute() {
    if (!video) return
    video.muted = !video.muted
    muted = video.muted
  }
  function setVolume(v: number | [number, number]) {
    if (!video || typeof v !== "number") return
    video.volume = Math.min(1, Math.max(0, v))
    video.muted = video.volume === 0
  }
  function cycleRate() {
    if (!video) return
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length]
    video.playbackRate = next
    rate = next
  }
  function bump(delta: number) {
    if (video) setVolume(video.volume + delta)
  }
  function nudge(delta: number) {
    if (video) video.currentTime = Math.min(duration, Math.max(0, video.currentTime + delta))
  }
  /** Player keyboard — skipped while a control inside owns the key. */
  function onKey(e: KeyboardEvent) {
    if (!src || !video) return
    const el = e.target as HTMLElement
    if (el.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return
    if (el.tagName === "INPUT" || el.getAttribute("role") === "slider") return
    const k = e.key.toLowerCase()
    if (e.key === " " || k === "k") {
      e.preventDefault()
      toggle()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      nudge(-5)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      nudge(5)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      bump(0.1)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      bump(-0.1)
    } else if (k === "m") toggleMute()
    else if (k === "f") fullscreen()
  }
  function fullscreen() {
    host?.requestFullscreen?.()
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, "0")}`
  }
  const timeLabel = $derived(`${fmt(time)} / ${fmt(duration)}`)
  const btn = cn(
    "grid size-8 place-items-center rounded-md text-[12px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
    CONTROL_BUTTON
  )
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (the player group takes focus so its keyboard shortcuts work, the standard media-player pattern) -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions (keydown on the focused group drives play/seek/volume; inner controls keep their own semantics) -->
<div
  bind:this={host}
  role="group"
  aria-label={label}
  tabindex="0"
  class={cn("overflow-hidden rounded-lg border border-border/60 bg-background/80 font-mono", CONTROL_BUTTON, className)}
  onkeydown={onKey}
>
  <div class="relative aspect-video bg-background">
    {#if src}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        bind:this={video}
        {src}
        {poster}
        aria-label={label}
        class="h-full w-full object-contain"
        playsinline
        onclick={toggle}
        onplay={() => (playing = true)}
        onpause={() => (playing = false)}
        ontimeupdate={() => (time = video?.currentTime ?? 0)}
        ondurationchange={() => (duration = video?.duration ?? 0)}
        onvolumechange={() => {
          muted = video?.muted ?? false
          volume = video?.volume ?? 1
        }}
      ></video>
    {:else}
      <div class="grid h-full w-full place-items-center" aria-hidden="true">
        <div class="text-center">
          <span class="mx-auto block size-3 rounded-[2px] bg-border"></span>
          <p class="mt-2 text-[11px] text-muted-foreground/60">No source.</p>
        </div>
      </div>
    {/if}
  </div>
  <div class="grid gap-1.5 border-t border-border/60 p-2">
    <DitherSlider bind:value={() => time, (v) => seek(v)} min={0} max={Math.max(1, duration)} step={0.1} label="Seek" {color} disabled={!src} class="w-full" />
    <div class="flex items-center gap-1">
      <button type="button" class={btn} aria-label={playing ? "Pause" : "Play"} disabled={!src} onclick={toggle}>
        <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
      </button>
      <button type="button" class={btn} aria-label={muted ? "Unmute" : "Mute"} disabled={!src} onclick={toggleMute}>
        <span aria-hidden="true">{muted ? "○" : "●"}</span>
      </button>
      <DitherSlider
        bind:value={() => (muted ? 0 : volume), (v) => setVolume(v)}
        min={0}
        max={1}
        step={0.05}
        label="Volume"
        {color}
        disabled={!src}
        class="w-20"
      />
      <button type="button" class={cn(btn, "w-10 text-[10px] tabular-nums")} aria-label={`Playback speed ${rate}x`} disabled={!src} onclick={cycleRate}>
        {rate}×
      </button>
      <span class="px-1.5 text-[10px] tabular-nums text-muted-foreground">{timeLabel}</span>
      <button type="button" class={cn(btn, "ml-auto")} aria-label="Fullscreen" disabled={!src} onclick={fullscreen}>
        <span aria-hidden="true">⛶</span>
      </button>
    </div>
  </div>
</div>
