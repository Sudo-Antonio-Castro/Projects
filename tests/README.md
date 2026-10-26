# UX recovery checks

## Simplified learning navigation

`python tests/build_study_navigation.py --check` validates generated metadata and
Spanish navigation/title coverage. `tests/learning_navigation.py --output PATH`
checks five lesson families at 320/390/768/1024/1440 in all three themes and both
languages, including history, current lesson, prev/next, real course selection,
resume, original deep links and no-JS navigation. Before/after captures cover all
five course hubs as well. Use `--before --site-root BASE --output BEFORE`, then
`--baseline BEFORE --output AFTER` to prove all 200 source lesson subtrees and
inline controllers unchanged. Navigation visuals intentionally change; 40
unaffected site states retain strict pixel comparison. See the
[evidence report](../docs/ux-evidence/simplified-learning-navigation/README.md).
CI runs the full interaction matrix as its seventh browser suite. The separate
visual job uses `--capture-only` with a base checkout for the 72 screenshot pairs
and unchanged-lesson proof, then runs the study sweep. Coverage is retained while
avoiding one long job exhausting its budget after slow dependency installation.

## Study layout cleanup

`python -X utf8 tests/check_study_cleanup.py` guards shared study assets, template
opt-ins, the unique content exception, malformed declarations and copied chrome
or controllers. It uses only static requirements.

```sh
python -X utf8 tests/study_cleanup.py --output test-results/study-cleanup/before
# After editing on the same machine/browser:
python -X utf8 tests/study_cleanup.py --output test-results/study-cleanup/after --baseline test-results/study-cleanup/before
```

`--site-root PATH` supports an isolated base checkout. `--inventory-only` records
source metrics without a browser. Bytes use UTF-8/LF across checkouts. The 126
visual states cover six representatives, all themes and 320/390/768/1024/1440, plus
desktop/mobile no-JS fallbacks. The existing pixel comparator is unchanged.
Body fingerprints guard lesson text, markup, links, headings, IDs and handlers,
ignoring scripts and whitespace-only nodes. Script extraction is reviewed
separately. See [cleanup evidence](../docs/ux-evidence/study-layout-cleanup/README.md).

## Structured study layout

`python -X utf8 tests/study_layout.py --output docs/ux-evidence/study-layout/after`
checks five representative study families at six viewport/language/theme states,
then sweeps all 67 migrated modules. It exercises lesson navigation, fragment
targets, place restoration, focus and overflow using real Chromium/local HTTP.
Use `--before` for baseline captures and `--case ceh` to isolate one family.
See [scope, screenshots and limits](../docs/ux-evidence/study-layout/README.md).

## Design-system and CI checks

The complete local commands, component contract, compatibility boundaries and
non-deploying workflow are in [the design-system guide](../docs/DESIGN_SYSTEM.md).
Static CI installs `tests/requirements-static.txt`; browser/visual CI installs
`tests/requirements.txt` and Chromium. It runs all six existing browser suites,
five static/catalog/contract checks and a same-runner merge-base/head visual suite.

```sh
python -X utf8 tests/check_design_system.py
python -X utf8 tests/check_ci.py
python -X utf8 tests/design_inventory.py --output test-results/inventory.json
python -X utf8 tests/design_visual.py --output test-results/visual-before
# After editing, on the same browser/OS/font environment:
python -X utf8 tests/design_visual.py --output test-results/visual-after --baseline test-results/visual-before
```

`--site-root PATH` can capture an isolated base checkout. Visual evidence uses
fixed Date fixtures and real `/Projects/` local HTTP, checks overflow, and retains
raw pixel differences. Only the measured one-level RGB rounding in at most 15
pixels/frame is accepted; dimensions and larger changes fail. No screenshot
region is masked. Screenshots are not portable goldens across OS/browser changes.
CI uploads test JSON/PNG/logs on failure for seven days; it does not deploy or run
external translation checks. See the evidence report for baseline runtimes.

## Local learning progress and resume

```sh
python -X utf8 tests/build_progress_catalog.py --check
python -X utf8 tests/progress_resume.py
```

The progress suite uses real Chromium/local HTTP and the production Spanish
catalog with external HTTPS blocked. It tests new browsers, pre-start/active/
expired/submitted assessments, flags and partial answers, query versions,
independent/revealed CLI steps, drafts, reload and cross-tab boundaries, legacy
storage, malformed/future metadata, deterministic ordering, coordinated clearing,
and 320/390/768/1440 layouts in English/Spanish and light/dark themes. Keyboard
resume and visible focus are checked; CSS-disabled progress remains readable.
Controlled clock/storage fixtures are labeled in results and are separate from
ordinary interaction checks. This is not a screen-reader or physical-device test.

Results and matrix screenshots: `test-results/progress/`. The independent deployed
smoke script, `tests/progress_release_smoke.py`, uses the deployed Pages URL, an
ordinary clock, external resources allowed, and no injected state or translator.
It is not proof that the feature branch has deployed. External general-page
translation-service tests remain separate from local Spanish-catalog coverage.

