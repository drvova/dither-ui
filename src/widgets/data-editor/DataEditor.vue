<script setup lang="ts">
import { computed } from "vue"
import {
  addRow,
  addSeries,
  LABEL_KEY,
  removeRow,
  renamePieSlice,
} from "@/entities/chart"
import { editor, selectedArtboard, selectedChart } from "@/entities/editor"
import { familyOf } from "@/shared/config"
import { cssColor } from "@dither-kit"

const chart = selectedChart
const isChartFrame = computed(
  () => !!selectedArtboard.value && !selectedArtboard.value.widget
)
const fam = computed(() => (chart.value ? familyOf(chart.value.type) : "cartesian"))
const labelKey = computed(() => LABEL_KEY[fam.value])
const columns = computed(() =>
  fam.value === "pie" ? [] : chart.value?.series.filter((s) => s.on) ?? []
)

function onPieName(index: number, e: Event) {
  if (!chart.value) return
  renamePieSlice(chart.value, index, (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div
    v-if="editor.dataOpen && chart && isChartFrame"
    class="absolute inset-x-0 bottom-0 z-20 max-h-64 border-t border-border bg-card/95 backdrop-blur"
  >
    <div class="flex h-9 items-center justify-between border-b border-border/60 px-3">
      <span class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Data</span>
      <div class="flex items-center gap-1.5">
        <button
          v-if="fam !== 'pie'"
          type="button"
          class="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          @click="addSeries(chart)"
        >
          + series
        </button>
        <button
          type="button"
          class="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          @click="addRow(chart)"
        >
          + row
        </button>
        <button
          type="button"
          class="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          aria-label="Close data editor"
          @click="editor.dataOpen = false"
        >
          ×
        </button>
      </div>
    </div>

    <div class="max-h-[220px] overflow-auto p-2">
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr class="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th class="px-2 py-1 font-medium">{{ labelKey }}</th>
            <template v-if="fam === 'pie'">
              <th class="px-2 py-1 font-medium">value</th>
            </template>
            <th v-for="s in columns" :key="s.key" class="px-2 py-1 font-medium">
              <span class="inline-flex items-center gap-1.5">
                <span class="size-2 rounded-[2px]" :style="{ backgroundColor: cssColor(s.color) }" />
                {{ s.label }}
              </span>
            </th>
            <th class="w-8" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in chart.rows" :key="i" class="border-t border-border/40">
            <td class="px-1 py-0.5">
              <input
                v-if="fam === 'pie'"
                :value="row.name"
                type="text"
                :name="`row-${i}-name`"
                autocomplete="off"
                class="w-full min-w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-foreground outline-none hover:border-border focus:border-accent/60"
                @change="onPieName(i, $event)"
              />
              <input
                v-else
                v-model="row[labelKey]"
                type="text"
                :name="`row-${i}-label`"
                autocomplete="off"
                class="w-full min-w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-foreground outline-none hover:border-border focus:border-accent/60"
              />
            </td>
            <td v-if="fam === 'pie'" class="px-1 py-0.5">
              <input
                v-model.number="row.value"
                type="number"
                :name="`row-${i}-value`"
                class="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 tabular-nums text-foreground outline-none [appearance:textfield] hover:border-border focus:border-accent/60 [&::-webkit-inner-spin-button]:appearance-none"
              />
            </td>
            <td v-for="s in columns" :key="s.key" class="px-1 py-0.5">
              <input
                v-model.number="row[s.key]"
                type="number"
                :name="`row-${i}-${s.key}`"
                class="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 tabular-nums text-foreground outline-none [appearance:textfield] hover:border-border focus:border-accent/60 [&::-webkit-inner-spin-button]:appearance-none"
              />
            </td>
            <td class="px-1 text-right">
              <button
                type="button"
                class="rounded px-1 text-muted-foreground/60 transition-colors hover:text-red-400"
                :aria-label="`Delete row ${i + 1}`"
                @click="removeRow(chart, i)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
