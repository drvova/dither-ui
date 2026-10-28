<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

/** Fires `outside` when a primary pointer press lands anywhere outside the
 * wrapped content — dropdowns, popovers, dismissing scrims. Listens on
 * `pointerdown` in the capture phase so presses inside nested scroll
 * containers still count; `enabled` gates it without tearing down the node. */
const props = withDefaults(
  defineProps<{
    enabled?: boolean
    class?: string
  }>(),
  { enabled: true },
)

const emit = defineEmits<{ outside: [event: Event] }>()
const root = ref<HTMLElement | null>(null)

function onPointerDown(event: Event) {
  if (!props.enabled || !root.value) return
  const target = event.target
  if (target instanceof Node && root.value.contains(target)) return
  emit("outside", event)
}

onMounted(() => document.addEventListener("pointerdown", onPointerDown, true))
onBeforeUnmount(() => document.removeEventListener("pointerdown", onPointerDown, true))
</script>

<template>
  <div ref="root" :class="cn('', props.class)"><slot /></div>
</template>
