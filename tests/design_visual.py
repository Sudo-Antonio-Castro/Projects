"""Deterministic /Projects/ local-HTTP captures and calibrated same-machine comparison.

Use --output BEFORE before refactoring, then --output AFTER --baseline BEFORE.
Baseline PNGs are not portable across OS/browser/font changes. No golden updates
or masks are automatic. An unmodified-main repeat measured one RGB-level rounding
in at most 15 pixels/frame; only that bounded raster noise is accepted.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
import argparse, json, threading, time, sys

ROOT=Path(__file__).resolve().parents[1]
TIMED='CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html'
CASES={'home':'index.html','comptia':'CompTIA/index.html','assessment-start':TIMED,
    'assessment-active':TIMED,'assessment-result':TIMED,'cli':'CLIs/Linux/index.html',
    'connector':'CompTIA/A+/1201/Final_Exam/connector-match-lab.html',
    'article':'IT-Knowledge-Base-Articles/AI/Ollama.html','apps':'Apps/index.html','progress':'progress/index.html',
    'linux-hub':'CompTIA/Linux+/index.html','ceh-hub':'EC-Council/CEH/index.html'}
MATRIX=[(320,'en','light'),(390,'es','dark'),(768,'es','light'),(1440,'en','dark')]

def compare(before,after):
    result={'sameDimensions':before.size==after.size,'changedPixels':None,'maxChannelDelta':None,'significantPixels':None,'status':'FAIL'}
    if before.size!=after.size:return result
    diff=ImageChops.difference(before,after);box=diff.getbbox()
    values=list(diff.crop(box).getdata()) if box else []
    result.update(changedPixels=sum(p!=(0,0,0) for p in values),maxChannelDelta=max((max(p) for p in values),default=0),significantPixels=sum(max(p)>1 for p in values))
    if result['significantPixels']==0 and result['changedPixels']<=15:result['status']='PASS'
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--baseline',type=Path);parser.add_argument('--site-root',type=Path,default=ROOT);args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    # Keep the measured noise allowance tightly bounded and geometry exact.
    blank=Image.new('RGB',(20,20));noise=blank.copy()
    for x in range(15):noise.putpixel((x,0),(1,1,1))
    assert compare(blank,noise)['status']=='PASS'
    noise.putpixel((15,0),(1,1,1));assert compare(blank,noise)['status']=='FAIL'
    noise=blank.copy();noise.putpixel((0,0),(2,0,0));assert compare(blank,noise)['status']=='FAIL'
    assert compare(blank,Image.new('RGB',(20,21)))['status']=='FAIL'
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=str(args.site_root),**kw)
        def translate_path(self,path):return super().translate_path(path.removeprefix('/Projects'))
        def log_message(self,*a):pass
        def copyfile(self,*a):
            try:super().copyfile(*a)
            except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):pass
    class Server(ThreadingHTTPServer):
        # Browsers request many local assets together; avoid connection refusal
        # from the small socketserver backlog on Windows under test load.
        request_queue_size=128
    server=Server(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/Projects/'
    rows=[];started=time.monotonic()
    with sync_playwright() as pw:
        browser=pw.chromium.launch()
        for width,lang,theme in MATRIX:
            for name,route in CASES.items():
                c=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce');c.route('https://**/*',lambda r:r.abort())
                c.add_init_script(f"localStorage.setItem('projects-site-language','{lang}');localStorage.setItem('projects-roadmap-theme','{theme}');localStorage.setItem('kb_theme','{theme}')")
                p=c.new_page();p.set_default_timeout(10000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
                p.clock.set_fixed_time(datetime(2026,10,19,18,tzinfo=timezone.utc))
                if name in ['progress','home']:
                    p.goto(base+'CLIs/Linux/index.html',wait_until='networkidle');p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter')
                p.goto(base+route,wait_until='networkidle')
                if name.startswith('assessment'):
                    p.locator('#quizForm[data-initialized=true]').wait_for(state='attached')
                    if name!='assessment-start':
                        p.locator('#startAssessment').click();p.locator('input[type=radio]').first.check()
                        p.locator('.assessment-overview summary').click();p.locator('.assessment-flag').first.click()
                    if name=='assessment-result':p.locator('button[type=submit]').click();p.locator('#confirmSubmit').click()
                if name=='cli':p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter');p.locator('#cmdInput').fill('ls -')
                p.wait_for_function('window.ProjectsLearningLocale?.ready === true')
                # An empty progress container is not a valid baseline. Its
                # script can finish after locale startup on a busy runner.
                p.wait_for_function("[...document.querySelectorAll('[data-progress-track],#progress-list')].every(n => n.childElementCount > 0)")
                if name=='home':p.locator('#continue-learning .learning-activity').wait_for()
                p.evaluate('document.fonts.ready');p.wait_for_timeout(150)
                assert not errors,(name,errors)
                assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(name,width)
                filename=f'{name}-{width}-{lang}-{theme}.png';target=args.output/filename
                p.screenshot(path=str(target),full_page=True,animations='disabled',caret='hide')
                row={'case':name,'width':width,'language':lang,'theme':theme,'file':filename,'overflow':False,'status':'PASS'}
                if args.baseline:
                    before=Image.open(args.baseline/filename).convert('RGB');after=Image.open(target).convert('RGB')
                    row.update(compare(before,after))
                rows.append(row);c.close();print(row,flush=True)
                (args.output/'results.json').write_text(json.dumps({'mode':'Real Chromium / local HTTP mounted at /Projects/ / external HTTPS blocked / fixed Date fixture / actual local catalog / exact dimensions, no masks, <=15 pixels with <=1 RGB-level rounding calibrated on unmodified main','seconds':round(time.monotonic()-started,1),'checks':rows},indent=2),encoding='utf8')
        browser.close()
    server.shutdown();sys.exit(any(r['status']!='PASS' for r in rows))
if __name__=='__main__':main()
