import { createSignal, For } from "solid-js"
import { cssColor, DitherButton, DitherDrawer, DitherSwitch } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [settings, setSettings] = createSignal(false)
  const [gridSnap, setGridSnap] = createSignal(true)
  const [showRulers, setShowRulers] = createSignal(false)
  const [sheet, setSheet] = createSignal(false)
  const [sized, setSized] = createSignal(false)
  const [snap, setSnap] = createSignal(0.35)
  const [actions, setActions] = createSignal(false)
  const [lastAction, setLastAction] = createSignal("none")
  const [account, setAccount] = createSignal(false)
  const [security, setSecurity] = createSignal(false)
  const ACTIONS = ["Duplicate", "Rename", "Export PNG", "Move to group"]

  return (
    <div class="flex flex-wrap justify-center gap-3">
      <DitherButton onClick={() => setSettings(true)}>Open settings</DitherButton>
      <DitherButton color="purple" onClick={() => setSheet(true)}>
        Bottom sheet
      </DitherButton>
      <DitherButton
        color="pink"
        onClick={() => {
          setSized(true)
          setSnap(0.35)
        }}
      >
        Snap points
      </DitherButton>
      <DitherButton color="orange" onClick={() => setActions(true)}>
        Action sheet
      </DitherButton>
      <DitherButton color="green" onClick={() => setAccount(true)}>
        Nested
      </DitherButton>
      {/* side drawers swipe-dismiss along their axis */}
      <DitherDrawer open={settings()} side="right" title="Settings" onClose={() => setSettings(false)}>
        <p class="pb-2 text-[11px] text-muted-foreground">Swipe the panel right to dismiss.</p>
        <div class="flex items-center justify-between py-2 text-[13px]">
          <span>Snap to grid</span>
          <DitherSwitch modelValue={gridSnap()} onUpdateModelValue={setGridSnap} label="Snap to grid" color="green" />
        </div>
        <div class="flex items-center justify-between py-2 text-[13px]">
          <span>Show rulers</span>
          <DitherSwitch modelValue={showRulers()} onUpdateModelValue={setShowRulers} label="Show rulers" />
        </div>
      </DitherDrawer>
      {/* bottom sheets get a handle and dismiss downward */}
      <DitherDrawer open={sheet()} side="bottom" title="Notifications" onClose={() => setSheet(false)}>
        <p class="text-[13px] text-muted-foreground">
          You are all caught up. Drag the handle down to dismiss: a flick counts through its momentum, a slow drag
          settles back.
        </p>
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
        <p class="text-[13px] text-muted-foreground">
          Resting at <span class="text-foreground tabular-nums">{Math.round(snap() * 100)}vh</span>. Drag the handle up
          for the tall snap, down to the short one. A flick's momentum can skip straight past a point. Below half the
          smallest snap, it dismisses.
        </p>
      </DitherDrawer>
      <DitherDrawer open={actions()} side="bottom" title="Artboard" onClose={() => setActions(false)}>
        <div class="grid gap-1 pb-2">
          <For each={ACTIONS}>
            {(a) => (
              <button
                type="button"
                class="rounded-md px-3 py-2 text-left text-[13px] text-foreground/90 transition-colors hover:bg-background"
                onClick={() => {
                  setLastAction(a)
                  setActions(false)
                }}
              >
                {a}
              </button>
            )}
          </For>
          <div class="my-1 h-px bg-border/60" />
          <button
            type="button"
            class="rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-background"
            style={{ color: cssColor("red") }}
            onClick={() => {
              setLastAction("Delete")
              setActions(false)
            }}
          >
            Delete artboard
          </button>
        </div>
      </DitherDrawer>
      <p class="w-full text-center text-[11px] text-muted-foreground">last action: {lastAction()}</p>
      {/* nesting: a child drawer pushes its parent back automatically */}
      <DitherDrawer open={account()} side="right" title="Account" onClose={() => setAccount(false)}>
        <p class="pb-3 text-[13px] text-muted-foreground">
          Opening a child pushes this drawer back: scaled, dimmed, out of reach until the child closes.
        </p>
        <DitherButton color="green" onClick={() => setSecurity(true)}>
          Security settings
        </DitherButton>
        <DitherDrawer open={security()} side="right" title="Security" onClose={() => setSecurity(false)}>
          <p class="text-[13px] text-muted-foreground">Independently focus-managed; Escape closes just this one.</p>
        </DitherDrawer>
      </DitherDrawer>
    </div>
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
