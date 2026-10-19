# Design-system and CI refactor evidence

Base: verified `origin/main` **d8c66910a057f3831c7be16de1e64f49193d07e5**.
The working tree was clean. Branch: `refactor/design-system-ci`.
No intentional visual redesign, merge, release or deployment was performed.

## Measurements

Measurements use git-tracked source, including archived HTML: CSS files plus
embedded style blocks and style attributes, excluding CSS comments. JavaScript
strings containing runtime styles are not counted as HTML style blocks. No CSS
was moved into JavaScript to reduce these numbers. Final new assets were staged
before measurement so they were included.

| Metric | Before | After |
| --- | ---: | ---: |
| HTML pages | 171 | 171 |
| Embedded `<style>` blocks | 105 | 65 |
| `style` attributes | 17 | 15 |
| `!important` declarations | 479 | 454 |
| Full assessment controller implementations | 5 | 1 |
| Identical bank stylesheet copies | 4 | 1 |
| CI checks/suites automatically invoked | 0 | 12 |
| Checked-in workflows | 0 | 1 |

[Baseline inventory](baseline-inventory.json) and [final inventory](final-inventory.json)
list the actual duplicate groups and page families. The removed embedded blocks
were repeated directory skins and 35 Security+/CEH assessment skins. Unique
articles/demos and distinct A+/EC parent skins remain. Repeated lesson-template
styles and three CLI inline render/localization helpers remain deliberate debt.

Palette values moved verbatim into tokens. Redundant light aliases were removed;
their live variables still resolve the active theme. Directory row spacing uses
explicit low-specificity component classes. Five unmigrated numbered hubs retain
scoped priority rules. Most other legacy theme/terminal overrides remain.
See [the actionable component guide](../../DESIGN_SYSTEM.md).

The five controllers existed at relative track asset paths for bank and embedded
Linux pages. Inspection found no track-specific controller logic or local asset
resolution inside the engine. Static references and the Core 1 dynamic loader now
use one canonical shared script; embedded `data-assessment` attributes stay on
that script element. Offline fixture mapping and source/catalog guards were
updated to the canonical path. [Integrity proof](validation.json) records the
unchanged controller body hash, question banks, CLI command data, 17 embedded
assessment configurations and byte-identical generated activity catalog.

## Baseline and local regression

Before application edits, representative baseline checks passed: source,
mobile/connector **14/14**, assessment **21/21**, progress **31/31**. The initial
40 screenshots were captured before refactoring. Additional numbered-hub frames
were subsequently captured from an isolated checkout of the same original main.

Approximate local Windows runtimes (with concurrent screenshot capture):

| Command | Baseline / observed time |
| --- | --- |
| check_source | 21–26 seconds |
| check_learning_catalog | about 2 seconds |
| mobile_accessibility | 49–55 seconds |
| assessment_experience | 258–301 seconds |
| progress_resume | about 171–186 seconds |
| ux_regression | about 106 seconds |
| language_regression | about 68 seconds |
| navigation_directory | about 155 seconds |

These are local observations, not promised GitHub runner times. Raw baseline
timings are in [baseline-tests.json](baseline-tests.json). Final results:

| Check | Final result |
| --- | --- |
| Source | PASS: 171 pages, 187 JS blocks, 3078 references, one controller, no failures |
| Spanish catalog | PASS: 3914 entries, no failures |
| Progress inventory | PASS: unchanged |
| Design contract / CSS syntax / text contrast | PASS |
| Workflow YAML policy / actionlint 1.7.12 | PASS |
| UX regression | 32/32 PASS |
| Language regression | 12/12 PASS |
| Mobile/connector accessibility interactions | 14/14 PASS |
| Navigation / JavaScript-disabled routes | 7/7 PASS |
| Assessment experience | 21/21 PASS |
| Progress/resume | 31/31 PASS |
| Before/after visual comparison | 48/48 PASS |
| Whitespace / source-integrity checks | PASS |

All six existing browser suites ran in real Chromium over local HTTP, using the
production Spanish catalog and blocking external HTTPS. They retain their existing
ordinary-interaction versus controlled clock/state labels. Assessments cover
pre-start, deadlines, answers, flags, review, expiry, scoring and locked/legacy
restore. Progress covers resume URLs, completion, reset and old/malformed stores.
CLI covers drafts, assistance, reload and mobile ordering; connector checks cover
keyboard, focus, native dragging and mouse behavior.

