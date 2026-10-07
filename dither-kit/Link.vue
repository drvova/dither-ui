<script setup lang="ts">
import { cn } from "./lib"

/** The anchor, dressed: house underline treatment (hairline, grows its
 * offset, brightens on hover) and inheritable color so it sits in prose. */
const props = withDefaults(
  defineProps<{
    href: string
    external?: boolean
    class?: string
  }>(),
  { external: false },
)
</script>

<template>
  <a
    :href="props.href"
    :target="props.external ? '_blank' : undefined"
    :rel="props.external ? 'noreferrer' : undefined"
    :class="
      cn(
        'underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60',
        props.class,
      )
    "
  >
    <slot />
  </a>
</template>
