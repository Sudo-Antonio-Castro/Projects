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

The recovery was validated in offline mode. There were 32 passing checks across
a checkpointed run and a focused follow-up, plus successful syntax, local-file
reference and source-integrity checks. A single uninterrupted live-server suite
run has not been completed. Before merging, run the default browser suite and a
manual smoke test on an authenticated preview or local deployment, including
actual language switching with Google Translate available.

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
