import { createSignal, For } from "solid-js"
import { DitherTabPanel, DitherTabs } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const tabs = ["Overview", "Metrics", "Logs"]
  const panels: Record<string, string> = {
    Overview: "Requests are steady; nothing on fire.",
    Metrics: "p95 latency 42ms, error rate 0.02%.",
    Logs: "3 warnings in the last hour, zero errors.",
  }
  const [tab, setTab] = createSignal("Overview")

  return (
    <div class="mx-auto max-w-sm">
      <DitherTabs modelValue={tab()} onUpdateModelValue={setTab} tabs={tabs} color="blue">
        <For each={tabs}>
          {(t) => (
            <DitherTabPanel value={t} class="mt-4">
              <p class="text-[12px] text-muted-foreground">{panels[t]}</p>
            </DitherTabPanel>
          )}
        </For>
      </DitherTabs>
    </div>
  )
}

export const meta = defineExample({
  component: DitherTabs,
  title: "Tabs",
  studio: {
    group: "inputs",
    frame: { w: 340, h: 110 },
    controls: { color: {}, tabs: { kind: "list", demo: ["One", "Two", "Three"] }, variant: {}, orientation: {} },
    model: { demo: "One" },
  },
})
