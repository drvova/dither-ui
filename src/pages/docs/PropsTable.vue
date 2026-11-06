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
  <!-- The API as a spec sheet: a flat shell (one hairline; the page's one
       shaped panel is the demo's well) under spec-label column heads; on a phone, where
       three columns cannot fit, each prop stacks over its type and default.
       The type column carries the notes, so it takes the most room. -->
  <div class="flat-shell mt-6 hidden overflow-x-auto sm:block">
    <table class="w-full table-fixed border-collapse text-left text-[11px]">
      <thead>
        <tr class="border-b border-border/60 text-muted-foreground">
          <th class="spec w-[24%] px-4 py-2.5">Prop</th>
          <th class="spec px-4 py-2.5">Type</th>
          <th class="spec w-[20%] px-4 py-2.5">Default</th>
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
  <dl class="flat-shell mt-6 overflow-hidden text-[12px] sm:hidden">
    <div v-for="r in shownRows" :key="r.prop" class="border-b border-border/40 px-4 py-3 last:border-0">
      <dt class="break-words text-foreground/90">{{ r.prop }}</dt>
      <dd class="mt-1.5 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-muted-foreground">
        <span class="spec">Type</span><span class="break-words">{{ r.type }}</span> <span class="spec">Default</span
        ><span class="break-words">{{ r.default || "none" }}</span>
      </dd>
    </div>
  </dl>
</template>
