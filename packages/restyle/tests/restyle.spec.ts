import { describe, expect, it } from "rstack/test"
import UTILITIES from "virtual-dither-utilities"
import { compileUtilities, Names, restyle, stylexText } from "../src/index"
import { buildUtilityMap } from "../src/utility-map"

const decls = (tokens: string[], strict = false) =>
  compileUtilities(tokens, strict).chains.map((c) => [c.chain, Object.fromEntries(c.decl)] as const)

const SNIPPET = `import { createSignal } from "solid-js"
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

describe("the utility map", () => {
  it("holds the snippet vocabulary as declarations, in Tailwind's order, with the registered initials", () => {
    expect(UTILITIES.rules.flex[0]).toEqual({ chain: [], decl: [["display", "flex"]] })
    expect(UTILITIES.rules["hover:text-foreground"][0].chain).toEqual(["&:hover", "@media (hover: hover)"])
    expect(UTILITIES.rules["sm:grid-cols-2"][0].chain).toEqual(["@media (width >= 40rem)"])
    expect(UTILITIES.order["p-4"]).toBeLessThan(UTILITIES.order["px-2"])
    expect(UTILITIES.order.flex).toBeLessThan(UTILITIES.order["hover:text-foreground"])
    expect(UTILITIES.props["--tw-border-style"]).toBe("solid")
    expect(Object.keys(UTILITIES.rules).length).toBeGreaterThan(300)
  })
})

describe("compileUtilities", () => {
  it("merges declarations in cascade order whatever the class order", () => {
    const [[chain, d]] = decls(["px-2", "p-4"])
    expect(chain).toEqual([])
    expect(Object.keys(d)).toEqual(["padding", "padding-inline"])
    expect(d.padding).toBe("1rem")
    expect(d["padding-inline"]).toBe("0.5rem")
  })
  it("resolves Tailwind's internal variables and simplifies values", () => {
    const [[, d]] = decls(["border", "size-7", "-z-10", "shadow-none", "transition-colors"])
    expect(d["border-style"]).toBe("solid")
    expect(d["border-width"]).toBe("1px")
    expect(d.width).toBe("1.75rem")
    expect(d["z-index"]).toBe("-10")
    expect(d["box-shadow"]).toBe("none")
    expect(d["transition-timing-function"]).toBe("cubic-bezier(0.4, 0, 0.2, 1)")
    expect(JSON.stringify(d)).not.toContain("--tw-")
  })
  it("keeps variants as chains and unknown classes as classes", () => {
    const { chains, rest } = compileUtilities([
      "my-thing",
      "text-muted-foreground",
      "hover:text-foreground",
      "sm:grid-cols-2",
    ])
    expect(rest).toEqual(["my-thing"])
    expect(chains.map((c) => c.chain)).toEqual([[], ["&:hover", "@media (hover: hover)"], ["@media (width >= 40rem)"]])
    expect(chains[1].decl).toEqual([["color", "var(--foreground)"]])
  })
})

describe("StyleX as its compiler takes it", () => {
  // The kit's vocabulary (what the StyleX layer is generated from) holds the
  // shapes the docs' does not: a placeholder, a clamp, a ring with an offset.
  const kit = buildUtilityMap(["packages/dither-kit/src/solid", "packages/dither-kit/src/tailwind"])
  const create = async (tokens: string) => {
    const names = new Names()
    names.claim("box", compileUtilities(tokens.split(" "), true, await kit))
    return stylexText(names.all)
  }

  it("puts a pseudo-element at the top, with its own properties", async () => {
    const out = await create("text-foreground placeholder:text-placeholder")
    expect(out).toContain('color: "var(--foreground)"')
    expect(out).toContain('"::placeholder": { color: "var(--placeholder, var(--muted-foreground))" }')
  })

  it("spells a vendor property the way StyleX does", async () => {
    expect(await create("line-clamp-2")).toContain('WebkitLineClamp: "2"')
  })

  it("writes color-mix() without Tailwind's fallback guard, which every supported browser passes", async () => {
    const out = await create("bg-accent/10")
    expect(out).toContain('backgroundColor: "color-mix(in oklab, var(--accent) 10%, transparent)"')
    expect(out).not.toContain("@supports")
  }, 30_000)

  it("resolves a ring with an offset to the end: no Tailwind variable is left", async () => {
    const out = await create(
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    )
    expect(out).toContain('"0 0 0 2px var(--background), 0 0 0 calc(2px + 2px) var(--ring)"')
    expect(out).not.toContain("--tw-")
  })
})

describe("restyle", () => {
  it("leaves Tailwind, and code without utilities, alone", () => {
    expect(restyle(SNIPPET, "tailwind")).toBe(SNIPPET)
    const bare = `<DitherButton color="green">Ship</DitherButton>`
    for (const system of ["css", "modules", "stylex"] as const) expect(restyle(bare, system)).toBe(bare)
  })

  it("writes vanilla CSS: named classes, the stylesheet imported and shown under the file", () => {
    const out = restyle(SNIPPET, "css")
    expect(out).toContain(`import { DitherSwitch } from "@dither-kit"\nimport "./styles.css"\n\nexport default`)
    expect(out).toContain(`<label class="label">`)
    expect(out).toContain(`<span class="text">Bloom on hover</span>`)
    expect(out).not.toContain("items-center")
    expect(out).toContain(`  )
}

