<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import type { ArtboardKind } from "@/entities/artboard"
import {
  addArtboard, addComponentArtboard, addScreenArtboard, duplicateSelected,
  editor, groupSelected, removeSelected, replay, selectedArtboard, ungroup,
} from "@/entities/editor"
import { COMPONENT_REGISTRY, type ComponentEntry, type ComponentGroup } from "@/entities/widget"
import { history, redo, undo } from "@/features/history"
import { exportArtboardPng } from "@/features/export-image"
import {
  activeProjectId, activeProjectName, createProject, deleteProject, exportDocument,
  importDocument, projects, renameProject, switchProject,
} from "@/features/persistence"
import { addArtboardFromPreset, presets } from "@/features/presets"
import { CHART_TYPES } from "@/shared/config"
import { useTheme } from "@/shared/lib"

const props = defineProps<{ layersOpen: boolean; inspectorOpen: boolean }>()
const emit = defineEmits<{ export: []; "update:layersOpen": [boolean]; "update:inspectorOpen": [boolean] }>()
const { dark, toggle } = useTheme()
const libraryOpen = ref(false)
const projectOpen = ref(false)
const query = ref("")
const searchRef = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const pngBusy = ref(false)
const GROUPS: { id: ComponentGroup; label: string }[] = [
  { id: "inputs", label: "Inputs" }, { id: "navigation", label: "Navigation" },
  { id: "display", label: "Display" }, { id: "overlays", label: "Overlays" },
  { id: "structure", label: "Structure" },
]
const matches = (entry: ComponentEntry) =>
  !query.value.trim() || `${entry.label} ${entry.is}`.toLowerCase().includes(query.value.trim().toLowerCase())
const grouped = computed(() => GROUPS.map((group) => ({ ...group, items: COMPONENT_REGISTRY.filter((entry) => entry.group === group.id && matches(entry)) })).filter((group) => group.items.length))

