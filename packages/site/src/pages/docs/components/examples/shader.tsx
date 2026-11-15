import { DitherShader } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherShader levels={2} class="h-64" />
}

export const meta = defineExample({
  component: DitherShader,
  title: "Shader (GLSL)",
  studio: {
    group: "display",
    frame: { w: 320, h: 240 },
    controls: {
      src: { kind: "url", demo: "" },
      source: { demo: "" },
      color: {},
      colors: { kind: "list", demo: [] },
      mono: {},
      dither: { min: 0, max: 1, step: 0.05 },
      levels: { min: 2, max: 8, step: 1 },
      shade: { min: 0, max: 1, step: 0.02 },
      speed: { min: 0, max: 4, step: 0.1 },
      cell: { min: 1, max: 8, step: 1 },
      interactive: {},
      frameRate: { min: 0, max: 60, step: 1 },
      paused: {},
    },
  },
})
