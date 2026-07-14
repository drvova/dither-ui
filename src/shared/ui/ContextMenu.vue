<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue"

export type MenuItem = {
  label?: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

defineProps<{ x: number; y: number; items: MenuItem[] }>()
const emit = defineEmits<{ close: [] }>()

function run(it: MenuItem) {
  if (it.disabled || it.divider) return
  it.onClick?.()
  emit("close")
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close")
}
const close = () => emit("close")

onMounted(() => {
  // defer so the opening click doesn't immediately close it
  setTimeout(() => {
    window.addEventListener("pointerdown", close)
    window.addEventListener("keydown", onKey)
    window.addEventListener("blur", close)
  }, 0)
})
onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", close)
  window.removeEventListener("keydown", onKey)
  window.removeEventListener("blur", close)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-[100] min-w-[172px] rounded-lg border border-border bg-card p-1 text-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @pointerdown.stop
      @contextmenu.prevent
    >
      <template v-for="(it, i) in items" :key="i">
        <div v-if="it.divider" class="my-1 h-px bg-border" />
        <button
          v-else
          type="button"
          :disabled="it.disabled"
          class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40"
          :class="it.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-foreground hover:bg-background'"
          @click="run(it)"
        >
          {{ it.label }}
        </button>
      </template>
    </div>
  </Teleport>
</template>
