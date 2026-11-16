import { DitherButton, type ButtonVariant, type DitherColor, type PixelBloom } from "@dither-kit"

export default function Example(props: { color?: DitherColor; variant?: ButtonVariant; bloom?: PixelBloom }) {
  return (
    <>
      <DitherButton
        color={props.color ?? "blue"}
        variant={props.variant ?? "gradient"}
        bloom={props.bloom}
        class="px-6 py-3 text-[13px]"
      >
        Deploy
      </DitherButton>
      {/* renderMode="static" draws it once; precompiled takes a raster you exported */}
    </>
  )
}
