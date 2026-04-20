# Phase Risks — deployer-dashboard

Extracted from `PHASEPLAN.md` Risk Register (2026-04-21)

1. Backend API mismatch or missing endpoints
   - Status: mitigated (dev-mode mocks & API contract created)
   - Mitigation: use dev-mode mocks and fail-fast checks; verify backend before merging.

2. Handling and storing registry credentials insecurely
   - Status: open
   - Mitigation: avoid persistent plaintext storage in the UI; prefer server-side secure storage and document recommended flows.

3. CORS failures during front-end development
   - Status: mitigated
   - Mitigation: clear error messages, use proxying and dev-mode mocks for testing.

4. Timezone/cron complexity for scheduling
   - Status: open
   - Mitigation: provide a simple time-picker, an advanced cron field, and validate server-side.

5. UX complexity/surface area growth
   - Status: open
   - Mitigation: implement incremental feature toggles; keep modals focused and add help text.
