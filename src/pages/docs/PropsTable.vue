<script setup lang="ts">
export type PropRow = { prop: string; type: string; default: string }

defineProps<{ rows: PropRow[] }>()
</script>

<template>
  <div class="mt-6 overflow-x-auto rounded-lg border border-border/60">
    <table class="w-full border-collapse text-left text-[11px]">
      <thead>
        <tr class="border-b border-border/60 text-muted-foreground">
          <th class="px-4 py-2.5 font-medium">Prop</th>
          <th class="px-4 py-2.5 font-medium">Type</th>
          <th class="px-4 py-2.5 font-medium">Default</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.prop" class="border-b border-border/40 last:border-0">
          <td class="px-4 py-2.5 whitespace-nowrap text-foreground/90">{{ r.prop }}</td>
          <td class="px-4 py-2.5 text-muted-foreground">{{ r.type }}</td>
          <td class="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{{ r.default }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
