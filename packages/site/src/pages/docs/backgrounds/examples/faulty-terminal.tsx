import { DitherFaultyTerminal, type DitherColor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: {
  tint?: DitherColor
  scale?: number
  glitchAmount?: number
  scanlineIntensity?: number
  dither?: number
  curvature?: number
  chromaticAberration?: number
}) {
  return (
    <div class="relative h-56 overflow-hidden rounded-md border border-border/60">
      <DitherFaultyTerminal
        tint={props.tint ?? "green"}
        scale={props.scale ?? 1.5}
        glitchAmount={props.glitchAmount ?? 0.6}
        scanlineIntensity={props.scanlineIntensity ?? 0.8}
        dither={props.dither}
        curvature={props.curvature}
        chromaticAberration={props.chromaticAberration}
      />
    </div>
  )
}

export const meta = defineExample({
  component: DitherFaultyTerminal,
  title: "Faulty terminal",
  studio: {
    group: "display",
    frame: { w: 320, h: 200 },
    controls: {
      tint: { demo: "#ffffff" },
      scale: { min: 0.2, max: 4, step: 0.1 },
      digitSize: { min: 0.5, max: 3, step: 0.1 },
      scanlineIntensity: { min: 0, max: 2, step: 0.1, demo: 1 },
      glitchAmount: { min: 0, max: 3, step: 0.1, demo: 1 },
      flickerAmount: { min: 0, max: 2, step: 0.1 },
      noiseAmp: { min: 0, max: 2, step: 0.1 },
      chromaticAberration: { min: 0, max: 8, step: 1 },
      curvature: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      brightness: { min: 0, max: 2, step: 0.1 },
      timeScale: { min: 0, max: 3, step: 0.1 },
      mouseReact: {},
      mouseStrength: { min: 0, max: 2, step: 0.1 },
      pageLoadAnimation: {},
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      pause: {},
    },
  },
})
