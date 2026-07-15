<script setup lang="ts">
import { computed } from "vue"
import { editor } from "@/entities/editor"
import { componentEntry, type WidgetModel } from "@/entities/widget"
import * as kit from "@dither-kit"
import {
  DitherAvatar, DitherButton, DitherGradient, DitherImage, toast,
} from "@dither-kit"
import ScreenRenderer from "./ScreenRenderer.vue"

const props = defineProps<{ widget: WidgetModel; artboardId: string }>()
const rt = computed(() => editor.replayToken)
const w = computed(() => props.widget)

// Registry-driven kit component: resolve by export name, map list props.
const comp = computed(() =>
  w.value.kind === "component"
    ? (kit as Record<string, unknown>)[w.value.is]
    : null
)
const compProps = computed(() => {
  if (w.value.kind !== "component") return {}
  const entry = componentEntry(w.value.is)
  return entry?.mapProps ? entry.mapProps(w.value.props) : w.value.props
})
const hasModel = computed(
  () => w.value.kind === "component" && !!componentEntry(w.value.is)?.vmodel
)
const entry = computed(() => w.value.kind === "component" ? componentEntry(w.value.is) : undefined)
const modelProp = computed(() => entry.value?.vmodel?.prop ?? "modelValue")
const modelEvent = computed(() => entry.value?.vmodel?.event ?? "update:modelValue")
const updateModel = (value: unknown) => { if (w.value.kind === "component") w.value.model = value }
const triggerToast = () => {
  if (w.value.kind === "component") toast(String(w.value.props.message), { color: w.value.props.color as never })
}
</script>

