<script setup lang="ts">
import { ref, watch } from "vue"
import {
  addArtboard,
  duplicateSelected,
  editor,
  groupSelected,
  removeSelected,
  replay,
  selectedArtboard,
  ungroup,
} from "@/entities/editor"
import { CHART_TYPES, type ChartType } from "@/shared/config"
import { useTheme } from "@/shared/lib"

const emit = defineEmits<{ export: [] }>()
const { dark, toggle } = useTheme()
const addOpen = ref(false)

// Dismiss the add-menu on outside click / Escape (same pattern as ContextMenu).
const closeAdd = () => (addOpen.value = false)
const onAddKey = (e: KeyboardEvent) => e.key === "Escape" && closeAdd()
watch(addOpen, (open) => {
  if (open) {
    setTimeout(() => {
      window.addEventListener("pointerdown", closeAdd)
      window.addEventListener("keydown", onAddKey)
    }, 0)
  } else {
    window.removeEventListener("pointerdown", closeAdd)
    window.removeEventListener("keydown", onAddKey)
  }
})

function add(t: ChartType) {
  addArtboard(t)
  addOpen.value = false
}
const canEdit = () => editor.selectedArtboardId !== ""
const canUngroup = () => !!selectedArtboard.value?.groupId
function doUngroup() {
  const a = selectedArtboard.value
  if (a?.groupId) ungroup(a.groupId)
}
</script>

<template>
  <header class="flex h-12 items-center justify-between border-b border-border/60 bg-background px-4">
    <div class="flex items-center gap-2">
      <span class="inline-block size-3 rounded-[2px] bg-foreground" />
      <span class="font-mono text-sm tracking-tight">dither-ui</span>
      <span class="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">studio</span>
    </div>

    <div class="flex items-center gap-1.5">
      <!-- Add -->
      <div class="relative">
        <button type="button" aria-haspopup="menu" :aria-expanded="addOpen" class="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[11px] text-accent-foreground transition-opacity hover:opacity-90" @click="addOpen = !addOpen">
          + artboard
        </button>
        <div v-if="addOpen" role="menu" class="absolute right-0 top-full z-30 mt-1 w-32 rounded-lg border border-border bg-card p-1 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]" @pointerdown.stop>
          <button v-for="t in CHART_TYPES" :key="t" type="button" class="block w-full rounded-md px-2 py-1.5 text-left text-xs capitalize text-muted-foreground transition-colors hover:bg-background hover:text-foreground" @click="add(t)">{{ t }}</button>
        </div>
      </div>

      <button type="button" :disabled="!canEdit()" title="Duplicate (⌘D)" class="rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40" @click="duplicateSelected">duplicate</button>
      <button type="button" :disabled="!canEdit()" title="Delete (⌫)" class="rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40" @click="removeSelected">delete</button>
      <button type="button" :disabled="editor.selectedIds.length < 1" title="Group (⌘G)" class="rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40" @click="groupSelected">group</button>
      <button v-if="canUngroup()" type="button" title="Ungroup (⌘⇧G)" class="rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground" @click="doUngroup">ungroup</button>

      <span class="mx-1 h-4 w-px bg-border" />

      <button type="button" class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground" @click="replay">
        <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
        replay
      </button>
      <button type="button" class="rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground" @click="emit('export')">export</button>

      <button type="button" class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground" :aria-label="dark ? 'Light' : 'Dark'" @click="toggle">
        <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <template v-if="dark"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></template>
          <path v-else d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </svg>
      </button>
    </div>
  </header>
</template>
