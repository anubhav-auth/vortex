# Deploying Vortex on Render Free + Cloudflare Pages

A step-by-step guide for putting Vortex on the internet with a $0/month
stack:

- Backend: Render Free Web Service
- Frontend: Cloudflare Pages
- Database: Neon Postgres Free
- Email: Resend Free
- Monitoring: UptimeRobot Free

Optional extra cost:

- Custom domain: about $10/year

Estimated first deploy time: 2-3 hours

---

## Important tradeoff

As of May 3, 2026, Render still offers a free web service, but it is not
always-on:

- It spins down after 15 minutes without inbound traffic.
- The next request or WebSocket connection can take about 1 minute to wake it.
- Free web services do not provide shell access or one-off jobs.

That means this setup is good for demos, hobby projects, internal tools,
and hackathon/event usage if you accept cold starts or keep it warm with a
monitor. It is not the right choice if you need zero-cold-start behavior.

---

## Why this stack

This repo is a split app:

- `backend/` is an Express + Prisma + Socket.IO service
- `frontend/` is a Vite-built SPA
- the frontend must talk to a public backend URL in production

Render is a good fit for the backend because it supports Node web services
and WebSockets on the free tier. Cloudflare Pages is still the best fit for
the frontend because it handles static SPA hosting cleanly and cheaply.

Neon stays in the plan instead of Render Postgres because Render's free
Postgres expires after 30 days, while Neon Free is not time-limited.

---

## Architecture

```text
GitHub repo
  |- Render Free Web Service     -> backend API + Socket.IO
  |- Cloudflare Pages            -> frontend SPA
  |- Neon Postgres              <- Prisma database
  |- Resend                     <- transactional email
```

Browser flow:

1. User opens the Cloudflare Pages frontend
2. Frontend calls the Render backend using `VITE_API_URL`
3. Backend talks to Neon
4. Backend sends email through Resend

---

## Repo-specific deployment facts

These matter for this repo:

- The frontend uses `VITE_API_URL` in production:
  [frontend/src/lib/api.js](./frontend/src/lib/api.js)
- Socket.IO also uses `VITE_API_URL`:
  [frontend/src/lib/socket.js](./frontend/src/lib/socket.js)
- The backend currently uses a mail stub:
  [backend/src/utils/mail.js](./backend/src/utils/mail.js)
- Prisma CLI is already wired to prefer `DIRECT_URL` when present:
  [backend/prisma.config.js](./backend/prisma.config.js)

That last point matters on Neon:

- `DATABASE_URL` should be the pooled connection for the running app
- `DIRECT_URL` should be the direct connection for `prisma db push`

---

## Step 1 - Push the repo to GitHub

Skip this if your repo is already on GitHub and current.

If needed:

```bash
git remote remove origin
git remote add origin https://github.com/YOU/vortex.git
git branch -M main
git push -u origin main
```

Completion check:

- your repo is on GitHub
- branch `main` contains your latest code

---

## Step 2 - Create the Neon database

1. Sign up at <https://neon.com>
2. Create a project named `vortex`
3. Choose a region close to your Render backend region
4. Open the connection details in Neon

Copy and save both of these:

- `DATABASE_URL`: pooled connection
- `DIRECT_URL`: direct connection

Example pooled connection:

```text
postgresql://user:pass@ep-...-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require
```

Example direct connection:

```text
postgresql://user:pass@ep-....us-east-2.aws.neon.tech/dbname?sslmode=require
```

Do not remove `?sslmode=require`.

Completion check:

- you have both the pooled and direct Neon URLs saved

---

## Step 3 - Set up Resend

1. Sign up at <https://resend.com>
2. Create an API key
3. Save it as `RESEND_API_KEY`

If you already own a domain:

1. Add it in Resend
2. complete the DNS verification
3. plan to use something like `Vortex <noreply@yourdomain.com>`

If you do not own a domain yet:

- you can test with `onboarding@resend.dev`
- that is fine for testing, not for a real public event

Completion check:

- you have a `RESEND_API_KEY`
- optionally, your sender domain is verified

---

## Step 4 - Replace the mail stub with Resend

The current backend does not send real email. It only logs mail content.

Install the SDK:

```bash
cd backend
npm install resend
```

Replace `sendMail` in [backend/src/utils/mail.js](./backend/src/utils/mail.js)
with this:

```js
import { Resend } from 'resend';
import { logger } from './logger.js';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.MAIL_FROM ?? 'Vortex <onboarding@resend.dev>';

export const sendMail = async ({ to, subject, text }) => {
  if (!resend) {
    logger.warn('mail.skipped - no RESEND_API_KEY', { to, subject, body: text });
    return { delivered: false, reason: 'no-key' };
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, text });
    logger.info('mail.sent', { to, subject, id: result.data?.id });
    return { delivered: true };
  } catch (err) {
    logger.error('mail.failed', { to, subject, err: err.message });
    return { delivered: false, error: err.message };
  }
};
```

