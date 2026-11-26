# PageTurner

PageTurner is a full-stack online bookstore built with React and Express. Browse a novel catalogue, save books to a wishlist, leave reviews, and place test-mode orders. Administrators can manage the catalogue, orders, and inventory.

## Features

- Responsive home page, searchable/filterable catalogue, and book detail pages.
- Dynamic book-type filters from the catalog, plus stable low-to-high and high-to-low price sorting.
- Account registration and sign-in using bcrypt-hashed passwords and JWT authentication.
- Forgot-password recovery with single-use, expiring reset links (local links in development; email delivery through Resend when configured).
- Local cart, personal wishlist, reviews, and order history.
- Stripe-hosted Checkout in test mode. The server verifies payment before saving an order or reducing inventory.
- Admin-only dashboard, book CRUD, order status updates, and local book-cover uploads.
- API input validation, CORS allowlisting, request rate limits, Helmet security headers, and structured API errors.
- MongoDB-backed catalog with a 30-novel seed script.

## Screenshots

Screenshots are not included yet. Add reviewed, non-sensitive screenshots to `docs/screenshots/` and link them here:

| Page | Screenshot |
|---|---|
| Storefront home | `docs/screenshots/home.png` |
| Book catalogue | `docs/screenshots/books.png` |
| Book detail | `docs/screenshots/book-detail.png` |
| Admin dashboard | `docs/screenshots/admin-dashboard.png` |

Do not include real customer data, payment information, access tokens, or secrets in screenshots.

## Tech stack

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, Context API, Axios, plain CSS |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Authentication | JWT, bcryptjs |
| Payments | Stripe Checkout (test mode) |
| Cover images | Multer and local filesystem (`server/uploads/`) |
| API middleware | Helmet, CORS, express-rate-limit, Morgan, Multer |

## Project layout

```text
client/       React/Vite storefront and admin UI
server/       Express API, MongoDB models, routes, controllers, seed script
README.md     Setup and deployment guide
```

The root package manifest provides convenience scripts. Install dependencies separately in `server/` and `client/`; run the backend and frontend in separate terminals.

## Local setup

### Requirements

