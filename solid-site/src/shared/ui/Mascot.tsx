// The mascot (`mascot.ts`): the brand's diamond come alive, drawn cell by
// cell in the ink around it with an ember heart and antenna tips. `size` is
// its height in px. `alive` lets it blink now and then, never under reduced
// motion; a pointer on it makes it hop. Posed to fly, its rotor turns (held
// still under reduced motion). Decorative: what it stands beside says what
// it means.
import {
  createEffect,
  createMemo,
  createSignal,
  Index,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js"
import { cn } from "@dither-kit/tailwind/lib"
import { MASCOT_H, MASCOT_ROTOR_STEPS, MASCOT_W, type MascotPose, mascotCells } from "@/shared/ui/mascot"
import "./Mascot.css"

type Own = { size: number; pose?: MascotPose; alive?: boolean; class?: string }
export type MascotProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

export default function Mascot(raw: MascotProps) {
  const merged = mergeProps({ pose: "idle" as MascotPose, alive: false }, raw)
  const [props, rest] = splitProps(merged, ["size", "pose", "alive", "class"])

  const [now, setNow] = createSignal<MascotPose | null>(null)
  // Flying, neither a blink nor a hop takes it out of the air.
  const shown = createMemo<MascotPose>(() => (props.pose === "fly" ? "fly" : (now() ?? props.pose)))
  const [turn, setTurn] = createSignal(0)
  const cells = createMemo(() => mascotCells(shown(), turn()))
  const flying = createMemo(() => shown() === "fly")

  let timer: ReturnType<typeof setTimeout> | undefined
  const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  function blinkLater() {
    timer = setTimeout(
      () => {
        setNow("blink")
        timer = setTimeout(() => {
          setNow(null)
          blinkLater()
        }, 140)
      },
      3200 + Math.random() * 3600,
    )
  }
  // The rotor: a step every 60ms while it flies, a quarter turn a frame.
  let spin: ReturnType<typeof setInterval> | undefined
  onMount(() => {
    if (props.alive && !still()) blinkLater()
    createEffect(
      on(flying, (up) => {
        clearInterval(spin)
        setTurn(0)
        if (up && !still()) spin = setInterval(() => setTurn((t) => (t + 1) % MASCOT_ROTOR_STEPS), 60)
      }),
    )
    onCleanup(() => {
      clearTimeout(timer)
      clearInterval(spin)
    })
  })

  function hop() {
    if (still() || shown() === "fly") return
    setNow("hop")
    clearTimeout(timer)
    timer = setTimeout(() => {
      setNow(null)
      if (props.alive) blinkLater()
    }, 220)
  }

  return (
    <svg
      {...rest}
      class={cn("mascot-scope mascot", props.class)}
      viewBox={`0 0 ${MASCOT_W} ${MASCOT_H}`}
      height={props.size}
      width={(props.size * MASCOT_W) / MASCOT_H}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
      on:pointerenter={hop}
    >
      <Index each={cells()}>
        {(c) => (
          <rect
            x={c().x}
            y={c().y}
            width="1"
            height="1"
            fill={c().ink === "ember" ? "var(--signal, var(--swatch-orange))" : "currentColor"}
          />
        )}
      </Index>
    </svg>
  )
}
