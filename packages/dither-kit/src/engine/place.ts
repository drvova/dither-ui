/** Where a floating panel opened at a point stands: at the point, moved in
 * just enough to stay `margin` inside the view on every side (a menu opened
 * by a finger near the screen's edge flips inward, never off the glass). A
 * panel larger than the view keeps its top-left edge in. */
export function inView(
  at: { x: number; y: number },
  size: { width: number; height: number },
  view: { width: number; height: number },
  margin = 8,
): { x: number; y: number } {
  return {
    x: Math.max(margin, Math.min(at.x, view.width - size.width - margin)),
    y: Math.max(margin, Math.min(at.y, view.height - size.height - margin)),
  }
}
