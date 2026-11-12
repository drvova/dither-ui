// The docs' snippets as Solid: the Vue → Solid translation (`toSolidCode`,
// held to every case the Vue site holds its Svelte translation to, and one
// per construct the snippets use), the same file in each styling system
// (`restyle` for Solid), and a sweep: every snippet the docs carry, as the
// file the source panel shows, parses as TSX in all four systems.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { restyle, restyleSolid, STYLINGS } from "@/shared/lib/restyle-rewrite"
import { asSfc, snippetKind } from "@/widgets/source/model/files"
import { toSolidCode } from "../../src/pages/docs/solid"

// Inputs are verbatim Vue docs snippets: the cases of the Vue site's
// `tests/svelte-code.spec.ts`, one for one, in its order.
describe("toSolidCode", () => {
  it("translates a full SFC snippet: script setup, ref, v-model, kit import", () => {
    expect(
      toSolidCode(`<script setup lang="ts">
import { ref } from "vue"
import { DitherSwitch } from "@dither-kit"

const bloom = ref(true)
</script>

<template>
  <label class="flex items-center justify-between gap-4">
    <span class="text-[13px]">Bloom on hover</span>
    <DitherSwitch v-model="bloom" label="Bloom on hover" color="blue" />
  </label>
</template>`),
    ).toBe(`import { createSignal } from "solid-js"
import { DitherSwitch } from "@dither-kit"

export default function Example() {
  const [bloom, setBloom] = createSignal(true)

  return (
    <label class="flex items-center justify-between gap-4">
      <span class="text-[13px]">Bloom on hover</span>
      <DitherSwitch modelValue={bloom()} onUpdateModelValue={setBloom} label="Bloom on hover" color="blue" />
    </label>
  )
}`)
  })

  it("translates fragment snippets: signals, kebab props, generic ref types", () => {
    expect(
      toSolidCode(`const level = ref(40)
const range = ref<[number, number]>([25, 75])

<!-- range: an array v-model grows a second thumb -->
<DitherSlider v-model="range" label="Price" show-value />`),
    ).toBe(`const [level, setLevel] = createSignal(40)
const [range, setRange] = createSignal<[number, number]>([25, 75])

{/* range: an array modelValue grows a second thumb */}
<DitherSlider modelValue={range()} onUpdateModelValue={setRange} label="Price" showValue />`)
  })

  it("maps events to callback props, state to its setter, a named slot to a prop", () => {
    expect(
      toSolidCode(`<DitherButton @click="open = true">Open dialog</DitherButton>
<DitherDialog :open="open" title="Confirm" @close="open = false">
  <template #footer>
    <DitherButton color="green" @click="open = false">Confirm</DitherButton>
  </template>
</DitherDialog>`),
    ).toBe(`<DitherButton onClick={() => setOpen(true)}>Open dialog</DitherButton>
<DitherDialog open={open()} title="Confirm" onClose={() => setOpen(false)}
  footer={
    <DitherButton color="green" onClick={() => setOpen(false)}>Confirm</DitherButton>
  }
/>`)
  })

  it("keeps arrow handlers, wraps multi-statement handlers", () => {
    expect(
      toSolidCode(`<DitherMenu :items="items" @select="(label) => run(label)">
  <button @click="last = a; open = false">go</button>
</DitherMenu>`),
    ).toBe(`<DitherMenu items={items} onSelect={(label) => run(label)}>
  <button onClick={() => { setLast(a); setOpen(false) }}>go</button>
</DitherMenu>`)
  })

  it("translates v-model:arg and multi-line component tags", () => {
    expect(
      toSolidCode(`<DitherDrawer v-model:snap-point="snap" :open="open" side="bottom"
  :snap-points="[0.35, 0.75]" @close="open = false" />`),
    ).toBe(`<DitherDrawer snapPoint={snap()} onUpdateSnapPoint={setSnap} open={open()} side="bottom"
  snapPoints={[0.35, 0.75]} onClose={() => setOpen(false)} />`)
  })

  it("wraps v-for blocks in <For> and interpolations in braces", () => {
    expect(
      toSolidCode(`<div v-for="s in stats" class="rounded-lg border p-4">
  <span>{{ s.label }}</span> <b>{{ s.value }}</b>
  <Sparkline :data="s.trend" :color="s.color" class="h-8" />
</div>`),
    ).toBe(`<For each={stats}>
  {(s) => (
    <div class="rounded-lg border p-4">
      <span>{s.label}</span> <b>{s.value}</b>
      <Sparkline data={s.trend} color={s.color} class="h-8" />
    </div>
  )}
</For>`)
  })

  it("handles indexed and keyed v-for, numeric ranges, inline v-if", () => {
    expect(
      toSolidCode(`<div v-for="(r, i) in releases" class="flex gap-3">
  <span v-for="tag in r.tags" class="rounded border px-1.5">{{ tag }}</span>
</div>`),
    ).toBe(`<For each={releases}>
  {(r, i) => (
    <div class="flex gap-3">
      <For each={r.tags}>{(tag) => <span class="rounded border px-1.5">{tag}</span>}</For>
    </div>
  )}
</For>`)
    expect(toSolidCode(`<p v-for="i in 15" :key="i" class="py-1">row {{ i }}</p>`)).toBe(
      `<For each={Array.from({ length: 15 }, (_, k) => k + 1)}>{(i) => <p class="py-1">row {i}</p>}</For>`,
    )
    expect(toSolidCode(`<DitherGradient v-if="tier.popular" from="blue" :opacity="0.12" />`)).toBe(
      `<Show when={tier.popular}><DitherGradient from="blue" opacity={0.12} /></Show>`,
    )
  })

  it("converts template v-if/v-else pairs to <Show> with a fallback", () => {
    expect(
      toSolidCode(`<div class="grid gap-3">
  <template v-if="!sent">
    <input v-model="email" placeholder="you@dither-ui.com" />
    <DitherButton color="green" class="w-full" @click="sent = true">
      Send magic link
    </DitherButton>
  </template>
  <template v-else>
    <button @click="sent = false">use a different email</button>
  </template>
</div>`),
    ).toBe(`<div class="grid gap-3">
  <Show
    when={!sent()}
    fallback={
      <button onClick={() => setSent(false)}>use a different email</button>
    }
  >
    <input value={email()} onInput={(e) => setEmail(e.currentTarget.value)} placeholder="you@dither-ui.com" />
    <DitherButton color="green" class="w-full" onClick={() => setSent(true)}>
      Send magic link
    </DitherButton>
  </Show>
</div>`)
  })

  it("keeps the kit's names and its toast import (the Solid kit exports the Vue kit's)", () => {
    expect(
      toSolidCode(`<script setup>
import { DitherToaster, toast } from "@dither-kit"
</script>

<DitherToaster />
<DitherButton color="green" @click="toast('Saved', { color: 'green' })">
  Save
</DitherButton>
<DitherAurora :speed="1.2" render-mode="dither" />`),
    ).toBe(`import { DitherToaster, toast } from "@dither-kit"

export default function Example() {
  return (
    <>
      <DitherToaster />
      <DitherButton color="green" onClick={() => toast('Saved', { color: 'green' })}>
        Save
      </DitherButton>
      <DitherAurora speed={1.2} renderMode="dither" />
    </>
  )
}`)
  })

  it("maps chart parts: data-key camelizes on components, aria stays kebab", () => {
    expect(
      toSolidCode(`<AreaChart :data="rows" :config="config" :seed="1984">
  <XAxis data-key="month" :max-ticks="6" />
  <Area data-key="revenue" :variant="1984" />
</AreaChart>
<button type="button" :aria-pressed="plan === p" @click="plan = p">{{ p }}</button>
<canvas aria-hidden="true" />`),
    ).toBe(`<AreaChart data={rows} config={config} seed={1984}>
  <XAxis dataKey="month" maxTicks={6} />
  <Area dataKey="revenue" variant={1984} />
</AreaChart>
<button type="button" aria-pressed={plan() === p} onClick={() => setPlan(p)}>{p}</button>
<canvas aria-hidden="true" />`)
  })

  it("binds the sidebar family's v-model as every other (the Solid kit has no exceptions)", () => {
    expect(
      toSolidCode(`<DitherSidebar v-model="collapsed" variant="default" collapse="rail">
  <DitherSidebarSub v-model="subOpen" label="Components">
    <DitherSidebarItem label="Buttons" :active="active === 'Buttons'" @select="active = 'Buttons'" />
  </DitherSidebarSub>
</DitherSidebar>
<DitherPagination v-model:page="page" :total="12" />`),
    ).toBe(`<DitherSidebar modelValue={collapsed()} onUpdateModelValue={setCollapsed} variant="default" collapse="rail">
  <DitherSidebarSub modelValue={subOpen()} onUpdateModelValue={setSubOpen} label="Components">
    <DitherSidebarItem label="Buttons" active={active() === 'Buttons'} onSelect={() => setActive('Buttons')} />
  </DitherSidebarSub>
</DitherSidebar>
<DitherPagination page={page()} onUpdatePage={setPage} total={12} />`)
  })

  it("handles single-quoted JSON bindings and comments inside open tags", () => {
    expect(toSolidCode(`<DitherAurora :colors='["#0a1a2f","#123f6b"]' flow-direction="up" />`)).toBe(
      `<DitherAurora colors={["#0a1a2f","#123f6b"]} flowDirection="up" />`,
    )
    expect(
      toSolidCode(`<PieChart :data="quotaRows"    <!-- quota donut -->
  data-key="value" :inner-radius="0.62">
  <Pie />
</PieChart>`),
    ).toBe(`<PieChart data={quotaRows}    /* quota donut */
  dataKey="value" innerRadius={0.62}>
  <Pie />
</PieChart>`)
  })

  it("leaves non-component content untouched (shell, css, svg)", () => {
    expect(
      toSolidCode(`:root {
  --background: #08090b;
  --accent: #3f8ff3;
}

@media (prefers-reduced-motion: reduce) { }`),
    ).toBe(`:root {
  --background: #08090b;
  --accent: #3f8ff3;
}

@media (prefers-reduced-motion: reduce) { }`)
    expect(toSolidCode(`<svg role="img" aria-label="Chart">…</svg>`)).toBe(`<svg role="img" aria-label="Chart">…</svg>`)
  })

  it("translates scoped default slots into children as a function of the scope", () => {
    expect(
      toSolidCode(`<DitherContainer v-slot="{ width, size }" :step="8" name="card">
  <span>{{ size }} · {{ width }}px</span>
</DitherContainer>`),
    ).toBe(`<DitherContainer step={8} name="card">
  {(scope) => (
    <span>{scope.size} · {scope.width}px</span>
  )}
</DitherContainer>`)
    expect(
      toSolidCode(`<DitherList v-slot="ctx">
  <i>{{ ctx.size }}</i>
</DitherList>`),
    ).toBe(`<DitherList>
  {(ctx) => (
    <i>{ctx.size}</i>
  )}
</DitherList>`)
  })
})

