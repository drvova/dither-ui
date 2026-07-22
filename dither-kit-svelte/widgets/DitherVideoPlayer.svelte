<script lang="ts">
  import DitherSlider from "../controls/DitherSlider.svelte"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Native video under dither chrome — play, a dithered scrubber, tabular
   * time, mute, fullscreen. No src renders an honest empty face so previews
   * never look broken. */
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

<div bind:this={host} class={cn("overflow-hidden rounded-lg border border-border/60 bg-background/80 font-mono", className)}>
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
        onvolumechange={() => (muted = video?.muted ?? false)}
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
      <span class="px-1.5 text-[10px] tabular-nums text-muted-foreground">{timeLabel}</span>
      <button type="button" class={cn(btn, "ml-auto")} aria-label="Fullscreen" disabled={!src} onclick={fullscreen}>
        <span aria-hidden="true">⛶</span>
      </button>
    </div>
  </div>
</div>
