<script lang="ts">
let counter = 0
</script>

<script setup lang="ts">
import { inject, ref } from "vue"
import { SIDEBAR_COLLAPSED } from "./DitherSidebar.vue"

/** Collapsible sub-menu: a parent row plus indented children behind a rail.
 * On the icon rail only the parent icon remains (children need the width). */
const props = withDefaults(
  defineProps<{
    label: string
    /** Open state (v-model). */
    modelValue?: boolean
  }>(),
  { modelValue: false }
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()

const collapsed = inject(SIDEBAR_COLLAPSED, ref(false))
const id = `dk-sidebar-sub-${counter++}`
</script>

<template>
  <div>
    <button
      type="button"
      :aria-expanded="props.modelValue"
      :aria-controls="id"
      :title="collapsed ? props.label : undefined"
      class="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left font-mono text-[12px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
        <slot name="icon">
          <span class="size-1.5 rounded-[1px] bg-current opacity-70" />
        </slot>
      </span>
      <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ props.label }}</span>
      <span
        v-if="!collapsed"
        aria-hidden="true"
        class="text-[11px] transition-transform duration-200 motion-reduce:transition-none"
        :class="props.modelValue ? 'rotate-90' : ''"
      >›</span>
    </button>
    <div
      v-if="!collapsed"
      :id="id"
      class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
      :class="props.modelValue ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden" :inert="!props.modelValue">
        <div class="ml-4.5 grid gap-0.5 border-l border-border/60 py-0.5 pl-1.5">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
