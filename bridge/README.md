# dither-bridge

The local half of the Studio's harness control plane. The Studio's agent
panel drives the coding agent you already pay for — Claude Code, Codex,
Gemini CLI, Qwen Code, oh-my-pi, Goose, OpenCode, Auggie, anything that
speaks the [Agent Client Protocol](https://agentclientprotocol.com) over
stdio — without an API key in the browser. Each harness keeps its own login;
the bridge knows the common ones, tells the panel which are on your PATH,
starts the one you pick, and relays JSON-RPC between the tab and the agent.

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
node bridge/dither-bridge.mjs
```

Then open the Studio's Agent panel and pick a harness. The panel lists what
the bridge found on your PATH:

| pick | runs | needs |
| --- | --- | --- |
| Claude Code | `npx -y @zed-industries/claude-code-acp` | the `claude` CLI, logged in |
| Codex | `npx -y @zed-industries/codex-acp` | the `codex` CLI, logged in |
| Gemini CLI | `gemini --experimental-acp` | `gemini` |
| Qwen Code | `qwen --experimental-acp` | `qwen` |
| oh-my-pi | `omp --mode acp` | `omp` |
| Goose | `goose acp` | `goose` |
| OpenCode | `opencode acp` | `opencode` |
| Auggie | `auggie --acp` | `auggie` |
| custom | any command that speaks ACP over stdio | — |

Options: `--agent "<command>"` starts that command with the tab instead of
waiting for a pick; `--port 8790` (websocket + relay port, loopback only);
`--cwd <dir>` (the agent's working directory and where exported files land,
default: where you ran the bridge). Commands run from `--cwd`, so a local
script needs an absolute path.

The harness's prose, plan, tool calls and permission prompts stream into the
composer. The Studio's own commands (add a screen, add a chart, update a
frame, evolve, export a video, …) reach it as MCP tools of a server named
`dither-studio`, so it composes on the canvas — every placement is one undo
away.

## What the bridge does, and does not do

- Relays every ACP message verbatim in both directions. The one edit: each
  `session/new` and `session/load` gets `{ name: "dither-studio", command:
  node, args: [this file, "--mcp", port] }` appended to `mcpServers`, and an
  empty `cwd` is filled with `--cwd`.
- Serves the MCP server the agent spawns (`--mcp` mode): `tools/list` and
  `tools/call` are forwarded over local HTTP (`/relay/tools`, `/relay/call`)
  to the bridge, which sends `studio/call` to the tab and returns the
  Studio's answer. The tab sends its tool list on connect (`bridge/tools`).
- Tells the tab its state (`bridge/hello`: cwd, the known harnesses with
  their PATH status, the running agent or null) on connect and after every
  `bridge/start` / `bridge/stop`, and when the agent exits (`bridge/exit`).
  A request sent while no harness runs is refused with an error, never
  swallowed.
- Listens on 127.0.0.1 only, accepts one tab at a time (a second gets 409),
  and kills the agent when the tab disconnects.
- Never sees a credential: the agent authenticates itself the way it always
  does (its own login, keychain or env), and nothing goes to dither-ui.com.

## Files from the Studio

Some tools answer with files for the project instead of data — `export_video`
hands back a HyperFrames composition. The bridge writes them under `--cwd`
(relative paths only, never above it) and the agent receives their paths:

```
export_video → video/sign-in/index.html
npx hyperframes render video/sign-in -o sign-in.mp4
```

## Health

`GET http://127.0.0.1:8790/` → `{ bridge, agent, connected, tools }`.

The agent's stderr is echoed with an `[agent]` prefix; the bridge's own log
is one line per connect, spawn and exit.
