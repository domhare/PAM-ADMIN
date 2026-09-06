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

## Licensing

The SmartHR template and its bundled third-party plugins are covered by their own licenses. Check those licenses before redistributing or publishing any of it.
