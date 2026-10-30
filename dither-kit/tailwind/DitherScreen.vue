<script setup lang="ts">
import { provide, toRef } from "vue"
import type { ScreenKind } from "../engine/pixel"
import { SCREEN } from "../engine/use-screen"

/* Prints everything inside it through one screen: every pixel surface and
   chart below it reads its threshold matrix from here, so a line, hatch,
   dot or cross screen replaces the Bayer pattern without a prop on each. */
const props = withDefaults(defineProps<{ screen?: ScreenKind }>(), { screen: "diagonal" })
provide(SCREEN, toRef(props, "screen"))
</script>

<template>
  <slot />
</template>
