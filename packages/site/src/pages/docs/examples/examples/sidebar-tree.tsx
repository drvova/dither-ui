import { createMutable } from "solid-js/store"
import { createSignal, For } from "solid-js"
import { DitherSidebar, DitherSidebarItem, DitherSidebarSub } from "@dither-kit"

export default function Example() {
  const treeOpen = createMutable<Record<string, boolean>>({
    src: true,
    components: true,
    charts: false,
    lib: false,
    public: false,
  })
  const [treeActive, setTreeActive] = createSignal("DitherSidebar.tsx")
  const treeAll = (open: boolean) => Object.keys(treeOpen).forEach((k) => (treeOpen[k] = open))

  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar
          class="w-60 border-r border-border/60"
          label="File explorer"
          collapse="none"
          density="compact"
          variant="inset"
          header={
            <div class="flex h-8 items-center justify-between px-2.5">
              <span class="text-[11px] text-muted-foreground">Explorer</span>
              <span class="flex gap-1">
                <button
                  class="grid size-5 place-items-center rounded text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label="Expand all folders"
                  onClick={() => treeAll(true)}
                >
                  +
                </button>
                <button
                  class="grid size-5 place-items-center rounded text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label="Collapse all folders"
                  onClick={() => treeAll(false)}
                >
                  −
                </button>
              </span>
            </div>
          }
        >
          <DitherSidebarSub modelValue={treeOpen.src} onUpdateModelValue={(v) => (treeOpen.src = v)} label="src">
            <DitherSidebarSub
              modelValue={treeOpen.components}
              onUpdateModelValue={(v) => (treeOpen.components = v)}
              label="components"
            >
              <DitherSidebarItem
                label="DitherSidebar.tsx"
                active={treeActive() === "DitherSidebar.tsx"}
                onSelect={() => setTreeActive("DitherSidebar.tsx")}
              />
              <DitherSidebarItem
                label="DitherButton.tsx"
                active={treeActive() === "DitherButton.tsx"}
                onSelect={() => setTreeActive("DitherButton.tsx")}
              />
              <DitherSidebarItem
                label="DitherInput.tsx"
                active={treeActive() === "DitherInput.tsx"}
                onSelect={() => setTreeActive("DitherInput.tsx")}
              />
            </DitherSidebarSub>
            <DitherSidebarSub
              modelValue={treeOpen.charts}
              onUpdateModelValue={(v) => (treeOpen.charts = v)}
              label="charts"
            >
              <DitherSidebarItem
                label="AreaChart.tsx"
                active={treeActive() === "AreaChart.tsx"}
                onSelect={() => setTreeActive("AreaChart.tsx")}
              />
              <DitherSidebarItem
                label="Sparkline.tsx"
                active={treeActive() === "Sparkline.tsx"}
                onSelect={() => setTreeActive("Sparkline.tsx")}
              />
            </DitherSidebarSub>
            <DitherSidebarSub modelValue={treeOpen.lib} onUpdateModelValue={(v) => (treeOpen.lib = v)} label="lib">
              <DitherSidebarItem
                label="palette.ts"
                active={treeActive() === "palette.ts"}
                onSelect={() => setTreeActive("palette.ts")}
              />
              <DitherSidebarItem
                label="pixel.ts"
                active={treeActive() === "pixel.ts"}
                onSelect={() => setTreeActive("pixel.ts")}
              />
            </DitherSidebarSub>
            <DitherSidebarItem
              label="index.ts"
              active={treeActive() === "index.ts"}
              onSelect={() => setTreeActive("index.ts")}
            />
          </DitherSidebarSub>
          <DitherSidebarSub
            modelValue={treeOpen.public}
            onUpdateModelValue={(v) => (treeOpen.public = v)}
            label="public"
          >
            <DitherSidebarItem
              label="faces.webp"
              active={treeActive() === "faces.webp"}
              onSelect={() => setTreeActive("faces.webp")}
            />
            <DitherSidebarItem
              label="sprites.webp"
              active={treeActive() === "sprites.webp"}
              onSelect={() => setTreeActive("sprites.webp")}
            />
          </DitherSidebarSub>
        </DitherSidebar>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-9 items-center border-b border-border/60 px-3 text-[11px] text-muted-foreground">
            <span class="text-foreground">{treeActive()}</span>
          </div>
          <div class="grid flex-1 gap-1.5 p-4" aria-hidden="true">
            <For each={[66.67, 91.67, 75, 83.33, 50, 80, 66.67, 33.33]}>
              {(w) => <div class="h-2 rounded-sm bg-border/40" style={{ width: `${w}%` }} />}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
