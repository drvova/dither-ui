<script setup lang="ts">
import { computed } from "vue"
import { docsFramework } from "./svelte"

export type PropRow = { prop: string; type: string; default: string }

const props = defineProps<{ rows: PropRow[] }>()

// The Svelte port binds `value` (`$bindable`) where Vue binds `modelValue`.
const shownRows = computed(() =>
  docsFramework.value === "svelte"
    ? props.rows.map((r) => ({
        ...r,
        prop: r.prop.replace(/\bmodelValue\b/g, "value"),
        type: r.type.replace(/\bv-model\b/g, "bind:value"),
      }))
    : props.rows,
)
</script>

<template>
  <div class="mt-6 overflow-x-auto rounded-lg border border-border/60">
    <table class="w-full table-fixed border-collapse text-left text-[11px]">
      <thead>
        <tr class="border-b border-border/60 text-muted-foreground">
          <th class="w-1/3 px-4 py-2.5 font-medium">Prop</th>
          <th class="px-4 py-2.5 font-medium">Type</th>
          <th class="w-1/4 px-4 py-2.5 font-medium">Default</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in shownRows" :key="r.prop" class="border-b border-border/40 last:border-0">
          <td class="px-4 py-2.5 align-top break-words text-foreground/90">{{ r.prop }}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{{ r.type }}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{{ r.default }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
