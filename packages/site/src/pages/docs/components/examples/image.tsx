import { DitherImage } from "@dither-kit"

export default function Example(props: { src?: string }) {
  return (
    <>
      <DitherImage
        src={props.src ?? "/sprites.webp"}
        alt="The dither-ui sprite sheet, re-dithered"
        cell={3}
        focusY={0.62}
        fade={72}
        class="h-64 w-full"
      />
      {/* cell: px per dither cell; fade: dithered edge dissolve;
           focusY: cover-crop focus (0 top to 1 bottom);
           precompiled takes an image you dithered ahead of time, drawn as it is */}
    </>
  )
}