Leave the three higher-level mail helpers in that file unchanged.

Commit and push:

```bash
cd ..
git add backend/package.json backend/package-lock.json backend/src/utils/mail.js
git commit -m "feat(mail): add Resend for production email"
git push
```

If you skip this step, the app still works, but approved student passwords
will only appear in backend logs.

Completion check:

- `resend` is installed in `backend/package.json`
- `backend/src/utils/mail.js` uses `RESEND_API_KEY`
- changes are pushed to GitHub

---

## Step 5 - Deploy the backend on Render Free

1. Sign up at <https://render.com>
2. In Render, click `New` -> `Web Service`
3. Connect your GitHub repo
4. Select your repo

Use these settings:

| Field | Value |
|---|---|
| Name | `vortex-backend` |
| Region | pick the same region family as Neon |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Instance Type | `Free` |
| Health Check Path | `/api/health` |

Set these environment variables in Render:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20` |
| `PORT` | `10000` |
| `LOG_LEVEL` | `info` |
| `DATABASE_URL` | your Neon pooled connection |
| `DIRECT_URL` | your Neon direct connection |
| `ACCESS_TOKEN_SECRET` | generate a strong secret, 32+ chars |
| `ACCESS_TOKEN_EXPIRY` | `8h` |
| `BCRYPT_ROUNDS` | `12` |
| `CORS_ORIGIN` | `https://placeholder.invalid` |
| `ADMIN_SEED_EMAIL` | your real admin email |
| `ADMIN_SEED_PASSWORD` | generate a strong password |
| `JURY_SEED_PASSWORD` | generate a strong password |
| `RESEND_API_KEY` | your Resend API key |
| `MAIL_FROM` | your verified sender, or `Vortex <onboarding@resend.dev>` |

You can generate secrets with any password manager or token generator. If
you already use `openssl`, these work:

```bash
openssl rand -base64 64
openssl rand -base64 18
openssl rand -base64 18
```

Deploy the service. When it becomes healthy, copy the backend URL:

```text
https://vortex-backend.onrender.com
```

Test it:

