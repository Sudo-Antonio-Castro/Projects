# UX recovery checks

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
