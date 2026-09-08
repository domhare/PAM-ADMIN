# PAM-ADMIN

Statisches Admin-Frontend auf Basis des SmartHR-Bootstrap-Templates, gehostet
auf dem Strato-Webspace von kfzservice-buila.de.

## Arbeitsweise

**Änderungen immer sofort committen und nach `main` pushen.** Nicht sammeln,
nicht auf Nachfrage warten – jede abgeschlossene Änderung geht direkt auf
`main`. Vorher `git pull`, es wird parallel aus mehreren Sitzungen gearbeitet.

Ein Push auf `main` löst den Workflow `.github/workflows/deploy.yml` aus, der
die Dateien per SFTP auf den Webspace spiegelt. Ein Push ist damit ein Deploy –
kaputter Code geht sofort live.

## Was man wissen muss

**Kein Build-Schritt.** `assets/css/style.css` ist aus `assets/scss/` kompiliert,
aber es gibt keinen Sass-Compiler in der Umgebung. Wer Farben oder Stile ändert,
muss `assets/scss/` **und** `assets/css/style.css` anpassen, sonst wirkt die
Änderung nicht. Die Seiten laden ausschließlich die kompilierte CSS-Datei.

**Themenfarbe ist `#005CA9`** (früher das Orange `#F26522` des Templates).

**Keine Zugangsdaten ins Repository.** Es ist öffentlich. Betroffen sind:
- `api/config.php` – Postfachzugang, liegt nur auf dem Server, per `.gitignore`
  ausgeschlossen. Der Deploy-Workflow löscht sie bewusst nicht (kein `--delete`).
- `server/.env` und `server/.session/` – WhatsApp-Bridge, ebenfalls ausgeschlossen.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `*.html` | Die Seiten des Panels |
| `assets/` | Template-Assets, `scss/` als Quelle, `css/style.css` kompiliert |
| `api/` | PHP-Backend für die Mail-Anbindung (IMAP/SMTP, ohne Composer und ohne ext-imap) |
| `server/` | Separater Node-Dienst für die WhatsApp-Anbindung, läuft nicht auf dem Webspace |

Einrichtung des Postfachs: siehe `README.md`, Abschnitt „E-Mail-Anbindung".
