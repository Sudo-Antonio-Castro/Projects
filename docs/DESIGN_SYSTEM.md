# Working with the Projects visual system

Study modules now opt into `assets/study-layout.css` and `assets/study-layout.js`
after shared theme/navigation assets. The reusable three-column shell, supported
templates, responsive contract, reading-place memory and migration manifest are
documented in [the study-layout report](ux-evidence/study-layout/README.md).
Assessments, CLI workspaces, hubs, references and utilities retain their own
layouts. Use `tests/build_study_layout.py` for supported study-template opt-in.

The [study cleanup inventory](ux-evidence/study-layout-cleanup/README.md) covers
all 67 modules. Eight ordinary Core 1, all 12 Core 2, 16 Security+ and 15 CEH
modules now use template bases in `study-layout.css`. All 15 Linux+ modules
retain their external base. These 66 pages have no embedded CSS. The motherboard
module retains its distinct nested-lesson/content skin and two content spacing
attributes; do not copy its legacy layout rules into new modules.

Add enhanced shell/rail/card rules to `study-layout.css`, common skin rules to
`roadmap-theme.css`, palette values to `design-tokens.css`, and noir-only treatment
to `noir-theme.css`. `data-study-template="tabs|core1|articles"` on `html` selects
compatibility geometry through zero-specificity gates. Keep these bases before
the enhanced study rules and preserve the existing stylesheet order. The common
theme's existing specificity retains theme ownership; these bases also support
the original no-JS view. Genuinely
unique content styling can stay in a small documented page block; it must not
redefine the common header, theme, shell or rails. Document new exceptions and
review them in `tests/check_study_cleanup.py`.

The tabs template uses the controller at the start of `study-layout.js`. Keep
native source controls and semantic lesson HTML. The shared enhancer already
owns rails, progress, helper headings and on-this-page links; do not paste them
into modules or move lesson prose into JavaScript.

The site stays static. Light and dark retain their existing purple palette; noir
is an optional third theme. This is an incremental component contract, not a
requirement to rewrite every article or terminal skin.

## Tokens and stylesheet order

Load a page's existing base skin first, then `assets/roadmap-theme.css`, then its
component styles (`navigation.css`, `assessment-taking.css`, `learning-progress.css`
or `cli-labs.css`). The theme imports tokens, directory components and the scoped
legacy roadmap spacing bridge. Keep these local relative URLs valid at `/Projects/`.

| Role | Custom properties |
| --- | --- |
| Background / surfaces | `--rm-bg`, `--rm-bg-deep`, `--rm-panel`, `--rm-panel-2`, `--rm-body-background` |
| Text / borders | `--rm-text`, `--rm-muted`, `--rm-line`, `--rm-line-soft` |
| Existing accents | `--rm-pink`, `--rm-blue`, `--rm-yellow`, `--rm-mint` |
| Focus | `--rm-focus`, `--rm-focus-strong`, `--rm-focus-progress` |
| Spacing | `--rm-space-1/2/3/4/5/6/7/8/10/12` = 4/8/12/16/20/24/28/32/40/48px; `--rm-space-inset` = existing 18px inset |
| Radii | `--rm-radius-small/panel/control/card/pill` = existing 4/10/12/14/999px |
| Typography / shadow | `--rm-font-body`, `--rm-font-mono`, `--rm-shadow` |
| Widths | `--rm-max` (1240px), `--rm-reading-width` (72ch), `--rm-hero-width` (920px), `--rm-dialog-width` (620px) |

Dark/light token values are copied from the established theme. Foreground/muted
text against the page/panel colors is checked for a minimum 4.5:1 ratio. This is
not a blanket accessibility certification. Existing terminal palettes remain
platform-specific. Noir adds a separately scoped charcoal/parchment/brass palette;
see [the noir implementation notes](ux-evidence/noir-theme.md).

