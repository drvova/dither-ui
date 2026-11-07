<script setup lang="ts">
// Search, ⌘K: one field over everything the Studio holds: the chats of
// every project (the open one first), the projects, the open project's
// frames and the actions to start something. Arrows move, Enter opens,
// Escape or a press outside closes, and focus goes back where it was.
import { computed, nextTick, ref, watch } from "vue"
import { DitherIcon, type IconName } from "@dither-kit"
import Mascot from "@/shared/ui/Mascot.vue"
import { editor, frame, selectArtboard } from "@/entities/editor"
import { chats, chatsOf, newChat, openChat, openProject } from "@/features/agent/chats"
import { activeProjectId, createProject, projects, switchProject } from "@/features/persistence"

const props = defineProps<{ open: boolean; locked: boolean }>()
const emit = defineEmits<{ close: []; agent: []; library: [] }>()

type Hit = { id: string; icon: IconName; label: string; detail: string; run: () => void; disabled?: boolean }

const query = ref("")
const index = ref(0)
const field = ref<HTMLInputElement | null>(null)
let back: HTMLElement | null = null

watch(
  () => props.open,
  (open) => {
    if (open) {
      back = document.activeElement as HTMLElement | null
      query.value = ""
      index.value = 0
      nextTick(() => field.value?.focus())
    } else nextTick(() => back?.focus?.())
  },
)

const fits = (text: string) => text.toLowerCase().includes(query.value.trim().toLowerCase())

const hits = computed<Hit[]>(() => {
  const q = query.value.trim()
  const out: Hit[] = []
  const actions: Hit[] = [
    {
      id: "a:chat",
      icon: "Edit",
      label: "New chat",
      detail: "action",
      run: () => (newChat(), emit("agent")),
      disabled: props.locked,
    },
    {
      id: "a:project",
      icon: "Folder",
      label: "New project",
      detail: "action",
      run: () => createProject(`Project ${projects.length + 1}`),
      disabled: props.locked,
    },
    { id: "a:frame", icon: "Plus", label: "Add a frame", detail: "action", run: () => emit("library") },
  ]
  // The open project's chats first, then every other project's.
  const ordered = [...projects].sort((a, b) =>
    a.id === activeProjectId.value ? -1 : b.id === activeProjectId.value ? 1 : 0,
  )
  for (const p of ordered)
    for (const c of chatsOf(p.id)) {
      if (q && !fits(c.title)) continue
      const here = p.id === activeProjectId.value
      out.push({
        id: `c:${p.id}:${c.id}`,
        icon: "Bot",
        label: c.title,
        detail: here ? "chat" : `chat in ${p.name}`,
        disabled: props.locked && !(here && c.id === chats.active),
        run: () => {
          if (!here) {
            switchProject(p.id)
            openProject(p.id)
          }
          openChat(c.id)
          emit("agent")
        },
      })
    }
  for (const p of projects)
    if (!q || fits(p.name))
      out.push({
        id: `p:${p.id}`,
        icon: "Folder",
        label: p.name,
        detail: p.id === activeProjectId.value ? "project, open" : "project",
        disabled: props.locked && p.id !== activeProjectId.value,
        run: () => switchProject(p.id),
      })
  if (q)
    for (const a of editor.artboards)
      if (fits(a.name))
        out.push({
          id: `f:${a.id}`,
          icon: "Layout",
          label: a.name,
          detail: "frame",
          run: () => {
            selectArtboard(a.id)
            frame([a])
          },
        })
  const doable = actions.filter((a) => !q || fits(a.label))
  // With nothing typed: the actions, then the newest chats.
  return q ? [...out, ...doable] : [...doable, ...out.slice(0, 12)]
})

watch(hits, () => (index.value = Math.min(index.value, Math.max(0, hits.value.length - 1))))

function choose(h: Hit | undefined) {
  if (!h || h.disabled) return
  emit("close")
  h.run()
}
function onKey(e: KeyboardEvent) {
  const n = hits.value.length
  if (e.key === "ArrowDown" && n) {
    e.preventDefault()
    index.value = (index.value + 1) % n
  } else if (e.key === "ArrowUp" && n) {
    e.preventDefault()
    index.value = (index.value - 1 + n) % n
  } else if (e.key === "Enter") {
    e.preventDefault()
    choose(hits.value[index.value])
  } else if (e.key === "Escape") {
    e.preventDefault()
    emit("close")
  }
}
watch(index, (i) => nextTick(() => document.getElementById(`search-hit-${i}`)?.scrollIntoView({ block: "nearest" })))
</script>

<template>
  <div v-if="props.open" class="scrim" @pointerdown.self="emit('close')">
    <div class="palette" role="dialog" aria-modal="true" aria-label="Search">
      <label class="head">
        <DitherIcon name="Search" :size="15" :stroke-width="1.5" />
        <span class="sr-only">Search chats, projects, frames and actions</span>
        <input
          ref="field"
          v-model="query"
          type="text"
          name="studio-search"
          role="combobox"
          aria-expanded="true"
          aria-controls="search-hits"
          aria-autocomplete="list"
          :aria-activedescendant="hits.length ? `search-hit-${index}` : undefined"
          placeholder="Search chats, projects, frames"
          autocomplete="off"
          spellcheck="false"
          class="field"
          @keydown="onKey"
        />
      </label>
      <ul id="search-hits" role="listbox" aria-label="Results" class="hits">
        <li
          v-for="(h, i) in hits"
          :id="`search-hit-${i}`"
          :key="h.id"
          role="option"
          :aria-selected="i === index"
          :aria-disabled="h.disabled || undefined"
          class="hit"
          @pointerenter="index = i"
          @click="choose(h)"
        >
          <DitherIcon :name="h.icon" :size="14" :stroke-width="1.5" /><span class="label">{{ h.label }}</span
          ><span class="detail">{{ h.detail }}</span>
        </li>
        <li v-if="!hits.length" class="none">
          <Mascot :size="22" pose="blink" />
          <span>Nothing matches “{{ query.trim() }}”.</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  justify-items: center;
  align-items: start;
  padding-top: 12vh;
  background: color-mix(in oklab, var(--color-background) 55%, transparent);
}
.palette {
  display: flex;
  width: min(36rem, calc(100vw - 32px));
  max-height: min(28rem, 70vh);
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  background: var(--popover);
  box-shadow: 0 24px 60px -18px rgb(0 0 0 / 0.6);
  font-size: 13px;
}
.head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  color: var(--color-muted-foreground);
}
.field {
  min-width: 0;
  flex: 1;
  height: 3rem;
  background: transparent;
  font: inherit;
  color: var(--color-foreground);
  outline: none;
}
.field::placeholder {
  color: var(--placeholder, var(--color-muted-foreground));
}
.hits {
  margin: 0;
  overflow-y: auto;
  padding: 6px;
  list-style: none;
}
.hit {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 2.125rem;
  border-radius: 9px;
  padding-inline: 8px;
  color: var(--color-foreground);
  cursor: pointer;
}
.hit :deep(svg) {
  flex-shrink: 0;
  color: var(--color-muted-foreground);
}
.hit[aria-selected="true"] {
  background: var(--color-card);
}
.hit[aria-disabled="true"] {
  opacity: 0.45;
  cursor: default;
}
.label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-muted-foreground);
}
.none {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  color: var(--color-muted-foreground);
}
@media (pointer: coarse) {
  .field {
    font-size: 16px;
  }
}
</style>
