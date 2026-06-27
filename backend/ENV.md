# Environment variables (backend)

Copy `backend/.env.example` to `backend/.env` and fill these values before running the server.

- `MONGO_URI` — MongoDB connection string (Atlas preferred). Leave empty to use local Mongo at `MONGO_LOCAL_URI`.
- `MONGO_LOCAL_URI` — local Mongo fallback (default provided).
- `PORT` — backend port (default `5000`).
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — strong random secrets for signing tokens.
- `CLIENT_URL` — frontend origin (e.g., `http://localhost:5173`).
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — SMTP settings. If using Gmail, create an App Password and use it as `EMAIL_PASS`.
- `DISABLE_EMAIL` — set to `true` in development to avoid sending real emails; server returns a preview result instead.
- `STARTER_CREDITS` — number of starter credits granted on registration.

Security: never commit `backend/.env` with real secrets. Use environment secrets in production and CI.