Breakpoints remain literal media conditions: 480px for compact rows, 600px for
assessment controls, 760px for navigation, 1000px for the wide header; CLI retains
520/780/1120px for its workspace. Do not substitute `var()` into a media-query
condition: CSS custom properties do not work there. Align responsive DOM ordering
in the CLI script with its existing 780px condition.

## Components and ownership

| Component | Contract / owner |
| --- | --- |
| Global navigation | Static `.roadmap-global-nav` links with `data-section`, `aria-current`; theme + navigation CSS |
| Breadcrumb | `.project-breadcrumb`, ordered list, one current item; navigation CSS |
| Shell / header | `.shell`, `.wrap`, `.hero` or `.hero-grid` / `.hero-card`; existing base skin + theme |
| Directory rows | Body `.ds-hub.directory-hub.rm-hub.roadmap-theme`; `.ds-directory-list` and `.ds-directory-row`; `roadmap-components.css` |
| Numbered roadmaps | Existing `.rm-hub` without `.ds-hub`; `legacy-hub-compat.css` owns their spacing |
| Buttons | Native buttons or `.btn`; `.primary` only where the existing primary treatment is appropriate |
| Notice / status / empty state | Existing `.note`, `.callout`, `.directory-status`, `.learning-activity`; text must explain state, not color alone |
| Progress | `.learning-progress`, `.learning-activity`; `learning-progress.css`; rendering/storage stays in existing progress JS |
| Forms / selectors | Native labeled controls; `.site-language-settings` is owned by `site-language.js`; CLI `.cmd-input` retains terminal behavior |
| Assessment | `.assessment-start`, `.assessment-overview`, `.assessment-actions`, `.assessment-flag`; `assessment-taking.css` |
| Dialog | Native `.assessment-confirmation` dialog, existing close/focus behavior; assessment CSS/controller |

The directory component uses low-specificity `:where()` selectors and owns only
its spacing. It does not compete against another important spacing declaration.
Eight directory pages consume it: Home, Apps, CLI Labs, CompTIA, A+, EC-Council,
the knowledge-base hub and progress management. Common theme skin overrides still
apply; these pages are not claimed to be entirely free of compatibility rules.

Repeated homepage/progress and stacked-directory skins are shared assets. Their
different mobile header behavior is intentional. Security+ and CEH assessment
layout skins are also shared within each family; their distinct typography,
controls and geometry were preserved. All bank assessments share
`assessment-bank.css`. Linux embedded question markup retains its own base skin.

## Remaining compatibility debt

- The root `--bg`, `--panel`, `--text` and similar aliases remain important because
  old base skins define the same properties. The duplicate light alias block was
  redundant: the aliases now resolve the live light/dark token values once.
- Five numbered track hubs still need their scoped important spacing bridge.
  Do not remove its `:not(.ds-hub)` restriction.
- Broad theme overrides still reconcile lesson/article skins, assessment answer
  states and platform terminal colors. They were not removed wholesale.
- A+ and EC-Council's unique parent-directory base styles remain embedded; unique
  article/demo styles and the repeated lesson-template families were not extracted
  merely to make the inline-style count smaller.
- Runtime locale styles and CLI localization/render helpers are unchanged. This
  milestone consolidates the assessment engine, not all JavaScript repetition.

## Adding a page

1. Reuse the closest existing base skin; do not paste another `<style>` block.
2. Use relative asset links and static navigation/breadcrumb markup. Navigation
   must remain useful with JavaScript disabled and at `/Projects/`.
3. For an unnumbered directory, add the directory body contract and explicit list
   / row classes above. Do not use numbered roadmap markup to emulate a directory.
4. Use palette/spacing tokens and existing components. Add a component rule with
   low specificity if necessary; do not add inline styles or a new important rule
   to win a cascade conflict. Document a genuinely needed legacy exception.
5. Run the static guards and relevant browser suite; add the new family to visual
   coverage if its structure differs. Review visual changes explicitly.

## Assessment and localization changes

