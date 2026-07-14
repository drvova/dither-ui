<script setup lang="ts">
import { ref } from "vue"
import { ExportDialog } from "@/features/export-code"
import { Canvas } from "@/widgets/canvas"
import { Inspector } from "@/widgets/inspector"
import { LayersPanel } from "@/widgets/layers-panel"
import { Toolbar } from "@/widgets/toolbar"

const exportOpen = ref(false)
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-background font-mono text-foreground antialiased">
    <Toolbar @export="exportOpen = true" />

    <div class="flex min-h-0 flex-1">
      <!-- Layers -->
      <aside class="w-56 shrink-0 overflow-y-auto border-r border-border/60 p-2">
        <LayersPanel />
      </aside>

      <!-- Canvas -->
      <div class="min-w-0 flex-1">
        <Canvas />
      </div>

      <!-- Inspector -->
      <aside class="w-64 shrink-0 overflow-y-auto border-l border-border/60 p-4">
        <Inspector />
      </aside>
    </div>

    <ExportDialog :open="exportOpen" @close="exportOpen = false" />
  </div>
</template>
