# Deploying Vortex to Production

A complete, hand-held guide to taking Vortex from "works on my laptop"
to "live on the internet at your own domain." Written for someone who
has never deployed a full-stack app before.

You will:

1. Buy a server (~$6/month) and a domain (~$12/year).
2. Set up a managed Postgres database.
3. Install Docker on the server.
4. Configure environment secrets.
5. Run the app behind a reverse proxy with HTTPS.
6. Set up automated backups, log monitoring, and updates.

Estimated time: **2-3 hours** the first time, **15 minutes** for
updates after that.

---

## Table of Contents

1. [Mental model — what you're building](#1-mental-model--what-youre-building)
2. [Prerequisites](#2-prerequisites)
3. [Buy a server](#3-buy-a-server)
4. [Buy a domain & point it](#4-buy-a-domain--point-it)
5. [First login + basic server hardening](#5-first-login--basic-server-hardening)
6. [Install Docker](#6-install-docker)
7. [Set up your production database](#7-set-up-your-production-database)
8. [Get the code onto the server](#8-get-the-code-onto-the-server)
9. [Generate strong secrets](#9-generate-strong-secrets)
10. [Production docker-compose file](#10-production-docker-compose-file)
11. [Caddy reverse proxy + automatic HTTPS](#11-caddy-reverse-proxy--automatic-https)
12. [First boot + initial seed](#12-first-boot--initial-seed)
13. [Connect a real email provider](#13-connect-a-real-email-provider)
14. [Backups](#14-backups)
15. [Monitoring & logs](#15-monitoring--logs)
16. [Deploying updates](#16-deploying-updates)
17. [Common production problems](#17-common-production-problems)
18. [Cost summary](#18-cost-summary)

---

## 1. Mental model — what you're building

```
                 ┌──────────────────────────────────────────┐
   YOUR DOMAIN   │         vortex.yourdomain.com            │
   (DNS A rec)   │                  │                       │
                 │                  ▼                       │
                 │   ┌──────────────────────────────┐       │
                 │   │  Caddy (reverse proxy + TLS) │       │
                 │   │  ports 80 + 443              │       │
                 │   └────────────┬─────────────────┘       │
                 │                │                         │
                 │     ┌──────────┴───────────┐             │
                 │     ▼                      ▼             │
                 │ frontend (nginx)     backend (express)   │
                 │ port 80 internal     port 3001 internal  │
                 │     │                      │             │
                 │     └──────────┬───────────┘             │
                 │                ▼                         │
                 │      managed Postgres (over TLS,         │
                 │      hosted by a cloud provider)         │
                 └──────────────────────────────────────────┘
                              ONE LINUX VM
```

Three pieces:

- **A domain** so users have a memorable URL (`vortex.yourdomain.com`).
- **A Linux server** running Docker, hosting frontend + backend.
- **A managed database** somewhere safe (Neon, Supabase, AWS RDS, etc.) —
  *not* on the same box, so backups + uptime are someone else's problem.

In front of everything sits **Caddy**, a tiny reverse proxy that
auto-fetches HTTPS certificates from Let's Encrypt for you. No
certificate-renewal scripts, no nginx config tuning. It just works.

---

## 2. Prerequisites

You need accounts at:

- A **VM provider** for the server. Recommended: DigitalOcean, Hetzner,
  Linode, or AWS Lightsail. Pick the one with a region near your users.
  Anything offering "Ubuntu 24.04 LTS" + SSH access works.
- A **domain registrar**. Recommended: Namecheap, Porkbun, or Cloudflare
  Registrar (cheapest at-cost pricing). $10-15/year for a `.com`.
- A **managed Postgres provider**. Recommended for free tier: Neon
  (<https://neon.tech>) or Supabase (<https://supabase.com>). Both give
  you a free Postgres with daily backups.

Tools on your local machine:

- A terminal (PowerShell on Windows, Terminal on macOS / Linux).
- An SSH key. If you've never created one:

  ```bash
  # macOS / Linux / Git Bash on Windows
  ssh-keygen -t ed25519 -C "you@yourdomain.com"
  # Press Enter through all prompts. Creates ~/.ssh/id_ed25519 + id_ed25519.pub
  ```

  The `.pub` file (the *public* half) is what you'll paste into the VM
  provider so you can log in without a password.

---

## 3. Buy a server

Walking through DigitalOcean as the example. Other providers are nearly
identical.

1. Sign up at <https://digitalocean.com>.
2. **Create → Droplets**.
3. Image: **Ubuntu 24.04 (LTS) x64**.
4. Plan: **Basic** → **Regular SSD** → **$6/month** (1 GB RAM, 1 vCPU,
   25 GB SSD). This is enough for hundreds of users. Bump to $12/mo if
   you expect a thousand+ concurrent.
5. Region: closest to your users.
6. Authentication: **SSH Key** → "Add new SSH Key" → paste the contents
   of `~/.ssh/id_ed25519.pub`.
7. Hostname: `vortex` (anything you like).
8. **Create Droplet**.

After ~30 seconds you get an **IPv4 address** like `134.209.180.45`.
Note it down — that's your server's address.

> **Why $6 and not free-tier?** Free-tier providers (AWS Free Tier,
> Oracle Cloud Free, Google Cloud) work but are notoriously hard to
> set up correctly the first time and have surprise-bill risk. $6/mo
> is the cheapest sane option.

---

## 4. Buy a domain & point it

1. At your registrar, search for and buy `yourdomain.com` (or whatever).
   Pay for at least 1 year, ~$10-15.
2. After purchase, find **DNS settings** / **DNS records**.
3. Add an **A record**:

   | Type | Host / Name | Value | TTL |
   |---|---|---|---|
   | A | `@` (or empty / `yourdomain.com`) | your droplet IP | 300 |
   | A | `www` | your droplet IP | 300 |

   Or, if you want a subdomain:

   | Type | Host | Value | TTL |
   |---|---|---|---|
   | A | `vortex` | your droplet IP | 300 |

   That makes `vortex.yourdomain.com` point to your server.

4. DNS takes 1-30 minutes to propagate. Verify:

   ```bash
   # Replace with your real domain
   nslookup vortex.yourdomain.com
   ```

   Should return your droplet IP. If not, wait longer or double-check
   the DNS record.

For the rest of this guide I'll assume you're using
**`vortex.yourdomain.com`**. Substitute your real domain everywhere.

---

## 5. First login + basic server hardening

From your local terminal:

```bash
ssh root@134.209.180.45        # your droplet IP
```

Accept the SSH fingerprint the first time. You should land at
`root@vortex:~#`.

> If you get "Permission denied (publickey)" you uploaded the wrong key.
> Recreate the droplet and re-paste the *public* key (the one ending in
> `.pub`).

Update the system and create a non-root user — running everything as
root is a footgun:

```bash
apt update && apt upgrade -y
adduser deploy                 # answer prompts. Set a strong password.
usermod -aG sudo deploy        # give deploy passwordless-with-sudo
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Test you can log in as the new user from a *new* terminal window:

```bash
ssh deploy@134.209.180.45
```

If it works, lock down root login. Back on the server:

```bash
sudo nano /etc/ssh/sshd_config
# find this line and change Yes -> No:
#   PermitRootLogin no
# Save with Ctrl+O, Enter, then Ctrl+X to exit nano.
sudo systemctl restart ssh
```

Set up a basic firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp          # HTTP (Caddy will use this for HTTPS challenge)
sudo ufw allow 443/tcp         # HTTPS
sudo ufw enable                # answer 'y'
sudo ufw status                # verify the three rules are listed
```

You're now logged in as `deploy`, root login is disabled, only ports
22/80/443 are open. From here on, **always log in as `deploy`**.

---

## 6. Install Docker

```bash
# Install Docker's official package (the Ubuntu apt one is outdated)
curl -fsSL https://get.docker.com | sudo sh

# Let `deploy` use docker without sudo
sudo usermod -aG docker deploy

# Verify (after logging out and back in for the group to take effect)
exit
ssh deploy@134.209.180.45
docker --version
docker compose version
docker run --rm hello-world    # should pull and print 'Hello from Docker!'
```

If `hello-world` works, Docker is good to go.

---

## 7. Set up your production database

Don't run Postgres on the same box as the app. Use a managed provider
so backups + maintenance are handled for you.

### Option A: Neon (recommended for getting started — free tier)

1. Sign up at <https://neon.tech>.
2. Create a project, name it `vortex`. Region near your droplet.
3. Once created, **Connection Details** → copy the connection string.
   It looks like:

   ```
   postgresql://vortex_owner:abc123XYZ@ep-cool-cloud-12345.us-east-2.aws.neon.tech/vortex?sslmode=require
   ```

4. **Save it somewhere safe** — you'll paste it into the server in §10.

### Option B: Supabase (also free)

Same idea — sign up, create project, find the connection string under
**Settings → Database → Connection string → URI**.

### Option C: Self-hosted Postgres (not recommended for first deploy)

If you really want to run Postgres on the same VM, add it as a service
in `docker-compose.yml` and use a named volume. You're now responsible
for backups, upgrades, and uptime. For everything that follows, just
use `postgresql://...@db:5432/vortex_db?schema=public` as your
`DATABASE_URL`.

> **Whatever you pick:** make sure the connection string includes
> `?sslmode=require` (Neon and Supabase enforce this; failing this
> step gives you a confusing connection error).

---

## 8. Get the code onto the server

On the server (logged in as `deploy`):

```bash
# Install git
sudo apt install -y git

# Clone the repo
cd ~
git clone https://github.com/Bhuvilol/TechExpress.git vortex
cd vortex

# Verify
ls
# Should show: backend  frontend  docker-compose.yml  README.md  ...
```

> **Forking the repo first** is recommended so you can keep your
> production tweaks (compose file, secrets references, custom theme)
> in version control. Replace the URL above with your fork's URL.

---

## 9. Generate strong secrets

You need three secrets. Generate each with `openssl` on the server:

```bash
# JWT signing secret (must be 32+ chars; use 64 to be safe)
openssl rand -base64 64
# example output: 7p9LJxD2... (long random string)

# Admin password
openssl rand -base64 18
# example: aB3xYz...

# Jury default password (you'll rotate per-jury later)
openssl rand -base64 18
```

Save all three in a password manager. You'll paste them into env vars
in the next step.

> **Do not commit these to git.** That's why we use a separate
> `.env.production` file that's gitignored.

---

## 10. Production docker-compose file

The repo's `docker-compose.yml` is tuned for local dev. Make a
production-specific override file.

On the server, in `~/vortex`:

```bash
nano docker-compose.prod.yml
```

Paste this, **substituting your real values** for the four `CHANGE_ME` lines:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      LOG_LEVEL: info
      # Your managed Postgres URL from §7. Must include sslmode=require.
      DATABASE_URL: "CHANGE_ME_POSTGRES_URL"
      # JWT secret from §9. 32+ chars.
      ACCESS_TOKEN_SECRET: "CHANGE_ME_JWT_SECRET"
      ACCESS_TOKEN_EXPIRY: "8h"
      BCRYPT_ROUNDS: 12
      # Only your real frontend origin — no localhost in prod.
      CORS_ORIGIN: "https://vortex.yourdomain.com"
      ADMIN_SEED_EMAIL: "you@yourdomain.com"
      ADMIN_SEED_PASSWORD: "CHANGE_ME_ADMIN_PASSWORD"
      JURY_SEED_PASSWORD: "CHANGE_ME_JURY_PASSWORD"
    expose:
      - "3001"
    # No `ports:` — backend is only reached through the frontend's nginx
    # proxy, which itself sits behind Caddy. Internal only.

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    expose:
      - "80"
    depends_on:
      - backend

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend

volumes:
  caddy_data:
  caddy_config:
```

> **Note:** the `db` service from the dev compose is gone — we're using
> managed Postgres. The `ports:` map for backend is gone too — only
> Caddy talks to the world. Caddy has the only `80:80` / `443:443`
> bindings.

---

## 11. Caddy reverse proxy + automatic HTTPS

Caddy reads a tiny config file and handles HTTPS automatically. Create it:

```bash
nano Caddyfile
```

Paste, replacing the domain:

```
vortex.yourdomain.com {
  encode gzip

  # Everything goes through the frontend container's nginx, which
  # proxies /api/* and /socket.io/* to the backend on the docker network.
  reverse_proxy frontend:80

  # Sensible defaults
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
  }

  log {
    output file /data/access.log {
      roll_size 10MB
      roll_keep 5
    }
  }
}
```

That's it. Caddy will:

- Listen on 80 + 443.
- Auto-fetch a Let's Encrypt cert for `vortex.yourdomain.com` on first
  request, then renew it forever.
- Force HTTP → HTTPS redirect.
- Enable HTTP/2 + gzip.

> Caddy needs to reach Let's Encrypt over the public internet on port
> 80 to validate ownership. If your DNS A record from §4 hasn't fully
> propagated yet, the first cert fetch will fail. Wait a few minutes
> and restart Caddy.

---

## 12. First boot + initial seed

Build and start everything:

```bash
cd ~/vortex
docker compose -f docker-compose.prod.yml up -d --build
```

The first build takes ~5 minutes. Watch progress:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Once you see `server started` from backend and `serving HTTPS on :443`
from caddy, hit Ctrl+C to stop tailing.

Apply the database schema (one-time):

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma db push
```

Seed admin + juries + rules + sample registry:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

Open <https://vortex.yourdomain.com> in your browser. You should see the
landing page with a valid HTTPS padlock. Sign in with the admin email
and password you set in §10.

🎉 **You're live.**

---

## 13. Connect a real email provider

The backend currently logs verification passwords to stdout instead of
emailing them. In production you need real email so users actually
receive their 6-digit codes.

### Pick a provider

| Provider | Free tier | Why |
|---|---|---|
| **Resend** | 3000/mo | Cleanest API, dev-friendly |
| **Postmark** | 100/mo trial then paid | Best deliverability for transactional |
| **AWS SES** | 62k/mo if sent from EC2 | Cheap at scale |
| **SendGrid** | 100/day free | Largest, ugly dashboard |

I'll use **Resend** as the example.

1. Sign up at <https://resend.com>.
2. Add your domain → follow their DNS instructions (3-4 records you'll
   add at your registrar) → wait for verification.
3. Create an API key from the dashboard.

### Wire it into the backend

Edit `backend/src/utils/mail.js`. The existing `sendMail` function logs
to stdout — replace it:

```js
import { Resend } from 'resend';
import { logger } from './logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.MAIL_FROM ?? 'Vortex <noreply@yourdomain.com>';

export const sendMail = async ({ to, subject, text }) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('mail.skipped — no RESEND_API_KEY set', { to, subject });
    return { delivered: false };
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
// keep the existing sendVerificationApprovedMail / sendVerificationRejectedMail
// / sendAccessRevokedMail wrappers — they call sendMail under the hood.
```

Add `resend` to backend deps:

```bash
# locally, then commit + push:
cd backend
npm install resend
git add package.json package-lock.json src/utils/mail.js
git commit -m "feat(mail): swap stub for real Resend integration"
git push
```

On the server:

```bash
cd ~/vortex
git pull
nano docker-compose.prod.yml
# Add to backend.environment:
#   RESEND_API_KEY: "re_abc...your_key"
#   MAIL_FROM: "Vortex <noreply@yourdomain.com>"
docker compose -f docker-compose.prod.yml up -d --build backend
```

Test by approving a registration and confirming the user receives a real
email.

---

## 14. Backups

If you used Neon or Supabase, **you already have automatic daily backups**
included free. Visit your provider's dashboard to verify retention period
and download a backup once to make sure the restore path works.

For self-hosted Postgres, set up a daily cron job:

```bash
# Open the crontab editor
crontab -e

# Add this line (runs daily at 03:00 server time)
0 3 * * * docker compose -f /home/deploy/vortex/docker-compose.prod.yml exec -T db pg_dump -U vortex_user vortex_db | gzip > /home/deploy/backups/vortex-$(date +\%F).sql.gz

# Make sure the backup folder exists
mkdir -p /home/deploy/backups
```

Then offsite the backup files (e.g. `rclone copy` to S3 / Backblaze)
weekly. **A backup that lives only on the server it backs up is not a
backup.**

---

## 15. Monitoring & logs

### Logs

```bash
# Tail everything
docker compose -f docker-compose.prod.yml logs -f

# Just one service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines, no follow
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Caddy access log (HTTP requests)
docker compose -f docker-compose.prod.yml exec caddy tail -f /data/access.log
```

### Health check

The backend exposes `/api/health`. Wire that into an uptime monitor:

- **UptimeRobot** (<https://uptimerobot.com>) — free, 5-minute checks
- **BetterStack** — free tier, prettier dashboard

Configure it to ping `https://vortex.yourdomain.com/api/health` every
5 minutes and email/SMS you when it fails.

### Disk usage

Docker can fill the disk over time with old images and build cache:

```bash
df -h                          # check usage
docker system prune -a -f      # delete unused images, networks, build cache
```

Run `prune` monthly or set up a cron.

---

## 16. Deploying updates

When you push code changes, on the server:

```bash
cd ~/vortex
git pull

# Rebuild only what changed
docker compose -f docker-compose.prod.yml up -d --build backend frontend

# If the schema changed:
docker compose -f docker-compose.prod.yml exec backend npx prisma db push

# Tail logs to confirm it came up healthy
docker compose -f docker-compose.prod.yml logs -f backend
```

Total downtime: ~10 seconds while the container restarts. For zero
downtime you'd need a blue/green deploy — out of scope for this guide.

> **Test in a staging environment first** if you have any users. A
> $6 second droplet with a `staging.yourdomain.com` subdomain doubles
> your bill but saves you from breaking production.

---

## 17. Common production problems

### "This site can't be reached" right after first boot

DNS hasn't propagated yet, or Caddy hasn't fetched the cert yet. Wait 5
minutes and check Caddy's logs:

```bash
docker compose -f docker-compose.prod.yml logs caddy
```

Look for `obtained certificate` (good) or `failed to obtain certificate`
(usually a DNS issue — verify with `nslookup`).

### 502 Bad Gateway

The backend is down or unreachable from Caddy. Check:

```bash
docker compose -f docker-compose.prod.yml ps               # is backend running?
docker compose -f docker-compose.prod.yml logs backend     # any crashes?
```

Most common cause: bad `DATABASE_URL` or missing `ACCESS_TOKEN_SECRET`
in the compose file. The backend exits immediately on missing env.

### Backend logs say "User was denied access on the database"

Wrong `DATABASE_URL` — double-check the connection string from your
managed provider, especially the password (special chars need to be
URL-encoded).

### CORS errors in the browser console

Check `CORS_ORIGIN` in the compose file. Must match exactly the URL
shown in the browser address bar — including `https://`, no trailing
slash. Browsers strip default ports, so `https://example.com:443` won't
match what the browser sends (`https://example.com`).

### Logs are filling the disk

Limit Docker log size — add to each service in your compose file:

```yaml
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

Restart the affected service for it to take effect.

### "Site is suddenly slow"

Most likely the database. Check connection counts in the Neon /
Supabase dashboard. Free-tier databases have hard limits (Neon: 100
concurrent). The backend doesn't pool aggressively yet — for >100
concurrent users, configure PgBouncer or upgrade your DB plan.

---

## 18. Cost summary

For a small-to-medium event (up to ~500 students):

| Item | Provider | Monthly |
|---|---|---|
| VPS (1 GB / 1 CPU) | DigitalOcean | $6 |
| Domain | Porkbun (~$12/yr) | ~$1 |
| Database | Neon free tier | $0 |
| Email | Resend free tier (3k/mo) | $0 |
| Uptime monitoring | UptimeRobot free | $0 |
| Backups | Included with Neon | $0 |
| **Total** | | **~$7/mo** |

For a larger event (~5000 users, real load):

| Item | Provider | Monthly |
|---|---|---|
| VPS (4 GB / 2 CPU) | DigitalOcean | $24 |
| Domain | as above | ~$1 |
| Database (Pro) | Neon Pro | $19 |
| Email | Resend Pro (50k/mo) | $20 |
| Uptime monitoring | BetterStack | $0 (free tier) |
| Offsite backups | Backblaze B2 (~5 GB) | $0.03 |
| **Total** | | **~$64/mo** |

---

## Where to go from here

- **Forking the repo** so you can track production tweaks in git
- **Setting up CI/CD** (GitHub Actions → SSH → `git pull && docker compose up -d --build`)
- **Adding a staging environment** so you can test deploys safely
- **Brand the theme** — change colors in `frontend/src/index.css`
  (the CSS custom properties at the top), rebuild the frontend container
- **Customise the registration form** in
  `frontend/src/pages/public/RegistrationPage.jsx`

---

## License

Project is MIT. Deploy responsibly: rotate secrets, keep the OS patched
(`sudo apt update && sudo apt upgrade -y` weekly), and never commit
your production env file to git.
