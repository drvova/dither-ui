<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DitherAlertDialog, DitherIcon } from "@dither-kit"
import { focusFirstMenuItem, menuKeydown } from "@/shared/lib"
import type { ArtboardKind } from "@/entities/artboard"
import {
  addArtboard,
  addComponentArtboard,
  addReelArtboard,
  addScreenArtboard,
  duplicateSelected,
  editor,
  groupSelected,
  removeSelected,
  replay,
  selectedArtboard,
  ungroup,
} from "@/entities/editor"
import { COMPONENT_REGISTRY, type ComponentEntry, type ComponentGroup } from "@/entities/widget"
import { history, redo, undo } from "@/features/history"
import { evolveSelected } from "@/features/agent"
import { exportArtboardPng } from "@/features/export-image"
import {
  activeProjectId,
  activeProjectName,
  createProject,
  deleteProject,
  exportDocument,
  importDocument,
  projects,
  renameProject,
  switchProject,
} from "@/features/persistence"
import { addArtboardFromPreset, presets } from "@/features/presets"
import { CHART_TYPES } from "@/shared/config"
import { routePath, useTheme } from "@/shared/lib"

const props = defineProps<{ layersOpen: boolean; inspectorOpen: boolean; agentOpen: boolean }>()
const emit = defineEmits<{
  export: []
  video: []
  "update:layersOpen": [boolean]
  "update:inspectorOpen": [boolean]
  "update:agentOpen": [boolean]
}>()
const { dark, toggle } = useTheme()
const libraryOpen = ref(false)
const projectOpen = ref(false)
const query = ref("")
const searchRef = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const pngBusy = ref(false)
const GROUPS: { id: ComponentGroup; label: string }[] = [
  { id: "inputs", label: "Inputs" },
  { id: "navigation", label: "Navigation" },
  { id: "display", label: "Display" },
  { id: "overlays", label: "Overlays" },
  { id: "structure", label: "Structure" },
]
const matches = (entry: ComponentEntry) =>
  !query.value.trim() || `${entry.label} ${entry.is}`.toLowerCase().includes(query.value.trim().toLowerCase())
const grouped = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    items: COMPONENT_REGISTRY.filter((entry) => entry.group === group.id && matches(entry)),
  })).filter((group) => group.items.length),
)

watch(libraryOpen, (open) => {
  if (open) nextTick(() => searchRef.value?.focus())
  else query.value = ""
})
const closeMenus = () => {
  libraryOpen.value = false
  projectOpen.value = false
  naming.value = null
}
// The project menu is a real menu: first item focused on open, focus back
// on the trigger when it closes, arrow keys between items.
const projectTrigger = ref<HTMLButtonElement | null>(null)
const projectMenu = ref<HTMLElement | null>(null)
watch(projectOpen, (open) => {
  if (open) nextTick(() => focusFirstMenuItem(projectMenu.value))
  // The leave transition keeps the menu in the DOM for a beat, so "focus is
  // still on a menu item" counts as orphaned too.
  else
    nextTick(() => {
      const a = document.activeElement
      if (!a || a === document.body || a.closest("[role=menu]")) projectTrigger.value?.focus()
    })
})
// Menus dismiss like menus: Escape anywhere, or a pointer landing outside the toolbar.
const rootEl = ref<HTMLElement | null>(null)
const onWindowKey = (e: KeyboardEvent) => {
  if (e.key === "Escape" && (libraryOpen.value || projectOpen.value)) closeMenus()
}
const onWindowDown = (e: PointerEvent) => {
  if ((libraryOpen.value || projectOpen.value) && e.target instanceof Node && !rootEl.value?.contains(e.target))
    closeMenus()
}
onMounted(() => {
  window.addEventListener("keydown", onWindowKey)
  window.addEventListener("pointerdown", onWindowDown)
})
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onWindowKey)
  window.removeEventListener("pointerdown", onWindowDown)
})
const add = (kind: ArtboardKind) => {
  addArtboard(kind)
  closeMenus()
}
const addComponent = (entry: ComponentEntry) => {
  addComponentArtboard(entry)
  closeMenus()
}
const addScreen = () => {
  addScreenArtboard()
  closeMenus()
}
const canEdit = () => editor.selectedArtboardId !== ""
const canData = () => !!selectedArtboard.value && !selectedArtboard.value.widget
const canUngroup = () => !!selectedArtboard.value?.groupId
// A reel cuts the selected frames (in selection order); reels themselves are not clips.
const canReel = () =>
  editor.selectedIds.some((id) => editor.artboards.find((a) => a.id === id)?.widget?.kind !== "reel")
