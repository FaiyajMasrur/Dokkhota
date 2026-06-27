# Quick smoke tests

From the repo root, with backend running, use these to exercise critical flows.

1) Register (returns preview OTP when `DISABLE_EMAIL=true`):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

2) Verify email:

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"<OTP_FROM_PREVIEW>"}'
```

3) Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

4) Create a listing (requires bearer token `accessToken`):

```bash
curl -X POST http://localhost:5000/api/skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"Guitar Basics","category":"Music","description":"Learn guitar","format":"online","durationMinutes":60,"creditCost":5,"proficiencyLevel":"beginner","tags":["music","guitar"]}'
```
