# Optional noir theme — implementation and validation limits

Branch: `feat/noir-jazz-theme` (confirmed by directly reading .git/HEAD).
The repository path stayed C:/Users/acastro/Projects-ux-review. No branch switch,
reset, clone, merge, deployment or repository-setting change was performed.

## Implementation

The native theme button cycles light → dark → noir → light. Noir is opt-in.
Both existing preference keys persist it; valid old light/dark values still load.
Malformed values fall back to a valid legacy preference or the page's original
default. Storage denial leaves selection working in memory. The next-action
accessible label/title uses the existing local English/Spanish catalog.

The scoped skin covers navigation/breadcrumbs, hubs/directories, progress and
empty states, reading surfaces, buttons/forms/selects/notices, assessment start,
questions, answer/review/results and confirmation dialogs, CLI surroundings,
connector chrome and article search inputs. There is no standalone search page.
Assessment and CLI behavior/data were not edited. Existing semantic feedback
and flags remain text based; no color-only state was added.

Noir uses local system/Georgia/monospace stacks, thin brass rules, modest double
borders and a tiny CSS cat silhouette on the theme button. No production raster
background, remote image, animation loop, canvas effect or new font was added.
Platform terminal screen/output palettes remain in their existing stylesheets.

The four standalone pages load the scoped CSS and shared theme script directly:
the Core 1 connector/CLI mini-labs and the Ollama/Wifite articles. The articles
retain their light default. A shared-script guard avoids injecting a new visible
skip link into those standalone layouts. Ninety-five HTML pages have their legacy
kb_theme read wrapped in try/catch so denied storage does not abort subsequent
inline page initialization. Those wrappers only read the existing theme key.
No question banks, assessment controller, scoring, deadlines, flags, progress
storage schemas, activity IDs or CLI matching/rendering code were edited.

## Palette

| Token | Value |
| --- | --- |
| Background / deep | #090908 / #050505 |
| Charcoal surfaces / raised | #141310 / #1b1915 |
| Cream / parchment | #eee3ca / #d9c9a8 |
| Muted outer text | #aaa08e |
| Brass / soft brass | #b28b52 / #7e633e |
| Oxblood / border | #4a2024 / #4b3b27 |
| Paper text / muted | #25211a / #5e5342 |
| Paper raised / border / focus | #e2d4b8 / #9a825e / #72532b |
| Correct / incorrect paper fills | #d6ddc5 / #e4cdbe |

Oxblood is confined to incorrect/error accents. Primary actions use brass.
Declared contrast calculations: outer text/background 15.63:1; muted text/charcoal
7.19:1; paper text/cream 12.57:1; paper muted/cream 5.90:1. Focus colors measure
5.93:1 on charcoal and 5.51:1 on cream. These are token calculations, not computed
browser-style or blanket accessibility results. No screen-reader test was run.

## Checks actually run

The available persistent JavaScript tool ran the production shared script in a
minimal DOM with actual catalog strings. Eleven groups passed: both key formats
restore all three themes; cycle persistence; English/Spanish labels without theme
changes; denied-storage in-memory use; malformed-value/default handling; and
outer declared text/muted palette contrast on all three dark surfaces.

The same in-process runtime parsed 147 changed shared/inline scripts using
vm.Script. It also checked that the 91 ordinary changed HTML files differ only
by the guarded preference read (the other four additionally load shared assets).
Catalog JSON parsed successfully. Existing light/dark CSS declarations were
preserved; only the roadmap CSS import and noir-scoped declarations were added.
These checks do not replace the existing project suites.

Machine-readable evidence: `test-results/noir/in-process-checks.json`.
The full session edit inventory is [noir-theme-files.json](noir-theme-files.json).
It records files edited in this session, not a git diff/status report.

## Execution blocker and unrun checks

Windows rejected creation of this executable:

`C:\Users\acastro\AppData\Local\Microsoft\WindowsApps\Microsoft.PowerShell_8wekyb3d8bbwe\pwsh.exe`

The tool attempted `-Command` with its UTF-8 initialization wrapper followed by:

```powershell
Get-Location; git status --short --branch; rg --files -g AGENTS.md -g '*noir*' -g '*theme*' -g '*PLAN*' -g '*TASK*' -g '*handoff*' -g '!node_modules' -g '!.git'
```

Result: `CreateProcessAsUserW failed: 5 (Access is denied.)`. No command in that
shell invocation ran. A direct `git.exe status --short --branch` launch using
execFile with the same repository cwd then failed with `spawn EPERM`.
Neither blocker was worked around with another workspace or repository path.

No Python, Playwright, standalone Node CLI or browser process was launched.
Their individual executable availability was not established. Required work
remaining when process execution is available:

```sh
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
python -X utf8 tests/design_visual.py --output test-results/noir/existing-visual
node tests/noir_theme_unit.mjs
python -X utf8 tests/noir_theme.py --output test-results/noir/browser
git diff --check
```

The added browser suite is unexecuted and still needs syntax/runtime verification.
It includes both languages, 320/390/768/1440, all three themes, 16 screenshot
cases (384 frames), real keyboard/navigation/reload, malformed and denied-storage
fixtures, learning-state retention, terminal-color checks and connector focus.
Review those captures and compare light/dark to same-machine pre-change captures;
no screenshots or browser-render evidence were produced in this session.
CSS parsing, actual computed contrast, mobile overflow, browser interactions,
reduced-motion behavior and visual consistency remain unverified.

Git status/diff/commit/push remain unavailable after the git.exe launch rejection.
No commit or push was attempted; no draft PR was opened because these local
changes have not been pushed. Nothing was merged or deployed.
