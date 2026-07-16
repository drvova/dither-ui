<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watchEffect } from "vue"
import { LandingPage } from "@/pages/landing"
import { appPathname, routePath } from "@/shared/lib"
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

// Clean paths are canonical for crawlers; migrate legacy hash links in place.
type Route = "landing" | "docs" | "studio"
if (appPathname() === "/" && location.hash.startsWith("#/docs"))
  history.replaceState(null, "", routePath(location.hash.replace(/^#/, "")))
else if (appPathname() === "/" && location.hash.startsWith("#/studio"))
  history.replaceState(null, "", routePath(location.hash.replace(/^#\/studio\/?/, "/studio#")))

const resolveRoute = (): Route => {
  const path = appPathname()
  if (path.startsWith("/studio")) return "studio"
  if (path.startsWith("/docs")) return "docs"
  return "landing"
}
const route = ref(resolveRoute())
const onRoute = () => (route.value = resolveRoute())
window.addEventListener("hashchange", onRoute)
window.addEventListener("popstate", onRoute)
onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onRoute)
  window.removeEventListener("popstate", onRoute)
})

watchEffect(() => {
  document.title = route.value === "studio"
    ? "Studio — Build dithered Vue interfaces | dither-ui"
    : route.value === "docs"
      ? "Vue dither components and chart documentation | dither-ui"
      : "dither-ui — A dithered UI toolkit for Vue"
})
</script>

<template>
  <StudioPage v-if="route === 'studio'" />
  <DocsPage v-else-if="route === 'docs'" />
  <LandingPage v-else />
</template>
