// The floating tool tray (after Kobra's): the group switch, the group's
// tools, then the toggles and the utilities. A toolbar: Left/Right move
// between its buttons; every tool names its key.
import { createMemo, For, Show } from "solid-js"
import { ICONS, TOGGLES, TOOLS } from "@/widgets/workbench/model/tools"
import { useBench } from "../context"
import Icon from "./Icon"
import "./Tray.css"

export default function Tray() {
  const b = useBench()
  let bar: HTMLDivElement | undefined
  const tools = createMemo(() => TOOLS.filter((t) => t.group === b.group()))
  const canUndo = createMemo(() => (b.revision(), b.history.canUndo))
  const canRedo = createMemo(() => (b.revision(), b.history.canRedo))

  function roam(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
    e.preventDefault()
    e.stopPropagation()
    const buttons = [...(bar?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])]
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? buttons.length - 1
          : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  return (
    <div
      ref={(el) => (bar = el)}
      class={b.settings.tray === "top" ? "wb-tray tray-scope top" : "wb-tray tray-scope"}
      role="toolbar"
      aria-label="Workbench tools"
      on:pointerdown={(e) => e.stopPropagation()}
      on:keydown={roam}
    >
      <Show
        when={!b.minimized()}
        fallback={
          <button
            type="button"
            class="wb-key"
            aria-label={`Show the tools${b.tool() ? ` (${b.tool()} in hand)` : ""}`}
            title="Show the tools"
            onClick={() => b.setMinimized(false)}
          >
            <Icon d={b.group() === 1 ? ICONS.group1 : ICONS.group2} />
          </button>
        }
      >
        <div class="wb-seg" role="group" aria-label="Tool group">
          <button
            type="button"
            class="wb-key"
            aria-pressed={b.group() === 1}
            aria-label="Select and inspect tools (1)"
            aria-keyshortcuts="1"
            title="Inspect tools (1)"
            onClick={() => b.setGroup(1)}
          >
            <Icon d={ICONS.group1} />
          </button>
          <button
            type="button"
            class="wb-key"
            aria-pressed={b.group() === 2}
            aria-label="Annotate tools (2)"
            aria-keyshortcuts="2"
            title="Annotate tools (2)"
            onClick={() => b.setGroup(2)}
          >
            <Icon d={ICONS.group2} />
          </button>
        </div>
        <span class="wb-sep" aria-hidden="true" />
        <For each={tools()}>
          {(t) => (
            <button
              type="button"
              class="wb-key"
              aria-pressed={b.tool() === t.id}
              aria-label={`${t.label} (${t.key.toUpperCase()})`}
              aria-keyshortcuts={t.key}
              title={`${t.label} (${t.key.toUpperCase()})`}
              onClick={() => b.setTool(t.id)}
            >
              <Icon d={t.icon} />
            </button>
          )}
        </For>
        <span class="wb-sep" aria-hidden="true" />
        <For each={TOGGLES}>
          {(t) => (
            <button
              type="button"
              class="wb-key"
              aria-pressed={b.toggles[t.id]}
              aria-label={`${t.label} (${t.key.toUpperCase()})`}
              aria-keyshortcuts={t.key}
              title={`${t.label} (${t.key.toUpperCase()})`}
              onClick={() => b.toggle(t.id)}
            >
              <Icon d={t.icon} />
            </button>
          )}
        </For>
        <span class="wb-sep" aria-hidden="true" />
        <button
          type="button"
          class="wb-key"
          disabled={!canUndo()}
          aria-label="Undo (⌘Z)"
          aria-keyshortcuts="Control+Z Meta+Z"
          title="Undo (⌘Z)"
          onClick={() => b.undo()}
        >
          <Icon d={ICONS.undo} />
        </button>
        <button
          type="button"
          class="wb-key"
          disabled={!canRedo()}
          aria-label="Redo (⇧⌘Z)"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
          title="Redo (⇧⌘Z)"
          onClick={() => b.redo()}
        >
          <Icon d={ICONS.redo} />
        </button>
        <button
          type="button"
          class="wb-key"
          aria-label={`${b.feedbackVerb} (K)`}
          aria-keyshortcuts="k"
          title={`${b.feedbackVerb} (K)`}
          onClick={() => b.copyForAgent()}
        >
          <Icon d={ICONS.agent} />
        </button>
        <button
          type="button"
          class="wb-key"
          aria-pressed={b.panel() === "settings"}
          aria-label="Settings (,)"
          aria-keyshortcuts=","
          title="Settings (,)"
          onClick={() => b.setPanel(b.panel() === "settings" ? null : "settings")}
        >
          <Icon d={ICONS.settings} />
        </button>
        <button
          type="button"
          class="wb-key"
          aria-label="Minimize the tray"
          title="Minimize"
          onClick={() => b.setMinimized(true)}
        >
          <Icon d="M3.5 8h9" />
        </button>
      </Show>
    </div>
  )
}
