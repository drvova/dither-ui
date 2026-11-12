// The panel beside the canvas: the selection's properties and the
// project's layers, a tab each, the choice remembered for the next visit.
import { createSignal, For, onMount } from "solid-js"
import { readJson, writeJson } from "@/shared/lib/storage"
import { Inspector } from "~/widgets/inspector"
import { LayerTree } from "~/widgets/layer-tree"
import "./StudioPanel.css"

type Tab = "properties" | "layers"
const TABS: { id: Tab; label: string }[] = [
  { id: "properties", label: "Properties" },
  { id: "layers", label: "Layers" },
]
const KEY = "dither-studio-panel-tab"

export default function StudioPanel() {
  // A server render knows no choice: the kept one comes back as it mounts.
  const [tab, setTab] = createSignal<Tab>("properties")
  onMount(() => setTab(readJson(KEY) === "layers" ? "layers" : "properties"))
  function pick(t: Tab) {
    if (t === tab()) return
    setTab(t)
    writeJson(KEY, t)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    pick(tab() === "properties" ? "layers" : "properties")
    document.getElementById(`panel-tab-${tab()}`)?.focus()
  }

  return (
    <div class="studio-panel-scope panel">
      <div class="tabs" role="tablist" aria-label="Panel" onKeyDown={onKey}>
        <For each={TABS}>
          {(t) => (
            <button
              id={`panel-tab-${t.id}`}
              type="button"
              role="tab"
              class="tab"
              aria-selected={tab() === t.id}
              aria-controls={`panel-${t.id}`}
              tabindex={tab() === t.id ? 0 : -1}
              onClick={() => pick(t.id)}
            >
              {t.label}
            </button>
          )}
        </For>
      </div>
      <div
        style={{ display: tab() === "properties" ? undefined : "none" }}
        id="panel-properties"
        role="tabpanel"
        aria-labelledby="panel-tab-properties"
        class="body"
      >
        <Inspector />
      </div>
      <div
        style={{ display: tab() === "layers" ? undefined : "none" }}
        id="panel-layers"
        role="tabpanel"
        aria-labelledby="panel-tab-layers"
        class="body layers"
      >
        <LayerTree />
      </div>
    </div>
  )
}
