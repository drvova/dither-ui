import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import shellProps from "virtual:dither-props/DitherShell"
import railProps from "virtual:dither-props/DitherRail"
import consoleProps from "virtual:dither-props/DitherConsole"
import canvasProps from "virtual:dither-props/DitherCanvas"
import gridProps from "virtual:dither-props/DitherGrid"
import infiniteCanvasProps from "virtual:dither-props/DitherInfiniteCanvas"
import DocSection from "../DocSection"
import DitherShellExample from "./examples/dither-shell"
import ditherShellCode from "./examples/dither-shell.tsx?raw"
import RailExample from "./examples/rail"
import railCode from "./examples/rail.tsx?raw"
import ConsoleExample from "./examples/console"
import consoleCode from "./examples/console.tsx?raw"
import CanvasExample from "./examples/canvas"
import canvasCode from "./examples/canvas.tsx?raw"
import GridExample from "./examples/grid"
import gridCode from "./examples/grid.tsx?raw"
import InfiniteCanvasExample from "./examples/infinite-canvas"
import infiniteCanvasCode from "./examples/infinite-canvas.tsx?raw"

export const API: Record<string, PropRow[]> = {
  shell: kitTable(shellProps, { join: [["topbar", "aside", "statusbar", "children"]] }),
  rail: kitTable(railProps, { join: [["header", "footer", "children"]] }),
  console: kitTable(consoleProps),
  canvas: kitTable(canvasProps),
  grid: kitTable(gridProps),
  infinite: kitTable(infiniteCanvasProps, { join: [["minZoom", "maxZoom"]] }),
}

export default function LayoutDocs() {
  return (
    <>
      {/* Shell */}
      <DocSection id="dither-shell">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The app frame: topbar over an aside + content pair, statusbar under, every region a prop. Below, a whole SaaS
          dashboard from the layout family: rail, canvas, grid, sparkline cards, a live console.
        </p>
        <DemoCard code={ditherShellCode}>
          <DitherShellExample />
        </DemoCard>
        <PropsTable rows={API.shell} />
      </DocSection>

      {/* Rail */}
      <DocSection id="rail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The permanent icon rail as a first-class piece. It provides the sidebar's collapsed context, so plain sidebar
          items fold their labels with zero extra props. Tooltips carry the words.
        </p>
        <DemoCard code={railCode}>
          <RailExample />
        </DemoCard>
        <PropsTable rows={API.rail} />
      </DocSection>

      {/* Console */}
      <DocSection id="console">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A monospace log surface: lines tint by level, follow mode pins the newest output, the caret blinks politely.
          Run the deploy and watch it stream.
        </p>
        <DemoCard code={consoleCode}>
          <ConsoleExample />
        </DemoCard>
        <PropsTable rows={API.console} />
      </DocSection>

      {/* Canvas */}
      <DocSection id="canvas">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The work surface a dashboard sits on: a dotted or ruled field inked with the border token, content floating
          above.
        </p>
        <DemoCard code={canvasCode}>
          <CanvasExample />
        </DemoCard>
        <PropsTable rows={API.canvas} />
      </DocSection>

      {/* Grid */}
      <DocSection id="grid">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dashboard columns without media queries: cards auto-fit to a minimum width, or take a deliberate fixed count.
          Drag the number and watch the flow.
        </p>
        <DemoCard code={gridCode}>
          <GridExample />
        </DemoCard>
        <PropsTable rows={API.grid} />
      </DocSection>

      {/* Infinite canvas */}
      <DocSection id="infinite-canvas">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pannable, zoomable work surface: drag to pan, wheel to zoom toward the cursor, and the dot field rides the
          same transform so space feels real. The zoom is two-way: zoom with onUpdateZoom.
        </p>
        <DemoCard code={infiniteCanvasCode}>
          <InfiniteCanvasExample />
        </DemoCard>
        <PropsTable rows={API.infinite} />
      </DocSection>
    </>
  )
}
