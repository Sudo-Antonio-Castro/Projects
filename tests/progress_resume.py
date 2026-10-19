"""Real Chromium/local HTTP progress and resume regression.

Ordinary interaction checks, controlled storage/clock fixtures and screenshots
are identified separately. External resources are blocked; no translation mock.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
import argparse, json, threading, traceback, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
QUIZ = 'CompTIA/A+/1201/Quiz_System_Devices/index.html'
TIMED = 'CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html'
FINAL = 'CompTIA/A+/1201/Final_Exam/index.html?version=2'
CLI = 'CLIs/Linux/index.html'
KEY = 'projects-learning-progress'
CAT = json.loads((ROOT/'assets/learning-es.json').read_text(encoding='utf8'))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,default=ROOT/'test-results/progress/local')
    parser.add_argument('--match',action='append')
    args=parser.parse_args(); args.output.mkdir(parents=True,exist_ok=True); checks=[]
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
        def log_message(self,*a):pass
        def copyfile(self, source, output):
            try:super().copyfile(source,output)
            except (ConnectionAbortedError,ConnectionResetError,BrokenPipeError):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start(); base=f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as pw:
        browser=pw.chromium.launch(); contexts=[]; errors=[]
        def context(width=390,lang='en',theme='dark'):
            c=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');contexts.append(c)
            c.route('https://**/*',lambda r:r.abort())
            c.add_init_script(f"if(!localStorage.getItem('projects-site-language')) localStorage.setItem('projects-site-language','{lang}');localStorage.setItem('projects-roadmap-theme','{theme}');localStorage.setItem('kb_theme','{theme}')")
            return c
        def visit(p,route):
            p.goto(base+route,wait_until='networkidle')
            if route != 'CompTIA/A+/1201/Final_Exam/connector-match-lab.html' and ('quiz' in route.lower() or 'Final_Exam' in route):p.locator('#quizForm[data-initialized=true]').wait_for(state='attached')
        def page(route='index.html',**kw):
            p=context(**kw).new_page();p.set_default_timeout(6000);p.on('pageerror',lambda e:errors.append(str(e)));visit(p,route);return p
        def state(p):
            return p.evaluate("() => {let key=Object.keys(sessionStorage).find(k=>k.startsWith('projects-assessment:')); return {key,state:JSON.parse(sessionStorage.getItem(key))}}")
        def answer(p):p.locator('input[type=radio]').first.check()
        def begin(p):p.locator('#startAssessment').click()
        def submit(p):p.locator('button[type=submit]').click();p.locator('#confirmSubmit').click()
        def recent(p):return p.locator('#continue-learning')
        def follow(p, link):
            with p.expect_navigation(wait_until='networkidle'):link.click()
            if p.locator('#quizForm').count():p.locator('#quizForm[data-initialized=true]').wait_for(state='attached')
        def language(p,lang):
            if not p.locator('#site-language-select').is_visible():p.locator('.site-language-settings summary').click()
            p.locator('#site-language-select').select_option(lang)
            p.wait_for_function('(lang)=>document.documentElement.lang===lang && window.ProjectsLearningLocale.ready',arg=lang)
        def local_text(p):
            for n in p.locator('.learning-progress [data-learning-source]:visible').evaluate_all("ns=>ns.map(n=>({s:n.dataset.learningSource,p:JSON.parse(n.dataset.learningParams||'{}'),text:n.textContent,lang:n.lang}))"):
                assert n['s'] in CAT,n
                expected=CAT[n['s']]
                for k,v in n['p'].items():expected=expected.replace('{'+k+'}',str(v))
                assert n['text']==expected and n['lang']=='es',n
        def check(name,fn,mode='LOCAL HTTP / ordinary clock / actual UI'):
            if args.match and not any(m in name for m in args.match):return
            errors.clear()
            try:
                details=fn();assert not errors,errors;checks.append({'test':name,'status':'PASS','mode':mode,'details':details})
            except Exception:checks.append({'test':name,'status':'FAIL','mode':mode,'error':traceback.format_exc()})
            print(checks[-1]['status'],name,checks[-1].get('error','')[-1800:],flush=True)
            (args.output/'results.json').write_text(json.dumps({'environment':'Real Chromium / local HTTP / external HTTPS blocked / production Spanish catalog / no translator mock','checks':checks},ensure_ascii=False,indent=2),encoding='utf8')
            for c in contexts:c.close()
            contexts.clear()

        def fresh():
            p=page();assert recent(p).is_hidden();assert p.get_by_text('Explore Projects',exact=True).is_visible()
            visit(p,'progress/index.html');assert p.get_by_text('No learning progress saved yet. Explore a track or try a lab.',exact=True).is_visible()
            assert p.get_by_text('Progress is stored in this browser.',exact=True).is_visible()
            for route in ['CompTIA/index.html','CompTIA/A+/index.html','CompTIA/Linux+/index.html','CompTIA/Security+/index.html','EC-Council/CEH/index.html','CLIs/index.html']:
                visit(p,route);assert p.locator('[data-progress-track]').is_visible();assert '0 of ' in p.locator('[data-progress-track]').inner_text()
            return 'Discovery remains primary; six hubs expose real activity denominators.'
        check('Brand-new browser and hub inventory',fresh)

        def untimed():
            p=page(QUIZ);assert state(p)['state']['deadline'] is None
            visit(p,'index.html');assert recent(p).is_hidden()
            visit(p,QUIZ);answer(p);saved=state(p)
            visit(p,'index.html');assert recent(p).get_by_text('In progress',exact=True).is_visible()
            follow(p,recent(p).get_by_text('Resume assessment',exact=True));assert state(p)==saved
            p.reload(wait_until='networkidle');assert state(p)==saved
            visit(p,'index.html');recent(p).get_by_text('Hide for this view',exact=True).click();assert recent(p).is_hidden()
            assert p.evaluate(f'!!JSON.parse(localStorage.getItem("{KEY}")).activities')
            p.reload(wait_until='networkidle');assert recent(p).is_visible()
            return 'Untimed answer, reload, same-tab resume and view-only dismissal preserve authoritative state.'
        check('Untimed quiz and hide/resume',untimed)

        def timed():
            p=page(TIMED);assert state(p)['state']['deadline'] is None
            visit(p,'index.html');assert recent(p).is_hidden()
            visit(p,TIMED);begin(p);answer(p);p.locator('.assessment-overview summary').click();p.locator('.assessment-flag').first.click();p.locator('.assessment-question-link').nth(2).click()
            saved=state(p);assert saved['state']['flags']
            visit(p,'index.html');link=recent(p).get_by_text('Resume assessment',exact=True);assert link.is_visible();follow(p,link);assert state(p)==saved
            visit(p,'index.html');before=p.evaluate(f'localStorage.getItem("{KEY}")')
            for lang in ['es','en']:
                language(p,lang)
                if lang=='es':local_text(p)
                assert p.evaluate(f'localStorage.getItem("{KEY}")')==before
            follow(p,recent(p).get_by_text('Resume assessment',exact=True));assert state(p)==saved
            other=p.context.new_page();visit(other,'index.html')
            assert recent(other).get_by_text('Open in the original tab',exact=True).is_visible()
            assert recent(other).get_by_text('Resume assessment',exact=True).count()==0
            submit(p);locked=state(p)
            visit(p,'index.html');assert recent(p).get_by_text('Submitted',exact=True).is_visible()
            assert recent(p).get_by_text('Resume assessment',exact=True).count()==0
            follow(p,recent(p).get_by_text('Review submitted assessment',exact=True));assert state(p)==locked
            assert p.locator('input[type=radio]:not(:disabled)').count()==0
            visit(p,'CompTIA/Linux+/index.html');assert '1 of ' in p.locator('[data-progress-track]').inner_text()
            visit(other,'index.html');assert 'Latest result:' in recent(other).inner_text()
            return {'deadline':saved['state']['deadline'],'flags':saved['state']['flags'],'crossTab':'Reference only; answers/deadline never copied.'}
        check('Timed pre-start, active, flags, submission, tabs and language',timed)

        def version():
            p=page(FINAL);begin(p);saved=state(p);visit(p,'index.html')
            link=recent(p).get_by_text('Resume assessment',exact=True);assert '?version=2' in link.get_attribute('href');follow(p,link);assert state(p)==saved
            return 'Core 1 version=2 retained in URL and storage key.'
        check('Version query retained when resuming',version)

        def expiry():
            p=page(TIMED);p.clock.install(time=datetime(2026,10,19,18,0,tzinfo=timezone.utc));begin(p);answer(p);saved=state(p)
            visit(p,'index.html')
            recent(p).get_by_text('Resume assessment',exact=True).focus()
            p.evaluate('window.progressFocusedLink = document.activeElement')
            p.clock.fast_forward(13*60000)
            assert recent(p).get_by_text('Open expired assessment',exact=True).is_visible()
            assert p.evaluate('document.activeElement===window.progressFocusedLink'), 'Expiry must retain the focused link'
            assert state(p)==saved, 'Dashboard must not grade or modify the expired controller state'
            language(p,'es');local_text(p);assert state(p)==saved
            language(p,'en')
            p.reload(wait_until='networkidle')
            assert recent(p).get_by_text('Resume assessment',exact=True).count()==0
            follow(p,recent(p).get_by_text('Open expired assessment',exact=True))
            p.locator('#results.show').wait_for()
            locked=state(p);assert locked['state']['expired'] and locked['state']['submittedAt'] is not None
            assert locked['state']['deadline']==saved['state']['deadline'] and locked['state']['answers']==saved['state']['answers']
            visit(p,'index.html');assert recent(p).get_by_text('Expired / submitted',exact=True).is_visible()
            return 'Expired deadline restored and graded only by assessment controller.'
        check('Expired attempt resumes through controller',expiry,'LOCAL HTTP / controlled browser clock')

        def cli_progress():
            p=page(CLI);commands=p.evaluate('labData.scenarios[0].steps.map(s=>s.expected)')
            for cmd in commands:p.locator('#cmdInput').fill(cmd);p.locator('#cmdInput').press('Enter')
            first=p.evaluate('JSON.parse(localStorage.getItem(storageKey))');assert first['complete'][0] and all(x=='independent' for x in first['outcomes'][0])
            p.locator('.scenario-btn').nth(2).click();p.locator('#cmdInput').fill('chmod');draft=p.evaluate('JSON.parse(localStorage.getItem(storageKey))')
            visit(p,'index.html');assert 'Scenario 3 of ' in recent(p).inner_text();assert '1 of ' in recent(p).inner_text()
            follow(p,recent(p).get_by_text('Continue lab',exact=True));assert p.locator('#cmdInput').input_value()=='chmod'
            assert p.evaluate('JSON.parse(localStorage.getItem(storageKey))')==draft
            other=p.context.new_page();visit(other,'index.html');follow(other,recent(other).get_by_text('Continue lab',exact=True));assert other.locator('#cmdInput').input_value()=='chmod'
            p.locator('.scenario-btn').nth(1).click()
            steps=p.evaluate('labData.scenarios[1].steps.length')
            for _ in range(steps):p.locator('#revealBtn').click()
            assisted=p.evaluate('JSON.parse(localStorage.getItem(storageKey))');assert all(x=='assisted' for x in assisted['outcomes'][1]);assert assisted['complete'][1]
            p.reload(wait_until='networkidle');assert p.evaluate('JSON.parse(localStorage.getItem(storageKey))')==assisted
            for lang in ['es','en']:language(p,lang);assert p.evaluate('JSON.parse(localStorage.getItem(storageKey))')==assisted
            visit(p,'CLIs/index.html');assert '0 of 3 labs completed' in p.locator('[data-progress-track]').inner_text();assert '2 of 8 scenarios completed' in p.locator('[data-progress-track]').inner_text()
            return {'independentSteps':len(commands),'assistedSteps':steps,'draftAndScenarioRestored':True}
        check('CLI independent, assisted, partial scenario, draft and new tab',cli_progress)

        def cli_completed():
            p=page(CLI)
            # Controlled fixture uses the actual CLI schema, not ordinary completion evidence.
            p.evaluate("() => {const s=defaultState();s.progress=labData.scenarios.map(s=>s.steps.length);s.complete=s.progress.map(()=>true);s.outcomes=labData.scenarios.map(s=>s.steps.map(()=> 'assisted'));localStorage.setItem(storageKey,JSON.stringify(s))}")
            visit(p,'index.html');assert recent(p).get_by_text('Assisted completion',exact=True).is_visible();assert recent(p).get_by_text('Continue lab',exact=True).count()==0
            follow(p,recent(p).get_by_text('Review lab',exact=True));p.on('dialog',lambda d:d.accept());p.locator('#resetAllBtn').click()
            visit(p,'index.html');assert recent(p).is_hidden()
            return 'All-scenario assisted fixture shows completed review; reset leaves no stale continue card.'
        check('CLI completed state and reset',cli_completed,'LOCAL HTTP / controlled CLI completion fixture')

        def legacy_cli():
            p=page(CLI);p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter')
            p.evaluate('() => {let s=JSON.parse(localStorage.getItem(storageKey));delete s.outcomes;delete s.drafts;localStorage.setItem(storageKey,JSON.stringify(s));localStorage.removeItem("projects-learning-progress")}')
            visit(p,'index.html');assert recent(p).get_by_text('Earlier assistance history is unknown.',exact=True).is_visible()
            follow(p,recent(p).get_by_text('Continue lab',exact=True));assert p.locator('.step.legacy').count()==1
            return 'Earlier progress without outcomes remains legacy; it is never labeled independent.'
        check('Legacy CLI state without summary or assistance history',legacy_cli,'LOCAL HTTP / controlled old-storage fixture')

        def migration():
            p=page(TIMED);begin(p);answer(p);saved=state(p)
            visit(p,'index.html');p.evaluate(f'localStorage.removeItem("{KEY}")');p.reload(wait_until='networkidle');assert recent(p).get_by_text('Resume assessment',exact=True).is_visible()
            follow(p,recent(p).get_by_text('Resume assessment',exact=True));assert state(p)==saved
            for raw in ['{bad json','null','[]','{"version":1,"activities":{"bogus":{"updatedAt":1}}}','{"version":99,"activities":{}}']:
                visit(p,'index.html');p.evaluate('raw=>localStorage.setItem("projects-learning-progress",raw)',raw);p.reload(wait_until='networkidle')
                follow(p,recent(p).get_by_text('Resume assessment',exact=True));assert state(p)==saved
                if '99' in raw:assert p.evaluate(f'localStorage.getItem("{KEY}")')==raw
            visit(p,CLI);p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter');visit(p,'index.html');p.evaluate(f'localStorage.removeItem("{KEY}")');p.reload(wait_until='networkidle');assert 'Linux CLI' in recent(p).inner_text() or recent(p).get_by_text('Resume assessment',exact=True).is_visible()
            return 'Legacy authoritative state is read lazily; malformed metadata cannot change deadlines; unknown schemas preserved.'
        check('Old storage, malformed metadata and future schema',migration,'LOCAL HTTP / controlled metadata fixtures')

        def clearing():
            p=page(TIMED);begin(p);answer(p);other=p.context.new_page();visit(other,CLI);other.locator('#cmdInput').fill('pwd');other.locator('#cmdInput').press('Enter')
            visit(p,'progress/index.html');before=p.evaluate('({l:{...localStorage},s:{...sessionStorage}})')
            p.once('dialog',lambda d:d.dismiss());p.locator('[data-clear-all-progress]').click();assert p.evaluate('({l:{...localStorage},s:{...sessionStorage}})')==before
            assessment=p.locator('[data-activity-id]').filter(has=p.get_by_text('Resume assessment',exact=True))
            p.once('dialog',lambda d:d.dismiss());assessment.get_by_text('Clear progress',exact=True).click();assert p.evaluate('({l:{...localStorage},s:{...sessionStorage}})')==before
            p.once('dialog',lambda d:d.accept());assessment.get_by_text('Clear progress',exact=True).click()
            assert p.locator('[data-activity-id]').count()==1
            assert p.evaluate("Object.keys(sessionStorage).filter(k=>k.startsWith('projects-assessment:')).length")==0
            assert other.locator('#cmdInput').input_value()==''
            language(p,'es');local_text(p)
            p.once('dialog',lambda d:(None if '¿Borrar todo' in d.message else (_ for _ in ()).throw(AssertionError(d.message)),d.accept()))
            # The storage event reloads the other tab; its CLI globals do not
            # exist until that new document's inline application has initialized.
            p.locator('[data-clear-all-progress]').click();other.wait_for_function('typeof state !== "undefined" && state.progress.every(n=>n===0)')
            assert p.locator('[data-activity-id]').count()==0
            assert p.evaluate("localStorage.getItem('projects-site-language')")=='es'
            visit(p,'index.html');assert recent(p).is_hidden()
            visit(p,TIMED);assert state(p)['state']['deadline'] is None and p.locator('#startAssessment').is_visible()
            return 'Cancel leaves storage unchanged; one clear preserves other activity; all clear resets open CLI and assessment authority, preserving preferences.'
        check('Clear one, cancel and confirm clear-all with authoritative state',clearing)

        def cross_tab_clear():
            p=page(TIMED);begin(p);answer(p);other=p.context.new_page();visit(other,'progress/index.html')
            other.once('dialog',lambda d:d.accept());other.locator('[data-clear-all-progress]').click()
            p.wait_for_function('document.querySelector("#startAssessment") && !document.querySelector("#startAssessment").hidden')
            assert state(p)['state']['deadline'] is None
            p.reload(wait_until='networkidle');assert state(p)['state']['deadline'] is None
            visit(other,'index.html');assert recent(other).is_hidden()
            return 'Original assessment tab clears its own session record and suppresses pagehide checkpoint resurrection.'
        check('Cross-tab clearing prevents assessment resurrection',cross_tab_clear)

        def reading_tab_clear():
            p=page(TIMED);begin(p);answer(p);saved=state(p)
            visit(p,'CompTIA/Linux+/modules/linux-landscape-and-server-roles/index.html')
            other=p.context.new_page();visit(other,'progress/index.html')
            other.once('dialog',lambda d:d.accept());other.locator('[data-clear-all-progress]').click()
            p.wait_for_function("Object.keys(sessionStorage).every(k=>!k.startsWith('projects-assessment:'))")
            # A retained/restored pre-clear session is also rejected on controller load.
            p.evaluate('d=>sessionStorage.setItem(d.key,JSON.stringify(d.state))',saved)
            visit(p,TIMED);assert state(p)['state']['deadline'] is None
            assert p.locator('#startAssessment').is_visible()
            begin(p);answer(p);new=state(p);assert new['state']['progressRevision']>saved['state']['progressRevision']
            p.reload(wait_until='networkidle');assert state(p)==new
            return 'Reading tab receives clear; controlled retained-session fixture cannot resurrect; a new attempt still reloads normally.'
        check('Reading tabs and retained sessions honor coordinated clear',reading_tab_clear,'LOCAL HTTP / actual clear plus controlled retained-session fixture')

        def malformed_resets():
            p=page(TIMED);begin(p);answer(p)
            visit(p,'progress/index.html');p.once('dialog',lambda d:d.accept());p.locator('[data-clear-all-progress]').click()
            visit(p,TIMED);begin(p);answer(p);saved=state(p)
            ledger=p.evaluate("localStorage.getItem('projects-learning-reset-revisions')")
            for raw in ['{broken','null','{"version":99,"activities":{}}']:
                p.evaluate('raw=>localStorage.setItem("projects-learning-reset-revisions",raw)',raw)
                p.reload(wait_until='networkidle');assert state(p)==saved
                assert p.locator('input:checked').count()==1
            p.evaluate('raw=>localStorage.setItem("projects-learning-reset-revisions",raw)',ledger)
            p.reload(wait_until='networkidle');assert state(p)==saved
            return 'Malformed/future reset metadata cannot discard answers, extend deadlines or lose the known reset revision.'
        check('Malformed reset metadata preserves assessment authority',malformed_resets,'LOCAL HTTP / controlled reset-metadata fixtures')

        def ordering():
            p=page(QUIZ);answer(p);visit(p,CLI);p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter');visit(p,'index.html');assert 'Linux CLI' in recent(p).inner_text()
            ids=p.evaluate('Object.keys(JSON.parse(localStorage.getItem("projects-learning-progress")).activities)')
            p.evaluate('() => {let d=JSON.parse(localStorage.getItem("projects-learning-progress"));Object.values(d.activities).forEach(a=>a.updatedAt=1);localStorage.setItem("projects-learning-progress",JSON.stringify(d))}')
            p.reload(wait_until='networkidle');first=p.locator('#continue-learning [data-activity-id]').get_attribute('data-activity-id');p.reload(wait_until='networkidle');assert p.locator('#continue-learning [data-activity-id]').get_attribute('data-activity-id')==first
            assert first==sorted(ids)[0]
            return {'tieBreak':'Stable activity ID','activities':ids}
        check('Deterministic recency ordering',ordering,'LOCAL HTTP / ordinary interaction plus controlled timestamp tie')

        def connector():
            p=page('CompTIA/A+/1201/Final_Exam/connector-match-lab.html')
            assert p.evaluate("Object.keys(localStorage).filter(k=>k.includes('progress')).length")==0
            visit(p,'index.html');assert recent(p).is_hidden()
            return 'Connector lab stores theme only; no persistent progress or completion is claimed.'
        check('Connector nonpersistent activity boundary',connector)

        for width in [320,390,768,1440]:
            for lang in ['en','es']:
                for theme in ['light','dark']:
                    def layout(width=width,lang=lang,theme=theme):
                        p=page(CLI,width=width,lang=lang,theme=theme);p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter');visit(p,'index.html')
                        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),p.evaluate('document.documentElement.scrollWidth')
                        if lang=='es':local_text(p)
                        # Reach resume using keyboard only from the beginning of the document.
                        p.evaluate('document.activeElement.blur()');p.keyboard.press('Control+Home')
                        reached=False
                        for _ in range(45):
                            p.keyboard.press('Tab')
                            if p.evaluate('document.activeElement.dataset.learningSource==="Continue lab"'):reached=True;break
                        assert reached
                        assert p.evaluate('getComputedStyle(document.activeElement).outlineStyle!="none"')
                        p.screenshot(path=str(args.output/f'home-{width}-{lang}-{theme}.png'),full_page=True)
                        p.keyboard.press('Enter');p.wait_for_url('**/CLIs/Linux/index.html');p.wait_for_load_state('networkidle')
                        visit(p,'progress/index.html');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                        if lang=='es':local_text(p)
                        p.screenshot(path=str(args.output/f'settings-{width}-{lang}-{theme}.png'),full_page=True)
                        # With CSS disabled, progress remains text, buttons and links.
                        p.evaluate('document.querySelectorAll("style,link[rel=stylesheet]").forEach(e=>e.remove())')
                        assert p.locator('[data-activity-id] a').is_visible()
                        return {'width':width,'language':lang,'theme':theme,'keyboardResume':True,'cssDisabled':True}
                    check(f'Layout/keyboard {width} {lang} {theme}',layout)
        browser.close()
    server.shutdown()
    print(json.dumps({'passed':sum(c['status']=='PASS' for c in checks),'failed':sum(c['status']=='FAIL' for c in checks)}))
    sys.exit(any(c['status']=='FAIL' for c in checks))

if __name__=='__main__':main()