- Node.js 20.19+ or 22.12+ and npm (Vite's supported Node versions).
- A MongoDB Atlas database, or a local MongoDB replica set for order/review transactions.
- A Stripe account with a test-mode secret key.

### 1. Configure the backend

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and set:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/pageturner?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-secret>
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
CLIENT_URL=http://127.0.0.1:5173
STRIPE_SECRET_KEY=sk_test_<your-test-secret>
UPLOAD_DIR=uploads
RESEND_API_KEY=<your-Resend-API-key>
RESET_EMAIL_FROM=PageTurner <passwords@your-verified-domain.example>
```

In local development, password reset requests show a one-time reset link on the page when no email service is configured. For deployed environments, configure `RESEND_API_KEY` and `RESET_EMAIL_FROM` with a verified sender in Resend so reset links are emailed. Reset links expire after 15 minutes and can only be used once.

Keep `.env` private. Never commit it, put secrets in frontend variables, or share live credentials in screenshots. `server/.env.example` contains placeholders only.

Book covers accept JPG/JPEG, PNG, and WEBP files up to 5 MB. New uploads are stored in `server/uploads/` by default and served from `/uploads/<filename>`. Existing HTTPS image URLs remain supported.

Generate a random JWT secret with Node:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The API requires `JWT_SECRET` to be at least 32 bytes. Use a newly generated secret for each environment.

Use the MongoDB Atlas connection string from **Connect → Drivers**. URL-encode special characters in the database user's password. Make sure the Atlas network access list permits the machine running the API.

Start the API:

```powershell
npm run dev
```

The health endpoint is `http://localhost:5000/api/health`.

### 2. Seed the novel catalogue (optional)

With the backend environment configured and MongoDB reachable:

```powershell
cd server
npm run seed
```

The script removes only records with the old sample ISBN prefix `978-1-55501-`, then upserts the 30 novel records by ISBN. It does not create demo users. See the seed-script comments and inspect the target database before running it on a database containing non-demo book records.

### 3. Start the frontend

In another terminal:

```powershell
cd client
npm install
npm run dev
```

Open `http://127.0.0.1:5173` (or `http://localhost:5173`). Vite proxies `/api` requests to `http://localhost:5000`. Build the production frontend with `npm run build`.
For frontend environment overrides, copy `client/.env.example` to `client/.env`; local development does not need an API URL because Vite uses the proxy.

From the repository root, the equivalent convenience commands are `npm run dev:server`, `npm run dev:client`, `npm run build`, `npm start`, and `npm run seed`. Install the backend and frontend dependencies in their own folders first.

## Demo login credentials

**No demo account is provisioned by this repository.** Register a user through the website to try customer features. Registration always creates a regular user; it cannot assign administrator privileges.

To grant administrator access for a private demo, register your own account, then use MongoDB Atlas **Browse Collections → users** to update only that account's `role` field to `admin`. Do not publish the account password or use this process on an untrusted production account. There is no shared admin password in source control.

## Stripe test payment

Set a valid Stripe **test-mode** secret key in the backend `STRIPE_SECRET_KEY`. Checkout redirects to Stripe-hosted payment; card details are not collected by this app.

Use Stripe's standard test card `4242 4242 4242 4242`, any future expiry date, and any CVC. Use a test-mode key only. A successful redirect is verified by the backend before an order is created.

## Deployment

Deploy the backend and frontend as separate services. Replace all example values with your own service URLs and secret values. Never prefix backend secrets with `VITE_`—Vite variables are included in browser code.

### A. MongoDB Atlas

1. Create a MongoDB Atlas project and cluster.
2. Create a dedicated database user with a strong, unique password. Grant only the database permissions required by this application.
3. Under **Network Access**, allow the backend service to connect. Render outbound IPs may vary by plan/region; if a fixed outbound IP is unavailable, Atlas may require `0.0.0.0/0`. Use a strong database password and least-privilege database user if enabling that rule.
4. Copy the application connection string from **Connect → Drivers**. Replace the username, password, and host; URL-encode password characters. Include the `pageturner` database name.
5. Keep the URI private and configure it only in Render's environment variables.

See MongoDB's official [Atlas IP access list guide](https://www.mongodb.com/docs/atlas/security/ip-access-list/) and [connection troubleshooting guide](https://www.mongodb.com/docs/atlas/troubleshoot-connection/) if the API cannot connect.

### B. Render backend

1. Create a **Web Service** from the repository.
2. Set **Root Directory** to `server`.
3. Choose the Node runtime. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add these environment variables in Render (do not add them to source control):

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | Atlas connection string for the `pageturner` database |
   | `JWT_SECRET` | New random secret generated for production |
   | `JWT_EXPIRES_IN` | `1d` (or your chosen token lifetime) |
   | `CORS_ORIGIN` | Exact Vercel site origin, e.g. `https://your-store.vercel.app` |
   | `CLIENT_URL` | Exact Vercel site URL, e.g. `https://your-store.vercel.app` |
   | `STRIPE_SECRET_KEY` | Stripe test key beginning `sk_test_` |
   | `UPLOAD_DIR` | Optional upload directory; defaults to `server/uploads/` locally |
   | `RESEND_API_KEY` | Resend API key for password reset emails |
   | `RESET_EMAIL_FROM` | Sender address verified in Resend, e.g. `PageTurner <passwords@your-domain.com>` |

   Render supplies `PORT`; the server reads it automatically. `CORS_ORIGIN` accepts a comma-separated list of exact origins (scheme and host only, no path). Production startup fails if it is missing. To keep uploaded covers across deploys, attach a Render persistent disk and set `UPLOAD_DIR` to its mount path (for example, `/var/data/book-covers`). Without persistent storage, local files may be lost when a service is replaced or restarted.

5. Deploy and wait for the service to become healthy. Verify `https://<render-service>.onrender.com/api/health`.
6. If needed, run the seed script from a trusted local environment pointed at Atlas. Do not run it on a database until you have checked which old sample records match its deletion prefix.

Render's official [monorepo guide](https://render.com/docs/monorepo-support) explains how root directories affect build and start commands.

Rate limits are per IP and per running API instance (the default in-memory store): 300 API requests per 15 minutes, 10 authentication requests per 15 minutes, and 20 cover uploads per 15 minutes. Morgan logs request method, status, and duration only; it does not log request bodies or authorization headers. Render proxy headers are trusted in production so client IP limits can work. If you scale the API across multiple instances, configure a shared rate-limit store.

### C. Vercel frontend

1. Import the same repository into Vercel as a separate project.
2. Set **Root Directory** to `client`.
3. Use **Build Command** `npm run build` and **Output Directory** `dist`. The included `client/vercel.json` sends client-side routes back to the SPA entry point and adds browser security headers.
4. Set this environment variable for Production (and Preview only if you intend preview sites to call the API):

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<render-service>.onrender.com/api` |
   | `VITE_ENABLE_DEMO_CATALOG` | Optional; set to `true` only when sample catalog cards should appear after an API failure. Preview titles are browse-only and cannot be purchased. |

5. Deploy. Add the final Vercel domain to Render's `CORS_ORIGIN` and set `CLIENT_URL` to that exact frontend URL. Redeploy the backend after changing these values.
6. If you change `VITE_API_URL`, rebuild/redeploy the frontend because Vite embeds it at build time.

See Vercel's official [project configuration guide](https://vercel.com/docs/project-configuration) for root directory, build, output, rewrite, and header settings.

### D. Production smoke test

1. Check the frontend loads and public books are returned by the Render API.
2. Register a customer, sign in, save/remove a wishlist item, and inspect profile/orders pages.
3. For an admin, use a separately controlled account whose database role is `admin`; verify dashboard, book CRUD, upload, and order status update.
4. Complete a Stripe test payment and verify exactly one paid order is created and stock is reduced once.
5. Confirm an unapproved origin is blocked by CORS and an anonymous request cannot access admin endpoints.

## Security notes

- The API enforces admin authorization server-side; hiding admin UI in React is not the security boundary.
- Authentication tokens are currently stored in browser `localStorage`. This is convenient for this portfolio project but can be exposed by a successful same-origin XSS; for a production service handling sensitive data, migrate to secure, HttpOnly cookies with CSRF protection.
- Use only test-mode Stripe keys until you have completed a production payment review.
- Do not commit credentials, user data, build artifacts, or database exports.
