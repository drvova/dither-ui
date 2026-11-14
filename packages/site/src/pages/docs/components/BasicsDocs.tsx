// The kit's basic surfaces: the button, the avatar, the gradient and the
// image, each a playground whose pickers drive one preview and its code.
import {
  cssColor,
  DitherAvatar,
  DitherButton,
  DitherGradient,
  DitherImage,
  type ButtonVariant,
  type DitherColor,
  type GradientDirection,
  type PixelBloom,
} from "@dither-ui/kit"
import { createMemo, createSignal, For } from "solid-js"
import { createStore } from "solid-js/store"
import { assetPath } from "@/shared/lib"
import DemoCard from "../DemoCard"
import { COLORS, VARIANTS } from "../demo-data"
import DocSection from "../DocSection"
import { thumbClass, thumbLabel } from "../gallery"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import buttonProps from "virtual:dither-props/DitherButton"
import avatarProps from "virtual:dither-props/DitherAvatar"
import gradientProps from "virtual:dither-props/DitherGradient"
import imageProps from "virtual:dither-props/DitherImage"

// A picked tile or chip wears the site's pressed state (ink in a ring), so
// the pick reads on either theme, never a fill a shade off the ground.
const chipClass = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "ring-on" : "text-muted-foreground hover:text-foreground"}`

const BLOOMS: PixelBloom[] = ["off", "low", "high", "aura"]
const AVATAR_NAMES = ["ada", "linus", "grace", "alan", "edsger", "barbara"]

const BUTTON_COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red"]
const DIRECTIONS: GradientDirection[] = ["up", "down", "left", "right"]

export const API: Record<string, PropRow[]> = {
  button: kitTable(buttonProps, {
    join: [
      ["loading", "disabled"],
      ["maxCols", "maxRows"],
    ],
  }),
  avatar: kitTable(avatarProps),
  gradient: kitTable(gradientProps, { join: [["maxCols", "maxRows"]] }),
  image: kitTable(imageProps, { join: [["maxCols", "maxRows"]] }),
}

const SNIPPETS = {
  image: `<DitherImage src="/sprites.webp" cell={3} focusY={0.62} fade={72}
  alt="The dither-ui sprite sheet, re-dithered" class="h-64 w-full" />
{/* cell: px per dither cell; fade: dithered edge dissolve;
     focus-y: cover-crop focus (0 top to 1 bottom);
     precompiled takes an image you dithered ahead of time, drawn as it is */}`,
}

export default function BasicsDocs() {
  // Button playground — one preview, three pickers.
  const [btn, setBtn] = createStore({
    variant: "gradient" as ButtonVariant,
    color: "blue" as DitherColor,
    bloom: "off" as PixelBloom,
  })

  // Avatar playground — picking a name replays the pixel entrance at all sizes.
  const [avatarName, setAvatarName] = createSignal("ada")
  const [avatarReplay, setAvatarReplay] = createSignal(0)
  function pickAvatar(n: string) {
    setAvatarName(n)
    setAvatarReplay((r) => r + 1)
  }

  // Gradient playground.
  const [grad, setGrad] = createStore({ direction: "up" as GradientDirection, from: "blue" as DitherColor })

  const buttonCode = createMemo(
    () =>
      `<DitherButton color="${btn.color}" variant="${btn.variant}"${btn.bloom === "off" ? "" : ` bloom="${btn.bloom}"`}>
  Deploy
</DitherButton>
{/* static: drawn once; precompiled takes a raster you exported */}
<DitherButton renderMode="static">Saved</DitherButton>`,
  )
  const avatarCode = createMemo(
    () => `<DitherAvatar name="${avatarName()}" size={48} />
{/* same name, same face, at any size */}`,
  )
  const gradientCode = createMemo(
    () => `<div class="relative h-40">
  <DitherGradient from="${grad.from}" to="transparent" direction="${grad.direction}" />
</div>
<div class="relative h-24">
  <DitherGradient renderMode="static" />   {/* drawn once; precompiled takes a raster you exported */}
