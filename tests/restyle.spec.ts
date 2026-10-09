import { describe, expect, it } from "vitest"
import UTILITIES from "virtual:dither-utilities"
import { compileUtilities, restyle } from "../src/shared/lib/restyle"

const decls = (tokens: string[], strict = false) => compileUtilities(tokens, strict).chains.map((c) => [c.chain, Object.fromEntries(c.decl)] as const)

const SNIPPET = `<script setup lang="ts">
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
    const { chains, rest } = compileUtilities(["my-thing", "text-muted-foreground", "hover:text-foreground", "sm:grid-cols-2"])
    expect(rest).toEqual(["my-thing"])
    expect(chains.map((c) => c.chain)).toEqual([[], ["&:hover", "@media (hover: hover)"], ["@media (width >= 40rem)"]])
    expect(chains[1].decl).toEqual([["color", "var(--foreground)"]])
  })
})

describe("restyle", () => {
  it("leaves Tailwind, and code without utilities, alone", () => {
    expect(restyle(SNIPPET, "tailwind")).toBe(SNIPPET)
    const bare = `<DitherButton color="green">Ship</DitherButton>`
    for (const system of ["css", "modules", "stylex"] as const) expect(restyle(bare, system)).toBe(bare)
  })

  it("writes vanilla CSS: named classes and a scoped stylesheet", () => {
    const out = restyle(SNIPPET, "css")
    expect(out).toContain(`<label class="label">`)
    expect(out).toContain(`<span class="text">Bloom on hover</span>`)
    expect(out).not.toContain("items-center")
    expect(out).toContain(`</template>

<style scoped>
.label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.text {
  font-size: 13px;
}
</style>`)
  })

  it("writes CSS Modules: $style bindings and a module block", () => {
    const out = restyle(SNIPPET, "modules")
    expect(out).toContain(`<label :class="$style.label">`)
    expect(out).toContain(`<span :class="$style.text">`)
    expect(out).toContain("<style module>\n.label {")
  })

  it("writes StyleX: the import after the others, create() in the script, attrs() on the element", () => {
    const out = restyle(SNIPPET, "stylex")
    expect(out).toContain(`import { DitherSwitch } from "@dither-kit"
import * as stylex from "@stylexjs/stylex"

const bloom = ref(true)

const styles = stylex.create({
  label: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" },
  text: { fontSize: "13px" },
})
</script>`)
    expect(out).toContain(`<label v-bind="stylex.attrs(styles.label)">`)
    expect(out).toContain(`<span v-bind="stylex.attrs(styles.text)">`)
  })

  it("nests variants: pseudo-classes and media in CSS, per-property conditions in StyleX", () => {
    const code = `<a class="text-muted-foreground hover:text-foreground" href="/docs">docs</a>`
    expect(restyle(code, "css")).toBe(`<a class="a" href="/docs">docs</a>

<style scoped>
.a {
  color: var(--muted-foreground);
}
@media (hover: hover) {
  .a:hover {
    color: var(--foreground);
  }
}
</style>`)
    const sx = restyle(code, "stylex")
    expect(sx).toContain(`const styles = stylex.create({
  a: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})`)
    expect(sx).toContain(`<a v-bind="stylex.attrs(styles.a)" href="/docs">`)
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
  })

  it("names the literals of a dynamic class binding", () => {
    const code = `<button class="h-6" :class="on ? 'text-foreground' : 'text-muted-foreground'">x</button>`
    expect(restyle(code, "css")).toContain(`<button class="button" :class="on ? 'textForeground' : 'textMutedForeground'">x</button>`)
    expect(restyle(code, "modules")).toContain(`<button :class="[$style.button, on ? $style.textForeground : $style.textMutedForeground]">x</button>`)
    expect(restyle(code, "stylex")).toContain(`<button v-bind="stylex.attrs(styles.button, on ? styles.textForeground : styles.textMutedForeground)">x</button>`)
    expect(restyle(code, "css")).toContain(".textForeground {\n  color: var(--foreground);\n}")
  })

  it("keeps a binding StyleX cannot take, and a self-closing tag's slash", () => {
    const code = `<DitherBadge class="flex-1" :class="classFor(item)" />`
    const sx = restyle(code, "stylex")
    expect(sx).toContain(`<DitherBadge v-bind="stylex.attrs(styles.badge)" :class="classFor(item)" />`)
    expect(restyle(code, "css")).toContain(`<DitherBadge class="badge" :class="classFor(item)" />`)
  })

  it("speaks Svelte: a plain style block, spread attrs, class expressions", () => {
    const svelte = `<script lang="ts">
  import { DitherSwitch } from "@dither-kit-svelte"

  let bloom = $state(true)
</script>

<label class="flex items-center gap-4">
  <span class={bloom ? 'text-foreground' : 'text-muted-foreground'}>Bloom</span>
  <DitherSwitch bind:value={bloom} />
</label>`
    const css = restyle(svelte, "css", "svelte")
    expect(css).toContain(`<label class="label">`)
    expect(css).toContain(`<span class={bloom ? 'textForeground' : 'textMutedForeground'}>Bloom</span>`)
    expect(css).toContain("</label>\n\n<style>\n.label {")
    expect(restyle(svelte, "modules", "svelte")).toBe(css)
    const sx = restyle(svelte, "stylex", "svelte")
    expect(sx).toContain(`  import { DitherSwitch } from "@dither-kit-svelte"
  import * as stylex from "@stylexjs/stylex"

  let bloom = $state(true)

  const styles = stylex.create({
    label: { display: "flex", alignItems: "center", gap: "1rem" },
    textForeground: { color: "var(--foreground)" },
    textMutedForeground: { color: "var(--muted-foreground)" },
  })
</script>`)
    expect(sx).toContain(`<label {...stylex.attrs(styles.label)}>`)
    expect(sx).toContain(`<span {...stylex.attrs(bloom ? styles.textForeground : styles.textMutedForeground)}>Bloom</span>`)
  })

  it("gives a fragment what it needs: styles appended, StyleX lines prepended", () => {
    const code = `<div class="relative h-64">
  <DitherGradient from="blue" />
</div>`
    expect(restyle(code, "css")).toBe(`<div class="frame">
  <DitherGradient from="blue" />
</div>

<style scoped>
.frame {
  position: relative;
  height: 16rem;
}
</style>`)
    expect(restyle(code, "stylex")).toBe(`import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", height: "16rem" },
})

<div v-bind="stylex.attrs(styles.frame)">
  <DitherGradient from="blue" />
</div>`)
    const sfc = `<template>\n  ${code.split("\n").join("\n  ")}\n</template>`
    expect(restyle(sfc, "stylex")).toMatch(/^<script setup lang="ts">\nimport \* as stylex from "@stylexjs\/stylex"\n\nconst styles = stylex\.create\(\{\n {2}frame: \{ position: "relative", height: "16rem" \},\n\}\)\n<\/script>\n\n<template>/)
  })
})
