// A lazily loaded part waits in its own place (`shared/lib/lazy-part.tsx`):
// a bare `lazy` under the page's one Suspense emptied the whole page while
// its chunk loaded, and the reader scrolling into it was thrown back to the
// top (the landing's bento cards). Here: the part's place waits and the page
// stays, and no module of the site loads a part any other way.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { cleanup, render } from "@solidjs/testing-library"
import { createSignal, lazy, Show, Suspense } from "solid-js"
import { afterEach, describe, expect, it } from "vitest"
import { lazyPart } from "@/shared/lib/lazy-part"

afterEach(cleanup)

/** A chunk that loads when `arrive` is called. */
function chunk() {
  let arrive!: () => void
  const loaded = new Promise<{ default: () => any }>((resolve) => {
    arrive = () => resolve({ default: () => <b>part</b> })
  })
  return { load: () => loaded, arrive: () => arrive() }
}

const tick = () => new Promise((r) => setTimeout(r, 0))

describe("a lazily loaded part", () => {
  it("leaves the page standing while its chunk loads, then shows", async () => {
    const { load, arrive } = chunk()
    const Part = lazyPart(load)
    const [near, setNear] = createSignal(false)
    const { container } = render(() => (
      <Suspense>
        <p>page</p>
        <Show when={near()}>
          <Part />
        </Show>
      </Suspense>
    ))
    expect(container.textContent).toBe("page")
    setNear(true)
    await tick()
    expect(container.textContent).toBe("page")
    arrive()
    await tick()
    await tick()
    expect(container.textContent).toBe("pagepart")
  })

  it("is what a bare lazy got wrong: the page emptied while it loaded", async () => {
    const { load } = chunk()
    const Part = lazy(load)
    const [near, setNear] = createSignal(false)
    const { container } = render(() => (
      <Suspense>
        <p>page</p>
        <Show when={near()}>
          <Part />
        </Show>
      </Suspense>
    ))
    setNear(true)
    await tick()
    expect(container.textContent).toBe("")
  })

  it("loads ahead of its mount", async () => {
    const { load, arrive } = chunk()
    const Part = lazyPart(load)
    const ahead = Part.preload()
    arrive()
    expect((await ahead).default).toBeTypeOf("function")
  })
})

describe("the site's lazy parts", () => {
  const src = join(import.meta.dirname, "../../src")
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : []
    })

  it("all load through lazyPart", () => {
    const bare = files(src)
      .filter((path) => !path.endsWith("lazy-part.tsx"))
      .filter((path) => /\blazy\s*(<[^>]*>)?\s*\(/.test(readFileSync(path, "utf8")))
      .map((path) => relative(src, path))
    expect(bare).toEqual([])
  })
})
