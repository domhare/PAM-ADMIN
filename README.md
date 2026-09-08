# PAM-ADMIN

Static admin dashboard front-end built on the **SmartHR** Bootstrap 5 admin template.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Main dashboard |
| `chat.html` | Chat / messaging |
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
```

## Running locally

No build step — these are plain static files. Open `index.html` directly, or serve the folder so relative asset paths resolve cleanly:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

Editing styles requires compiling `assets/scss/` to `assets/css/style.css` with any Sass compiler.

## E-Mail-Anbindung (info@kfzservice-buila.de)

`email.html` kann ein echtes Postfach anzeigen. Dafür liegt unter `api/` ein
kleines PHP-Backend, das per IMAP liest und per SMTP versendet – ohne Composer
und ohne die PHP-Erweiterung `imap`, es genügen `openssl` und `mbstring`.

**Wichtig:** GitHub Pages führt kein PHP aus. Für echte Mails müssen die
Dateien auf dem Strato-Webspace liegen. Auf GitHub Pages bleibt die Seite bei
den Beispieldaten und zeigt einen Hinweis.

### Einrichten

1. **Dateien auf den Webspace bringen.** Entweder einmalig per FTP-Programm
   (FileZilla, WinSCP) hochladen – oder den Workflow `.github/workflows/deploy.yml`
   aktivieren, dann geschieht das bei jedem Push auf `main` automatisch.
   Dafür unter *Settings → Secrets and variables → Actions* anlegen:
   `SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD` (optional die Variable `REMOTE_DIR`).
2. **`api/setup.php` im Browser aufrufen.** Die Seite prüft die Umgebung, testet
   die Zugangsdaten direkt gegen Strato, ermittelt die Ports selbst und legt
   `api/config.php` an. Dort werden die Adresse des Postfachs, dessen Passwort
   und ein frei wählbares Panel-Passwort eingegeben.
3. **Auf „Einrichtung abschließen" klicken.** Damit löschen sich `setup.php` und
   `hash.php` selbst, sonst könnte jemand die Konfiguration überschreiben.
4. `email.html` aufrufen und mit dem Panel-Passwort anmelden.

Läuft etwas nicht, zeigt `api/diagnose.php` (nach Anmeldung) PHP-Version,
Erreichbarkeit der Strato-Server, Anmeldung und Ordnerzuordnung an.

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

Noch nicht umgesetzt: Anhänge beim Versand, Entwürfe bearbeiten, sowie die
Bereiche „Labels" und „Folders" in der Seitenleiste – das ist weiterhin
unveränderter Template-Inhalt.

## Licensing

The SmartHR template and its bundled third-party plugins are covered by their own licenses. Check those licenses before redistributing or publishing any of it.
