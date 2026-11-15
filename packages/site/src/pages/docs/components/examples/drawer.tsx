import { createSignal } from "solid-js"
import { DitherDrawerIndent, DitherButton, DitherDrawer, DitherSwipeArea } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [settings, setSettings] = createSignal(false)
  const [sheet, setSheet] = createSignal(false)
  const [sized, setSized] = createSignal(false)
  const [snap, setSnap] = createSignal(0.35)
  const [account, setAccount] = createSignal(false)
  const [security, setSecurity] = createSignal(false)

  return (
    <>
      {/* indent: what DitherDrawerIndent holds (your app) scales back while any drawer is open */}
      <DitherDrawerIndent>
        <div class="flex flex-wrap gap-3">
          <DitherButton onClick={() => setSettings(true)}>Open settings</DitherButton>
          <DitherButton color="purple" onClick={() => setSheet(true)}>
            Bottom sheet
          </DitherButton>
          <DitherButton color="pink" onClick={() => setSized(true)}>
            Snap points
          </DitherButton>
          <DitherButton color="green" onClick={() => setAccount(true)}>
            Nested
          </DitherButton>
        </div>
      </DitherDrawerIndent>

      {/* side drawers swipe-dismiss along their axis;
           bottom sheets get a handle and dismiss downward */}
      <DitherDrawer open={settings()} side="right" title="Settings" onClose={() => setSettings(false)}>
        <p class="text-[13px]">Swipe the panel right to dismiss.</p>
      </DitherDrawer>
      <DitherDrawer open={sheet()} side="bottom" title="Notifications" onClose={() => setSheet(false)}>
        <p class="text-[13px]">You are all caught up.</p>
      </DitherDrawer>

      {/* snap points: vh fractions or px; flicks can skip points */}
      <DitherDrawer
        snapPoint={snap()}
        onUpdateSnapPoint={setSnap}
        open={sized()}
        side="bottom"
        title="Snap points"
        snapPoints={[0.35, 0.75]}
        onClose={() => setSized(false)}
      >
        <p class="text-[13px]">Resting at {Math.round(snap() * 100)}vh.</p>
      </DitherDrawer>

      {/* nesting: a child drawer pushes its parent back automatically */}
      <DitherDrawer open={account()} side="right" title="Account" onClose={() => setAccount(false)}>
        <DitherButton onClick={() => setSecurity(true)}>Security</DitherButton>
        <DitherDrawer open={security()} side="right" title="Security" onClose={() => setSecurity(false)}>
          <p class="text-[13px]">Two-factor sign-in is on.</p>
        </DitherDrawer>
      </DitherDrawer>

      {/* swipe-to-open from the viewport edge */}
      <DitherSwipeArea side="right" onOpen={() => setSettings(true)} />
    </>
  )
}

export const meta = defineExample({
  component: DitherDrawer,
  title: "Drawer",
  studio: {
    group: "overlays",
    frame: { w: 300, h: 160 },
    controls: {
      side: { options: ["right", "left", "bottom"] },
      title: { demo: "Drawer" },
      swipe: {},
      modal: {},
      dismissible: {},
    },
    slot: "Drawer content",
    model: { prop: "open", event: "close" },
  },
})
