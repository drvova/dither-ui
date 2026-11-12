// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server"

// The landing is printed in the dark, always; a page that turns with the
// reader's theme sets it itself. Each route names its own theme colour.
export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" class="dark">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
))
