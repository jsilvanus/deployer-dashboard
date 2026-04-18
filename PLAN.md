# Deployer Dashboard — Implementation Plan

A single-page web app that connects to a [`@jsilvanus/deployer`](https://github.com/jsilvanus/deployer) API instance and exposes every feature of its REST API through a UI. Design direction comes from the Claude Design handoff bundle (`Dashboard Wireframes.html`, 4 low-fi variants).

---

## 1. What Deployer is (recap)

Self-hosted deployment orchestrator. REST API + MCP server. Manages Node (PM2), Python (PM2), Docker (compose-from-repo), and Compose (inline YAML) apps. Every deploy step is snapshotted for reversible rollback. SQLite + encrypted env backups. Admin bearer token or per-app API keys.

### API surface we must cover

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Apps | `GET /apps`, `POST /apps`, `GET/PATCH/DELETE /apps/:id` |
| Deploy ops | `POST /apps/:id/deploy`, `/update`, `/rollback`, `/migrations/run` |
| Deployments | `GET /apps/:id/deployments`, `GET /deployments/:id` |
| Status | `GET /apps/:id/status` (CPU/mem/uptime, live) |
| Logs | `GET /apps/:id/logs`, `GET /apps/:id/logs/stream` (SSE) |
| Metrics | `GET /apps/:id/metrics` (30s samples, 7d retention) |
| Env | `GET /apps/:id/env`, `PUT /apps/:id/env`, `DELETE /apps/:id/env` |
| Setup | `POST /setup/traefik`, `/setup/self-register`, `/setup/self-update` |
| Prometheus | `GET /metrics` (non-UI, just a link) |

---

## 2. Design direction (from the handoff)

The design bundle ships **4 wireframe variants** as exploration. The user's original spec in the chat maps cleanly onto **Variant 1 — "Classic list"**, so that's our primary direction. The distinctive visual DNA is shared across all variants:

- Warm orange accent: `oklch(0.65 0.18 40)`
- Paper: `#fafaf7` with subtle radial-gradient grain
- Ink: `#1a1a1a`, secondary `#3a3a3a`/`#7a7a7a`
- Fonts: Kalam (hand, body) · Caveat (script, display) · JetBrains Mono (meta/mono)
- Offset shadows (`2px 2px 0 ink`), 1.5px ink borders, 10–14px radii, dashed separators
- Pills for status: `running` (green) · `updating` (orange) · `failed` (red) · `stopped` (paper-2)
- Three sparkline tiles per row: status-over-24h, CPU-1h, memory-1h

Per the bundle README: recreate the visual output, don't port the prototype's structure.

### Primary layout (from v1)
```
┌─ Header ─────────────────────────────────────────────────────┐
│ [D] deployer · connected  [Deployer selector ▾] [+ add] [⟳]  │
└──────────────────────────────────────────────────────────────┘
┌─ App row ────────────────────────────────────────────────────┐
│ ┌ Card ───────────┐ ┌ 3 metric charts ─────────┐ ┌ ⋯ menu ┐ │
│ │ name + pill     │ │ status24h │ cpu1h │ mem1h│ │        │ │
│ │ meta line       │ └──────────────────────────┘ └────────┘ │
│ │ [stop][upd][log]│                                          │
│ └─────────────────┘                                          │
└──────────────────────────────────────────────────────────────┘
... repeat per app ...
[＋ register new app]  (dashed placeholder)
```

The **3-dot menu** opens: edit config · env vars · rollback last deploy · deployment history · run migrations · copy API key · delete.

---

## 3. Tech stack

- **Vite + React + TypeScript** — standard SPA, fast HMR
- **TanStack Query** — server-state caching, polling, SSE-friendly
- **Zustand** — small local store for "which deployer am I connected to" and UI state
- **Tailwind** — utilities, *plus* a custom CSS layer that defines the sketchy theme tokens (so JSX stays clean but we keep the offset-shadow / hand-drawn feel)
- **React Router** — one route per shell (modals for detail views keep it single-page feeling)
- **Raw SVG sparklines** — the wireframes already use viewBox-normalized SVG; we'll build a tiny `<Sparkline>` / `<StatusStrip>` / `<AreaChart>` trio instead of pulling in Recharts
- **Fetch wrapper** — one module that holds `baseURL + bearer token`, throws typed errors, and supports SSE for log streams

No backend. The app runs entirely in the browser and talks to the deployer directly (CORS must be enabled on the deployer — note this as a doc requirement).

---

## 4. File layout

```
src/
  main.tsx
  App.tsx                     # router + providers
  index.css                   # theme tokens, global typography
  lib/
    api.ts                    # typed fetch client, SSE helper
    types.ts                  # App, Deployment, Metrics, EnvVar, Status, …
    format.ts                 # uptime, bytes, percent
  stores/
    deployers.ts              # { deployers: Conn[], active: id } (localStorage)
  hooks/
    useApps.ts                # list + mutations
    useAppStatus.ts           # polling /status
    useAppMetrics.ts          # /metrics
    useAppLogs.ts             # SSE stream
    useDeployment.ts          # poll /deployments/:id
  components/
    ui/                       # Button, Pill, Menu, Modal, Input, Toast, Card
    Sparkline.tsx
    StatusStrip.tsx           # 24h status-over-time bar
    AreaChart.tsx
  features/
    header/
      DeployerSelector.tsx    # switch between connected deployers
      AddDeployerModal.tsx    # URL + token
    apps/
      AppList.tsx
      AppRow.tsx              # card + metrics + dots
      AppActions.tsx          # start/stop/update/logs
      AppMenu.tsx             # 3-dot popout
      AddAppModal.tsx         # register new app (all 4 types)
      EditConfigModal.tsx     # PATCH /apps/:id
      EnvVarsDrawer.tsx       # GET/PUT/DELETE /apps/:id/env
      LogsDrawer.tsx          # historical + SSE stream
      DeploymentHistoryModal.tsx
      DeploymentProgressInline.tsx  # live poll for in-flight deploys
      RollbackConfirm.tsx
      MigrationsModal.tsx
      DeleteAppConfirm.tsx
    setup/
      TraefikSetupModal.tsx
      SelfUpdateModal.tsx
index.html
```

---

## 5. Feature → API mapping

Everything the API exposes gets a UI. Nothing is behind "coming soon".

| UI surface | Endpoint(s) |
|---|---|
| Deployer selector (add/switch/remove) | `GET /health` for ping-check; connection stored client-side |
| App list (cards + metrics + dots) | `GET /apps`, `GET /apps/:id/status` (polled), `GET /apps/:id/metrics` |
| Add app modal | `POST /apps` (fields branch by type: node / python / docker / compose) |
| Card "update" button | `POST /apps/:id/update` → inline progress via `GET /deployments/:id` |
| Card "start/stop" | `POST /apps/:id/deploy` (first run) or status-driven restart |
| Card "logs" | Drawer: initial `GET /apps/:id/logs` + SSE `/logs/stream` tail toggle |
| Menu · edit config | `PATCH /apps/:id` |
| Menu · env vars | `GET/PUT/DELETE /apps/:id/env` (encrypted — show key names, mask values, reveal on click) |
| Menu · rollback | `POST /apps/:id/rollback` + confirm + progress |
| Menu · deployment history | `GET /apps/:id/deployments` (table with status, commit, step) |
| Menu · run migrations | `POST /apps/:id/migrations/run` (up/down picker) |
| Menu · copy API key | shown once at registration; "regenerate" via PATCH if supported |
| Menu · delete | `DELETE /apps/:id` + typed-confirm |
| Global setup menu | `POST /setup/traefik`, `/setup/self-register`, `/setup/self-update` |
| Header metric (`GET /metrics`) | link-out only (Prometheus text is not UI-friendly) |

### Helpers (the "UI helpers" the user called out)
- **Type-aware add-app form**: switches fields per app type; pre-fills plausible defaults; validates `allowedDeployPaths` before submit.
- **Env vars editor**: multi-row key/value, paste `KEY=VALUE` block to bulk-import, detect duplicates, mask secrets by default.
- **Deployment step viewer**: renders the reversible plan ("git-clone → env-setup → db-create → migration-up → pm2-start → nginx-configure") with current step highlighted in accent.
- **Bytes / % / uptime formatters**: `284 MB`, `1.2 GB`, `up 4d 12h`, `avg 12% · max 38%`.
- **Live refresh indicator**: small "⟳ 3s" timer on each metric tile that flips to accent while fetching.
- **Error toasts with retry**: network or 4xx/5xx from API surfaces as a sketchy pill toast.

---

## 6. Data flow

- **Connections**: persisted in `localStorage` as `{ id, label, baseURL, tokenHash (sessionStorage only for token itself), lastSeen }`. Switching the active connection invalidates all TanStack queries.
- **App list**: `useQuery(['apps'])` refetch every 10s.
- **Per-app status**: `useQuery(['status', id])` refetch every 3s while the row is visible (use `IntersectionObserver`).
- **Per-app metrics**: `useQuery(['metrics', id])` refetch every 30s (matches server sample rate).
- **In-flight deployments**: when a mutation returns `202 { deploymentId }`, start polling `GET /deployments/:id` at 1s until terminal state; surface live step in the "updating…" row.
- **Logs**: historical fetch on drawer open; if user toggles "tail", open `EventSource` on `/logs/stream` and append.

---

## 7. Build / delivery order

1. **Scaffold** Vite+React+TS, Tailwind, theme tokens in `index.css`, font imports.
2. **UI primitives** — `Button`, `Pill`, `Menu`, `Modal`, `Drawer`, `Card`, `Sparkline`, `StatusStrip`, `AreaChart`. Match wireframe visuals exactly (shadows, dashed borders, font pairings).
3. **API client + types** — one `api.ts` with methods for every endpoint; typed from CLAUDE.md. Active-deployer + token injected from Zustand.
4. **Deployer selector + Add deployer modal** — health-check on save.
5. **App list + AppRow** (read-only first) — `GET /apps` + `GET /status` + `GET /metrics` wired up, with the 3-chart layout.
6. **Card actions** — update / rollback / logs (drawer).
7. **3-dot menu** — full set of modals/drawers (edit config, env vars, history, migrations, delete, copy key).
8. **Add app modal** — type-aware form.
9. **Live deployment progress** — inline on the row while a deploy is in flight.
10. **Setup menu** — Traefik / self-register / self-update.
11. **Polish pass** — empty states, error states, loading skeletons, 4px offset-shadow hover interactions from the wireframe.
12. **README** — how to run, how to enable CORS on the deployer, how to add a connection.

Variants 2–4 are left as a follow-up: the theme tokens and primitives are shared, so switching to "metrics-forward" or "terminal" is mostly a layout swap in `AppRow.tsx`. We'll stub a density toggle in the header to make that trivially addable.

---

## 8. Open questions / assumptions

- **Primary variant = v1 Classic list.** The chat transcript and the original user spec describe this layout; v2–v4 are noted as optional follow-ups.
- **Connection model.** Assuming multiple deployers are worth supporting (the selector implies it). Tokens kept in `sessionStorage` only; users re-enter on new session unless they opt into `localStorage`.
- **CORS.** The deployer must allow the dashboard origin. We'll call this out in the README but not ship a proxy.
- **Start vs. deploy.** The deployer API has `deploy` (first run) and `update` (subsequent). "Start" on a stopped app routes to `update` or `deploy` depending on whether the app has a successful deployment; we'll detect and label the button accordingly.
- **Self-update.** Gated behind a confirmation, since it can take the deployer offline briefly.

If any of these should change, flag before implementation step 1.
