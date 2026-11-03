<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"
import { DitherAvatar, DitherIcon } from "@dither-kit"
import { agoOf, chats, newChat, openChat, removeChat } from "@/features/agent/chats"
import { built, removeBuilt } from "@/features/agent/dither"
import { activeProjectId, activeProjectName, createProject, projects, switchProject } from "@/features/persistence"
import { routePath } from "@/shared/lib"
import { LayerTree } from "@/widgets/layer-tree"

// The Studio's left side, an app window's: a rail of projects (each its
// kit avatar, a new one under them, the brand on top for the way home) and,
// when open, the project's sidebar: its name, what to start (a frame, a
// chat with the agent), its chats (newest first, how long ago each moved)
// and its layers.
defineProps<{
  open: boolean
  /** A turn is running: the chat stays put until it ends. */
  locked: boolean
}>()
const emit = defineEmits<{ library: []; agent: [] }>()

const now = ref(Date.now())
const tick = setInterval(() => (now.value = Date.now()), 60_000)
onBeforeUnmount(() => clearInterval(tick))

function startChat() {
  newChat()
  emit("agent")
}
function pickChat(id: string) {
  openChat(id)
  emit("agent")
}
</script>

<template>
  <nav class="rail" aria-label="Projects">
    <a :href="routePath('/')" class="tile is-home" aria-label="dither-ui home" title="dither-ui">
      <svg viewBox="0 0 7 7" width="14" height="14" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
        <path d="M3 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h1v-1h1v-1h1z" fill="currentColor" />
        <rect x="3" y="3" width="1" height="1" fill="var(--swatch-orange)" />
      </svg>
    </a>
    <button
      v-for="p in projects"
      :key="p.id"
      type="button"
      class="tile"
      :aria-current="p.id === activeProjectId.value ? 'page' : undefined"
      :aria-label="p.name"
      :title="p.name"
      @click="switchProject(p.id)"
    >
      <DitherAvatar :name="p.name" :size="24" :grid="6" :cell-px="2" :animate="false" />
    </button>
    <button
      type="button"
      class="tile is-new"
      aria-label="New project"
      title="New project"
      @click="createProject(`Project ${projects.length + 1}`)"
    >
      <DitherIcon name="Plus" :size="14" :stroke-width="1.5" />
    </button>
  </nav>

  <aside v-if="open" class="side" aria-label="Project">
    <div class="side-head">
      <DitherAvatar :name="activeProjectName()" :size="28" :grid="6" :cell-px="2" :animate="false" />
      <span class="row-label side-name">{{ activeProjectName() }}</span>
    </div>
    <div class="nav">
      <button type="button" class="nav-row" @click="emit('library')">
        <DitherIcon name="Plus" :size="14" :stroke-width="1.5" /><span class="row-label">Add a frame</span>
      </button>
      <button
        type="button"
        class="nav-row"
        :disabled="locked"
        :title="locked ? 'Stop the turn to start a new chat' : undefined"
        @click="startChat"
      >
        <DitherIcon name="Edit" :size="14" :stroke-width="1.5" /><span class="row-label">New chat</span>
      </button>
      <a :href="routePath('/docs')" class="nav-row">
        <DitherIcon name="Book" :size="14" :stroke-width="1.5" /><span class="row-label">Docs</span>
      </a>
    </div>

    <section v-if="chats.list.length" class="group" aria-labelledby="side-chats">
      <h2 id="side-chats" class="group-label">Chats</h2>
      <ul class="chats">
        <li v-for="c in chats.list" :key="c.id" class="chat">
          <button
            type="button"
            class="nav-row chat-row"
            :aria-current="c.id === chats.active ? 'true' : undefined"
            :disabled="locked && c.id !== chats.active"
            :title="locked && c.id !== chats.active ? 'Stop the turn to switch chats' : c.title"
            @click="pickChat(c.id)"
          >
            <span class="row-label">{{ c.title }}</span
            ><span class="row-label ago">{{ agoOf(c.at, now) }}</span>
          </button>
          <button
            type="button"
            class="chat-x"
            :aria-label="`Delete the chat ${c.title}`"
            title="Delete chat"
            :disabled="locked && c.id === chats.active"
            @click="removeChat(c.id)"
          >
            <DitherIcon name="Close" :size="12" :stroke-width="1.5" />
          </button>
        </li>
      </ul>
    </section>

    <!-- The tools a harness built for its jobs: kept, found first, and run
         only when you allow it; remove one and it is gone. -->
    <section v-if="built.list.length" class="group" aria-labelledby="side-tools">
      <h2 id="side-tools" class="group-label">Tools your agent built</h2>
      <ul class="chats">
        <li v-for="t in built.list" :key="t.name" class="chat">
          <p class="nav-row tool-row" :title="t.description">
            <DitherIcon name="Sparkles" :size="14" :stroke-width="1.5" /><span class="row-label">{{
              t.name.replace(/_/g, " ")
            }}</span
            ><span class="row-label ago">{{ agoOf(t.at, now) }}</span>
          </p>
          <button
            type="button"
            class="chat-x"
            :aria-label="`Remove the tool ${t.name.replace(/_/g, ' ')}`"
            title="Remove tool"
            @click="removeBuilt(t.name)"
          >
            <DitherIcon name="Close" :size="12" :stroke-width="1.5" />
          </button>
        </li>
      </ul>
    </section>

    <section class="group layers" aria-labelledby="side-layers">
      <h2 id="side-layers" class="group-label">Layers</h2>
      <div class="layers-scroll"><LayerTree /></div>
    </section>
  </aside>
