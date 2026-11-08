<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue"
import { DitherAlertDialog, DitherAvatar, DitherIcon } from "@dither-kit"
import {
  agoOf,
  chatGroups,
  chats,
  newChat,
  openChat,
  pinChat,
  removeChat,
  renameChat,
  type ChatMeta,
} from "@/features/agent/chats"
import { built, removeBuilt } from "@/features/agent/dither"
import {
  activeProjectId,
  createProject,
  deleteProject,
  deleteWarning,
  duplicateProject,
  projects,
  renameProject,
  switchProject,
  type ProjectMeta,
} from "@/features/persistence"
import { modKey, routePath } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot.vue"
import RowMenu, { type RowAction } from "./RowMenu.vue"

// The Studio's sidebar, an agent app's: what to start (a chat, a search, a
// frame), then the projects, the open one unfolded into its chats (pinned,
// then by the day each last moved), every row with its own menu; the tools
// your agent built; the way home and to the docs at the foot.
const props = defineProps<{
  /** A turn is running: the chat and the project stay put until it ends. */
  locked: boolean
}>()
const emit = defineEmits<{ library: []; agent: []; search: [] }>()

const now = ref(Date.now())
const tick = setInterval(() => (now.value = Date.now()), 60_000)
onBeforeUnmount(() => clearInterval(tick))

const groups = computed(() => chatGroups(chats.list, now.value))
const toolsOpen = ref(false)

function startChat() {
  if (props.locked) return
  newChat()
  emit("agent")
}
function pickChat(id: string) {
  if (props.locked && id !== chats.active) return
  openChat(id)
  emit("agent")
}
function pickProject(id: string) {
  if (props.locked && id !== activeProjectId.value) return
  switchProject(id)
}

// Naming in place: the row becomes a field, Enter or leaving it keeps the
// name, Escape backs out.
const naming = ref<{ kind: "project" | "chat"; id: string } | null>(null)
const draft = ref("")
const field = ref<HTMLInputElement[] | HTMLInputElement | null>(null)
function startNaming(kind: "project" | "chat", id: string, name: string) {
  naming.value = { kind, id }
  draft.value = name
  nextTick(() => {
    const el = Array.isArray(field.value) ? field.value[0] : field.value
    el?.select()
  })
}
function commitName() {
  const n = naming.value
  if (!n) return
  if (n.kind === "project") renameProject(n.id, draft.value)
  else renameChat(n.id, draft.value)
  naming.value = null
}
const isNaming = (kind: "project" | "chat", id: string) => naming.value?.kind === kind && naming.value.id === id

const doomed = ref<ProjectMeta | null>(null)
function confirmDelete() {
  if (doomed.value) deleteProject(doomed.value.id)
  doomed.value = null
}

const projectActions = (p: ProjectMeta): RowAction[] => [
  { label: "Rename", run: () => startNaming("project", p.id, p.name) },
  { label: "Duplicate", run: () => duplicateProject(p.id), disabled: props.locked },
  { label: "Delete project", run: () => (doomed.value = p), danger: true, disabled: props.locked },
]
const chatActions = (c: ChatMeta): RowAction[] => [
  { label: "Rename", run: () => startNaming("chat", c.id, c.title) },
  { label: c.pinned ? "Unpin" : "Pin", run: () => pinChat(c.id, !c.pinned) },
  {
    label: "Delete chat",
    run: () => removeChat(c.id),
    danger: true,
    disabled: props.locked && c.id === chats.active,
  },
]
</script>

