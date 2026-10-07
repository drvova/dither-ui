<script setup lang="ts">
import { cn } from "./lib"
import Clipboard from "./Clipboard.vue"
import Icon from "./Icon.vue"

/** One-tap copy around a piece of text: the value travels through the shared
 * Clipboard primitive (live-region announcement included), the trigger is an
 * icon button that flips Copy → Check. */
const props = withDefaults(
  defineProps<{ value?: string; label?: string; size?: number; class?: string }>(),
  { value: "", label: "Copy", size: 14 },
)
</script>

<template>
  <Clipboard :value="props.value">
    <template #default="{ copied }">
      <button
        type="button"
        :aria-label="copied ? 'Copied' : props.label"
        :class="
          cn(
            'inline-flex items-center gap-1.5 rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground',
            props.class,
          )
        "
      >
        <Icon :name="copied ? 'Check' : 'Copy'" :size="size" />
        <slot :copied="copied" />
      </button>
    </template>
  </Clipboard>
</template>
