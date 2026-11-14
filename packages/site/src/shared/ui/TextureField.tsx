import { createMemo, For, type JSX, Show, splitProps } from "solid-js"
import { resolveTexture, type TextureConfig, type VariantInput } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { VARIANTS } from "@/shared/config"
import Segmented from "./Segmented"
import Toggle from "./Toggle"

type Own = { modelValue: VariantInput; class?: string; onUpdateModelValue?: (value: VariantInput) => void }
type TextureFieldProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

const CHOICES = [...VARIANTS, "custom"] as const
const num = (e: Event) => Number((e.target as HTMLInputElement).value)

const SLIDERS = [
  { key: "ramp", label: "fade", min: 0, max: 1, step: 0.05 },
  { key: "density", label: "density", min: 0, max: 1, step: 0.05 },
  { key: "offTier", label: "off tier", min: 0, max: 1, step: 0.05 },
  { key: "edge", label: "edge", min: 0, max: 1, step: 0.05 },
] as const

export default function TextureField(raw: TextureFieldProps) {
  const [props, rest] = splitProps(raw, ["modelValue", "class", "onUpdateModelValue"])
  const choice = createMemo(() => (typeof props.modelValue === "string" ? props.modelValue : "custom"))
  const tex = createMemo<Required<TextureConfig>>(() => ({
    ...resolveTexture(props.modelValue),
  }))

  function setChoice(v: string | number) {
    if (v === "custom") {
      // Seed from the current preset so the switch is seamless (clamp solid's
      // internal always-lit bias back into the visible 0–1 range).
      const seed = { ...resolveTexture(props.modelValue) }
      seed.density = Math.min(1, seed.density)
      props.onUpdateModelValue?.(seed)
    } else {
      props.onUpdateModelValue?.(v as VariantInput)
    }
  }
  function set<K extends keyof TextureConfig>(key: K, value: TextureConfig[K]) {
    props.onUpdateModelValue?.({ ...tex(), density: Math.min(1, tex().density), [key]: value })
  }

  return (
    <div {...rest} class={cn("flex flex-col gap-2.5", props.class)}>
      <Segmented modelValue={choice()} options={CHOICES} label="variant" onUpdateModelValue={setChoice} />
      <Show when={choice() === "custom"}>
        <For each={SLIDERS}>
          {(s) => (
            <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span class="prop-name">{s.label}</span>
              <input
                type="range"
                name={`tex-${s.key}`}
                min={s.min}
                max={s.max}
                step={s.step}
                value={tex()[s.key]}
                class="flex-1 accent-foreground"
                onInput={(e) => set(s.key, num(e))}
              />
              <span class="w-8 shrink-0 text-right tabular-nums text-foreground">{tex()[s.key].toFixed(2)}</span>
            </label>
          )}
        </For>
        <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="prop-name">hatch</span>
          <input
            type="range"
            name="tex-hatch"
            min="0"
            max="8"
            step="1"
            value={tex().hatch}
            class="flex-1 accent-foreground"
            onInput={(e) => set("hatch", num(e))}
          />
          <span class="w-8 shrink-0 text-right tabular-nums text-foreground">{tex().hatch || "off"}</span>
        </label>
        <Toggle modelValue={tex().gaps} label="real gaps (dotted look)" onUpdateModelValue={(on) => set("gaps", on)} />
      </Show>
    </div>
  )
}
