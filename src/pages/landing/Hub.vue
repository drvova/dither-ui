<script setup lang="ts">
// The directory: the docs as a browsable shelf under an eyebrow — the kit's
// own DitherTabs (badges = family sizes) over a horizontal shelf of framed
// cards that deep-link into the docs, each with the section's seeded
// identicon (the kit's avatar, from the section id), its family, name, a
// line and its path.
import { ref } from "vue"
import { DitherAvatar, DitherTabPanel, DitherTabs } from "@dither-kit"
import { routePath } from "@/shared/lib"
import { SECTION_COUNT, SHELVES } from "./hub"

const tab = ref("explore")
const TABS = SHELVES.map((s) => ({ value: s.value, label: s.label, badge: s.value === "explore" ? undefined : s.count }))
</script>

<template>
  <section id="directory" aria-labelledby="directory-h" class="directory">
    <div class="list-head">
      <h2 id="directory-h" class="eyebrow">Directory</h2>
      <a :href="routePath('/docs')" class="more-link">all {{ SECTION_COUNT }} sections →</a>
    </div>
    <p class="dir-p">
      Each section is a live demo with its props and copy-ready code. Every component is one file in
      one folder: read it, copy it, change it.
    </p>
    <div class="panel window">
      <DitherTabs v-model="tab" :tabs="TABS" color="grey" class="tabs">
        <DitherTabPanel v-for="s in SHELVES" :key="s.value" :value="s.value" class="shelf">
          <div class="cards">
            <a v-for="c in s.cards" :key="c.id" :href="routePath(`/docs/${c.id}`)" class="thumb card">
              <span class="card-top">
                <span class="card-av" aria-hidden="true"><DitherAvatar :name="c.id" :size="28" :grid="6" :animate="false" color="blue" /></span>
                <span class="micro card-family">{{ c.family }}</span>
              </span>
              <span class="card-name">{{ c.label }}</span>
              <span class="card-note">{{ c.note ?? s.note }}</span>
              <span class="card-path">/docs/{{ c.id }}</span>
            </a>
          </div>
          <a v-if="s.value !== 'explore'" :href="routePath(`/docs/${s.cards[0].id}`)" class="lead shelf-all">
            All {{ s.count }} {{ s.label.toLowerCase() }}
          </a>
        </DitherTabPanel>
      </DitherTabs>
    </div>
  </section>
</template>

<style scoped>
.directory {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dir-p {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-3);
}

.window {
  overflow: hidden;
}

.tabs :deep([role="tablist"]) {
  padding: 0 14px;
  box-shadow: inset 0 -1px 0 var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}

.shelf {
  padding: 14px 0 16px 14px;
}

/* A horizontal shelf that snaps and runs off the panel's edge. */
.cards {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 220px;
  gap: 8px;
  padding-right: 14px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.cards::-webkit-scrollbar {
  display: none;
}

.card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 164px;
  padding: 14px;
  scroll-snap-align: start;
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 22%, transparent);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-av {
  display: block;
  width: 28px;
  height: 28px;
}

.card-family {
  color: var(--ink-3);
}

.card-name {
  margin-top: 14px;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ink);
}

.card-note {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-3);
}

.card-path {
  margin-top: auto;
  font-size: 11px;
  color: var(--ink-3);
}

.shelf-all {
  margin-top: 12px;
}
</style>
