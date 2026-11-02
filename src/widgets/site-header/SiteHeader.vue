<script setup lang="ts">
// The site's header, one for every page that reads (the landing, the docs):
// a capsule on the raised ground floating over the page, centred, lifted by
// its shadow alone; the brand, the site's links (GitHub under its mark), a
// page's own tools (`tools`: the docs' search and sections key) and the
// chrome "Open studio" key. Sticky is positioned, and z-10 keeps it over a
// page's main, which isolates its art.
import { routePath } from "@/shared/lib"
import BrandMark from "@/shared/ui/BrandMark.vue"
import ToolMark from "@/shared/ui/ToolMark.vue"

/** The page the reader is on, so its own link reads as current. */
const props = defineProps<{ current: "landing" | "docs" }>()
const home = routePath("/")
</script>

<template>
  <header class="site-head sticky top-0 z-40">
    <div class="site-capsule text-xs">
      <a :href="home" class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2">
        <BrandMark :size="13" />
        <span class="max-[359px]:sr-only">dither-ui</span>
      </a>
      <nav class="flex items-center text-muted-foreground" aria-label="Site">
        <a :href="`${home}#examples`" class="nav-a hidden md:inline-flex">Components</a>
        <a
          :href="routePath('/docs')"
          class="nav-a"
          :class="{ 'text-foreground': props.current === 'docs' }"
          :aria-current="props.current === 'docs' ? 'page' : undefined"
          >Docs</a
        >
        <a :href="`${home}#ask`" class="nav-a hidden md:inline-flex">Agents</a>
        <a
          href="https://github.com/drvova/dither-ui"
          target="_blank"
          rel="noreferrer"
          class="nav-a hidden lg:inline-flex"
          ><ToolMark id="github" :size="13" />GitHub<span class="sr-only"> (opens in a new tab)</span></a
        >
      </nav>
      <div class="flex items-center gap-1">
        <slot name="tools" />
        <a :href="routePath('/studio')" class="nav-a key-chrome studio-key">Open studio</a>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* The header's height is `--head` (64px unless a page sets it), read by
   whatever must sit clear of it. */
.site-head {
  padding: 8px 16px;
}

.site-capsule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: min(100%, 48rem);
  height: calc(var(--head, 64px) - 16px);
  margin-inline: auto;
  padding: 0 7px 0 10px;
  border-radius: 999px;
  /* The raised ground: the landing's `--surface`, the same step off the
     ground wherever a page does not name one. */
  background: var(--surface, color-mix(in oklab, var(--foreground) 7%, var(--background)));
  box-shadow: var(--float-shadow);
}

@media (forced-colors: active) {
  .site-capsule {
    border: 1px solid CanvasText;
  }
}

.studio-key {
  height: 34px;
  padding-inline: 16px;
}
</style>
