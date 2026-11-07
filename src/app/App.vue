<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watchEffect } from "vue"
import { LandingPage, MissingPage } from "@/pages/landing"
import { appPathname, isLanding, routePath } from "@/shared/lib"
import { ROUTE_TITLES, type RouteName } from "@/shared/config/titles"
import PageLoader from "./PageLoader.vue"

// Landing paints immediately: it is the entry and the shared link target.
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

// Clean paths are canonical for crawlers; migrate legacy hash links in place.
if (appPathname() === "/" && location.hash.startsWith("#/docs"))
  history.replaceState(null, "", routePath(location.hash.replace(/^#/, "")))
else if (appPathname() === "/" && location.hash.startsWith("#/studio"))
  history.replaceState(null, "", routePath(location.hash.replace(/^#\/studio\/?/, "/studio#")))

const resolveRoute = (): RouteName => {
  const path = appPathname()
  if (path.startsWith("/studio")) return "studio"
  if (path.startsWith("/docs")) return "docs"
  return isLanding(path) ? "landing" : "missing"
}
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
