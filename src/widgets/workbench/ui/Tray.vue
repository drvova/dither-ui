<script setup lang="ts">
// The floating tool tray (after Kobra's): the group switch, the group's
// tools, then the toggles and the utilities. A toolbar: Left/Right move
// between its buttons; every tool names its key.
import { computed, ref } from "vue"
import { useBench } from "../context"
import { ICONS, TOGGLES, TOOLS } from "../model/tools"
import Icon from "./Icon.vue"

const b = useBench()
const bar = ref<HTMLElement | null>(null)
const tools = computed(() => TOOLS.filter((t) => t.group === b.group.value))
const canUndo = computed(() => (b.revision.value, b.history.canUndo))
const canRedo = computed(() => (b.revision.value, b.history.canRedo))

function roam(e: KeyboardEvent) {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
  e.preventDefault()
  e.stopPropagation()
  const buttons = [...(bar.value?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])]
  const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? buttons.length - 1
        : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length
  buttons[next]?.focus()
}
</script>

<template>
  <div
    ref="bar"
    class="wb-tray"
    :class="{ top: b.settings.tray === 'top' }"
    role="toolbar"
    aria-label="Workbench tools"
    @pointerdown.stop
    @keydown="roam"
  >
    <template v-if="!b.minimized.value">
      <div class="wb-seg" role="group" aria-label="Tool group">
        <button
          type="button"
          class="wb-key"
          :aria-pressed="b.group.value === 1"
          aria-label="Select and inspect tools (1)"
          aria-keyshortcuts="1"
          title="Inspect tools · 1"
          @click="b.setGroup(1)"
        >
          <Icon :d="ICONS.group1" />
        </button>
        <button
          type="button"
          class="wb-key"
          :aria-pressed="b.group.value === 2"
          aria-label="Annotate tools (2)"
          aria-keyshortcuts="2"
          title="Annotate tools · 2"
          @click="b.setGroup(2)"
        >
          <Icon :d="ICONS.group2" />
        </button>
      </div>
      <span class="wb-sep" aria-hidden="true" />
      <button
        v-for="t in tools"
        :key="t.id"
        type="button"
        class="wb-key"
        :aria-pressed="b.tool.value === t.id"
        :aria-label="`${t.label} (${t.key.toUpperCase()})`"
        :aria-keyshortcuts="t.key"
        :title="`${t.label} · ${t.key.toUpperCase()}`"
        @click="b.setTool(t.id)"
      >
        <Icon :d="t.icon" />
      </button>
      <span class="wb-sep" aria-hidden="true" />
      <button
        v-for="t in TOGGLES"
        :key="t.id"
        type="button"
        class="wb-key"
        :aria-pressed="b.toggles[t.id]"
        :aria-label="`${t.label} (${t.key.toUpperCase()})`"
        :aria-keyshortcuts="t.key"
        :title="`${t.label} · ${t.key.toUpperCase()}`"
        @click="b.toggle(t.id)"
      >
        <Icon :d="t.icon" />
      </button>
      <span class="wb-sep" aria-hidden="true" />
      <button
        type="button"
        class="wb-key"
        :disabled="!canUndo"
        aria-label="Undo (⌘Z)"
        aria-keyshortcuts="Control+Z Meta+Z"
        title="Undo · ⌘Z"
        @click="b.undo()"
      >
        <Icon :d="ICONS.undo" />
      </button>
      <button
        type="button"
        class="wb-key"
        :disabled="!canRedo"
        aria-label="Redo (⇧⌘Z)"
        aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
        title="Redo · ⇧⌘Z"
        @click="b.redo()"
      >
        <Icon :d="ICONS.redo" />
      </button>
      <button
        type="button"
        class="wb-key"
        aria-label="Copy feedback for an agent (K)"
        aria-keyshortcuts="k"
        title="Copy feedback for an agent · K"
        @click="b.copyForAgent()"
      >
        <Icon :d="ICONS.agent" />
      </button>
      <button
        type="button"
        class="wb-key"
        :aria-pressed="b.panel.value === 'settings'"
        aria-label="Settings (,)"
        aria-keyshortcuts=","
        title="Settings · ,"
        @click="b.panel.value = b.panel.value === 'settings' ? null : 'settings'"
      >
        <Icon :d="ICONS.settings" />
      </button>
      <button
        type="button"
        class="wb-key"
        aria-label="Minimize the tray"
        title="Minimize"
        @click="b.minimized.value = true"
      >
        <Icon d="M3.5 8h9" />
      </button>
    </template>
    <button
      v-else
      type="button"
      class="wb-key"
      :aria-label="`Show the tools${b.tool.value ? ` (${b.tool.value} in hand)` : ''}`"
      title="Show the tools"
      @click="b.minimized.value = false"
    >
      <Icon :d="b.group.value === 1 ? ICONS.group1 : ICONS.group2" />
    </button>
  </div>
</template>

<style scoped>
.wb-tray {
  position: absolute;
  bottom: 10px;
  left: 50%;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: calc(100% - 24px);
  padding: 4px;
  overflow-x: auto;
  transform: translateX(-50%);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: color-mix(in oklab, var(--color-background) 94%, transparent);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.28);
  pointer-events: auto;
  scrollbar-width: none;
}

.wb-tray.top {
  top: 22px;
  bottom: auto;
}

.wb-seg {
  display: flex;
  gap: 2px;
}

.wb-sep {
  flex: none;
  width: 1px;
  height: 18px;
  margin: 0 3px;
  background: var(--color-border);
}

.wb-key {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: var(--color-muted-foreground);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease;
}

.wb-key:hover:not(:disabled) {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
}

.wb-key[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}

.wb-key:disabled {
  opacity: 0.35;
}

@media (prefers-reduced-transparency: reduce) {
  .wb-tray {
    background: var(--color-background);
  }
}

@media (forced-colors: active) {
  .wb-key[aria-pressed="true"] {
    outline: 1px solid Highlight;
  }
}
</style>
