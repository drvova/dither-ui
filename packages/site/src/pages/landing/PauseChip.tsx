// The pause control of a surface that moves by itself (WCAG 2.2.2): a round
// toggle button (stable name, `aria-pressed` while paused) whose glyph
// morphs pause ↔ play. 32px, the chrome hit-area floor.
import "./PauseChip.css"

type PauseChipProps = {
  /** Whether the surface plays. */
  modelValue: boolean
  onUpdateModelValue?: (playing: boolean) => void
  label: string
  class?: string
}

export default function PauseChip(props: PauseChipProps) {
  return (
    <button
      type="button"
      class={`pause-chip-scope pause-chip${props.class ? ` ${props.class}` : ""}`}
      aria-pressed={!props.modelValue}
      aria-label={props.label}
      onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
    >
      <span class="pause-glyph" data-paused={props.modelValue ? undefined : "true"} aria-hidden="true" />
    </button>
  )
}
