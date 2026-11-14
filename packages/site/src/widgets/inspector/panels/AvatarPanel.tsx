// An avatar frame: its source (a seed, a drawing or an image dithered into
// the grid), its grid, colour and animation.
import { createSignal, Show } from "solid-js"
import { patternFromImage } from "@dither-ui/kit"
import { replay } from "@/entities/editor"
import { BloomField, ColorField, NumberField, Segmented, Toggle } from "@/shared/ui"
import AvatarDrawGrid from "../ui/AvatarDrawGrid"
import { asFieldColor, KEY, Range, REPLAY_KEY, Text } from "../ui/fields"
import type { WidgetPanelProps } from "./types"

const MIRRORS = ["auto", "horizontal", "vertical"] as const
const AVATAR_SOURCES = ["seed", "draw", "image"] as const

export default function AvatarPanel(props: WidgetPanelProps<"avatar">) {
  let avatarFileInput: HTMLInputElement | undefined
  const [avatarImageError, setAvatarImageError] = createSignal(false)

  function setAvatarSource(v: string | number) {
    const a = props.widget
    a.source = v as (typeof AVATAR_SOURCES)[number]
    if (v === "seed") a.pattern = null
    if (v === "image" && a.imageSrc) deriveAvatarImage()
  }

  /** Dither the image into the grid; keeps the previous pattern on failure. */
  async function deriveAvatarImage(a = props.widget) {
    if (a.source !== "image" || !a.imageSrc) return
    const result = await patternFromImage(a.imageSrc, a.grid, a.imageThreshold, a.imageInvert)
    setAvatarImageError(!result)
    if (result) {
      a.pattern = {
        on: result.on.map((b) => (b ? 1 : 0)),
        density: result.density.map((d) => Math.round(d * 100) / 100),
      }
    }
  }
  function setAvatarInvert(invert: boolean) {
    props.widget.imageInvert = invert
    deriveAvatarImage()
  }
  function onAvatarFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      const a = props.widget
      // Data URI (not object URL) so the image survives save/reload/export.
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          a.imageSrc = reader.result
          deriveAvatarImage(a)
        }
      }
      reader.readAsDataURL(file)
    }
    input.value = ""
  }
  return (
    <>
      <section class="flex flex-col gap-3">
        <p class="micro text-muted-foreground">Avatar</p>
        <Segmented
          modelValue={props.widget.source ?? "seed"}
          options={AVATAR_SOURCES}
          label="source"
          onUpdateModelValue={setAvatarSource}
        />
        <Show when={(props.widget.source ?? "seed") === "seed"}>
          <Text label="seed" name="avatar-seed" value={props.widget.name} set={(v) => (props.widget.name = v)} />
        </Show>
        <Show when={props.widget.source === "draw"}>
          <AvatarDrawGrid avatar={props.widget} />
        </Show>
        <Show when={props.widget.source === "image"}>
          <Text
            label="src"
            name="avatar-image-src"
            value={props.widget.imageSrc ?? ""}
            set={(v) => (props.widget.imageSrc = v)}
            placeholder="https://…"
            onChange={deriveAvatarImage}
          />
          <div class="flex items-center gap-2">
            <button type="button" class={KEY} onClick={() => avatarFileInput?.click()}>
              upload…
            </button>
            <input
              ref={(el) => (avatarFileInput = el)}
              type="file"
              accept="image/*"
              name="avatar-image-file"
              class="hidden"
              onChange={onAvatarFile}
            />
            <Show when={avatarImageError()}>
              <span class="text-[10px] text-destructive">couldn't read that image</span>
            </Show>
          </div>
          <Range
            label="cutoff"
            name="avatar-threshold"
            min={0.1}
            max={0.9}
            step={0.05}
            value={props.widget.imageThreshold}
            set={(v) => (props.widget.imageThreshold = v)}
            onInput={deriveAvatarImage}
          >
            {props.widget.imageThreshold.toFixed(2)}
          </Range>
          <Toggle
            modelValue={props.widget.imageInvert}
            label="invert (dark images)"
            onUpdateModelValue={setAvatarInvert}
          />
        </Show>
        <Segmented
          modelValue={props.widget.mirror}
          options={MIRRORS}
          label="mirror"
          onUpdateModelValue={(v) => (props.widget.mirror = v)}
        />
        <Range
          label="grid"
          name="avatar-grid"
          min={4}
          max={16}
          step={2}
          value={props.widget.grid}
          set={(v) => (props.widget.grid = v)}
        >
          {props.widget.grid}×{props.widget.grid}
        </Range>
        <Range
          label="cell res"
          name="avatar-cellpx"
          min={1}
          max={8}
          step={1}
          value={props.widget.cellPx}
          set={(v) => (props.widget.cellPx = v)}
        >
          {props.widget.cellPx}px
        </Range>
        <Range
          label="density"
          name="avatar-density"
          min={-0.5}
          max={0.5}
          step={0.05}
          value={props.widget.density}
          set={(v) => (props.widget.density = v)}
        >
          {props.widget.density.toFixed(2)}
        </Range>
        <Range
          label="off tier"
          name="avatar-offtier"
          min={0}
          max={1}
          step={0.05}
          value={props.widget.offTier}
          set={(v) => (props.widget.offTier = v)}
        >
          {props.widget.offTier.toFixed(2)}
        </Range>
      </section>
      <section class="flex flex-col gap-3">
        <p class="micro text-muted-foreground">Colour</p>
        <Toggle
          modelValue={props.widget.autoColor}
          label="derive from seed"
          onUpdateModelValue={(v) => (props.widget.autoColor = v)}
        />
        <Show when={!props.widget.autoColor}>
          <ColorField
            modelValue={asFieldColor(props.widget.color)}
            onUpdateModelValue={(v) => (props.widget.color = v)}
          />
        </Show>
        <BloomField modelValue={props.widget.bloom} onUpdateModelValue={(v) => (props.widget.bloom = v)} />
      </section>
      <section class="flex flex-col gap-3">
        <p class="micro text-muted-foreground">Animation</p>
        <NumberField
          modelValue={props.widget.animationDuration}
          label="time"
          unit="ms"
          min={0}
          max={4000}
          step={50}
          onUpdateModelValue={(v) => (props.widget.animationDuration = v)}
        />
        <div class="flex gap-4">
          <Toggle
            modelValue={props.widget.animate}
            label="animate"
            onUpdateModelValue={(v) => (props.widget.animate = v)}
          />
          <button type="button" class={REPLAY_KEY} onClick={() => replay()}>
            Replay
          </button>
        </div>
      </section>
    </>
  )
}
