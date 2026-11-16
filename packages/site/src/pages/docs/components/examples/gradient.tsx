import { DitherGradient, type DitherColor, type GradientDirection } from "@dither-kit"

export default function Example(props: { from?: DitherColor; direction?: GradientDirection }) {
  return (
    <div class="relative h-40 overflow-hidden rounded-md">
      <DitherGradient from={props.from ?? "blue"} to="transparent" direction={props.direction ?? "up"} />
      {/* renderMode="static" draws it once; precompiled takes a raster you exported */}
    </div>
  )
}
