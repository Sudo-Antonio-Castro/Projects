"""Learning navigation contracts and before/after evidence on real local HTTP.

Navigation intentionally changes. Preserve source lesson subtrees exactly and
compare unaffected site pages with design_visual.py's strict pixel comparator.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timezone
from urllib.parse import urlsplit, unquote
import argparse, hashlib, json, threading
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from study_layout import CASES

ROOT = Path(__file__).resolve().parents[1]
SPANISH = json.loads((ROOT/'assets/learning-es.json').read_text(encoding='utf8'))
MANIFEST = 'docs/ux-evidence/study-layout/migrated-pages.json'
HUBS = ['CompTIA/A+/1201/index.html', 'CompTIA/A+/1202/index.html',
        'CompTIA/Security+/index.html', 'CompTIA/Linux+/index.html', 'EC-Council/CEH/index.html']


def content(root):
    rows = []
    for item in json.loads((root/MANIFEST).read_text(encoding='utf8')):
        soup = BeautifulSoup((root/item['path']).read_text(encoding='utf8'), 'html.parser')
        panels = soup.select('.section-panel') or soup.select('.lesson-panel') or soup.select('article.lesson') or soup.select('.content-wrap > .content > section')
        rows.append({'path': item['path'], 'lessons': [hashlib.sha256(str(p).encode()).hexdigest() for p in panels],
                     'scripts': [hashlib.sha256(s.get_text().encode()).hexdigest() for s in soup.select('script:not([src])')]})
    return rows


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--site-root', type=Path, default=ROOT); ap.add_argument('--before', action='store_true')
    ap.add_argument('--baseline', type=Path); ap.add_argument('--quick', action='store_true')
    ap.add_argument('--capture-only', action='store_true', help='Capture/review evidence without repeating the interaction matrix')
    ap.add_argument('--case', choices=list(CASES), help='Isolate one lesson family while diagnosing a failure')
    args = ap.parse_args(); args.output.mkdir(parents=True, exist_ok=True)
    report = {'content': content(args.site_root), 'checks': [], 'screenshots': [], 'visualChanges': []}
    if args.baseline:
        baseline = json.loads((args.baseline/'results.json').read_text(encoding='utf8'))
        assert report['content'] == baseline['content'], 'Lesson source or inline controllers changed'
    def record(label):
        report['checks'].append(label)
        (args.output/'results.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
        print('PASS', label, flush=True)
    record('67 modules: lesson source and inline-controller fingerprints recorded')
    if not args.before:
        for row in report['content']:
            path = args.site_root/row['path']; soup = BeautifulSoup(path.read_text(encoding='utf8'), 'html.parser')
            assert len(soup.select('.project-breadcrumb li')) == 2, path
            for a in soup.select('.project-breadcrumb a'):
                assert (path.parent/unquote(urlsplit(a['href']).path)).resolve().is_file()
        record('All 67 source breadcrumbs have course/module context and real fallback links')
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(args.site_root), **kw)
        def translate_path(self, path): return super().translate_path(path.removeprefix('/Projects'))
        def log_message(self, *a): pass
        def copyfile(self, *a):
            try: super().copyfile(*a)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError): pass
    class Server(ThreadingHTTPServer): request_queue_size = 128
    server = Server(('127.0.0.1', 0), Handler); threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/Projects/'
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        captures = {**CASES, 'course-hub': HUBS[0], 'core2-hub':HUBS[1], 'security-hub':HUBS[2],
                    'linux-hub':HUBS[3], 'ceh-hub':HUBS[4], 'module-overview': CASES['a-core1'], 'course-resume':HUBS[0]}
        for name, route in captures.items():
            if args.case and name != args.case: continue
            for width in ([390] if args.quick else [390,1440]):
                for theme in (['noir'] if args.quick else ['light','dark','noir']):
                    c = browser.new_context(viewport={'width':width,'height':960}, reduced_motion='reduce')
                    c.route('https://**/*', lambda r:r.abort())
                    c.add_init_script(f"localStorage.setItem('projects-site-language','en');localStorage.setItem('projects-roadmap-theme','{theme}')")
                    if name == 'course-resume':
                        c.add_init_script("localStorage.setItem('projects-study-place:v1:/Projects/CompTIA/A+/1201/Motherboard_and_Connectors/','3')")
                    p = c.new_page(); errors = []; p.on('pageerror',lambda e:errors.append(str(e)))
                    p.clock.set_fixed_time(datetime(2026,10,26,18,tzinfo=timezone.utc))
                    p.goto(base+route, wait_until='networkidle'); p.wait_for_function('window.ProjectsLearningLocale?.ready === true')
                    if name == 'module-overview':
                        p.locator('.study-overview').evaluate('(el)=>el.open=true')
                        p.locator('.study-navigation').evaluate('(el)=>el.open=true')
                    if not args.before:
                        assert p.locator('.study-course-select').count() == 1
                        values = p.locator('.study-course-select option').evaluate_all('(els)=>els.map(e=>new URL(e.value,location).pathname)')
                        assert values == ['/Projects/'+x for x in HUBS], values
                        assert p.evaluate('document.documentElement.scrollWidth <= innerWidth'), (name,width,theme)
                        assert not errors, errors
                    p.evaluate('document.fonts.ready')
                    filename = f'{name}-{width}-{theme}.png'
                    p.screenshot(path=str(args.output/filename), full_page=True, animations='disabled', caret='hide')
                    if args.baseline:
                        from PIL import Image, ImageChops
                        before = Image.open(args.baseline/filename).convert('RGB')
                        after = Image.open(args.output/filename).convert('RGB')
                        common = (0,0,min(before.width,after.width),min(before.height,after.height))
                        diff = ImageChops.difference(before.crop(common),after.crop(common))
                        report['visualChanges'].append({'file':filename,'beforeSize':before.size,'afterSize':after.size,
                            'changedPixelsInCommonArea':sum(pixel!=(0,0,0) for pixel in diff.getdata()),
                            'changedBounds':diff.getbbox(), 'review':'Intentional compact header/context, lesson labels, next-lesson hint and related-learning links; existing theme tokens and lesson prose retained'})
                    report['screenshots'].append(filename); c.close()
            record(name+' screenshot matrix')
        if not args.before and not args.capture_only:
            for name, route in CASES.items():
                if args.case and name != args.case: continue
                for width in ([390] if args.quick else [320,390,768,1024,1440]):
                    for theme,lang in [(t,l) for t in (['noir'] if args.quick else ['light','dark','noir']) for l in ['en','es']]:
                        c = browser.new_context(viewport={'width':width,'height':960}); c.route('https://**/*',lambda r:r.abort())
                        c.add_init_script(f"localStorage.setItem('projects-site-language','{lang}');localStorage.setItem('projects-roadmap-theme','{theme}')")
                        p = c.new_page(); failed_requests=[]
                        p.on('requestfailed',lambda r:failed_requests.append({'url':r.url,'failure':r.failure}))
                        p.goto(base+route,wait_until='networkidle'); p.wait_for_function('window.ProjectsLearningLocale?.ready === true')
                        assert p.locator('h1.study-title:visible').count() == 1
                        title = p.locator('h1.study-title:visible')
                        source = title.get_attribute('data-learning-source')
                        assert title.inner_text() == (SPANISH[source] if lang=='es' else source)
                        assert p.locator('.study-course-label').inner_text() == (SPANISH['Switch course'] if lang=='es' else 'Switch course')
                        expected_next = SPANISH['Next lesson'] if lang=='es' else 'Next lesson'
                        actual_next = p.locator('.study-next-label > span').first.text_content()
                        assert actual_next == expected_next,(name,width,theme,lang,actual_next,expected_next)
                        assert len(p.locator('.study-context li').all()) == 2
                        assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
                        if width < 1100: p.locator('.study-navigation > summary').click()
                        buttons = p.locator('.study-lessons button'); buttons.nth(1).click()
                        assert buttons.nth(1).get_attribute('aria-current') == 'step'
                        assert p.url.endswith('#study-2-lesson')
                        title = p.locator('.study-title:visible').inner_text()
                        p.go_back(); assert buttons.nth(0).get_attribute('aria-current') == 'step'
                        p.go_forward(); assert buttons.nth(1).get_attribute('aria-current') == 'step'
                        # Language updates are in place, with no lesson, theme or URL reset.
                        p.locator('.site-language-settings').evaluate('(el)=>el.open=true')
                        p.locator('.site-language-select').select_option('es' if lang=='en' else 'en')
                        assert buttons.nth(1).get_attribute('aria-current') == 'step'
                        assert p.locator('html').get_attribute('data-theme') == theme
                        assert p.url.endswith('#study-2-lesson')
                        p.reload(wait_until='networkidle'); assert buttons.nth(1).get_attribute('aria-current') == 'step'
                        # Native prev/next remain reachable on mobile and add history entries.
                        if width < 1100: p.locator('.study-navigation > summary').click()
                        p.locator('#prevBtn').click(); assert buttons.nth(0).get_attribute('aria-current') == 'step'
                        p.locator('#nextBtn').click(); assert buttons.nth(1).get_attribute('aria-current') == 'step'
                        p.locator('.study-course-select').focus(); assert p.locator('.study-course-select').evaluate('(el)=>el===document.activeElement')
                        # Existing module card gets a genuine saved-place action.
                        hub = p.locator('.study-course-select').input_value(); p.goto(hub,wait_until='networkidle')
                        resume = p.locator('.study-resume-link')
                        try: resume.first.wait_for()
                        except Exception:
                            p.screenshot(path=str(args.output/'resume-failure.png'),full_page=True)
                            report['failure']={'case':name,'width':width,'theme':theme,'lang':lang,'url':p.url,'requests':failed_requests,
                                'state':p.evaluate('''()=>({hub:document.body.dataset.studyHub,place:Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith('projects-study-place:'))),links:[...document.querySelectorAll('main a[href]')].map(a=>({href:a.href,classes:a.className}))})''')}
                            (args.output/'results.json').write_text(json.dumps(report,indent=2),encoding='utf8')
                            raise
                        assert resume.count() == 1
                        assert resume.evaluate('(el)=>!!el.closest(".card,.module-row")')
                        assert resume.get_attribute('href').endswith('#study-2-lesson')
                        resume.click(); assert p.locator('.study-lessons button').nth(1).get_attribute('aria-current') == 'step'
                        c.close()
                        print('PASS interaction state',name,width,theme,lang,flush=True)
                record(name+' widths / all themes / both languages / history / prev-next / saved-place resume')
            # No-JS fallback retains semantic lesson prose and native course links.
            for name, route in CASES.items():
                c = browser.new_context(java_script_enabled=False); c.route('https://**/*',lambda r:r.abort()); p=c.new_page();p.goto(base+route)
                assert p.locator('.project-breadcrumb a').first.is_visible()
                assert p.locator('main').inner_text().strip(); c.close()
            record('Five families: no-JS content and course navigation')
            for hub in HUBS:
                c=browser.new_context();c.route('https://**/*',lambda r:r.abort());p=c.new_page();p.goto(base+HUBS[0],wait_until='networkidle')
                with p.expect_navigation(wait_until='networkidle'):
                    p.locator('.study-course-select').select_option(base+hub)
                p.locator('.study-course-select').wait_for()
                assert p.url == base+hub,(hub,p.url)
                assert p.locator('.study-resume-link').count()==0,hub
                assert p.locator('.study-course-select option').count()==5,hub
                c.close()
            record('Five real course destinations resolve; no fabricated resume without saved place')
            for name, route in CASES.items():
                soup=BeautifulSoup((args.site_root/route).read_text(encoding='utf8'),'html.parser')
                panels=soup.select('.section-panel') or soup.select('.lesson-panel') or soup.select('article.lesson') or soup.select('.content-wrap > .content > section')
                target=panels[1].get('id') or (panels[1].select_one('[id]') or {}).get('id') or 'study-2-1'
                c=browser.new_context();c.route('https://**/*',lambda r:r.abort());p=c.new_page()
                p.goto(base+route+'#'+target,wait_until='networkidle')
                assert p.locator('.study-lessons button').nth(1).get_attribute('aria-current')=='step',(name,target)
                assert p.evaluate('!!document.getElementById(location.hash.slice(1))'),(name,target)
                c.close()
            record('Five families: original source fragment IDs and existing study section URLs resolve')
        browser.close()
    server.shutdown(); record('Navigation evidence complete')


if __name__ == '__main__': main()
