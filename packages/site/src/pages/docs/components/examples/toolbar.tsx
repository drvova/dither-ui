import { DitherToolbar, DitherButton, DitherSeparator } from "@dither-kit"

export default function Example() {
  return (
    <DitherToolbar label="Formatting">
      <DitherButton class="px-2.5 py-1" aria-label="Bold">
        B
      </DitherButton>
      <DitherButton class="px-2.5 py-1" aria-label="Italic">
        I
      </DitherButton>
      <DitherButton class="px-2.5 py-1" aria-label="Underline">
        U
      </DitherButton>
      <DitherSeparator orientation="vertical" class="mx-1 h-5" />
      <DitherButton class="px-2.5 py-1" aria-label="Align left">
        ⇤
      </DitherButton>
      <DitherButton class="px-2.5 py-1" aria-label="Align center">
        ⇹
      </DitherButton>
      <DitherButton class="px-2.5 py-1" aria-label="Align right">
        ⇥
      </DitherButton>
    </DitherToolbar>
  )
}
