import { createMutable } from "solid-js/store"
import { createMemo, createSignal, For } from "solid-js"
import { DitherButton, DitherCheckbox, DitherInput, DitherSidebar, DitherSidebarGroup, DitherSlider } from "@dither-kit"

const CAT_COUNTS: Record<string, number> = { Prints: 125, Frames: 89, Zines: 34, Stickers: 67 }

const BRAND_COUNTS: Record<string, number> = { "Bayer & Co": 45, Ordered: 38, Halftone: 29 }

export default function Example() {
  const [filterSearch, setFilterSearch] = createSignal("")
  const cats = createMutable<Record<string, boolean>>({ Prints: true, Frames: false, Zines: false, Stickers: false })
  const brands = createMutable<Record<string, boolean>>({ "Bayer & Co": false, Ordered: true, Halftone: false })
  const [price, setPrice] = createSignal<[number, number]>([50, 500])
  const activeFilters = createMemo(
    () => Object.values(cats).filter(Boolean).length + Object.values(brands).filter(Boolean).length,
  )
  function resetFilters() {
    for (const k in cats) cats[k] = false
    for (const k in brands) brands[k] = false
    setPrice([0, 500])
    setFilterSearch("")
  }

  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar
          class="w-60 border-r border-border/60"
          label="Product filters"
          collapse="none"
          variant="inset"
          header={
            <div class="px-2.5">
              <div class="flex items-center gap-2">
                <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
                <span class="text-[12px] tracking-tight">pixelmart</span>
              </div>
              <div class="mt-0.5 text-[10px] text-muted-foreground">Filter products</div>
              <DitherInput
                class="mt-2.5 w-full text-[11px]"
                modelValue={filterSearch()}
                onUpdateModelValue={setFilterSearch}
                placeholder="Search products…"
              />
            </div>
          }
          footer={
            <div class="grid gap-1.5 border-t border-border/60 px-2 pt-2">
              <DitherButton class="w-full py-1.5 text-[11px]" color="green" variant="gradient">
                Apply filters
              </DitherButton>
              <button
                class="min-h-6 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                type="button"
                onClick={resetFilters}
              >
                Reset all
              </button>
            </div>
          }
        >
          <DitherSidebarGroup label="Categories">
            <For each={Object.keys(CAT_COUNTS)}>
              {(c) => (
                <label class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground">
                  <DitherCheckbox class="text-[11px]" modelValue={cats[c]} onUpdateModelValue={(v) => (cats[c] = v)}>
                    {c}
                  </DitherCheckbox>
                  <span class="ml-auto tabular-nums text-muted-foreground">({CAT_COUNTS[c]})</span>
                </label>
              )}
            </For>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Price">
            <div class="px-2.5 pt-1">
              <DitherSlider
                modelValue={price()}
                onUpdateModelValue={setPrice}
                min={0}
                max={500}
                step={10}
                label="Price range"
                color="green"
              />
              <div class="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>${price()[0]}</span>
                <span>${price()[1]}</span>
              </div>
            </div>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Brands">
            <For each={Object.keys(BRAND_COUNTS)}>
              {(b) => (
                <label class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground">
                  <DitherCheckbox
                    class="text-[11px]"
                    modelValue={brands[b]}
                    onUpdateModelValue={(v) => (brands[b] = v)}
                  >
                    {b}
                  </DitherCheckbox>
                  <span class="ml-auto tabular-nums text-muted-foreground">({BRAND_COUNTS[b]})</span>
                </label>
              )}
            </For>
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center justify-between border-b border-border/60 px-4">
            <span class="text-[12px] text-foreground">Products</span>
            <span class="flex gap-2 rounded border border-border/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              <span>{activeFilters()} filters</span>
              <span>
                ${price()[0]}–${price()[1]}
              </span>
            </span>
          </div>
          <div class="grid grid-cols-3 gap-3 p-4" aria-hidden="true">
            <For each={Array.from({ length: 6 }, (_, k) => k + 1)}>
              {() => (
                <div class="rounded-md border border-border/60 p-2">
                  <div class="aspect-square rounded bg-card/60" />
                  <div class="mt-2 h-2 w-3/4 rounded-sm bg-border/50" />
                  <div class="mt-1 h-2 w-1/3 rounded-sm bg-border/40" />
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
