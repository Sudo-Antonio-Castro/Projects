"""Static routes plus real Chromium/local HTTP navigation; external HTTPS blocked.

Uses the production Spanish catalog, no mocked translation service.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import argparse, json, threading, traceback

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = ['home', 'comptia', 'ec-council', 'clis', 'it-knowledge-base-articles', 'apps']
LABELS = ['Home', 'CompTIA', 'CEH', 'Labs', 'Library', 'Apps']
CATALOG = json.loads((ROOT / 'assets/learning-es.json').read_text(encoding='utf8'))
PAGES = ['index.html', 'CompTIA/index.html', 'CompTIA/A+/1202/Windows_Tools_and_Management/index.html',
         'CompTIA/Linux+/modules/linux-landscape-and-server-roles/index.html',
         'CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html',
         'CompTIA/A+/1201/Final_Exam/connector-match-lab.html', 'EC-Council/CEH/index.html',
         'CLIs/Linux/index.html', 'IT-Knowledge-Base-Articles/AI/Ollama.html',
         'IT-Knowledge-Base-Articles/Kali-Linux/Wifite.html', 'Apps/index.html', 'Apps/Executables/index.html']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'test-results/navigation/interactions')
    args = parser.parse_args(); args.output.mkdir(parents=True, exist_ok=True); results = []

    def check(name, fn):
        try:
            details = fn(); results.append({'test': name, 'status': 'PASS', 'details': details})
        except Exception:
            results.append({'test': name, 'status': 'FAIL', 'error': traceback.format_exc()})
        print(results[-1]['status'], name, results[-1].get('error', '')[-1100:], flush=True)
        (args.output / 'results.json').write_text(json.dumps({'environment': 'LOCAL HTTP / real Chromium / external HTTPS blocked / production catalog / no mocks', 'checks': results}, ensure_ascii=False, indent=2), encoding='utf8')

    def static():
        count = 0
        for path in ROOT.rglob('*.html'):
            if 'test-results' in path.parts or any(x.startswith('Old') for x in path.parts): continue
            raw = path.read_text(encoding='utf8'); soup = BeautifulSoup(raw, 'html.parser'); count += 1
            navs = soup.select('.roadmap-global-nav'); assert len(navs) == 1, path
            links = navs[0].select('a'); assert [n['data-section'] for n in links] == SECTIONS, path
            assert [n.get_text() for n in links] == LABELS, path
            assert all(n.get_text(strip=True) for n in soup.select('nav')), path
            for node in soup.select('.roadmap-global-nav a,.project-breadcrumb a'):
                target = (path.parent / unquote(urlsplit(node['href']).path)).resolve()
                assert target.is_relative_to(ROOT) and target.is_file(), (path, node['href'])
            crumbs = soup.select('.project-breadcrumb')
            if path != ROOT / 'index.html':
                assert len(crumbs) == 1, path
                assert len(crumbs[0].select('li[aria-current="page"]')) == 1, path
                assert not crumbs[0].select('li[aria-current="page"] a'), path
            for node in soup.select('[data-learning-source]'):
                assert node['data-learning-source'] in CATALOG, (path, node)
        return {'pages': count, 'allGlobalAndBreadcrumbDestinationsExist': True}

    check('All published page navigation and catalog coverage', static)

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
        def log_message(self, *a): pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start(); base = f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as pw:
        browser = pw.chromium.launch()

        def context(language='en', width=390, javascript=True, theme='dark'):
            c = browser.new_context(viewport={'width': width, 'height': 844}, java_script_enabled=javascript)
            c.route('https://**/*', lambda r: r.abort())
            if javascript:
                c.add_init_script(f"if(!localStorage.getItem('projects-site-language'))localStorage.setItem('projects-site-language','{language}');localStorage.setItem('projects-roadmap-theme','{theme}');localStorage.setItem('kb_theme','{theme}')")
            return c

        def visit(c, route):
            p = c.new_page(); p.set_default_timeout(6000); errors = []
            p.on('pageerror', lambda error: errors.append(str(error)))
            assert p.goto(base + route, wait_until='networkidle').ok
            assert not errors, errors
            return p

        def routes(language):
            c = context(language); evidence = []
            for route in ['', *PAGES]:
                p = visit(c, route)
                expected = [CATALOG[x] for x in LABELS] if language == 'es' else LABELS
                assert p.locator('.roadmap-global-nav a').all_text_contents() == expected, route
                active = p.locator('.roadmap-global-nav [aria-current]').get_attribute('data-section')
                section = route.split('/')[0].lower() if '/' in route else 'home'
                assert active == section, (route, active)
                if route and route != 'index.html':
                    if p.locator('body').get_attribute('data-study-hub'):
                        assert p.locator('.study-course-select').input_value().endswith(route)
                    else:
                        assert p.locator('.project-breadcrumb [aria-current="page"]').inner_text().strip()
                    label = 'Course and module' if p.locator('body').get_attribute('data-study-course') else 'Breadcrumb'
                    assert p.locator('.project-breadcrumb').get_attribute('aria-label') == (CATALOG[label] if language == 'es' else label)
                assert p.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), route
                evidence.append({'route': route or '/', 'section': active, 'breadcrumb': p.locator('.project-breadcrumb').all_text_contents()})
                p.close()
            c.close(); return evidence

        for language in ['en', 'es']:
            check(f'Root/index aliases, nested active sections, visible labels and breadcrumbs: {language}', lambda language=language: routes(language))

        def nojs():
            c = context(javascript=False); count = 0
            for route in PAGES:
                p = visit(c, route)
                assert p.locator('.roadmap-global-nav a').all_text_contents() == LABELS
                assert p.locator('.roadmap-global-nav').is_visible()
                if p.locator('body').get_attribute('data-study-hub'):
                    # Compact course hubs use their real global section as the
                    # no-JS fallback; removed repository-folder crumbs are optional.
                    section = 'comptia' if route.startswith('CompTIA/') else 'ec-council'
                    parent = p.locator(f'.roadmap-global-nav [data-section="{section}"]')
                    assert parent.is_visible(); parent.click(); assert p.url.startswith(base)
                elif route != 'index.html':
                    parent = p.locator('.project-breadcrumb a').last
                    assert parent.is_visible(); parent.click(); assert p.url.startswith(base)
                else:
                    p.locator('.roadmap-global-nav [data-section="comptia"]').click()
                    assert p.url.endswith('/CompTIA/index.html')
                count += 1; p.close()
            c.close(); return {'pagesWithWorkingStaticParentLinks': count}
        check('JavaScript disabled: global and parent links remain usable', nojs)

        def keyboard():
            evidence = []
            for width in [320, 390, 768, 1440]:
                for theme in ['light', 'dark']:
                    c = context('es', width, theme=theme)
                    for route in ['index.html', 'Apps/Executables/index.html', 'IT-Knowledge-Base-Articles/AI/Ollama.html']:
                        p = visit(c, route); seen = set()
                        expected = set(p.locator('.roadmap-global-nav a,.project-breadcrumb a').all_text_contents())
                        for _ in range(45):
                            p.keyboard.press('Tab')
                            data = p.evaluate('''() => {const e=document.activeElement;if(!e.matches('.roadmap-global-nav a,.project-breadcrumb a'))return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:e.innerText,outline:parseFloat(s.outlineWidth),top:r.top,bottom:r.bottom,unobscured:e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}}''')
                            if data:
                                assert data['outline'] >= 3 and data['unobscured'] and data['top'] >= 0 and data['bottom'] <= 844, (route, width, theme, data)
                                seen.add(data['text'])
                                if seen == expected: break
                        assert seen == expected, (route, width, theme, seen, expected)
                        evidence.append({'page': route, 'width': width, 'theme': theme, 'focusedLinks': len(seen)})
                        p.close()
                    c.close()
            return evidence
        check('Keyboard focus visible and unobscured at all four widths, both themes', keyboard)

        def empty():
            c = context(); p = visit(c, 'Apps/index.html'); evidence = []
            assert p.locator('.card').count() == 4
            for card in p.locator('.card').all():
                route = card.get_attribute('href'); expected = 'No releases yet' if route.startswith('Executables') else 'No tools published yet'
                assert card.locator('.directory-status').inner_text() == expected
                assert card.locator('.directory-link').inner_text() == 'Open directory'
                child = visit(c, 'Apps/' + route)
                assert child.locator('.note').inner_text() == expected
                assert child.locator('a[download],a[href$=".exe"],a[href$=".zip"]').count() == 0
                child.locator('.site-language-settings summary').click()
                child.locator('#site-language-select').select_option('es')
                child.wait_for_function("document.querySelector('.note').lang==='es'")
                assert child.locator('.note').inner_text() == CATALOG[expected]
                assert child.locator('.roadmap-global-nav a').all_text_contents() == [CATALOG[x] for x in LABELS]
                child.locator('#site-language-select').select_option('en'); assert child.locator('.note').inner_text() == expected
                assert child.locator('.roadmap-global-nav a').all_text_contents() == LABELS
                evidence.append({'directory': route, 'english': expected, 'spanish': CATALOG[expected]}); child.close()
            c.close(); return evidence
        check('Empty directory cards/destinations, honest availability and language round trips', empty)

        def versions():
            c = context(); evidence = []
            for version in ['1', '2']:
                p = visit(c, 'CompTIA/A+/1201/Final_Exam/index.html?version=' + version)
                actual = p.locator('.exam-card.active').get_attribute('href')
                assert 'version=' + version in actual, (version, actual)
                assert p.locator('fieldset.question-card').count() == 90
                evidence.append({'query': version, 'activeLink': actual, 'questions': 90}); p.close()
            c.close(); return evidence
        check('Final exam version query parameters', versions)
        browser.close()
    server.shutdown(); server.server_close()
    raise SystemExit(any(x['status'] != 'PASS' for x in results))


if __name__ == '__main__': main()
