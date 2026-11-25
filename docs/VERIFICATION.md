# Verification — 2026-11-25

## Local results

Windows, Node 24.22.1, Microsoft Edge through Playwright 1.65.1:

| Command | Result |
| --- | --- |
| `node --test tests/*.test.js` | 10 pass, 0 fail, 0 skipped |
| `node scripts/lint.mjs` | Pass, 16 files (JS syntax and static HTML checks) |
| `node scripts/build.mjs` | Pass, exactly 9 public assets |
| `node scripts/check-build.mjs` | 9 HTTP 200 assets; missing/development files HTTP 404 |
| `node node_modules/@playwright/test/cli.js test` | 11 pass, 0 fail |
| `node scripts/capture.mjs` | Four synthetic-data screenshots captured |
| `git diff --check` | Pass |

Browser tests exercise real pages served from `dist/`: create a rubric, save a
zero score, reload, produce feedback, invoke print, edit/invalidate one score,
reorder/remove, import/export, malformed JSON, stale tabs, corrupt storage,
unsaved navigation and HTML-like text. All three pages checked at 1280, 390, 320px.
Quota/unavailable storage and import bounds are tested at the model/storage layer.

Visual review: desktop builder, feedback, 390px scoring and print-media screenshot.
Added mobile shortcuts after review. Linux CI initially exposed a 320px overflow;
navigation and heading rows now wrap to accommodate different system fonts.
A form control named `id` also revealed a form-property collision; the event
handler now reads the actual HTML ID attribute, with the main journey as regression coverage.

The print button is tested through a stub and print CSS is visually inspected.
Physical printing and paginated PDF output are not verified. Safari, Firefox,
screen-reader testing and formal accessibility auditing are outside this run.

## Reproduce

Follow README setup; run `npm run build` before browser tests/screenshots.
Screenshot generation uses a fresh browser context and only the original
synthetic fixture from `demo.js`. It starts and stops its own local server.
GitHub Actions provides independent Linux/Chromium verification on every PR push.
Consult the PR checks for results tied to the exact reviewed commit.

Implementation commit `6a2f2ca920c8067f2e5722033167d1a0a7f2143d` passed both
[push CI](https://github.com/Gillmasija/rubrickit/actions/runs/45632683018) and
[PR CI](https://github.com/Gillmasija/rubrickit/actions/runs/45632693962).
These runs include all 10 unit tests and 11 browser tests, including the Linux
320px layout regression. GitGuardian also passed.