describe("toSolidCode, construct by construct", () => {
  it("binds :prop, keeps static props, camelizes a component's, drops a stray :key", () => {
    expect(toSolidCode(`<DitherBadge :count="n + 1" tone="quiet" show-zero :key="id" :aria-label="name" />`)).toBe(
      `<DitherBadge count={n + 1} tone="quiet" showZero aria-label={name} />`,
    )
  })

  it("keeps class, and writes :class as one class with it", () => {
    expect(
      toSolidCode(`<div v-for="m in messages" :class="m.from === 'me' ? 'justify-end' : 'justify-start'" class="flex">
  <span :class="t.done && 'line-through opacity-60'">{{ t.label }}</span>
  <i :class="{ 'font-bold': on, italic: off }" class="px-2" />
  <b :class="['px-2', on ? 'a' : 'b']">x</b>
</div>`),
    ).toBe(`<For each={messages}>
  {(m) => (
    <div class={\`flex \${m.from === 'me' ? 'justify-end' : 'justify-start'}\`}>
      <span class={t.done ? 'line-through opacity-60' : ''}>{t.label}</span>
      <i class={\`px-2 \${on ? 'font-bold' : ''} \${off ? 'italic' : ''}\`} />
      <b class={\`px-2 \${on ? 'a' : 'b'}\`}>x</b>
    </div>
  )}
</For>`)
  })

  it("writes :style as an object under CSS property names", () => {
    expect(
      toSolidCode(`<span class="size-1.5" :style="{ backgroundColor: cssColor(s.ok ? 'green' : 'red'), fontSize: '12px' }" />
<span style="color: red" :style="{ opacity: on ? 1 : 0.5 }" />`),
    )
      .toBe(`<span class="size-1.5" style={{ "background-color": cssColor(s.ok ? 'green' : 'red'), "font-size": '12px' }} />
<span style={{ "color": "red", opacity: on ? 1 : 0.5 }} />`)
  })

  it("writes v-model as a value and the callback that takes the next one", () => {
    expect(
      toSolidCode(`<DitherInput v-model="email" />
<DitherTabs v-model:value="tab" />
<DitherCheckbox v-model="t.done" />
<input v-model="email" type="email">
<input v-model.number="age">
<input v-model="agree" type="checkbox">
<select v-model="plan"><option>a</option></select>`),
    ).toBe(`<DitherInput modelValue={email()} onUpdateModelValue={setEmail} />
<DitherTabs value={tab()} onUpdateValue={setTab} />
<DitherCheckbox modelValue={t.done} onUpdateModelValue={(v) => (t.done = v)} />
<input value={email()} onInput={(e) => setEmail(e.currentTarget.value)} type="email" />
<input value={age()} onInput={(e) => setAge(Number(e.currentTarget.value))} />
<input checked={agree()} onChange={(e) => setAgree(e.currentTarget.checked)} type="checkbox" />
<select value={plan()} onChange={(e) => setPlan(e.currentTarget.value)}><option>a</option></select>`)
  })

  it("writes @event modifiers as code in the handler", () => {
    expect(
      toSolidCode(`<form @submit.prevent="send">
  <input @keydown.esc="dialog = false" @keyup.enter.stop="go($event)" @click.once="count++" />
  <DitherTabs @update:model-value="pick" @value-change="n += 1" />
</form>`),
    ).toBe(`<form onSubmit={(e) => { e.preventDefault(); send(e) }}>
  <input onKeyDown={(e) => { if (e.key !== "Escape") return; setDialog(false) }} onKeyUp={(e) => { if (e.key !== "Enter") return; e.stopPropagation(); go(e) }} on:click={{ handleEvent: () => setCount(count() + 1), once: true }} />
  <DitherTabs onUpdateModelValue={pick} onValueChange={() => setN(n() + 1)} />
</form>`)
  })

  it("writes {{ }} as an expression, and what JSX reads as syntax as text", () => {
    expect(toSolidCode(`<p>{{ a }} + {{ b.c }} = {{ sum(a, b.c) }}; a > b {ok}</p>`)).toBe(
      `<p>{a} + {b.c} = {sum(a, b.c)}; a {">"} b {"{"}ok{"}"}</p>`,
    )
  })

  it("keys a list by its index as <Index>, any other as <For>", () => {
    expect(
      toSolidCode(`<li v-for="(r, i) in rows" :key="i">{{ i }}. {{ r.name }}</li>
<li v-for="(r, i) in rows" :key="r.id">{{ i }}. {{ r.name }}</li>`),
    ).toBe(`<Index each={rows}>{(r, i) => <li>{i}. {r().name}</li>}</Index>
<For each={rows}>{(r, i) => <li>{i()}. {r.name}</li>}</For>`)
  })

  it("writes a v-if chain as <Switch>, a pair as <Show> with a fallback", () => {
    expect(
      toSolidCode(`<p v-if="state === 'idle'">Idle</p>
<p v-else-if="state === 'busy'" class="pulse">Busy</p>
<p v-else>Done</p>`),
    ).toBe(`<Switch fallback={<p>Done</p>}>
  <Match when={state === 'idle'}><p>Idle</p></Match>
  <Match when={state === 'busy'}><p class="pulse">Busy</p></Match>
</Switch>`)
    expect(
      toSolidCode(`<p v-if="ok">Saved</p>  <!-- quiet -->
<p v-else>Failed</p>`),
    ).toBe(`<Show when={ok} fallback={<p>Failed</p>}><p>Saved</p></Show>  {/* quiet */}`)
  })

  it("writes v-if and v-for on a <template> around its content", () => {
    expect(
      toSolidCode(`<template v-for="(row, i) in rows" :key="row.id">
  <dt>{{ i }}. {{ row.name }}</dt>
  <dd>{{ row.value }}</dd>
</template>`),
    ).toBe(`<For each={rows}>
  {(row, i) => (
    <>
      <dt>{i()}. {row.name}</dt>
      <dd>{row.value}</dd>
    </>
  )}
</For>`)
    expect(
      toSolidCode(`<template v-if="ready">
  <b>a</b>
  <i>b</i>
</template>`),
    ).toBe(`<Show when={ready}>
  <b>a</b>
  <i>b</i>
</Show>`)
  })

  it("writes a named slot as a prop, a scoped one as a function of its scope", () => {
    expect(
      toSolidCode(`<DitherTable :rows="rows">
  <template #header>Team</template>
  <template #cell="{ row, column }">
    <b>{{ row[column] }}</b>
  </template>
  <p>caption</p>
</DitherTable>`),
    ).toBe(`<DitherTable rows={rows}
  header="Team"
  cell={(scope) => (
    <b>{scope.row[scope.column]}</b>
  )}
>
  <p>caption</p>
</DitherTable>`)
    expect(
      toSolidCode(`<DitherClipboard value="npm i">
  <template #default="{ copied }">
    <button type="button">{{ copied ? "copied" : "copy" }}</button>
  </template>
</DitherClipboard>`),
    ).toBe(`<DitherClipboard value="npm i">
  {(scope) => (
    <button type="button">{scope.copied ? "copied" : "copy"}</button>
  )}
</DitherClipboard>`)
  })

  it("writes ref, computed, reactive, the lifecycle and nextTick as Solid's, in a module", () => {
    expect(
      toSolidCode(`<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { DitherInput } from "@dither-kit"

const name = ref("")
const count = ref(0)
const el = ref<HTMLElement | null>(null)
const double = computed(() => count.value * 2)
const form = reactive({ email: "", agree: false })
let timer = 0

function bump() {
  count.value++
  count.value += double.value
  form.email = name.value.trim()
  nextTick(() => el.value?.focus())
}
watch(count, (n) => console.log(n))
onMounted(() => {
  timer = window.setInterval(bump, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div ref="el" class="grid gap-2">
    <DitherInput v-model="name" />
    <input v-model="form.email" type="email">
    <p v-show="count > 0">{{ count }} × 2 = {{ double }}</p>
    <button @click="count = 0">reset</button>
  </div>
</template>`),
    ).toBe(`import { createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { DitherInput } from "@dither-kit"

export default function Example() {
  const [name, setName] = createSignal("")
  const [count, setCount] = createSignal(0)
  const [el, setEl] = createSignal<HTMLElement | null>(null)
  const double = createMemo(() => count() * 2)
  const [form, setForm] = createStore({ email: "", agree: false })
  let timer = 0

  function bump() {
    setCount(count() + 1)
    setCount(count() + double())
    setForm("email", name().trim())
    queueMicrotask(() => el()?.focus())
  }
  createEffect(on(count, (n) => console.log(n), { defer: true }))
  onMount(() => {
    timer = window.setInterval(bump, 1000)
  })
  onCleanup(() => clearInterval(timer))

  return (
    <div ref={setEl} class="grid gap-2">
      <DitherInput modelValue={name()} onUpdateModelValue={setName} />
      <input value={form.email} onInput={(e) => setForm("email", e.currentTarget.value)} type="email" />
      <p style={{ display: count() > 0 ? undefined : "none" }}>{count()} × 2 = {double()}</p>
      <button onClick={() => setCount(0)}>reset</button>
    </div>
  )
}`)
  })

  it("reads a file whose script stands under its markup", () => {
    expect(
      toSolidCode(`<DitherBracket :rounds="rounds" interactive @pick="pick" />

<script setup>
function pick(r, m, side) {
  rounds[r][m].winner = side
}
</script>`),
    ).toBe(`export default function Example() {
  function pick(r, m, side) {
    rounds[r][m].winner = side
  }

  return (
    <DitherBracket rounds={rounds} interactive onPick={pick} />
  )
}`)
  })

  it("closes void elements, and writes <component :is> and v-bind", () => {
    expect(
      toSolidCode(`<component :is="tag" v-bind="rest">x</component>
<img src="/a.png" alt="">
<br>`),
    ).toBe(`<Dynamic component={tag} {...rest}>x</Dynamic>
<img src="/a.png" alt="" />
<br />`)
  })
})

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
    expect(restyle(FILE, "tailwind", "solid")).toBe(FILE)
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
    expect(restyle(FILE, "css", "solid")).toBe(`${whole.code}

/* styles.css */
${SHEET}`)
    expect(restyle(`<div class="flex gap-2"><span class="text-[13px]">a</span></div>`, "css", "solid"))
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
    expect(restyle(nested, "stylex", "solid")).toBe(`import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  sidebar: { width: "16rem" },
  row: { display: "flex", gap: "0.5rem" },
})

<DitherSidebar class={stylex.props(styles.sidebar).className} header={<div {...stylex.props(styles.row)}>x</div>}>
  <p class="cta">y</p>
</DitherSidebar>`)
    // nothing the map knows: the code comes back as it was
    expect(restyle(`<p class="cta">y</p>`, "css", "solid")).toBe(`<p class="cta">y</p>`)
    // a type argument or a comparison is not a tag
    const typed = `const [n, setN] = createSignal<number>(0)
const small = n() < 3 && n() > 1
<p class="flex">x</p>`
    expect(restyle(typed, "modules", "solid")).toContain(`createSignal<number>(0)
const small = n() < 3 && n() > 1
<p class={styles.p}>x</p>`)
  })
})

