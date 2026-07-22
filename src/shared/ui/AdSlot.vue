<script setup lang="ts">
import { onMounted } from "vue"
import { ETHICALADS_PUBLISHER } from "@/shared/config/ads"

/** One EthicalAds text unit, dressed in the house tokens. Renders nothing
 * without a publisher slug, so the layout never shows a broken box. */
const SCRIPT_ID = "ethicalads-client"
const SCRIPT_SRC = "https://media.ethicalads.io/media/client/ethicalads.min.js"

declare global {
  interface Window {
    ethicalads?: { load: () => void }
  }
}

onMounted(() => {
  if (!ETHICALADS_PUBLISHER) return
  if (window.ethicalads) {
    window.ethicalads.load()
    return
  }
  if (!document.getElementById(SCRIPT_ID)) {
    const s = document.createElement("script")
    s.id = SCRIPT_ID
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => window.ethicalads?.load()
    document.head.appendChild(s)
  }
})
</script>

<template>
  <div v-if="ETHICALADS_PUBLISHER" class="ad-slot mt-8">
    <div
      :data-ea-publisher="ETHICALADS_PUBLISHER"
      data-ea-type="text"
      data-ea-style="adbox"
    />
    <p class="mt-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">ethical ad</p>
  </div>
</template>

<style scoped>
/* Token-dress the network's markup so the unit reads as part of the docs. */
.ad-slot :deep([data-ea-publisher]) {
  font-family: inherit;
}
.ad-slot :deep(.ea-content) {
  margin: 0;
  padding: 0.625rem;
  border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--card) 40%, transparent);
  box-shadow: none;
  color: var(--muted-foreground);
  font-size: 11px;
  line-height: 1.6;
}
.ad-slot :deep(.ea-content a) {
  color: var(--foreground);
  text-decoration: none;
}
.ad-slot :deep(.ea-callout) {
  margin: 0.25rem 0 0;
  font-size: 9px;
  color: color-mix(in oklab, var(--muted-foreground) 60%, transparent);
}
.ad-slot :deep(.ea-callout a) {
  color: inherit;
}
</style>
