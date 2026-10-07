<script setup lang="ts">
import { onMounted, ref } from "vue"
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

const root = ref<HTMLElement | null>(null)
let scheduled = false
let io: IntersectionObserver | null = null

function start() {
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
}

/** Eligible: load the library once the document has finished loading plus a
 * beat, so its work (measured: ~440 rAF/s the moment it evaluates) lands
 * clear of first paint, LCP and the mount tasks. */
function schedule() {
  if (scheduled) return
  scheduled = true
  const go = () => setTimeout(start, 1500)
  if (document.readyState === "complete") go()
  else window.addEventListener("load", go, { once: true })
}

onMounted(() => {
  if (!ETHICALADS_PUBLISHER) return
  // Gate on the slot actually approaching the viewport: the aside is
  // display:none under lg, so phones never pay for the ad at all. The gate is
  // IntersectionObserver on purpose — Safari has no requestIdleCallback —
  // and an 8s-after-load safety net means a missed observation can never
  // strand the unit. The guard on `started` keeps both paths single-fire.
  if (typeof IntersectionObserver !== "undefined" && root.value) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io?.disconnect()
          io = null
          schedule()
        }
      },
      { rootMargin: "300px" },
    )
    io.observe(root.value)
    window.addEventListener(
      "load",
      () => setTimeout(() => { if (io) { io.disconnect(); io = null; schedule() } }, 8000),
      { once: true },
    )
  } else {
    schedule()
  }
})
</script>

<template>
  <div v-if="ETHICALADS_PUBLISHER" ref="root" class="ad-slot mt-8">
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
