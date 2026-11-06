// The kit as the landing states it. Claims are facts:
// tests/landing-facts.spec.ts recounts each one from the kit, so a kit
// change that moves one fails until the page says it.
import { SCREEN_KINDS, SCREENS } from "@dither-kit"
import type { ModelFormat } from "@dither-kit/engine/models"
import type { MarkId } from "@/shared/ui/marks"
import kit from "../../../dither-kit/package.json"
import { SECTION_COUNT } from "./hub"

export const COMPONENT_COUNT = 268

/** The threshold matrix every surface prints through, as the page writes it. */
export const MATRIX = `${SCREENS.bayer.length}×${SCREENS.bayer[0].length}`

/** The packages the kit needs beside Vue (its peer dependencies), in the
 * order the install step names them. */
export const RUNTIME_DEPS = ["d3-scale", "d3-shape", "clsx", "tailwind-merge"] as const

/** The spec sheet that closes the install: label and value, each value read
 * from the kit where it can be, the rest held to it by the facts spec. */
export const SPECS: readonly { label: string; value: string }[] = [
  { label: "Components", value: `${COMPONENT_COUNT} for Vue 3, ported to Svelte 5` },
  { label: "Docs", value: `${SECTION_COUNT} live sections, each with its props and code` },
  { label: "Engine", value: `One seeded ${MATRIX} threshold matrix under every surface` },
  { label: "Screens", value: SCREEN_KINDS.join(", ") },
  { label: "Rendering", value: "Canvas on the CPU, WebGL for big meshes and GLSL" },
  { label: "Styling", value: "Tailwind, StyleX, CSS Modules or CSS" },
  { label: "Exports", value: "Vue or Svelte code, PNG, MP4" },
  { label: "License", value: kit.license },
]

/** What the kit styles with, each under its own mark. */
export const WORKS: readonly { id: MarkId; name: string }[] = [
  { id: "vue", name: "Vue 3" },
  { id: "svelte", name: "Svelte 5" },
  { id: "tailwind", name: "Tailwind" },
  { id: "stylex", name: "StyleX" },
  { id: "cssmodules", name: "CSS Modules" },
  { id: "css", name: "CSS" },
]

/** The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES: ids and
 * names, pinned by tests/marks.spec.ts), in its order. */
export const HARNESSES = [
  { id: "claude", name: "Claude Code" },
  { id: "codex", name: "Codex" },
  { id: "gemini", name: "Gemini CLI" },
  { id: "qwen", name: "Qwen Code" },
  { id: "omp", name: "oh-my-pi" },
  { id: "goose", name: "Goose" },
  { id: "opencode", name: "OpenCode" },
  { id: "auggie", name: "Auggie" },
] as const

/** Every model format the kit reads, as the page names it: keyed by the
 * kit's own list, so a format it learns is a type error here until named. */
export const MODEL_NAMES: Record<ModelFormat, string> = {
  vrml: "VRML 1 and 97",
  x3d: "X3D",
  gltf: "glTF and GLB",
  obj: "OBJ with MTL",
  stl: "STL",
  ply: "PLY",
  off: "OFF",
}
