# Multilingual Site Support

The repository uses one shared script, `assets/site-language.js`, to provide a language selector on every HTML page.

## Supported Languages

* English (`en`) — original source content
* Spanish (`es`) — automatic translation
* Arabic (`ar`) — automatic translation with right-to-left page direction

## How It Works

1. A visitor chooses a language from the floating selector.
2. The choice is saved as `projects-site-language` in browser `localStorage`.
3. The choice is also applied through the Google Translate page widget.
4. When the visitor follows an internal link, the shared script reads the saved language and applies it to the new page.
5. Technical content such as `code`, `pre`, terminal screens, command prompts, and command inputs is excluded from translation.

## Adding Another Language

Open `assets/site-language.js` and add the language to `SUPPORTED_LANGUAGES`:

```javascript
fr: {
  nativeName: 'Français',
  label: 'Langue',
  note: 'Traduction automatique',
  dir: 'ltr'
}
```

Then add a matching option inside the `site-language-select` markup:

```html
<option value="fr">Français</option>
```

The language code must be supported by Google Translate.

## Important Limitation

Spanish and Arabic are machine-generated at page load. They are not stored as reviewed translated HTML files. For formal training, exams, or accessibility-sensitive publishing, have a fluent reviewer verify terminology and question meaning.
