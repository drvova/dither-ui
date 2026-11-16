// Generated from @dither-ui/kit/solid/DitherVideoPlayer.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, mergeProps, onMount, Show } from "solid-js"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import DitherSlider from "./DitherSlider"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", aspectRatio: "16 / 9", backgroundColor: "var(--background)" },
  grid: { display: "grid", height: "100%", width: "100%", placeItems: "center" },
  box: { textAlign: "center" },
  text: {
    marginInline: "auto",
    display: "block",
    width: "0.75rem",
    height: "0.75rem",
    borderRadius: "2px",
    backgroundColor: "var(--border)",
  },
  p: { marginTop: "0.5rem", fontSize: "11px", color: "var(--muted-foreground)" },
  video: { height: "100%", width: "100%", objectFit: "contain" },
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
  text2: {
    paddingInline: "0.375rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  box2: {
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 80%, transparent)",
    fontFamily: "var(--font-mono)",
  },
  button: { width: "2.5rem", fontSize: "10px", fontVariantNumeric: "   tabular-nums " },
  button2: { marginLeft: "auto" },
  btn: {
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
  xstyle?: StyleProp
}

const RATES = [1, 1.25, 1.5, 2]

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}
const btn = [styles.btn, CONTROL_BUTTON]

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
      class={cn(styles.box2, CONTROL_BUTTON, props.xstyle, props.class)}
      onKeyDown={onKey}
    >
      <div {...stylex.props(styles.frame)}>
        <Show
          when={props.src}
          fallback={
            <div {...stylex.props(styles.grid)} aria-hidden="true">
              <div {...stylex.props(styles.box)}>
                <span {...stylex.props(styles.text)} />
                <p {...stylex.props(styles.p)}>No source.</p>
              </div>
            </div>
          }
        >
          <video
            ref={(el) => (element = el)}
            src={props.src}
            poster={props.poster}
            aria-label={props.label}
            {...stylex.props(styles.video)}
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
      <div {...stylex.props(styles.grid2)}>
        <DitherSlider
          modelValue={time()}
          min={0}
          max={Math.max(1, duration())}
          step={0.1}
          label="Seek"
          color={props.color}
          disabled={!props.src}
          xstyle={styles.slider}
          onUpdateModelValue={seek}
        />
        <div {...stylex.props(styles.row)}>
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
              xstyle={styles.slider2}
              onUpdateModelValue={writeVolume}
            />
          </Show>
          <button
            type="button"
            class={cn(btn, styles.button)}
            aria-label={`Playback speed ${rate()}x`}
            disabled={!props.src}
            onClick={cycleRate}
          >
            {rate()}×
          </button>
          <span {...stylex.props(styles.text2)}>{timeLabel()}</span>
          <button
            type="button"
            class={cn(btn, styles.button2)}
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
