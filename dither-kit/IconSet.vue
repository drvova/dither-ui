<script setup lang="ts">
import { ICONS } from "./icons"

/** Stamps the whole set as `<symbol>` sheets once (id: `di-icon-<Name>`) for
 * consumers who want `<use href="#di-icon-Name">` instead of repeated inline
 * svgs — one DOM cost for many glyphs. Renders hidden and aria-hidden; mount
 * it once near the app root. `DitherIcon` needs no sprite and works
 * standalone, so this is opt-in, not a prerequisite. `class` and other attrs
 * fall through to the svg. */

const names = Object.keys(ICONS) as Array<keyof typeof ICONS>
</script>

<template>
  <svg aria-hidden="true" focusable="false" style="display: none">
    <symbol v-for="name in names" :id="`di-icon-${name}`" :key="name" viewBox="0 0 24 24" fill="none">
      <path
        v-for="(d, i) in ICONS[name]"
        :key="i"
        :d="d"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </symbol>
  </svg>
</template>
