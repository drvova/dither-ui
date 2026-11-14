// The docs' snippets are written in Solid; here, the same file in each
// styling system (`restyle` for Solid). That every snippet the docs carry
// compiles in all four is `source.spec.tsx`'s.
import { describe, expect, it } from "vitest"
import { restyle, restyleSolid } from "@dither-ui/restyle"

const FILE = `import { createSignal } from "solid-js"
import { DitherButton } from "@dither-kit"

export default function Example() {
  const [on, setOn] = createSignal(true)

  return (
    <div class={\`flex items-center gap-2 \${on() ? 'bg-card' : 'opacity-60'}\`}>
      <span class="text-[13px]" style="color: red">Bloom</span>
      <DitherButton class="w-full dither-kit" onClick={() => setOn(!on())}>Go</DitherButton>
      <b class={on() ? 'underline' : ''}>x</b>
    </div>
  )
}`

const SHEET = `.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.bgCard {
  background-color: var(--card);
}
.opacity60 {
  opacity: 60%;
}
.text {
  font-size: 13px;
  color: red;
}
.button {
  width: 100%;
}
.underline {
  text-decoration-line: underline;
}`

describe("restyle, for Solid", () => {
  it("leaves Tailwind as written", () => {
    expect(restyle(FILE, "tailwind")).toBe(FILE)
    expect(restyleSolid(FILE, "tailwind")).toEqual({ code: FILE, sheet: null })
  })

  it("writes plain CSS as a stylesheet the file imports", () => {
    const out = restyleSolid(FILE, "css", "BloomExample")
    expect(out.code).toBe(`import { createSignal } from "solid-js"
import { DitherButton } from "@dither-kit"
import "./BloomExample.css"

export default function Example() {
  const [on, setOn] = createSignal(true)

  return (
    <div class={\`row \${on() ? 'bgCard' : 'opacity60'}\`}>
      <span class="text">Bloom</span>
      <DitherButton class="button dither-kit" onClick={() => setOn(!on())}>Go</DitherButton>
      <b class={on() ? 'underline' : ''}>x</b>
    </div>
  )
}`)
    expect(out.sheet).toEqual({ file: "BloomExample.css", text: SHEET })
  })

  it("writes CSS Modules as a module read as styles.x", () => {
    const out = restyleSolid(FILE, "modules", "BloomExample")
    expect(out.code).toBe(`import { createSignal } from "solid-js"
import { DitherButton } from "@dither-kit"
import styles from "./BloomExample.module.css"

export default function Example() {
  const [on, setOn] = createSignal(true)

  return (
    <div class={\`\${styles.row} \${on() ? styles.bgCard : styles.opacity60}\`}>
      <span class={styles.text}>Bloom</span>
      <DitherButton class={\`\${styles.button} dither-kit\`} onClick={() => setOn(!on())}>Go</DitherButton>
      <b class={on() ? styles.underline : ''}>x</b>
    </div>
  )
}`)
    expect(out.sheet).toEqual({ file: "BloomExample.module.css", text: SHEET })
  })

  it("writes StyleX in the file: props on an element, the class they give on a component", () => {
    const out = restyleSolid(FILE, "stylex", "BloomExample")
    expect(out.sheet).toBeNull()
    expect(out.code).toBe(`import { createSignal } from "solid-js"
import { DitherButton } from "@dither-kit"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  bgCard: { backgroundColor: "var(--card)" },
  opacity60: { opacity: "60%" },
  text: { fontSize: "13px", color: "red" },
  button: { width: "100%" },
  underline: { textDecorationLine: "underline" },
})

export default function Example() {
  const [on, setOn] = createSignal(true)

  return (
    <div {...stylex.props(styles.row, on() ? styles.bgCard : styles.opacity60)}>
      <span {...stylex.props(styles.text)}>Bloom</span>
      <DitherButton class={\`\${stylex.props(styles.button).className} dither-kit\`} onClick={() => setOn(!on())}>Go</DitherButton>
      <b {...stylex.props(on() ? styles.underline : null)}>x</b>
    </div>
  )
}`)
  })

  it("shows a file and its stylesheet as one text, and a fragment the same way", () => {
    const whole = restyleSolid(FILE, "css")
    expect(restyle(FILE, "css")).toBe(`${whole.code}

/* styles.css */
${SHEET}`)
    expect(restyle(`<div class="flex gap-2"><span class="text-[13px]">a</span></div>`, "css"))
      .toBe(`import "./styles.css"

<div class="row"><span class="text">a</span></div>

/* styles.css */
.row {
  display: flex;
  gap: 0.5rem;
}
.text {
  font-size: 13px;
}`)
  })

  it("rewrites a tag inside another's attribute, and keeps a class the map does not know", () => {
    const nested = `<DitherSidebar class="w-64" header={<div class="flex gap-2">x</div>}>
  <p class="cta">y</p>
</DitherSidebar>`
    expect(restyle(nested, "stylex")).toBe(`import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  sidebar: { width: "16rem" },
  row: { display: "flex", gap: "0.5rem" },
})

<DitherSidebar class={stylex.props(styles.sidebar).className} header={<div {...stylex.props(styles.row)}>x</div>}>
  <p class="cta">y</p>
</DitherSidebar>`)
    // nothing the map knows: the code comes back as it was
    expect(restyle(`<p class="cta">y</p>`, "css")).toBe(`<p class="cta">y</p>`)
    // a type argument or a comparison is not a tag
    const typed = `const [n, setN] = createSignal<number>(0)
const small = n() < 3 && n() > 1
<p class="flex">x</p>`
    expect(restyle(typed, "modules")).toContain(`createSignal<number>(0)
const small = n() < 3 && n() > 1
<p class={styles.p}>x</p>`)
  })
})
