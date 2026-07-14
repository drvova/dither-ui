<script setup lang="ts">
import { ref } from "vue"
import { ExportDialog } from "@/features/export-code"
import { Canvas } from "@/widgets/canvas"
import { Inspector } from "@/widgets/inspector"
import { LayerTree } from "@/widgets/layer-tree"
import { Toolbar } from "@/widgets/toolbar"

const exportOpen = ref(false)
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
      <div class="min-w-0 flex-1">
        <Canvas />
      </div>

      <!-- Inspector -->
      <aside class="w-72 shrink-0 overflow-y-auto border-l border-border/60">
        <Inspector />
      </aside>
    </div>

    <ExportDialog :open="exportOpen" @close="exportOpen = false" />
  </div>
</template>
