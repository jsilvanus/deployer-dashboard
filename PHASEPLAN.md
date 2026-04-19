# Phase Plan: UI integration for new deployer features

## Overview
This plan covers adding UI support for newly-introduced deployer backend features: npm/pypi/python/image app types, per-app registry URL & credentials, CORS support, Last-Modified HTTP caching metadata/actions, an apps/:appId/version view, and self-shutdown / scheduling controls. 7 phases are proposed; the critical path runs through discovery → API client & types → core UI forms → versions view → scheduling. Major constraints: confirm backend endpoints/field names first, avoid storing credentials insecurely, and handle CORS/test flows early.

## Dependency Map
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

## Phase 0: Discovery & API contract ✅ 🔒
**Mode:** Sequential
**Depends on:** none
**Goal:** Agree API surface and data model used by the UI (field names/types and endpoints).

### Sequential steps
- [x] Inventory backend endpoints and any existing PHASEPLAN.md to discover supported endpoints (e.g., `/apps/:id/versions`, `/apps/:id/versions/{versionId}`, `/apps/:id/schedule`, `/apps/:id/shutdown`, `/apps/:id/registry/test`) — confirmed in `src/lib/api.ts` and `docs/api-contracts/deployer-ui-api.json`.
- [x] Draft a minimal API contract JSON describing changes to `App` (new fields: `registryUrl`, `registryAuth`, `cors`, `lastModified`, `schedule`) and endpoint shapes — see `docs/api-contracts/deployer-ui-api.json`.
- [x] Add lightweight mock responses or feature flags in the UI for missing endpoints so front-end work can proceed offline — `src/lib/api.ts` includes dev-mode fallbacks via `localStorage['deployer:useDevMocks']`.

**Sync point:** API contract reviewed and accepted; dev-mode mocks verified in `src/lib/api.ts`.

---

## Phase 1: Update types & API client
**Mode:** Sequential
**Depends on:** Phase 0
**Goal:** Update front-end types and API wrappers to reflect agreed contract.

### Sequential steps
1. Update `src/lib/types.ts` to extend `App` with new fields (example additions below). — ensures TypeScript safety across UI.
2. Add API wrappers to `src/lib/api.ts`: `getAppVersions(appId)`, `getAppVersion(appId)`, `postAppSchedule(appId, body)`, `postAppShutdown(appId)`, `postAppRegistryTest(appId, body)`, and optional cache-related endpoints. — centralizes requests.
3. Add error-handling expectations for CORS/401s and add comments referencing backend contract.

**Files:** [src/lib/types.ts](src/lib/types.ts), [src/lib/api.ts](src/lib/api.ts)

**Sync point:** `getApp()` and `getApps()` include new fields; new helpers compile and have mock responses.

---

## Phase 2: Core UI forms & config (Parallel: 3 streams)
**Mode:** Parallel (3 streams)
**Depends on:** Phase 1
**Goal:** Add UI to register and edit the new app types and per-app registry/cors/cache settings.

Run these simultaneously (max 3):

**Stream A — Add/update app types**
- Extend `AddAppModal` to include options for `npm`, `pypi`, `python`, `image` (in addition to existing types).
- Add fields per type (e.g., package name and version constraint for npm/pypi; image for image/docker; entry for python/node).
- Submit body must include the new fields (registryUrl, packageName, etc.).
- Tests: ensure form validation per type.

**Stream B — Registry & credentials UI**
- Extend `EditConfigModal` (or create a new `AppRegistryModal`) to set `registryUrl` and credentials (support token or basic). Provide "test credentials" action that calls `postAppRegistryTest` and surface result.
- Secure UX: hide credential values by default, require reveal action, offer ephemeral token storage and guidance in UI.

**Stream C — AppMenu integration & new modals**
- Add new actions to `AppMenu`: `Versions` (open versions modal), `Scheduler` (open scheduling modal), `Cache` (view/invalidate), `Registry` (open registry modal).
- Implement `AppVersionsModal` and `SchedulerModal` components (drawer/modals following existing patterns in `EnvVarsDrawer` and modals).

**Files to edit/create:** [src/features/apps/AddAppModal.tsx](src/features/apps/AddAppModal.tsx), [src/features/apps/EditConfigModal.tsx](src/features/apps/EditConfigModal.tsx), [src/features/apps/AppMenu.tsx](src/features/apps/AppMenu.tsx), new components under `src/features/apps/` (e.g., `AppVersionsModal.tsx`, `SchedulerModal.tsx`, `AppRegistryModal.tsx`).

**Sync point:** All forms compile, can save/patch new fields via `patchApp`, registry test works, and menu shows new actions.

---

## Phase 3: Versions view & update flow
**Mode:** Sequential
**Depends on:** Phase 1, Phase 2
**Goal:** Provide a UI to view current app version and latest upstream version and to trigger updates.

