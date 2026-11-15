import { DitherWorld } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherWorld color="blue" autoRotate={12} class="h-64" />
}

export const meta = defineExample({
  component: DitherWorld,
  title: "World (3D)",
  studio: {
    group: "display",
    frame: { w: 320, h: 240 },
    controls: {
      src: { kind: "url", demo: "" },
      source: { demo: "" },
      format: { options: ["auto", "vrml", "x3d", "gltf", "obj", "stl", "ply", "off"] },
      engine: {},
      color: {},
      colors: { kind: "list", demo: [] },
      dither: { min: 0, max: 1, step: 0.05 },
      cell: { min: 1, max: 8, step: 1 },
      autoRotate: { min: 0, max: 90, step: 1 },
      yaw: { min: -180, max: 180, step: 1 },
      pitch: { min: -89, max: 89, step: 1 },
      zoom: { min: 0.3, max: 4, step: 0.1 },
      fov: { min: 10, max: 120, step: 1 },
      shade: { min: 0, max: 1, step: 0.02 },
      fog: { min: 0, max: 1, step: 0.05 },
      grain: { min: 0, max: 1, step: 0.05 },
      grainScale: { min: 0.5, max: 16, step: 0.5 },
      material: {},
      wire: {},
      shader: { demo: "" },
      bloom: { kind: "select", options: ["off", "low", "high", "aura"] },
      animate: {},
      interactive: {},
      frameRate: { min: 0, max: 60, step: 1 },
      paused: {},
    },
  },
})
