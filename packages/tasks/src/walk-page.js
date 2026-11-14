// The walk's page scripts (walk.mjs): each a function of the page, given
// `arg`, its answer what the walk records. Real JavaScript, so the lint
// reads it; loaded into every page before the page's own scripts (Playwright
// takes it as an init script, `addInitScript({ path })`; over WebDriver it
// rides ahead of each script the walk runs: walk-drivers.mjs). The
// recorder's helpers are `window.__walk`. The top page only: a frame of the
// page (a built tool's sandbox) is not walked.
;(() => {
  if (window !== window.top || window.__walkPage) return
  window.__walkPage = {
    /** The app has mounted over the prerendered bytes and the page is at rest. */
    async ready(arg) {
      const W = window.__walk
      await W.until(() => document.readyState === "complete", 20000)
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, W.sleep(4000)])
      await W.sleep((arg && arg.settle) || 600)
      return {
        title: document.title,
        w: innerWidth,
        h: innerHeight,
        ratio: devicePixelRatio,
        dark: document.documentElement.classList.contains("dark"),
        overflow: document.documentElement.scrollWidth - innerWidth,
      }
    },

    async recordFailed() {
      return window.__walk.failed.splice(0)
    },

    async record() {
      const W = window.__walk
      const released = W.released
      W.released = 0
      return { errors: W.errors.splice(0), logs: W.logs.splice(0), failed: W.failed.splice(0), released }
    },

    /** The docs section's cards, counted once the section's own pack has loaded. */
    async cards(arg) {
      const W = window.__walk
      const section = document.getElementById(arg.id)
      if (!section) return { missing: true }
      await W.until(() => section.querySelector("[data-demo-card]"), 6000)
      await W.sleep(300)
      const cards = [...document.querySelectorAll("[data-demo-card]")]
      const shown = (c) => c.closest("section[id]") === section && c.getClientRects().length > 0
      return {
        elsewhere: cards.filter((c) => !shown(c)).length,
        heading: (section.querySelector("h1,h2") || {}).textContent || "",
        text: section.innerText.length,
        cards: cards.map((c) => (shown(c) ? arg.id : "")),
        loose: [...section.querySelectorAll("canvas")].filter((c) => !c.closest("[data-demo-card]")).length,
      }
    },

    /** One card brought into view, revealed and settled; its canvases read. A
     * canvas that reads blank gets a while longer: a model still loading, a
     * surface that paints on its first frame in view. */
    async card(arg) {
      const W = window.__walk
      const card = arg.n < 0 ? document.getElementById(arg.id) : document.querySelectorAll("[data-demo-card]")[arg.n]
      if (!card) return { missing: true }
      const well = arg.n < 0 ? card : card.querySelector(".demo-well")
      if (arg.n >= 0) card.scrollIntoView({ block: "center" })
      const waiting = () => arg.n >= 0 && well.querySelector(":scope > div > [aria-hidden=true].animate-pulse")
      const revealed = arg.n < 0 || !!(await W.until(() => !waiting(), 6000))
      await W.frames(3)
      await W.sleep(arg.settle)
      const list = () =>
        [...well.querySelectorAll("canvas")].filter((c) => arg.n >= 0 || !c.closest("[data-demo-card]"))
      const read = async () => {
        const seen = []
        for (const c of list()) {
          let s = W.canvas(c)
          if (s.state !== "painted" && s.state !== "hidden") {
            const r = c.getBoundingClientRect()
            if (r.top < 0 || r.bottom > innerHeight) {
              c.scrollIntoView({ block: "center" })
              await W.frames(3)
              s = W.canvas(c)
            }
          }
          seen.push(s)
        }
        return W.layers(seen)
      }
      let canvases = await read()
      const end = Date.now() + arg.patience
      const empty = () => canvases.some((c) => c.state === "blank" || c.state === "flat")
      if (empty()) {
        // a surface that prints under a pointer is given one
        const all = list()
        for (let i = 0; i < all.length; i++) if (canvases[i].state === "blank") canvases[i] = await W.poke(all[i])
        W.layers(canvases)
        while (empty() && Date.now() < end) {
          await W.sleep(250)
          canvases = await read()
        }
      }
      const alert = well.querySelector("[role=alert]")
      const content = arg.n < 0 ? well : well.firstElementChild
      return {
        revealed,
        canvases,
        text: well.innerText.trim().length,
        rendered: content.children.length > 0 && content.getBoundingClientRect().height > 1,
        alert: alert ? alert.textContent.slice(0, 200) : "",
      }
    },

    /** A canvas the page could not read, centred for a screenshot. */
    async centre(arg) {
      const card = arg.n < 0 ? document.getElementById(arg.id) : document.querySelectorAll("[data-demo-card]")[arg.n]
      const well = arg.n < 0 ? card : card.querySelector(".demo-well")
      const c = [...well.querySelectorAll("canvas")][arg.i]
      if (!c) return null
      c.scrollIntoView({ block: "center" })
      await window.__walk.frames(3)
      await window.__walk.sleep(200)
      const r = c.getBoundingClientRect()
      const x = Math.max(0, r.left),
        y = Math.max(0, r.top)
      return [x, y, Math.min(innerWidth, r.right) - x, Math.min(innerHeight, r.bottom) - y]
    },

    /** The Code tab: opened, every file tab picked and read. */
    async code(arg) {
      const W = window.__walk
      const card = document.querySelectorAll("[data-demo-card]")[arg.n]
      card.scrollIntoView({ block: "start" })
      const tabs = card.querySelector("[role=tablist]").querySelectorAll("[role=tab]")
      tabs[1].click()
      const panel = await W.until(() => card.querySelector(".source-panel-scope"), 10000)
      if (!panel) return { opened: false }
      const area = () => panel.querySelector("[role=tabpanel] textarea")
      const loaded = (name) =>
        W.until(() => {
          const note = panel.querySelector("[role=tabpanel] .src-note")
          if (note && /Couldn't load/.test(note.textContent)) return { error: note.textContent.trim() }
          const t = area()
          return t && t.value && t.getAttribute("aria-label") === name + " source" ? { text: t.value } : null
        }, 10000)
      const files = []
      const fileTabs = () => [...panel.querySelectorAll(".src-tab")]
      await W.until(() => fileTabs().length, 5000)
      // the kit's files join the example's once the kit's index has loaded
      let count = -1
      await W.until(async () => {
        const n = fileTabs().length
        const same = n === count
        count = n
        if (!same) await W.sleep(250)
        return same
      }, 6000)
      for (let i = 0; i < fileTabs().length; i++) {
        const tab = fileTabs()[i]
        tab.click()
        const name = tab.dataset.path.split("/").pop()
        const got = await loaded(name)
        files.push({
          path: tab.dataset.path,
          name,
          selected: tab.getAttribute("aria-selected") === "true",
          size: got && got.text ? got.text.length : 0,
          error: got ? got.error || "" : "never loaded",
          text: i === 0 && got && got.text ? got.text : undefined,
        })
      }
      fileTabs()[0].click()
      await loaded(files[0].name)
      const run = panel.querySelector(".src-run")
      return {
        opened: true,
        files,
        runnable: run.getAttribute("aria-disabled") !== "true",
        why: run.getAttribute("title") || "",
        styling: (card.querySelector("[aria-label=Styling] [aria-pressed=true]") || {}).textContent || "",
      }
    },

    /** Edit the example (a line the module runs as it loads, so a run that
     * leaves its mark compiled and evaluated the edited text) and Run it; read
     * the result standing in the preview; restore the demo. */
    async run(arg) {
      const W = window.__walk
      const card = document.querySelectorAll("[data-demo-card]")[arg.n]
      const panel = card.querySelector(".source-panel-scope")
      const area = panel.querySelector("[role=tabpanel] textarea")
      const mark = "walk" + Date.now() + "_" + arg.n
      const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set
      set.call(area, area.value + "\n;(globalThis.__walkRan = " + JSON.stringify(mark) + ")\n")
      area.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }))
      await W.frames(2)
      const edited = !!panel.querySelector(".src-tab .src-dot")
      const run = panel.querySelector(".src-run")
      const started = Date.now()
      run.click()
      const restore = () =>
        [...card.querySelectorAll("button")].find((b) => b.textContent.trim() === "Restore the demo")
      const done = await W.until(() => {
        if (run.textContent.trim() === "Running") return null
        const problems = [...panel.querySelectorAll(".src-problems li")].map((li) =>
          li.textContent.trim().slice(0, 300),
        )
        if (problems.length) return { problems }
        return restore() && globalThis.__walkRan === mark ? { ran: true } : restore() ? null : null
      }, arg.patience)
      const result = {
        edited,
        ms: Date.now() - started,
        ran: !!(done && done.ran),
        problems: (done && done.problems) || [],
        timeout: !done,
        marked: globalThis.__walkRan === mark,
        status: (panel.querySelector(".src-status") || {}).textContent || "",
      }
      if (!result.ran) {
        // put the example back as it was
        const revert = panel.querySelector(".src-key[aria-label^=Revert]")
        if (revert) revert.click()
        return result
      }
      const well = card.querySelector(".demo-well")
      well.scrollIntoView({ block: "center" })
      await W.frames(3)
      await W.sleep(arg.settle)
      const stopped = well.querySelector("[role=alert]")
      result.stopped =
        stopped && /The run stopped/.test(stopped.textContent) ? stopped.textContent.trim().slice(0, 300) : ""
      const all = () => [...well.querySelectorAll("canvas")]
      const read = () => W.layers(all().map(W.canvas))
      let canvases = read()
      const empty = () => canvases.some((c) => c.state === "blank" || c.state === "flat")
      if (empty()) {
        for (let i = 0; i < all().length; i++) if (canvases[i].state === "blank") canvases[i] = await W.poke(all()[i])
        W.layers(canvases)
        const end = Date.now() + 2500
        while (empty() && Date.now() < end) {
          await W.sleep(250)
          canvases = read()
        }
      }
      result.canvases = canvases
      // rendered: the run put elements in the preview; visible: one of them has a box
      // (a surface that fills its parent has none when the example gives it no size)
      const made = [...well.firstElementChild.querySelectorAll("*")]
      result.rendered = made.length > 0
      result.visible = made.some((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 1 && r.height > 1
      })
      restore().click()
      await W.frames(2)
      result.restored = !restore()
      const revert = panel.querySelector(".src-key[aria-label^=Revert]")
      if (revert) revert.click()
      return result
    },

    async preview(arg) {
      const card = document.querySelectorAll("[data-demo-card]")[arg.n]
      card.querySelector("[role=tablist]").querySelectorAll("[role=tab]")[0].click()
      await window.__walk.frames(2)
      return true
    },

    /** A long page read top to bottom: every canvas that comes into view, as it
     * stands there. */
    async scroll(arg) {
      const W = window.__walk
      const seen = new Map()
      const look = () => {
        for (const c of document.querySelectorAll("canvas")) {
          const r = c.getBoundingClientRect()
          if (r.bottom < 0 || r.top > innerHeight) continue
          const s = W.canvas(c)
          const was = seen.get(c)
          if (!was || was.state !== "painted") seen.set(c, s)
        }
      }
      const step = Math.round(innerHeight * 0.6)
      let y = 0
      for (let i = 0; i < 400; i++) {
        scrollTo(0, y)
        await W.frames(2)
        await W.sleep(arg.pause)
        look()
        if (y >= document.documentElement.scrollHeight - innerHeight - 1) break
        y = Math.min(y + step, document.documentElement.scrollHeight - innerHeight)
      }
      await W.sleep(600)
      look()
      for (const [c, s] of seen) {
        if (s.state !== "blank") continue
        c.scrollIntoView({ block: "center" })
        await W.frames(3)
        await W.sleep(arg.pause)
        let now = W.canvas(c)
        if (now.state === "blank") now = await W.poke(c)
        // a layer of a surface whose other canvas is painted
        if (
          now.state === "blank" &&
          [...c.parentElement.querySelectorAll("canvas")].some((o) => o !== c && W.canvas(o).state === "painted")
        )
          now.state = "layer"
        seen.set(c, now)
      }
      const height = document.documentElement.scrollHeight
      scrollTo(0, 0)
      return {
        height,
        canvases: [...seen.values()],
        sections: document.querySelectorAll("section[id]").length,
        cards: document.querySelectorAll("[data-demo-card]").length,
      }
    },

    /** The Studio: a frame added from the library, selected, a property changed
     * in the inspector, undone and redone, search opened. */
    async studio() {
      const W = window.__walk
      const out = { steps: [] }
      const step = (name, ok, detail) =>
        out.steps.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail).slice(0, 300) })
      const named = (label) =>
        [...document.querySelectorAll("button")].find(
          (b) => (b.getAttribute("aria-label") || b.textContent.trim()) === label,
        )
      const api = await W.until(() => window.ditherStudio, 15000)
      step("the Studio answers on window.ditherStudio", api)
      if (!api) return out
      const doc = () => (typeof api.document === "function" ? api.document() : api.document)
      const frames = () => document.querySelectorAll("[data-artboard-id]")
      await W.until(() => frames().length, 8000)
      await W.sleep(800)
      const before = frames().length
      step("a frame stands on the canvas", before > 0, before)
      const first = W.until(() => {
        const c = frames()[0] && frames()[0].querySelector("canvas")
        return c && W.canvas(c).state === "painted"
      }, 5000)
      step("its chart is painted", await first)

      named("Library").click()
      const library = await W.until(() => document.querySelector('[role=dialog][aria-label="Component library"]'), 4000)
      step("the library opens", library)
      if (!library) return out
      const items = [...library.querySelectorAll(".library-item")]
      const registry = typeof api.registry === "function" ? await api.registry() : api.registry
      step(
        "the library lists the registry",
        registry && items.length >= registry.components.length,
        items.length + " items",
      )
      const pick = items.find((b) => b.textContent.includes("DitherSwitch"))
      pick.click()
      await W.until(() => frames().length === before + 1, 4000)
      step("the library adds a frame", frames().length === before + 1, frames().length)
      const added = frames()[frames().length - 1]
      const id = added.dataset.artboardId

      // select the first frame, then the new one, by its name plate
      const side = async () => {
        let s = document.querySelector('aside[aria-label="Properties and layers"]')
        if (!s) {
          named("Toggle properties and layers").click()
          s = await W.until(() => document.querySelector('aside[aria-label="Properties and layers"]'), 4000)
        }
        return s
      }
      const panel = await side()
      step("the inspector opens", panel)
      if (!panel) return out
      const press = (el) => {
        const r = el.getBoundingClientRect()
        const at = {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
          buttons: 1,
        }
        el.dispatchEvent(new PointerEvent("pointerdown", at))
        el.dispatchEvent(new MouseEvent("mousedown", at))
        el.dispatchEvent(new PointerEvent("pointerup", { ...at, buttons: 0 }))
        el.dispatchEvent(new MouseEvent("mouseup", { ...at, buttons: 0 }))
        el.dispatchEvent(new MouseEvent("click", { ...at, buttons: 0 }))
      }
      const plate = (frame) => frame.querySelector(".cursor-move") || frame
      const nameField = () => panel.querySelector('input[name="artboard-name"]')
      press(plate(frames()[0]))
      const firstName = await W.until(() => nameField() && nameField().value !== "Switch" && nameField().value, 3000)
      step("selecting the first frame shows it in the inspector", firstName, firstName)
      press(plate(added))
      const second = await W.until(() => nameField() && nameField().value === "Switch", 3000)
      step("selecting the new frame shows it in the inspector", second, nameField() && nameField().value)

      const mine = () => JSON.stringify((doc().artboards || []).find((a) => a.id === id) || null)
      const box =
        panel.querySelector('input[type=checkbox][name="disabled"]') ||
        [...panel.querySelectorAll("input[type=checkbox]")][0]
      step("the inspector offers the component's props", box)
      if (!box) return out
      // history gathers the edits of 300ms into one step: let the added frame become its own
      await W.sleep(700)
      const was = mine()
      box.click()
      await W.sleep(400)
      const changed = mine()
      step(
        "a property change reaches the document",
        changed !== was && /"disabled":true/.test(changed),
        changed.slice(0, 200),
      )
      const frameSwitch = () => added.querySelector("[role=switch],button,input")
      const disabledNow = () => {
        const el = frameSwitch()
        return (
          !!el && (el.disabled === true || el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled"))
        )
      }
      step("and the frame on the canvas", disabledNow())
      named("Undo").click()
      await W.sleep(400)
      step("undo takes it back", mine() === was, mine().slice(0, 200))
      named("Redo").click()
      await W.sleep(400)
      step("redo brings it again", mine() === changed)

      const search = [...document.querySelectorAll("button")].find((b) => /^Search/.test(b.textContent.trim()))
      search.click()
      const palette = await W.until(
        () => [...document.querySelectorAll("[role=dialog]")].find((d) => d.querySelector("input")),
        4000,
      )
      step("search opens", palette, palette && (palette.getAttribute("aria-label") || ""))
      if (palette) {
        const field = palette.querySelector("input")
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
        set.call(field, "area")
        field.dispatchEvent(new InputEvent("input", { bubbles: true }))
        await W.sleep(400)
        step(
          "search answers a query",
          palette.innerText.toLowerCase().includes("area"),
          palette.innerText.slice(0, 120),
        )
        field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
        await W.sleep(300)
      }
      out.document = JSON.stringify(doc())
      // an undo or a redo stands the frames up again: their charts draw in
      const drawn = () => W.layers([...document.querySelectorAll("[data-artboard-id] canvas")].map(W.canvas))
      await W.until(() => !drawn().some((c) => c.state === "blank"), 5000, 200)
      out.canvases = drawn()
      return out
    },

    async play() {
      const W = window.__walk
      const surface = await W.until(() => document.querySelector(".play-surface, .play-empty"), 8000)
      await W.sleep(1200)
      const canvases = W.layers([...document.querySelectorAll("canvas")].map(W.canvas))
      return {
        surface: surface ? surface.className.split(" ").find((c) => c === "play-surface" || c === "play-empty") : "",
        canvases,
        text: document.body.innerText.trim().slice(0, 160),
        clock: typeof window.ditherClock,
      }
    },

    /** The docs' styling switch on a card's Code tab set to `arg.label`, and
     * the example read again once the panel shows it in that system. */
    async style(arg) {
      const W = window.__walk
      const card = document.querySelectorAll("[data-demo-card]")[arg.n]
      const panel = card.querySelector(".source-panel-scope")
      const group = card.querySelector("[aria-label=Styling]")
      if (!panel || !group) return { switched: false, why: "no styling switch" }
      const key = [...group.querySelectorAll("button")].find((b) => b.textContent.trim() === arg.label)
      if (!key) return { switched: false, why: "no " + arg.label + " key" }
      const area = () => panel.querySelector("[role=tabpanel] textarea")
      const first = () => panel.querySelector(".src-tab")
      if (key.getAttribute("aria-pressed") !== "true") {
        key.click()
        // the panel writes the files again as the choice turns (an example without classes reads the same)
        await W.until(() => key.getAttribute("aria-pressed") === "true", 3000)
        await W.frames(3)
      }
      const t = first()
      if (t && t.getAttribute("aria-selected") !== "true") {
        t.click()
        await W.frames(2)
      }
      const name = t ? t.dataset.path.split("/").pop() : ""
      await W.until(() => area() && area().getAttribute("aria-label") === name + " source", 4000)
      const run = panel.querySelector(".src-run")
      return {
        switched: key.getAttribute("aria-pressed") === "true",
        text: area() ? area().value : "",
        files: [...panel.querySelectorAll(".src-tab")].map((x) => x.dataset.path.split("/").pop()),
        runnable: !!run && run.getAttribute("aria-disabled") !== "true",
      }
    },

    /** The Studio at a phone's size: its notice, not the editor. */
    async notice() {
      const W = window.__walk
      const heading = await W.until(
        () => [...document.querySelectorAll("h1")].find((h) => h.getClientRects().length),
        8000,
      )
      await W.sleep(400)
      return {
        heading: heading ? heading.textContent.trim() : "",
        editor: !!document.querySelector("[data-artboard-id],aside[aria-label='Properties and layers']"),
        keys: [...document.querySelectorAll("button,a[href]")]
          .filter((b) => b.getClientRects().length)
          .map((b) => (b.getAttribute("aria-label") || b.textContent).trim())
          .slice(0, 8),
      }
    },
  }
})()