</div>`,
  )

  return (
    <>
      {/* Button */}
      <DocSection defer id="button">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Canvas-filled button; density lifts on hover, blooms on press. Four fills, seven colors, optional{" "}
          <code class="text-foreground/80">bloom</code>, and static/precompiled raster paths.
        </p>
        <DemoCard code={buttonCode()}>
          <div class="grid justify-items-center gap-8">
            <DitherButton color={btn.color} variant={btn.variant} bloom={btn.bloom} class="px-6 py-3 text-[13px]">
              Deploy
            </DitherButton>
            <div class="grid justify-items-center gap-3">
              <div class="flex flex-wrap items-center justify-center gap-1 rounded-md border border-border/60 p-1">
                <For each={VARIANTS}>
                  {(v) => (
                    <button
                      type="button"
                      aria-pressed={btn.variant === v}
                      class={chipClass(btn.variant === v)}
                      onClick={() => setBtn("variant", v)}
                    >
                      {v}
                    </button>
                  )}
                </For>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-1 rounded-md border border-border/60 p-1">
                <For each={BLOOMS}>
                  {(b) => (
                    <button
                      type="button"
                      aria-pressed={btn.bloom === b}
                      class={chipClass(btn.bloom === b)}
                      onClick={() => setBtn("bloom", b)}
                    >
                      bloom {b as string}
                    </button>
                  )}
                </For>
              </div>
              <div class="flex items-center gap-2">
                <For each={BUTTON_COLORS}>
                  {(c) => (
                    <button
                      type="button"
                      aria-label={`Color ${c}`}
                      aria-pressed={btn.color === c}
                      class={`size-6 rounded-[4px] transition-transform ${
                        btn.color === c
                          ? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      }`}
                      style={{ "background-color": cssColor(c) }}
                      onClick={() => setBtn("color", c)}
                    />
                  )}
                </For>
              </div>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.button} />
      </DocSection>

      {/* Avatar */}
      <DocSection defer id="avatar">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A deterministic identicon: the same name always draws the same face, at any size.
        </p>
        <DemoCard code={avatarCode()}>
          <div class="flex items-end justify-center gap-3">
            <DitherAvatar name={avatarName()} size={24} replayToken={avatarReplay()} />
            <DitherAvatar name={avatarName()} size={32} replayToken={avatarReplay()} />
            <DitherAvatar name={avatarName()} size={48} replayToken={avatarReplay()} />
            <DitherAvatar name={avatarName()} size={64} replayToken={avatarReplay()} />
          </div>
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Names</h3>
        <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <For each={AVATAR_NAMES}>
            {(n) => (
              <button
                type="button"
                aria-pressed={avatarName() === n}
                class={thumbClass(avatarName() === n)}
                onClick={() => pickAvatar(n)}
              >
                <div class="pointer-events-none flex justify-center">
                  <DitherAvatar name={n} size={40} animate={false} />
                </div>
                <div class={thumbLabel(avatarName() === n)}>{n}</div>
              </button>
            )}
          </For>
        </div>
        <PropsTable rows={API.avatar} />
      </DocSection>

      {/* Gradient */}
      <DocSection defer id="gradient">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A background wash that fades through the Bayer matrix instead of alpha, in four directions and any palette
          color.
        </p>
        <DemoCard code={gradientCode()}>
          <div class="grid gap-5">
            <div class="relative h-40 overflow-hidden rounded-md">
              <DitherGradient from={grad.from} to="transparent" direction={grad.direction} />
            </div>
            <div class="flex flex-wrap items-center justify-center gap-4">
              <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                <For each={DIRECTIONS}>
                  {(dir) => (
                    <button
                      type="button"
                      aria-pressed={grad.direction === dir}
                      class={chipClass(grad.direction === dir)}
                      onClick={() => setGrad("direction", dir)}
                    >
                      {dir}
                    </button>
                  )}
                </For>
              </div>
              <div class="flex items-center gap-2">
                <For each={COLORS}>
                  {(c) => (
                    <button
                      type="button"
                      aria-label={`Color ${c}`}
                      aria-pressed={grad.from === c}
                      class={`size-6 rounded-[4px] transition-transform ${
                        grad.from === c
                          ? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      }`}
                      style={{ "background-color": cssColor(c) }}
                      onClick={() => setGrad("from", c)}
                    />
                  )}
                </For>
              </div>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.gradient} />
      </DocSection>

      {/* Image */}
      <DocSection defer id="image">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Ordered-dithers any image into chunky cells; edges can dissolve into the page. Below: the site's own sprite
          sheet run through it.
        </p>
        <DemoCard code={SNIPPETS.image}>
          <DitherImage
            src={assetPath("/sprites.webp")}
            alt="The dither-ui sprite sheet, re-dithered"
            cell={3}
            focusY={0.62}
            fade={72}
            class="h-64 w-full"
          />
        </DemoCard>
        <PropsTable rows={API.image} />
      </DocSection>
    </>
  )
}
