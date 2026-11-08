<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watchEffect } from "vue"
import { LandingPage, MissingPage } from "@/pages/landing"
import { appPathname, routePath } from "@/shared/lib"
import { ROUTE_TITLES } from "@/shared/config/titles"
import PageLoader from "./PageLoader.vue"
import { loadDocs, loadStudio, resolveRoute } from "./route-pages"

// Landing paints immediately: it is the entry and the shared link target.
// Docs (200+ canvas demos) and Studio (a Figma-style editor) are heavy, so they
// load on demand as their own chunks (`route-pages.ts`: the page the address
// opens on loads before the app mounts). On a move, while a chunk downloads we show a spinner
// (after a 150ms delay, so cached/instant loads never flash one) instead of a
// blank freeze during navigation.
const DocsPage = defineAsyncComponent({
  loader: loadDocs,
  loadingComponent: PageLoader,
  delay: 150,
})
const StudioPage = defineAsyncComponent({
  loader: loadStudio,
  loadingComponent: PageLoader,
  delay: 150,
})

// Clean paths are canonical for crawlers; migrate legacy hash links in place.
if (appPathname() === "/" && location.hash.startsWith("#/docs"))
  history.replaceState(null, "", routePath(location.hash.replace(/^#/, "")))
else if (appPathname() === "/" && location.hash.startsWith("#/studio"))
  history.replaceState(null, "", routePath(location.hash.replace(/^#\/studio\/?/, "/studio#")))

const route = ref(resolveRoute())
const onRoute = () => (route.value = resolveRoute())
window.addEventListener("hashchange", onRoute)
window.addEventListener("popstate", onRoute)
onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onRoute)
  window.removeEventListener("popstate", onRoute)
})

// The route marks the root (`data-page`), which the pages' grounds key on:
// a `:root:has(.landing)` rule made the browser re-match the root on every
// node added or removed anywhere, restyling the whole document each time
// (the landing's demos and words add nodes all the time as it scrolls).
watchEffect(() => {
  document.title = ROUTE_TITLES[route.value]
  document.documentElement.dataset.page = route.value
})
</script>

<template>
  <StudioPage v-if="route === 'studio'" />
  <DocsPage v-else-if="route === 'docs'" />
  <LandingPage v-else-if="route === 'landing'" />
  <MissingPage v-else />
</template>
