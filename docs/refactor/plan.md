# POS Awesome Refactor Plan

## Phase 0: Safety + Baseline

- Track refactor decisions and progress in this doc.
- Keep public APIs stable (Vue component names, whitelisted endpoints).
- Use temporary import aliases when moving files to avoid breaking builds.

### Public API Guardrails

- Frontend: keep existing route/component registrations stable while moving internals.
- Backend: preserve whitelisted endpoint signatures; re-export from wrapper modules.

### Progress Log

- 2026-01-24: Initialized refactor tracking document.
- 2026-01-24: Extracted invoice items table section into `InvoiceItemsTableSection`.
- 2026-01-24: Extracted items selector header/settings into `ItemsSearchHeader`.
- 2026-01-24: Extracted items selector footer actions into `ItemsFooterActions`.
