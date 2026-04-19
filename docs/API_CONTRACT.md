Phase 0 → Phase 1 API contract assumptions and notes

This document records assumptions made while drafting the minimal API contract
used by the UI during Phase 0 and the initial typed API client in Phase 1.

1) Endpoint paths
- GET /apps/{appId}/versions -> returns array of AppVersion
- GET /apps/{appId}/versions/{versionId} -> returns single AppVersion
- POST /apps/{appId}/schedule -> accepts ScheduleConfig; returns ServerResponse
- POST /apps/{appId}/shutdown -> triggers immediate shutdown; returns ServerResponse
- POST /apps/{appId}/registry/test -> accepts { registryUrl, credentials } and returns ServerResponse

These paths are assumptions based on PHASEPLAN.md; if the backend uses different
paths (e.g., /apps/{id}/version or /apps/{id}/registry/test-connection) the UI
wrappers should be updated accordingly.

2) Schedule format
- UI will send a cron expression in `cron` and a `timezone` string. Server is
expected to validate and store the canonical schedule; server may return
`nextRun` for display.

3) Registry auth
- `RegistryAuth` is a minimal union-like shape supporting token or basic auth.
- UI MUST NOT store plaintext credentials permanently; prefer server-side
  storage or short-lived tokens.

4) CORS and Last-Modified
- `cors` is a simple object with `enabled` and `allowedOrigins` array. Server
  may provide finer-grained controls; UI should treat this as an editable list.
- `lastModified` is an ISO timestamp string set by the server; UI uses this
  to display cache metadata and optionally trigger revalidation.

5) Dev-mode mocks
- The client API wrappers added in `src/lib/api.ts` will fall back to
  lightweight, in-memory mock responses when `localStorage['deployer:useDevMocks']`
  is set to `1`. This allows frontend development without a running backend.

6) Server responses
- Many endpoints may return an HTTP 204 (no content) on success; wrappers
  accept either empty responses or a JSON `{ ok: boolean, message?: string }`.

If any of these assumptions are incorrect, please point out the canonical
endpoint names and shapes and I will update `docs/api-contracts/deployer-ui-api.json`
and the typed wrappers in `src/lib/api.ts` accordingly.
