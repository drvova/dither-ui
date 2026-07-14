<script setup lang="ts">
import { onBeforeUnmount, ref, watchEffect } from "vue"
import { LandingPage } from "@/pages/landing"
import { StudioPage } from "@/pages/studio"

// ponytail: hash routing, swap for vue-router when a third page appears
const hash = ref(window.location.hash)
const onHash = () => (hash.value = window.location.hash)
window.addEventListener("hashchange", onHash)
onBeforeUnmount(() => window.removeEventListener("hashchange", onHash))

watchEffect(() => {
  document.title =
    hash.value === "#/studio"
      ? "Studio — dither-ui"
      : "dither-ui — A dithered UI toolkit for Vue"
})
</script>

<template>
  <StudioPage v-if="hash === '#/studio'" />
  <LandingPage v-else />
</template>
