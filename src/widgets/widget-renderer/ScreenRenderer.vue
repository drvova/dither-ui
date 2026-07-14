<script setup lang="ts">
import { computed } from "vue"
import { editor, selectLayer } from "@/entities/editor"
import { componentEntry, type ScreenCell, type ScreenModel } from "@/entities/widget"
import * as kit from "@dither-kit"

const props = defineProps<{ screen: ScreenModel; artboardId: string }>()

const JUSTIFY: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
}
const ALIGN: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
}

const resolve = (is: string) => (kit as Record<string, unknown>)[is]
const mapped = (cell: ScreenCell) => {
  const entry = componentEntry(cell.is)
  return entry?.mapProps ? entry.mapProps(cell.props) : cell.props
}
const hasModel = (cell: ScreenCell) => !!componentEntry(cell.is)?.vmodel

const cellId = (cell: ScreenCell) => `${props.artboardId}:cell:${cell.id}`
const isSelected = computed(() => (id: string) => editor.selectedLayerId === id)
</script>

<template>
  <div
    class="flex h-full w-full flex-col overflow-hidden"
    :style="{ gap: `${screen.gap}px`, padding: `${screen.padding}px` }"
  >
    <div
      v-for="row in screen.rows"
      :key="row.id"
      class="flex min-h-6 rounded-sm"
      :class="[
        ALIGN[row.align],
        JUSTIFY[row.justify],
        editor.selectedLayerId === `${artboardId}:row:${row.id}` ? 'ring-1 ring-accent/60' : '',
      ]"
      :style="{ gap: `${row.gap}px` }"
      @pointerdown.stop="selectLayer(`${artboardId}:row:${row.id}`)"
    >
      <div
        v-for="cell in row.cells"
        :key="cell.id"
        class="rounded-sm"
        :class="[cell.grow ? 'flex-1 min-w-0' : '', isSelected(cellId(cell)) ? 'ring-1 ring-accent' : '']"
        @pointerdown.stop="selectLayer(cellId(cell))"
      >
        <component
          :is="resolve(cell.is) as never"
          v-bind="mapped(cell)"
          :model-value="hasModel(cell) ? cell.model : undefined"
          :class="cell.grow ? 'w-full' : ''"
          @update:model-value="hasModel(cell) ? (cell.model = $event) : undefined"
        >
          <template v-if="cell.slotText != null" #default>{{ cell.slotText }}</template>
        </component>
      </div>
      <span
        v-if="row.cells.length === 0"
        class="px-1 text-[10px] text-muted-foreground/50"
        >empty row — add a component in the inspector</span
      >
    </div>
  </div>
</template>
