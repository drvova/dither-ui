<script setup lang="ts">
// What the chat shows when no bridge answers: the one line that starts it,
// to copy, and the panel looking for it until it does (or a while passes).
import { computed, ref } from "vue"
import { copyText, DitherIcon } from "@dither-kit"
import { bridgeCommand } from "@/features/agent/acp"
import { BRIDGE_FILE } from "@/features/agent/bridge-file"
import { assetPath } from "@/shared/lib/routes"
import Mascot from "@/shared/ui/Mascot.vue"

const props = defineProps<{ looking: boolean; url: string }>()
const emit = defineEmits<{ look: [] }>()

const command = computed(() =>
  bridgeCommand(new URL(location.href), new URL(assetPath(BRIDGE_FILE), location.origin), props.url),
)
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  if (!(await copyText(command.value))) return
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <section class="setup" aria-labelledby="bridge-setup-title">
    <div class="setup-head">
      <Mascot :size="26" alive class="setup-mascot" />
      <h3 id="bridge-setup-title" class="setup-title">Start the bridge</h3>
    </div>
    <p class="setup-note">
      Your harness runs on your machine, signed in as you. The bridge connects it to this tab. Run this in the folder it
      should work in:
    </p>
    <div class="setup-line">
      <code class="setup-cmd">{{ command }}</code>
      <button
        type="button"
        class="setup-copy"
        :aria-label="copied ? 'Copied' : 'Copy the command'"
        :title="copied ? 'Copied' : 'Copy the command'"
        @click="copy"
      >
        <DitherIcon :name="copied ? 'Check' : 'Copy'" :size="13" :stroke-width="1.5" />
      </button>
    </div>
    <p class="setup-status" role="status">
      <template v-if="props.looking"
        ><span class="spin" aria-hidden="true"></span>Looking for it at {{ props.url }}</template
      >
      <template v-else
        >Stopped looking. <button type="button" class="setup-again" @click="emit('look')">Look again</button></template
      >
    </p>
    <p class="setup-note">
      Working in a clone of dither-ui? <code>node bridge/dither-bridge.mjs</code> runs the same bridge.
    </p>
  </section>
</template>

<style scoped>
.setup {
  display: grid;
  gap: 10px;
  margin: 4px 0 8px;
  padding: 14px;
  border-radius: 14px;
  background: var(--well, var(--color-card));
}
.setup-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.setup-mascot {
  color: var(--color-foreground);
}
.setup-title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-foreground);
}
.setup-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-muted-foreground);
}
.setup-note code {
  color: var(--color-foreground);
}
.setup-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 10px;
  padding: 8px 8px 8px 10px;
  background: var(--color-background);
}
.setup-cmd {
  min-width: 0;
  flex: 1;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
  user-select: all;
}
.setup-copy {
  display: grid;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 6px;
  color: var(--color-muted-foreground);
  transition: color 200ms var(--ease-settle);
}
.setup-copy:hover {
  color: var(--color-foreground);
}
.setup-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  color: var(--color-muted-foreground);
  overflow-wrap: anywhere;
}
.setup-again {
  min-height: 1.5rem;
  border-radius: 6px;
  padding-inline: 6px;
  color: var(--color-foreground);
  background: var(--color-card);
}
.setup-copy:focus-visible,
.setup-again:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: -2px;
}
.spin {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.25px color-mix(in oklab, var(--color-foreground) 25%, transparent);
  border-top: 1.25px solid var(--color-foreground);
}
@media (prefers-reduced-motion: no-preference) {
  .spin {
    animation: setup-spin 0.9s linear infinite;
  }
}
@keyframes setup-spin {
  to {
    rotate: 1turn;
  }
}
@media (prefers-reduced-motion: reduce) {
  .setup-copy {
    transition: none;
  }
}
</style>