/* styles.css */
.label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.text {
  font-size: 13px;
}`)
  })

  it("writes CSS Modules: styles read off the imported module", () => {
    const out = restyle(SNIPPET, "modules")
    expect(out).toContain(`import { DitherSwitch } from "@dither-kit"\nimport styles from "./styles.module.css"\n`)
    expect(out).toContain(`<label class={styles.label}>`)
    expect(out).toContain(`<span class={styles.text}>`)
    expect(out).toContain("/* styles.module.css */\n.label {")
  })

  it("writes StyleX: the import after the others, create() under them, props() on the element", () => {
    const out = restyle(SNIPPET, "stylex")
    expect(out).toContain(`import { DitherSwitch } from "@dither-kit"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  label: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" },
  text: { fontSize: "13px" },
})

export default function Example() {
  const [bloom, setBloom] = createSignal(true)`)
    expect(out).toContain(`<label {...stylex.props(styles.label)}>`)
    expect(out).toContain(`<span {...stylex.props(styles.text)}>`)
    expect(out).not.toContain(".css")
  })

  it("nests variants: pseudo-classes and media in CSS, per-property conditions in StyleX", () => {
    const code = `<a class="text-muted-foreground hover:text-foreground" href="/docs">docs</a>`
    expect(restyle(code, "css")).toBe(`import "./styles.css"

<a class="a" href="/docs">docs</a>

/* styles.css */
.a {
  color: var(--muted-foreground);
}
@media (hover: hover) {
  .a:hover {
    color: var(--foreground);
  }
}`)
    const sx = restyle(code, "stylex")
    expect(sx).toContain(`const styles = stylex.create({
  a: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})`)
    expect(sx).toContain(`<a {...stylex.props(styles.a)} href="/docs">`)
  })

  it("folds inline style into the rule, names boxes by their role, keeps unknown classes, shares identical rules", () => {
    const code = `<div class="flex flex-col" style="gap: 16px; padding: 20px">
  <div class="flex items-center gap-2 my-thing">one</div>
  <div class="flex items-center gap-2">two</div>
  <DitherButton class="flex-1 cta">Ship</DitherButton>
</div>`
    const out = restyle(code, "css")
    expect(out).toContain(`<div class="stack">`)
    expect(out).toContain(`<div class="row my-thing">one</div>`)
    expect(out).toContain(`<div class="row">two</div>`)
    expect(out).toContain(`<DitherButton class="button cta">Ship</DitherButton>`)
    expect(out).not.toContain("style=")
    expect(out).toContain(".stack {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  padding: 20px;\n}")
    expect(out.match(/\.row \{/g)).toHaveLength(1)
    expect(out).toContain(".button {\n  flex: 1;\n}")
    // An unknown class stays text beside the named style, in each system's spelling.
    expect(restyle(code, "modules")).toContain("<div class={`${styles.row} my-thing`}>one</div>")
    const sx = restyle(code, "stylex")
    expect(sx).toContain("<div class={`${stylex.props(styles.row).className} my-thing`}>one</div>")
    expect(sx).toContain(`<div {...stylex.props(styles.row)}>two</div>`)
    expect(sx).toContain("<DitherButton class={`${stylex.props(styles.button).className} cta`}>Ship</DitherButton>")
  })

  it("names the literals of a dynamic class", () => {
    const code = '<button class={`h-6 ${on() ? "text-foreground" : "text-muted-foreground"}`}>x</button>'
    const css = restyle(code, "css")
    expect(css).toContain("<button class={`button ${on() ? 'textForeground' : 'textMutedForeground'}`}>x</button>")
    expect(css).toContain(".textForeground {\n  color: var(--foreground);\n}")
    expect(restyle(code, "modules")).toContain(
      "<button class={`${styles.button} ${on() ? styles.textForeground : styles.textMutedForeground}`}>x</button>",
    )
    expect(restyle(code, "stylex")).toContain(
      `<button {...stylex.props(styles.button, on() ? styles.textForeground : styles.textMutedForeground)}>x</button>`,
    )
  })

  it("names only an expression's class strings: its condition is code, whatever it holds", () => {
    const sx = (b: string) => restyle(`<div class={${b}}>x</div>`, "stylex")
    expect(sx(`m.from === "me" ? "justify-end" : "justify-start"`)).toContain(
      `<div {...stylex.props(m.from === "me" ? styles.justifyEnd : styles.justifyStart)}>`,
    )
    expect(sx(`selected().has(m.email) && "bg-card/50"`)).toContain(
      `<div {...stylex.props(selected().has(m.email) && styles.bgCard50)}>`,
    )
    expect(sx(`hovered() || focused() ? "border-foreground" : "border-border/60"`)).toContain(
      `<div {...stylex.props(hovered() || focused() ? styles.borderForeground : styles.borderBorder60)}>`,
    )
    expect(sx(`m.role === "user" ? "justify-end" : ""`)).toContain(
      `<div {...stylex.props(m.role === "user" ? styles.justifyEnd : null)}>`,
    )
    // A condition's string that is also a utility stays the value it is.
    const view = `view() === "grid" ? "grid grid-cols-3" : "flex flex-col"`
    expect(sx(view)).toContain(`stylex.props(view() === "grid" ? styles.grid : styles.flex)`)
    expect(restyle(`<div class={${view}}>x</div>`, "css")).toContain(`class={view() === "grid" ? 'grid' : 'flex'}`)
    // StyleX converts an expression only whole: a class it cannot name keeps
    // the expression, which the other systems still name around.
    const mixed = `on() ? "p-4 cta" : "p-2"`
    expect(sx(mixed)).toContain(`<div class={${mixed}}>x</div>`)
    expect(sx(`["p-4", on() && "cta"]`)).toContain(`<div class={["p-4", on() && "cta"]}>x</div>`)
    expect(restyle(`<div class={${mixed}}>x</div>`, "modules")).toContain(
      `<div class={on() ? styles.p4 + ' cta' : styles.p2}>x</div>`,
    )
  })

  it("keeps an expression StyleX cannot take, and a self-closing tag's slash", () => {
    const code = "<DitherBadge class={`flex-1 ${classFor(item)}`} />"
    expect(restyle(code, "stylex")).toContain(
      "<DitherBadge class={`${stylex.props(styles.badge).className} ${classFor(item)}`} />",
    )
    expect(restyle(code, "css")).toContain("<DitherBadge class={`badge ${classFor(item)}`} />")
  })

  it("gives a fragment the lines it needs: the import, the styles, the sheet under it", () => {
    const code = `<div class="relative h-64">
  <DitherGradient from="blue" />
</div>`
    expect(restyle(code, "modules")).toBe(`import styles from "./styles.module.css"

<div class={styles.frame}>
  <DitherGradient from="blue" />
</div>

/* styles.module.css */
.frame {
  position: relative;
  height: 16rem;
}`)
    expect(restyle(code, "stylex")).toBe(`import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", height: "16rem" },
})

<div {...stylex.props(styles.frame)}>
  <DitherGradient from="blue" />
</div>`)
  })
})
