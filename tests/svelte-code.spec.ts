import { describe, expect, it } from "vitest"
import { toSvelteCode } from "@/pages/docs/svelte"

// Inputs are verbatim Vue docs snippets; expectations mirror the hand-written
// idioms in svelte-site/src/docs (the port author's ground truth).
describe("toSvelteCode", () => {
  it("translates a full SFC snippet: script setup, ref, v-model, kit import", () => {
    const vue = `<script setup lang="ts">
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
    expect(toSvelteCode(vue)).toBe(`<script lang="ts">
  import { DitherSwitch } from "@dither-kit-svelte"

  let bloom = $state(true)
</script>

<label class="flex items-center justify-between gap-4">
  <span class="text-[13px]">Bloom on hover</span>
  <DitherSwitch bind:value={bloom} label="Bloom on hover" color="blue" />
</label>`)
  })

  it("translates fragment snippets: runes, kebab props, generic ref types", () => {
    const vue = `const level = ref(40)
const range = ref<[number, number]>([25, 75])

<!-- range: an array v-model grows a second thumb -->
<DitherSlider v-model="range" label="Price" show-value />`
    expect(toSvelteCode(vue)).toBe(`let level = $state(40)
let range = $state<[number, number]>([25, 75])

<!-- range: an array bind:value grows a second thumb -->
<DitherSlider bind:value={range} label="Price" showValue />`)
  })

  it("maps events to lowercase callback props with closure wrapping", () => {
    const vue = `<DitherButton @click="open = true">Open dialog</DitherButton>
<DitherDialog :open="open" title="Confirm" @close="open = false">
  <template #footer>
    <DitherButton color="green" @click="open = false">Confirm</DitherButton>
  </template>
</DitherDialog>`
    expect(toSvelteCode(vue)).toBe(`<DitherButton onclick={() => (open = true)}>Open dialog</DitherButton>
<DitherDialog open={open} title="Confirm" onclose={() => (open = false)}>
  {#snippet footer()}
    <DitherButton color="green" onclick={() => (open = false)}>Confirm</DitherButton>
  {/snippet}
</DitherDialog>`)
  })

  it("keeps arrow handlers, wraps multi-statement handlers", () => {
    const vue = `<DitherMenu :items="items" @select="(label) => run(label)">
  <button @click="last = a; open = false">go</button>
</DitherMenu>`
    expect(toSvelteCode(vue)).toBe(`<DitherMenu items={items} onselect={(label) => run(label)}>
  <button onclick={() => { last = a; open = false }}>go</button>
</DitherMenu>`)
  })

  it("translates v-model:arg and multi-line component tags", () => {
    const vue = `<DitherDrawer v-model:snap-point="snap" :open="open" side="bottom"
  :snap-points="[0.35, 0.75]" @close="open = false" />`
    expect(toSvelteCode(vue)).toBe(`<DitherDrawer bind:snapPoint={snap} open={open} side="bottom"
  snapPoints={[0.35, 0.75]} onclose={() => (open = false)} />`)
  })

  it("wraps v-for blocks in {#each} and interpolations in braces", () => {
    const vue = `<div v-for="s in stats" class="rounded-lg border p-4">
  <span>{{ s.label }}</span> <b>{{ s.value }}</b>
  <Sparkline :data="s.trend" :color="s.color" class="h-8" />
</div>`
    expect(toSvelteCode(vue)).toBe(`{#each stats as s}
  <div class="rounded-lg border p-4">
    <span>{s.label}</span> <b>{s.value}</b>
    <Sparkline data={s.trend} color={s.color} class="h-8" />
  </div>
{/each}`)
  })

  it("handles indexed and keyed v-for, numeric ranges, inline v-if", () => {
    const releases = `<div v-for="(r, i) in releases" class="flex gap-3">
  <span v-for="tag in r.tags" class="rounded border px-1.5">{{ tag }}</span>
</div>`
    expect(toSvelteCode(releases)).toBe(`{#each releases as r, i}
  <div class="flex gap-3">
    {#each r.tags as tag}<span class="rounded border px-1.5">{tag}</span>{/each}
  </div>
{/each}`)
    const range = `<p v-for="i in 15" :key="i" class="py-1">row {{ i }}</p>`
    expect(toSvelteCode(range)).toBe(
      `{#each Array.from({ length: 15 }, (_, k) => k + 1) as i (i)}<p class="py-1">row {i}</p>{/each}`,
    )
    const gate = `<DitherGradient v-if="tier.popular" from="blue" :opacity="0.12" />`
    expect(toSvelteCode(gate)).toBe(`{#if tier.popular}<DitherGradient from="blue" opacity={0.12} />{/if}`)
  })

  it("converts template v-if/v-else pairs to {#if}{:else}{/if}", () => {
    const vue = `<div class="grid gap-3">
  <template v-if="!sent">
    <input v-model="email" placeholder="you@dither-ui.com" />
    <DitherButton color="green" class="w-full" @click="sent = true">
      Send magic link
    </DitherButton>
  </template>
  <template v-else>
    <button @click="sent = false">use a different email</button>
  </template>
</div>`
    expect(toSvelteCode(vue)).toBe(`<div class="grid gap-3">
  {#if !sent}
    <input bind:value={email} placeholder="you@dither-ui.com" />
    <DitherButton color="green" class="w-full" onclick={() => (sent = true)}>
      Send magic link
    </DitherButton>
  {:else}
    <button onclick={() => (sent = false)}>use a different email</button>
  {/if}
</div>`)
  })

  it("renames plain-named families and splits the toast deep import", () => {
    const vue = `<script setup>
import { DitherToaster, toast } from "@dither-kit"
</script>

<DitherToaster />
<DitherButton color="green" @click="toast('Saved', { color: 'green' })">
  Save
</DitherButton>
<DitherAurora :speed="1.2" render-mode="dither" />`
    expect(toSvelteCode(vue)).toBe(`<script lang="ts">
  import { DitherToaster } from "@dither-kit-svelte"
  import { toast } from "@dither-kit-svelte/runtime/toast.svelte"
</script>

<DitherToaster />
<DitherButton color="green" onclick={() => toast('Saved', { color: 'green' })}>
  Save
</DitherButton>
<Aurora speed={1.2} renderMode="dither" />`)
  })

  it("maps chart parts: data-key camelizes on components, aria stays kebab", () => {
    const vue = `<AreaChart :data="rows" :config="config" :seed="1984">
  <XAxis data-key="month" :max-ticks="6" />
  <Area data-key="revenue" :variant="1984" />
</AreaChart>
<button type="button" :aria-pressed="plan === p" @click="plan = p">{{ p }}</button>
<canvas aria-hidden="true" />`
    expect(toSvelteCode(vue)).toBe(`<AreaChart data={rows} config={config} seed={1984}>
  <XAxis dataKey="month" maxTicks={6} />
  <Area dataKey="revenue" variant={1984} />
</AreaChart>
<button type="button" aria-pressed={plan === p} onclick={() => (plan = p)}>{p}</button>
<canvas aria-hidden="true" />`)
  })

  it("binds sidebar family v-model to its real bindable prop", () => {
    const vue = `<DitherSidebar v-model="collapsed" variant="default" collapse="rail">
  <DitherSidebarSub v-model="subOpen" label="Components">
    <DitherSidebarItem label="Buttons" :active="active === 'Buttons'" @select="active = 'Buttons'" />
  </DitherSidebarSub>
</DitherSidebar>
<DitherPagination v-model:page="page" :total="12" />`
    expect(toSvelteCode(vue)).toBe(`<DitherSidebar bind:collapsed={collapsed} variant="default" collapse="rail">
  <DitherSidebarSub bind:open={subOpen} label="Components">
    <DitherSidebarItem label="Buttons" active={active === 'Buttons'} onselect={() => (active = 'Buttons')} />
  </DitherSidebarSub>
</DitherSidebar>
<DitherPagination bind:page={page} total={12} />`)
  })

  it("handles single-quoted JSON bindings and comments inside open tags", () => {
    const bg = `<DitherAurora :colors='["#0a1a2f","#123f6b"]' flow-direction="up" />`
    expect(toSvelteCode(bg)).toBe(`<Aurora colors={["#0a1a2f","#123f6b"]} flowDirection="up" />`)
    const donut = `<PieChart :data="quotaRows"    <!-- quota donut -->
  data-key="value" :inner-radius="0.62">
  <Pie />
</PieChart>`
    expect(toSvelteCode(donut)).toBe(`<PieChart data={quotaRows}    <!-- quota donut -->
  dataKey="value" innerRadius={0.62}>
  <Pie />
</PieChart>`)
  })

  it("leaves non-Vue content untouched (shell, css, svg)", () => {
    const css = `:root {
  --background: #08090b;
  --accent: #3f8ff3;
}

@media (prefers-reduced-motion: reduce) { }`
    expect(toSvelteCode(css)).toBe(css)
    const svg = `<svg role="img" aria-label="Chart">…</svg>`
    expect(toSvelteCode(svg)).toBe(svg)
  })
})
