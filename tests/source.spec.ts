// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { crc32, zip } from "@/shared/lib/files"
import { asSfc, snippetKind } from "@/widgets/source/model/files"
import * as stylex from "@/widgets/source/model/stylex"

// The kit names these snippets use (a page hands `asSfc` its whole index).
const KIT_NAMES = new Set(["DitherButton", "DitherSlider", "DitherSwitch", "bayerMatrix"])

const SWITCH = `<script setup lang="ts">
import { ref } from "vue"
import { DitherSwitch } from "@dither-kit"

const bloom = ref(true)
</script>

<template>
  <label class="flex items-center justify-between gap-4">
    <span class="text-[13px]">Bloom on hover</span>
    <DitherSwitch v-model="bloom" label="Bloom on hover" color="blue" />
  </label>
</template>`

describe("source files", () => {
  it("tells a snippet's kind", () => {
    expect(snippetKind(SWITCH)).toBe("sfc")
    expect(snippetKind('<DitherButton color="blue">Deploy</DitherButton>')).toBe("fragment")
    expect(snippetKind('const level = ref(40)\n\n<DitherSlider v-model="level" />')).toBe("fragment")
    expect(snippetKind("# 1 — copy the kit\nnpx degit drvova/dither-ui/dither-kit src/dither-kit")).toBe("sh")
    expect(snippetKind(":root {\n  --accent: #3f8ff3;\n}")).toBe("css")
    expect(snippetKind('toast("Saved", { tone: "green" })')).toBe("ts")
  })

  it("completes a fragment into an SFC with what it uses imported", () => {
    const names = KIT_NAMES
    expect(asSfc(SWITCH, names)).toBe(SWITCH)
    expect(asSfc('<DitherButton :matrix="bayerMatrix(4)">Go</DitherButton>\n<Transition />', names)).toBe(
      `<script setup lang="ts">
import { DitherButton, bayerMatrix } from "@dither-kit"
</script>

<template>
  <DitherButton :matrix="bayerMatrix(4)">Go</DitherButton>
  <Transition />
</template>`,
    )
    expect(asSfc('const level = ref(40)\n\n<!-- one -->\n<DitherSlider v-model="level" />', names)).toBe(
      `<script setup lang="ts">
import { ref } from "vue"
import { DitherSlider } from "@dither-kit"

const level = ref(40)
</script>

<template>
  <!-- one -->
  <DitherSlider v-model="level" />
</template>`,
    )
  })

  it("completes a script block over loose markup, keeping what it imports already", () => {
    const names = KIT_NAMES
    expect(
      asSfc(
        '<script setup>\nimport { ref } from "vue"\nconst level = ref(40)\nonMounted(() => {})\n</script>\n\n<DitherSlider v-model="level" />',
        names,
      ),
    ).toBe(
      `<script setup lang="ts">
import { onMounted } from "vue"
import { DitherSlider } from "@dither-kit"

import { ref } from "vue"
const level = ref(40)
onMounted(() => {})
</script>

<template>
  <DitherSlider v-model="level" />
</template>`,
    )
  })
})

describe("files out", () => {
  it("checksums with CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926)
  })

  it("writes a zip every unzip reads", () => {
    const files = [
      { path: "SwitchExample.vue", text: SWITCH },
      { path: "dither-kit/théme.css", text: ":root { --a: 1 }" },
    ]
    const bytes = zip(files, new Date(2026, 9, 23, 12, 30, 10))
    const view = new DataView(bytes.buffer)
    const end = bytes.length - 22
    expect(view.getUint32(end, true)).toBe(0x06054b50)
    expect(view.getUint16(end + 10, true)).toBe(2)
    let at = view.getUint32(end + 16, true)
    const dec = new TextDecoder()
    for (const f of files) {
      expect(view.getUint32(at, true)).toBe(0x02014b50)
      const size = view.getUint32(at + 24, true)
      const nameLength = view.getUint16(at + 28, true)
      const local = view.getUint32(at + 42, true)
      expect(dec.decode(bytes.subarray(at + 46, at + 46 + nameLength))).toBe(f.path)
      expect(view.getUint32(local, true)).toBe(0x04034b50)
      const data = bytes.subarray(local + 30 + nameLength, local + 30 + nameLength + size)
      expect(dec.decode(data)).toBe(f.text)
      expect(view.getUint32(at + 16, true)).toBe(crc32(data))
      at += 46 + nameLength
    }
  })
})

describe("StyleX at run time", () => {
  const sheet = (kind: string) => document.head.querySelector(`style[data-run-stylex="${kind}"]`)?.textContent ?? ""

  it("applies styles as atomic classes, the last style to set a property winning", () => {
    const styles = stylex.create({
      a: { display: "flex", color: "red" },
      b: { color: "blue", padding: 8, opacity: 0.5 },
    })
    const names = stylex.attrs(styles.a, false, [null, styles.b]).class!.split(" ")
    expect(names).toHaveLength(4)
    expect(sheet("plain")).toContain(`.${names[0]}{display:flex}`)
    expect(sheet("plain")).toContain("color:blue")
    expect(sheet("plain")).not.toContain("color:red")
    expect(sheet("plain")).toContain("padding:8px")
    expect(sheet("plain")).toContain("opacity:0.5")
    // The same styles are the same classes, written once; React's spelling agrees.
    expect(stylex.attrs(styles.a, styles.b).class).toBe(names.join(" "))
    expect(stylex.props(styles.a, styles.b).className).toBe(names.join(" "))
    expect(sheet("plain").split(`.${names[0]}{`)).toHaveLength(2)
    expect(stylex.attrs(null, false)).toEqual({})
    expect(stylex.cssName("WebkitLineClamp")).toBe("-webkit-line-clamp")
  })

  it("writes conditions after plain rules: pseudo-classes in the selector, at-rules around it", () => {
    const styles = stylex.create({
      link: { color: { default: "gray", ":hover": { default: null, "@media (hover: hover)": "white" } } },
      mark: { "::before": { content: "'>'", color: { default: "gray", ":hover": "red" } } },
    })
    stylex.attrs(styles.link, styles.mark)
    expect(sheet("plain")).toContain("color:gray")
    expect(sheet("conditional")).toMatch(/@media \(hover: hover\)\{\.x\w+:hover\{color:white\}\}/)
    expect(sheet("conditional")).toMatch(/\.x\w+::before\{content:'>'\}/)
    // The pseudo-element is last in the selector, after the pseudo-class.
    expect(sheet("conditional")).toMatch(/\.x\w+:hover::before\{color:red\}/)
  })

  it("defines variables and keyframes, and keeps fallbacks in order", () => {
    const vars = stylex.defineVars({ accent: { default: "blue", "@media (prefers-color-scheme: light)": "navy" } })
    expect(vars.accent).toMatch(/^var\(--x\w+-accent\)$/)
    expect(sheet("plain")).toMatch(/:root\{--x\w+-accent:blue\}/)
    expect(sheet("conditional")).toMatch(/@media \(prefers-color-scheme: light\)\{:root\{--x\w+-accent:navy\}\}/)
    const spin = stylex.keyframes({ from: { rotate: "0deg" }, to: { rotate: "360deg" } })
    expect(sheet("plain")).toContain(`@keyframes ${spin}{from{rotate:0deg}to{rotate:360deg}}`)
    const styles = stylex.create({ box: { position: stylex.firstThatWorks("sticky", "fixed") } })
    const [name] = stylex.attrs(styles.box).class!.split(" ")
    expect(sheet("plain")).toContain(`.${name}{position:fixed;position:sticky}`)
  })
})
