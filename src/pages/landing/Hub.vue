<script setup lang="ts">
// The directory: the docs as a browsable shelf — the kit's own DitherTabs
// (badges = family sizes) over a horizontal shelf of cards that deep-link
// into the docs, each with the section's seeded identicon (the kit's
// avatar, from the section id), its family, name, a line and its path.
import { ref } from "vue"
import { DitherAvatar, DitherTabPanel, DitherTabs } from "@dither-kit"
import { routePath } from "@/shared/lib"
import { SECTION_COUNT, SHELVES } from "./hub"

const tab = ref("explore")
const TABS = SHELVES.map((s) => ({ value: s.value, label: s.label, badge: s.value === "explore" ? undefined : s.count }))
</script>

<template>
  <section id="directory" aria-labelledby="directory-h" class="directory mx-auto w-full px-6">
    <div class="reveal">
      <h2 id="directory-h" class="section-h">Directory</h2>
      <p class="section-p">
        {{ SECTION_COUNT }} sections, each a live demo with its props and copy-ready code. Every
        component is one file in one folder: read it, copy it, change it.
      </p>
    </div>
    <div class="window reveal">
      <DitherTabs v-model="tab" :tabs="TABS" color="orange" class="tabs">
        <DitherTabPanel v-for="s in SHELVES" :key="s.value" :value="s.value" class="shelf">
          <div class="cards">
            <a v-for="c in s.cards" :key="c.id" :href="routePath(`/docs/${c.id}`)" class="card">
              <span class="card-top">
                <span class="card-av" aria-hidden="true"><DitherAvatar :name="c.id" :size="28" :grid="6" :animate="false" color="blue" /></span>
                <span class="card-family">{{ c.family }}</span>
              </span>
              <span class="card-name">{{ c.label }}</span>
              <span class="card-note">{{ c.note ?? s.note }}</span>
              <span class="card-path">/docs/{{ c.id }}</span>
            </a>
          </div>
          <a v-if="s.value !== 'explore'" :href="routePath(`/docs/${s.cards[0].id}`)" class="shelf-all">
            All {{ s.count }} {{ s.label.toLowerCase() }} →
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
  gap: 22px;
  max-width: calc(var(--column) + 3rem);
  padding-bottom: var(--section);
}

.window {
  overflow: hidden;
  border-radius: 12px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--line);
}

.tabs :deep([role="tablist"]) {
  padding: 0 12px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}

.shelf {
  padding: 16px 0 18px 16px;
}

/* A horizontal shelf that snaps and runs off the window's edge. */
.cards {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 220px;
  gap: 8px;
  padding-right: 16px;
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
  height: 168px;
  padding: 14px;
  border-radius: 8px;
  scroll-snap-align: start;
  background: var(--surface-2);
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  background: #23252a;
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
  font-size: 0.75rem;
  color: var(--ink-3);
}

.card-name {
  margin-top: 12px;
  overflow: hidden;
  font-size: 0.9375rem;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ink);
}

.card-note {
  display: -webkit-box;
  margin-top: 3px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--ink-2);
}

.card-path {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--ink-3);
}

.shelf-all {
  display: inline-block;
  margin-top: 14px;
  font-size: 0.8125rem;
  color: var(--ink-2);
}

.shelf-all:hover {
  color: var(--ink);
}
</style>
