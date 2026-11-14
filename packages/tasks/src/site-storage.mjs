// What the tasks put in the site's localStorage before its app reads it: the
// walk's theme, sounds and styling, the agent demo's saved harness. A pinned
// copy of the site's own names (`STORAGE_KEYS`, `shared/config/storage.ts`;
// the package order bars the tasks from importing the site), held to them
// by the site's `tests/site/protocols.spec.ts`.

/** The site's localStorage keys the tasks write, by the site's names. */
export const SITE_STORAGE = {
  theme: "dither-theme",
  sounds: "dither-sounds",
  styling: "dither-styling",
  agentConfig: "dither-agent-config",
}

/** The agent panel's saved choice (the site's `AgentConfig`), as if picked
 * in its harness menu: this bridge, this harness (or the bridge's own
 * `--agent`), prompts left to answer, the canvas followed. */
export const agentConfig = (bridgeUrl, harness) => ({ bridgeUrl, harness, command: "", auto: false, follow: true })
