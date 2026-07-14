<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"
import { LandingPage } from "@/pages/landing"
import { StudioPage } from "@/pages/studio"

// ponytail: hash routing, swap for vue-router when a third page appears
const hash = ref(window.location.hash)
const onHash = () => (hash.value = window.location.hash)
window.addEventListener("hashchange", onHash)
onBeforeUnmount(() => window.removeEventListener("hashchange", onHash))
</script>

<template>
  <StudioPage v-if="hash === '#/studio'" />
  <LandingPage v-else />
</template>
