# bridge

## Purpose

- `dither-bridge.mjs` is the local half of the Studio's harness control
  plane: it knows the common ACP harnesses (`HARNESSES`: Claude Code, Codex,
  Gemini CLI, Qwen Code, oh-my-pi, Goose, OpenCode, Auggie — preset id,
  display name, command line, the binary that must be on the PATH), reports
  which are installed, spawns the one the tab picks (or any command) over
  stdio as the user's own process, relays its JSON-RPC verbatim to the tab
  over a loopback websocket, injects the Studio MCP server into every
  session, and routes that server's tool calls back to the tab.
- `README.md` is the user-facing manual (run lines per harness, options,
  what the bridge does and does not do).

## Ownership

- Owns the wire contract between the tab and the bridge; the browser side
  lives in `src/features/agent/acp.ts`, which must change in step.
- Does not own the ACP or MCP protocols: both are relayed as the agent
  speaks them.

## Local Contracts

- Zero dependencies, one file, Node built-ins only (`http`, `child_process`,
  `crypto`, `readline`); no npm package, no build step.
- Bridge-only methods are prefixed `bridge/`: `bridge/tools` (tab → bridge,
  the Studio tool list as MCP tool defs), `bridge/start` (tab → bridge,
  `{ harness: id }` or `{ command }`), `bridge/stop` (tab → bridge),
  `bridge/hello` (bridge → tab: `{ cwd, harnesses: [{ id, name, command,
  installed, note? }], agent: { id, name, command, pid } | null }`, sent on
  connect and after every start/stop), `bridge/exit` (bridge → tab: exit
  code). While no harness runs, a request from the tab is answered with a
  JSON-RPC error (`no harness running`).
  `studio/call` (bridge → tab, `{ name, arguments }`) is answered with the
  protocol's `CommandResult`; relay ids are `b<N>` so they never collide
  with the tab's `c<N>` or the agent's ids.
- The one edit to relayed traffic is the `mcpServers` injection on
  `session/new` / `session/load` and the default `cwd`; everything else
  passes through untouched, line by line.
- Loopback only, one tab at a time, agent killed on disconnect, 30s relay
  timeout per tool call; `--mcp <port>` is the server mode the agent
  spawns, never run by hand.
- The agent is launched through the shell (`shell: true`) from `--cwd`, so
  a preset or `--agent` can be any command line (a local script by absolute
  path); it inherits the environment plus `DITHER_BRIDGE_PORT`. Adding a
  harness is one row in `HARNESSES` (and the README table).
- A tool result's `data.files` (`[{ path, content }]`) is materialized
  under `--cwd` before it reaches the agent — relative paths only, nothing
  above the directory — and replaced by the written paths plus `data.cwd`,
  so the agent gets a location, never a payload (`export_video` ships a
  self-contained HyperFrames composition this way).

## Work Guidance

- Keep it readable as a single page: a websocket codec, the serve mode, the
  MCP mode. New behaviour must still leave the relay verbatim.
- Any change to a `bridge/` or `studio/call` message updates `acp.ts`, the
  fixture agent and `README.md` together.

## Verification

- `tests/bridge.spec.ts` spawns the real bridge with
  `tests/fixtures/fake-acp-agent.mjs` (a scripted ACP agent that spawns the
  injected MCP server and calls `add_screen` through it) and plays the tab:
  initialize, session/new, prompt with streaming, plan, permission, tool
  relay, usage, health, second-tab refusal, the hello's harness list, a
  bridge without `--agent` that refuses requests until `bridge/start` and
  stops on `bridge/stop`, file materialization under `--cwd` (and refusal
  of escaping paths), cancel.
- Lint covers the file (`npm run lint`); the browser walk is the Studio in
  the acp backend against the same fixture (`node bridge/dither-bridge.mjs
  --agent "node tests/fixtures/fake-acp-agent.mjs"`).

## Child DOX Index

- none
