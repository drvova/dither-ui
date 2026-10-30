// The kit as the landing states it. Claims are facts:
// tests/landing-facts.spec.ts recounts each one from the kit, so a kit
// change that moves one fails until the page says it.
import { SCREEN_KINDS } from "@dither-kit"
import kit from "../../../dither-kit/package.json"
import { SECTION_COUNT } from "./hub"

export const COMPONENT_COUNT = 266

/** The packages the kit needs beside Vue (its peer dependencies), in the
 * order the install step names them. */
export const RUNTIME_DEPS = ["d3-scale", "d3-shape", "clsx", "tailwind-merge"] as const

/** The spec sheet that closes the install: label and value, each value read
 * from the kit where it can be, the rest held to it by the facts spec. */
export const SPECS: readonly { label: string; value: string }[] = [
  { label: "Components", value: `${COMPONENT_COUNT} for Vue 3, ported to Svelte 5` },
  { label: "Docs", value: `${SECTION_COUNT} live sections, each with its props and code` },
  { label: "Engine", value: "One seeded 4×4 threshold matrix under every surface" },
  { label: "Screens", value: SCREEN_KINDS.join(", ") },
  { label: "Rendering", value: "Canvas on the CPU, WebGL for big meshes and GLSL" },
  { label: "Styling", value: "Tailwind, StyleX, CSS Modules or CSS" },
  { label: "Exports", value: "Vue or Svelte code, PNG, MP4" },
  { label: "License", value: kit.license },
]
