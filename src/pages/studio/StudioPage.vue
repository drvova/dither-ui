<script setup lang="ts">
import { ref } from "vue"
import { addArtboard } from "@/entities/editor"
import { ExportDialog } from "@/features/export-code"
import { startHistory } from "@/features/history"
import { ShortcutsHelp } from "@/features/keyboard"
import { hydrate, startAutosave } from "@/features/persistence"
import { Canvas } from "@/widgets/canvas"
import { DataEditor } from "@/widgets/data-editor"
import { Inspector } from "@/widgets/inspector"
import { LayerTree } from "@/widgets/layer-tree"
import { Toolbar } from "@/widgets/toolbar"
import { CHART_TYPES, type ChartType } from "@/shared/config"

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
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-background text-[13px] text-foreground antialiased">
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

    <ExportDialog :open="exportOpen" @close="exportOpen = false" />
    <ShortcutsHelp />
  </div>
</template>
