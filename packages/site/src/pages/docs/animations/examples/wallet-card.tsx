import { createSignal } from "solid-js"
import { DitherWalletCard } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const accounts = [
    { value: "main", label: "Main", address: "0x7f3a9c2e14b7d55aa93d", balance: 12480.52, change: 2.4 },
    {
      value: "savings",
      label: "Savings",
      address: "0x8b21e0c4a6f9d1327e55",
      balance: 8210.11,
      change: -1.1,
      color: "purple",
    },
    {
      value: "trading",
      label: "Trading",
      address: "0x91cc4db2e87a30f6b214",
      balance: 3033.7,
      change: 0.6,
      color: "orange",
    },
  ] as { value: string; label: string; address: string; balance: number; change: number; color?: "purple" | "orange" }[]
  const [account, setAccount] = createSignal("main")
  const [note, setNote] = createSignal("none")

  // the switcher and search morph from their triggers, the digits cascade, privacy masks the
  // balance, copying the address answers with a check
  return (
    <div class="flex min-h-72 flex-col items-center justify-center gap-3">
      <DitherWalletCard
        modelValue={account()}
        onUpdateModelValue={setAccount}
        accounts={accounts}
        recent={["gas fees", "swap history"]}
        notifications
        onAction={setNote}
        onSubmit={(query) => setNote("search: " + query)}
        onNotify={() => setNote("notifications")}
        class="w-full max-w-80"
      />
      <p class="font-mono text-[10px] text-muted-foreground">last: {note()}</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherWalletCard,
  title: "Wallet card",
  studio: {
    group: "display",
    frame: { w: 360, h: 250 },
    controls: {
      color: { demo: "blue" },
      accounts: { kind: "list", demo: ["Main", "Savings", "Trading"] },
      currency: {},
      notifications: {},
    },
  },
  states: [{ currency: "€" }],
})
