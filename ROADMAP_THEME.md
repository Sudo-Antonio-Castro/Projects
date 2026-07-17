# Learning Roadmap Theme

The repository uses the selected **Option 3 — Learning Roadmap** design across every `index.html` page.

## Shared files

- `assets/roadmap-theme.css` — colors, typography, roadmap rows, lesson layouts, quizzes, and CLI overrides.
- `assets/roadmap-theme.js` — active global navigation and theme preference persistence.
- `assets/cli-labs.css` — compact CLI workspace styles plus Ubuntu, PowerShell, and macOS terminal treatments.

Because the design is centralized, most future visual changes only require editing `assets/roadmap-theme.css`. CLI-only changes belong in `assets/cli-labs.css`.

## Page classes

Each page body includes `roadmap-theme` and one layout class:

- `rm-hub` — compact landing pages and learning-track indexes; lists become roadmap rows.
- `rm-lesson` — lessons, study material, articles, and directory pages.
- `rm-quiz` — quizzes, midterms, and final exams.
- `rm-cli` — interactive command-line labs.

Example:

```html
<body class="roadmap-theme rm-lesson" data-roadmap-theme="option-3">
```

## Adding the theme to a new index page

Add these references at the end of `<head>`, using the correct relative path:

```html
<link rel="stylesheet" href="../../assets/roadmap-theme.css" data-roadmap-theme="option-3">
<script defer src="../../assets/roadmap-theme.js" data-roadmap-theme="option-3"></script>
```

Then add the appropriate body classes. New track collections should use semantic rows such as `.grid > .card`. Keep the hero to one short title and sentence, avoid promotional callouts, and let the roadmap links do the navigation.

## Other repairs included

- Added the previously missing `Apps/index.html` landing page.
- Replaced four blank Apps directory indexes with styled directory pages.
- Rebuilt the duplicated CompTIA A+ 220-1202 landing page with its correct 12 modules and 12 quizzes.

## Production cleanup

The old design mockups were removed from the production repository. Landing pages no longer include placeholder tracks, generic callouts, repeated back buttons, or decorative footers.


## CLI platform classes

CLI lab pages load `assets/cli-labs.css` after the main theme and use one platform class in addition to `rm-cli`:

- `cli-ubuntu`
- `cli-powershell`
- `cli-macos`

The CLI task list intentionally displays task prompts without the expected command. Answers remain in the page data so command checking, Hint, and Reveal continue to work.
