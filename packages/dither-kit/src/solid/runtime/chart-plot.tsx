// What every chart family's print is drawn with: the plot's group at the
// margins (the precompiled image in place of the print, the bloom over it),
// a viewBox of the backing's cells laid over the plot, and a print's
// markup in it (`engine/chart-svg.ts`: paths or a cell PNG, the shorter).

import { createMemo, createUniqueId, type JSX, Show } from "solid-js"
import type { ChartContextValue, PolarChartContextValue } from "../../engine/chart-types"
import { bloomOf } from "../../engine/dither-paint"

type Plotted = Pick<
  ChartContextValue & PolarChartContextValue,
  "margins" | "plot" | "precompiled" | "bloom" | "bloomOnHover"
>

/** Cells of a `cols` x `rows` backing, scaled over the whole plot the way
 * the canvas was (`image-rendering: pixelated`). */
export function Cells(props: {
  plot: { width: number; height: number }
  cols: number
  rows: number
  children: JSX.Element
}) {
  return (
    <svg
      class="dk-chart-print"
      width={props.plot.width}
      height={props.plot.height}
      viewBox={`0 0 ${props.cols} ${props.rows}`}
      preserveAspectRatio="none"
    >
      {props.children}
    </svg>
  )
}

/** A print, as one markup string (`printMarkup`: a chart's paths number
 * in the hundreds; as elements each would carry its own hydration key and
 * reactive attributes). It is the engine's own: path commands, hex
 * colours, numbers and a PNG data URI, nothing a reader wrote. */
export function Print(props: { markup: string }) {
  return <g innerHTML={props.markup} />
}

/**
 * The plot of a chart root: its print (or the precompiled image in its
 * place) at the margins, the bloom over it (a blurred additive copy of the
 * print, an SVG filter of the CSS one the canvas wore), then its marks,
 * what answers the pointer.
 */
export function PlotFrame(props: { chart: Plotted; children: JSX.Element; marks?: JSX.Element }) {
  const id = createUniqueId()
  const bloom = createMemo(() => bloomOf(props.chart.bloom))
  return (
    <g transform={`translate(${props.chart.margins.left},${props.chart.margins.top})`}>
      <Show
        when={props.chart.precompiled}
        fallback={
          <>
            <g id={`${id}-print`}>{props.children}</g>
            <Show when={bloom()}>
              {(b) => (
                <>
                  <filter
                    id={`${id}-bloom`}
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                    color-interpolation-filters="sRGB"
                  >
                    <feGaussianBlur stdDeviation={b().blur} />
                    <feComponentTransfer>
                      <feFuncR type="linear" slope={b().brightness} />
                      <feFuncG type="linear" slope={b().brightness} />
                      <feFuncB type="linear" slope={b().brightness} />
                    </feComponentTransfer>
                    <feColorMatrix type="saturate" values={String(b().saturate)} />
                  </filter>
                  <use
                    href={`#${id}-print`}
                    class="dk-chart-bloom"
                    filter={`url(#${id}-bloom)`}
                    style={{ opacity: b().opacity, "mix-blend-mode": b().blend }}
                    aria-hidden="true"
                  />
                </>
              )}
            </Show>
          </>
        }
      >
        {(src) => (
          <image
            href={src()}
            width={props.chart.plot.width}
            height={props.chart.plot.height}
            preserveAspectRatio="none"
            style={{ "image-rendering": "pixelated" }}
            aria-hidden="true"
          />
        )}
      </Show>
      {props.marks}
    </g>
  )
}

/** A value as a mark shows it. */
export const spokenValue = (v: unknown) =>
  typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(v ?? "")
