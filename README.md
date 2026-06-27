<div align="center">

# Dokkhota

**A peer-to-peer skill exchange platform**  
Connect, teach, and learn through a credits-based marketplace.

![Express](https://img.shields.io/badge/Express-API-blue?style=flat-square)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

</div>

---

## Repository layout

| Directory | Contents |
|-----------|----------|
| `backend/` | Express API — Mongoose models, JWT auth, email delivery, bookings, credits |
| `frontend/` | Vite + React — register, login, profile, skill listings |

---

## Quickstart

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
# Fill in MONGO_URI, JWT_SECRET, EMAIL_*, and CLIENT_URL
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

### 3. Start the frontend *(separate terminal)*

```bash
cd frontend
npm install
npm run dev
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string (Atlas recommended) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Strong random secrets for access and refresh tokens |
| `CLIENT_URL` | Frontend origin — used for CORS and password-reset links |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT` | SMTP credentials. For Gmail, enable 2FA and use an App Password |
| `DISABLE_EMAIL` | Set to `true` locally to print OTPs to the console instead of sending email |

> **Security:** Never commit real secrets. Keep `.env` in `.gitignore`.

---

## Features

- [x] User registration with OTP email verification
- [x] JWT access + refresh tokens with auth and role middleware
- [x] Password reset via email token (1-hour expiry)
- [x] Skill listing CRUD with availability
