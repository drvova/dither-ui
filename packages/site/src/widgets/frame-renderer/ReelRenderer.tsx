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
import { directedTime, DitherReveal, isDirected, onSeek } from "@dither-ui/kit"
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
  useContext,
} from "solid-js"
import type { Artboard } from "@/entities/artboard"
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
} from "@/entities/widget"
import { editor } from "@/entities/editor"
import ReelBand from "./ReelBand"
import ReelClip from "./ReelClip"
import "./ReelRenderer.css"

/** The frames a reel may cut to — the player provides its document's; the Studio falls back to the editor's. */
export const REEL_POOL = createContext<(() => Artboard[]) | null>(null)

export default function ReelRenderer(props: { reel: ReelModel; artboardId: string }) {
  const provided = useContext(REEL_POOL)
  const pool = createMemo(() => provided?.() ?? editor.artboards)
  const frames = createMemo(() =>
    props.reel.clips.map((clip) => ({
      clip,
      artboard: pool().find((a) => a.id === clip.id && a.id !== props.artboardId && a.widget?.kind !== "reel") ?? null,
    })),
  )

  let stageRef: HTMLDivElement | undefined
  /** The stage's size: the whole frame, or the frame above the chapter band. */
  const [box, setBox] = createSignal({ w: 0, h: 0 })
  const [time, setTime] = createSignal(0)
  const total = createMemo(() => reelDuration(props.reel.clips))
  const moment = createMemo(() => reelAt(props.reel.clips, time()))
  const reduced = () =>
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  /** The layers on screen: the outgoing clip (when a transition runs) under the incoming one. */
  const layers = createMemo(() => {
    const m = moment()
    if (!m) return []
    const progress = reduced() ? 1 : m.progress
    return [m.outgoing, m.index]
      .filter((i): i is number => i !== null)
      .map((i) => ({ i, ...frames()[i], progress: i === m.index ? progress : 1 }))
      .filter((l): l is typeof l & { artboard: Artboard } => !!l.artboard)
  })
  /** The slots of those layers: a clip's element lives as long as its slot is listed. */
  const slots = createMemo(() => layers().map((l) => l.i))
  const scaleOf = (w: number, h: number) => Math.min(1, box().w ? box().w / w : 1, box().h ? box().h / h : 1)
  /** The lens the camera leans through, in px. */
  const lens = createMemo(() => 2.5 * Math.max(box().w, box().h, 1))

  /** A clip's camera at `local` seconds into it (an outgoing clip runs on past its end). */
  function cameraOf(i: number, local: number) {
    const clip = props.reel.clips[i]
    if (reduced()) return cameraAt(clip.camera, 0)
    return cameraAt(clip.camera, clip.seconds > 0 ? local / clip.seconds : 0)
  }
  /** Seconds into clip `i` at this moment. */
  const localOf = (i: number) => {
    const m = moment()
    if (!m) return 0
    return i === m.index ? m.local : props.reel.clips[i].seconds + m.local
  }
  function transformOf(i: number, w: number, h: number) {
    const s = scaleOf(w, h)
    return cameraTransform(cameraOf(i, localOf(i)), w * s, h * s, lens())
  }

  /** The callouts up on the clip on screen, placed through its camera. */
  const callouts = createMemo(() => {
    const m = moment()
    const art = m ? frames()[m.index]?.artboard : null
    if (!m || !art || !box().w) return []
    const s = scaleOf(art.w, art.h)
    const cam = cameraOf(m.index, m.local)
    const { w: W, h: H } = box()
    return calloutsAt(props.reel.clips[m.index], m.local).map((c) => {
      const [dx, dy] = cameraPoint(cam, art.w * s, art.h * s, lens(), c.x, c.y)
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

  const banded = createMemo(() => hasChapters(props.reel.clips))
  const chapter = createMemo(() => chapterAt(props.reel.clips, moment()))

  let raf = 0
  let last = 0
  let ro: ResizeObserver | null = null

  function frame(now: number) {
    raf = 0
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
    last = now
    setTime(reelLoop(props.reel.clips, time() + dt))
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
    setTime(ms / 1000)
  }

  createEffect(
    on(
      () => editor.replayToken,
      () => setTime(0),
      { defer: true },
    ),
  )

  onMount(() => {
    const unseek = onSeek((ms) => (ms === null ? play() : seekTo(ms)))
    if (stageRef && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(([entry]) => {
        if (entry) setBox({ w: entry.contentRect.width, h: entry.contentRect.height })
      })
      ro.observe(stageRef)
    }
    play()
    onCleanup(() => {
      unseek()
      stop()
      ro?.disconnect()
    })
  })

  return (
    <div
      class="reel-renderer-scope relative flex h-full w-full flex-col overflow-hidden bg-background"
      data-reel-clip={moment()?.index ?? -1}
      data-reel-time={time().toFixed(2)}
      data-reel-total={total()}
    >
      <div ref={(el) => (stageRef = el)} class="reel-stage relative min-h-0 flex-1 overflow-hidden">
        <For each={slots()}>
          {(i) => {
            // The layer of this slot; its last one for the moment it leaves.
            const layer = createMemo<ReturnType<typeof layers>[number]>(
              (prev) => layers().find((l) => l.i === i) ?? prev,
              layers().find((l) => l.i === i)!,
            )
            let camera: HTMLDivElement | undefined
            // The kit's reveal takes no attributes: its element is named for
            // the slot once it stands.
            onMount(() => camera?.parentElement?.setAttribute("data-reel-layer", String(i)))
            return (
              <DitherReveal
                class="absolute inset-0"
                progress={layer().progress}
                direction={wipeDirectionOf(layer().clip.transition.kind)}
                cell={layer().clip.transition.cell}
                seed={layer().clip.transition.seed ?? undefined}
              >
                <div
                  ref={(el) => (camera = el)}
                  class="absolute inset-0"
                  style={{
                    transform: transformOf(i, layer().artboard.w, layer().artboard.h),
                    "transform-origin": "50% 50%",
                  }}
                  data-reel-camera
                >
                  <ReelClip artboard={layer().artboard} scale={scaleOf(layer().artboard.w, layer().artboard.h)} />
                </div>
              </DitherReveal>
            )
          }}
        </For>
        <Show when={callouts().length}>
          <svg class="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <Index each={callouts()}>
              {(c) => (
                <g opacity={c().fade}>
                  <path
                    d={c().path}
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    class="text-foreground/75"
                    stroke-dasharray={`${c().shown} ${c().length}`}
                  />
                  <circle
                    cx={c().x}
                    cy={c().y}
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    class="text-foreground"
                  />
                  <rect x={c().x - 2.5} y={c().y - 2.5} width="5" height="5" fill="var(--swatch-orange)" />
                </g>
              )}
            </Index>
          </svg>
        </Show>
        <Index each={callouts()}>
          {(c) => (
            <div
              class="callout pointer-events-none absolute"
              classList={{ "text-right": c().side === "left", "text-left": c().side !== "left" }}
              style={{
                left: c().left === null ? undefined : `calc(${c().left}px + 1.6cqh)`,
                right: c().right === null ? undefined : `calc(${c().right}px + 1.6cqh)`,
                top: `${c().top}px`,
                opacity: c().text,
              }}
              data-reel-callout={c().label}
            >
              <span class="block text-foreground">{c().label}</span>
              <Show when={c().note}>
                <span class="note block text-muted-foreground">{c().note}</span>
              </Show>
            </div>
          )}
        </Index>
        <Show when={!layers().length}>
          <p class="absolute inset-0 grid place-items-center font-mono text-[11px] text-muted-foreground">
            {props.reel.clips.length ? "a clip's frame is missing" : "No clips. Select frames and press Reel."}
          </p>
        </Show>
      </div>
      <Switch>
        <Match when={banded() && chapter()}>
          {(state) => <ReelBand class="reel-band-slot shrink-0" state={state()} reduced={reduced()} />}
        </Match>
        <Match when={banded()}>
          <div class="reel-band-slot shrink-0 border-t border-border bg-background" />
        </Match>
      </Switch>
    </div>
  )
}
