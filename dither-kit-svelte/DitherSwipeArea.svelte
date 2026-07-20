<script lang="ts">
  /** Invisible edge strip that opens a drawer on a directional swipe —
   * swipe inward from the edge the drawer lives on. */
  type Props = {
    /** Which edge the drawer slides in from. */
    side?: "right" | "left" | "bottom"
    /** Strip thickness in px. */
    size?: number
    /** Swipe distance in px that commits the open. */
    threshold?: number
    disabled?: boolean
    onopen?: () => void
  }

  let { side = "right", size = 16, threshold = 24, disabled = false, onopen }: Props = $props()

  let fired = false
  let start = 0

  const pos = (e: PointerEvent) => (side === "bottom" ? e.clientY : e.clientX)
  // Inward direction: from the right edge a leftward swipe (-x) opens, etc.
  const inwardSign = () => (side === "left" ? 1 : -1)

  function onDown(e: PointerEvent) {
    if (disabled) return
    fired = false
    start = pos(e)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onMove(e: PointerEvent) {
    if (disabled || fired) return
    if ((pos(e) - start) * inwardSign() > threshold) {
      fired = true
      onopen?.()
    }
  }
</script>

<div
  aria-hidden="true"
  class="fixed z-40 touch-none {side === 'bottom'
    ? 'inset-x-0 bottom-0'
    : side === 'right'
      ? 'inset-y-0 right-0'
      : 'inset-y-0 left-0'}"
  style:width={side === "bottom" ? undefined : `${size}px`}
  style:height={side === "bottom" ? `${size}px` : undefined}
  onpointerdown={onDown}
  onpointermove={onMove}
></div>
