# Dokkhota

Dokkhota is a peer-to-peer skill exchange platform (backend + frontend).

## Repo layout

- `backend/` — Express API, Mongoose models, auth, email, bookings, credits
- `frontend/` — Vite + React app (pages for register, login, profile, listings)

## Quickstart (development)

1. Copy env examples and set secrets:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env to set MONGO_URI, JWT_SECRET, EMAIL_* etc.
```

2. Start backend (from repo root):

```bash
cd backend
npm install
npm run dev
```

3. Start frontend (in a separate terminal):

```bash
cd frontend
npm install
npm run dev
```

## Important environment variables
- `MONGO_URI` — MongoDB connection string (Atlas recommended)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — strong random secrets
- `CLIENT_URL` — frontend origin used for CORS and reset links
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT` — SMTP settings
- Set `DISABLE_EMAIL=true` during local development to preview OTPs

If using Gmail for SMTP, enable 2FA and create an App Password to use as `EMAIL_PASS`.

## Features implemented
- User registration with OTP email verification
- JWT access + refresh tokens, auth and role middleware
- Password reset via email token (1 hour expiry)
- Skill listing CRUD + availability schedule
- Starter credits awarded on registration
- Basic React frontend pages (register, login, profile, create listing)

## Next steps / checks
- Verify SMTP by registering a user and checking email delivery (or preview when `DISABLE_EMAIL=true`).
- Ensure `.env` contains production secrets and never commit real secrets.

## License
MIT
