# Changelog — Phase completion

## 2026-04-21 — Phase completion: deployer-dashboard (Phases 0–6)

- Phase 0: Discovery & API contract — API contract recorded; dev-mode mock fallbacks added.
  - Edited files: docs/api-contracts/deployer-ui-api.json
  - Commit: N/A

- Phase 1: Update types & API client — Types and API wrappers added.
  - Edited files: src/lib/types.ts, src/lib/api.ts
  - Commit: N/A

- Phase 2: Core UI forms & config — Add/Edit forms, registry modal, and App menu actions implemented.
  - Edited files: src/features/apps/AddAppModal.tsx, src/features/apps/EditConfigModal.tsx, src/features/apps/AppMenu.tsx, src/features/apps/AppRegistryModal.tsx
  - Commit: N/A

- Phase 3: Versions view & update flow — Versions modal and deployment progress poll implemented.
  - Edited files: src/features/apps/AppVersionsModal.tsx, src/features/apps/DeploymentProgressInline.tsx
  - Commit: N/A

- Phase 4: CORS & caching UI — CORS controls and Last-Modified metadata surfaced.
  - Edited files: src/features/apps/EditConfigModal.tsx, src/features/apps/AppVersionsModal.tsx
  - Commit: N/A

- Phase 5: Scheduling & self-shutdown UI — Scheduler modal and immediate shutdown actions added.
  - Edited files: src/features/apps/SchedulerModal.tsx, src/features/apps/AppMenu.tsx
  - Commit: N/A

- Phase 6: Tests, docs, and polish — Tests stabilized, README updated, test timeouts adjusted.
  - Edited files: src/__tests__/deploymentProgress.test.ts, src/features/apps/__tests__/appMenu.smoke.test.tsx, README.md, package.json
  - Commit: N/A

---

Notes and next steps:
- All planned phases are marked ✅ 🔒 in `PHASEPLAN.md` and archived in `docs/PHASE_HISTORY.md`.
- Remaining TODOs: add integration tests for the scheduler and wire `postUpdate` confirmation flows.
