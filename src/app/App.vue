<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watchEffect } from "vue"
import { LandingPage } from "@/pages/landing"
import PageLoader from "./PageLoader.vue"

// Landing paints immediately — it is the entry and the shared link target.
// Docs (200+ canvas demos) and Studio (a Figma-style editor) are heavy, so they
// load on demand as their own chunks. While a chunk downloads we show a spinner
// (after a 150ms delay, so cached/instant loads never flash one) instead of a
// blank freeze during navigation.
const DocsPage = defineAsyncComponent({
  loader: () => import("@/pages/docs").then((m) => m.DocsPage),
  loadingComponent: PageLoader,
  delay: 150,
})
const StudioPage = defineAsyncComponent({
  loader: () => import("@/pages/studio").then((m) => m.StudioPage),
  loadingComponent: PageLoader,
  delay: 150,
})

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
