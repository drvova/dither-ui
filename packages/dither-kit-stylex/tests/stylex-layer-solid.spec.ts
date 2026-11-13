// This package's source (`src/`) is generated from the kit's Solid layer by
// `restyle/stylex-layer`. This spec writes it
// (`npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts`)
// and fails while a committed file differs from what the Solid files give,
// so the two layers never drift; a construct the generator cannot carry
// fails it by file and line.
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { describe, expect, it } from "rstack/test"
import { CONTROL_FILE, HAND_WRITTEN, solidStylexLayer, type SolidStylexLayer } from "restyle/stylex-layer"
import { buildUtilityMap } from "restyle/utility-map"

// `rs fmt` is rstack's Prettier with the house options (the root's rstack.config.ts):
// the generated files come out of the same formatter.
const require = createRequire(import.meta.url)
const prettier = createRequire(require.resolve("rstack/package.json"))("prettier") as {
  format(text: string, options: Record<string, unknown>): Promise<string>
}
const FORMAT = { semi: false, printWidth: 120 }

const SOLID = "packages/dither-kit/src/solid"
const TAILWIND = "packages/dither-kit/src/tailwind"
const STYLEX = "packages/dither-kit-stylex/src"

const tree = (dir: string, under = ""): string[] =>
  readdirSync(`${dir}/${under}`, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? tree(dir, `${under}${e.name}/`) : [`${under}${e.name}`],
  )

/** The hook classes the components' stylesheets style (`<Name>.css`), kept
 * as class names in the StyleX layer. */
const hooks = () => new Set([...MARKERS, ...styled()])

/** Hook classes no stylesheet styles: a component's own name on its root. */
const MARKERS = ["dither-container", "dither-focus-word", "dither-sequence"]

const styled = () =>
  new Set(
    tree(SOLID)
      .filter((n) => n.endsWith(".css"))
      .flatMap((n) => [...readFileSync(`${SOLID}/${n}`, "utf8").matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1])),
  )

let vocabulary: ReturnType<typeof buildUtilityMap> | null = null
const utilities = () => (vocabulary ??= buildUtilityMap([SOLID, TAILWIND]))

let layer: SolidStylexLayer | null = null
async function generate(): Promise<SolidStylexLayer> {
  if (layer) return layer
  const map = await utilities()
  const files = new Map(
    tree(SOLID)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => [n, readFileSync(`${SOLID}/${n}`, "utf8")] as const),
  )
  layer = solidStylexLayer(files, readFileSync(`${TAILWIND}/${CONTROL_FILE}`, "utf8"), map)
  if (process.env.STYLEX_SOLID_REPORT)
    writeFileSync(
      process.env.STYLEX_SOLID_REPORT,
      JSON.stringify(
        {
          files: [...layer.files.keys()],
          refused: layer.refused,
          kept: [...layer.kept],
          inert: [...layer.inert],
          passed: [...layer.passed],
          opaque: [...layer.opaque],
        },
        null,
        1,
      ),
    )
  return layer
}

