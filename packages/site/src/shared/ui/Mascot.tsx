// The mascot (`mascot.ts`): the brand's diamond come alive, its parts the
// sprite's (`sprite.ts`) in the ink around it with an ember heart and
// antenna tips. `size` is its height in px. Its motion is its stylesheet's,
// no script: `alive` lets it blink now and then, a pointer on it makes it
// hop, and posed to fly its rotor turns, all held still under reduced
// motion. Decorative: what it stands beside says what it means.
import { Index, type JSX, mergeProps, Show, splitProps } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { EYE, MASCOT_H, MASCOT_ROTOR_STEPS, MASCOT_W, type MascotPose } from "@/shared/ui/mascot"
import { MASCOT_SYMBOLS, spriteRef } from "@/shared/ui/sprite"
import "./Mascot.css"

type Own = { size: number; pose?: MascotPose; alive?: boolean; class?: string }
type MascotProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

const TURNS = Array.from({ length: MASCOT_ROTOR_STEPS }, (_, turn) => turn)

export default function Mascot(raw: MascotProps) {
  const merged = mergeProps({ pose: "idle" as MascotPose, alive: false }, raw)
  const [props, rest] = splitProps(merged, ["size", "pose", "alive", "class"])

  return (
    <svg
      {...rest}
      class={cn("mascot-scope mascot", props.class)}
      data-pose={props.pose}
      data-alive={props.alive ? "" : undefined}
      viewBox={`0 0 ${MASCOT_W} ${MASCOT_H}`}
      height={props.size}
      width={(props.size * MASCOT_W) / MASCOT_H}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
    >
      <g class="mascot-fig">
        <Show
          when={props.pose === "fly"}
          fallback={<use href={spriteRef(props.pose === "wave" ? MASCOT_SYMBOLS.wave : MASCOT_SYMBOLS.antennae)} />}
        >
          <Index each={TURNS}>
            {(turn) => (
              <use class="mascot-turn" style={{ "--turn": turn() }} href={spriteRef(MASCOT_SYMBOLS.rotor(turn()))} />
            )}
          </Index>
        </Show>
        <use href={spriteRef(MASCOT_SYMBOLS.body)} />
        <rect class="mascot-lid" x={EYE[0]} y={EYE[1]} width="1" height="1" fill="currentColor" />
        <use class="mascot-feet" href={spriteRef(MASCOT_SYMBOLS.feet)} />
      </g>
    </svg>
  )
}
