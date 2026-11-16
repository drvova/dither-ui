import { createSignal, onCleanup } from "solid-js"
import { DitherButton, DitherConsole, type ConsoleLine } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [lines, setLines] = createSignal<ConsoleLine[]>([
    { text: "$ deploy --prod", at: "12:01" },
    { text: "building 34 routes…", at: "12:01" },
    { text: "build ok (4.2s)", at: "12:01", level: "success" },
  ])
  const [deploying, setDeploying] = createSignal(false)
  const timers: number[] = []
  onCleanup(() => timers.forEach((t) => clearTimeout(t)))

  // a fake deploy streams its lines in
  function deploy() {
    if (deploying()) return
    setDeploying(true)
    const at = () => new Date().toTimeString().slice(0, 5)
    const steps: ConsoleLine[] = [
      { text: "$ deploy --prod" },
      { text: "linting… 0 problems" },
      { text: "bundling client…" },
      { text: "warn: chunk over 300kB", level: "warn" },
      { text: "uploading assets…" },
      { text: "deployed to dither-ui.com", level: "success" },
    ]
    steps.forEach((s, i) =>
      timers.push(
        window.setTimeout(
          () => {
            setLines([...lines(), { ...s, at: at() }])
            if (i === steps.length - 1) setDeploying(false)
          },
          450 * (i + 1),
        ),
      ),
    )
  }

  return (
    <div class="mx-auto max-w-lg">
      {/* lines: strings or { text, level, at }; level tints through the palette
           (success, warn, error); follow keeps the newest line in view, and the
           caret blinks (held still under reduced motion) */}
      <DitherConsole
        lines={lines()}
        title="deploy"
        class="h-52"
        actions={
          <DitherButton color="green" class="px-2 py-0.5 text-[10px]" disabled={deploying()} onClick={deploy}>
            Run
          </DitherButton>
        }
      />
    </div>
  )
}

export const meta = defineExample({
  component: DitherConsole,
  title: "Console",
  studio: {
    group: "structure",
    frame: { w: 340, h: 220 },
    controls: {
      title: { demo: "console" },
      lines: { kind: "list", demo: ["$ rs build", "building…", "built in 4.2s"] },
      follow: {},
      caret: {},
    },
  },
})
