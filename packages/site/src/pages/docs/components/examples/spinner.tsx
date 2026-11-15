import { createSignal, Index } from "solid-js"
import { DitherButton, DitherSpinner } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const colors = ["blue", "green", "purple", "orange", "pink", "red"] as const
  const [seeds, setSeeds] = createSignal([3, 17, 42, 128, 777, 2024])
  const reroll = () => setSeeds(seeds().map(() => Math.floor(Math.random() * 100000)))

  return (
    <div class="grid gap-6">
      {/* default: a clean rotating arc */}
      <div class="flex items-center justify-center gap-6">
        <DitherSpinner size={16} />
        <DitherSpinner size={20} />
        <DitherSpinner size={28} />
        <span class="text-[11px] text-muted-foreground">default arc</span>
        <DitherSpinner renderMode="static" />
        <span class="text-[11px] text-muted-foreground">drawn once</span>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-6">
        {/* by place: a roll reseeds each spinner where it stands */}
        <Index each={seeds()}>{(sd, i) => <DitherSpinner seed={sd()} size={32} color={colors[i % 6]} />}</Index>
      </div>
      <div class="flex justify-center">
        <DitherButton color="blue" variant="gradient" onClick={reroll}>
          Roll new spinners
        </DitherButton>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSpinner,
  title: "Spinner",
  studio: { group: "display", frame: { w: 120, h: 90 }, controls: { color: {}, size: { min: 8, max: 96 } } },
})