const makeReel = () => addReelArtboard(editor.selectedIds)
const selectionLabel = computed(() =>
  editor.selectedIds.length > 1 ? `${editor.selectedIds.length} selected` : (selectedArtboard.value?.name ?? ""),
)
const doUngroup = () => {
  const a = selectedArtboard.value
  if (a?.groupId) ungroup(a.groupId)
}
// Naming happens inline in the menu (no browser prompt): the row becomes a
// field, Enter commits, Escape backs out. Deleting asks through the kit's
// alert dialog.
const naming = ref<"new" | "rename" | null>(null)
const draft = ref("")
const nameInput = ref<HTMLInputElement | null>(null)
function startNaming(mode: "new" | "rename") {
  naming.value = mode
  draft.value = mode === "rename" ? activeProjectName() : `Project ${projects.length + 1}`
  nextTick(() => nameInput.value?.select())
}
function commitName() {
  const name = draft.value.trim()
  if (name) {
    if (naming.value === "new") createProject(name)
    else renameProject(activeProjectId.value, name)
  }
  closeMenus()
}
const confirmDelete = ref(false)
function removeProject() {
  closeMenus()
  confirmDelete.value = true
}
function doDelete() {
  deleteProject(activeProjectId.value)
  confirmDelete.value = false
}
async function openFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await importDocument(file)
  input.value = ""
}
async function exportPng() {
  const a = selectedArtboard.value
  if (!a || pngBusy.value) return
  pngBusy.value = true
  await exportArtboardPng(a, 2)
  pngBusy.value = false
}
</script>

