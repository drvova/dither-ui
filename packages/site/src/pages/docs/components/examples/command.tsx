import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherButton, DitherCommand } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)
  const [ran, setRan] = createSignal("nothing yet")
  // the hotkey stays yours
  function hotkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") (e.preventDefault(), setOpen(!open()))
  }
  onMount(() => window.addEventListener("keydown", hotkey))
  onCleanup(() => window.removeEventListener("keydown", hotkey))

  return (
    <>
      <DitherButton onClick={() => setOpen(true)}>Command (⌘K)</DitherButton>
      <DitherCommand
        open={open()}
        items={[
          { value: "new", label: "New artboard", group: "Studio", kbd: "N" },
          { value: "export", label: "Export image", group: "Studio" },
          { value: "docs", label: "Open docs", group: "Navigate" },
        ]}
        onSelect={(value) => setRan(value)}
        onClose={() => setOpen(false)}
      />
      <p class="text-[10px] text-muted-foreground">last ran: {ran()}</p>

      {/* type to filter, the arrows walk, Enter runs, Escape leaves */}
    </>
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
