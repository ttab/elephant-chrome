# Extension View — Iframe Extensions

The Extension view embeds external single-page applications in a sandboxed
iframe and connects them to the host application via `postMessage`. Extensions
can use the authenticated user's access token and service URLs to call backend
APIs on behalf of the user without implementing their own auth flow.

## File structure

- `index.tsx` — Extension view component (iframe host, message handling)
- `ExtensionToolbar.tsx` — Responsive toolbar with overflow dropdown

## Iframe sandbox

The iframe is created with `sandbox="allow-scripts allow-same-origin"`. This
allows the extension to run JavaScript and make network requests, but blocks
popups, form submissions, and other capabilities.

## Origin security

All `postMessage` calls are targeted to a specific origin rather than `'*'`:

- **Host to extension:** messages are sent to `EXTENSION_ORIGIN`, derived from
  the extension URL.
- **Extension to host:** the extension captures `event.origin` from the first
  message it receives and uses it for all subsequent messages. The initial
  `loaded` message is sent with `'*'` since the host origin is not yet known.
- Both sides validate `event.origin` on incoming messages and discard
  mismatches.

## Message protocol

All messages are plain JSON objects with `{ type, payload? }`.

### Startup sequence

```
Extension                          Host
    |                                |
    |----  loaded  ----------------->|  Extension is ready
    |                                |
    |<---  access_token  ------------|  { accessToken: string }
    |<---  services  ----------------|  { repositoryUrl, ... }
```

1. The extension posts `loaded` when it is ready to receive data. The payload
   may include `title` (string) and `buttons` (toolbar items).
2. The host responds with `access_token` and `services` messages.
3. When the session token refreshes, the host sends a new `access_token`.

### Extension to host messages

| type | payload | description |
|------|---------|-------------|
| `loaded` | `{ title?, buttons? }` | Extension is ready. Optionally sets the view title and toolbar buttons. |
| `set_title` | `{ title }` | Update the view title. |
| `set_buttons` | `{ buttons }` | Replace the toolbar button set. |
| `button_click_ack` | `{ buttons }` | Acknowledge a button click and unlock the toolbar. May include updated button state. |
| `open` | `{ name, props?, target? }` | Open an Elephant Chrome view. `target` can be `'last'` to append the view (like shift-click) or omitted to replace views to the right of the extension. |

### Host to extension messages

| type | payload | description |
|------|---------|-------------|
| `access_token` | `{ accessToken }` | The user's current access token. Sent on startup and on refresh. |
| `services` | `{ repositoryUrl, ... }` | Backend service URLs from the registry. |
| `button_click` | `{ name }` | The user clicked a toolbar button. The extension must respond with `button_click_ack`. |

## Toolbar buttons

Extensions register toolbar buttons by including a `buttons` array in the
`loaded` payload or by sending a `set_buttons` message. Each item is either a
button or a separator:

```js
// Button
{ kind: 'button', name: 'refresh', title: 'Refresh', iconUrl: '...', disabled: false, active: false }

// Separator
{ kind: 'separator' }
```

- `name` — identifier sent back in `button_click` messages
- `title` — tooltip text (toolbar) and label text (overflow dropdown)
- `iconUrl` — icon displayed in the button (data URIs work well)
- `disabled` — greys out the button
- `active` — highlights the button with accent background

### Click handling

When the user clicks a button the host sends `button_click` to the extension
and silently ignores further clicks until the extension acknowledges with
`button_click_ack`. Buttons are not visually disabled during this time to
avoid flickering. The ack payload can include an updated
`buttons` array to reflect new state (e.g. toggling active, disabling during
a fetch).

### Overflow

When the view is too narrow to fit all buttons, items that don't fit are moved
into a dropdown menu. Overflow happens at group boundaries — a group is a
sequence of buttons delimited by separators — so partial groups never appear in
the toolbar. In the dropdown, buttons show their icon and title, and separators
render as horizontal dividers.

## Sample extension

`public/extensions/sample/index.html` is a self-contained example that fetches
the last 10 repository eventlog items. It demonstrates:

- Receiving credentials and service URLs
- Calling a backend API with the access token
- Registering toolbar buttons (refresh, auto-refresh toggle, disabled button)
- Acknowledging button clicks with updated state
- Opening views via the `open` message (clickable document UUIDs)
- Updating the view title dynamically

## Static file serving

Extension files are served from `public/extensions/` in development (Vite
serves the `public/` directory) and from the build output's `extensions/`
directory in production. An explicit `express.static` middleware in
`src-srv/index.ts` ensures extension files are served before the SPA catch-all.