<template>
  <div
    ref="rootEl"
    class="pointer-events-none absolute inset-x-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-start gap-3 p-3"
  >
    <div class="capsule pointer-events-auto flex h-10 items-center justify-self-start px-1">
      <a
        :href="routePath('/')"
        class="flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs text-foreground transition-colors hover:bg-card"
        aria-label="dither-ui home"
      >
        <svg viewBox="0 0 7 7" width="13" height="13" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
          <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
          <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" /></svg
        ><span>dither-ui</span>
      </a>
      <div class="relative border-l border-border/60 pl-1">
        <button
          ref="projectTrigger"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="projectOpen"
          class="flex h-8 max-w-48 items-center gap-1.5 rounded-lg px-2.5 text-[11px] text-muted-foreground hover:bg-card hover:text-foreground"
          @click="
            () => {
              projectOpen = !projectOpen
              libraryOpen = false
            }
          "
        >
          <span class="truncate">{{ activeProjectName() }}</span
          ><DitherIcon name="ChevronDown" :size="12" :stroke-width="1.5" />
        </button>
        <Transition name="pop">
          <div
            v-if="projectOpen"
            ref="projectMenu"
            role="menu"
            class="rim absolute left-0 top-full mt-1 w-56 rounded-2xl bg-card p-1 shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
            @keydown="menuKeydown"
          >
            <button
              v-for="project in projects"
              :key="project.id"
              type="button"
              role="menuitem"
              class="flex w-full rounded-md px-2 py-1.5 text-left text-xs"
              :class="
                project.id === activeProjectId.value
                  ? 'ring-on'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              "
              @click="
                () => {
                  switchProject(project.id)
                  closeMenus()
                }
              "
            >
              {{ project.name }}
            </button>
            <div class="my-1 h-px bg-border" />
            <form v-if="naming" class="px-1 py-1" @submit.prevent="commitName">
              <input
                ref="nameInput"
                v-model="draft"
                type="text"
                :aria-label="naming === 'new' ? 'New project name' : 'Project name'"
                placeholder="Project name"
                class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
                @keydown.esc.stop="naming = null"
              />
            </form>
            <template v-else>
              <button type="button" role="menuitem" class="menu-row" @click="startNaming('new')">New project</button>
              <button type="button" role="menuitem" class="menu-row" @click="startNaming('rename')">Rename</button>
            </template>
            <button
              type="button"
              role="menuitem"
              class="menu-row"
              @click="
                () => {
                  exportDocument()
                  closeMenus()
                }
              "
            >
              Save to file
            </button>
            <button
              type="button"
              role="menuitem"
              class="menu-row"
              @click="
                () => {
                  fileInput?.click()
                  closeMenus()
                }
              "
            >
              Open file
            </button>
            <div class="my-1 h-px bg-border" />
            <button type="button" role="menuitem" class="menu-row text-red-400" @click="removeProject">
              Delete project
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <div class="pointer-events-auto relative">
      <button
        type="button"
        aria-haspopup="dialog"
        :aria-expanded="libraryOpen"
        class="key-chrome flex h-10 items-center gap-2 px-4 text-[12px] font-medium transition-[filter,scale] active:scale-[0.96]"
        @click="
          () => {
            libraryOpen = !libraryOpen
            projectOpen = false
          }
        "
      >
        <DitherIcon name="Plus" :size="14" :stroke-width="1.5" />Library
      </button>
      <Transition name="pop">
        <div
          v-if="libraryOpen"
          role="dialog"
          aria-label="Component library"
          class="absolute left-1/2 top-full mt-2 flex max-h-[min(72dvh,640px)] w-[420px] -translate-x-1/2 flex-col overflow-hidden rim rounded-2xl bg-card shadow-[0_12px_36px_rgba(0,0,0,0.38)]"
        >
          <label class="border-b border-border/60 p-2">
            <span class="sr-only">Search components</span>
            <input
              ref="searchRef"
              v-model="query"
              type="search"
              name="component-search"
              :placeholder="`Search ${COMPONENT_REGISTRY.length} components…`"
              class="h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              @keydown.esc="libraryOpen = false"
            />
          </label>
          <div class="overflow-y-auto p-2">
            <section v-if="!query" class="mb-3">
              <p class="library-label">Canvas</p>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="type in CHART_TYPES"
                  :key="type"
                  type="button"
                  class="library-item capitalize"
                  @click="add(type)"
                >
                  {{ type }} chart
                </button>
                <button
                  v-for="type in ['avatar', 'button', 'gradient', 'image'] as const"
                  :key="type"
                  type="button"
                  class="library-item capitalize"
                  @click="add(type)"
                >
                  {{ type }}
                </button>
                <button type="button" class="library-item" @click="addScreen">Screen</button>
              </div>
            </section>
            <section v-for="group in grouped" :key="group.id" class="mb-3 last:mb-0">
              <p class="library-label">{{ group.label }}</p>
              <div class="grid grid-cols-2 gap-1">
                <button
                  v-for="entry in group.items"
                  :key="entry.is"
                  type="button"
                  class="library-item text-left"
                  @click="addComponent(entry)"
                >
                  <span class="block truncate text-foreground">{{ entry.label }}</span
                  ><span class="block truncate text-[9px] text-muted-foreground">{{ entry.is }}</span>
                </button>
              </div>
            </section>
            <section v-if="presets.length && !query">
              <p class="library-label">Presets</p>
              <button
                v-for="preset in presets"
                :key="preset.name"
                type="button"
                class="library-item w-full text-left"
                @click="
                  () => {
                    addArtboardFromPreset(preset)
                    closeMenus()
                  }
                "
              >
                {{ preset.name }}
              </button>
            </section>
            <p v-if="!grouped.length" class="px-2 py-8 text-center text-xs text-muted-foreground">
              No components match “{{ query }}”.
            </p>
          </div>
        </div>
      </Transition>
    </div>

    <div class="capsule pointer-events-auto flex h-10 items-center gap-0.5 justify-self-end p-1">
      <button type="button" aria-label="Undo" title="Undo (⌘Z)" :disabled="!history.canUndo" class="tool" @click="undo">
        <DitherIcon name="Undo" :size="15" :stroke-width="1.5" />
      </button>
      <button
        type="button"
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
        :disabled="!history.canRedo"
        class="tool"
        @click="redo"
      >
        <DitherIcon name="Redo" :size="15" :stroke-width="1.5" />
      </button>
      <span class="mx-1 h-4 w-px bg-border" />
      <button
        type="button"
        aria-label="Toggle layers"
        :aria-pressed="props.layersOpen"
        title="Layers"
        class="tool"
        @click="emit('update:layersOpen', !props.layersOpen)"
      >
        <DitherIcon name="Layers" :size="15" :stroke-width="1.5" />
      </button>
      <button
        type="button"
        aria-label="Toggle properties"
        :aria-pressed="props.inspectorOpen"
        title="Properties"
        class="tool"
        @click="emit('update:inspectorOpen', !props.inspectorOpen)"
      >
        <DitherIcon name="Sliders" :size="15" :stroke-width="1.5" />
      </button>
      <button
        type="button"
        aria-label="Toggle agent"
        :aria-pressed="props.agentOpen"
        title="Agent"
        class="tool wide"
        @click="emit('update:agentOpen', !props.agentOpen)"
      >
        <DitherIcon name="Bot" :size="15" :stroke-width="1.5" />Agent
      </button>
      <button type="button" :aria-label="dark ? 'Use light theme' : 'Use dark theme'" class="tool" @click="toggle">
        <DitherIcon :name="dark ? 'Sun' : 'Moon'" :size="15" :stroke-width="1.5" />
      </button>
    </div>

    <Transition name="selection-tools">
      <div
        v-if="canEdit()"
        class="capsule pointer-events-auto fixed left-1/2 z-30 flex h-10 -translate-x-1/2 items-center gap-0.5 p-1"
        :class="editor.dataOpen ? 'bottom-[17rem]' : 'bottom-3'"
        role="toolbar"
        aria-label="Selection actions"
      >
        <span class="max-w-36 truncate px-2 text-[11px] text-foreground" aria-live="polite">{{ selectionLabel }}</span>
        <span class="mx-0.5 h-4 w-px bg-border" />
        <button type="button" title="Duplicate (⌘D)" class="tool wide" @click="duplicateSelected">
          <DitherIcon name="Copy" :size="14" :stroke-width="1.5" /><span class="lbl">Duplicate</span>
        </button>
        <button v-if="canUngroup()" type="button" title="Ungroup (⌘⇧G)" class="tool wide" @click="doUngroup">
          <DitherIcon name="Group" :size="14" :stroke-width="1.5" /><span class="lbl">Ungroup</span>
        </button>
        <button v-else type="button" title="Group (⌘G)" class="tool wide" @click="groupSelected">
          <DitherIcon name="Group" :size="14" :stroke-width="1.5" /><span class="lbl">Group</span>
        </button>
        <button type="button" title="Delete (⌫)" class="tool wide text-red-400" @click="removeSelected">
          <DitherIcon name="Trash" :size="14" :stroke-width="1.5" /><span class="lbl">Delete</span>
        </button>
        <span class="mx-0.5 h-4 w-px bg-border" />
        <button type="button" title="Replay animation" class="tool" aria-label="Replay animation" @click="replay">
          <DitherIcon name="Refresh" :size="14" :stroke-width="1.5" />
        </button>
        <button
          type="button"
          title="Evolve: four seeded variants of this frame"
          class="tool wide"
          @click="evolveSelected()"
        >
          <DitherIcon name="Dice" :size="14" :stroke-width="1.5" /><span class="lbl">Evolve</span>
        </button>
        <button
          v-if="canReel()"
          type="button"
          title="Reel: play the selected frames in order with dither transitions"
          class="tool wide"
          @click="makeReel"
        >
          <DitherIcon name="Film" :size="14" :stroke-width="1.5" /><span class="lbl">Reel</span>
        </button>
        <button
          v-if="canData()"
          type="button"
          class="tool wide"
          :aria-pressed="editor.dataOpen"
          @click="editor.dataOpen = !editor.dataOpen"
        >
          <DitherIcon name="Table" :size="14" :stroke-width="1.5" /><span class="lbl">Data</span>
        </button>
        <button type="button" class="tool wide" @click="emit('export')">
          <DitherIcon name="Code" :size="14" :stroke-width="1.5" /><span class="lbl">Code</span>
        </button>
        <button type="button" :disabled="pngBusy" class="tool wide" @click="exportPng">
          <DitherIcon name="Image" :size="14" :stroke-width="1.5" /><span class="lbl">{{
            pngBusy ? "Saving…" : "PNG"
          }}</span>
        </button>
        <button
          type="button"
          title="Export as a HyperFrames video composition"
          class="tool wide"
          @click="emit('video')"
        >
          <DitherIcon name="Video" :size="14" :stroke-width="1.5" /><span class="lbl">Video</span>
        </button>
      </div>
    </Transition>
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      name="open-project"
      class="hidden"
      @change="openFile"
    />
    <DitherAlertDialog
      :open="confirmDelete"
      title="Delete project?"
      :description="`“${activeProjectName()}” and its artboards will be removed. This cannot be undone.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
      @cancel="confirmDelete = false"
    />
  </div>