<template>
  <!-- AVATAR — sized to fill the frame's shorter side -->
  <div v-if="w.kind === 'avatar'" class="flex h-full w-full items-center justify-center">
    <DitherAvatar
      :name="w.name"
      :pattern="w.source !== 'seed' && w.pattern ? w.pattern : undefined"
      :color="w.autoColor ? undefined : w.color"
      :mirror="w.mirror"
      :grid="w.grid"
      :cell-px="w.cellPx"
      :density="w.density"
      :off-tier="w.offTier"
      :bloom="w.bloom"
      :animate="w.animate"
      :animation-duration="w.animationDuration"
      :replay-token="rt"
      class="h-full max-h-full w-auto rounded-lg"
      style="aspect-ratio: 1"
    />
  </div>

  <!-- BUTTON — centred at natural size -->
  <div v-else-if="w.kind === 'button'" class="flex h-full w-full items-center justify-center">
    <DitherButton
      :key="`${w.color}-${w.variant}-${w.cell}-${JSON.stringify(w.bloom)}`"
      :color="w.color"
      :variant="w.variant"
      :cell="w.cell"
      :bloom="w.bloom"
      class="px-6 py-3 text-sm"
      >{{ w.label }}</DitherButton
    >
  </div>

  <!-- REGISTRY COMPONENT — generic by default, composed where context/slots require it. -->
  <div v-else-if="w.kind === 'component'" class="flex h-full w-full items-center justify-center overflow-visible p-2">
    <component
      :is="comp as never"
      v-if="comp && !entry?.demo"
      v-bind="compProps"
      :[modelProp]="hasModel ? w.model : undefined"
      class="max-h-full max-w-full"
      @[modelEvent]="updateModel"
    >
      <template v-if="w.slotText != null" #default>{{ w.slotText }}</template>
    </component>

    <component :is="kit.DitherTabs" v-else-if="entry?.demo === 'tab-panel'" :tabs="['One', 'Two']" model-value="One">
      <component :is="kit.DitherTabPanel" value="One">{{ w.slotText }}</component>
    </component>
    <component :is="comp as never" v-else-if="entry?.demo === 'field'" v-bind="compProps">
      <component :is="kit.DitherInput" placeholder="you@example.com" />
    </component>
    <component :is="comp as never" v-else-if="entry?.demo === 'fieldset'" v-bind="compProps">
      <component :is="kit.DitherField" label="Name"><component :is="kit.DitherInput" /></component>
    </component>
    <component :is="comp as never" v-else-if="entry?.demo === 'form'" v-bind="compProps" class="grid w-full gap-3">
      <component :is="kit.DitherField" label="Email"><component :is="kit.DitherInput" /></component>
      <component :is="kit.DitherButton">Submit</component>
    </component>
    <component :is="comp as never" v-else-if="entry?.demo === 'toolbar'" v-bind="compProps">
      <component :is="kit.DitherToggle" :model-value="false">Bold</component>
      <component :is="kit.DitherToggle" :model-value="false">Italic</component>
    </component>
    <component :is="comp as never" v-else-if="entry?.demo === 'sidebar'" v-bind="compProps" :model-value="w.model" @update:model-value="updateModel">
      <component :is="kit.DitherSidebarGroup" label="Workspace">
        <component :is="kit.DitherSidebarItem" label="Dashboard" active badge="3" />
        <component :is="kit.DitherSidebarSub" label="Projects" :model-value="true">
          <component :is="kit.DitherSidebarItem" label="Website" />
        </component>
      </component>
    </component>
    <button v-else-if="entry?.demo === 'toaster'" type="button" class="demo-trigger" @click="triggerToast">Show toast</button>
    <template v-else-if="entry?.demo === 'popover' || entry?.demo === 'preview-card'">
      <component :is="comp as never" v-bind="compProps" :open="w.model" @close="updateModel(false)">
        <template #trigger><button type="button" class="demo-trigger" @click="updateModel(true)">Open {{ entry.label.toLowerCase() }}</button></template>
        {{ w.slotText }}
      </component>
    </template>
    <template v-else-if="entry?.demo === 'dialog' || entry?.demo === 'alert' || entry?.demo === 'drawer'">
      <button type="button" class="demo-trigger" @click="updateModel(true)">Open {{ entry.label.toLowerCase() }}</button>
      <component :is="comp as never" v-bind="compProps" :open="w.model" @close="updateModel(false)" @cancel="updateModel(false)" @confirm="updateModel(false)">{{ w.slotText }}</component>
    </template>
    <template v-else-if="entry?.demo === 'swipe-area'">
      <span class="text-xs text-muted-foreground">Swipe inward from the {{ w.props.side }} edge</span>
      <component :is="comp as never" v-bind="compProps" @open="updateModel(true)" />
    </template>
    <template v-else-if="entry?.demo === 'drawer-indent'">
      <component :is="comp as never" class="rounded-lg border border-border p-6">{{ w.slotText }}</component>
      <button type="button" class="demo-trigger absolute bottom-3" @click="updateModel(true)">Preview indent</button>
      <component :is="kit.DitherDrawer" :open="w.model as boolean" title="Nested drawer" @close="updateModel(false)">Drawer content</component>
    </template>
  </div>

  <!-- IMAGE — fills the frame -->
  <div v-else-if="w.kind === 'image'" class="relative h-full w-full overflow-hidden rounded-md">
    <DitherImage
      :key="`${w.src}-${w.cell}-${w.focusY}-${w.fade}`"
      :src="w.src"
      :alt="w.alt"
      :cell="w.cell"
      :focus-y="w.focusY"
      :fade="w.fade"
      class="h-full w-full"
    />
  </div>

  <!-- SCREEN — composed rows of registry components -->
  <ScreenRenderer v-else-if="w.kind === 'screen'" :screen="w" :artboard-id="artboardId" />

  <!-- GRADIENT — fills the frame -->
  <div v-else class="relative h-full w-full overflow-hidden rounded-md">
    <DitherGradient
      :key="`${w.from}-${w.twoTone}-${w.to}-${w.direction}-${w.cell}-${w.opacity}-${JSON.stringify(w.bloom)}`"
      :from="w.from"
      :to="w.twoTone ? w.to : 'transparent'"
      :direction="w.direction"
      :cell="w.cell"
      :opacity="w.opacity"
      :bloom="w.bloom"
    />
  </div>
</template>

<style scoped>
.demo-trigger { border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-card); padding: 0.5rem 0.75rem; font: 12px monospace; color: var(--color-foreground); transition: background-color 140ms ease, scale 100ms ease; }
.demo-trigger:hover { background: var(--color-background); }
.demo-trigger:active { scale: 0.96; }
</style>
