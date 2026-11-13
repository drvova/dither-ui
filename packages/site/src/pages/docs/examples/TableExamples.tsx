import { createMemo, createSignal, For, Show } from "solid-js"
import { DitherButton, DitherCheckbox, DitherInput, DitherPagination } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { dataCode } from "../snippet"

type Member = { name: string; email: string; role: string; status: "active" | "away" | "offline"; joined: string }

const PAGE_SIZE = 5

const STATUS: Record<Member["status"], { color: "green" | "orange" | "grey"; label: string }> = {
  active: { color: "green", label: "Active" },
  away: { color: "orange", label: "Away" },
  offline: { color: "grey", label: "Offline" },
}

const MEMBERS: Member[] = [
  { name: "Ada Byte", email: "ada@acme.io", role: "Engineering", status: "active", joined: "2023-01-14" },
  { name: "Rei Toma", email: "rei@acme.io", role: "Design", status: "active", joined: "2023-03-02" },
  { name: "Juno Bit", email: "juno@acme.io", role: "Product", status: "away", joined: "2022-11-20" },
  { name: "Mika Dot", email: "mika@acme.io", role: "Engineering", status: "offline", joined: "2024-02-08" },
  { name: "Kai Raster", email: "kai@acme.io", role: "Support", status: "active", joined: "2023-07-19" },
  { name: "Ivy Pixel", email: "ivy@acme.io", role: "Marketing", status: "away", joined: "2022-05-30" },
  { name: "Sol Bayer", email: "sol@acme.io", role: "Engineering", status: "active", joined: "2024-06-11" },
  { name: "Nia Grid", email: "nia@acme.io", role: "Finance", status: "offline", joined: "2023-09-25" },
  { name: "Rio Halftone", email: "rio@acme.io", role: "Design", status: "active", joined: "2024-01-03" },
]

const SNIPPET = `${dataCode("start", MEMBERS)}
const STATUS: Record<string, { color: string; label: string }> = {
  active: { color: "green", label: "Active" },
  away: { color: "orange", label: "Away" },
  offline: { color: "grey", label: "Offline" },
}
const PAGE_SIZE = ${PAGE_SIZE}

const [members, setMembers] = createSignal(start)
const [query, setQuery] = createSignal("")
const [sortKey, setSortKey] = createSignal<"name" | "joined">("joined")
const [sortDir, setSortDir] = createSignal(-1)
const [page, setPage] = createSignal(1)
const [selected, setSelected] = createSignal(new Set<string>())

function sortBy(key: "name" | "joined") {
  if (sortKey() === key) setSortDir(-sortDir())
  else (setSortKey(key), setSortDir(1))
}
const filtered = createMemo(() => {
  const q = query().trim().toLowerCase()
  const rows = members().filter((m) => m.name.toLowerCase().includes(q) || m.email.includes(q))
  return [...rows].sort((a, b) => a[sortKey()].localeCompare(b[sortKey()]) * sortDir())
})
const pages = createMemo(() => Math.max(1, Math.ceil(filtered().length / PAGE_SIZE)))
const paged = createMemo(() => {
  const p = Math.min(page(), pages())
  return filtered().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
})
const allOnPage = createMemo(() => paged().length > 0 && paged().every((m) => selected().has(m.email)))

function toggleAll() {
  const next = new Set(selected())
  paged().forEach((m) => (allOnPage() ? next.delete(m.email) : next.add(m.email)))
  setSelected(next)
}
function toggleRow(email: string) {
  const next = new Set(selected())
  if (!next.delete(email)) next.add(email)
  setSelected(next)
}
function remove() {
  setMembers(members().filter((m) => !selected().has(m.email)))
  setSelected(new Set<string>())
}

<DitherInput modelValue={query()} onUpdateModelValue={setQuery} placeholder="Filter members…" aria-label="Filter members" />

{/* the selection toolbar appears while rows are checked */}
<Show when={selected().size}>
  <div class="mt-3 flex items-center justify-between text-[11px]">
    {selected().size} selected
    <DitherButton color="red" onClick={remove}>Remove</DitherButton>
  </div>
</Show>

<div class="mt-3 overflow-x-auto">
  <table class="w-full text-left text-[11px]">
    <thead>
      <tr class="border-b">
        <th><DitherCheckbox modelValue={allOnPage()} aria-label="Select page"
          onUpdateModelValue={toggleAll} /></th>
        <th aria-sort={sortKey() === 'name' ? (sortDir() === 1 ? 'ascending' : 'descending') : 'none'}>
          <button type="button" onClick={() => sortBy('name')}>Name</button>
        </th>
        <th>Role</th>
        <th>Status</th>
        <th aria-sort={sortKey() === 'joined' ? (sortDir() === 1 ? 'ascending' : 'descending') : 'none'}>
          <button type="button" onClick={() => sortBy('joined')}>Joined</button>
        </th>
      </tr>
    </thead>
    <tbody>
      <For each={paged()}>
        {(m) => (
          <tr class={selected().has(m.email) ? 'bg-card/50' : ''}>
            <td><DitherCheckbox modelValue={selected().has(m.email)} aria-label={'Select ' + m.name}
              onUpdateModelValue={() => toggleRow(m.email)} /></td>
            <td>{m.name} <span class="text-muted-foreground">{m.email}</span></td>
            <td>{m.role}</td>
            <td>
              {/* a presence dot from the palette's swatch variables */}
              <span class="inline-block size-1.5 rounded-full"
                style={{ background: 'var(--swatch-' + STATUS[m.status].color + ')' }} />
              {STATUS[m.status].label}
            </td>
            <td>{m.joined}</td>
          </tr>
        )}
      </For>
    </tbody>
  </table>
</div>

<footer class="mt-3 flex items-center justify-between text-[11px]">
  {filtered().length} members
  <DitherPagination page={page()} onUpdatePage={setPage} total={pages()} />
</footer>`

