# Database folder

All app data is saved here as JSON files when you run `node server.js`.

| File | Contents |
|------|----------|
| `store.json` | Projects, clients, users, profiles, stages, statuses, updates, notes |
| `auth.json` | Login emails and passwords |
| `meta.json` | System flags (seed version, migrations) |

Edit these files directly if needed — restart is not required; the app reloads on save.

**Backup tip:** Copy this whole `database/` folder to keep a backup of your data.
