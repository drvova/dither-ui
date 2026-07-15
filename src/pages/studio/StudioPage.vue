<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref } from "vue"
import { addArtboard } from "@/entities/editor"
import { startHistory, stopHistory } from "@/features/history"
import { ShortcutsHelp } from "@/features/keyboard"
import { hydrate, startAutosave, stopAutosave } from "@/features/persistence"
import { Canvas } from "@/widgets/canvas"
import { DataEditor } from "@/widgets/data-editor"
import { Inspector } from "@/widgets/inspector"
import { LayerTree } from "@/widgets/layer-tree"
import { Toolbar } from "@/widgets/toolbar"
import { CHART_TYPES, type ChartType } from "@/shared/config"

const ExportDialog = defineAsyncComponent(() =>
  import("@/features/export-code").then((m) => m.ExportDialog)
)
const exportOpen = ref(false)

hydrate()
startAutosave()
startHistory()

// Deep link from the docs: #/studio/new/<type> adds that chart to the
// restored document (after startHistory, so it is undoable) and cleans the
// hash so a refresh does not duplicate it.
const wanted = window.location.hash.match(/^#\/studio\/new\/([a-z]+)/)?.[1]
if (wanted && (CHART_TYPES as readonly string[]).includes(wanted)) {
  addArtboard(wanted as ChartType)
  history.replaceState(null, "", "#/studio")
}

// The studio is a wide-screen, pointer + keyboard tool (layer rail, inspector,
// shortcuts). Below lg we show a hint instead of a cramped, broken layout — and
// skip mounting the heavy canvas widgets entirely.
const isDesktop = ref(window.innerWidth >= 1024)
const onResize = () => (isDesktop.value = window.innerWidth >= 1024)
window.addEventListener("resize", onResize)
onBeforeUnmount(() => {
  stopAutosave()
  stopHistory()
  window.removeEventListener("resize", onResize)
})
</script>

<template>
  <div v-if="isDesktop" class="flex h-screen flex-col overflow-hidden bg-background text-[13px] text-foreground antialiased">
    <Toolbar @export="exportOpen = true" />

    <div class="flex min-h-0 flex-1">
      <!-- Layer tree -->
      <aside class="flex w-60 shrink-0 flex-col border-r border-border/60">
        <div class="flex h-9 items-center px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Layers
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <LayerTree />
        </div>
      </aside>

      <!-- Canvas -->
      <div class="relative min-w-0 flex-1">
        <Canvas />
        <DataEditor />
      </div>

      <!-- Inspector -->
      <aside class="w-72 shrink-0 overflow-y-auto border-l border-border/60">
        <Inspector />
      </aside>
    </div>

    <ExportDialog v-if="exportOpen" :open="exportOpen" @close="exportOpen = false" />
    <ShortcutsHelp />
  </div>

  <!-- Small screens: the editor needs a desktop, so guide instead of breaking. -->
  <div
    v-else
    class="flex h-screen flex-col items-center justify-center gap-5 bg-background px-8 text-center font-mono text-foreground antialiased"
  >
    <div class="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">studio</div>
    <h1 class="text-xl tracking-tight">Best on a desktop</h1>
    <p class="max-w-xs text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
      The studio is a Figma-style editor — layer rail, inspector and keyboard
      shortcuts, built for a wide screen and a pointer. Open it on a laptop or
      desktop to design with the kit.
    </p>
    <div class="mt-2 flex items-center gap-5 text-[12px] text-muted-foreground">
      <a href="#/docs" class="transition-colors hover:text-foreground">browse the docs →</a>
      <a href="#/" class="transition-colors hover:text-foreground">home</a>
    </div>
  </div>
</template>
