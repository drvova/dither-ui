# dither-bridge

The local half of the Studio's harness control plane. The Studio's agent
panel can drive the coding agent you already pay for — Claude Code, Codex,
Gemini CLI, pi, omp, anything that speaks the
[Agent Client Protocol](https://agentclientprotocol.com) over stdio — without
an API key in the browser. Each harness keeps its own login; the bridge only
relays JSON-RPC between the Studio tab and the agent process.

```
browser ── websocket (127.0.0.1) ── bridge ── stdio ── your ACP agent
                                      │
                    MCP (stdio) ──────┘  "dither-studio" server, spawned by
                    the agent; its tool calls go back through the bridge
                    to the tab as `studio/call`
```

One file, zero dependencies, Node 20+.

## Run

```sh
node bridge/dither-bridge.mjs --agent "npx @zed-industries/claude-code-acp"
node bridge/dither-bridge.mjs --agent "codex-acp"
node bridge/dither-bridge.mjs --agent "gemini --experimental-acp"
node bridge/dither-bridge.mjs --agent "pi --acp"            # or omp
```

Options: `--port 8790` (websocket + relay port, loopback only), `--cwd <dir>`
(the agent's working directory, default: where you ran the bridge — point it
at a project that holds `/agent/SKILL.md` or `registry.json` if the agent
should read them from disk).

Then open the Studio, open the Agent panel, choose the **acp bridge**
backend (the default) and send a prompt. The panel connects, the bridge
spawns the agent, and the agent's prose, plan, tool calls and permission
prompts stream into the composer. The Studio's own commands (add a screen,
add a chart, update a frame, evolve, …) reach the agent as MCP tools of a
server named `dither-studio`, so the harness composes on the canvas exactly
the way the key-based loop does — every placement is one undo away.

## What the bridge does, and does not do

- Relays every ACP message verbatim in both directions. The one edit: each
  `session/new` and `session/load` gets `{ name: "dither-studio", command:
  node, args: [this file, "--mcp", port] }` appended to `mcpServers`, and an
  empty `cwd` is filled with `--cwd`.
- Serves the MCP server the agent spawns (`--mcp` mode): `tools/list` and
  `tools/call` are forwarded over local HTTP (`/relay/tools`, `/relay/call`)
  to the bridge, which sends `studio/call` to the tab and returns the
  Studio's answer. The tab sends its tool list on connect (`bridge/tools`).
- Tells the tab what it spawned (`bridge/hello`) and when the agent exits
  (`bridge/exit`); the next message restarts it.
- Listens on 127.0.0.1 only, accepts one tab at a time (a second gets 409),
  and kills the agent when the tab disconnects.
- Never sees a credential: the agent authenticates itself the way it always
  does (its own login, keychain or env), and nothing goes to dither-ui.com.

## Health

`GET http://127.0.0.1:8790/` → `{ bridge, agent, connected, tools }`.

The agent's stderr is echoed with an `[agent]` prefix; the bridge's own log
is one line per connect, spawn and exit.
