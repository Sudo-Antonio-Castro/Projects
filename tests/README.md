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
