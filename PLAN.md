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

The design bundle ships **4 wireframe variants** as exploration. The user picked **Variant 3 — "Terminal / dense table"** as the primary direction. Monospace-forward, table-like rows, dark header that nods to the CLI roots. Visual DNA we inherit:

- Warm orange accent: `oklch(0.65 0.18 40)` — used as offset-shadow color on dark-header buttons and for "updating" highlights
- Paper: `#fafaf7` with subtle radial-gradient grain; zebra-striping via `paper-2` on alternate rows
- Ink: `#1a1a1a` header fill, `#3a3a3a`/`#7a7a7a` secondaries
- Fonts: JetBrains Mono is dominant (names, meta, chart heads, buttons). Caveat stays for the logo and a few script flourishes. Kalam / hand font is dropped for v3 — everything functional is mono.
- Offset shadows (`2px 2px 0 var(--accent)` on dark buttons, `1px 1px 0 ink` on row buttons), 1.5px ink borders, 12px radii, dashed `ink-3` row separators
- Pills shrink to 9–11px uppercase monograms: `RUN` / `UPD 4/7` / `FAIL` / `STOP`
- Three sparkline tiles per row: status-over-24h, CPU-1h, memory-1h — tight, 1px ink-3 border, 24px svg height

Per the bundle README: recreate the visual output, don't port the prototype's structure.

### Primary layout (v3 — dense table)
```
┌─ Header (dark) ──────────────────────────────────────────────────────┐
│ [$] deployer v0.4.1 · 8 apps · 1 updating   [Target ▾] [+add] [⟳]   │
└──────────────────────────────────────────────────────────────────────┘
┌─ System metrics strip ──────────────────────────────────────────────┐
│ host cpu │ host mem │ host disk │ running │ updating │ failed │ up  │
│  ▂▃▅▇▆▄   ▁▂▂▃▃▃▄    64% / 1TB   6         1          1        22d │
└──────────────────────────────────────────────────────────────────────┘
┌─ Apps table ─────────────────────────────────────────────────────────┐
│ APP · TYPE              │ STATUS 24H │ CPU 1H    │ MEM 1H   │  ⋯   │
├──────────────────────────────────────────────────────────────────────┤
│ api-gateway  RUN        │ ▇▇▇▇▇▇▇▇▇▇ │ ▁▂▃▂▁▂▃▂  │ ▂▂▃▃▃▄  │  ⋯   │
│ node · pm2 · main@3f9a… │ 99.2%      │ 12%       │ 284 MB   │      │
│ [stop] [update] [logs]  │            │           │          │      │
├──────────────────────────────────────────────────────────────────────┤
│ postgres  RUN           │ ▇▇▇▇▇▇▇▇▇▇ │ ▁▁▂▁▁▁    │ ▂▂▂▂▂▂  │  ⋯   │
│ ... zebra-striped odd ...                                            │
└──────────────────────────────────────────────────────────────────────┘
[＋ register new app]  (dashed placeholder, matching dense style)
```

Per-app metrics live **only** on the right of each row (status-24h / CPU-1h / memory-1h). The new **system metrics strip** sits between the header and the apps table — it shows deployer-host-level numbers, not per-app.

The **3-dot menu** opens: edit config · env vars · rollback last deploy · deployment history · run migrations · copy API key · delete.

### System metrics strip (new)

A horizontal bar of small tiles, same sparkline style as per-app tiles, showing **deployer-host-level** numbers. Source: `GET /metrics` (Prometheus exposition — we parse it client-side for host gauges) with a client-computed overlay from the app list.

Tiles (left to right):
1. **host cpu** — 1h sparkline + current %
2. **host memory** — 1h sparkline + used/total
3. **host disk** — free-space % (static number, no sparkline if no series available)
4. **apps running** — count, green
5. **apps updating** — count, accent
6. **apps failed** — count, red
7. **deployer uptime** — `up 22d`

If the deployer's `/metrics` endpoint doesn't expose a given host gauge, the tile gracefully collapses to `—`. The app-count tiles are always available (derived from `GET /apps` + `/status`). This strip is the only place host-level metrics appear; per-app rows stay focused on their own app.

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
    MetricTile.tsx            # shared tile used by system strip + app rows
  features/
    header/
      DeployerSelector.tsx    # switch/add/remove targets (multi-target)
      AddDeployerModal.tsx    # URL + token
      ManageTargetsModal.tsx  # list all targets, rename, delete, set default
    system/
      SystemMetricsStrip.tsx  # host cpu/mem/disk + app counts + uptime
      prometheus.ts           # tiny text-format parser for /metrics
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
| Target selector (add/switch/remove, multi-target) | `GET /health` for ping-check; each target stored client-side |
| System metrics strip (host cpu/mem/disk, app counts, uptime) | `GET /metrics` (parsed Prometheus) + `GET /apps` + `GET /apps/:id/status` aggregated client-side |
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
| Raw Prometheus exposition | "view raw" link in system strip overflow menu |