</template>

<style scoped>
.menu-row {
  display: block;
  width: 100%;
  border-radius: 0.625rem;
  padding: 0.375rem 0.5rem;
  text-align: left;
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
}
.menu-row:hover {
  background: var(--color-background);
  color: var(--color-foreground);
}
/* Menus and popovers: quick rise on enter, softer drop on exit (exits are
   quieter than enters), house easing, still under reduced motion. */
.pop-enter-active {
  transition:
    opacity 140ms cubic-bezier(0.2, 0, 0, 1),
    transform 140ms cubic-bezier(0.2, 0, 0, 1);
}
.pop-leave-active {
  transition:
    opacity 100ms ease,
    transform 100ms ease;
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
.pop-leave-to {
  opacity: 0;
  transform: translateY(-2px) scale(0.99);
}
.library-label {
  padding: 0.25rem 0.5rem;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--color-muted-foreground);
}
.library-item {
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-size: 11px;
  color: var(--color-muted-foreground);
  transition:
    background-color 140ms ease,
    color 140ms ease;
}
.library-item:hover {
  background: var(--color-background);
  color: var(--color-foreground);
}
.tool {
  display: flex;
  gap: 6px;
  min-width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--color-muted-foreground);
  font-size: 12px;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    scale 100ms ease;
}
.tool:hover {
  background: var(--color-card);
  color: var(--color-foreground);
}
.tool:active {
  scale: 0.96;
}
.tool:disabled {
  pointer-events: none;
  opacity: 0.35;
}
/* A pressed tool (an open panel, the data editor) wears the site's ring. */
.tool[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}
.tool.wide {
  padding-inline: 0.5rem;
}
/* Under 1024px the selection actions keep their glyphs and their names
   (screen readers still read the label); the words step out. */
@media (max-width: 1023px) {
  .tool .lbl {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
.selection-tools-enter-active,
.selection-tools-leave-active {
  transition:
    transform 160ms cubic-bezier(0.2, 0, 0, 1),
    opacity 120ms ease;
}
.selection-tools-enter-from,
.selection-tools-leave-to {
  transform: translate(-50%, 6px);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .selection-tools-enter-active,
  .selection-tools-leave-active {
    transition: none;
  }
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
