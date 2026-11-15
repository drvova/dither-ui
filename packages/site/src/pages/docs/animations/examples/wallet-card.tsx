import { createSignal } from "solid-js"
import { DitherWalletCard } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [account, setAccount] = createSignal("main")
  const [last, setLast] = createSignal("none")

  return (
    <>
      {/* the switcher and search morph from their triggers, the digits cascade,
           privacy masks the balance, copying the address answers with a check */}
      <DitherWalletCard
        modelValue={account()}
        onUpdateModelValue={setAccount}
        accounts={[
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
        ]}
        recent={["gas fees", "swap history"]}
        notifications
        onAction={(name) => setLast(name)}
        onSubmit={(query) => setLast("search: " + query)}
        onNotify={() => setLast("notifications")}
        class="w-full max-w-80"
      />
      <p class="text-[10px]">last: {last()}</p>
    </>
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
