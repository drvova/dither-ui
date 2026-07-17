import { createApp, h, nextTick, ref, type App } from "vue"
import {
  DitherGradient,
  DitherButton,
  DitherSpinner,
  renderDitherGradient,
  putRasterBuffer,
} from "../dither-kit"

// ─── Types ──────────────────────────────────────────────────────────────────

type ScenarioResult = {
  name: string
  mean: number
  median: number
  p95: number
  min: number
  max: number
  notes: string
  painted: boolean
}

type RunResult = {
  runIndex: number
  results: ScenarioResult[]
}

// ─── Stats helpers ──────────────────────────────────────────────────────────

function stats(values: number[], name: string, notes: string, painted: boolean): ScenarioResult {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    name,
    mean: values.reduce((s, v) => s + v, 0) / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    notes,
    painted,
  }
}

/** Aggregate a scenario across N runs: collect all individual batch times,
 *  then compute overall stats from the full pool. */
function aggregateScenario(
  name: string,
  perRun: ScenarioResult[],
): ScenarioResult {
  // We don't have individual batch values, but we can aggregate the per-run
  // means/medians/p95s into overall stats. Use the per-run means as samples
  // for a stable cross-run picture.
  const means = perRun.map(r => r.mean)
  const medians = perRun.map(r => r.median)
  const p95s = perRun.map(r => r.p95)
  const allPainted = perRun.every(r => r.painted)

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  const sortedMeans = [...means].sort((a, b) => a - b)

  return {
    name,
    mean: mean(means),
    median: mean(medians),
    p95: mean(p95s),
    min: sortedMeans[0],
    max: sortedMeans[sortedMeans.length - 1],
    notes: `${perRun.length} runs × ${perRun[0]?.notes || ""}`,
    painted: allPainted,
  }
}

// ─── Paint detection ────────────────────────────────────────────────────────

/** Wait until a canvas inside `container` has non-zero pixel data, or timeout.
 *  This proves the dither paint actually happened — not just Vue's vdom patch. */
async function waitForPaint(container: HTMLElement, timeoutMs = 1500): Promise<boolean> {
  const deadline = performance.now() + timeoutMs
  while (performance.now() < deadline) {
    // Yield with setTimeout(0) first (cheaper than RAF for polling), then
    // one RAF to let the browser actually paint.
    await new Promise<void>((r) => setTimeout(r, 0))
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    const canvas = container.querySelector("canvas")
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        try {
          const data = ctx.getImageData(0, 0, Math.min(canvas.width, 20), Math.min(canvas.height, 20)).data
          let nz = 0
          for (let j = 0; j < data.length; j++) if (data[j] !== 0) nz++
          if (nz > 0) return true
        } catch { /* taint or empty — keep waiting */ }
      }
    }
  }
  return false
}

/** Mount a component visibly, measure both compute time (mount→nextTick) and
 *  full end-to-end time (mount→visible pixels). Compute captures Vue patch +
 *  onMounted setup. Full adds the RAF/idle paint wait. */
async function mountAndMeasure(
  container: HTMLElement,
  render: () => App,
): Promise<{ compute: number; full: number; painted: boolean }> {
  const t0 = performance.now()
  let app: App | undefined
  try {
    app = render()
    app.config.errorHandler = (err) => console.error("[bench] Vue error:", err)
    app.mount(container)
    await nextTick()
  } catch {
    app?.unmount()
    container.innerHTML = ""
    return { compute: performance.now() - t0, full: performance.now() - t0, painted: false }
  }
  const tCompute = performance.now()
  const painted = await waitForPaint(container)
  const t1 = performance.now()
  app.unmount()
  container.innerHTML = ""
  return { compute: tCompute - t0, full: t1 - t0, painted }
}

/** Mount, then change a prop and measure re-render time end-to-end. */
async function rerenderAndMeasure(
  container: HTMLElement,
  setup: () => { app: App; changeProp: () => void },
): Promise<{ compute: number; full: number; painted: boolean }> {
  const { app, changeProp } = setup()
  app.mount(container)
  await nextTick()
  await waitForPaint(container)

  const t0 = performance.now()
  changeProp()
  await nextTick()
  const tCompute = performance.now()
  const painted = await waitForPaint(container)
  const t1 = performance.now()
  app.unmount()
  container.innerHTML = ""
  return { compute: tCompute - t0, full: t1 - t0, painted }
}

// ─── Scenario definitions ───────────────────────────────────────────────────

type ScenarioFn = (container: HTMLElement) => Promise<{ compute: number; full: number; painted: boolean }>

