<script lang="ts">
/** One item of a row's menu. */
export type RowAction = { label: string; run: () => void; danger?: boolean; disabled?: boolean }
</script>

<script setup lang="ts">
// A sidebar row's "more" key and its menu: a real menu (focus on its first
// item, arrows between items, Escape or a press outside closes it and hands
// focus back to the key). The row's own actions are its items.
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import { DitherIcon } from "@dither-kit"
import { focusFirstMenuItem, menuKeydown } from "@/shared/lib"

const props = defineProps<{ label: string; actions: RowAction[] }>()

const open = ref(false)
const key = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)

function close(refocus = true) {
  open.value = false
  if (refocus) nextTick(() => key.value?.focus())
}
function run(a: RowAction) {
  close(false)
  a.run()
}
function onDown(e: PointerEvent) {
  const t = e.target as Node
  if (!menu.value?.contains(t) && !key.value?.contains(t)) close(false)
}
watch(open, (v) => {
  if (v) {
    nextTick(() => focusFirstMenuItem(menu.value))
    window.addEventListener("pointerdown", onDown, true)
  } else window.removeEventListener("pointerdown", onDown, true)
})
onBeforeUnmount(() => window.removeEventListener("pointerdown", onDown, true))
</script>

<template>
  <div class="row-menu" :class="{ 'is-open': open }">
    <button
      ref="key"
      type="button"
      class="more"
      :aria-label="props.label"
      :title="props.label"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click.stop="open = !open"
    >
      <DitherIcon name="MoreHorizontal" :size="14" :stroke-width="1.5" />
    </button>
    <div
      v-if="open"
      ref="menu"
      role="menu"
      :aria-label="props.label"
      class="menu rim"
      @keydown="menuKeydown"
      @keydown.esc.stop.prevent="close()"
    >
      <button
        v-for="a in props.actions"
        :key="a.label"
        type="button"
        role="menuitem"
        class="item"
        :class="{ 'is-danger': a.danger }"
        :disabled="a.disabled"
        @click="run(a)"
      >
        {{ a.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.row-menu {
  position: absolute;
  top: 50%;
  right: 4px;
  translate: 0 -50%;
}
/* The translate makes the key a stacking context: raised while its menu is
   open so the rows below never paint over the menu. */
.row-menu.is-open {
  z-index: 50;
}
/* The key shows under a pointer or a key, and while its menu is open. */
.more {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
  background: var(--color-card);
  opacity: 0;
  transition: opacity 200ms var(--ease-settle);
}
:global(.has-menu:hover) .more,
.more:focus-visible,
.is-open .more {
  opacity: 1;
}
.more:hover,
.is-open .more {
  color: var(--color-foreground);
}
.more:focus-visible,
.item:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
.menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  display: grid;
  min-width: 10rem;
  padding: 4px;
  border-radius: 12px;
  background: var(--color-card);
  box-shadow: 0 12px 40px -12px rgb(0 0 0 / 0.7);
}
.item {
  min-height: 1.75rem;
  border-radius: 7px;
  padding-inline: 8px;
  text-align: left;
  font-size: 12px;
  color: var(--color-foreground);
}
.item:hover:not(:disabled) {
  background: var(--color-background);
}
.item:disabled {
  opacity: 0.45;
}
.item.is-danger {
  color: var(--color-destructive);
}
/* No hover on a touch screen: the key stays in sight. */
@media (hover: none) {
  .more {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .more {
    transition: none;
  }
}
</style>
