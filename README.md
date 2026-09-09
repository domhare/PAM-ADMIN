# PAM-ADMIN

Static admin dashboard front-end built on the **SmartHR** Bootstrap 5 admin template.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Main dashboard |
| `chat.html` | Chat / messaging — live WhatsApp when the bridge is running |
| `email.html` | Email client |
| `calendar.html` | Calendar (FullCalendar) |
| `invoice.html` | Invoice view |
| `kanban-view.html` | Kanban board |
| `todo.html` | To-do list |
| `file-manager.html` | File manager |
| `social-feed.html` | Social feed |

## Layout

```
assets/
  css/       Bootstrap 5, theme styles, icon fonts (Feather, Font Awesome, Line Awesome)
  scss/      Sass sources for style.css
  js/        Theme scripts
  fonts/     Webfonts
  img/       Images and SVG artwork
  plugins/   Third-party libraries (ApexCharts, Chart.js, FullCalendar, Quill, Swiper, SweetAlert2, ...)
  html/      Additional SmartHR template pages, not referenced by the pages above
  js/wa/     WhatsApp bridge client for chat.html
server/      Node service that links WhatsApp and feeds chat.html
```

## Running locally

No build step — these are plain static files. Open `index.html` directly, or serve the folder so relative asset paths resolve cleanly:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## WhatsApp

`chat.html` shows your real WhatsApp conversations when the bridge in
[`server/`](server/README.md) is running. It links a personal account by QR code,
so you get existing chats, history, groups and media — send and receive, reply,
react, forward, star, media and voice notes, search, archive/pin/mute, and live
delivery receipts.

```bash
cd server && npm install && npm start
```

Then open `chat.html` and scan the QR code. Full setup and API reference:
[`server/README.md`](server/README.md).

Editing styles requires compiling `assets/scss/` to `assets/css/style.css` with any Sass compiler.

## E-Mail-Anbindung (info@kfzservice-buila.de)

`email.html` kann ein echtes Postfach anzeigen. Dafür liegt unter `api/` ein
kleines PHP-Backend, das per IMAP liest und per SMTP versendet – ohne Composer
und ohne die PHP-Erweiterung `imap`, es genügen `openssl` und `mbstring`.

**Wichtig:** GitHub Pages führt kein PHP aus. Für echte Mails müssen die
Dateien auf dem Strato-Webspace liegen. Auf GitHub Pages bleibt die Seite bei
den Beispieldaten und zeigt einen Hinweis.

Mindestens **PHP 8.1** wird gebraucht, dazu `openssl`, `mbstring` und `iconv`.
Die PHP-Version steht im Strato-Kundenlogin unter *Paket verwalten →
PHP-Version*.

### Einrichten

1. **Dateien auf den Webspace bringen.** Entweder einmalig per FTP-Programm
   (FileZilla, WinSCP) hochladen – oder den Workflow `.github/workflows/deploy.yml`
   nutzen, dann geschieht das bei jedem Push auf `main` automatisch.
   Dafür unter *Settings → Secrets and variables → Actions* anlegen:
   `SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD` (optional die Variable `REMOTE_DIR`).

   Ohne diese Secrets lädt der Workflow **nichts** hoch und bricht mit einer
   Fehlermeldung ab – der rote Lauf ist beabsichtigt, damit ein nicht
   stattgefundener Deploy nicht als Erfolg durchgeht.
2. **`api/check.php` im Browser aufrufen.** Die Seite läuft auf jeder
   PHP-Version, braucht keine Anmeldung und sagt, ob PHP neu genug ist, ob
   `openssl`, `mbstring` und `iconv` da sind und ob der Webspace die
   Strato-Mailserver überhaupt erreicht. Erst weiter, wenn alles grün ist.
3. **`api/setup.php` im Browser aufrufen.** Die Seite testet die Zugangsdaten
   direkt gegen Strato, ermittelt die Ports selbst und legt `api/config.php`
   an. Dort werden die Adresse des Postfachs, dessen Passwort und ein frei
   wählbares Panel-Passwort eingegeben.
4. **Auf „Einrichtung abschließen" klicken.** Damit löschen sich `setup.php` und
   `hash.php` selbst.
5. `email.html` aufrufen und mit dem Panel-Passwort anmelden.

Der nächste Deploy lädt `setup.php` und `hash.php` wieder hoch – der Workflow
spiegelt das Repository, und dort liegen sie nun einmal. Gefährlich ist das
nicht: `setup.php` schreibt keine Konfiguration, solange `api/config.php`
existiert. Wer die beiden Dateien dauerhaft los sein will, löscht sie nach
jedem Deploy per FTP; `api/check.php` weist darauf hin, solange sie da sind.

Läuft etwas nicht:

| Symptom | Wo nachsehen |
| --- | --- |
| Weiße Seite oder HTTP 500 unter `api/` | `api/check.php` – meist eine zu alte PHP-Version |
| Banner „Kein Mail-Backend erreichbar" in `email.html` | `api/check.php` (verlinkt im Banner) |
| Anmeldung schlägt fehl, Ordner fehlen | `api/diagnose.php` – nach Anmeldung, mit Anmeldeversuch und Ordnerzuordnung |
| Push auf `main`, aber nichts ändert sich | *Actions* – schlägt der Workflow fehl, fehlen die SFTP-Secrets |

Zum Ändern der Zugangsdaten: `api/config.php` per FTP löschen, `setup.php`
erneut hochladen und aufrufen.

### Zugangsdaten

`api/config.php` steht in `.gitignore` und darf **nie** committet werden – das
Repository ist öffentlich. Das Postfach-Passwort bleibt ausschließlich auf dem
Server; das Frontend sieht es nie.

### Strato-Serverdaten

| | Server | Port | Verschlüsselung |
| --- | --- | --- | --- |
| IMAP | `imap.strato.de` | 993 | SSL |
| SMTP | `smtp.strato.de` | 465 | SSL (alternativ 587 mit STARTTLS) |

Benutzername ist jeweils die vollständige E-Mail-Adresse.

### Was funktioniert

Posteingang, Markiert, Gesendet, Entwürfe, Papierkorb und Spam lesen; Suche;
Nachricht öffnen (HTML wird in einem abgeschotteten iframe dargestellt);
Anhänge herunterladen; als gelesen markieren, markieren, löschen; schreiben,
antworten und versenden mit Kopie im Ordner „Gesendet".

Die Suche geht über Betreff, Absender und Volltext und verträgt Umlaute: der
Suchbegriff wird als IMAP-Literal mit `CHARSET UTF-8` übergeben, nicht in
Anführungszeichen – dort ist laut RFC 3501 nur 7-Bit-Text erlaubt.

Noch nicht umgesetzt: Anhänge beim Versand, Entwürfe bearbeiten, sowie die
Bereiche „Labels" und „Folders" in der Seitenleiste – das ist weiterhin
unveränderter Template-Inhalt.

## Licensing

The SmartHR template and its bundled third-party plugins are covered by their own licenses. Check those licenses before redistributing or publishing any of it.