### Helpers (the "UI helpers" the user called out)
- **Type-aware add-app form**: switches fields per app type; pre-fills plausible defaults; validates `allowedDeployPaths` before submit.
- **Env vars editor**: multi-row key/value, paste `KEY=VALUE` block to bulk-import, detect duplicates, mask secrets by default.
- **Deployment step viewer**: renders the reversible plan ("git-clone → env-setup → db-create → migration-up → pm2-start → nginx-configure") with current step highlighted in accent.
- **Bytes / % / uptime formatters**: `284 MB`, `1.2 GB`, `up 4d 12h`, `avg 12% · max 38%`.
- **Live refresh indicator**: small "⟳ 3s" timer on each metric tile that flips to accent while fetching.
- **Error toasts with retry**: network or 4xx/5xx from API surfaces as a sketchy pill toast.
- **Target switcher shortcut**: `⌘K` / `Ctrl+K` to jump between saved deployer targets.

---

## 6. Data flow

- **Targets (multi-deployer)**: list persisted in `localStorage` as `[{ id, label, baseURL, lastSeen, isDefault }]` plus `activeTargetId`. Tokens stored in `sessionStorage` by default (opt-in to `localStorage` with a "remember this target" checkbox). The API client reads the active target's baseURL + token on every request. Switching targets invalidates all TanStack queries and re-pings `GET /health`.
- **App list**: `useQuery(['apps'])` refetch every 10s.
- **Per-app status**: `useQuery(['status', id])` refetch every 3s while the row is visible (use `IntersectionObserver`).
- **Per-app metrics**: `useQuery(['metrics', id])` refetch every 30s (matches server sample rate).
- **System metrics strip**: `useQuery(['prometheus'])` refetch every 15s; parse the text payload into `{ cpu, mem, disk, uptime }`. App counts derive reactively from the existing `['apps']` + per-row `['status']` caches — no extra request.
- **In-flight deployments**: when a mutation returns `202 { deploymentId }`, start polling `GET /deployments/:id` at 1s until terminal state; surface live step in the "updating…" row.
- **Logs**: historical fetch on drawer open; if user toggles "tail", open `EventSource` on `/logs/stream` and append.

---

## 7. Build / delivery order

1. **Scaffold** Vite+React+TS, Tailwind, theme tokens in `index.css`, font imports (JetBrains Mono primary, Caveat for logo).
2. **UI primitives** — `Button`, `Pill` (compact monogram variant), `Menu`, `Modal`, `Drawer`, `Sparkline`, `StatusStrip`, `AreaChart`, `MetricTile`. Match v3 visuals exactly (dark header, accent-offset shadows, dashed row separators, zebra stripes).
3. **API client + types** — one `api.ts` with methods for every endpoint; typed from CLAUDE.md. Active target's baseURL + token injected from Zustand.
4. **Target manager** — selector in header, add-target modal (URL + token + health-check), manage-targets modal (rename/delete/default), `⌘K` switcher.
5. **System metrics strip** — `prometheus.ts` parser + `SystemMetricsStrip` component wired to `/metrics`, app counts derived from caches.
6. **Apps table + AppRow** (read-only first) — `GET /apps` + `GET /status` + `GET /metrics` wired up. Dense table layout, mono everywhere, zebra stripes.
7. **Card actions** — update / rollback / logs (drawer).
8. **3-dot menu** — full set of modals/drawers (edit config, env vars, history, migrations, delete, copy key).
9. **Add app modal** — type-aware form.
10. **Live deployment progress** — inline on the row while a deploy is in flight (`UPD 4/7` pill counts up in real time).
11. **Setup menu** — Traefik / self-register / self-update.
12. **Polish pass** — empty states, error states, loading skeletons, hover interactions (accent offset-shadow nudge).
13. **README** — how to run, how to enable CORS on the deployer, how to add targets.

Variants 1/2/4 are not planned; theme tokens and primitives are reusable if we ever want to add a density toggle later.

---

## 8. Decisions & remaining assumptions

**Locked in (from user):**
- **Primary variant = v3 Terminal / dense table.** Mono-forward, dark header, table layout.
- **Multi-target support = yes.** List of saved deployer targets, switch/add/remove, `⌘K` quick-switcher.
- **System metrics at the top; per-app metrics only on the right of each row.**

**Still assumed (flag if wrong):**
- **Token storage.** Default to `sessionStorage`; opt-in to `localStorage` per target via a "remember" checkbox. Tokens never leave the browser.
- **CORS.** The deployer must allow the dashboard origin. We'll call this out in the README but not ship a proxy.
- **Start vs. deploy.** The deployer API has `deploy` (first run) and `update` (subsequent). "Start" on a stopped app routes to `update` or `deploy` depending on whether the app has a successful deployment; we'll detect and label the button accordingly.
- **Self-update.** Gated behind a confirmation, since it can take the deployer offline briefly.
- **Host metrics source.** We'll parse `/metrics` (Prometheus exposition) for host cpu/mem/disk gauges. If deployer's `/metrics` doesn't expose host-level gauges (only per-app), the system strip falls back to app-aggregated totals + `—` for absent host numbers.

If any of the above should change, flag before implementation step 1.
