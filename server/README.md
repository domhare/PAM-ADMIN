# WhatsApp bridge

A small Node service that links your WhatsApp account (the same way WhatsApp
Web does) and exposes it to `chat.html` over REST + socket.io.

It links a **personal** account by QR code, so you get all your existing
conversations, history, groups and media — not just new inbound messages.

---

## 1. Install Node.js

Not installed on this machine yet. Get the LTS build from
<https://nodejs.org> (or `winget install OpenJS.NodeJS.LTS`), then reopen your
terminal and check:

```bash
node -v
```

## 2. Install the bridge

```bash
cd server && npm install
```

The first install also downloads a headless Chromium (~150 MB) — that is the
browser the bridge drives to talk to WhatsApp.

## 3. Configure

```bash
cp .env.example .env
```

Defaults are fine for local use. The settings worth knowing:

| Key | Meaning |
| --- | --- |
| `PORT` | Port the bridge listens on (default `3001`) |
| `CORS_ORIGINS` | Origins allowed to call the bridge — add whatever serves `chat.html` |
| `API_TOKEN` | Set it to require `x-wa-token` on every call. Empty = no auth |
| `SESSION_PATH` | Where the login is stored so you only scan the QR once |
| `HEADLESS` | `false` shows the automated browser, useful when debugging |

## 4. Run it

```bash
cd server && npm start
```

## 5. Link your phone

Serve the dashboard from the repo root and open the chat page:

```bash
python -m http.server 8000
```

Go to <http://localhost:8000/chat.html>. A **Connect WhatsApp** dialog shows a
QR code — on your phone open **WhatsApp → Settings → Linked devices → Link a
device** and scan it.

The session is stored in `server/.session`, so restarts do not need a new scan.
The status pill above the chat list shows the live connection state; click it to
reopen the dialog, restart the bridge, or log out.

If `chat.html` is served from a different host or port than the defaults,
open the pill → **Bridge settings** and set the bridge URL (and token).

---

## Deploying: page on webspace, bridge elsewhere

`chat.html` is static and can sit on any shared webspace. The bridge cannot —
it needs a host that allows a permanently running process and ~1 GB RAM for the
headless browser. Classic PHP/FTP hosting gives you neither.

So split it:

```
your webspace  ──HTTPS──>  small VPS
chat.html + assets          server/ (the bridge)  ──>  WhatsApp
```

**1. Point the page at the bridge.** Edit `assets/js/wa/wa-config.js` before
uploading:

```js
window.WA_CONFIG = {
    baseUrl: 'https://wa.example.com',
    token:   'the-same-value-as-API_TOKEN'
};
```

Anyone can still override this per-browser via **Bridge settings**; *Use site
default* clears the override.

**2. On the VPS**, install Node, run the bridge, and keep it alive with
systemd or pm2:

```bash
npm install -g pm2
cd server && pm2 start index.js --name wa-bridge && pm2 save && pm2 startup
```

**3. Put it behind HTTPS.** Caddy is the shortest route — this whole file works:

```
wa.example.com {
    reverse_proxy localhost:3001
}
```

nginx works too, but needs `proxy_set_header Upgrade`/`Connection` so the
socket.io WebSocket survives the proxy.

**4. Lock it down.** In the bridge `.env`:

```
API_TOKEN=<a long random string>
CORS_ORIGINS=https://your-webspace-domain
```

Then firewall port 3001 so only the reverse proxy reaches it
(`ufw allow 80,443/tcp` and *not* 3001).

### Mixed content

If the page is on HTTPS, the bridge must be HTTPS too. Browsers silently block
plain-HTTP requests from an HTTPS page, and the chat will just sit at
"Bridge not reachable".

### Does my shared host run Node?

Most don't, and even the ones advertising "Node.js support" (cPanel/Plesk
selectors) usually can't run Chromium and idle the app out between requests,
which kills the WhatsApp connection. If you want to check, look for a
**Node.js** entry in your hosting control panel, or over SSH:

```bash
node -v && echo "---" && ldd --version
```

If that host does have real Node but not enough memory for Chromium, the
bridge can be switched to the **Baileys** engine, which talks to WhatsApp
directly over a WebSocket with no browser at all (~150 MB instead of ~700 MB).
Only `src/wa-client.js` would change; the API and the whole frontend stay
as they are.

---

## API

Everything is under `/api`. Send `x-wa-token` when `API_TOKEN` is set.

### Session
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/status` | Connection state, QR data URL, linked account |
| `POST` | `/session/restart` | Restart the client |
| `POST` | `/session/logout` | Unlink the phone and wipe the session |

### Chats
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/chats?archived=0` | Chat list, pinned first |
| `GET` | `/chats/:id` | Chat detail (group participants, contact info, about) |
| `GET` | `/chats/:id/messages?limit=50&before=<msgId>` | History, paged backwards |
| `POST` | `/chats/:id/messages` | Send text — `{ body, quotedMessageId?, mentions? }` |
| `POST` | `/chats/:id/media` | Send a file (multipart `file`, plus `caption`, `asVoice`, `asDocument`) |
| `POST` | `/chats/:id/location` | Send `{ latitude, longitude, description? }` |
| `POST` | `/chats/:id/typing` | `{ state: "typing" \| "recording" \| "clear" }` |
| `POST` | `/chats/:id/seen` | Mark read |
| `POST` | `/chats/:id/unread` | Mark unread |
| `POST` | `/chats/:id/archive` | `{ value: true \| false }` |
| `POST` | `/chats/:id/pin` | `{ value: true \| false }` |
| `POST` | `/chats/:id/mute` | `{ value: true, minutes?: 0 }` — `0` mutes forever |
| `POST` | `/chats/:id/clear` | Clear all messages |
| `POST` | `/chats/:id/delete` | Delete the chat |

### Messages
| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/messages/:id/react` | `{ emoji }` — empty string removes the reaction |
| `POST` | `/messages/:id/star` | `{ value: true \| false }` |
| `POST` | `/messages/:id/delete` | `{ everyone?: true }` |
| `POST` | `/messages/:id/forward` | `{ chatId }` |
| `POST` | `/messages/:id/edit` | `{ body }` |
| `POST` | `/messages/:id/pin` | `{ seconds? }` |
| `GET` | `/media/:id` | Stream the message's media (`?download=1` to save) |

### Contacts / search
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/contacts` | Your WhatsApp contacts |
| `POST` | `/contacts/resolve` | `{ number }` → chat id, for starting a new chat |
| `POST` | `/contacts/:id/block` | `{ value: true \| false }` |
| `GET` | `/avatar/:id?name=` | Profile picture, falls back to an initials avatar |
| `GET` | `/search?q=&chatId=` | Full-text message search |

### Socket events

The bridge pushes: `wa:status`, `wa:qr`, `wa:message`, `wa:message-edit`,
`wa:ack`, `wa:revoke`, `wa:reaction`, `wa:chat-update`, `wa:chat-removed`,
`wa:group-event`, `wa:connection`.

The page sends `wa:typing` (`{ chatId, state }`).

---

## Things to know

- **This uses an unofficial library.** `whatsapp-web.js` automates WhatsApp Web;
  it is not endorsed by WhatsApp and using it carries some risk to the account.
  Keep the volume human — do not use it to blast messages.
- **Keep the bridge local.** It has full control of your WhatsApp account and no
  auth by default. If you ever expose it beyond localhost, set `API_TOKEN` and
  put it behind HTTPS.
- **`.session` is your login.** Anyone with that folder can read your messages.
  It is gitignored; keep it that way.
- **Media and avatars are cached** under `server/.cache`. Delete it any time.
- **Voice notes** are recorded as WebM/Opus by the browser. WhatsApp prefers
  OGG/Opus, so some recipients may see them as audio files rather than voice
  messages.
- **History paging** walks backwards through what WhatsApp Web has synced.
  Very old messages may not be reachable until the phone syncs them.
