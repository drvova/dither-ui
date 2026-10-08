# discord — Components V2 interaction service

Turns every docs section into an **interactive Discord embed**: `/component slider`
posts a Components V2 message — the section's og card (rendered by the site's
own dither engine), the section summary, and buttons that edit the embed in
place: **Re-roll seed** re-renders the card's dither field from a new seed,
**Night/Day mode** inverts it, **Open docs** links out. No bot token needed —
interactions answer inline via the webhook.

## Setup (once)

1. Create the application at <https://discord.com/developers/applications>.
2. General Information → copy the **Public Key**.
3. Interactions Endpoints → set the endpoint URL to this service:
   `https://<your-host>/interactions`. Saving triggers Discord's `PING`
   validation, which this service answers — the endpoint must be publicly
   reachable over HTTPS for that first save.
4. Register the slash command (one time, any `Application/commands` token
   flow), e.g.:

```sh
curl -X PUT "https://discord.com/api/v10/applications/<APP_ID>/commands" \
  -H "Authorization: Bot <BOT_TOKEN>" -H "Content-Type: application/json" \
  -d '[{"name":"component","description":"Preview a dither-ui docs section",
        "options":[{"name":"section","description":"Section id or label",
                    "type":3,"required":true}]}]'
```

(The bot token is only needed for this registration call, never at runtime.)

## Run

```sh
npm run build                                  # renders dist/og/*.png + sections.json
DISCORD_PUBLIC_KEY=<hex> PUBLIC_BASE=https://<host> node discord/service.mjs
```

- `DISCORD_PUBLIC_KEY` — required; without it every interaction 401s.
- `PUBLIC_BASE` — the public URL serving THIS process; re-rolled previews
  are served from `${PUBLIC_BASE}/preview/<id>/<seed>/<inv>.png` and must be
  publicly fetchable by Discord's CDN. Without it, re-rolls keep the site's
  static card.
- `PORT` — default 8787. `GET /health` for probes.

## Routes

- `POST /interactions` — the Discord webhook (Ed25519-verified). Handles
  `PING`, the `component` slash command (type 4 + IsComponentsV2), and
  button clicks (type 7, message updated in place).
- `GET /preview/:id/:seed/:inv.png` — on-demand og card re-render (playwright
  over `dist/og/index.html`, memory-cached, 24h browser-cache headers).
- `GET /health`.

## Components V2 layout

Container (ember accent) → TextDisplay (`## <Section>`) → TextDisplay
(description + group footer line) → MediaGallery (the og card) → ActionRow
(Re-roll / Night-Day / Open docs). The `IsComponentsV2` flag (1<<15) is set
on every message; no `content` field (v2 messages carry no plain content).