<template>
  <aside class="side" aria-label="Projects and chats">
    <div class="nav">
      <button
        type="button"
        class="nav-row is-primary"
        :disabled="locked"
        :title="locked ? 'Stop the turn to start a new chat' : 'New chat'"
        @click="startChat"
      >
        <DitherIcon name="Edit" :size="14" :stroke-width="1.5" /><span class="row-label">New chat</span>
      </button>
      <button type="button" class="nav-row" title="Search chats, projects and frames" @click="emit('search')">
        <DitherIcon name="Search" :size="14" :stroke-width="1.5" /><span class="row-label">Search</span
        ><kbd class="row-label hint">{{ modKey("K") }}</kbd>
      </button>
      <button type="button" class="nav-row" @click="emit('library')">
        <DitherIcon name="Plus" :size="14" :stroke-width="1.5" /><span class="row-label">Add a frame</span>
      </button>
    </div>

    <section class="group projects" aria-labelledby="side-projects">
      <div class="group-head">
        <h2 id="side-projects" class="group-label">Projects</h2>
        <button
          type="button"
          class="group-key"
          aria-label="New project"
          title="New project"
          :disabled="locked"
          @click="createProject(`Project ${projects.length + 1}`)"
        >
          <DitherIcon name="Plus" :size="13" :stroke-width="1.5" />
        </button>
      </div>
      <ul class="list">
        <li v-for="p in projects" :key="p.id" class="project">
          <div class="has-menu row-wrap">
            <form v-if="isNaming('project', p.id)" class="naming" @submit.prevent="commitName">
              <DitherAvatar :name="p.name" :size="16" :grid="6" :cell-px="1" :animate="false" />
              <input
                ref="field"
                v-model="draft"
                type="text"
                name="project-name"
                aria-label="Project name"
                class="name-field"
                @blur="commitName"
                @keydown.esc.stop.prevent="naming = null"
              />
            </form>
            <button
              v-else
              type="button"
              class="nav-row project-row"
              :aria-current="p.id === activeProjectId.value ? 'page' : undefined"
              :aria-expanded="p.id === activeProjectId.value"
              :disabled="locked && p.id !== activeProjectId.value"
              :title="locked && p.id !== activeProjectId.value ? 'Stop the turn to switch projects' : p.name"
              @click="pickProject(p.id)"
              @dblclick="startNaming('project', p.id, p.name)"
            >
              <DitherAvatar :name="p.name" :size="16" :grid="6" :cell-px="1" :animate="false" /><span
                class="row-label grow"
                >{{ p.name }}</span
              >
            </button>
            <RowMenu v-if="!isNaming('project', p.id)" :label="`More for ${p.name}`" :actions="projectActions(p)" />
          </div>

          <!-- The open project's chats, under it. -->
          <div v-if="p.id === activeProjectId.value" class="chats">
            <p v-if="!groups.length" class="empty row-label">
              <Mascot :size="14" /><span class="truncate">No chats yet.</span>
            </p>
            <section v-for="g in groups" :key="g.label" class="day" :aria-label="g.label">
              <h3 class="day-label row-label">{{ g.label }}</h3>
              <ul class="list">
                <li v-for="c in g.chats" :key="c.id" class="has-menu row-wrap">
                  <form v-if="isNaming('chat', c.id)" class="naming is-chat" @submit.prevent="commitName">
                    <input
                      ref="field"
                      v-model="draft"
                      type="text"
                      name="chat-title"
                      aria-label="Chat title"
                      class="name-field"
                      @blur="commitName"
                      @keydown.esc.stop.prevent="naming = null"
                    />
                  </form>
                  <button
                    v-else
                    type="button"
                    class="nav-row chat-row"
                    :aria-current="c.id === chats.active ? 'true' : undefined"
                    :disabled="locked && c.id !== chats.active"
                    :title="locked && c.id !== chats.active ? 'Stop the turn to switch chats' : c.title"
                    @click="pickChat(c.id)"
                    @dblclick="startNaming('chat', c.id, c.title)"
                  >
                    <DitherIcon v-if="c.pinned" name="Pin" :size="12" :stroke-width="1.5" /><span
                      class="row-label grow"
                      >{{ c.title }}</span
                    ><span class="row-label ago">{{ agoOf(c.at, now) }}</span>
                  </button>
                  <RowMenu v-if="!isNaming('chat', c.id)" :label="`More for ${c.title}`" :actions="chatActions(c)" />
                </li>
              </ul>
            </section>
          </div>
        </li>
      </ul>
    </section>

    <!-- The tools a harness built for its jobs: kept, found first, and run
         only when you allow it; remove one and it is gone. -->
    <section v-if="built.list.length" class="group tools" aria-labelledby="side-tools">
      <button
        id="side-tools"
        type="button"
        class="nav-row tools-head"
        :aria-expanded="toolsOpen"
        @click="toolsOpen = !toolsOpen"
      >
        <DitherIcon :name="toolsOpen ? 'ChevronDown' : 'ChevronRight'" :size="12" :stroke-width="1.5" /><span
          class="row-label grow"
          >Tools your agent built</span
        ><span class="row-label ago">{{ built.list.length }}</span>
      </button>
      <ul v-if="toolsOpen" class="list">
        <li v-for="t in built.list" :key="t.name" class="has-menu row-wrap">
          <p class="nav-row tool-row" :title="t.description">
            <DitherIcon name="Sparkles" :size="13" :stroke-width="1.5" /><span class="row-label grow">{{
              t.name.replace(/_/g, " ")
            }}</span
            ><span class="row-label ago">{{ agoOf(t.at, now) }}</span>
          </p>
          <RowMenu
            :label="`More for ${t.name.replace(/_/g, ' ')}`"
            :actions="[{ label: 'Remove tool', run: () => removeBuilt(t.name), danger: true }]"
          />
        </li>
      </ul>
    </section>

    <div class="foot">
      <a :href="routePath('/')" class="nav-row" title="dither-ui home">
        <svg viewBox="0 0 7 7" width="14" height="14" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
          <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
          <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
        </svg>
        <span class="row-label">dither-ui</span>
      </a>
      <a :href="routePath('/docs')" class="nav-row">
        <DitherIcon name="Book" :size="14" :stroke-width="1.5" /><span class="row-label">Docs</span>
      </a>
    </div>

    <DitherAlertDialog
      :open="!!doomed"
      title="Delete project?"
      :description="doomed ? deleteWarning(doomed.id) : ''"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
      @cancel="doomed = null"
    />
  </aside>
