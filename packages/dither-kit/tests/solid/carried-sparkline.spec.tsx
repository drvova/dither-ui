// A sparkline hands its sparkle and hover-lift switches to the chart under
// it (carried from the kit's earlier sparkline spec when it went). The chart
// root is stood in for, so what it is handed can be read.
import { cleanup, render } from "@solidjs/testing-library"
import { afterEach, expect, it, vi } from "vitest"
import Sparkline from "../../src/solid/Sparkline"

const handed: { sparkles?: boolean; hoverLift?: boolean }[] = []
vi.mock("../../src/solid/area-chart", () => ({
  AreaChart: (props: { sparkles?: boolean; hoverLift?: boolean }) => {
    handed.push({ sparkles: props.sparkles, hoverLift: props.hoverLift })
    return null
  },
  LineChart: () => null,
}))

afterEach(cleanup)

it("hands its sparkle and hover-lift switches to the chart", () => {
  render(() => <Sparkline data={[1, 3, 2, 5, 4]} color="blue" sparkles={false} hoverLift={false} />)
  expect(handed).toEqual([{ sparkles: false, hoverLift: false }])
  handed.length = 0
  render(() => <Sparkline data={[1, 3, 2, 5, 4]} color="blue" />)
  expect(handed).toEqual([{ sparkles: true, hoverLift: true }])
})