`assets/learning-activities.js` is generated from actual assessment entry points
(including the two Core 1 final versions) and the three CLI labs. Regenerate with
`python tests/build_progress_catalog.py` when adding/removing activities.
Track denominators count assessments, not certification completion; CLI scenario
counts are separate from the count of full platform labs.

`projects-learning-progress` in localStorage has `{version:1, activities:{...}}`.
Stable repository path/version IDs key small entries containing started/completed/
expired flags, counts, the most recent raw correct/total result, and one last
meaningful-interaction timestamp. Reload, timer ticks and language changes do not
advance recency. Counts/locations are read from authoritative state whenever it
is available. No answers, deadlines, question banks, terminal histories, tracking
IDs or translated identity text are copied into the summary.

Existing assessment sessionStorage and CLI progress-v2 localStorage formats and
keys remain authoritative. Old records need no eager rewrite: hubs read existing
state with deterministic ID ordering until a meaningful interaction records
recency. Missing/bad summary entries normalize safely; unknown summary versions
are preserved without writes. CLI legacy assistance remains unknown. The
connector lab has no saved activity state and gets no invented completion.

Assessments can resume/review only when the current tab has their existing
session record. Other tabs can see a local summary/result with an original-tab
notice; they cannot reconstruct answers or start a replacement deadline from it.
An expired dashboard link opens the existing controller to grade; the dashboard
does not grade or write the deadline. Closing a tab may remove its locked review.
There is no account, cloud synchronization, progress transmission or analytics.

The dedicated `/progress/` surface confirms clearing one/all activities and
removes summary plus underlying CLI/current-tab assessment state. An origin-local
storage notification asks other open activity tabs to clear their own assessment
records and reload without checkpoint resurrection. Language/theme preferences
are kept. Clear failures show a status; a storage-policy failure can prevent
complete clearing. View-only dismissal of the homepage card deletes no progress.

`projects-learning-reset-revisions` is a separate version-1 localStorage map of
assessment IDs to integer reset revisions. Only explicit destructive clearing
advances a revision; it stores no timestamps. The controller's optional
`progressRevision` field prevents a retained pre-clear session from returning
after a tab navigates back. Reading pages also receive the local clear signal.
Malformed/unknown revision metadata is ignored rather than invalidating answers.

