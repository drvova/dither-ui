<script setup lang="ts">
/* The engine part by part: each part named once, what it does and how in
   one sentence, and a figure read from the kit's own source, so the index
   cannot drift from the code. Each part links to the section it lives in. */
import { MODEL_FORMATS } from "@dither-kit/engine/models"
import { PALETTE } from "@dither-kit/engine/palette"
import { SCREENS, SCREEN_KINDS } from "@dither-kit/engine/pixel"
import { SHADER_UNIFORMS } from "@dither-kit/engine/shader"
import { BAYER8 } from "@dither-kit/engine/wipe"
import { SECTIONS } from "../groups"

const bayer = `${SCREENS.bayer.length}×${SCREENS.bayer[0].length}`
const ranks = SCREENS.bayer.length * SCREENS.bayer[0].length
const others = SCREEN_KINDS.filter((k) => k !== "bayer")
const printers = `${others.slice(0, -1).join(", ")} or ${others[others.length - 1]}`
const inputs = SHADER_UNIFORMS.filter((u) => /^iChannel\d$/.test(u)).length

// The section a part lives in, under its own docs label; a dead id throws.
const section = (id: string) => {
  const found = SECTIONS.find((s) => s.id === id)
  if (!found) throw new Error(`EngineSection: no docs section "${id}"`)
  return found
}

const PARTS: { name: string; line: string; figure: string; at: { id: string; label: string } }[] = [
  {
    name: "Matrix",
    line: `Each cell compares its tone with one rank of a ${bayer} threshold matrix and lights when the tone passes it, so a flat fill becomes a pattern of lit and unlit cells.`,
    figure: `${ranks} ranks, ${ranks + 1} tones`,
    at: section("print-screens"),
  },
  {
    name: "Screens",
    line: `The matrix is Bayer's unless a DitherScreen around a surface picks a printer's ${printers}; a fill that carries a label keeps Bayer, so its letters hold.`,
    figure: `${SCREEN_KINDS.length} screens`,
    at: section("print-screens"),
  },
  {
    name: "Seeds",
    line: "One integer seeds the matrix's jitter, the texture, the bloom and the easing, so the same seed draws the same surface every time.",
    figure: "1 integer",
    at: section("seeds"),
  },
  {
    name: "Palette",
    line: "One table resolves each hue to the fill, line and star colours every surface paints with, and the theme's swatches mirror it.",
    figure: `${Object.keys(PALETTE).length} hues`,
    at: section("palette"),
  },
  {
    name: "Clock",
    line: "One clock drives every animation; held at a moment, every surface paints that moment, and the same moment gives the same bytes.",
    figure: "0 frames while held",
    at: section("stage"),
  },
  {
    name: "Wipe",
    line: `Reveals and page transitions are ordered-dither masks: a cell shows once the sweep passes its rank in an ${BAYER8.length}×${BAYER8[0].length} matrix, so a wipe has a dithered front, never a soft edge.`,
    figure: `${BAYER8.length * BAYER8[0].length} ranks`,
    at: section("dither-reveal"),
  },
  {
    name: "World",
    line: "Model files parse in the page and rasterize on the CPU byte for byte, or on WebGL for big meshes, into the same dither pass.",
    figure: `${MODEL_FORMATS.length} formats`,
    at: section("world"),
  },
  {
    name: "Shader",
    line: "GLSL compiles offscreen at the cell resolution and its pixels are read back and dithered; iTime is the kit's clock, and other surfaces bind as its inputs.",
    figure: `${inputs} inputs`,
    at: section("shader"),
  },
]
</script>

<template>
  <section id="engine" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Engine</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The parts under every surface, each named once: what it does in one line, and a figure read from the kit's own
      source.
    </p>
    <dl class="mt-5 border-b border-border/60">
      <div
        v-for="p in PARTS"
        :key="p.name"
        class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 border-t border-border/60 py-3.5 sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
      >
        <dt class="text-[13px] text-foreground">{{ p.name }}</dt>
        <dd
          class="col-span-2 row-start-2 text-[13px] leading-relaxed text-muted-foreground sm:col-span-1 sm:col-start-2 sm:row-start-1"
        >
          {{ p.line }}
          <a
            :href="`#${p.at.id}`"
            class="text-foreground underline decoration-border underline-offset-4 hover:decoration-current"
            >{{ p.at.label }}</a
          >
        </dd>
        <dd class="text-right font-mono text-[12px] tabular-nums text-foreground sm:col-start-3 sm:row-start-1">
          {{ p.figure }}
        </dd>
      </div>
    </dl>
  </section>
</template>