/* ------------------------------ the sweep --------------------------------- */

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : /\.(vue|ts)$/.test(n) ? [p] : []
  })
}

const DOCS = join(process.cwd(), "../src/pages/docs")
const KIT = new Set(
  [...readFileSync(join(process.cwd(), "../dither-kit/solid/index.ts"), "utf8").matchAll(/([A-Za-z]\w*)\s*[,}]/g)].map(
    (m) => m[1],
  ),
)

/** The syntax errors TypeScript finds in a TSX file. */
function problems(tsx: string): string[] {
  const out = ts.transpileModule(tsx, {
    fileName: "Example.tsx",
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  })
  return (out.diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "))
}

describe("every docs snippet, as Solid", () => {
  // The literals of `src/pages/docs` that hold markup, read the way
  // `tests/stylex-coverage.spec.ts` reads them (a `${…}` hole stands as a
  // name). A sketch's ellipsis stands for code the reader fills in, so it is
  // read as a name too; what then remains is held to parsing.
  const snippets: { file: string; code: string }[] = []
  const cut: { file: string; code: string }[] = []
  for (const file of files(DOCS))
    for (const m of readFileSync(file, "utf8").matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
      if (!/<[A-Za-z]/.test(m[1])) continue
      const code = m[1]
        .replace(/\$\{[^}]*\}/g, "x")
        .replace(/\\([\s\S])/g, (_, c: string) => (c === "n" ? "\n" : c))
        .replace(/…/g, "etc")
      const kind = snippetKind(code)
      if (kind !== "sfc" && kind !== "fragment") continue
      // A literal that stops inside a tag is a piece of one (the head of a
      // snippet built from a nested template literal, a tag quoted in a
      // comment), not a snippet.
      const bare = code.replace(/<!--[\s\S]*?-->/g, "")
      ;(bare.indexOf(">", bare.lastIndexOf("<")) < 0 ? cut : snippets).push({ file: file.slice(DOCS.length + 1), code })
    }

  it("finds the docs' snippets, and only pieces of literals are left out", () => {
    expect(snippets.length).toBeGreaterThan(280)
    expect(cut.map((c) => c.file).sort()).toEqual(["DocsPage.vue", "animations/AnimationsDocs.vue", "svelte-code.ts"])
  })

  it("translates each into TSX that parses, in every styling system", () => {
    const bad: string[] = []
    for (const { file, code } of snippets) {
      // the file the source panel shows: the fragment completed, then translated
      const tsx = toSolidCode(asSfc(code, KIT))
      for (const system of STYLINGS) {
        const found = problems(restyleSolid(tsx, system).code)
        if (found.length)
          bad.push(`${file} (${system}): ${found[0]}
${tsx}`)
      }
    }
    expect(bad).toEqual([])
  })
})
