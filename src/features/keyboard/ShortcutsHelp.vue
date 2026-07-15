<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"

const open = ref(false)

const GROUPS: { title: string; keys: [string, string][] }[] = [
  {
    title: "Edit",
    keys: [
      ["⌘Z", "Undo"],
      ["⌘⇧Z", "Redo"],
      ["⌘D", "Duplicate"],
      ["⌫", "Delete"],
      ["⌘G", "Group"],
      ["⌘⇧G", "Ungroup"],
      ["⌘L", "Lock / unlock"],
    ],
  },
  {
    title: "Move",
    keys: [
      ["↑↓←→", "Nudge 1px"],
      ["⇧ + arrows", "Nudge 10px"],
      ["Esc", "Deselect"],
    ],
  },
  {
    title: "View",
    keys: [
      ["⌘+ / ⌘−", "Zoom in / out"],
      ["⌘0", "Zoom to 100%"],
      ["⇧1", "Fit to screen"],
      ["⇧2", "Fit selection"],
    ],
  },
]

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return (
    !!el &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
  )
}

function onKey(e: KeyboardEvent) {
  if (open.value && e.key === "Escape") {
    e.stopPropagation()
    open.value = false
    return
  }
  if (e.key === "?" && !isTyping(e.target)) {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => window.addEventListener("keydown", onKey, true))
onBeforeUnmount(() => window.removeEventListener("keydown", onKey, true))
</script>

<template>
  <Transition name="dk-fade">
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click.self="open = false"
    >
      <div class="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Keyboard shortcuts</span>
          <button
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
            @click="open = false"
          >
            ×
          </button>
        </div>
        <div class="mt-4 grid gap-5">
          <div v-for="g in GROUPS" :key="g.title">
            <div class="text-[10px] uppercase tracking-wider text-muted-foreground">{{ g.title }}</div>
            <dl class="mt-2 grid gap-1.5">
              <div v-for="[k, label] in g.keys" :key="k" class="flex items-center justify-between text-xs">
                <dt class="text-muted-foreground">{{ label }}</dt>
                <dd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">{{ k }}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p class="mt-5 text-[10px] text-muted-foreground">Press ? to toggle this panel</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dk-fade-enter-active,
.dk-fade-leave-active {
  transition: opacity 160ms ease;
}
.dk-fade-enter-from,
.dk-fade-leave-to {
  opacity: 0;
}
</style>