export default function TableExamples() {
  const [members, setMembers] = createSignal<Member[]>(MEMBERS)

  const [query, setQuery] = createSignal("")

  const [sortKey, setSortKey] = createSignal<"name" | "joined">("joined")

  const [sortDir, setSortDir] = createSignal<1 | -1>(-1)

  function sortBy(key: "name" | "joined") {
    if (sortKey() === key) setSortDir(sortDir() === 1 ? -1 : 1)
    else {
      setSortKey(key)
      setSortDir(1)
    }
  }

  const ariaSort = (key: "name" | "joined") =>
    sortKey() !== key ? "none" : sortDir() === 1 ? "ascending" : "descending"

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    const rows = q
      ? members().filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      : members()
    return [...rows].sort((a, b) => a[sortKey()].localeCompare(b[sortKey()]) * sortDir())
  })

  const [page, setPage] = createSignal(1)

  const pages = createMemo(() => Math.max(1, Math.ceil(filtered().length / PAGE_SIZE)))

  const paged = createMemo(() => {
    const p = Math.min(page(), pages())
    return filtered().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
  })

  const rangeLabel = createMemo(() => {
    const total = filtered().length
    if (!total) return "No members match"
    const p = Math.min(page(), pages())
    const from = (p - 1) * PAGE_SIZE + 1
    const to = Math.min(p * PAGE_SIZE, total)
    return `Showing ${from}\u2013${to} of ${total}`
  })

  const [selected, setSelected] = createSignal(new Set<string>())

  const allOnPage = createMemo(() => paged().length > 0 && paged().every((m) => selected().has(m.email)))

  function toggleAll() {
    const next = new Set(selected())
    if (allOnPage()) paged().forEach((m) => next.delete(m.email))
    else paged().forEach((m) => next.add(m.email))
    setSelected(next)
  }

  function toggleRow(email: string) {
    const next = new Set(selected())
    if (next.has(email)) next.delete(email)
    else next.add(email)
    setSelected(next)
  }

  function removeSelected() {
    setMembers(members().filter((m) => !selected().has(m.email)))
    setSelected(new Set<string>())
  }

  return (
    <>
      <section class="mt-16 scroll-mt-24" id="table-members">
        <h2 class="text-lg tracking-tight">Data table</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The whole table contract in one block: filter, sortable columns with aria-sort, page-scoped select-all, a bulk
          remove that really removes, presence dots, and dithered pagination. Filter and sort compose; the range label
          tells the truth.
        </p>
        <DemoCard code={SNIPPET}>
          <div class="mx-auto max-w-2xl rounded-lg border border-border/60 bg-background/40">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-3">
              <div>
                <div class="text-[13px] tracking-tight text-foreground">Team members</div>
                <div class="mt-0.5 text-[11px] text-muted-foreground">Everyone with workspace access.</div>
              </div>
              <DitherInput
                class="w-44 text-[11px]"
                modelValue={query()}
                onUpdateModelValue={(v) => {
                  setQuery(v)
                  setPage(1)
                }}
                placeholder="Filter members…"
              />
            </div>
            <Show when={selected().size}>
              <div class="flex items-center justify-between border-b border-border/60 bg-card/30 px-3 py-2">
                <span class="text-[11px] tabular-nums text-muted-foreground">{selected().size} selected</span>
                <DitherButton class="px-2.5 py-1 text-[10px]" color="red" onClick={removeSelected}>
                  Remove
                </DitherButton>
              </div>
            </Show>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-[11px]">
                <thead>
                  <tr class="border-b border-border/60 text-muted-foreground">
                    <th class="w-10 px-3 py-2">
                      <DitherCheckbox
                        modelValue={allOnPage()}
                        aria-label="Select page"
                        onUpdateModelValue={toggleAll}
                      />
                    </th>
                    <th class="py-2 pr-3" aria-sort={ariaSort("name")}>
                      <button
                        class="flex items-center gap-1 transition-colors hover:text-foreground"
                        type="button"
                        onClick={() => sortBy("name")}
                      >
                        Member{" "}
                        <Show when={sortKey() === "name"}>
                          <span aria-hidden="true">{sortDir() === 1 ? "↑" : "↓"}</span>
                        </Show>
                      </button>
                    </th>
                    <th class="py-2 pr-3 font-normal">Role</th>
                    <th class="py-2 pr-3 font-normal">Status</th>
                    <th class="py-2 pr-3" aria-sort={ariaSort("joined")}>
                      <button
                        class="flex items-center gap-1 transition-colors hover:text-foreground"
                        type="button"
                        onClick={() => sortBy("joined")}
                      >
                        Joined{" "}
                        <Show when={sortKey() === "joined"}>
                          <span aria-hidden="true">{sortDir() === 1 ? "↑" : "↓"}</span>
                        </Show>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={paged()}>
                    {(m) => (
                      <tr
                        class={`border-b border-border/40 transition-colors last:border-0 hover:bg-card/40 ${selected().has(m.email) ? "bg-card/50" : ""}`}
                      >
                        <td class="px-3 py-2">
                          <DitherCheckbox
                            modelValue={selected().has(m.email)}
                            aria-label={`Select ${m.name}`}
                            onUpdateModelValue={() => toggleRow(m.email)}
                          />
                        </td>
                        <td class="py-2 pr-3">
                          <div class="text-foreground">{m.name}</div>
                          <div class="text-[10px] text-muted-foreground">{m.email}</div>
                        </td>
                        <td class="py-2 pr-3 text-muted-foreground">{m.role}</td>
                        <td class="py-2 pr-3">
                          <span class="inline-flex items-center gap-1.5 text-muted-foreground">
                            <span
                              class="size-1.5 shrink-0 rounded-full"
                              style={{ "background-color": `var(--swatch-${STATUS[m.status].color})` }}
                              aria-hidden="true"
                            />{" "}
                            {STATUS[m.status].label}
                          </span>
                        </td>
                        <td class="py-2 pr-3 tabular-nums text-muted-foreground">{m.joined}</td>
                      </tr>
                    )}
                  </For>
                  <Show when={!paged().length}>
                    <tr>
                      <td class="px-3 py-8 text-center text-muted-foreground" colspan="5">
                        No members match “{query()}”.
                      </td>
                    </tr>
                  </Show>
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-between border-t border-border/60 p-3">
              <span class="text-[10px] tabular-nums text-muted-foreground">{rangeLabel()}</span>
              <DitherPagination page={page()} onUpdatePage={setPage} total={pages()} />
            </div>
          </div>
        </DemoCard>
      </section>
    </>
  )
}
