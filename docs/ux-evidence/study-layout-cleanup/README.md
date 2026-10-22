# Study layout cleanup

Base: current `origin/main`, `5eab04996f4210728e03827012b0ccfc5261379d`
(merged PR #8). Branch: `refactor/study-layout-cleanup`. The initial worktree was
clean. The existing manifest defines the scope: 67 modules and 200 lessons.

## Inventory and result

Counts and source bytes use UTF-8/LF, independent of checkout `core.autocrlf`.
Full per-page inventories include stylesheet/script references, structural counts,
body fingerprints, repeated declarations and CSS errors:
[before](before/inventory.json), [after](after/inventory.json).

| Metric | Before | After |
| --- | ---: | ---: |
| Migrated pages | 67 | 67 |
| Embedded style blocks | 52 | 1 |
| Embedded CSS bytes | 273,766 | 11,556 |
| Inline style attributes | 2 | 2 |
| Pages without embedded CSS | 15 | 66 |
| Malformed embedded declarations | 1 | 0 |
| `roadmap-theme.css` bytes | 27,701 | 52,602 |
| `study-layout.js` bytes | 15,468 | 17,074 |

Other shared CSS/JS files are unchanged. Embedded CSS fell by 262,210 bytes
(95.8%); the larger shared assets are explicitly counted above.

Three exact repeated skins accounted for 51 blocks: eight ordinary Core 1
modules (6,765 bytes each), 28 Core 2/Security+ modules (5,208 each), and 15 CEH
modules (4,151 each). They repeated aliases, resets, header/hero/wrap/panel
geometry, lesson tabs, typography, summaries, exam tips, controls, footer, print
and responsive rules. These now live in the existing `roadmap-theme.css` before
its common skin, selected by `html[data-study-template]` with zero-specificity
`:where()` gates. Original specificity and template variations remain. No new
stylesheet or global overflow suppression was added.

The 15 Linux+ modules already use `CompTIA/Linux+/assets/styles.css`; they were
inventoried and tested without rewriting that family. All 67 modules load shared
roadmap theme, navigation and study assets; tokens and noir remain theme imports.
No assessment, quiz bank, CLI, article, app, connector-lab or archived page
implementation changed.

## Structure and controllers

There were zero static copies of the enhanced shell, left/right rails, lesson
meter or on-this-page navigation. `study-layout.js` already generates these once,
including helper headings and status wrappers. Source previous/next bars and
lesson tabs remain: enhancement moves existing buttons, preserving handlers;
the original document supports the fallback. Removing those wrappers would
change fallback behavior for no useful reduction in ownership.

All 12 Core 2 and 16 Security+ modules had the exact same lesson controller
suffix. It now initializes once in `study-layout.js`, with the same public
functions for native inline handlers, counter, boundaries and shortcuts.
Duplicated theme/print/year setup was removed from those pages because
`roadmap-theme.js` already owns it, including capture-phase protection against
double toggles. Core 1 controllers and the existing CEH/Linux adapter remain.
No state schema, storage key, history policy or lesson content changed.

## Intentional exceptions and ownership

`Motherboard_and_Connectors` retains one 11,556-byte mixed base/content block:
distinct module/section tabs, nested lesson visibility, two-column content,
tables, steps and cause-list diagrams, plus legacy compatibility geometry.
It still contains some duplicate layout rules. Splitting that interleaved skin
is deferred rather than moving unique content rules into the global theme to
claim zero. Its two `style="margin:0;"` attributes intentionally space content
step diagrams. The stray `s` after `--surface-soft:#f6f3ee;` was removed. The
effective `--text` was already supplied by a shared important alias; pixels match.

The extracted shared compatibility bases retain original aliases and fallback
geometry. Their removal has not been proved safe for unenhanced/print views.
Existing broad theme/noir bridges and Linux's external base remain. No unrelated
legacy CSS was pruned merely because it looked old.

Use `study-layout.css` for enhanced shell/rails/cards/responsiveness,
`roadmap-theme.css` for common skin, `design-tokens.css` for tokens and
`noir-theme.css` for noir-only treatment. The scoped compatibility sections own
original template geometry. Preserve asset order and specificity. Keep semantic
lesson HTML, source navigation and native controls in the page. Only genuinely
unique content styling belongs in a small documented page block; do not copy
header, body, theme, rails or controller code. Review exceptions in the guard.

## Visual evidence

Real Chromium/local HTTP at `/Projects/`, external HTTPS blocked, actual locale
assets, fixed date and identical OS/browser/fonts. The matrix captures six
representatives at 320/390/768/1024/1440 in light/dark/noir (90 enhanced states), plus
390/1440 with scripts disabled in all themes (36 fallback states). All **126/126**
have identical dimensions and **zero changed pixels**. No masks, recompression,
golden update or tolerance increase was used.

[Before capture list](before/results.json) and [comparison results](after/results.json)
record every state. Thirty-six enhanced desktop/mobile pairs are committed; other
captures remain under `test-results/study-cleanup/` and are recaptured in CI with
failure artifacts. No-JS themes are set with Playwright's DOM API while page
scripts are disabled; this tests fallback rendering, not a script-free toggle.

| Family | Desktop noir before / after | Mobile dark before / after |
| --- | --- | --- |
| Core 1 | [Before](before/a-core1-1440-noir-js.png) / [After](after/a-core1-1440-noir-js.png) | [Before](before/a-core1-390-dark-js.png) / [After](after/a-core1-390-dark-js.png) |
| Ordinary Core 1 | [Before](before/a-core1-tabs-1440-noir-js.png) / [After](after/a-core1-tabs-1440-noir-js.png) | [Before](before/a-core1-tabs-390-dark-js.png) / [After](after/a-core1-tabs-390-dark-js.png) |
| Core 2 | [Before](before/a-core2-1440-noir-js.png) / [After](after/a-core2-1440-noir-js.png) | [Before](before/a-core2-390-dark-js.png) / [After](after/a-core2-390-dark-js.png) |
| Security+ | [Before](before/security-1440-noir-js.png) / [After](after/security-1440-noir-js.png) | [Before](before/security-390-dark-js.png) / [After](after/security-390-dark-js.png) |
| Linux+ | [Before](before/linux-1440-noir-js.png) / [After](after/linux-1440-noir-js.png) | [Before](before/linux-390-dark-js.png) / [After](after/linux-390-dark-js.png) |
| CEH | [Before](before/ceh-1440-noir-js.png) / [After](after/ceh-1440-noir-js.png) | [Before](before/ceh-390-dark-js.png) / [After](after/ceh-390-dark-js.png) |

Light and the remaining theme pairs use the same filenames with `light`, `dark`
or `noir` in the before/after folders. Representative desktop/mobile renders were
also visually inspected. There are no intended visual differences.

## Validation

The new static guard prevents copied skins/controllers/chrome, validates shared
assets and template opt-ins, detects malformed CSS and records unique-content
exceptions. It ignores harmless whitespace. All 67 body fingerprints match,
including prose, tag order, headings, links, IDs and inline handler attributes.
Scripts are reviewed separately from semantic content.

Local final results are recorded in [validation.json](validation.json): source/
links, catalog, progress catalog, CSS/design contract, CI policy, cleanup guard,
JavaScript/Python syntax, noir unit checks and whitespace all pass. Browser suites
passed UX 32/32, language 12/12, mobile/accessibility 14/14, navigation 7/7,
assessment 21/21, progress/resume 31/31, noir 387/387, study 30/30 plus the
67-module/200-lesson sweep, and cleanup visuals 126/126.

The separate existing site-wide visual suite is **47/48 strict local passes**:
[raw comparison](site-visual-results.json). The progress dashboard at 768/es/light
has 20 pixels differing by one RGB level at rounded card corners, identical
dimensions, and zero pixels with a larger difference. The unchanged allowance
is only 15 pixels, so this remains explicitly reported as a strict failure.
An experimental software raster path did not remove it and was reverted. All
study comparison pixels match. Hosted CI is reported separately in the handoff.

An earlier baseline captured an empty asynchronous progress widget. The visual
harness now requires populated widgets and uses a larger local HTTP accept queue
to avoid refused asset connections under Windows load. Both checkouts were
recaptured with the same stronger harness; no assertions or pixel tolerances were
relaxed. An initial parallel assessment run also hit local connection refusals;
the complete isolated rerun passed. Raw prior attempts remain in test-results.

Existing `study_layout.py` checks clicks, boundaries, reload/place memory,
fragment targets, focus, contrast and overflow in English/Spanish, then sweeps all
67 modules. Added shortcuts check reading-context ArrowRight/Home and protection
for focused native controls. Final suite results and hosted CI are recorded in
the PR handoff. CI adds the cleanup guard, same-runner study base/head captures
and study interactions to the existing non-deploying workflow. No existing
assertion or pixel tolerance was weakened. No physical-device, screen-reader or
external translation-service certification is claimed.