function defineScenarios(): { name: string; notes: string; fn: ScenarioFn }[] {

  // Helper that wraps a scenario function with warmup + batch logic
  function makeScenario(
    name: string,
    notes: string,
    fn: ScenarioFn,
  ): { name: string; notes: string; fn: ScenarioFn } {
    return { name, notes, fn }
  }

  return [
    makeScenario("DitherGradient live mount", "960×120, cell=3, opacity=0.14", (c) =>
      mountAndMeasure(c, () =>
        createApp(() =>
          h("div", { style: "position:relative;width:960px;height:120px" }, [
            h(DitherGradient, {
              from: "blue", to: "transparent", direction: "up",
              opacity: 0.14, cell: 3,
            }),
          ]),
        ),
      ),
    ),
    makeScenario("DitherGradient static mount", "320×200 cap, cell=4, idle-deferred", (c) =>
      mountAndMeasure(c, () =>
        createApp(() =>
          h("div", { style: "position:relative;width:960px;height:120px" }, [
            h(DitherGradient, {
              from: "blue", to: "transparent", direction: "up",
              opacity: 0.14, cell: 4, renderMode: "static",
            }),
          ]),
        ),
      ),
    ),
    // Re-render scenario needs special handling
    makeScenario("DitherGradient live re-render", "direction up→down triggers repaint", async (c) => {
      const r = await rerenderAndMeasure(c, () => {
        const dir = ref<"up" | "down">("up")
        return {
          app: createApp(() =>
            h("div", { style: "position:relative;width:960px;height:120px" }, [
              h(DitherGradient, {
                from: "blue", to: "transparent", direction: dir.value,
                opacity: 0.14, cell: 3,
              }),
            ]),
          ),
          changeProp: () => { dir.value = "down" },
        }
      })
      return r
    }),
    makeScenario("DitherButton live mount", "240×56, cell=2, gradient variant", (c) =>
      mountAndMeasure(c, () =>
        createApp(() =>
          h("div", { style: "display:flex;align-items:center;justify-content:center;padding:20px" }, [
            h(DitherButton, { color: "blue", variant: "gradient" }, () => "Save"),
          ]),
        ),
      ),
    ),
    makeScenario("DitherButton static mount", "320×200 cap, idle-deferred", (c) =>
      mountAndMeasure(c, () =>
        createApp(() =>
          h("div", { style: "display:flex;align-items:center;justify-content:center;padding:20px" }, [
            h(DitherButton, { color: "blue", variant: "gradient", renderMode: "static" }, () => "Save"),
          ]),
        ),
      ),
    ),
    makeScenario("DitherSpinner live mount", "32px spinner with RAF loop", (c) =>
      mountAndMeasure(c, () =>
        createApp(() =>
          h("div", { style: "display:flex;align-items:center;justify-content:center;padding:20px" }, [
            h(DitherSpinner, { size: 32 }),
          ]),
        ),
      ),
    ),
    makeScenario("Raw raster gradient", "480×300, putImageData + readback (no Vue)", async (c) => {
      const canvas = document.createElement("canvas")
      canvas.style.cssText = "display:block;width:480px;height:300px;image-rendering:pixelated"
      c.appendChild(canvas)
      const ctx = canvas.getContext("2d")!
      const t0 = performance.now()
      const raster = renderDitherGradient({
        width: 960, height: 600, cell: 2, from: "blue", to: "transparent",
        direction: "up", opacity: 1, seed: 42,
      })
      canvas.width = raster.width
      canvas.height = raster.height
      putRasterBuffer(ctx, raster)
      ctx.getImageData(0, 0, 1, 1)
      const t1 = performance.now()
      canvas.remove()
      return { compute: t1 - t0, full: t1 - t0, painted: true }
    }),
  ]
}

const WARMUPS = 3

// ─── Main benchmark runner ──────────────────────────────────────────────────

