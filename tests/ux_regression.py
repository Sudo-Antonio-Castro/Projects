#!/usr/bin/env python3
"""UX recovery regression checks.

Default: serve the actual source locally and use real browser navigation/storage.
--offline: embed local assets and simulate origin, reload, and storage for sandboxes
that block Chromium navigation. This is NOT a live end-to-end test. External
translation, fonts, network, cookies, and genuine browser reloads are not verified
in offline mode. Clock advancement and storage denial are intentional test inputs.

Install: pip install playwright beautifulsoup4; playwright install chromium
Run: python tests/ux_regression.py [--offline] [--output DIRECTORY]
"""
from pathlib import Path
from urllib.parse import unquote, urlparse, quote
from datetime import datetime, timezone, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse, json, os, re, shutil, sys, threading, time, traceback
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
LINUX = 'CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html'
APLUS = 'CompTIA/A+/1201/Quiz_System_Devices/index.html'
FINAL = 'CompTIA/A+/1201/Final_Exam/index.html'
EPOCH = datetime(2026, 10, 14, 16, 0, 0, tzinfo=timezone.utc)


def transformed(code):
    for name in ['pathname', 'search']:
        code = re.sub(r'(?<![\w.])(?:window\.)?location\.' + name,
                      'window.__fixture' + name.title(), code)
    return re.sub(r'(?<![\w.])(?:window\.)?location\.reload\(\)',
                  'window.__fixtureReload()', code)


def fixture(relative, session=None, local=None, search='', denied=False):
    """Load exact local assets into an explicitly simulated browser fixture."""
    p = ROOT / relative
    soup = BeautifulSoup(p.read_text(), 'html.parser')
    deferred = []
    for tag in list(soup.select('link')):
        href = tag.get('href', '')
        if tag.get('rel') == ['stylesheet'] and not urlparse(href).netloc:
            css = (p.parent / unquote(href)).resolve()
            style = soup.new_tag('style'); style.string = css.read_text()
            tag.replace_with(style)
        else:
            tag.decompose()
    for tag in list(soup.select('script')):
        src = tag.get('src')
        if src and urlparse(src).netloc:
            tag.decompose(); continue
        code = (p.parent / unquote(src)).read_text() if src else tag.get_text()
        replacement = soup.new_tag('script')
        for k, v in tag.attrs.items():
            if k not in ('src', 'defer', 'async'): replacement[k] = v
        replacement.string = transformed(code) + '\n//# sourceURL=' + relative + '::' + (src or 'inline') + '\n'
        if tag.has_attr('defer'):
            deferred.append(replacement); tag.decompose()
        else: tag.replace_with(replacement)
    dynamic = {}
    for name in ['quiz-data.js', 'quiz-app.js']:
        candidate = p.parent / '../assets' / name
        if candidate.exists():
            dynamic['https://fixture.invalid/Projects/' + candidate.resolve().relative_to(ROOT).as_posix()] = transformed(candidate.read_text())
    boot = soup.new_tag('script')
    boot.string = '''
window.__fixturePathname=PATH;window.__fixtureSearch=SEARCH;
window.__fixtureSession=SESSION;window.__fixtureLocal=LOCAL;
window.__fixtureReloadCount=0;window.__fixtureReload=()=>{window.__fixtureReloadCount++};
window.__fixtureStorageDenied=DENIED;
const memoryStore=(data,session)=>({
 getItem:k=>Object.hasOwn(data,k)?String(data[k]):null,
 setItem:(k,v)=>{if(session&&window.__fixtureStorageDenied)throw new DOMException('Storage denied','SecurityError');data[k]=String(v)},
 removeItem:k=>{if(session&&window.__fixtureStorageDenied)throw new DOMException('Storage denied','SecurityError');delete data[k]},
 key:i=>Object.keys(data)[i]||null,get length(){return Object.keys(data).length},clear:()=>{for(const k of Object.keys(data))delete data[k]}
});
Object.defineProperty(window,'sessionStorage',{value:memoryStore(window.__fixtureSession,true),configurable:true});
Object.defineProperty(window,'localStorage',{value:memoryStore(window.__fixtureLocal,false),configurable:true});
Object.defineProperty(document,'cookie',{get:()=>window.__fixtureCookie||'',set:v=>{window.__fixtureCookie=v},configurable:true});
const dynamicSources=DYNAMIC;
const append=Node.prototype.appendChild;
Node.prototype.appendChild=function(node){
 if(node.tagName==='SCRIPT'&&node.src){
  const code=dynamicSources[node.src];
  if(code!==undefined){node.removeAttribute('src');node.textContent=code;const result=append.call(this,node);queueMicrotask(()=>node.dispatchEvent(new Event('load')));return result;}
  queueMicrotask(()=>node.dispatchEvent(new Event('error')));return node;
 }
 return append.call(this,node);
};
'''.replace('PATH', json.dumps('/Projects/' + relative)).replace('SEARCH', json.dumps(search)).replace('SESSION', json.dumps(session or {})).replace('LOCAL', json.dumps(local or {})).replace('DENIED', json.dumps(denied)).replace('DYNAMIC', json.dumps(dynamic))
    soup.head.insert(0, boot)
    base = soup.new_tag('base', href='https://fixture.invalid/Projects/' + quote(relative, safe='/+'))
    soup.head.insert(0, base)
    for tag in deferred: soup.body.append(tag)
    return str(soup)


