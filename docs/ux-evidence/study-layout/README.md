# Structured study layout

Feature branch: `feat/structured-study-layout`. Local implementation only; no merge,
push, deployment, or release. The branch was created from `feat/noir-jazz-theme`
with existing uncommitted noir work preserved. Baselines capture that actual
starting working tree, not `main`.

## Scope decision

| Page family | Treatment |
| --- | --- |
| A+ Core 1 and Core 2 study modules | Full study shell; existing lesson controllers retained, including nested Core 1 sections |
| Security+ study modules | Full study shell; existing lesson controllers retained |
| CEH study modules | Full study shell; stacked articles become individual navigable lessons |
| Linux+ study modules | Full study shell; sections become individual lessons; original module links remain in the overview |
| Active assessments, assessment entry/result shells | Keep focused assessment layout and existing question navigation, flags, timers, scoring, persistence and confirmation dialogs |
| Linux, Windows and macOS CLI labs | Keep their existing three-part scenario/terminal/task workspace and responsive ordering; no duplicate study rails |
| Connector lab | Keep interactive matching workspace; link to it from the hardware module |
| Course hubs, homepage, progress dashboard, library/reference articles, apps/utilities | Keep browsing/reference/task layouts and existing shared theme language |

The full migration manifest is [migrated-pages.json](migrated-pages.json): 67
modules, 200 lesson panels. Opt-in is explicit in each supported page rather than
automatic on every page with educational text.

## Shared components

`assets/study-layout.css` owns the shell, rails, section cards, comparison pairs,
scrollable tables, focus treatment and responsive layout. It uses existing theme
tokens, including noir. Small overrides bridge legacy important declarations;
unrelated page styles are unchanged by this stylesheet.

`assets/study-layout.js` enhances original DOM nodes rather than cloning lesson
content. Existing CompTIA controllers still own lesson selection. A small shared
adapter supplies selection for static CEH articles and Linux sections. If JS is
unavailable, source markup retains the original readable page and navigation.

The left rail includes course navigation, module context, position, numbered
lessons and original previous/next controls. Desktop scrolls only the lesson list
inside the rail, keeping navigation controls visible. The center prioritizes the
current lesson title/intro, groups content into cards, pairs short comparisons and
separates tips/tables. The right rail contains section links, facts excerpted from
the current lesson, position and existing quiz/lab/saved-activity links.

New reading-place memory uses only a bounded lesson index in
`projects-study-place:v1:<normalized path>`. It does not mark lessons complete or
change assessment/CLI progress. Position is explicitly labeled as position, not
certification completion. Quiz links use existing destinations; no flashcard
feature is invented. Review key takeaways links to the lesson summary/tip.

Desktop (1100px and wider) uses three columns. Tablet uses content/helper columns
with collapsible lesson navigation below; helper cards flow normally to avoid
overlap. At 760px and below the order is content, collapsible lesson navigation,
then helpers. No fixed three-column mobile layout. Keyboard focus, native details,
semantic navigation, current-step attributes and real fragment links are retained.

`tests/build_study_layout.py` is an idempotent migration tool. It discovers known
study templates, adds relative shared-asset URLs and verified existing quiz/course/
lab destinations, and generates the manifest without rewriting page structures.

## Screenshots

Captures use real Chromium/local HTTP mounted at `/Projects/`, external HTTPS
blocked, identical viewport/font availability before and after. Each family has
1672/en/light, 1440/en/dark, 1440/en/noir, 768/es/light, 390/es/dark and
320/en/light captures. Baseline and result JSON list every file.

| Family | Before | After |
| --- | --- | --- |
| A+ Core 1 | [Desktop](before/a-core1-1672-en-light.png) | [Desktop](after/a-core1-1672-en-light.png) |
| A+ Core 2 | [Desktop](before/a-core2-1672-en-light.png) | [Desktop](after/a-core2-1672-en-light.png) |
| Security+ | [Desktop](before/security-1672-en-light.png) | [Desktop](after/security-1672-en-light.png) |
| CEH | [Desktop](before/ceh-1672-en-light.png) | [Desktop](after/ceh-1672-en-light.png) |
| Linux+ | [Desktop](before/linux-1672-en-light.png) | [Desktop](after/linux-1672-en-light.png) |
| A+ mobile | [390px](before/a-core1-390-es-dark.png) | [390px](after/a-core1-390-es-dark.png) |
| A+ noir | [1440px](before/a-core1-1440-en-noir.png) | [1440px](after/a-core1-1440-en-noir.png) |

## Validation and limits

Run `tests/study_layout.py --output docs/ux-evidence/study-layout/after` for the
30-state matrix and all-module smoke sweep. It checks actual lesson clicks,
current-step state, previous/next boundaries, fragment targets, reload/place
restoration, keyboard focus, runtime errors and document overflow. The sweep
visits all 67 modules and checks one visible lesson and last-lesson boundaries.
`--before` captures baseline pages; `--case` isolates a representative family.

Existing regression suites are recorded under `test-results/study-layout/`:
assessment/CLI UX, progress/resume, and language behavior. Static checks cover CSS
syntax, JavaScript syntax, local asset/link references and the learning catalog.

| Validation | Result |
| --- | --- |
| Existing assessment/CLI UX suite | 32/32 passed |
| Existing progress/resume suite | 31/31 passed |
| Existing language suite (local catalog, external HTTPS blocked) | 12/12 passed |
| Representative study matrix | 30 states; navigation, reload, focus, overflow, runtime checks and title contrast of at least 4.5:1 |
| Migration sweep | 67 modules / 200 lessons; one visible lesson and working last-lesson boundary |
| Fallback checks | CEH readable with JS disabled; lesson navigation works with browser storage denied |
| Static checks | CSS/design system passed; 188 JavaScript blocks and 3,220 local references passed; learning catalog passed; diff whitespace check passed |

Machine-readable study results are in [after/results.json](after/results.json) and
[after/inventory-check.json](after/inventory-check.json). Noir retains its existing
paper lesson surfaces so locally scoped dark text has a matching background.

Limits: no physical-device or screen-reader certification; no external translation
service verification. New shell labels have local Spanish translations; lesson
prose retains existing language coverage and explicit English fallback where a
local translation is unavailable. Key facts are excerpts, not newly authored
instructional summaries. Some genuinely long individual lessons still scroll.
Assessment and CLI workspaces intentionally retain their current structures.
Reading place is browser-local and independent of the activity-clearing feature.
Legacy pages with scripting disabled retain their original layout rather than the
enhanced rails. This work does not add account synchronization or flashcards.
