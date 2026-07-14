<script setup lang="ts">
import type { ComponentEntry } from "@/entities/widget"
import { colorToHex } from "@dither-kit"
import { ColorField, NumberField, Segmented, Toggle } from "@/shared/ui"

/** Spec-driven prop controls for a registry component — shared between the
 * standalone component artboard panel and screen-cell editing. */
const props = defineProps<{
  entry: ComponentEntry
  target: { props: Record<string, unknown>; slotText: string | null }
}>()

const listText = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""))
function setList(key: string, e: Event) {
  props.target.props[key] = (e.target as HTMLInputElement).value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
const asFieldColor = (c: unknown) =>
  (typeof c === "number" ? colorToHex(c) : c) as string
</script>

<template>
  <div class="flex flex-col gap-3">
    <label v-if="target.slotText != null" class="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span class="w-14 shrink-0">text</span>
      <input v-model="target.slotText" type="text" name="component-slot" autocomplete="off" class="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-accent/60" />
    </label>
    <template v-for="spec in entry.props" :key="spec.key">
      <label v-if="spec.kind === 'text'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">{{ spec.key }}</span>
        <input v-model="(target.props[spec.key] as string)" type="text" :name="`prop-${spec.key}`" autocomplete="off" class="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-accent/60" />
      </label>
      <label v-else-if="spec.kind === 'list'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">{{ spec.key }}</span>
        <input :value="listText(target.props[spec.key])" type="text" :name="`prop-${spec.key}`" autocomplete="off" placeholder="One, Two, Three" class="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-accent/60" @change="setList(spec.key, $event)" />
      </label>
      <NumberField v-else-if="spec.kind === 'number'" :model-value="(target.props[spec.key] as number)" :label="spec.key" :min="spec.min" :max="spec.max" :step="spec.step" @update:model-value="target.props[spec.key] = $event" />
      <Segmented v-else-if="spec.kind === 'select'" :model-value="(target.props[spec.key] as string)" :options="spec.options" :label="spec.key" @update:model-value="target.props[spec.key] = $event" />
      <div v-else-if="spec.kind === 'color'" class="text-[11px] text-muted-foreground">
        <span class="mb-1 block">{{ spec.key }}</span>
        <ColorField :model-value="asFieldColor(target.props[spec.key])" @update:model-value="target.props[spec.key] = $event" />
      </div>
      <Toggle v-else-if="spec.kind === 'boolean'" :model-value="(target.props[spec.key] as boolean)" :label="spec.key" @update:model-value="target.props[spec.key] = $event" />
    </template>
  </div>
</template>