One initial UX run hit its existing five-second controlled-clock startup wait;
the complete rerun passed 32/32 with the same wait/assertions and added request
diagnostics. One progress check attempted to read `state` during the other tab's
reload and threw ReferenceError. Its wait now first requires that the new
document's CLI state exists, retaining the assertion that every progress count is
zero. The complete rerun passed 31/31. No tests or functional assertions were
removed, skipped or disabled. [Validation summary](validation.json).

## Visual comparison

The same harness captures base and head mounted at `/Projects/`, with fixed Date
fixtures, reduced motion, hidden text carets, blocked external resources and the
real local catalog. Four identical before/after combinations cover 320/en/light,
390/es/dark, 768/es/light and 1440/en/dark. Twelve states include every requested
family plus numbered Linux+/CEH hubs. Every document-wide overflow check passed.

An initial comparison caught an actual 32px-versus-48px mobile card padding
difference; the original final cascade's 48px was restored. There are no intentional
visual differences. An untouched-main repeat produced the same one-RGB-level
rounding in three frames (15, 14 and 7 pixels); [raw control](raster-control.json).
The calibrated check accepts only this bounded noise: no dimension change, no
pixel with a channel delta above 1, and no more than 15 changed pixels/frame.
No regions are masked. Synthetic negative checks reject 16 noisy pixels, a
two-level color change, and any dimension change. Raw differences remain in
[before](visual-before.json) and [after](visual-after.json) JSON.

Representative Spanish/dark before/after pairs are committed for review; all 96
full-matrix PNGs remain locally under `test-results/design-system/comparison-*`.

| State | Before | After |
| --- | --- | --- |
| Homepage | [PNG](before/home-390-es-dark.png) | [PNG](after/home-390-es-dark.png) |
| CompTIA hub | [PNG](before/comptia-390-es-dark.png) | [PNG](after/comptia-390-es-dark.png) |
| Assessment start | [PNG](before/assessment-start-390-es-dark.png) | [PNG](after/assessment-start-390-es-dark.png) |
| Active assessment | [PNG](before/assessment-active-390-es-dark.png) | [PNG](after/assessment-active-390-es-dark.png) |
| Assessment result | [PNG](before/assessment-result-390-es-dark.png) | [PNG](after/assessment-result-390-es-dark.png) |
| Linux CLI | [PNG](before/cli-390-es-dark.png) | [PNG](after/cli-390-es-dark.png) |
| Connector lab | [PNG](before/connector-390-es-dark.png) | [PNG](after/connector-390-es-dark.png) |
| Knowledge-base article | [PNG](before/article-390-es-dark.png) | [PNG](after/article-390-es-dark.png) |
| Apps | [PNG](before/apps-390-es-dark.png) | [PNG](after/apps-390-es-dark.png) |
| Progress management | [PNG](before/progress-390-es-dark.png) | [PNG](after/progress-390-es-dark.png) |
| Numbered Linux+ hub | [PNG](before/linux-hub-390-es-dark.png) | [PNG](after/linux-hub-390-es-dark.png) |
| Numbered CEH hub | [PNG](before/ceh-hub-390-es-dark.png) | [PNG](after/ceh-hub-390-es-dark.png) |

## CI and deployed evidence

The workflow has three logical jobs: fast static checks; a six-suite browser
matrix (two concurrent suites); and a same-runner merge-base/head visual job.
There are eight resulting job executions and twelve distinct checks/suites.
Permissions are `contents: read` only. Actions are pinned to official release
commits, checkout credentials are not persisted, pip downloads alone are cached,
and jobs time out after 10/15/20 minutes. Failure-only JSON/PNG/log artifacts last
seven days. There are no release, Pages, deployment, secret or write-permission
steps. GitHub's actual post-push status is reported in the draft PR and handoff,
not assumed from local passes.

The matching d8c66910 Pages build/deployment was verified successful before the
ordinary-clock deployed assessment smoke. That smoke passed; it checks the merged
learning-progress release, not this refactor. [Separate deployed record](deployed-smoke.json).
No separate external Google translation-service assertion was run. CI does not
test external translation availability, public deployment, physical devices or
screen-reader behavior. The optional offline fixture mode was adapted but was not
used as browser evidence. No repository settings, credentials, question banks,
CLI commands, storage identities or published history were changed.
