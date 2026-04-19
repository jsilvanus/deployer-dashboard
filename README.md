# deployer-dashboard

A simple SPA dashboard for managing Deployer instances (apps, deployments, metrics).

Prerequisites
-------------

- Node.js 16+ (Node 18+ recommended)
- npm, pnpm or yarn

Quick start (development)
-------------------------

Install dependencies and run the dev server:

```
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Build / preview
---------------

```
npm run build
npm run preview
```

Run tests
---------

```
npm run test
```

Environment variables
---------------------

Build-time env vars use the `VITE_` prefix (Vite inlines them at build time).
See [.env.example](.env.example) for the variables we expect. Create a local `.env.local`
for machine-specific overrides (do not commit local files).

Example `.env.example`:

```
VITE_DEFAULT_DEPLOYER_URL=https://example.com
```

Adding deployer targets
-----------------------

Preferred: use the UI. Click the header → "Targets" → "Add target" and enter the deployer
base URL and the `ADMIN_TOKEN` (token is stored in `sessionStorage` only).

Manual (for testing / debugging): open the browser console and add entries directly.

- Save the list of targets (persisted state):

```js
localStorage.setItem('deployer:targets', JSON.stringify({
	deployers: [
		{
			id: 'local1',
			label: 'Local Deployer',
			baseURL: 'http://localhost:9000',
			lastSeen: new Date().toISOString(),
			isDefault: true
		}
	],
	active: 'local1'
}))
```

- Set the admin token (kept in sessionStorage so it does not survive closing the tab):

```js
sessionStorage.setItem('deployer:token:local1', 'YOUR_ADMIN_TOKEN_HERE')
```

- For compatibility with some test helpers and parts of the code, you can also set the active
	base URL directly:

```js
localStorage.setItem('deployer:active', JSON.stringify({ baseURL: 'http://localhost:9000' }))
```

Notes:
- Target metadata (IDs, labels, base URLs, lastSeen, active id) are persisted to
	`localStorage` under `deployer:targets`.
- Admin tokens are stored in `sessionStorage` under `deployer:token:<id>` and are intentionally
	kept out of `localStorage` for safety.

Troubleshooting
---------------

1) CORS errors when connecting to the deployer

Symptoms: browser console shows errors like `Access to fetch at 'http://...' from origin 'http://localhost:5173' has been blocked by CORS policy`.

Cause: the deployer server must allow requests from the dashboard origin. The dashboard runs on
the dev server (typically `http://localhost:5173`) or the deployed dashboard origin.

Fixes:

- Configure the deployer to send the appropriate CORS headers. For quick local testing you can
	allow the local dev origin. Example (Express):

```js
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type')
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
	next()
})
```

- If you are using `EventSource` for streaming logs, note that custom headers (e.g. `Authorization`)
	are not supported by `EventSource`. The client adds the token as a query parameter when needed
	(e.g. `?token=...`), so ensure your server accepts the token from the query string for SSE endpoints.

2) Self-update appears to fail / dashboard shows "restart required"

The self-update endpoint (`POST /setup/self-update`) requests the deployer process to restart.
This can make the server briefly unreachable. If self-update fails:

- Check the deployer process logs for errors during restart.
- Ensure the deployer process has permissions to write files and restart itself (service manager, systemd unit, container lifecycle).
- If automatic restart fails, perform a manual restart of the deployer host/service and re-run the self-update via the UI.

Where to get help
-----------------

If you see unexpected behaviour, open an issue with reproduction steps and any relevant browser console logs.
Contributions are welcome — see CONTRIBUTING.md for the preferred workflow.

---

Recent additions (phases 0–5)
-----------------------------

- New app types: `npm`, `pypi`, `image` (in addition to existing `node`, `python`, `docker`, `compose`).
- Per-app registry support and a registry credential test flow (`AppRegistryModal`).
- CORS controls per-app (toggle + allowed origins) in the Edit Config modal.
- Versions modal (`AppVersionsModal`) to view upstream and historical versions, with a "Refresh upstream metadata" action and an "Update to latest" action.
- Scheduler UI to configure cron-like schedules and an immediate "Shutdown now" action.

Developer tips
--------------

- To develop the UI without a running deployer, enable dev-mode mocks in the browser console:

```js
localStorage.setItem('deployer:useDevMocks', '1')
```

With that flag set, the typed API wrappers in `src/lib/api.ts` return lightweight mock responses for versions, scheduling, shutdown and registry tests.


