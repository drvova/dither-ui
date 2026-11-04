<script setup lang="ts">
// The panel beside the canvas: the selection's properties and the
// project's layers, a tab each, the choice remembered for the next visit.
import { ref, watch } from "vue"
import { readJson, writeJson } from "@/shared/lib/storage"
import { Inspector } from "@/widgets/inspector"
import { LayerTree } from "@/widgets/layer-tree"

type Tab = "properties" | "layers"
const TABS: { id: Tab; label: string }[] = [
  { id: "properties", label: "Properties" },
  { id: "layers", label: "Layers" },
]
const KEY = "dither-studio-panel-tab"
const tab = ref<Tab>(readJson(KEY) === "layers" ? "layers" : "properties")
watch(tab, (t) => writeJson(KEY, t))

function onKey(e: KeyboardEvent) {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
  e.preventDefault()
  tab.value = tab.value === "properties" ? "layers" : "properties"
  document.getElementById(`panel-tab-${tab.value}`)?.focus()
}
</script>

<template>
  <div class="panel">
    <div class="tabs" role="tablist" aria-label="Panel" @keydown="onKey">
      <button
        v-for="t in TABS"
        :id="`panel-tab-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        class="tab"
        :aria-selected="tab === t.id"
        :aria-controls="`panel-${t.id}`"
        :tabindex="tab === t.id ? 0 : -1"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>
    <div
      v-show="tab === 'properties'"
      id="panel-properties"
      role="tabpanel"
      aria-labelledby="panel-tab-properties"
      class="body"
    >
      <Inspector />
    </div>
    <div
      v-show="tab === 'layers'"
      id="panel-layers"
      role="tabpanel"
      aria-labelledby="panel-tab-layers"
      class="body layers"
    >
      <LayerTree />
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
.tabs {
  display: flex;
  gap: 2px;
  margin: 8px 8px 0;
  padding: 3px;
  border-radius: 10px;
  background: var(--well, var(--color-card));
}
.tab {
  min-height: 1.75rem;
  flex: 1;
  border-radius: 7px;
  font-size: 12px;
  color: var(--color-muted-foreground);
  transition:
    background-color 200ms var(--ease-settle),
    color 200ms var(--ease-settle);
}
.tab:hover {
  color: var(--color-foreground);
}
.tab[aria-selected="true"] {
  color: var(--color-foreground);
  background: var(--color-card);
}
.tab:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
.body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}
.layers {
  overflow-y: auto;
  padding: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .tab {
    transition: none;
  }
}
</style>