describe("the Solid StyleX layer", () => {
  it("refuses nothing: every Solid file is carried", async () => {
    const { refused } = await generate()
    expect(refused.map((r) => `${r.file}:${r.line}: ${r.kind}: ${r.message}`)).toEqual([])
  }, 120_000)

  it("is what the Solid layer generates", async () => {
    const { files } = await generate()
    for (const [name, text] of files)
      await expect(await prettier.format(text, { ...FORMAT, filepath: name })).toMatchFileSnapshot(`../src/${name}`)
    const stale = tree(STYLEX).filter((n) => !files.has(n) && !HAND_WRITTEN.has(n))
    expect(stale).toEqual([])
  }, 240_000)

  it("holds a twin of every Solid component and module, and the index", async () => {
    const { files } = await generate()
    const own = tree(SOLID).filter((n) => /\.tsx?$/.test(n) && !n.startsWith("runtime/"))
    expect(own.filter((n) => !files.has(n))).toEqual([])
    const exportsOf = (text: string) => [...text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)].map((m) => m[1])
    expect(exportsOf(files.get("index.ts")!)).toEqual(exportsOf(readFileSync(`${SOLID}/index.ts`, "utf8")))
  }, 120_000)

  it("reaches no Tailwind-layer module and copies no runtime file that writes no class", async () => {
    const { files } = await generate()
    expect([...files].filter(([, t]) => /from "[^"]*tailwind\//.test(t)).map(([n]) => n)).toEqual([])
    expect([...files.keys()].filter((n) => n.startsWith("runtime/"))).toEqual(["runtime/chart-layer.tsx"])
  }, 120_000)

  it("keeps no Tailwind class: only the components' own hooks stay class names", async () => {
    const { kept } = await generate()
    const own = hooks()
    const left = [...kept].flatMap(([file, names]) => names.filter((n) => !own.has(n)).map((n) => `${file}: ${n}`))
    expect(left).toEqual([])
  }, 120_000)

  it("drops no utility: every class in a literal adds a declaration", async () => {
    const { inert } = await generate()
    expect([...inert].map(([file, names]) => `${file}: ${names.join(" ")}`)).toEqual([])
  }, 120_000)

  // One file through the generator: what it writes, or what it refuses.
  const one = async (body: string, others: Record<string, string> = {}) => {
    const text = `import { cn } from "../tailwind/lib"\n${body}\n`
    const out = solidStylexLayer(new Map(Object.entries({ "One.tsx": text, ...others })), "", await utilities())
    return {
      text: out.files.get("One.tsx") ?? null,
      refused: out.refused.map((r) => `${r.file}:${r.line}: ${r.kind}`),
      opaque: out.opaque.get("One.tsx") ?? [],
    }
  }

  it("carries each way a Solid file writes classes", async () => {
    const own = await one(`export default () => <div class="flex gap-2" />`)
    expect(own.text).toContain("<div {...stylex.props(styles.row)} />")
    expect(own.text).toContain('row: { display: "flex", gap: "0.5rem" }')
    expect(own.text).not.toContain("./lib")

    const template = await one(
      'export default (p: { on: boolean }) => <div class={`flex ${p.on ? "gap-2" : ""} dk-hook`} />',
    )
    expect(template.text).toContain('class={cn([styles.flex, p.on ? styles.gap2 : null, "dk-hook"])}')

    const list = await one(`export default (p: { on: boolean }) => <i class="flex" classList={{ "gap-2": p.on }} />`)
    expect(list.text).toContain("class={cn(styles.i, p.on && styles.gap2)}")

    const joined = await one(
      `export default (props: { class?: string }) => <i class={["flex", props.class].filter(Boolean).join(" ")} />`,
    )
    expect(joined.text).toContain("class={cn([styles.i, props.xstyle, props.class])}")
    expect(joined.text).toContain("class?: string; xstyle?: StyleProp")

    const nested = await one(
      `const S = { a: { x: "w-full", y: "h-full" } } as const\nexport default () => <i class={cn(S.a.x, S["a"]["y"])} />`,
    )
    expect(nested.refused).toEqual([])
    expect(nested.text).toContain("a: { x: styles.sAX, y: styles.sAY }")

    const child = await one(
      `import Two from "./Two"\nimport Three from "./Three"\nexport default (props: { class?: string }) => <><Two class={cn("flex", props.class)} /><Three class="flex" /></>`,
      {
        "Two.tsx": `export default (props: { class?: string }) => <i class={props.class} />`,
        "Three.tsx": `export default (props: { id?: string }) => <i id={props.id} />`,
      },
    )
    expect(child.text).toContain("<Two xstyle={[styles.three, props.xstyle, props.class]} />")
    expect(child.text).toContain("<Three class={cn(styles.three)} />")

    const given = await one(`export default (p: { item: string }) => <i class={cn("flex", p.item)} />`)
    expect(given.refused).toEqual([])
    expect(given.opaque).toEqual(["p.item"])
  }, 120_000)

  it("refuses what it cannot carry, by file and line, and writes no file for it", async () => {
    const cases: [string, string][] = [
      ["export default (p: { n: string }) => <i class={`gap-${p.n}`} />", "template literal"],
      [`export default (p: { n: string }) => <i class={"flex " + p.n} />`, "classes joined with +"],
      [`export default () => <i class={cn({ "flex gap-2": true })} />`, "class object"],
      [`export default () => <i className="flex" />`, "className"],
      [`const k = "flex"\nexport default () => <i classList={{ [k]: true }} />`, "classList"],
      [`export default () => <i class={cn("flex", cn("gap-2"))} />`, "cn() fed into a class list"],
      [`const a = cn("gap-2")\nexport default () => <i class={cn("flex", a)} />`, "cn() fed into a class list"],
      [`export default () => <i data-x={{ c: "flex gap-2" }.c} />`, "classes out of class position"],
      [`import { tone } from "./Two"\nexport default () => <i class={cn(tone)} />`, "class holder out of reach"],
      [`let a\nexport default () => <i class={cn(a)} />`, "class holder out of reach"],
      [`export default (props: { class?: string }) => <i title={props.class} />`, "class prop outside cn()"],
      [`import { X } from "../tailwind/other"\nexport default () => <i class={X} />`, "tailwind import"],
    ]
    for (const [body, kind] of cases) {
      const out = await one(body, { "Two.tsx": `export const tone = "flex"\nexport default () => null` })
      expect({ body, kinds: out.refused.map((r) => r.replace(/^dither-kit\/solid\/One\.tsx:\d+: /, "")) }).toEqual({
        body,
        kinds: expect.arrayContaining([kind]),
      })
      expect(out.refused.every((r) => /^dither-kit\/solid\/One\.tsx:\d+: /.test(r))).toBe(true)
      expect(out.text).toBeNull()
    }
  }, 120_000)
})
