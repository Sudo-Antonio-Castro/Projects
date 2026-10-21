"""Real HTTP study-layout evidence and interaction checks; --before captures originals."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
import argparse, json, threading

ROOT = Path(__file__).resolve().parents[1]
CASES = {
    'a-core1': 'CompTIA/A+/1201/Motherboard_and_Connectors/index.html',
    'a-core2': 'CompTIA/A+/1202/Windows_Tools_and_Management/index.html',
    'security': 'CompTIA/Security+/Security_Foundations_and_Control_Models/index.html',
    'ceh': 'EC-Council/CEH/Ethical_Hacking_Essentials/index.html',
    'linux': 'CompTIA/Linux+/modules/linux-landscape-and-server-roles/index.html',
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--before', action='store_true')
    ap.add_argument('--case', choices=list(CASES))
    ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args(); args.output.mkdir(parents=True, exist_ok=True)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
        def translate_path(self, path): return super().translate_path(path.removeprefix('/Projects'))
        def log_message(self, *a): pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/Projects/'
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name, route in CASES.items():
            if args.case and args.case != name: continue
            for width, lang, theme in [(1672,'en','light'), (1440,'en','dark'), (1440,'en','noir'), (768,'es','light'), (390,'es','dark'), (320,'en','light')]:
                print(name,width,lang,theme,flush=True)
                context = browser.new_context(viewport={'width':width,'height':960}, reduced_motion='reduce')
                context.route('https://**/*', lambda r: r.abort())
                context.add_init_script(f"localStorage.setItem('projects-roadmap-theme','{theme}');localStorage.setItem('projects-site-language','{lang}')")
                page = context.new_page(); errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(base+route, wait_until='networkidle')
                page.wait_for_function('window.ProjectsLearningLocale?.ready === true')
                if not args.before:
                    assert not errors, (name,width,errors)
                    page.locator('.study-layout').wait_for()
                    contrast = page.locator('.study-title:visible').evaluate('''el => {
                      const ctx = document.createElement('canvas').getContext('2d');
                      const rgb = color => { ctx.clearRect(0,0,1,1); ctx.fillStyle=color; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data]; };
                      const lum = c => c.slice(0,3).map(x => {x/=255; return x<=.04045 ? x/12.92 : ((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
                      let parent=el, bg;
                      while(parent) { bg=rgb(getComputedStyle(parent).backgroundColor); if(bg[3]===255) break; parent=parent.parentElement; }
                      const a=lum(rgb(getComputedStyle(el).color)), b=lum(bg);
                      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
                    }''')
                    assert contrast >= 4.5,(name,width,theme,'title contrast',contrast)
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (name,width,'overflow')
                    buttons = page.locator('.study-lessons button')
                    count = buttons.count(); assert count > 1
                    if width < 1100 and not page.locator('.study-navigation').evaluate('(e)=>e.open'): page.locator('.study-navigation > summary').click()
                    buttons.nth(1).click()
                    assert buttons.nth(1).get_attribute('aria-current') == 'step'
                    page.wait_for_function("document.querySelector('.study-position').textContent.startsWith('2 /')")
                    assert page.locator('.study-toc a').count() > 0
                    page.locator('.study-toc a').first.click()
                    assert page.evaluate('!!document.getElementById(location.hash.slice(1))')
                    page.reload(wait_until='networkidle')
                    assert page.locator('.study-lessons button').nth(1).get_attribute('aria-current') == 'step'
                    # Last lesson and native previous/next controller boundaries.
                    if width < 1100 and not page.locator('.study-navigation').evaluate('(e)=>e.open'): page.locator('.study-navigation > summary').click()
                    page.locator('.study-lessons button').last.click()
                    assert page.locator('#nextBtn').is_disabled()
                    if width < 1100 and not page.locator('.study-navigation').evaluate('(e)=>e.open'): page.locator('.study-navigation > summary').click()
                    page.locator('#prevBtn').click()
                    assert not page.locator('#nextBtn').is_disabled()
                    page.locator('.study-lessons button').first.click()
                    assert page.locator('#prevBtn').is_disabled()
                    page.locator('.study-toc a').first.focus()
                    assert page.evaluate("document.activeElement.matches('.study-toc a')")
                    if width < 1100 and page.locator('.study-navigation').evaluate('(e)=>e.open'): page.locator('.study-navigation > summary').click()
                    page.locator('.study-title:visible').scroll_into_view_if_needed()
                    page.evaluate('window.scrollTo(0,0)')
                    assert not errors, errors
                file = f'{name}-{width}-{lang}-{theme}.png'
                page.screenshot(path=str(args.output/file), full_page=True, animations='disabled')
                results.append({'case':name,'width':width,'language':lang,'theme':theme,'status':'PASS','screenshot':file})
                (args.output/'results.json').write_text(json.dumps(results,indent=2),encoding='utf8')
                context.close()
        if not args.before and not args.case:
            inventory = json.loads((ROOT/'docs/ux-evidence/study-layout/migrated-pages.json').read_text())
            context = browser.new_context(viewport={'width':1440,'height':960})
            context.route('https://**/*',lambda r:r.abort())
            page = context.new_page()
            sweep_errors = []
            page.on('pageerror',lambda e:sweep_errors.append(str(e)))
            for item in inventory:
                page.goto(base+item['path'],wait_until='domcontentloaded')
                page.locator('.study-layout').wait_for()
                assert page.locator('.study-lessons button').count() == item['lessons'],item
                assert page.locator('.study-title:visible').count() == 1,item
                page.locator('.study-lessons button').last.click()
                assert page.locator('#nextBtn').is_disabled(),item
                assert not sweep_errors,(item,sweep_errors)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),item
            (args.output/'inventory-check.json').write_text(json.dumps({'status':'PASS','modules':len(inventory),'lessons':sum(i['lessons'] for i in inventory)},indent=2))
            context.close()
            context = browser.new_context(java_script_enabled=False)
            context.route('https://**/*',lambda r:r.abort())
            page = context.new_page(); page.goto(base+CASES['ceh'])
            assert page.locator('article.lesson').first.is_visible()
            context.close()
            context = browser.new_context()
            context.route('https://**/*',lambda r:r.abort())
            context.add_init_script("Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); }; Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };")
            page = context.new_page(); page.goto(base+CASES['a-core1'])
            page.locator('.study-lessons button').nth(1).click()
            page.wait_for_function("document.querySelector('.study-position').textContent.startsWith('2 /')")
            context.close()
        browser.close()
    server.shutdown()
    print(f'PASS {len(results)} study layout states', flush=True)

if __name__ == '__main__': main()
