Branching & Pull Requests
-------------------------

We welcome contributions. Keep changes small and focused.

- Create a branch named `feature/short-description` or `fix/short-description`.
- Open a Pull Request targeting `main`.
- Use a descriptive title and include a short summary of the change and reasoning.
- If the change affects behavior, add or update tests in `src/__tests__`.
- Run the test suite locally before opening the PR:

```bash
npm install
npm run test
```

Commit message
--------------

Use conventional-style messages, for example:

```
docs: README + CONTRIBUTING - run instructions, add targets, CORS troubleshooting
feat: add quick-switcher (⌘K) for targets
fix: handle missing token in SSE stream
```

Review
------

PRs will be reviewed on `main`. Address review comments and squash/rebase as requested.
