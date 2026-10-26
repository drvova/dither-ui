<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"

/** The taxonomy's IntersectionObserver primitive, named for what it does:
 * scoped-slot visibility. `once` (default) latches after the first enter —
 * the lazy-reveal shape every section of this site's docs uses. Without
 * IntersectionObserver the slot renders as always-in-view, so degraded
 * engines see content instead of an empty box. */
const props = withDefaults(
  defineProps<{
    rootMargin?: string
    threshold?: number
    once?: boolean
    class?: string
  }>(),
  { rootMargin: "200px", threshold: 0, once: true },
)

const emit = defineEmits<{ enter: []; leave: [] }>()
const root = ref<HTMLElement | null>(null)
const inView = ref(typeof IntersectionObserver === "undefined")
let io: IntersectionObserver | null = null
let done = false

function connect() {
  if (inView.value || typeof IntersectionObserver === "undefined" || !root.value) return
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          inView.value = true
          emit("enter")
          if (props.once) {
            io?.disconnect()
            io = null
            done = true
          }
        } else if (!props.once && !done) {
          inView.value = false
          emit("leave")
        }
      }
    },
    { rootMargin: props.rootMargin, threshold: props.threshold },
  )
  io.observe(root.value)
}

watch(root, connect)
onBeforeUnmount(() => {
  io?.disconnect()
  io = null
})
</script>

<template>
  <div ref="root">
    <slot :in-view="inView" />
  </div>
</template>
