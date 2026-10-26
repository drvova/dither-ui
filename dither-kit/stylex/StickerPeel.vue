<!-- Generated from ../tailwind/StickerPeel.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  frame2: { position: "relative", zIndex: "1" },
  layer: { pointerEvents: "none", position: "absolute", right: "0px", bottom: "0px" },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = defineProps<{ class?: string; xstyle?: StyleProp }>()
</script>

<template>
  <div :class="cn([styles.frame, 'dither-sticker'], props.xstyle, props.class)">
    <div v-bind="stylex.attrs(styles.frame2)">
      <slot />
    </div>
    <div v-bind="stylex.attrs(styles.layer)" class="dither-peel" aria-hidden="true" />
  </div>
</template>

<style scoped>
/* A dog-ear: the bottom-right corner is a folded flap showing the sticker's
   lighter underside with a soft curl shadow. On hover the fold grows and the
   shadow deepens, reading as the corner peeling up. It stays inside the corner
   (no out-of-bounds rotation), so it never looks like a stray nub. */
.dither-peel {
  width: 20px;
  height: 20px;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  background: linear-gradient(
    135deg,
    rgba(120, 130, 150, 0.25),
    rgba(226, 232, 240, 0.55) 55%,
    rgba(248, 250, 252, 0.72)
  );
  box-shadow: -3px -3px 6px rgba(0, 0, 0, 0.35);
  transition:
    width 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
    height 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 320ms ease;
}
.dither-sticker:hover .dither-peel {
  width: 42px;
  height: 42px;
  box-shadow: -6px -6px 14px rgba(0, 0, 0, 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .dither-peel {
    transition: none;
  }
}
</style>
