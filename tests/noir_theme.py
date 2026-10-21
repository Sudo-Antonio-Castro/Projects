"""Optional noir: real Chromium/local HTTP, actual catalog, external HTTPS blocked.
No mocks for navigation or rendering. Storage-denial/malformed inputs are fixtures.
Run alongside all existing suites; screenshots compare all three themes on one OS.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
from design_visual import CASES, TIMED
import argparse, json, threading, traceback

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'assets/learning-es.json').read_text(encoding='utf8'))
THEME_KEY = 'projects-roadmap-theme'
CASES = {**CASES,
    'assessment-bank-start':'CompTIA/A+/1202/Final_Exam/index.html',
    'assessment-bank-active':'CompTIA/A+/1202/Final_Exam/index.html',
    'assessment-bank-result':'CompTIA/A+/1202/Final_Exam/index.html',
    'assessment-dialog':TIMED}
CONNECTOR = CASES['connector']
ARTICLE = CASES['article']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT/'test-results/noir/browser')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)
        def translate_path(self, route):
            return super().translate_path(route.removeprefix('/Projects'))
        def log_message(self, *a):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/Projects/'
    rows = []

    def record(name, fn):
        try:
            detail = fn()
            rows.append({'test':name, 'status':'PASS', 'detail':detail})
        except Exception:
            rows.append({'test':name, 'status':'FAIL', 'error':traceback.format_exc()})
        print(rows[-1], flush=True)
        (args.output/'results.json').write_text(json.dumps({
            'mode':'Real Chromium / local HTTP at /Projects/ / external HTTPS blocked / actual Spanish catalog',
            'checks':rows}, ensure_ascii=False, indent=2), encoding='utf8')

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()

            def context(theme='noir', width=390, language='en', legacy=False, deny=False):
                c = browser.new_context(viewport={'width':width,'height':900}, reduced_motion='reduce')
                c.route('https://**/*', lambda r:r.abort())
                key = 'kb_theme' if legacy else THEME_KEY
                # Once per tab, so real user changes survive subsequent navigation/reload.
                if not deny:
                    c.add_init_script(f"""
                  if (!sessionStorage.getItem('noir-test-initialized')) {{
                    localStorage.setItem({json.dumps(key)}, {json.dumps(theme)});
                    localStorage.setItem('projects-site-language', {json.dumps(language)});
                    sessionStorage.setItem('noir-test-initialized','1');
                  }}
                """)
                if deny:
                    c.add_init_script("""Storage.prototype.getItem = function(){throw new Error('Storage denied fixture')};
                      Storage.prototype.setItem = function(){throw new Error('Storage denied fixture')};""")
                return c

            def ready(p, route):
                p.goto(base+route, wait_until='networkidle')
                p.wait_for_function('window.ProjectsLearningLocale?.ready === true')
                assert p.evaluate('document.documentElement.scrollWidth <= innerWidth'), route

            def theme(p):
                return p.locator('html').get_attribute('data-theme')

            def tab_to(p, selector):
                for _ in range(100):
                    if p.locator(selector).evaluate('e=>e===document.activeElement'):
                        return
                    p.keyboard.press('Tab')
                raise AssertionError('Unreachable by Tab: '+selector)

            def functional():
                with context('dark') as c:
                    p = c.new_page()
                    ready(p, 'index.html')
                    tab_to(p, '#themeBtn')
                    assert p.locator('#themeBtn').get_attribute('aria-label') == 'Use noir theme'
                    p.keyboard.press('Enter')
                    assert theme(p) == 'noir'
                    for route in ['CompTIA/index.html', ARTICLE, CONNECTOR, 'progress/index.html']:
                        ready(p, route)
                        assert theme(p) == 'noir'
                        p.reload(wait_until='networkidle')
                        assert theme(p) == 'noir'
                    for expected in ['light','dark','noir']:
                        p.locator('#themeBtn').focus()
                        p.keyboard.press('Space')
                        assert theme(p) == expected
                        assert p.evaluate("localStorage.getItem('projects-roadmap-theme')") == expected
                        assert p.evaluate("localStorage.getItem('kb_theme')") == expected
                    before = p.evaluate('JSON.stringify({...localStorage})')
                    p.locator('.site-language-settings summary').click()
                    p.locator('#site-language-select').select_option('es')
                    p.wait_for_function('window.ProjectsLearningLocale?.language === "es" && window.ProjectsLearningLocale?.ready')
                    assert theme(p) == 'noir'
                    assert p.locator('#themeBtn').get_attribute('aria-label') == CATALOG['Use light theme']
                    p.locator('#themeBtn').click()  # light
                    assert p.locator('#themeBtn').get_attribute('aria-label') == CATALOG['Use dark theme']
                    p.locator('#themeBtn').click()  # dark
                    assert p.locator('#themeBtn').get_attribute('aria-label') == CATALOG['Use noir theme']
                    p.locator('#themeBtn').click()  # noir
                    after = p.evaluate('JSON.stringify({...localStorage})')
                    a, b = json.loads(before), json.loads(after)
                    for key in set(a)|set(b):
                        if key != 'projects-site-language':
                            assert a.get(key) == b.get(key), key
                return 'Tab/Enter/Space, three-theme cycle, reload/navigation and local Spanish labels; unrelated storage retained'
            record('Theme control, persistence and language', functional)

            def preferences():
                for legacy in [False, True]:
                    for saved in ['light','dark','noir','malformed-theme']:
                        with context(saved, legacy=legacy) as c:
                            p = c.new_page()
                            ready(p, 'index.html')
                            assert theme(p) == (saved if saved != 'malformed-theme' else 'dark')
                for route in ['index.html',TIMED,'CLIs/Linux/index.html',CONNECTOR,ARTICLE]:
                    with context(deny=True) as c:
                        p = c.new_page()
                        errors = []
                        p.on('pageerror', lambda e:errors.append(str(e)))
                        ready(p, route)
                        initial = theme(p)
                        p.locator('#themeBtn').click()
                        assert theme(p) != initial
                        assert not errors, errors
                return 'Old/current preferences, malformed default and storage-denial fixtures'
            record('Preference compatibility and unavailable storage', preferences)

            def learning():
                with context() as c:
                    p = c.new_page()
                    ready(p,'CLIs/Linux/index.html')
                    terminal = p.locator('.screen')
                    colors = []
                    for skin in ['light','dark','noir']:
                        p.evaluate('(t)=>document.documentElement.dataset.theme=t',skin)
                        colors.append(terminal.evaluate('e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).color]'))
                    assert colors[0] == colors[1] == colors[2], colors
                    p.locator('#cmdInput').fill('pwd')
                    p.locator('#cmdInput').press('Enter')
                    p.locator('#cmdInput').fill('ls -')
                    p.reload(wait_until='networkidle')
                    assert p.locator('#cmdInput').input_value() == 'ls -'
                    ready(p,TIMED)
                    p.locator('#startAssessment').click()
                    first = p.locator('.question').first
                    first.locator('input[type=radio]').first.check()
                    p.locator('.assessment-flag').first.click()
                    assert p.locator('.assessment-flag').first.get_attribute('aria-pressed') == 'true'
                    before = p.evaluate('JSON.stringify({...sessionStorage})')
                    p.locator('#themeBtn').click()
                    p.locator('#themeBtn').click()
                    p.locator('#themeBtn').click()
                    assert p.evaluate('JSON.stringify({...sessionStorage})') == before
                    p.locator('button[type=submit]').click()
                    assert p.locator('.assessment-confirmation').is_visible()
                    p.locator('#confirmSubmit').click()
                    assert p.locator('#results').is_visible()
                    assert p.locator('.answer-feedback').first.inner_text().strip()
                    assert p.locator('input[type=radio]:enabled').count() == 0
                    ready(p,CONNECTOR)
                    tab_to(p,'button.cable-card[data-cable-id="c2"]')
                    p.keyboard.press('Space')
                    tab_to(p,'button.port-card[data-port-id="eth-wall"]')
                    assert float(p.locator(':focus').evaluate('e=>parseFloat(getComputedStyle(e).outlineWidth)')) >= 3
                    p.keyboard.press('Enter')
                    assert p.locator('button.port-card[data-port-id="eth-wall"]').get_attribute('aria-disabled') == 'true'
                return {'terminalColorsIdentical':colors, 'assessmentAndConnector':'Actual interaction, text feedback and locked review'}
            record('Learning behavior and terminal colors', learning)

            for width in [320,390,768,1440]:
                for language in ['en','es']:
                    for skin in ['light','dark','noir']:
                        for name, route in CASES.items():
                            def capture(name=name,route=route,width=width,language=language,skin=skin):
                                with context(skin,width,language) as c:
                                    p = c.new_page()
                                    errors = []
                                    p.on('pageerror',lambda e:errors.append(str(e)))
                                    if name in ['home','progress']:
                                        ready(p,'CLIs/Linux/index.html')
                                        p.locator('#cmdInput').fill('pwd')
                                        p.locator('#cmdInput').press('Enter')
                                    ready(p,route)
                                    if name.startswith('assessment'):
                                        if not name.endswith('-start'):
                                            p.locator('#startAssessment').click()
                                            p.locator('input[type=radio]').first.check()
                                            p.locator('.assessment-flag').first.click()
                                        if name.endswith(('-result','-dialog')):
                                            p.locator('button[type=submit]').click()
                                            if name.endswith('-result'):
                                                p.locator('#confirmSubmit').click()
                                    assert theme(p) == skin
                                    assert not errors, errors
                                    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                                    if skin == 'noir' and name.startswith('assessment'):
                                        target = '.assessment-start' if name.endswith('-start') else '.assessment-confirmation' if name.endswith('-dialog') else '.question,.question-card'
                                        colors = p.locator(target).first.evaluate('e=>({background:getComputedStyle(e).backgroundColor,text:getComputedStyle(e).color})')
                                        assert colors['background'] == 'rgb(238, 227, 202)', colors
                                        assert colors['text'] == 'rgb(37, 33, 26)', colors
                                    filename = f'{name}-{width}-{language}-{skin}.png'
                                    p.screenshot(path=str(args.output/filename),full_page=True,animations='disabled')
                                    return {'file':filename,'overflow':False}
                            record(f'{name}/{width}/{language}/{skin}',capture)
            browser.close()
    finally:
        server.shutdown()
    raise SystemExit(any(row['status']=='FAIL' for row in rows))

if __name__ == '__main__':
    main()
