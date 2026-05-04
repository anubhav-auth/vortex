# Vortex — Seeded Credentials

The v2 seed (`backend/prisma/seed.js`) only seeds privileged accounts —
admin and jury. Students self-register through `/register` and are then
verified by an admin, which generates and emails a fresh 6-digit password.

All passwords below are **defaults** sourced from environment variables
(`ADMIN_SEED_PASSWORD`, `JURY_SEED_PASSWORD` in `docker-compose.yml`).
Override either by setting the env var before bringing up the stack —
the seed is idempotent and never overwrites an existing `passwordHash`.

---

## Access URLs

| What | URL |
|---|---|
| Frontend | <http://localhost> |
| Backend API | <http://localhost:3001> (also reachable via the frontend's `/api` proxy) |
| Postgres | `localhost:5432` (`vortex_user` / `vortex_password` / `vortex_db`) |

---

## Admin

| Field | Value |
|---|---|
| Email | `admin@vortex.local` |
| Password | `admin1234` |
| Role | `ADMIN` |

Use this to test the verification queue, registry uploads, taxonomy CRUD,
hackathon rules, round control, jury assignments, team force-resolve,
broadcasts, and the audit log.

---

## Jury (3 seeded)

All juries share the same default password.

| Email | Password | Role |
|---|---|---|
| `jury.alpha@vortex.local`   | `jury1234` | `JURY` |
| `jury.bravo@vortex.local`   | `jury1234` | `JURY` |
| `jury.charlie@vortex.local` | `jury1234` | `JURY` |

A jury can only score teams an admin has assigned to them via
`Admin → Jury Assignments`, and only when the round is `UNLOCKED`.

---

## Students

**Not seeded.** To test student flows:

1. Open <http://localhost/register> and submit the form.
   - The seed includes 8 entries in `CollegeRegistry` (see below) — using
     any of those `registrationNo` + `email` combinations triggers an
     auto-match flag in the admin verification queue.
2. As admin, go to `Admin → Verification`, find the pending registration,
   click **Approve**.
3. Watch the backend container logs (`docker logs vortex-backend-1 -f`)
   for the `[mail]` line — the 6-digit password is printed to the log
   (the mail stub doesn't actually send email yet).
4. Sign in at <http://localhost/login> with the registered email and
   that 6-digit code.

### Sample registry entries (seeded for testing)

| Registration No | Full Name | Email | Institution |
|---|---|---|---|
| `2026-VRTX-100` | Alice Vance     | `alice.vance@vortex.local`     | BITS Pilani |
| `2026-VRTX-101` | Bob Smith       | `bob.smith@vortex.local`       | BITS Pilani |
| `2026-VRTX-102` | Carla Mendes    | `carla.mendes@vortex.local`    | IIIT Hyderabad |
| `2026-VRTX-103` | Devraj Patil    | `devraj.patil@vortex.local`    | IIIT Hyderabad |
| `2026-VRTX-104` | Esha Nair       | `esha.nair@vortex.local`       | MIT World Peace University |
| `2026-VRTX-105` | Farhan Iqbal    | `farhan.iqbal@vortex.local`    | MIT World Peace University |
| `2026-VRTX-106` | Gita Roy        | `gita.roy@vortex.local`        | SRM Institute |
| `2026-VRTX-107` | Hari Menon      | `hari.menon@vortex.local`      | Institute of Technology, Delhi |

---

## Re-seeding

The seed is idempotent — every write is an `upsert` keyed on a stable
identifier. Re-running converges to the same state without resetting
admin-tweaked rules or rotating passwords.

```bash
# from inside the backend container, or with backend deps installed locally:
cd backend && npm run db:seed
```

To wipe everything (dev only):

```bash
cd backend && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<your-text>" \
  npx prisma db push --force-reset
npm run db:seed
```

---

## Production note

Before deploying anywhere real:

- Set `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` to non-defaults
- Set `JURY_SEED_PASSWORD` to a non-default (or remove the seed call)
- Rotate `ACCESS_TOKEN_SECRET` to a fresh ≥32-char secret
- Restrict `CORS_ORIGIN` to your real frontend origin only
- Replace the mail stub in `backend/src/utils/mail.js` with a real provider
  so verification passwords actually land in inboxes
