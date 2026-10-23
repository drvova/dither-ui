<script setup lang="ts">
// A run's component inside an error boundary: what it throws while it sets
// up, renders or handles an event shows here, in the preview, instead of
// taking the docs page down with it.
import { onErrorCaptured, ref, type Component } from "vue"

defineProps<{ component: Component }>()
const error = ref("")
onErrorCaptured((e) => {
  error.value = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  return false
})
</script>

<template>
  <p v-if="error" role="alert" class="m-0 font-mono text-[12px] text-muted-foreground">
    <span class="text-foreground">The run stopped.</span> {{ error }}
  </p>
  <component :is="component" v-else />
</template>
