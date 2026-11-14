import { createMemo, For, type JSX, Show, splitProps } from "solid-js"
import type { BloomConfig, BloomInput, BloomLevel } from "@dither-ui/kit"
import { bloomFromSeed } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { BLOOMS } from "@/shared/config"
import Segmented from "./Segmented"

type Own = { modelValue: BloomInput; class?: string; onUpdateModelValue?: (value: BloomInput) => void }
export type BloomFieldProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

// Mirrors the engine's bloom presets so "custom" seeds from the current look.
const SEED: Record<string, Required<Omit<BloomConfig, "blend">>> = {
  off: { blur: 3, brightness: 1.35, opacity: 0.7, saturate: 1.4 },
  low: { blur: 3, brightness: 1.35, opacity: 0.7, saturate: 1.4 },
  high: { blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 },
  aura: { blur: 15, brightness: 2.9, opacity: 0.1, saturate: 3 },
}

const CHOICES = [...BLOOMS, "custom"] as const
const num = (e: Event) => Number((e.target as HTMLInputElement).value)

const SLIDERS = [
  { key: "blur", label: "blur", min: 0, max: 30, step: 1, fmt: (v: number) => `${v}px` },
  { key: "brightness", label: "bright", min: 1, max: 4, step: 0.05, fmt: (v: number) => v.toFixed(2) },
  { key: "opacity", label: "opacity", min: 0, max: 1, step: 0.02, fmt: (v: number) => v.toFixed(2) },
  { key: "saturate", label: "saturate", min: 1, max: 4, step: 0.05, fmt: (v: number) => v.toFixed(2) },
] as const

export default function BloomField(raw: BloomFieldProps) {
  const [props, rest] = splitProps(raw, ["modelValue", "class", "onUpdateModelValue"])
  const choice = createMemo(() => (typeof props.modelValue === "string" ? props.modelValue : "custom"))
  const cfg = createMemo<Required<Omit<BloomConfig, "blend">>>(() => {
    const value = props.modelValue
    return typeof value === "string"
      ? SEED[value]
      : typeof value === "number"
        ? { ...SEED.low, ...bloomFromSeed(value) }
        : { ...SEED.low, ...value }
  })

  function setChoice(v: string | number) {
    if (v === "custom") props.onUpdateModelValue?.({ ...cfg() })
    else props.onUpdateModelValue?.(v as BloomLevel)
  }
  function set(key: keyof BloomConfig, value: number) {
    props.onUpdateModelValue?.({ ...cfg(), [key]: value })
  }

  return (
    <div {...rest} class={cn("flex flex-col gap-2.5", props.class)}>
      <Segmented modelValue={choice()} options={CHOICES} label="bloom" onUpdateModelValue={setChoice} />
      <Show when={choice() === "custom"}>
        <For each={SLIDERS}>
          {(s) => (
            <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span class="prop-name">{s.label}</span>
              <input
                type="range"
                name={`bloom-${s.key}`}
                min={s.min}
                max={s.max}
                step={s.step}
                value={cfg()[s.key]}
                class="flex-1 accent-foreground"
                onInput={(e) => set(s.key, num(e))}
              />
              <span class="w-9 shrink-0 text-right tabular-nums text-foreground">{s.fmt(cfg()[s.key])}</span>
            </label>
          )}
        </For>
      </Show>
    </div>
  )
}
