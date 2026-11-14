import { DitherText } from "@dither-kit"

export default function Example() {
  return (
    <>
      <DitherText tone="muted" size="sm">
        Default paragraph tone.
      </DitherText>
      <DitherText as="span" tone="faint" size="xs">
        Caption-weight aside.
      </DitherText>
      <DitherText as="h3" size="lg">
        A heading in the native scale.
      </DitherText>
    </>
  )
}