class Suite:
    def __init__(self, browser, offline, output, base_url=''):
        self.browser, self.offline, self.output, self.base_url = browser, offline, output, base_url
        self.results=[]; self.contexts=[]

    def page(self, relative, session=None, local=None, search='', denied=False, width=390, seconds=0):
        context = self.browser.new_context(reduced_motion='reduce',viewport={'width':width,'height':844})
        context.route('https://**/*', lambda route: route.abort())
        self.contexts.append(context)
        page=context.new_page(); page.set_default_timeout(5000); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.clock.install(time=EPOCH + timedelta(seconds=seconds))
        if self.offline:
            page.set_content(fixture(relative,session,local,search,denied),wait_until='domcontentloaded')
        else:
            # Real mode uses normal origin-backed storage and page navigation.
            if session or local or denied:
                context.add_init_script('''(() => {
                  const session=SESSION, local=LOCAL;
                  for(const [k,v] of Object.entries(session))sessionStorage.setItem(k,v);
                  for(const [k,v] of Object.entries(local))localStorage.setItem(k,v);
                  if(DENIED)Object.defineProperty(window,'sessionStorage',{value:{getItem:()=>null,setItem:()=>{throw Error('Storage denied')},removeItem:()=>{throw Error('Storage denied')},length:0,key:()=>null}});
                })();'''.replace('SESSION',json.dumps(session or {})).replace('LOCAL',json.dumps(local or {})).replace('DENIED',json.dumps(denied)))
            page.goto(self.base_url + quote(relative,safe='/+') + search,wait_until='domcontentloaded')
        page.wait_for_timeout(20)
        assert not errors, {'page':relative,'errors':errors}
        return page

    def state(self,page,storage='sessionStorage'):
        return page.evaluate('s=>{const x=window[s];return Object.fromEntries(Array.from({length:x.length},(_,i)=>x.key(i)).map(k=>[k,x.getItem(k)]))}',storage)

    def attempt(self,page):
        data=self.state(page)
        suffix=page.evaluate("() => (window.__fixtureSearch ?? location.search)")
        version='?version=' + (suffix.split('version=',1)[1].split('&',1)[0] if 'version=' in suffix else '')
        key=next(k for k in data if k.startswith('projects-assessment:') and k.endswith(version))
        return key,json.loads(data[key])

    def check(self,name,fn):
        started=time.monotonic()
        try:
            details=fn() or {};self.results.append({'test':name,'status':'PASS','details':details});print('PASS',name,flush=True)
        except Exception as exc:
            self.results.append({'test':name,'status':'FAIL','error':traceback.format_exc()});print('FAIL',name,str(exc)[:350],flush=True)
        finally:
            self.results[-1]['seconds']=round(time.monotonic()-started,3)
            (self.output/'checkpoint.json').write_text(json.dumps({'mode':'OFFLINE DOM FIXTURES' if self.offline else 'LOCAL HTTP BROWSER','checks':self.results},indent=2))
            for c in self.contexts: c.close()
            self.contexts=[]

    def linux(self,relative):
        p=self.page(relative); meta=json.loads(p.locator('script[data-assessment]').get_attribute('data-assessment'))
        n=len(meta['answers']); first=next(iter(meta['answers'])); p.locator(f'input[name="q{first}"][value="{meta["answers"][first]}"]').check()
        p.locator('button[type=submit]').click()
        assert p.locator('input[type=radio]:not(:disabled)').count()==0
        assert p.locator('button[type=submit]').is_disabled()
        text=p.locator('#results').inner_text();assert f'1/{n}' in text,text
        assert p.locator('.answer-feedback').count()==n
        timer=p.locator('#timer').inner_text();p.clock.fast_forward(5000)
        assert p.locator('#timer').inner_text()==timer
        p.locator('#quizForm').evaluate("form=>form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))")
        assert p.locator('#results').inner_text()==text
        assert p.locator('.answer-feedback').count()==n
        return {'questions':n,'correct':1,'radiosLocked':4*n,'timerStable':True}

    def persistence(self):
        p=self.page(LINUX);p.locator('input[name=q1][value="2"]').check();p.locator('input[name=q2][value="1"]').check()
        key,state=self.attempt(p)
        q=self.page(LINUX,session=self.state(p),seconds=15)
        assert q.locator('input:checked').count()==2
        assert self.attempt(q)[1]['deadline']==state['deadline']
        assert '11:45' in q.locator('#timer').inner_text()
        q.locator('button[type=submit]').click();result=q.locator('#results').inner_text()
        r=self.page(LINUX,session=self.state(q),seconds=25)
        assert r.locator('#results').inner_text()==result
        assert r.locator('input[type=radio]:not(:disabled)').count()==0
        return {'answersResumed':2,'originalDeadlinePreserved':True,'submittedAttemptResumedLocked':True}

    def expiry(self):
        p=self.page(LINUX);p.locator('input[name=q1][value="2"]').check();p.clock.fast_forward(720100)
        assert 'Time expired' in p.locator('#results').inner_text()
        assert p.locator('button[type=submit]').is_disabled()
        assert self.attempt(p)[1]['expired'] is True
        q=self.page(LINUX,session=self.state(p),seconds=800)
        assert q.locator('input[type=radio]:not(:disabled)').count()==0
        return {'simulatedClockAdvanceSeconds':720.1,'expiredAndLocked':True}

    def language(self):
        p=self.page(APLUS); inputs=p.locator('input[type=radio]'); inputs.nth(0).check();inputs.nth(4).check()
        p.locator('.site-language-settings summary').click()
        if self.offline:
            p.select_option('#site-language-select','es')
            assert p.evaluate('__fixtureReloadCount')==1
            q=self.page(APLUS,session=self.state(p),local=self.state(p,'localStorage'))
        else:
            with p.expect_navigation(wait_until='domcontentloaded'): p.select_option('#site-language-select','es')
            q=p
        assert q.locator('input:checked').count()==2
        assert q.locator('html').get_attribute('lang')=='es'
        assert q.locator('.site-language-control').evaluate("e=>getComputedStyle(e).position")!='fixed'
        return {'before':2,'after':2,'translationService':'not tested','reload':'simulated' if self.offline else 'real'}

    def restart(self):
        p=self.page(APLUS);p.locator('input[type=radio]').first.check()
        p.once('dialog',lambda d:d.dismiss());p.get_by_role('button',name='Start new attempt').first.click()
        assert p.locator('input:checked').count()==1
        p.once('dialog',lambda d:d.accept())
        if self.offline:
            p.get_by_role('button',name='Start new attempt').first.click()
            p.evaluate("window.dispatchEvent(new Event('pagehide'))")
            assert not any(k.startswith('projects-assessment:') for k in self.state(p))
            assert p.evaluate('__fixtureReloadCount')==1
        else:
            with p.expect_navigation(wait_until='domcontentloaded'):p.get_by_role('button',name='Start new attempt').first.click()
            assert p.locator('input:checked').count()==0
        return {'cancelPreservesAnswers':True,'confirmClearsAttempt':True}

    def storage_denied(self):
        p=self.page(APLUS,denied=True);p.locator('input[type=radio]').first.check()
        assert p.locator('.attempt-storage-notice').is_visible()
        p.locator('.site-language-settings summary').click()
        p.once('dialog',lambda d:d.dismiss());p.select_option('#site-language-select','es')
        assert p.locator('#site-language-select').input_value()=='en'
        assert p.locator('input:checked').count()==1
        if self.offline:assert p.evaluate('__fixtureReloadCount')==0
        p.locator('button[type=submit]').click();assert p.locator('button[type=submit]').is_disabled()
        return {'warningShown':True,'languageChangeCanBeCancelled':True,'gradingWorksWithoutStorage':True}

    def bank(self,relative,search=''):
        p=self.page(relative,search=search)
        p.wait_for_selector('fieldset.question-card')
        count=p.locator('fieldset.question-card').count();assert count>0
        expected=90 if relative==FINAL else None
        if expected: assert count==expected,count
        before=p.locator('html').get_attribute('data-theme') or 'dark'
        p.locator('#themeBtn').click();after=p.locator('html').get_attribute('data-theme');assert after!=before
        answers=p.evaluate("() => {const c=window.QUIZ_CONFIG||{},b=window.QUIZ_BANK;return (c.questionIds?.length?c.questionIds.map(id=>b.find(q=>q.id===id)).filter(Boolean):b.filter(q=>!c.module||q.module===c.module)).map(q=>({id:q.id,answer:q.answer}))}")
        # Exercise DOM answer changes for all questions without waiting on repeated scrolling.
        p.evaluate("a=>{for(const q of a){const i=document.querySelector(`input[name=q${q.id}][value='${q.answer}']`);i.checked=true;i.dispatchEvent(new Event('change',{bubbles:true}))}}",answers)
        p.locator('button[type=submit]').click();text=p.locator('#results').inner_text();assert f'{count}/{count}' in text,text
        assert p.locator('input[type=radio]:not(:disabled)').count()==0
        return {'questions':count,'allCorrectScored':True,'singleThemeClickWorks':True}

    def version_isolation(self):
        p=self.page(FINAL,search='?version=1');p.wait_for_selector('fieldset');p.locator('input[type=radio]').first.check()
        q=self.page(FINAL,search='?version=2',session=self.state(p));q.wait_for_selector('fieldset')
        assert q.locator('input:checked').count()==0
        assert self.attempt(p)[0]!=self.attempt(q)[0]
        return {'versionsHaveSeparateStorageKeys':True}

    def themes(self):
        p=self.page('CompTIA/Linux+/index.html');p.locator('#themeBtn').click()
        theme=p.locator('html').get_attribute('data-theme')
        q=self.page('index.html',local=self.state(p,'localStorage'))
        assert q.locator('html').get_attribute('data-theme')==theme
        assert q.locator('a[data-section=home]').get_attribute('aria-current')=='page'
        assert q.locator('.skip-link').count()==1
        return {'missingYearSafe':True,'themePreferenceRestored':True,'homeActiveState':True}

    def layout(self):
        rows=[]
        for relative in [APLUS,LINUX,'index.html',FINAL]:
            for width in [320,390,1440]:
                p=self.page(relative,width=width,search='?version=1' if relative==FINAL else '')
                if relative==FINAL:p.wait_for_selector('fieldset')
                dims=p.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})')
                assert dims['content']<=width+1,(relative,width,dims)
                if width==390:
                    slug='linux-quiz' if relative==LINUX else 'a-plus-quiz' if relative==APLUS else 'home' if relative=='index.html' else 'a-plus-final'
                    p.screenshot(path=str(self.output/(slug+'-390.png')),full_page=False,animations='disabled',timeout=5000)
                rows.append({'page':relative,**dims})
        return rows

    def feedback(self):
        p=self.page(LINUX);p.locator('input[name=q1][value="1"]').check();p.locator('button[type=submit]').click()
        assert p.locator('#label_1_1').inner_text().endswith('Your answer - incorrect')
        assert p.locator('#label_1_2').inner_text().endswith('Correct answer')
        colors=p.evaluate("[...document.querySelectorAll('#label_1_1,#label_1_2,#label_1_3')].map(e=>({bg:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderLeftColor}))")
        assert len({x['bg'] for x in colors})==3,colors
        p.locator('#question-1').scroll_into_view_if_needed();p.screenshot(path=str(self.output/'linux-feedback-390.png'),animations='disabled',timeout=5000)
        return {'explicitLabels':True,'wrongCorrectNeutralDistinct':True}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--offline',action='store_true');parser.add_argument('--output',type=Path,default=ROOT/'test-results')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    server=None;base_url=''
    if not args.offline:
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
            def log_message(self,*a):pass
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        threading.Thread(target=server.serve_forever,daemon=True).start();base_url=f'http://127.0.0.1:{server.server_port}/'
    try:
        with sync_playwright() as pw:
            executable=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
            browser=pw.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
            suite=Suite(browser,args.offline,args.output,base_url)
            for path in sorted((ROOT/'CompTIA/Linux+').rglob('*.html')):
                if 'data-assessment=' in path.read_text():
                    relative=path.relative_to(ROOT).as_posix();suite.check('linux lock: '+relative,lambda r=relative:suite.linux(r))
            for name,fn in [('attempt restoration',suite.persistence),('deadline expiry',suite.expiry),('language checkpoint',suite.language),('restart confirmation',suite.restart),('storage unavailable',suite.storage_denied),('version isolation',suite.version_isolation),('shared theme',suite.themes),('responsive layouts',suite.layout),('visible answer feedback',suite.feedback)]:suite.check(name,fn)
            for relative,search in [(APLUS,''),('CompTIA/A+/1202/Final_Exam/index.html',''),('CompTIA/Security+/Final_Exam/index.html',''),('EC-Council/CEH/Final_Exam/index.html',''),(FINAL,'?version=1'),(FINAL,'?version=2')]:
                if (ROOT/relative).exists():suite.check('bank: '+relative+search,lambda r=relative,s=search:suite.bank(r,s))
            data={'mode':'OFFLINE DOM FIXTURES' if args.offline else 'LOCAL HTTP BROWSER','limitations':['No Google Translate service testing','No public deployment testing']+(['Storage, reload and dynamic script loading simulated; actual local HTTP navigation was blocked in author environment'] if args.offline else []),'checks':suite.results}
            (args.output/'regression-results.json').write_text(json.dumps(data,indent=2));browser.close()
            passed=sum(r['status']=='PASS' for r in suite.results);print(f'{passed}/{len(suite.results)} checks passed')
            return 0 if passed==len(suite.results) else 1
    finally:
        if server:server.shutdown();server.server_close()

if __name__=='__main__':sys.exit(main())
