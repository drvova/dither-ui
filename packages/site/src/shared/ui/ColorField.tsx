import { createEffect, createMemo, createSignal, For, type JSX, on, Show, splitProps } from "solid-js"
import { colorToHex, cssColor, type DitherColor, hexToHsv, hsvToHex } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { COLORS } from "@/shared/config"
import "./ColorField.css"

type Own = {
  modelValue: DitherColor | string
  class?: string
  onUpdateModelValue?: (value: DitherColor | string) => void
}
export type ColorFieldProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

const presets = COLORS as readonly string[]
const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)

export default function ColorField(raw: ColorFieldProps) {
  const [props, rest] = splitProps(raw, ["modelValue", "class", "onUpdateModelValue"])
  const isPreset = createMemo(() => presets.includes(props.modelValue as string))

  const [hsv, setHsv] = createSignal({ h: 210, s: 0.7, v: 0.9 })
  const hex = createMemo(() => hsvToHex(hsv().h, hsv().s, hsv().v))

  function syncFromModel() {
    const c = hexToHsv(colorToHex(props.modelValue))
    setHsv({ h: c.h, s: c.s, v: c.v })
  }
  syncFromModel()
  createEffect(
    on(
      () => props.modelValue,
      (v) => {
        // Skip re-sync when the change is our own emit (avoids thumb jitter).
        if (presets.includes(v as string) || v !== hex()) syncFromModel()
      },
      { defer: true },
    ),
  )

  const push = () => props.onUpdateModelValue?.(hex())

  let square: HTMLDivElement | undefined
  function onSquare(e: PointerEvent) {
    const move = (ev: PointerEvent) => {
      const r = square?.getBoundingClientRect()
      if (!r) return
      setHsv((c) => ({
        ...c,
        s: clamp((ev.clientX - r.left) / r.width),
        v: 1 - clamp((ev.clientY - r.top) / r.height),
      }))
      push()
    }
    move(e)
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function onHue(e: InputEvent & { currentTarget: HTMLInputElement }) {
    const h = Number(e.currentTarget.value)
    setHsv((c) => ({ ...c, h }))
    push()
  }
  function onHex(e: Event) {
    let v = (e.target as HTMLInputElement).value.trim().replace(/^#/, "")
    if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.replace(/(.)/g, "$1$1")
    if (/^[0-9a-fA-F]{6}$/.test(v)) props.onUpdateModelValue?.(`#${v.toLowerCase()}`)
  }
  function enableCustom() {
    props.onUpdateModelValue?.(colorToHex(props.modelValue))
  }

  return (
    <div {...rest} class={cn("color-field-scope flex flex-col gap-2.5", props.class)}>
      <div class="flex flex-wrap items-center gap-1.5">
        <For each={COLORS}>
          {(c) => (
            <button
              type="button"
              class={cn(
                "size-5 rounded-[4px] transition-transform hover:scale-110",
                props.modelValue === c
                  ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                  : "ring-1 ring-border",
              )}
              style={{ "background-color": cssColor(c) }}
              title={c}
              aria-label={c}
              onClick={() => props.onUpdateModelValue?.(c)}
            />
          )}
        </For>
        <button
          type="button"
          class={cn(
            "size-5 rounded-[4px] transition-transform hover:scale-110",
            !isPreset() ? "ring-2 ring-foreground ring-offset-1 ring-offset-background" : "ring-1 ring-border",
          )}
          style={
            !isPreset()
              ? { "background-color": hex() }
              : { background: "conic-gradient(from 0deg, red, #ff0, lime, cyan, blue, magenta, red)" }
          }
          title="Custom colour"
          aria-label="Custom colour"
          onClick={enableCustom}
        />
      </div>

      <Show when={!isPreset()}>
        <div class="flex flex-col gap-2">
          {/* saturation / value square */}
          <div
            ref={(el) => (square = el)}
            class="relative h-28 w-full cursor-crosshair overflow-hidden rounded-md ring-1 ring-border"
            style={{ "background-color": `hsl(${hsv().h} 100% 50%)` }}
            onPointerDown={onSquare}
          >
            <div class="absolute inset-0" style="background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0))" />
            <div class="absolute inset-0" style="background: linear-gradient(to top, #000, rgba(0, 0, 0, 0))" />
            <div
              class="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
              style={{ left: `${hsv().s * 100}%`, top: `${(1 - hsv().v) * 100}%` }}
            />
          </div>

          {/* hue */}
          <input
            value={hsv().h}
            type="range"
            name="hue"
            min="0"
            max="360"
            class="dk-hue h-2.5 w-full cursor-pointer appearance-none rounded-full"
            onInput={onHue}
          />

          {/* hex */}
          <div class="flex items-center gap-2">
            <span class="size-5 shrink-0 rounded-[4px] ring-1 ring-border" style={{ "background-color": hex() }} />
            <input
              type="text"
              name="hex"
              spellcheck={false}
              autocomplete="off"
              value={hex()}
              class="w-full rounded-md border border-edge bg-background/60 px-2 py-1 font-mono text-xs uppercase text-foreground outline-none focus:border-ring"
              onChange={onHex}
            />
          </div>
        </div>
      </Show>
    </div>
  )
}