There is one `assets/assessment-controller.js`. Bank question data remains beside
each track, while embedded Linux assessments keep `data-assessment` on the script
element. Static and dynamic loaders must resolve to the canonical controller.
Its behavior is unchanged; storage keys, activity IDs, signatures, answer keys,
scoring, deadlines, flags and CLI matching were not changed by consolidation.

For a new interface string, keep an English source key in `data-learning-source`
or the existing `label` / `localized` helper, add reviewed Spanish to
`assets/learning-es.json`, and use `{count}`-style placeholders. Keep identical
placeholder names and numeric values. Do not translate command values, question
IDs, storage keys or resume destinations. Run catalog and language checks. Rebuild
`learning-activities.js` only when the actual activity inventory changes.

## Local checks and GitHub CI

Install Node (for syntax checking) and Python, then:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python -X utf8 tests/check_source.py
python -X utf8 tests/check_learning_catalog.py
python -X utf8 tests/build_progress_catalog.py --check
python -X utf8 tests/check_design_system.py
python -X utf8 tests/check_ci.py
python -X utf8 tests/ux_regression.py
python -X utf8 tests/language_regression.py
python -X utf8 tests/mobile_accessibility.py
python -X utf8 tests/navigation_directory.py
python -X utf8 tests/assessment_experience.py
python -X utf8 tests/progress_resume.py
git diff --check
```

`regression.yml` runs on PRs against main and non-main branch pushes. It has
`contents: read` only, pinned official actions, no persisted checkout credentials,
pip download caching only, bounded jobs, and no deployment/release steps. Five
static/catalog/contract checks, the six existing browser suites, and one new
visual suite run automatically. Failure artifacts include only test JSON, PNGs
and logs, retained seven days; no profiles, cookies or dependency trees are saved.

The visual job checks out the merge base into a temporary worktree, captures base
and head on the same runner/browser, and compares 12 states in four combinations
(48 frames): 320/en/light, 390/es/dark, 768/es/light, 1440/en/dark. It mounts both
at `/Projects/`, uses fixed Date fixtures and the local Spanish catalog, blocks
external HTTPS, and checks document-wide overflow. Dimensions must match. There
are no masks. An unmodified-main repeat measured one-level RGB rounding in up to
15 pixels/frame, so only that bounded raster noise is accepted; all raw counts
remain in JSON. A larger change fails and requires review, not an automatic golden
update. Local comparison commands are documented in `tests/design_visual.py`.

Workflow syntax was also checked locally with official `actionlint` 1.7.12 after
verifying its release checksum. CI's Python workflow guard enforces the committed
policy. See [official Python action documentation](https://github.com/actions/setup-python)
for the supported pip cache inputs.

CI does not test Google translation availability, public Pages deployment, real
user profiles, physical devices, or a screen reader. Controlled clock/storage
fixtures are labeled, not presented as ordinary deployed use. External release
smoke checks remain separate and are not required PR checks.

## Optional noir theme

`assets/noir-theme.css` is imported by the roadmap theme. The four standalone
article/lab pages load it directly and use the shared theme script. All its
rules require `html[data-theme="noir"]`; no default changes to noir.
The existing native theme button cycles light → dark → noir → light, with a
localized next-action label. Both existing preference keys accept all three values.
Invalid current preferences fall back to a valid legacy preference, then the page
default; denied storage leaves theme selection usable in the current page.

Reading/assessment surfaces use local paper tokens and local legacy aliases,
while the surrounding page uses dark tokens. Technical code remains on dark
surfaces. CLI terminal interiors keep their platform skins. The only cat motif
is a tiny CSS silhouette on the noir theme button. Specific scoped important
rules reconcile existing important skin overrides; do not broaden them to light
or dark. No question banks, scoring, timing, CLI matching or storage schemas change.

Run `node tests/noir_theme_unit.mjs` and `python -X utf8 tests/noir_theme.py`
in addition to the existing suites. Review all three themes on the same browser/OS;
the new screenshot matrix is review evidence, not an automatic golden update.