</template>

<style scoped>
/* The sidebar: starts, projects (the open one with its chats), the tools,
   the foot; every glyph and label on one left line (14px from the edge). */
.side {
  grid-area: side;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 4px 8px 8px;
  font-size: 12px;
}
.nav {
  display: grid;
  gap: 1px;
}
.nav-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-width: 0;
  min-height: 2rem;
  border-radius: 8px;
  padding-inline: 6px;
  text-align: left;
  color: var(--color-foreground);
  transition:
    background-color 150ms var(--ease-settle),
    color 150ms var(--ease-settle);
}
.nav-row :deep(svg) {
  flex-shrink: 0;
  color: var(--color-muted-foreground);
}
.nav-row:hover:not(:disabled) {
  background: var(--color-card);
}
.nav-row:disabled {
  opacity: 0.45;
}
.nav-row.is-primary {
  background: var(--color-card);
}
.nav-row.is-primary:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-foreground) 9%, var(--color-card));
}
.grow {
  flex: 1;
}
.hint {
  margin-left: auto;
  font-family: inherit;
  font-size: 11px;
  color: var(--color-muted-foreground);
}
.group {
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 14px;
}
.projects {
  flex: 1;
  overflow-y: auto;
}
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
}
.group-label {
  margin: 0;
  padding: 4px 6px 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-muted-foreground);
}
.group-key {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
}
.group-key:hover:not(:disabled) {
  color: var(--color-foreground);
  background: var(--color-card);
}
.list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
}
.row-wrap {
  position: relative;
}
/* A row's label makes room for its menu key while that key shows. */
.row-wrap:hover > .nav-row,
.row-wrap:focus-within > .nav-row {
  padding-right: 30px;
}
.project-row[aria-current="page"] {
  color: var(--color-foreground);
}
.project-row :deep(canvas) {
  border-radius: 4px;
}
/* The open project's chats hang under it, on its label's column. */
.chats {
  margin: 2px 0 8px;
}
.day-label {
  margin: 6px 0 2px;
  padding-inline: 31px 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-muted-foreground);
}
.chat-row {
  padding-inline: 31px 6px;
  gap: 7px;
}
.chat-row :deep(svg) {
  margin-left: -19px;
}
.chat-row[aria-current="true"] {
  background: var(--color-card);
}
.empty {
  display: flex;
  align-items: center;
  /* the mascot stands in the indent: the words still start on the chat
     titles' column (12 + its 10px + 9 = 31) */
  gap: 9px;
  margin: 2px 0 6px;
  padding-inline: 12px 6px;
  font-size: 11px;
  color: var(--color-muted-foreground);
}
.ago {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted-foreground);
}
.row-wrap:hover .ago,
.row-wrap:focus-within .ago {
  visibility: hidden;
}
.naming {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 2rem;
  padding-inline: 6px;
}
.naming.is-chat {
  padding-left: 31px;
}
.name-field {
  min-width: 0;
  flex: 1;
  height: 1.625rem;
  border: 1px solid var(--color-ring);
  border-radius: 6px;
  background: var(--color-background);
  padding-inline: 6px;
  font: inherit;
  color: var(--color-foreground);
  outline: none;
}
.tools-head {
  color: var(--color-muted-foreground);
}
.tool-row {
  margin: 0;
}
.foot {
  display: grid;
  gap: 1px;
  margin-top: 8px;
}
.nav-row:focus-visible,
.group-key:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
@media (prefers-reduced-motion: reduce) {
  .nav-row {
    transition: none;
  }
}
</style>
