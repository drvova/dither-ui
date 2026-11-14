// Where a tool a harness built runs: never in the Studio's page. A frame
// with no origin of its own (`sandbox="allow-scripts"`, no
// allow-same-origin: no page, no cookies, no storage of the Studio), under
// a policy that allows no request of any kind (`default-src 'none'`), with
// a worker inside it, so a tool that never ends never stops the page: past
// its time the frame goes, and the worker with it. The one way out is a
// message port to the page, which answers `studio.run(action, args)` with
// the Studio's own actions and nothing else.
import type { CommandResult } from "./commands"

/** How long a built tool may run. */
export const SANDBOX_MS = 10_000
/** How many Studio actions one run may call. */
export const SANDBOX_CALLS = 200

/** The worker's source: `studio.run` over messages, then the tool's code
 * as the body of an async function of `(args, studio)`. Pure. */
export function workerSource(code: string, args: Record<string, unknown>): string {
  return `"use strict";
const pending = new Map();
let seq = 0;
const studio = Object.freeze({
  run: (action, args) =>
    new Promise((resolve) => {
      const id = ++seq;
      pending.set(id, resolve);
      postMessage({ type: "call", id, action: String(action), args: args ?? {} });
    }),
});
onmessage = (e) => {
  const d = e.data;
  if (d && d.type === "answer" && pending.has(d.id)) {
    pending.get(d.id)(d.result);
    pending.delete(d.id);
  }
};
const finish = (value) => {
  try {
    postMessage({ type: "done", value: value === undefined ? null : value });
  } catch {
    postMessage({ type: "fail", error: "its answer is not plain data" });
  }
};
(async (args, studio) => {
${code}
})(${JSON.stringify(args)}, studio).then(finish, (e) => postMessage({ type: "fail", error: String((e && e.message) || e) }));
`
}

/** The frame's document: no requests allowed, a relay between the page's
 * port and the worker it starts. Pure. */
export function sandboxDocument(): string {
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:"><script>
let port = null;
onmessage = (e) => {
  if (port || !e.data || e.data.type !== "start" || !e.ports[0]) return;
  port = e.ports[0];
  let worker;
  try {
    worker = new Worker(URL.createObjectURL(new Blob([e.data.source], { type: "text/javascript" })));
  } catch (err) {
    port.postMessage({ type: "fail", error: "the sandbox could not start: " + String(err && err.message || err) });
    return;
  }
  worker.onmessage = (m) => port.postMessage(m.data);
  worker.onerror = (m) => { m.preventDefault(); port.postMessage({ type: "fail", error: m.message || "it failed to start" }); };
  port.onmessage = (m) => worker.postMessage(m.data);
};
</script>`
}

/** Run a built tool's code in the sandbox; `call` answers its
 * `studio.run`. Resolves with what the code returns, or why it failed. */
export function runSandboxed(
  code: string,
  args: Record<string, unknown>,
  call: (action: string, args: Record<string, unknown>) => Promise<CommandResult>,
  ms = SANDBOX_MS,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe")
    frame.setAttribute("sandbox", "allow-scripts")
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    frame.style.display = "none"
    frame.srcdoc = sandboxDocument()
    const channel = new MessageChannel()
    let calls = 0
    let settled = false
    const end = (result: CommandResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      channel.port1.close()
      frame.remove()
      resolve(result)
    }
    const timer = setTimeout(() => end({ ok: false, error: `it ran past ${ms / 1000}s and was stopped` }), ms)
    channel.port1.onmessage = async (e: MessageEvent) => {
      const d = e.data as {
        type?: string
        id?: number
        action?: unknown
        args?: unknown
        value?: unknown
        error?: unknown
      }
      if (d?.type === "call") {
        if (++calls > SANDBOX_CALLS)
          return end({ ok: false, error: `it called the Studio more than ${SANDBOX_CALLS} times and was stopped` })
        const a =
          d.args && typeof d.args === "object" && !Array.isArray(d.args) ? (d.args as Record<string, unknown>) : {}
        const result = await call(String(d.action), a)
        if (!settled)
          channel.port1.postMessage({ type: "answer", id: d.id, result: JSON.parse(JSON.stringify(result)) })
      } else if (d?.type === "done") end({ ok: true, data: d.value })
      else if (d?.type === "fail") end({ ok: false, error: String(d.error) })
    }
    frame.addEventListener(
      "load",
      () => frame.contentWindow?.postMessage({ type: "start", source: workerSource(code, args) }, "*", [channel.port2]),
      { once: true },
    )
    document.body.append(frame)
  })
}
