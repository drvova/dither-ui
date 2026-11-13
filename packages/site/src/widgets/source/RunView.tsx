// A run's component inside an error boundary: what it throws while it sets
// up or renders shows here, in the preview, instead of taking the docs page
// down with it.
import type { Component } from "solid-js"
import { ErrorBoundary } from "solid-js"
import { Dynamic } from "solid-js/web"

export type RunViewProps = { component: Component }

export default function RunView(props: RunViewProps) {
  return (
    <ErrorBoundary
      fallback={(e: unknown) => (
        <p role="alert" class="m-0 font-mono text-[12px] text-muted-foreground">
          <span class="text-foreground">The run stopped.</span>{" "}
          {e instanceof Error ? `${e.name}: ${e.message}` : String(e)}
        </p>
      )}
    >
      <Dynamic component={props.component} />
    </ErrorBoundary>
  )
}
