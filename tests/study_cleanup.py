"""Inventory and same-machine visual guard for the explicit study migration scope.

Capture --output BEFORE, then --output AFTER --baseline BEFORE. No masks or
golden updates. Uses the existing calibrated pixel comparator. --inventory-only
records source metrics without launching a browser.
"""
from pathlib import Path
from collections import Counter, defaultdict
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timezone
import argparse, hashlib, json, threading
from bs4 import BeautifulSoup, NavigableString, Tag
import tinycss2

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'docs/ux-evidence/study-layout/migrated-pages.json'


def inventory(root):
    rows = []; groups = defaultdict(list); declarations = Counter(); errors = []
    for item in json.loads((root / MANIFEST).read_text(encoding='utf8')):
        path = item['path']; soup = BeautifulSoup((root/path).read_text(encoding='utf8'), 'html.parser')
        styles = [s.get_text() for s in soup.select('style')]
        def rules(nodes):
            for node in nodes:
                if node.type == 'error': errors.append({'path': path, 'error': node.message})
                if node.type == 'at-rule' and node.content:
                    rules(tinycss2.parse_rule_list(node.content, skip_comments=True, skip_whitespace=True))
                if node.type == 'qualified-rule':
                    for d in tinycss2.parse_declaration_list(node.content, skip_comments=True, skip_whitespace=True):
                        if d.type == 'error': errors.append({'path': path, 'error': d.message})
                        elif d.type == 'declaration': declarations[d.name + ':' + tinycss2.serialize(d.value).strip()] += 1
        for css in styles:
            groups[hashlib.sha256(css.encode()).hexdigest()].append(path)
            rules(tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True))
        for node in soup.select('[style]'):
            for declaration in tinycss2.parse_declaration_list(node['style'], skip_comments=True, skip_whitespace=True):
                if declaration.type == 'error': errors.append({'path':path, 'error':declaration.message, 'source':'style attribute'})
        # Text, order, headings, links, inline handlers and lesson IDs all contribute.
        # Stylesheets and scripts are measured separately; no prose is normalized away.
        semantic = BeautifulSoup(str(soup.body), 'html.parser')
        for n in semantic.select('script'): n.decompose()
        nodes = [('tag', n.name, sorted(n.attrs.items())) if isinstance(n, Tag) else ('text', str(n))
                 for n in semantic.descendants if isinstance(n, Tag) or (isinstance(n, NavigableString) and str(n).strip())]
        fingerprint = hashlib.sha256(json.dumps(nodes, sort_keys=True).encode()).hexdigest()
        rows.append({'path': path, 'styleBlocks': len(styles), 'cssBytes': sum(len(c.encode()) for c in styles),
                     'styleAttributes': len(soup.select('[style]')), 'bodyFingerprint': fingerprint,
                     'stylesheets': [n['href'] for n in soup.select('link[rel=stylesheet]')],
                     'scripts': [n['src'] for n in soup.select('script[src]')],
                     'inlineScriptHashes': [hashlib.sha256(n.get_text().encode()).hexdigest() for n in soup.select('script:not([src])')],
                     'structure': {selector: len(soup.select(selector)) for selector in ['.study-layout','.study-navigation','.study-helper','.study-meter','.study-toc','.bar','#prevBtn','#nextBtn','.lesson-tabs','.module-tabs','.section-tabs']}})
    # Canonical UTF-8/LF bytes, independent of checkout core.autocrlf on Windows.
    assets = {p.relative_to(root).as_posix(): len(p.read_text(encoding='utf8').encode('utf8')) for p in (root/'assets').glob('*') if p.suffix in ['.css','.js']}
    return {'pages': len(rows), 'styleBlocks': sum(r['styleBlocks'] for r in rows),
            'cssBytes': sum(r['cssBytes'] for r in rows), 'styleAttributes': sum(r['styleAttributes'] for r in rows),
            'pagesWithoutEmbeddedCSS': sum(r['styleBlocks'] == 0 for r in rows),
            'cssGroups': dict(groups), 'repeatedDeclarations': declarations.most_common(25),
            'malformedCSS': errors, 'assetBytes': assets, 'rows': rows}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--site-root', type=Path, default=ROOT); ap.add_argument('--baseline', type=Path)
    ap.add_argument('--case', help='Capture one representative family (including a-core1-tabs)')
    ap.add_argument('--inventory-only', action='store_true'); args = ap.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = inventory(args.site_root)
    (args.output/'inventory.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
    print({k: report[k] for k in ['pages','styleBlocks','cssBytes','styleAttributes','pagesWithoutEmbeddedCSS','malformedCSS']}, flush=True)
    if args.baseline:
        before = json.loads((args.baseline/'inventory.json').read_text(encoding='utf8'))
        assert [r['bodyFingerprint'] for r in before['rows']] == [r['bodyFingerprint'] for r in report['rows']], 'Lesson/body markup changed'
        assert report['styleBlocks'] <= 1 and not report['malformedCSS'], 'Duplicated or malformed embedded CSS returned'
    if args.inventory_only: return
    from PIL import Image
    from playwright.sync_api import sync_playwright
    from design_visual import compare
    from study_layout import CASES
    cases = dict(CASES, **{'a-core1-tabs': 'CompTIA/A+/1201/Local_Networking_Hardware/index.html'})
    if args.case and args.case not in cases: ap.error('Unknown study case: '+args.case)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(args.site_root), **kw)
        def translate_path(self, path): return super().translate_path(path.removeprefix('/Projects'))
        def log_message(self, *a): pass
    class Server(ThreadingHTTPServer):
        request_queue_size = 128
    server = Server(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        # Enhanced layout at all requested widths/themes; original fallback at both sizes.
        for js, widths in [(True, [320,390,768,1024,1440]), (False, [390,1440])]:
            for name, route in cases.items():
                if args.case and args.case != name: continue
                for width in widths:
                    for theme in ['light','dark','noir']:
                        c = browser.new_context(viewport={'width':width,'height':960}, reduced_motion='reduce', java_script_enabled=js)
                        c.route('https://**/*', lambda r: r.abort())
                        c.add_init_script(f"localStorage.setItem('projects-site-language','en');localStorage.setItem('projects-roadmap-theme','{theme}')")
                        p = c.new_page(); errors = []; p.on('pageerror', lambda e: errors.append(str(e)))
                        if js: p.clock.set_fixed_time(datetime(2026,10,22,18,tzinfo=timezone.utc))
                        p.goto(f'http://127.0.0.1:{server.server_port}/Projects/'+route, wait_until='networkidle')
                        if js:
                            p.wait_for_function('window.ProjectsLearningLocale?.ready === true')
                            p.locator('.study-layout').wait_for()
                            assert p.evaluate('document.documentElement.scrollWidth <= innerWidth'), (name,width,theme,'overflow')
                            assert not errors, errors
                        else:
                            # Set the DOM theme via Playwright even with page scripts disabled.
                            p.locator('html').evaluate('(el, theme) => el.dataset.theme = theme', theme)
                            assert p.locator('main').is_visible()
                        p.evaluate('document.fonts.ready')
                        filename = f'{name}-{width}-{theme}-{"js" if js else "nojs"}.png'
                        p.screenshot(path=str(args.output/filename), full_page=True, animations='disabled', caret='hide')
                        row = {'file':filename,'status':'PASS'}
                        if args.baseline:
                            row.update(compare(Image.open(args.baseline/filename).convert('RGB'),Image.open(args.output/filename).convert('RGB')))
                        results.append(row); c.close()
                        (args.output/'results.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf8')
                print(name, 'enhanced' if js else 'no-JS', 'captured', flush=True)
        browser.close()
    server.shutdown()
    assert all(r['status']=='PASS' for r in results), [r for r in results if r['status']!='PASS']
    print(f'PASS {len(results)} cleanup visual states',flush=True)


if __name__ == '__main__': main()
