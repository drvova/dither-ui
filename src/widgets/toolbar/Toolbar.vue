<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DitherAlertDialog, DitherIcon } from "@dither-kit"
import { focusFirstMenuItem, menuKeydown } from "@/shared/lib"
import type { ArtboardKind } from "@/entities/artboard"
import { addArtboard, addComponentArtboard, addScreenArtboard } from "@/entities/editor"
import { COMPONENT_REGISTRY, type ComponentEntry, type ComponentGroup } from "@/entities/widget"
import { history, redo, undo } from "@/features/history"
import type { AgentActivity } from "@/features/agent/tools"
import {
  activeProjectId,
  activeProjectName,
  createProject,
  deleteProject,
  deleteWarning,
  exportDocument,
  importDocument,
  projects,
  renameProject,
  switchProject,
} from "@/features/persistence"
import { addArtboardFromPreset, presets } from "@/features/presets"
import { CHART_TYPES } from "@/shared/config"
import { useTheme } from "@/shared/lib"

// The Studio's title bar, across the window: the sidebar's key and the
// history on the left, the project (its menu) in the middle, the library,
// the chat's column and the panel of properties and layers on the right.
const props = defineProps<{
  sidebarOpen: boolean
  /** The chat's column is showing. */
  chatOpen: boolean
  /** The panel of properties and layers is showing. */
  panelOpen: boolean
  libraryOpen: boolean
  /** What the agent is doing, shown on its key (the panel may be closed). */
  agentState?: AgentActivity
}>()
const AGENT_SAYS: Record<AgentActivity, string> = {
  idle: "Chat",
  working: "Chat, the agent is working",
  waiting: "Chat, the agent is waiting for you",
  unseen: "Chat, the agent finished",
}
const emit = defineEmits<{
  "update:sidebarOpen": [boolean]
  "update:chatOpen": [boolean]
  "update:panelOpen": [boolean]
  "update:libraryOpen": [boolean]
}>()
const { dark, toggle } = useTheme()
const libraryOpen = computed({
  get: () => props.libraryOpen,
  set: (v: boolean) => emit("update:libraryOpen", v),
})
const projectOpen = ref(false)
const query = ref("")
const searchRef = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
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
</script>

<template>
  <header ref="rootEl" class="bar">
    <div class="flex items-center gap-0.5 justify-self-start">
      <button
        type="button"
        class="tool"
        :aria-pressed="props.sidebarOpen"
        :aria-label="props.sidebarOpen ? 'Hide the sidebar' : 'Show the sidebar'"
        :title="props.sidebarOpen ? 'Hide the sidebar' : 'Show the sidebar'"
        @click="emit('update:sidebarOpen', !props.sidebarOpen)"
      >
        <DitherIcon name="Sidebar" :size="15" :stroke-width="1.5" />
      </button>
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
    </div>
    <div class="relative justify-self-center">
      <button
        ref="projectTrigger"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="projectOpen"
        class="project"
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
          class="rim absolute left-1/2 top-full z-40 mt-1 w-56 -translate-x-1/2 rounded-2xl bg-card p-1 shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
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
              class="h-7 w-full rounded-md border border-edge bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
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
          <button type="button" role="menuitem" class="menu-row text-destructive" @click="removeProject">
            Delete project
          </button>
        </div>
      </Transition>
    </div>

    <div class="flex items-center gap-0.5 justify-self-end">
      <div class="relative mr-1">
        <button
          type="button"
          aria-haspopup="dialog"
          :aria-expanded="libraryOpen"
          class="key-chrome flex h-8 items-center gap-2 px-3.5 text-[12px] font-medium transition-[filter,scale] active:scale-[0.96]"
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
            class="absolute right-0 top-full z-40 mt-2 flex max-h-[min(72dvh,640px)] w-[420px] flex-col overflow-hidden rim rounded-2xl bg-card shadow-[0_12px_36px_rgba(0,0,0,0.38)]"
          >
            <label class="border-b border-border/60 p-2">
              <span class="sr-only">Search components</span>
              <input
                ref="searchRef"
                v-model="query"
                type="search"
                name="component-search"
                :placeholder="`Search ${COMPONENT_REGISTRY.length} components…`"
                class="h-9 w-full rounded-md border border-edge bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
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
      <button
        type="button"
        :aria-label="`Toggle the chat (${AGENT_SAYS[props.agentState ?? 'idle']})`"
        :aria-pressed="props.chatOpen"
        :title="`${AGENT_SAYS[props.agentState ?? 'idle']} (⌘I)`"
        class="tool wide"
        @click="emit('update:chatOpen', !props.chatOpen)"
      >
        <span class="agent-key">
          <DitherIcon name="Bot" :size="15" :stroke-width="1.5" /><span
            v-if="props.agentState && props.agentState !== 'idle'"
            class="agent-dot"
            :data-state="props.agentState"
            aria-hidden="true"
          ></span></span
        >Chat
      </button>
      <button
        type="button"
        aria-label="Toggle properties and layers"
        :aria-pressed="props.panelOpen"
        title="Properties and layers"
        class="tool"
        @click="emit('update:panelOpen', !props.panelOpen)"
      >
        <DitherIcon name="Sliders" :size="15" :stroke-width="1.5" />
      </button>
      <button type="button" :aria-label="dark ? 'Use light theme' : 'Use dark theme'" class="tool" @click="toggle">
        <DitherIcon :name="dark ? 'Sun' : 'Moon'" :size="15" :stroke-width="1.5" />
      </button>
    </div>

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
      :description="deleteWarning(activeProjectId.value)"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
      @cancel="confirmDelete = false"
    />
  </header>
</template>

<style scoped src="./tool.css"></style>
<style scoped>
/* The bar: three columns (left keys, the project, right keys), the
   project centred on the window. */
.bar {
  position: relative;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  height: 2.75rem;
  /* The sidebar's key centred over the rail's tiles; the last key ending
     on the right column's edge. */
  padding-inline: 10px 8px;
}
.project {
  display: flex;
  max-width: 20rem;
  height: 2rem;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding-inline: 10px;
  font-size: 12px;
  color: var(--color-foreground);
  transition: background-color 200ms var(--ease-settle);
}
.project:hover,
.project[aria-expanded="true"] {
  background: var(--color-card);
}
.project:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
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
/* Delete keeps the destructive ink, at rest and under the pointer. */
.menu-row.text-destructive,
.menu-row.text-destructive:hover {
  color: var(--color-destructive);
}
/* Menus and popovers: quick rise on enter, softer drop on exit (exits are
   quieter than enters), house easing, still under reduced motion. */
.pop-enter-active {
  transition:
    opacity 200ms var(--ease-settle),
    transform 350ms var(--ease-settle);
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
/* The agent's key says what it is doing while its panel is closed: a dot
   that breathes while it works, the signal ink when it waits for you, a
   still dot when a turn ended unseen. */
.agent-key {
  position: relative;
  display: grid;
}
.agent-dot {
  position: absolute;
  top: -2px;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-foreground);
  box-shadow: 0 0 0 2px var(--color-background);
}
.agent-dot[data-state="waiting"] {
  background: var(--swatch-orange);
}
@media (prefers-reduced-motion: no-preference) {
  .agent-dot[data-state="working"] {
    animation: agent-breathe 1.6s var(--ease-settle) infinite alternate;
  }
  @keyframes agent-breathe {
    to {
      opacity: 0.35;
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