async function runBenchmark(
  statusEl: HTMLElement,
  resultsEl: HTMLTableSectionElement,
  button: HTMLButtonElement,
  stageEl: HTMLElement,
  runCount: number,
  batches: number,
): Promise<RunResult[]> {
  button.disabled = true
  resultsEl.innerHTML = ""

  // Visible staging area
  const container = document.createElement("div")
  container.style.cssText =
    "position:relative;width:960px;min-height:120px;margin:20px 0;" +
    "border:1px solid #303038;border-radius:4px;overflow:hidden;background:#18181b;"
  stageEl.appendChild(container)

  const scenarios = defineScenarios(container, batches)
  const allRuns: RunResult[] = []

  for (let run = 0; run < runCount; run++) {
    statusEl.textContent = `Run ${run + 1}/${runCount} — in progress...`
    const runResults: ScenarioResult[] = []

    for (let s = 0; s < scenarios.length; s++) {
      const scenario = scenarios[s]
      statusEl.textContent = `Run ${run + 1}/${runCount} — ${s + 1}/${scenarios.length}: ${scenario.name}`

      const computeTimes: number[] = []
      const fullTimes: number[] = []
      let painted = true
      for (let i = 0; i < WARMUPS + batches; i++) {
        try {
          const r = await scenario.fn(container)
          if (i >= WARMUPS) {
            computeTimes.push(r.compute)
            fullTimes.push(r.full)
            if (!r.painted) painted = false
          }
        } catch {
          if (i >= WARMUPS) { painted = false; computeTimes.push(3000); fullTimes.push(3000) }
        }
      }
      // Report compute time (Vue patch + onMounted) — this is the kit's
      // actual work, not the RAF frame wait.
      const result = stats(computeTimes, scenario.name, scenario.notes, painted)
      result.notes += ` | full=${(fullTimes.reduce((a,b)=>a+b,0)/fullTimes.length).toFixed(1)}ms`
      runResults.push(result)

      // Append this run's results to the table live
      appendRunRow(resultsEl, run + 1, runResults[runResults.length - 1])
    }

    allRuns.push({ runIndex: run + 1, results: runResults })
    await new Promise(r => setTimeout(r, 200))
  }

  // ─── Aggregate across all runs ────────────────────────────────────────────
  statusEl.textContent = `Computing aggregate across ${runCount} runs...`

  const aggregateRow = document.createElement("tr")
  aggregateRow.innerHTML = `<td class="aggregate-header" colspan="7">Aggregate across ${runCount} runs × ${batches} batches (${runCount * batches} samples per scenario)</td>`
  resultsEl.appendChild(aggregateRow)

  for (let s = 0; s < scenarios.length; s++) {
    const name = scenarios[s].name
    const perRun = allRuns.map(run => run.results[s]).filter(Boolean)
    const agg = aggregateScenario(name, perRun)
    appendAggregateRow(resultsEl, agg)
  }

  container.remove()
  statusEl.textContent = `Done — ${runCount} runs × ${batches} batches. Compute time = mount→nextTick. Full time = mount→visible pixels (includes RAF frame).`
  button.disabled = false
  return allRuns
}

function appendRunRow(tbody: HTMLTableSectionElement, run: number, r: ScenarioResult): void {
  // Add a run separator header before the first scenario of each run
  if (r.name === "DitherGradient live mount") {
    const header = document.createElement("tr")
    header.innerHTML = `<td class="run-header" colspan="7">Run ${run}</td>`
    tbody.appendChild(header)
  }

  const warning = r.painted ? "" : ' <span class="warning">[DID NOT PAINT]</span>'
  const tr = document.createElement("tr")
  tr.innerHTML = `<td>${r.name}</td><td>${r.mean.toFixed(2)}</td><td>${r.median.toFixed(2)}</td><td>${r.p95.toFixed(2)}</td><td>${r.min.toFixed(2)}</td><td>${r.max.toFixed(2)}</td><td>${r.notes}${warning}</td>`
  tbody.appendChild(tr)
}

function appendAggregateRow(tbody: HTMLTableSectionElement, r: ScenarioResult): void {
  const warning = r.painted ? "" : ' <span class="warning">[SOME RUNS DID NOT PAINT]</span>'
  const tr = document.createElement("tr")
  tr.style.background = "#0e1a0e"
  tr.innerHTML = `<td><strong>${r.name}</strong></td><td><strong>${r.mean.toFixed(2)}</strong></td><td><strong>${r.median.toFixed(2)}</strong></td><td><strong>${r.p95.toFixed(2)}</strong></td><td><strong>${r.min.toFixed(2)}</strong></td><td><strong>${r.max.toFixed(2)}</strong></td><td>${r.notes}${warning}</td>`
  tbody.appendChild(tr)
}

// ─── Wire up ────────────────────────────────────────────────────────────────

// Expose on window so Chrome DevTools console can call it directly:
//   const r = await window.runDitherBench(5, 10)
//   console.table(r.flatMap(run => run.results))
;(globalThis as any).runDitherBench = async (runCount = 5, batches = 10) => {
  return runBenchmark(
    document.querySelector<HTMLElement>("#status")!,
    document.querySelector<HTMLTableSectionElement>("#results")!,
    document.querySelector<HTMLButtonElement>("#run")!,
    document.querySelector<HTMLElement>("#stage")!,
    runCount,
    batches,
  )
}

document.querySelector<HTMLButtonElement>("#run")!.addEventListener("click", () => {
  const runCount = Math.max(1, Math.min(20, parseInt(document.querySelector<HTMLInputElement>("#runCount")!.value, 10) || 5))
  const batches = Math.max(3, Math.min(50, parseInt(document.querySelector<HTMLInputElement>("#batchCount")!.value, 10) || 10))
  void (globalThis as any).runDitherBench(runCount, batches)
})
