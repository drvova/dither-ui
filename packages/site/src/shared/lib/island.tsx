// Islands (the user's call: no script where the page's HTML and CSS can do
// it). A prerendered page is a `Static` part: its server renders it whole,
// without hydration keys, and its browser takes those bytes as they are,
// running none of its components; the route hands it the page on a server
// only (`Static`'s `page`), so the browser's bundle drops the
// page's code and keeps only its stylesheets. What a hand or the clock
// drives on it is an island, a module of its own named in the page's one
// table (`islands({...})`): the server renders it in place, hydratable,
// inside a `<dither-island>` that names it, and the browser loads its chunk
// and hydrates it when it nears the view, on the first hand that reaches
// it, or at once. An island's props cross as JSON. `tests/site/budget.spec.ts`
// holds the rule: no script the build ships carries a static page's words.
import { type Component, createComponent, type JSX, onMount, sharedConfig } from "solid-js"
import { Dynamic, getRequestEvent, hydrate, NoHydration, useAssets } from "solid-js/web"
import { getManifest } from "solid-start:get-manifest"
import { lazyPart } from "./lazy-part"

/** A JSON value: what an island's props may hold. */
type IslandValue = string | number | boolean | null | IslandValue[] | { [key: string]: IslandValue }

/** When an island wakes: as it nears the view (`visible`), once the page
 * has loaded and the main thread is free (`idle`), or with the page
 * (`load`); a pointer over it or focus into it wakes it at once. */
type IslandWhen = "visible" | "idle" | "load"

type IslandModule<P extends Record<string, any>> = { default: Component<P>; id$$?: string }

type IslandRow<P extends Record<string, any>> = { load: () => Promise<IslandModule<P>>; when?: IslandWhen }

type IslandRows = Record<string, IslandRow<any>>

type PropsOf<R> = R extends IslandRow<infer P> ? P : never

/** A page's islands: each row as the component the static page renders,
 * and the table the browser wakes them from. */
type Islands<T extends IslandRows> = { [K in keyof T]: Component<PropsOf<T[K]>> } & {
  readonly [ROWS]: T
  readonly [ROOT]: Root
  readonly [READY]: Promise<unknown>
}

const ROWS = Symbol("islands")
const ROOT = Symbol("root")
const READY = Symbol("ready")

/** What stands around every island of a table, on the server and in the
 * browser alike (the app's own providers: an island hydrates as a root of
 * its own, outside the app's). */
type Root = Component<{ children?: JSX.Element }>

/** `Island` inside `root`, as both sides render it. */
const within = (root: Root, Island: Component<any>, props: Record<string, unknown>) =>
  createComponent(root, {
    get children() {
      return createComponent(Island, props)
    },
  })

/** The custom element every island stands in: laid out as if it were not
 * there (`display: contents`, `app/styles.css`). */
const ISLAND_TAG = "dither-island"

/** How far ahead of the view a `visible` island wakes. */
const NEAR = "50% 0px"

/** The page's islands, by name. On a server each module is loaded before
 * any page renders (`ready`), with the stylesheets its chunk carries, so
 * the page's bytes hold every island in place and paint styled. */
export function islands<T extends IslandRows>(rows: T, root: Root): Islands<T> {
  const loading: Promise<void>[] = []
  const out = { [ROWS]: rows, [ROOT]: root } as Record<string | symbol, unknown>
  for (const name of Object.keys(rows) as (keyof T & string)[]) {
    const row = rows[name]
    let mod: IslandModule<any> | undefined
    let sheets: string[] = []
    const ready = import.meta.env.SSR
      ? row.load().then(async (m) => {
          mod = m
          const id = m.id$$
          if (!id) return
          const assets = await getManifest(import.meta.env.DEV ? "ssr" : "client").getAssets(id)
          sheets = assets.filter((a) => a.attrs.rel === "stylesheet").map((a) => a.attrs.href)
        })
      : undefined
    if (ready) loading.push(ready)
    // Rendered by a browser (a page rendered anew there, a component spec),
    // an island is a lazy part like any other.
    const Here = import.meta.env.SSR ? undefined : lazyPart(row.load)
    const Island = (props: Record<string, IslandValue>) => {
      if (Here) return within(root, Here, props)
      if (!mod) throw new Error(`island ${name} rendered before its module loaded`)
      const ctx = sharedConfig.context
      if (!ctx || !(ctx as { noHydrate?: boolean }).noHydrate)
        throw new Error(`island ${name} outside a static part: the app hydrates it already`)
      const linked = sheetsOf(getRequestEvent())
      for (const href of sheets)
        if (!linked.has(href)) {
          linked.add(href)
          useAssets(() => <link rel="stylesheet" href={href} />)
        }
      // Hydratable inside: the keys run under an id of its own, which the
      // browser's `hydrate` is handed back.
      const id = sharedConfig.getNextContextId()
      sharedConfig.context = { ...ctx, id, count: 0, noHydrate: false } as typeof ctx
      let inner: JSX.Element
      try {
        inner = within(root, mod.default, props)
      } finally {
        sharedConfig.context = ctx
      }
      const json = Object.keys(props).length ? JSON.stringify(props) : undefined
      return (
        <Dynamic
          component={ISLAND_TAG}
          data-island={name}
          data-hid={id}
          data-when={row.when ?? "visible"}
          data-props={json}
        >
          {inner}
        </Dynamic>
      )
    }
    out[name] = Island
  }
  out[READY] = Promise.all(loading)
  return out as Islands<T>
}

