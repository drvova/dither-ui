<script setup lang="ts">
import { computed } from "vue"
import { docsFramework } from "./svelte"

// A row's `default` is the value as code; "" when the prop has none (shown
// as "none").
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
  <!-- The API as a spec sheet: a hardshell (two corners cut, the chrome
       glint along them) under spec-label column heads. -->
  <div class="hardshell mt-6 overflow-x-auto [--cut:10px]">
    <table class="w-full table-fixed border-collapse text-left text-[11px]">
      <thead>
        <tr class="border-b border-border/60 text-muted-foreground">
          <th class="spec w-1/3 px-4 py-2.5">Prop</th>
          <th class="spec px-4 py-2.5">Type</th>
          <th class="spec w-1/4 px-4 py-2.5">Default</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in shownRows" :key="r.prop" class="border-b border-border/40 last:border-0">
          <td class="px-4 py-2.5 align-top break-words text-foreground/90">{{ r.prop }}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{{ r.type }}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{{ r.default || "none" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