</template>

<style scoped>
/* The rail: a column of tiles, the open project's ringed. */
.rail {
  grid-area: rail;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 0 12px;
}
.tile {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  color: var(--color-muted-foreground);
  transition:
    background-color 200ms var(--ease-settle),
    color 200ms var(--ease-settle),
    box-shadow 200ms var(--ease-settle);
}
.tile:hover {
  color: var(--color-foreground);
  background: var(--color-card);
}
.tile[aria-current="page"] {
  background: var(--color-card);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 30%, transparent);
}
.tile.is-home {
  color: var(--color-foreground);
}
.tile.is-new {
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.tile :deep(canvas) {
  border-radius: 6px;
}

/* The sidebar: the project's name, its starts, chats and layers, on one
   left line (14px) like every panel of the Studio. */
.side {
  grid-area: side;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 4px 8px 0;
  font-size: 12px;
}
.side-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 4px 6px 10px;
}
.side-name {
  font-size: 13px;
  color: var(--color-foreground);
}
.nav {
  display: grid;
  gap: 1px;
}
.nav-row {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  min-height: 2rem;
  border-radius: 8px;
  padding-inline: 6px;
  text-align: left;
  color: var(--color-foreground);
  transition:
    background-color 200ms var(--ease-settle),
    color 200ms var(--ease-settle);
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
.group {
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 14px;
}
.group-label {
  margin: 0;
  padding: 4px 6px 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-muted-foreground);
}
.chats {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  max-height: 11rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chat {
  position: relative;
}
/* A chat's title starts on the nav rows' text column (6px, a 14px glyph,
   9px). */
.chat-row {
  width: 100%;
  justify-content: space-between;
  gap: 12px;
  padding-inline: 29px 6px;
}
.chat-row .row-label:first-child {
  flex: 1;
}
.tool-row {
  margin: 0;
  justify-content: space-between;
  gap: 9px;
}
.tool-row .row-label:nth-child(2) {
  flex: 1;
}
.chat-row[aria-current="true"] {
  background: var(--color-card);
}
.ago {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted-foreground);
}
/* Delete stands in for the time while the row is under a pointer or a
   key, so the row keeps one line. */
.chat-x {
  position: absolute;
  top: 50%;
  right: 4px;
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
  background: var(--color-card);
  opacity: 0;
  translate: 0 -50%;
  transition: opacity 200ms var(--ease-settle);
}
.chat:hover .chat-x,
.chat-x:focus-visible {
  opacity: 1;
}
.chat-x:hover {
  color: var(--color-foreground);
}
.chat-x:disabled {
  display: none;
}
.layers {
  flex: 1;
}
.layers-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
}
.tile:focus-visible,
.nav-row:focus-visible,
.chat-x:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
@media (prefers-reduced-motion: reduce) {
  .tile,
  .nav-row,
  .chat-x {
    transition: none;
  }
}
</style>
