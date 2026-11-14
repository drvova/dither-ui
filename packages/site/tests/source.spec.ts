// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { bytesToBase64, fromBase64Url, toBase64Url } from "@/shared/lib/base64"
import { crc32, zip } from "@/shared/lib/files"
import { asTsx, snippetKind } from "@/widgets/source/model/snippet"
import * as stylex from "@/widgets/source/model/stylex"

// The kit names these snippets use (a page hands `asTsx` its whole index).
const KIT_NAMES = new Set(["DitherButton", "DitherSlider", "DitherSwitch", "bayerMatrix"])

const SWITCH = `import { createSignal } from "solid-js"
import { DitherSwitch } from "@dither-kit"

export default function Example() {
  const [bloom, setBloom] = createSignal(true)

  return (
    <label class="flex items-center justify-between gap-4">
      <span class="text-[13px]">Bloom on hover</span>
      <DitherSwitch modelValue={bloom()} onUpdateModelValue={setBloom} label="Bloom on hover" color="blue" />
    </label>
  )
}`

const SLIDER = "<DitherSlider modelValue={level()} onUpdateModelValue={setLevel} />"

describe("source files", () => {
  it("tells a snippet's kind", () => {
    expect(snippetKind(SWITCH)).toBe("file")
    expect(snippetKind('<DitherButton color="blue">Deploy</DitherButton>')).toBe("fragment")
    expect(snippetKind(`const [level, setLevel] = createSignal(40)\n\n${SLIDER}`)).toBe("fragment")
    expect(snippetKind(`{/* one */}\n${SLIDER}`)).toBe("fragment")
    expect(snippetKind("# 1 — copy the kit\nnpx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit")).toBe(
      "sh",
    )
    expect(snippetKind(":root {\n  --accent: #3f8ff3;\n}")).toBe("css")
    expect(snippetKind('toast("Saved", { tone: "green" })')).toBe("ts")
    expect(snippetKind("export default function plugin() {\n  return {}\n}")).toBe("ts")
  })

  it("completes a fragment into a module with what it uses imported", () => {
    expect(asTsx(SWITCH, KIT_NAMES)).toBe(SWITCH)
    expect(asTsx("<DitherButton matrix={bayerMatrix(4)}>Go</DitherButton>\n<Transition />", KIT_NAMES)).toBe(
      `import { DitherButton, bayerMatrix } from "@dither-kit"

export default function Example() {
  return (
    <>
      <DitherButton matrix={bayerMatrix(4)}>Go</DitherButton>
      <Transition />
    </>
  )
}`,
    )
    expect(asTsx(`const [level, setLevel] = createSignal(40)\n\n{/* one */}\n${SLIDER}`, KIT_NAMES)).toBe(
      `import { createSignal } from "solid-js"
import { DitherSlider } from "@dither-kit"

export default function Example() {
  const [level, setLevel] = createSignal(40)

  return (
    <>
      {/* one */}
      ${SLIDER}
    </>
  )
}`,
    )
  })

  it("keeps what a fragment imports already, after what it is given", () => {
    expect(
      asTsx(
        `import { DitherSwitch } from "@dither-kit"\nconst [level, setLevel] = createSignal(40)\nonMount(() => {})\n\n${SLIDER}`,
        KIT_NAMES,
      ),
    ).toBe(
      `import { createSignal, onMount } from "solid-js"
import { DitherSlider } from "@dither-kit"
import { DitherSwitch } from "@dither-kit"

export default function Example() {
  const [level, setLevel] = createSignal(40)
  onMount(() => {})

  return (
    ${SLIDER}
  )
}`,
    )
  })

  it("reads loose script lines under the markup as script, never as the markup's text", () => {
    expect(
      asTsx(
        `<DitherSlider modelValue={level()} onUpdateModelValue={log} />\n{/* one */}\n\n// the level\nconst [level, setLevel] = createSignal(40)\nfunction log(v: number) {\n  setLevel(v > 1 ? v : 1)\n}`,
        KIT_NAMES,
      ),
    ).toBe(
      `import { createSignal } from "solid-js"
import { DitherSlider } from "@dither-kit"

export default function Example() {
  // the level
  const [level, setLevel] = createSignal(40)
  function log(v: number) {
    setLevel(v > 1 ? v : 1)
  }

  return (
    <>
      <DitherSlider modelValue={level()} onUpdateModelValue={log} />
      {/* one */}
    </>
  )
}`,
    )
    // a tag left open, a comment, or a line of a loop's body is still markup to its end
    const open = "<DitherSlider\n  value={40}\n/>"
    expect(asTsx(open, KIT_NAMES)).toContain("  return (\n    <DitherSlider\n      value={40}\n    />\n  )")
    const comment = "<DitherSlider />\n{/* its\n     type: a number */}"
    expect(asTsx(comment, KIT_NAMES)).toContain("           type: a number */}\n    </>\n  )")
    const loop = "<ul>\n  <For each={rows}>\n    {(r) => (\n      <li title={'a > b'}>{r}</li>\n    )}\n  </For>\n</ul>"
    expect(asTsx(loop, KIT_NAMES)).toBe(
      `import { For } from "solid-js"

export default function Example() {
  return (
    <ul>
      <For each={rows}>
        {(r) => (
          <li title={'a > b'}>{r}</li>
        )}
      </For>
    </ul>
  )
}`,
    )
  })
})

describe("files out", () => {
  it("checksums with CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926)
  })

  it("writes bytes and text as base64 past a chunk, as Node does", () => {
    const bytes = Uint8Array.from({ length: 0x8000 * 3 + 7 }, (_, i) => (i * 131) & 255)
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"))
    const text = "théme ✓ ".repeat(9000)
    expect(toBase64Url(text)).toBe(Buffer.from(text).toString("base64url"))
    expect(fromBase64Url(toBase64Url(text))).toBe(text)
  })

  it("writes a zip every unzip reads", () => {
    const files = [
      { path: "SwitchExample.tsx", text: SWITCH },
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
