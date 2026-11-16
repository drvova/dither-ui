import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherButton, DitherCommand } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)
  const [ran, setRan] = createSignal("none")
  const items = [
    { value: "new-artboard", label: "New artboard", group: "Studio", kbd: "N" },
    { value: "export-image", label: "Export image", group: "Studio", kbd: "⇧E" },
    { value: "open-docs", label: "Open docs", group: "Navigate" },
    { value: "open-studio", label: "Open studio", group: "Navigate" },
    { value: "toggle-theme", label: "Toggle theme", group: "Preferences" },
  ]
  // the hotkey stays yours
  function hotkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setOpen(!open())
    }
  }
  onMount(() => window.addEventListener("keydown", hotkey))
  onCleanup(() => window.removeEventListener("keydown", hotkey))

  return (
    <div class="grid min-h-28 place-items-center gap-3">
      <DitherButton color="blue" class="px-3 py-1.5 text-[12px]" onClick={() => setOpen(true)}>
        Command (⌘K)
      </DitherButton>
      <p class="text-[10px] text-muted-foreground">last ran: {ran()}</p>
      {/* type to filter, the arrows walk, Enter runs, Escape leaves */}
      <DitherCommand open={open()} items={items} onSelect={setRan} onClose={() => setOpen(false)} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherCommand,
  title: "Command",
  studio: {
    group: "overlays",
    frame: { w: 320, h: 150 },
    controls: {
      placeholder: {},
      items: { kind: "list", demo: ["New artboard", "Export image", "Toggle theme", "Open settings"] },
    },
    model: { prop: "open", event: "close" },
  },
})