watch(libraryOpen, (open) => {
  if (open) nextTick(() => searchRef.value?.focus())
  else query.value = ""
})
const closeMenus = () => { libraryOpen.value = false; projectOpen.value = false }
const add = (kind: ArtboardKind) => { addArtboard(kind); closeMenus() }
const addComponent = (entry: ComponentEntry) => { addComponentArtboard(entry); closeMenus() }
const addScreen = () => { addScreenArtboard(); closeMenus() }
const canEdit = () => editor.selectedArtboardId !== ""
const canData = () => !!selectedArtboard.value && !selectedArtboard.value.widget
const canUngroup = () => !!selectedArtboard.value?.groupId
const doUngroup = () => { const a = selectedArtboard.value; if (a?.groupId) ungroup(a.groupId) }
function newProject() { const name = window.prompt("Project name", `Project ${projects.length + 1}`); if (name) createProject(name); closeMenus() }
function rename() { const name = window.prompt("Rename project", activeProjectName()); if (name) renameProject(activeProjectId.value, name); closeMenus() }
function removeProject() { if (window.confirm(`Delete “${activeProjectName()}”? This cannot be undone.`)) deleteProject(activeProjectId.value); closeMenus() }
async function openFile(e: Event) { const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (file) await importDocument(file); input.value = "" }
async function exportPng() { const a = selectedArtboard.value; if (!a || pngBusy.value) return; pngBusy.value = true; await exportArtboardPng(a, 2); pngBusy.value = false }
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3">
    <div class="pointer-events-auto flex h-10 items-center rounded-lg border border-border/70 bg-background/95 px-1 shadow-[0_2px_8px_rgba(0,0,0,0.24)]">
      <a href="/" class="flex h-8 items-center gap-2 rounded-md px-2.5 text-xs text-foreground transition-colors hover:bg-card" aria-label="dither-ui home">
        <span class="size-2.5 rounded-[2px] bg-foreground" /><span>dither-ui</span>
      </a>
      <div class="relative border-l border-border/60 pl-1">
        <button type="button" aria-haspopup="menu" :aria-expanded="projectOpen" class="flex h-8 max-w-48 items-center gap-1.5 rounded-md px-2 text-[11px] text-muted-foreground hover:bg-card hover:text-foreground" @click="projectOpen = !projectOpen; libraryOpen = false">
          <span class="truncate">{{ activeProjectName() }}</span><span aria-hidden="true">⌄</span>
        </button>
        <div v-if="projectOpen" role="menu" class="absolute left-0 top-full mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-[0_8px_24px_rgba(0,0,0,0.32)]">
          <button v-for="project in projects" :key="project.id" type="button" role="menuitem" class="flex w-full rounded-md px-2 py-1.5 text-left text-xs" :class="project.id === activeProjectId.value ? 'bg-accent/15 text-foreground' : 'text-muted-foreground hover:bg-background hover:text-foreground'" @click="switchProject(project.id); closeMenus()">{{ project.name }}</button>
          <div class="my-1 h-px bg-border" />
          <button type="button" role="menuitem" class="menu-row" @click="newProject">New project</button>
          <button type="button" role="menuitem" class="menu-row" @click="rename">Rename</button>
          <button type="button" role="menuitem" class="menu-row text-red-400" @click="removeProject">Delete</button>
        </div>
      </div>
    </div>

    <div class="pointer-events-auto relative">
      <button type="button" aria-haspopup="dialog" :aria-expanded="libraryOpen" class="flex h-10 items-center gap-2 rounded-lg border border-border/70 bg-background/95 px-3 text-xs text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.24)] transition-colors hover:bg-card active:scale-[0.96]" @click="libraryOpen = !libraryOpen; projectOpen = false">
        <span aria-hidden="true" class="text-base leading-none">+</span> Library
      </button>
      <div v-if="libraryOpen" role="dialog" aria-label="Component library" class="absolute left-1/2 top-full mt-2 flex max-h-[min(72vh,640px)] w-[420px] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_12px_36px_rgba(0,0,0,0.38)]">
        <label class="border-b border-border/60 p-2">
          <span class="sr-only">Search components</span>
          <input ref="searchRef" v-model="query" type="search" name="component-search" placeholder="Search 55 components…" class="h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-accent/60" @keydown.esc="libraryOpen = false" />
        </label>
        <div class="overflow-y-auto p-2">
          <section v-if="!query" class="mb-3">
            <p class="library-label">Canvas</p>
            <div class="grid grid-cols-3 gap-1">
              <button v-for="type in CHART_TYPES" :key="type" type="button" class="library-item capitalize" @click="add(type)">{{ type }} chart</button>
              <button v-for="type in (['avatar', 'button', 'gradient', 'image'] as const)" :key="type" type="button" class="library-item capitalize" @click="add(type)">{{ type }}</button>
              <button type="button" class="library-item" @click="addScreen">Screen</button>
            </div>
          </section>
          <section v-for="group in grouped" :key="group.id" class="mb-3 last:mb-0">
            <p class="library-label">{{ group.label }}</p>
            <div class="grid grid-cols-2 gap-1">
              <button v-for="entry in group.items" :key="entry.is" type="button" class="library-item text-left" @click="addComponent(entry)">
                <span class="block truncate text-foreground">{{ entry.label }}</span><span class="block truncate text-[9px] text-muted-foreground/60">{{ entry.is }}</span>
              </button>
            </div>
          </section>
          <section v-if="presets.length && !query">
            <p class="library-label">Presets</p>
            <button v-for="preset in presets" :key="preset.name" type="button" class="library-item w-full text-left" @click="addArtboardFromPreset(preset); closeMenus()">{{ preset.name }}</button>
          </section>
          <p v-if="!grouped.length" class="px-2 py-8 text-center text-xs text-muted-foreground">No components match “{{ query }}”.</p>
        </div>
      </div>
    </div>

    <div class="pointer-events-auto flex h-10 items-center gap-0.5 rounded-lg border border-border/70 bg-background/95 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.24)]">
      <button type="button" aria-label="Undo" title="Undo (⌘Z)" :disabled="!history.canUndo" class="tool" @click="undo">↶</button>
      <button type="button" aria-label="Redo" title="Redo (⌘⇧Z)" :disabled="!history.canRedo" class="tool" @click="redo">↷</button>
      <span class="mx-1 h-4 w-px bg-border" />
      <button type="button" title="Duplicate (⌘D)" :disabled="!canEdit()" class="tool wide" @click="duplicateSelected">duplicate</button>
      <button type="button" title="Delete (⌫)" :disabled="!canEdit()" class="tool wide" @click="removeSelected">delete</button>
      <button type="button" title="Group (⌘G)" :disabled="editor.selectedIds.length < 1" class="tool wide" @click="groupSelected">group</button>
      <button v-if="canUngroup()" type="button" class="tool wide" @click="doUngroup">ungroup</button>
      <span class="mx-1 h-4 w-px bg-border" />
      <button type="button" title="Replay" class="tool" @click="replay">↻</button>
      <button type="button" :disabled="!canData()" class="tool wide" :class="editor.dataOpen ? 'bg-card text-foreground' : ''" @click="editor.dataOpen = !editor.dataOpen">data</button>
      <button type="button" class="tool wide" @click="emit('export')">export</button>
      <button type="button" :disabled="!editor.selectedArtboardId || pngBusy" class="tool wide" @click="exportPng">png</button>
      <span class="mx-1 h-4 w-px bg-border" />
      <button type="button" aria-label="Toggle layers" :aria-pressed="props.layersOpen" title="Layers" class="tool" @click="emit('update:layersOpen', !props.layersOpen)">☷</button>
      <button type="button" aria-label="Toggle properties" :aria-pressed="props.inspectorOpen" title="Properties" class="tool" @click="emit('update:inspectorOpen', !props.inspectorOpen)">◫</button>
      <button type="button" :aria-label="dark ? 'Use light theme' : 'Use dark theme'" class="tool" @click="toggle">{{ dark ? '☀' : '◐' }}</button>
      <button type="button" title="Save project" class="tool" @click="exportDocument">↓</button>
      <button type="button" title="Open project" class="tool" @click="fileInput?.click()">↑</button>
      <input ref="fileInput" type="file" accept="application/json" name="open-project" class="hidden" @change="openFile" />
    </div>
  </div>
</template>

<style scoped>
.menu-row { display: block; width: 100%; border-radius: 0.375rem; padding: 0.375rem 0.5rem; text-align: left; font-size: 0.75rem; color: var(--color-muted-foreground); }
.menu-row:hover { background: var(--color-background); color: var(--color-foreground); }
.library-label { padding: 0.25rem 0.5rem; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: color-mix(in oklab, var(--color-muted-foreground) 72%, transparent); }
.library-item { border-radius: 0.375rem; padding: 0.5rem; font-size: 11px; color: var(--color-muted-foreground); transition: background-color 140ms ease, color 140ms ease; }
.library-item:hover { background: var(--color-background); color: var(--color-foreground); }
.tool { display: flex; min-width: 2rem; height: 2rem; align-items: center; justify-content: center; border-radius: 0.375rem; color: var(--color-muted-foreground); font-size: 12px; transition: background-color 140ms ease, color 140ms ease, scale 100ms ease; }
.tool:hover { background: var(--color-card); color: var(--color-foreground); }
.tool:active { scale: 0.96; }
.tool:disabled { pointer-events: none; opacity: 0.35; }
.tool.wide { padding-inline: 0.5rem; }
</style>
