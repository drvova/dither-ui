// Shared DOM-lifecycle seam for the chart dither canvases (cartesian, bar, pie,
// radar). Each Vue canvas component wired the same skeleton by hand — an
// IntersectionObserver visibility gate, an rAF-deferred (re)start of the
// framework-agnostic paint loop, and watchers that restart on backing/plot
// changes or wake on interaction. In the Svelte port that skeleton is one action
// (`use:chartCanvas`), attached to the fill `<canvas>`; the host supplies a
// `start` closure that reads its live `$derived` boxes plus a `restartKey` /
// `wakeKey` string so the action knows when to rebuild versus merely wake.

export type ChartCanvasLoop = { stop: () => void; wake: () => void }

export type ChartCanvasParams = {
  /** Builds the paint loop for the given canvas + visibility probe. Stable
   * identity: it closes over the host's live boxes, so the loop reads fresh
   * state every frame without the action touching those boxes. */
  start: (
    canvas: HTMLCanvasElement,
    visible: () => boolean
  ) => ChartCanvasLoop | undefined
  /** Changing this rebuilds the loop (backing cols/rows, plot size, precompiled). */
  restartKey: string
  /** Changing this wakes a paused loop (interaction, data, styling). */
  wakeKey: string
}

/**
 * Canvas paint-loop lifecycle action. Mirrors the Vue components' onMounted +
 * watch(flush:"post") + IntersectionObserver wiring, deferring the first start
 * through requestAnimationFrame so sibling `bind:this` refs (the bloom canvas)
 * are attached before the loop reads them.
 */
export function chartCanvas(
  node: HTMLCanvasElement,
  initial: ChartCanvasParams
) {
  let p = initial
  let loop: ChartCanvasLoop | undefined
  let visible = typeof IntersectionObserver === "undefined"
  let token = 0

  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? true
          if (visible) loop?.wake() // now visible — resume the paused loop
        })
      : null
  io?.observe(node)

  const restart = () => {
    loop?.stop()
    loop = undefined
    const my = ++token
    requestAnimationFrame(() => {
      if (my !== token) return
      loop = p.start(node, () => visible)
    })
  }

  restart()

  return {
    update(next: ChartCanvasParams) {
      const restarted = next.restartKey !== p.restartKey
      const woke = next.wakeKey !== p.wakeKey
      p = next
      if (restarted) restart()
      else if (woke) loop?.wake()
    },
    destroy() {
      token += 1
      loop?.stop()
      io?.disconnect()
    },
  }
}