### Sequential steps
1. Implement `AppVersionsModal` to call `getAppVersions(appId)` (or `/apps/:id/version`) and display: current version, latest upstream, changelog/notes if provided.
2. Add an "Update to latest" / "Pin version" action that calls existing update/deploy endpoints (e.g., POST `/apps/:id/update` or `/apps/:id/deploy` with parameters). — must be guarded with confirmation.
3. Integrate the modal into `AppMenu` and optionally wire a route `/apps/:appId/version` by updating history (optional, prefer modal first).

**Sync point:** User can view upstream versions and trigger an update; actions show progress using existing `DeploymentProgressInline`.

---

## Phase 4: CORS & Last-Modified caching UI
**Mode:** Parallel (2 streams)
**Depends on:** Phase 1
**Goal:** Expose CORS config, show Last-Modified cache metadata and allow manual invalidation.

**Stream A — CORS**
- Add small CORS controls in `EditConfigModal` to set allowed origins or toggle CORS behavior.
- Surface helpful troubleshooting text when add deployer requests fail with CORS (map existing AddDeployerModal error handling pattern).

**Stream B — Last-Modified / caching**
- Display caching headers/last-modified metadata in `AppVersionsModal` or App details. Add a "Refresh upstream metadata" button.
- Add a "Purge cache / Revalidate" action calling a new endpoint if backend supports it.

**Sync point:** CORS and cache controls editable and actions return meaningful server responses.

---

## Phase 5: Scheduling & self-shutdown UI
**Mode:** Sequential
**Depends on:** Phase 1, Phase 2
**Goal:** Allow users to schedule self-shutdown/restarts and ad-hoc shutdowns from the UI.

### Sequential steps
1. Implement `SchedulerModal` to show existing schedule, allow cron-like configuration, timezone selection, and enable/disable toggles.
2. Add immediate "Shutdown now" / "Restart now" actions in `AppMenu` or `EditConfigModal` that call `postAppShutdown(appId)` (or a dedicated endpoint).
3. Provide safety checks: confirmation, description of effects, and display next scheduled run.

**Sync point:** Schedules are persisted and the UI shows next run; immediate shutdown calls return expected responses.

---

## Phase 6: Tests, docs, and polish
**Mode:** Parallel (up to 3 streams)
**Depends on:** all previous phases
**Goal:** Add unit + integration tests, update README/PLAN.md, and finalize UX polish.

### Parallel streams
**A — Tests**: Add/extend tests under `src/features/apps/__tests__` and `src/__tests__` for new modals and API client mocks.
**B — Docs**: Update `PLAN.md` / README with new UI features and admin guidance for registry credentials and CORS.
**C — Accessibility & UX polish**: keyboard access for new modals, copy-to-clipboard for tokens, help text for credential handling.

**Sync point:** Test suite passes locally for changed components; docs updated.

---

## Critical Path
Phase 0 → Phase 1 → Phase 2 (core forms + registry) → Phase 3 (versions) → Phase 5 (scheduling) → Phase 6

## Risk Register
- Backend API mismatch or missing endpoints → Mitigation: fail-fast in Phase 0 and create mocks.
- Handling and storing registry credentials insecurely → Mitigation: avoid persistent plaintext storage in UI; prefer server-side-secure storage flow and show guidance in UI.
- CORS failures during front-end development → Mitigation: provide clear error messages and use mock server + proxying for dev.
- Timezone/cron complexity for scheduling → Mitigation: provide simple time-picker + an "advanced" cron field and validate server-side.
- UX complexity/surface area growth → Mitigation: implement incremental feature toggles and keep modals focused; add help text.

## Recommended Starting Point
1. Run the quick audit from Phase 0: confirm endpoints and draft the API contract. Check [src/lib/types.ts](src/lib/types.ts) and [src/lib/api.ts](src/lib/api.ts) for where to add types/wrappers.
2. Implement Phase 1 (types + API client) first — it unlocks safe, typed UI changes.
3. Start Phase 2 using three parallel streams (form changes, registry modal, menu & new modals).

---

## Quick file map (where to change/add)
- Update types/API: [src/lib/types.ts](src/lib/types.ts), [src/lib/api.ts](src/lib/api.ts)
- Add/update forms: [src/features/apps/AddAppModal.tsx](src/features/apps/AddAppModal.tsx), [src/features/apps/EditConfigModal.tsx](src/features/apps/EditConfigModal.tsx)
- Menu & integrations: [src/features/apps/AppMenu.tsx](src/features/apps/AppMenu.tsx), [src/features/apps/AppRow.tsx](src/features/apps/AppRow.tsx), [src/features/apps/AppList.tsx](src/features/apps/AppList.tsx)
- New components (create): [src/features/apps/AppVersionsModal.tsx](src/features/apps/AppVersionsModal.tsx), [src/features/apps/SchedulerModal.tsx](src/features/apps/SchedulerModal.tsx), [src/features/apps/AppRegistryModal.tsx](src/features/apps/AppRegistryModal.tsx)

---

## Next practical steps I can take now (pick one):
- Finalize API contract and propose exact TypeScript shape for `App` and the new endpoints (I can draft a patch for `src/lib/types.ts` and `src/lib/api.ts`).
- Scaffold `AppVersionsModal` + basic `getAppVersions()` wrapper and wire a menu action (I can create the new component and a small API mock).
