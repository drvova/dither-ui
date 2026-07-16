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
import { routePath } from "@/shared/lib"

const ExportDialog = defineAsyncComponent(() =>
  import("@/features/export-code").then((m) => m.ExportDialog)
)
const exportOpen = ref(false)
const layersOpen = ref(true)
const inspectorOpen = ref(true)

hydrate()
startAutosave()
startHistory()

// Deep links from docs support canonical /studio#new/<type> and legacy
// #/studio/new/<type>; both add once after history starts, then clean the URL.
const wanted = location.hash.match(/^(?:#new\/|#\/studio\/new\/)([a-z]+)/)?.[1]
if (wanted && (CHART_TYPES as readonly string[]).includes(wanted)) {
  addArtboard(wanted as ChartType)
  history.replaceState(null, "", routePath("/studio"))
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
  <div v-if="isDesktop" class="relative h-screen overflow-hidden bg-background text-[13px] text-foreground antialiased">
    <Canvas />
    <Toolbar
      v-model:layers-open="layersOpen"
      v-model:inspector-open="inspectorOpen"
      @export="exportOpen = true"
    />

    <Transition name="panel-left">
      <aside v-if="layersOpen" class="studio-panel absolute bottom-16 left-3 top-16 z-20 w-64">
        <div class="panel-head"><span>Layers</span><button type="button" aria-label="Close layers" @click="layersOpen = false">×</button></div>
        <div class="min-h-0 flex-1 overflow-y-auto p-2"><LayerTree /></div>
      </aside>
    </Transition>

    <Transition name="panel-right">
      <aside v-if="inspectorOpen" class="studio-panel absolute bottom-16 right-3 top-16 z-20 w-72 overflow-hidden">
        <Inspector />
      </aside>
    </Transition>

    <DataEditor />
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
      <a :href="routePath('/docs')" class="transition-colors hover:text-foreground">browse the docs →</a>
      <a :href="routePath('/')" class="transition-colors hover:text-foreground">home</a>
    </div>
  </div>
</template>

<style scoped>
.studio-panel { display: flex; flex-direction: column; border: 1px solid color-mix(in oklab, var(--color-border) 72%, transparent); border-radius: 0.5rem; background: color-mix(in oklab, var(--color-background) 96%, transparent); box-shadow: 0 4px 16px rgb(0 0 0 / 0.28); }
.panel-head { display: flex; height: 2.25rem; flex-shrink: 0; align-items: center; justify-content: space-between; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding-inline: 0.75rem; font-size: 11px; color: var(--color-muted-foreground); }
.panel-head button { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border-radius: 0.375rem; }
.panel-head button:hover { background: var(--color-card); color: var(--color-foreground); }
.panel-left-enter-active, .panel-left-leave-active, .panel-right-enter-active, .panel-right-leave-active { transition: transform 160ms cubic-bezier(0.2, 0, 0, 1), opacity 140ms ease; }
.panel-left-enter-from, .panel-left-leave-to { transform: translateX(-8px); opacity: 0; }
.panel-right-enter-from, .panel-right-leave-to { transform: translateX(8px); opacity: 0; }
@media (prefers-reduced-motion: reduce) { .panel-left-enter-active, .panel-left-leave-active, .panel-right-enter-active, .panel-right-leave-active { transition: none; } }
</style>