// The stylesheets a page's head links already, so two islands of one
// module link theirs once.
const LINKED = new WeakMap<object, Set<string>>()
function sheetsOf(event: object | undefined): Set<string> {
  if (!event) return new Set()
  let set = LINKED.get(event)
  if (!set) LINKED.set(event, (set = new Set()))
  return set
}

/** Every island module of a table loaded, on a server: awaited where the
 * page's table is made, as a lazy part's preload is. */
export const islandsReady = <T extends IslandRows>(table: Islands<T>): Promise<unknown> => table[READY]

/** A page that is HTML and CSS once rendered: the server renders `page`
 * without hydration keys, and the browser keeps the bytes (what moves on
 * them is their stylesheets', `RiseWords.css`) and wakes `islands`. The route hands `page` over only on a server,
 * chosen at its module's top (`const Page = import.meta.env.SSR ? Landing :
 * undefined`): a condition in JSX is compiled into a memo no bundler folds,
 * and the page's code shipped with it. */
export function Static<T extends IslandRows>(props: { islands: Islands<T>; page: Component | undefined }) {
  onMount(() => {
    wake(props.islands[ROWS], props.islands[ROOT])
  })
  return <NoHydration>{props.page && createComponent(props.page, {})}</NoHydration>
}

// One island hydrates at a time: hydration is one shared state.
let queue = Promise.resolve()

function wake(rows: IslandRows, root: Root) {
  // An island has no box of its own (`display: contents`): it is near the
  // view when one of the elements it holds is.
  const islandOf = new Map<Element, HTMLElement>()
  const near =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            // a target's newest entry says where it stands
            const latest = new Map(entries.map((e) => [e.target, e]))
            for (const [el, entry] of latest) {
              const island = islandOf.get(el)
              if (entry.isIntersecting && island) start(island)
            }
          },
          { rootMargin: NEAR },
        )
  const started = new WeakSet<HTMLElement>()
  function start(el: HTMLElement) {
    if (started.has(el)) return
    started.add(el)
    for (const child of el.children) near?.unobserve(child)
    const row = rows[el.dataset.island ?? ""]
    if (!row) return
    const loading = row.load()
    queue = queue.then(() => loading.then((m) => hydrateIsland(el, root, m.default)).catch(console.error))
  }
  for (const el of document.querySelectorAll<HTMLElement>(ISLAND_TAG)) {
    if (!rows[el.dataset.island ?? ""]) continue
    const now = () => start(el)
    el.addEventListener("pointerover", now, { once: true, passive: true })
    el.addEventListener("focusin", now, { once: true })
    el.addEventListener("touchstart", now, { once: true, passive: true })
    const when = el.dataset.when as IslandWhen
    const boxes = [...el.children]
    if (when === "load") now()
    else if (when === "idle") idle(now)
    else if (near && boxes.length)
      for (const child of boxes) {
        islandOf.set(child, el)
        near.observe(child)
      }
    else now()
  }
}

const idle = (go: () => void) => {
  const after = () =>
    typeof requestIdleCallback === "function" ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 200)
  if (document.readyState === "complete") after()
  else addEventListener("load", after, { once: true })
}

type Hydration = { done?: boolean; events?: unknown[] | null; completed?: WeakSet<Element> | null }

/** Hydrate `el`'s island in place, under the id its server rendered it at.
 * Solid marks hydration over at the first event it handles; each island is
 * a hydration of its own, so the marks are set back for it. Its lazy parts
 * take over their bytes a turn later, from the island's own registry, so
 * the next island waits for them (Solid counts them, `count`). */
async function hydrateIsland(el: HTMLElement, root: Root, Island: Component<any>) {
  const hy = (globalThis as { _$HY?: Hydration })._$HY
  const shared = sharedConfig as { done?: boolean; count?: number }
  if (hy) {
    hy.done = false
    hy.events ??= []
    hy.completed ??= new WeakSet()
  }
  shared.done = false
  const props = el.dataset.props ? (JSON.parse(el.dataset.props) as Record<string, IslandValue>) : {}
  hydrate(() => within(root, Island, props), el, { renderId: el.dataset.hid })
  for (let turn = 0; (shared.count ?? 0) > 0 && turn < 600; turn++) await new Promise((go) => setTimeout(go, 16))
}
