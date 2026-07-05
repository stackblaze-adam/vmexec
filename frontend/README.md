# VMExec Vue SPA

Full single-page application for the VMExec dashboard.

## Development

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on http://localhost:5173 and proxies `/api` to the FastAPI backend (start `python main.py` on port 8000).

## Production build

```bash
cd frontend
npm run build
```

Output: `static/dist/` — served by FastAPI when present.

## Stack

- Vue 3 + Vite
- Vue Router (history mode)
- Pinia
- Session cookie auth via `/api/v1/auth/session/*`

## Routes

| Path | View |
|------|------|
| `/login` | Login + MFA challenge |
| `/mfa-setup` | First-time authenticator enrollment |
| `/overview` | Dashboard |
| `/backup` | Schedules / jobs table |
| `/restore` | Restore jobs + deploy drawer |
| `/settings/:panel` | Storage, hosts, engine, email, maintenance, users, logs |
| `/account/:panel` | Profile, API keys |

Legacy Jinja UI (`templates/index.html`) is used only when `static/dist/index.html` is missing.
