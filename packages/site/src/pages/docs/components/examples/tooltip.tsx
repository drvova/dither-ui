import { DitherTooltip, DitherBadge } from "@dither-kit"

export default function Example() {
  return (
    <DitherTooltip text="Deploys are frozen until Monday">
      <DitherBadge color="orange">frozen</DitherBadge>
    </DitherTooltip>
  )
}
