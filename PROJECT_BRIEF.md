# RubricKit

## User and problem
Educators designing a small assignment need a transparent scoring rubric and a
readable feedback sheet without setting up accounts or uploading learner work.
RubricKit makes criterion weights explicit, keeps incomplete scores distinct from
zero, and provides a portable local backup.

## Scope and stack
Three pages: rubric builder, score a sample, feedback report. Plain HTML/CSS and
JavaScript modules; browser localStorage; Node built-in tests and static build.
No runtime dependencies, accounts, AI, external data, analytics or backend.
One rubric and one sample per browser origin. Use anonymous sample labels, not
sensitive learner records. Synthetic demonstration: a community garden pitch.

Skills: frontend product design, accessible forms, data validation, weighted
arithmetic, local persistence, browser testing, documentation and CI.

## Acceptance criteria
- [x] Create, edit, reorder and remove 1–12 criteria with integer weights 1–100.
- [x] Require a total weight of exactly 100 before scoring or reporting a total.
- [x] Use four fixed levels, 0–3; show formula and criterion contributions.
- [x] Treat unscored criteria as incomplete, never silently as zero.
- [x] Save rubric and anonymous sample locally; survive navigation and reload.
- [x] Prevent stale tabs from silently overwriting newer saved work; handle unavailable/corrupt storage.
- [x] Safely export/import a versioned, bounded JSON backup; confirm replacement.
- [x] Include a deliberate synthetic demo, meaningful empty/error states, and print feedback.
- [x] Clear navigation, matching favicon, keyboard controls and usable 320px layout.
- [x] Relevant unit/browser tests, lint and production build pass; document limitations and screenshots.

## Design decisions and boundaries
Weights total 100; weighted percent = sum(weight × level / 3). Only the displayed
total rounds to one decimal place. No grade bands or automated academic decisions.
Changing criterion semantics clears its old score/feedback; reordering retains it.
Rubric edits are explicit saves. No cross-device sync, roster, multiple submissions,
rich text, institution-specific grading, attachments, or hosted launch in this PR.
The public GitHub PR is the delivery artifact; portfolio entry follows user merge.

## Milestones
See MILESTONES.md. Bootstrap main only; all implementation on feat/rubrickit.
