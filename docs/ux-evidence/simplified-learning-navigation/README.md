# Simplified learning navigation

Branch: `feat/simplified-learning-navigation`. Starting main:
`251aaa4b06df5ed040a41f3e04216c2a519d83f4` (fetched and verified).
The supplied PC Case Anatomy mockup guides navigation placement. Existing theme
palettes, lesson content, real tools and the multi-lesson module model remain.

The visible study path changes from Home / CompTIA / A+ / Core 1 / module to
**A+ Core 1 / module**, with the current lesson as the H1. All 67 migrated modules
use this two-item source breadcrumb. All five course hubs have a single course
context. Global navigation retains Home, CompTIA, CEH, Labs, Library and Apps.

| Source navigation metric | Before | After |
| --- | --- | --- |
| Study modules with 5 breadcrumb items | 21 | 0 |
| Study modules with 4 breadcrumb items | 31 | 0 |
| Study modules with 3 breadcrumb items | 15 | 0 |
| Study modules with compact course/module context | 0 | 67 |
| Existing course hubs with shared course selector | 0 | 5 |
| Lesson source subtrees changed | — | 0 of 200 |
| Existing URLs moved or redirected | — | 0 |

The native course selector links to the five existing course hubs. The left rail
shows full lesson titles, current step, position, previous/next and the next
lesson's name. Module overview remains optional. The right rail retains existing
tools and adds collapsible links to real course modules and the library.
Desktop uses three columns; mobile order is context, lesson, native collapsible
lesson navigation, then helpers. Existing theme and language controls are moved
into the compact header without replacing their event handlers.

`navigation.js` owns course selection and course-card resume. `study-layout.js`
continues to enhance the original lesson controllers. A lesson change adds a
history entry; back/forward restore the lesson. Existing source fragment IDs and
`#study-N-section` links remain supported. Canonical `#study-N-lesson` links make
saved places shareable. URLs, query strings and the reading-place key
`projects-study-place:v1:<normalized path>` are retained. Resume displays reading
position and last viewed lesson, never completion or enrollment. Without a valid
saved place, original module cards remain unchanged. Metadata/storage failure
leaves normal course links usable.

`assets/study-navigation.json` contains only module paths, titles and lesson
titles, generated from source HTML. Rebuild with
`python tests/build_study_navigation.py`; validate with `--check`. The same tool
installs compact fallback breadcrumbs and shared script references. Add shared
navigation styles to `navigation.css`, study-only header/rail styles to
`study-layout.css`, and English/Spanish display labels to `learning-es.json`.
Keep actual lesson prose and controller identities in semantic HTML.

The new navigation labels and lesson titles use the existing local translation
layer. Language changes retain URLs, lesson selection, reading place and theme.
Lesson prose is unchanged; translating all remaining study prose is outside this
navigation milestone. No accounts, search feature, flashcards or mockup photos
were invented. Assessments, CLI labs, quiz banks and activity identities are
untouched. Legacy Old* pages, article internals and app flows retain their layouts.

## Evidence and validation

`before/` and `after/` contain captures for five lesson families, all five course
hubs, the motherboard module overview, and a course hub with a real saved-place
fixture: desktop 1440 and mobile 390, each in light/dark/noir (72 pairs). Module landing and lessons share a file; the overview
capture expands its existing optional overview instead of adding a checkpoint.
`comparison.json` records image geometry/differences. Changes are intentional:
shorter header/context, full lesson labels, next-lesson hint, resume actions when
saved, H1 semantics, and related-learning links. Palette and prose are preserved.

`tests/learning_navigation.py` checks the original source subtrees and inline
controllers for all 200 lessons against the base checkout, course destinations,
all five widths (320/390/768/1024/1440), all themes, both languages, history,
previous/next, resume, original deep links, keyboard access and no-JS fallback.
Run it with `--before --site-root BASE --output BEFORE`, then with
`--baseline BEFORE --output AFTER`. `--quick` isolates mobile noir; it is not the
release matrix. `--capture-only` refreshes evidence without claiming interactions.

The generic design visual suite still strictly compares 40 unaffected site
states using its unchanged pixel tolerance. Linux/CEH hub captures now belong to
this navigation suite alongside the other three hubs. CI explicitly guards that
only these two intentional UI cases move. The historical cleanup visual tool
remains available for CSS-only refactors; its whole-body/zero-change condition
does not describe an intentional navigation change. Its static CSS/controller
guards continue to run, now also requiring the shared navigation script.

No assessment scoring, timers, answer persistence, CLI command matching, search
ranking, repository settings or deployment configuration changes are included.

## Local results

| Check | Result |
| --- | --- |
| Source/link, design system, cleanup, CI policy, learning catalog | All pass |
| Navigation metadata and progress inventory | Both pass |
| Existing UX / language / mobile-accessibility / navigation | 32 / 12 / 14 / 7 pass |
| Assessment / progress-resume | 21 / 31 pass |
| Study layout | 30 states; 67 modules / 200 lessons pass |
| Theme regression / preference unit checks | 387 / 11 pass |
| New navigation matrix | 150 states pass across five widths, three themes, two languages |
| Original fragments / no-JS content and course links | Five families pass |
| Before/after navigation visuals | 72 reviewed pairs; intentional changes described above |
| Unaffected site visuals | 40 states, zero changed pixels |
| HTML integrity | All 72 files otherwise match main; 200 lesson subtrees and inline controllers unchanged |
| Existing Spanish entries | All 3,937 values preserved; 212 navigation/title entries added |

[validation.json](validation.json) records exact states, totals, source checks and
shared asset sizes. The combined Windows run stopped waiting for a Linux resume
link; all 30 Linux states passed on an isolated rerun without product changes.
An earlier local run also reported Chromium `ERR_NETWORK_IO_SUSPENDED` during a
deep-link load, which passed on rerun. Assertions and default CI coverage remain
unchanged: CI runs all 150 states without retrying them. The recorded local
results distinguish the full run and the affected-family rerun.