The website remains a static site. Test dependencies are development-only.

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/check_source.py
python tests/ux_regression.py
```

`CHROMIUM_PATH` can select an already installed Chromium executable. The default
browser test command serves the actual site locally. Remote HTTPS resources are
blocked deliberately; it does not test Google Translate's network service.

For an environment that prohibits browser URL navigation:

```sh
python tests/ux_regression.py --offline --output test-results
```

Offline mode embeds local assets and supplies simulated storage, origin paths,
reload requests and dynamic script loading. It exercises the real application
handlers and markup, but is not evidence of actual navigation, translation,
cookie behavior or cross-page persistence in a deployed browser. Clock advancement,
storage-denial injection and programmatic answer population are test inputs.

The initial recovery was validated in offline mode. Subsequent UX changes use
the default real local-HTTP suites and keep per-run results under test-results.
Run the documented suites before merging each change. An external translation
service smoke check must be reported separately from local-catalog validation.

The suite records `regression-results.json`, incremental `checkpoint.json`, and
mobile screenshots in the requested output directory. The incremental checkpoint
preserves completed results when a long browser run is interrupted.

## Spanish learning text

`assets/learning-es.json` stores translations independently of question IDs,
answer values and assessment signatures. CLI tasks/hints and shared interface
strings were translated and reviewed directly. Quiz prose was obtained using
Google Translate in a real browser, translating complete sentences, with
coverage, number, technical-literal and untranslated-prose checks plus targeted
semantic review. An independent bilingual review of every quiz sentence has not
been performed. English question banks and scoring rules remain the source of
truth. When that English source changes, add/review the new catalog entry; a
missing entry displays English with an explicit notice.

```sh
python -X utf8 tests/check_learning_catalog.py
python -X utf8 tests/language_regression.py
python -X utf8 tests/language_regression.py --external --mock-startup
```

These are real Chromium/local-HTTP runs. The default language suite blocks
external translation resources and uses the actual local catalog. `--external`
adds a separately labeled Google-service smoke check. `--mock-startup` adds a
separately labeled delayed, startup-only fake translator; it is not external
service evidence. Results include exact visible task, hint, question, explanation,
timer and result text. Tests cover all 116 CLI tasks, language round trips without
losing in-progress input, real reloads, saved deadlines/submissions, catalog
failure, delayed catalog responses and the existing assessment suite.

Learning text changes language in place; the general page translator remains an
external service. Its status notice does not claim that every page sentence has
been translated. Local learning translations currently cover English/Spanish;
other selected languages receive an explicit English-learning fallback notice.

## Mobile and accessibility interactions

```sh
python -X utf8 tests/mobile_accessibility.py
```

This uses real Chromium over local HTTP with external resources blocked and the
production Spanish catalog. It completes a connector scenario using only Tab,
Enter and Space, checks selected/disabled states, retained focus and live-region
results, and exercises actual native dragging, mouse matching and wrong-match
feedback. It checks CLI DOM/visual order at 320, 390, 768 and 1440 pixels, resize
focus and input selection, independently entered versus revealed steps, localized
reset confirmations, cancelled resets and accepted resets. Genuine reloads must
restore progress, outcomes and unfinished command input.

CLI storage retains the existing progress-v2 key. The added outcomes/drafts fields
are optional when loading earlier saved data. Previously completed steps with no
recorded assistance history are labeled as previous-version completions, not as
independently completed steps. Reveal still advances the task, and is explicitly
labeled as assisted completion. Responsive reordering moves existing panel nodes;
it does not re-create terminal inputs or translate command/output strings.

ARIA semantics and keyboard behavior are tested in Chromium; this does not replace
an NVDA, VoiceOver or TalkBack session. Before/after layout captures and deployed
language-release checks are recorded separately under test-results/mobile. They
identify their origin and whether external translation resources were allowed.

## Navigation and application directories

```sh
python -X utf8 tests/navigation_directory.py
```

This checks static global and breadcrumb destinations across the published HTML
pages, consistent labels/order and local Spanish coverage.
Real Chromium over local HTTP checks root/index homepage aliases,
nested active sections, visible English/Spanish text, exam-version query links,
JavaScript-disabled navigation, empty directory availability, and keyboard focus
at 320, 390, 768 and 1440 pixels in both themes. External HTTPS is blocked;
these checks use the actual local catalog, not a mocked translator. Archived
`Old*` pages are excluded from the navigation scope.

Before/after captures and the separate deployed-release smoke report are under
`test-results/navigation/`. Directory status is based on the repository contents
and GitHub releases inspected when the change was prepared; update those statuses
when tools or releases are published.

## Assessment-taking experience and timing policy

```sh
python -X utf8 tests/assessment_experience.py
```

New timed attempts show the existing assessment title/version, question count,
configured duration, scoring model/pass mark and timing instructions before Start.
Their deadline is null until the native Start assessment button is activated.
After starting, wall-clock time continues during navigation away, reloads,
language changes and submission review. Expiry automatically submits exactly once.
Configured durations and scoring rules are unchanged. This policy and start screen
do not establish accessibility compliance; timing accommodations require a
separate assessment of the content, purpose and applicable accessibility needs.

The full question list remains available, with a collapsible overview, answered
status, independent review flags and filters. Overview navigation focuses the
question's first enabled answer; locked reviews focus the question group. Only
explicit question navigation updates the restored position. Language changes
update text in place without moving focus. Manual submission opens a native modal
dialog with counts and a running timer; Return or Escape cancels it. Answers lock
after confirmation or expiry. Flags never affect scoring.

Storage remains per-tab sessionStorage at the existing projects-assessment:v1
key, isolated by path and version. The content/scoring signature is unchanged.
The optional started, flags and lastQuestionId fields are UI metadata: old active
records retain their original deadlines, old expired records auto-submit, and old
submitted records reopen locked. Missing/invalid UI metadata is normalized without
discarding valid answers. Malformed or incompatible core records produce a notice
and remain stored until the user starts or changes the replacement attempt. A
storage failure produces a separate warning; the open page can still be used in
memory, but cannot promise reload persistence. There is no new account or sync.

The assessment-experience suite uses real Chromium over local HTTP with external
HTTPS blocked and the production Spanish catalog. Controlled-clock cases are
labeled separately from ordinary-clock keyboard/layout checks. Legacy records,
malformed data and storage denial are controlled inputs, not evidence of an actual
browser storage-policy failure. The suite covers both A+ final versions, Core 2,
Linux+, Security+, CEH and an untimed quiz. Keyboard-only screenshots cover widths
320/390/768/1440, English/Spanish and light/dark themes. Deployed navigation smoke
evidence is separate under test-results/assessment/release. No physical-device or
screen-reader session is claimed, and no translation mock is used by this suite.

## Optional noir theme

Run alongside every existing suite listed above:

```sh
node tests/noir_theme_unit.mjs
python -X utf8 tests/noir_theme.py --output test-results/noir/browser
```

The unit checks run the production shared script against a minimal DOM to check
preference restoration, cycling, denied storage, malformed values and localized
action labels. They do not establish browser behavior or visual correctness.

The browser suite serves the real repository at /Projects/, blocks external HTTPS
and uses the actual Spanish catalog. It covers keyboard selection, navigation and
reload persistence, old saved preferences, storage-denial fixtures, language changes,
CLI draft retention and unchanged terminal colors, assessment flags/submission/
locked review, connector focus/matching, and overflow at 320/390/768/1440.
Its screenshots capture both languages and all three themes for the existing
visual cases plus bank assessments and the confirmation dialog. No standalone
search page exists; existing article search controls receive the noir form skin.
Screenshots require human visual review, including comparison to pre-change
light/dark captures on the same machine. Passing a browser suite would not imply
screen-reader or physical-device testing.

See [current noir evidence and blocked checks](../docs/ux-evidence/noir-theme.md).
