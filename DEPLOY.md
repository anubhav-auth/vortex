# Deploying Vortex on a $0/month Free Tier

A complete, hand-held guide to taking Vortex from "works on my laptop"
to "live on the internet at your own domain" — using only free-forever
services. Written for someone who has never deployed a full-stack app
before.

You will:

1. Sign up for five free services (no surprise bills).
2. Set up a managed Postgres database, free.
3. Deploy the backend on a free always-on Node host.
4. Deploy the frontend on a free static host with a global CDN.
5. (Optional) Buy a domain for ~$10/year.
6. Connect real transactional email, free.
7. Set up uptime monitoring, free.

**Total recurring cost: $0/month.** Add ~$10/year if you want a custom
domain (otherwise everything works on the providers' free subdomains).

Estimated time the first deploy: **2-3 hours**. Updates after that:
**5 minutes** (`git push` → done).

---

## Table of Contents

1. [Why this stack](#1-why-this-stack)
2. [What you'll need before starting](#2-what-youll-need-before-starting)
3. [Mental model](#3-mental-model)
4. [Step 1 — Push your code to GitHub](#4-step-1--push-your-code-to-github)
5. [Step 2 — Free PostgreSQL on Neon](#5-step-2--free-postgresql-on-neon)
6. [Step 3 — Free email on Resend](#6-step-3--free-email-on-resend)
7. [Step 4 — Wire Resend into the backend](#7-step-4--wire-resend-into-the-backend)
8. [Step 5 — Deploy the backend on Koyeb](#8-step-5--deploy-the-backend-on-koyeb)
9. [Step 6 — Deploy the frontend on Cloudflare Pages](#9-step-6--deploy-the-frontend-on-cloudflare-pages)
10. [Step 7 — Initial database seed](#10-step-7--initial-database-seed)
11. [Step 8 — (Optional) Custom domain](#11-step-8--optional-custom-domain)
12. [Step 9 — Free uptime monitoring](#12-step-9--free-uptime-monitoring)
13. [Deploying updates](#13-deploying-updates)
14. [Free-tier limits & when you'll outgrow them](#14-free-tier-limits--when-youll-outgrow-them)
15. [Common production problems](#15-common-production-problems)
16. [Auto-bill safety checklist](#16-auto-bill-safety-checklist)

---

## 1. Why this stack

The "always-on free Node host" market shrank a lot in 2024-2025. Cyclic
shut down. Glitch killed app hosting. Fly.io removed its permanent
free tier. Railway is trial-credits only. **Render free** still exists
but spins down after 15 minutes of inactivity (cold starts ~30-60s,
which kills WebSockets).

The combination below is the one that's still genuinely free in early
2026 *and* supports persistent WebSocket connections (which Vortex's
real-time broadcasts and toasts depend on):

| Layer | Service | Why this one |
|---|---|---|
| Backend | **Koyeb** | Truly always-on free instance, supports websockets |
| Frontend | **Cloudflare Pages** | Unlimited bandwidth, built-in CDN |
| Database | **Neon** | 0.5 GB Postgres, scale-to-zero (~500 ms wake) |
| Email | **Resend** | 3,000 emails/month, no credit card |
| Monitoring | **UptimeRobot** | 50 monitors, 5-min checks |
| Domain | (optional) Cloudflare Registrar | At-cost ~$10/yr |

Only Koyeb asks for a credit card (verification only — they will not
auto-charge unless you upgrade beyond the single free instance).

---

## 2. What you'll need before starting

On your local machine:

- **Git** — <https://git-scm.com/downloads>
- A **GitHub account** — <https://github.com>
- A web browser — for signing up to the services below
- The **Vortex repo cloned locally** (you already have this)

That's it. No Docker required for production deploys — Koyeb and
Cloudflare Pages build from your GitHub repo automatically.

---

## 3. Mental model

```
                   GITHUB REPO (you push code here)
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   ┌────────────────┐              ┌──────────────────┐
   │   KOYEB        │              │ CLOUDFLARE PAGES │
   │   backend +    │              │ frontend (static │
   │   socket.io    │              │ build of /dist)  │
   │   always-on    │              │ global CDN       │
   └────────┬───────┘              └────────┬─────────┘
            │                               │
            │                               │
            │   user's browser hits         │
            │   Cloudflare → calls          │
            │   Koyeb's API URL ────────────┘
            ▼
   ┌────────────────┐         ┌──────────────────┐
   │   NEON         │         │   RESEND         │
   │   PostgreSQL   │         │   transactional  │
   │   (free 0.5GB) │         │   email          │
   └────────────────┘         └──────────────────┘
```

Three deploy targets, each with a separate signup. They talk to each
other over the public internet via TLS-secured connections.

---

## 4. Step 1 — Push your code to GitHub

Skip this section if your code is already on GitHub.

If your local repo has no remote yet, or it points at a fork you don't
own:

1. Go to <https://github.com/new>.
2. Create a **new private repository** named `vortex` (or anything).
   Don't tick any of the "initialize with README/gitignore/license"
   boxes — your local repo already has those.
3. GitHub will show "Push an existing repository" instructions. Run
   the commands locally, in your project root:

   ```bash
   git remote remove origin                              # if there's an old one
   git remote add origin https://github.com/YOU/vortex.git
   git branch -M main
   git push -u origin main
   ```

4. Reload the GitHub page — you should see all your files.

**Why GitHub specifically?** Both Koyeb and Cloudflare Pages connect
directly to a GitHub repo and auto-deploy on every push. GitLab and
Bitbucket also work but require slightly different setup paths.

---

## 5. Step 2 — Free PostgreSQL on Neon

Neon gives you 0.5 GB of Postgres storage with automatic backups, no
credit card required.

1. Sign up at <https://neon.tech> (use "Sign in with GitHub").
2. After signup you'll be prompted to create a project.
   - **Project name:** `vortex`
   - **Postgres version:** the latest (16 or 17)
   - **Region:** pick one close to where Koyeb's free region is —
     **Frankfurt** or **Washington DC** are the Koyeb free options
     (they're listed on the Koyeb signup page in step 5)
3. Click **Create project**.

You're now in the Neon dashboard. Find the **connection string**:

- Top of the dashboard → **Connection Details** card
- Make sure the dropdowns say **Pooled connection** and **Node.js**
- Copy the value. It looks like:

  ```
  postgresql://vortex_owner:abc123XYZ@ep-cool-cloud-12345-pooler.us-east-2.aws.neon.tech/vortex?sslmode=require
  ```

**Save this somewhere safe.** Call it `DATABASE_URL` in your notes —
you'll paste it into Koyeb in step 5.

> The `?sslmode=require` at the end is mandatory. Neon rejects
> non-TLS connections. If you accidentally drop it, the backend will
> fail to start with a confusing error.

---

## 6. Step 3 — Free email on Resend

Resend gives you 3,000 emails/month, no card needed.

1. Sign up at <https://resend.com> (Sign in with GitHub is fine).
2. After signup, **Domains** → **Add Domain**. You have two paths:

   ### Path A — You bought a domain (recommended for production)

   - Add your domain (e.g. `yourdomain.com`).
   - Resend shows 3-4 DNS records (TXT, MX, CNAME). Add them at your
     domain registrar's DNS panel.
   - Click **Verify**. Takes 1-30 minutes for DNS to propagate.

   ### Path B — You don't have a domain yet

   - Skip this for now. Resend lets you send from `onboarding@resend.dev`
     by default (rate-limited to your own email). It's enough to test
     the verification flow but not for real users.
   - Come back here after [Step 8](#11-step-8--optional-custom-domain).

3. **API Keys** → **Create API Key** → copy the key (`re_…`). **Save
   it as `RESEND_API_KEY` in your notes.** You only see it once.

---

## 7. Step 4 — Wire Resend into the backend

The current backend just logs emails to stdout (the dev mail stub). For
production we need real delivery. This is a small code change.

In your local repo:

```bash
cd backend
npm install resend
```

Open `backend/src/utils/mail.js` and **replace `sendMail`** with:

```js
import { Resend } from 'resend';
import { logger } from './logger.js';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.MAIL_FROM ?? 'Vortex <onboarding@resend.dev>';

export const sendMail = async ({ to, subject, text }) => {
  // Dev / mis-configured: log instead of sending so the system still works.
  if (!resend) {
    logger.warn('mail.skipped — no RESEND_API_KEY', { to, subject, body: text });
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

**Keep the `sendVerificationApprovedMail`, `sendVerificationRejectedMail`,
and `sendAccessRevokedMail` exports below it untouched** — they call
`sendMail` under the hood, so they automatically use Resend now.

Commit and push:

```bash
cd ..
git add backend/package.json backend/package-lock.json backend/src/utils/mail.js
git commit -m "feat(mail): real Resend integration for production"
git push
```

---

## 8. Step 5 — Deploy the backend on Koyeb

Koyeb gives you one always-on free instance with 512 MB RAM. WebSockets
work out of the box.

1. Sign up at <https://www.koyeb.com> (Sign in with GitHub).
2. Koyeb asks for a credit card during signup for verification. **They
   will not auto-bill** unless you explicitly upgrade past the free
   tier. (See [§16](#16-auto-bill-safety-checklist) for how to verify.)
3. **Create Service** → **Web Service** → **GitHub**.
4. Authorize Koyeb to access your `vortex` repo. Select it.
5. Configure:

   | Field | Value |
   |---|---|
   | **Branch** | `main` |
   | **Builder** | **Dockerfile** |
   | **Dockerfile location** | `backend/Dockerfile` |
   | **Build context** | `backend` (NOT the repo root) |
   | **Region** | Frankfurt OR Washington DC (whichever matches your Neon region) |
   | **Instance type** | **Free** (Eco / 512 MB) |
   | **Service name** | `vortex-backend` |

6. Scroll to **Ports**:
   - Port `3001` (HTTP) — the backend listens on this.
   - Make sure it's **public**.

7. Scroll to **Environment variables** → add each of these. Copy
   values from your notes (Neon URL, Resend key) and generate fresh
   secrets where indicated:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `LOG_LEVEL` | `info` |
   | `DATABASE_URL` | *(your Neon connection string from step 2)* |
   | `ACCESS_TOKEN_SECRET` | *(generate: see below)* |
   | `ACCESS_TOKEN_EXPIRY` | `8h` |
   | `BCRYPT_ROUNDS` | `12` |
   | `CORS_ORIGIN` | *(leave blank for now — we'll fill after step 6)* |
   | `ADMIN_SEED_EMAIL` | `you@yourdomain.com` (your real email) |
   | `ADMIN_SEED_PASSWORD` | *(generate)* |
   | `JURY_SEED_PASSWORD` | *(generate)* |
   | `RESEND_API_KEY` | *(your `re_…` key from step 3)* |
   | `MAIL_FROM` | `Vortex <onboarding@resend.dev>` (or your verified Resend sender) |

   ### Generating strong values

   In any terminal:

   ```bash
   # JWT secret — must be 32+ chars, use 64 for extra safety
   openssl rand -base64 64

   # Admin password
   openssl rand -base64 18

   # Jury default password
   openssl rand -base64 18
   ```

   Don't have `openssl`? Use <https://it-tools.tech/token-generator>
   (set length 64, all char types).

   **Save all three** in a password manager.

8. Click **Deploy**. Koyeb pulls your repo, builds the Dockerfile, and
   starts the service. First build takes ~5 minutes — watch the logs.

9. When the service is **Healthy**, copy its public URL from the top of
   the page. It looks like:

   ```
   https://vortex-backend-yourname.koyeb.app
   ```

   **Save this** — you'll need it for the frontend in step 6, and
   we'll come back to set `CORS_ORIGIN` after step 6.

10. Verify it's alive:

    ```bash
    curl https://vortex-backend-yourname.koyeb.app/api/health
    # → {"status":"ok"}
    ```

---

## 9. Step 6 — Deploy the frontend on Cloudflare Pages

Cloudflare Pages gives you unlimited bandwidth, global CDN, and free
HTTPS. The frontend talks to your Koyeb backend by URL.

1. Sign up at <https://dash.cloudflare.com> (free account, no card).
2. Top-left dropdown → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
3. Authorize Cloudflare to access your `vortex` repo. Select it.
4. **Set up builds and deployments**:

   | Field | Value |
   |---|---|
   | **Project name** | `vortex` |
   | **Production branch** | `main` |
   | **Framework preset** | **Vite** |
   | **Build command** | `npm install && npm run build` |
   | **Build output directory** | `dist` |
   | **Root directory** | `frontend` ← **important** |

5. **Environment variables** (Production scope) → add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | *(your Koyeb URL from step 5, no trailing slash)* |

   This tells the frontend where to find the backend. Without it the
   bundle uses relative URLs and 404s in production.

6. Click **Save and Deploy**. Cloudflare builds the SPA and publishes
   it. First deploy takes ~2 minutes.

7. When done, you get a URL like:

   ```
   https://vortex-xyz.pages.dev
   ```

   **Save this** — you need it for the next step.

8. **Now go back to Koyeb** → your `vortex-backend` service →
   **Settings** → **Environment variables**. Set:

   ```
   CORS_ORIGIN = https://vortex-xyz.pages.dev
   ```

   (Use your actual Pages URL, no trailing slash.) Click **Save**.
   Koyeb redeploys the backend with the new env (~1 min).

9. Open `https://vortex-xyz.pages.dev` in your browser. You should see
   the Vortex landing page. Click **Sign in** — but you can't yet
   because there's no admin account. Continue to step 7.

---

## 10. Step 7 — Initial database seed

The seed script creates the admin + jury accounts + hackathon rules.
Run it once, against your Neon database.

The simplest path: SSH into the running Koyeb backend and run the seed
command there.

1. In Koyeb, open your `vortex-backend` service → **Console** tab.
2. Click **Open shell**. You're now inside the container.
3. Run:

   ```bash
   npx prisma db push      # apply schema (one-time)
   npm run db:seed         # seed admin + juries + rules + sample registry
   ```

4. You'll see:

   ```
   [seed] start
   [seed] HackathonRules ready (id=rules)
   [seed] RoundControl ready (id=round_control)
   [seed] Institutions: 5 ensured
   [seed] Domains: 5 ensured
   [seed] ProblemStatements: 10 ensured
   [seed] Admin ready (you@yourdomain.com)
   [seed] Juries: 3 ensured (default password: …)
   [seed] CollegeRegistry: 8 ensured
   [seed] done
   ```

5. Type `exit` to leave the shell.
6. Go to your Pages URL → **Sign in** with the admin email + the
   `ADMIN_SEED_PASSWORD` you set in step 5.

🎉 **You're live, on a $0/month stack.**

> If the Console option isn't visible on Koyeb's free tier, alternative:
> install Node 20+ and the `psql` client locally, then run the seed
> against the Neon URL directly:
>
> ```bash
> cd backend
> # On Windows PowerShell:
> $env:DATABASE_URL="postgresql://...@neon.tech/vortex?sslmode=require"
> # On macOS/Linux:
> export DATABASE_URL="postgresql://...@neon.tech/vortex?sslmode=require"
> npx prisma db push
> npm run db:seed
> ```

---

## 11. Step 8 — (Optional) Custom domain

If you don't care about the URL being `vortex-xyz.pages.dev`, skip this.

If you want `vortex.yourdomain.com`:

1. Buy a domain. **Cloudflare Registrar** is cheapest at-cost
   (~$10/yr for `.com`, free WHOIS privacy):
   - In your Cloudflare dashboard → top-right **Add** → **Existing**
     domain (any) or **Register a new domain** → search and buy.
2. Once owned, add the domain as a Cloudflare site (it'll auto-detect
   if registered through Cloudflare).
3. **Pages project** → **Custom domains** → **Set up a custom domain**
   → enter `vortex.yourdomain.com` → Cloudflare adds the DNS records
   automatically. HTTPS cert auto-provisions in ~1 minute.
4. Update Koyeb env: change `CORS_ORIGIN` from
   `https://vortex-xyz.pages.dev` to `https://vortex.yourdomain.com`.
5. (Resend) If you skipped Path A in step 3, do it now: verify your
   domain in Resend so you can send from `noreply@yourdomain.com` and
   update `MAIL_FROM` on Koyeb.

Other registrars work too (Porkbun is great), but using Cloudflare end
to end means one less DNS panel to log into.

---

## 12. Step 9 — Free uptime monitoring

UptimeRobot pings your backend every 5 minutes. If it goes down, you
get an email.

1. Sign up at <https://uptimerobot.com> (no card).
2. **+ Add New Monitor**:
   - **Type:** HTTP(s)
   - **Friendly Name:** Vortex backend
   - **URL:** `https://vortex-backend-yourname.koyeb.app/api/health`
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** your email (you may need to verify it)
3. **Create Monitor**.

You can also add the frontend URL as a second monitor — Cloudflare
Pages basically never goes down but it's nice to know.

---

## 13. Deploying updates

The whole point of git-connected deploys: just push and walk away.

```bash
# Make changes locally
git add .
git commit -m "feat: new thing"
git push

# Both Koyeb and Cloudflare Pages auto-deploy from main:
#   - Pages: ~2 min (rebuild + global CDN propagation)
#   - Koyeb: ~3-5 min (Docker build + restart)
```

Watch deploy progress in each provider's dashboard. UptimeRobot pings
during the Koyeb restart will fail for ~30s — expect one alert. To
avoid notification spam, set the alert threshold to "down for 2+
checks" in UptimeRobot settings.

### If you change the database schema

```bash
# After git push, when Koyeb is healthy again:
# Open Koyeb console for vortex-backend → Open shell
npx prisma db push
exit
```

---

## 14. Free-tier limits & when you'll outgrow them

The numbers below are the **bottleneck-first** view — each is the
limit you'll hit first when usage grows.

| Service | Free limit | "What that means" |
|---|---|---|
| **Neon Postgres** | 0.5 GB storage, 100 compute-hrs/mo | ~50,000 users + their full registration data fits. Compute-hours = wall-clock time the DB is "warm" (auto-sleeps after 5 min idle). 100 hrs = ~3.3 hrs/day of active usage. |
| **Koyeb Web Service** | 512 MB RAM, 0.1 vCPU | Comfortably handles 10-20 concurrent users with WebSockets. CPU is the first thing you'll hit on a sudden traffic spike. |
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo | The unlimited bandwidth is real. 500 builds = ~16 deploys/day for 30 days. You won't hit this. |
| **Resend** | 3,000 emails/mo, 100/day | ~3,000 verifications + password reissues per month. Plenty for a 500-person hackathon. |
| **UptimeRobot** | 50 monitors, 5-min checks | You're using 1-2 of them. |

**When to leave free tier**, in order:

1. **>20 concurrent users** with WebSockets → Koyeb $7/mo Nano (1 GB RAM, 0.5 vCPU)
2. **>3,000 emails/mo** → Resend Pro $20/mo for 50,000
3. **>0.5 GB DB** → Neon Launch $19/mo for 10 GB

Total to scale to ~5,000 concurrent users: ~$50/mo.

---

## 15. Common production problems

### "CORS error" in browser console after first deploy

Check that `CORS_ORIGIN` on Koyeb exactly matches your Pages URL —
including `https://`, no trailing slash. Browsers strip default ports,
so `https://example.com:443` won't match `https://example.com`. Most
common cause: forgot to update CORS after switching to a custom domain.

### Backend deploy fails with "Cannot find module"

You probably set the wrong **Build context** in Koyeb. It must be
`backend` (not the repo root). The Dockerfile is at `backend/Dockerfile`
and the build expects `backend/` as the context.

### Frontend builds but shows "Failed to load resource" for /api

`VITE_API_URL` isn't set on Pages. Set it (Settings → Environment
variables → Production), then trigger a redeploy: **Deployments** →
top of the list → ⋯ menu → **Retry deployment**.

### "User was denied access on the database"

Wrong `DATABASE_URL`. Re-copy from Neon dashboard. Special characters
in the password must be URL-encoded (Neon's auto-generated passwords
are URL-safe so this is rare).

### Backend keeps crashing immediately after start

Almost always a missing required env var. Check Koyeb logs for
`Invalid environment configuration: { ACCESS_TOKEN_SECRET: ... }`. The
backend exits with status 1 on any missing required env.

### Neon database keeps "sleeping"

Neon free tier scales to zero after 5 minutes of no DB traffic. The
first request after sleep takes ~500 ms (warm-up). For a hackathon
this is invisible. If it bothers you, set UptimeRobot to also ping a
backend route that hits the database (e.g. `/api/leaderboard` if rules
let it be public) every 5 min — keeps the DB warm, costs ~30
compute-hours/mo, well within the 100-hour limit.

### Koyeb shuts the service down with "out of memory"

512 MB is tight. The Vortex backend uses ~150-200 MB at idle, jumping
to ~300 MB under load. If you hit OOM, the cheapest fix is to ensure
you're not running tests/migrations in the same container. If it's
persistent, the $7/mo Nano tier doubles the RAM.

### "Sign in" returns 502 / 503 the very first time

Koyeb's free instance can take ~10s to wake from a deep sleep if there's
been zero traffic in hours. Refresh once. If it persists, check the
service is **Healthy** (not just **Running**) in the Koyeb dashboard —
the health probe hits `/api/health`.

---

## 16. Auto-bill safety checklist

The whole point of this guide is **no surprise bills**. Verify each:

- ✅ **Neon** — no card on file. You cannot be billed.
- ✅ **Cloudflare Pages** — no card. Cannot be billed.
- ✅ **Resend** — no card. If you exceed free quota, sends fail (you're
  not billed for overage).
- ✅ **UptimeRobot** — no card. Cannot be billed.
- ⚠️ **Koyeb** — card required for verification. To eliminate auto-bill
  risk:
  - **Settings** → **Billing** → confirm no paid plan is active.
  - **Settings** → **Notifications** → enable usage alerts at $0.01 so
    you're emailed the second any charge starts to accrue.
  - You only get billed if you **explicitly** upgrade your service
    instance type or add a second service.
- ⚠️ **Cloudflare Registrar** (only if you bought a domain) — auto-renews
  yearly. Disable in **Domain Registration** → your domain → toggle off
  auto-renew, or accept the ~$10/yr.

---

## What to do next

- **Brand the theme.** Edit the CSS variables at the top of
  `frontend/src/index.css` — change `--accent-cyan` and rebuild.
  Cloudflare Pages auto-deploys the change.
- **Customise the registration form** in
  `frontend/src/pages/public/RegistrationPage.jsx`.
- **Upload your real institution roster** to the Registry from the
  admin UI — paste a CSV via Admin → Registry → Bulk Upload.
- **Read [`README.md`](./README.md)** for the local-dev workflow if
  you want hot-reload while you iterate.

---

## License

MIT — see [LICENSE](./LICENSE).