```bash
curl https://vortex-backend.onrender.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

Completion check:

- Render backend is deployed
- `/api/health` returns `{"status":"ok"}`
- you saved the public backend URL

---

## Step 6 - Deploy the frontend on Cloudflare Pages

1. Sign up at <https://dash.cloudflare.com>
2. Open `Workers & Pages`
3. Create a new Pages project from Git
4. Connect the same GitHub repo

Use these settings:

| Field | Value |
|---|---|
| Project name | `vortex` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Root directory | `frontend` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |

Set this production environment variable:

| Name | Value |
|---|---|
| `VITE_API_URL` | your Render backend URL, no trailing slash |

Deploy. When it finishes, save the Pages URL:

```text
https://vortex-xyz.pages.dev
```

Completion check:

- frontend deploy succeeded
- homepage loads from the Pages URL
- you saved the Pages URL

---

## Step 7 - Update backend CORS

Go back to Render and change:

```text
CORS_ORIGIN=https://vortex-xyz.pages.dev
```

Use your actual Pages URL. No trailing slash.

Save the environment change and let Render redeploy the backend.

If you later attach a custom domain, you will update this again.

Completion check:

- backend has redeployed
- `CORS_ORIGIN` matches the real frontend origin exactly

---

## Step 8 - Apply the schema and seed from your local machine

Free Render web services do not provide shell access or one-off jobs, so
run Prisma locally against Neon.

From the repo root:

```bash
cd backend
npm install
```

### On Windows PowerShell

```powershell
$env:DATABASE_URL="YOUR_POOLED_NEON_URL"
$env:DIRECT_URL="YOUR_DIRECT_NEON_URL"
npx prisma db push
npm run db:seed
```

### On macOS/Linux

```bash
export DATABASE_URL="YOUR_POOLED_NEON_URL"
export DIRECT_URL="YOUR_DIRECT_NEON_URL"
npx prisma db push
npm run db:seed
```

Expected seed output includes lines like:

```text
[seed] Admin ready (...)
[seed] Juries: 3 ensured (...)
[seed] done
```

Now go to the frontend and sign in with:

- the `ADMIN_SEED_EMAIL` you set on Render
- the `ADMIN_SEED_PASSWORD` you set on Render

Completion check:

- `prisma db push` succeeded
- `npm run db:seed` succeeded
- you can sign in as admin from the deployed frontend

---

## Step 9 - Verify the full flow

At this point the deploy should be working end-to-end.

Check these in order:

1. Open the frontend Pages URL
2. Sign in as admin
3. Register a student account from `/register`
4. Approve the student from the admin verification page
5. Confirm the password arrives by email

If you skipped the Resend integration in Step 4, check Render logs instead
for the generated password.

Completion check:

- admin login works
- student registration works
- approval works
- password delivery works, either by email or log output

---

## Step 10 - Optional custom domain

If you want `vortex.yourdomain.com` instead of `*.pages.dev`:

1. Buy or use an existing domain
2. Add the domain to Cloudflare
3. In the Pages project, add a custom domain
4. Wait for TLS to provision

Then update Render:

```text
CORS_ORIGIN=https://vortex.yourdomain.com
```

If you verified the same domain in Resend, also update:

```text
MAIL_FROM=Vortex <noreply@yourdomain.com>
```

Completion check:

- custom domain loads the frontend
- admin login still works
- CORS still works from the custom domain

---

## Step 11 - Keep Render awake with UptimeRobot

If you do nothing, Render Free will spin down after 15 minutes idle.

To reduce cold starts:

1. Sign up at <https://uptimerobot.com>
2. Add an HTTP(s) monitor
3. Use this URL:

```text
https://vortex-backend.onrender.com/api/health
```

4. Set the interval to 5 minutes

This does two things:

- monitors uptime
- keeps the free backend from idling out

With a single free web service, 24/7 uptime pings fit within Render's
750 free instance hours in a normal month.

Completion check:

- UptimeRobot is successfully pinging `/api/health`
- the backend no longer cold-starts during active use

---

## Deploying updates

Normal code updates:

```bash
git add .
git commit -m "feat: your change"
git push
```

Then:

- Render auto-redeploys the backend from `main`
- Cloudflare Pages auto-redeploys the frontend from `main`

If you change only frontend code, only the Pages deploy really matters.
If you change only backend code, only the Render deploy really matters.

### If you change the Prisma schema

After pushing your code, run this locally again:

### On Windows PowerShell

```powershell
cd backend
$env:DATABASE_URL="YOUR_POOLED_NEON_URL"
$env:DIRECT_URL="YOUR_DIRECT_NEON_URL"
npx prisma db push
```

### On macOS/Linux

```bash
cd backend
export DATABASE_URL="YOUR_POOLED_NEON_URL"
export DIRECT_URL="YOUR_DIRECT_NEON_URL"
npx prisma db push
```

If the seed data itself changed and you want it applied:

```bash
npm run db:seed
```

---

## Free-tier limits that matter

These are the important constraints in this stack:

| Service | Current free-tier fact |
|---|---|
| Render Web Service | spins down after 15 minutes idle, ~1 minute cold start, 750 free instance hours/month, no shell access on free |
| Neon | 0.5 GB storage/project, 100 CU-hours/month/project, scale-to-zero |
| Cloudflare Pages | free static hosting with global CDN, 500 deployments/month on free plan |
| Resend | 3,000 emails/month, 100/day |
| Render Postgres | not used here because free databases expire after 30 days |

The main operational limit is Render cold starts, not Neon.

---

## Common problems

### Browser shows a CORS error

Check that `CORS_ORIGIN` on Render exactly matches your frontend origin:

- correct protocol
- no trailing slash
- no wrong subdomain

### Frontend loads but API calls fail

Check `VITE_API_URL` in Cloudflare Pages production variables. It must point
to the Render backend URL.

### Backend crashes on Render immediately

Check Render logs. The most common causes are:

- missing env vars
- wrong `DATABASE_URL`
- too-short `ACCESS_TOKEN_SECRET`

### `prisma db push` fails locally

Usually one of these:

- you used the pooled URL where a direct URL is expected
- the Neon URLs lost `?sslmode=require`
- local dependencies are not installed in `backend/`

### Student approval works but no email arrives

Either:

- you did not replace the mail stub
- `RESEND_API_KEY` is missing
- `MAIL_FROM` uses an unverified sender/domain

### First request is slow after inactivity

That is expected on Render Free. Either:

- accept the cold start
- keep the backend warm with UptimeRobot
- upgrade the backend to a paid Render plan

---

## Billing safety

If your goal is "no surprise bills", use this setup carefully:

- Neon: free plan needs no card for normal free use
- Cloudflare Pages: free plan works without a payment method
- Resend: free plan works without a payment method
- UptimeRobot: free plan works without a payment method
- Render: safest path is to avoid adding a payment method unless you intend to upgrade

Per Render's docs, if you do not add a payment method and exceed included
bandwidth or build pipeline limits, Render suspends free services instead of
billing you.

If you buy a domain, remember that domain renewals are separate from hosting.

---

## What to do next

- Brand the UI in `frontend/src/index.css`
- Replace the mail stub if you have not done it yet
- Upload your real institution list in the admin Registry screen
- Run a full student -> admin -> jury flow before the event day

