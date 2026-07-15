<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watchEffect } from "vue"
import { LandingPage } from "@/pages/landing"

// Landing paints immediately — it is the entry and the shared link target.
// Docs (200+ canvas demos) and Studio (a Figma-style editor) are heavy, so they
// load on demand as their own chunks; the initial bundle stays small, which is
// what makes the first paint fast on mobile.
const DocsPage = defineAsyncComponent(() => import("@/pages/docs").then((m) => m.DocsPage))
const StudioPage = defineAsyncComponent(() => import("@/pages/studio").then((m) => m.StudioPage))

// ponytail: hash routing over three routes; vue-router when params appear
const hash = ref(window.location.hash)
const onHash = () => (hash.value = window.location.hash)
window.addEventListener("hashchange", onHash)
onBeforeUnmount(() => window.removeEventListener("hashchange", onHash))

watchEffect(() => {
  document.title = hash.value.startsWith("#/studio")
    ? "Studio — dither-ui"
    : hash.value.startsWith("#/docs")
      ? "Docs — dither-ui"
      : "dither-ui — A dithered UI toolkit for Vue"
})
</script>

<template>
  <StudioPage v-if="hash.startsWith('#/studio')" />
  <DocsPage v-else-if="hash.startsWith('#/docs')" />
  <LandingPage v-else />
</template>
