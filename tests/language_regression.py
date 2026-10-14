"""Visible-text regressions in Chromium over local HTTP.

Default blocks external HTTPS translation resources, testing the production local
catalog, not a mocked translator. --external also runs an external-service smoke
test. --mock-startup separately tests a slow, startup-only mock of Google.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
import argparse,json,re,threading,time,traceback
ROOT=Path(__file__).resolve().parents[1]
CATALOG=json.loads((ROOT/'assets/learning-es.json').read_text(encoding='utf-8'))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--external',action='store_true');parser.add_argument('--mock-startup',action='store_true');parser.add_argument('--output',type=Path,default=ROOT/'test-results/spanish/language')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
        def log_message(self,*a):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/';results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch()
        def context(mode='blocked-external'):
            c=browser.new_context()
            c.add_init_script("localStorage.setItem('projects-site-language','es')")
            if mode!='external-service':c.route('https://**/*',lambda r:r.abort())
            return c
        def open_page(c,path):
            p=c.new_page();p.set_default_timeout(5000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
            p.goto(base+path,wait_until='domcontentloaded')
            p.wait_for_function("window.ProjectsLearningLocale && document.querySelector('[data-learning-source][lang=es]')")
            assert not errors,errors
            return p
        def check(name,fn,mode='local-catalog / external resources blocked'):
            try:details=fn();results.append({'test':name,'status':'PASS','mode':mode,'details':details});print('PASS',name,flush=True)
            except Exception:results.append({'test':name,'status':'FAIL','mode':mode,'error':traceback.format_exc()});print('FAIL',name,results[-1]['error'][-500:],flush=True)
            (args.output/'checkpoint.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
        def visible(p):
            rows=p.locator('[data-learning-source]:visible').evaluate_all("nodes=>nodes.map(n=>({source:n.dataset.learningSource,params:JSON.parse(n.dataset.learningParams||'{}'),text:n.textContent,lang:n.lang}))")
            for row in rows:
                assert row['source'] in CATALOG, row
                expected=re.sub(r'\{(\w+)\}',lambda m:str(row['params'].get(m.group(1),m.group(0))),CATALOG[row['source']])
                assert row['text']==expected and row['lang']=='es',row
            assert p.locator('#learning-language-status').is_hidden()
            return len(rows)
        def switch(p,language):
            if not p.locator('#site-language-select').is_visible():p.locator('.site-language-settings summary').click()
            p.select_option('#site-language-select',language)
        def cli(platform,mode='blocked-external'):
            data=json.loads(re.search(r'const labData = (.*);',(ROOT/f'CLIs/{platform}/index.html').read_text(encoding='utf-8')).group(1))
            c=context(mode);serviceResponses=[]
            if mode=='external-service':
                c.on('response',lambda r:serviceResponses.append({'url':r.url.split('?')[0],'status':r.status}) if 'translate' in r.url and 'google' in r.url else None)
            p=open_page(c,f'CLIs/{platform}/index.html');transitions=[];hints=[]
            if mode=='external-service':
                p.wait_for_function("document.querySelector('.goog-te-combo')",timeout=15000)
            for i,scenario in enumerate(data['scenarios']):
                p.locator('#scenarioList button').nth(i).click()
                for j,step in enumerate(scenario['steps']):
                    expected=CATALOG[step['target']];assert p.locator('#scenarioGoal').inner_text()==expected
                    visible(p)
                    p.locator('#hintBtn').click();hint=p.locator('.output-line.warn').last.inner_text()
                    assert hint=='Pista: '+CATALOG[step['hint']],hint
                    hints.append(hint)
                    if i==0 and j==0:
                        p.locator('#cmdInput').fill('pending-literal')
                        before=p.evaluate("JSON.stringify(state)");switch(p,'en')
                        assert p.locator('#scenarioGoal').inner_text()==step['target']
                        assert p.locator('.output-line.warn').last.inner_text()=='Hint: '+step['hint']
                        switch(p,'es');assert p.locator('#scenarioGoal').inner_text()==expected
                        assert p.locator('#cmdInput').input_value()=='pending-literal'
                        assert p.evaluate('JSON.stringify(state)')==before
                    p.locator('#cmdInput').fill(step['expected']);p.locator('#cmdInput').press('Enter')
                    assert p.evaluate('state.progress[state.active]')==j+1
                    assert p.locator('.command-line').last.inner_text().endswith(step['expected'])
                    assert p.locator('.output-line.sys').last.inner_text()==step['output']
                    visible(p)
                    transitions.append({'scenario':i+1,'task':j+1,'command':step['expected'],'nextVisibleText':p.locator('#scenarioGoal').inner_text()})
                    if i==0 and j==2:
                        before=p.evaluate('JSON.stringify(state)');p.reload(wait_until='domcontentloaded')
                        p.wait_for_function("document.getElementById('scenarioGoal').lang==='es'")
                        assert p.evaluate('JSON.stringify(state)')==before
                assert p.locator('#scenarioGoal').inner_text()=='Escenario completado.'
            p.screenshot(path=str(args.output/f'{platform}-{mode}.png'),full_page=False)
            if mode=='blocked-external':assert 'no está disponible' in p.locator('#page-translation-status').inner_text()
            c.close();return {'transitions':transitions,'hints':hints,'languageRoundTripPreservedStateAndInput':True,'realReloadPreservedState':True,'externalServiceResponses':serviceResponses}
        for platform in ['Linux','Windows','MacOS']:check('Spanish CLI transitions, hints and completion: '+platform,lambda x=platform:cli(x))
        def quiz(path):
            c=context();p=open_page(c,path);p.wait_for_function("document.getElementById('answerProgress')?.lang==='es'")
            visible(p);before= p.locator('.question-title,.question-text').all_inner_texts()[:3]
            first=p.locator('input[type=radio]').first;first.check()
            for _ in range(3):
                p.locator('button[data-learning-source="Review unanswered"]').click()
                p.locator('input[type=radio]:focus').check()
            attempt=p.evaluate("Object.entries(sessionStorage).find(([k])=>k.startsWith('projects-assessment:'))")
            checked=p.locator('input:checked').evaluate_all('nodes=>nodes.map(n=>[n.name,n.value])')
            ids=p.locator('input[type=radio]').evaluate_all('nodes=>nodes.map(n=>[n.name,n.value])')
            switch(p,'en');assert p.locator('#answerProgress').inner_text().endswith('answered')
            switch(p,'es');assert p.locator('#answerProgress').inner_text().endswith('respondidas')
            assert p.locator('input:checked').evaluate_all('nodes=>nodes.map(n=>[n.name,n.value])')==checked
            assert p.evaluate("Object.entries(sessionStorage).find(([k])=>k.startsWith('projects-assessment:'))")[1]==attempt[1]
            p.reload(wait_until='domcontentloaded');p.wait_for_function("document.getElementById('answerProgress')?.lang==='es'")
            restored=json.loads(p.evaluate("Object.entries(sessionStorage).find(([k])=>k.startsWith('projects-assessment:'))")[1]);old=json.loads(attempt[1])
            assert restored['deadline']==old['deadline'];assert restored['signature']==old['signature'];assert restored['answers']==old['answers']
            assert p.locator('input[type=radio]').evaluate_all('nodes=>nodes.map(n=>[n.name,n.value])')==ids
            p.locator('button[type=submit]').click();visible(p)
            assert p.locator('input[type=radio]:not(:disabled)').count()==0
            result=p.locator('#results').inner_text();explanation=p.locator('.explanation').first.inner_text()
            assert 'Tu evaluación se ha calificado y bloqueado.' in result
            assert 'Respuesta:' in explanation
            switch(p,'en');assert 'Your assessment has been scored and locked.' in p.locator('#results').inner_text()
            switch(p,'es');assert p.locator('#results').inner_text()==result
            assert p.locator('input[type=radio]:not(:disabled)').count()==0
            p.reload(wait_until='domcontentloaded');p.wait_for_function("document.getElementById('answerProgress')?.lang==='es'")
            assert p.locator('#results').inner_text()==result;assert p.locator('button[type=submit]').is_disabled()
            timer=p.locator('#timer').inner_text() if p.locator('#timer').count() else None
            c.close();return {'firstQuestions':before,'explanation':explanation,'result':result,'timer':timer,'answersPositionDeadlineSignatureAndLockedSubmissionPreserved':True}
        for path in ['CompTIA/A+/1201/Quiz_System_Devices/index.html','CompTIA/A+/1201/Final_Exam/index.html?version=1','CompTIA/A+/1201/Final_Exam/index.html?version=2','CompTIA/A+/1202/Final_Exam/index.html','CompTIA/Security+/Final_Exam/index.html','EC-Council/CEH/Final_Exam/index.html','CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html']:
            check('Spanish question, feedback and result: '+path,lambda x=path:quiz(x))
        def catalog_failure(slow=False):
            c=context()
            if slow:
                def delayed(route):time.sleep(1);route.continue_()
                c.route('**/assets/learning-es.json',delayed)
            else:c.route('**/assets/learning-es.json',lambda r:r.abort())
            p=c.new_page();p.goto(base+'CLIs/Linux/index.html',wait_until='domcontentloaded')
            if slow:
                p.wait_for_function("document.getElementById('scenarioGoal').lang==='es'");visible(p)
            else:
                p.wait_for_function("document.getElementById('learning-language-status').textContent.includes('no está disponible')")
                assert p.locator('#learning-language-status').is_visible()
                assert p.locator('#scenarioGoal').inner_text()=='Display the current working directory.'
                assert p.locator('#scenarioGoal').get_attribute('lang')=='en'
                p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter')
                assert p.locator('#scenarioGoal').inner_text()=='List the files in the current directory.'
                assert p.evaluate('state.progress[0]')==1
            text=p.locator('#scenarioGoal').inner_text();notice=p.locator('#learning-language-status').text_content();c.close();return {'visibleTask':text,'notice':notice}
        check('Missing local catalog: explicit English fallback',catalog_failure)
        check('Slow local catalog: eventual local Spanish',lambda:catalog_failure(True))
        if args.external:check('External service smoke: Linux transitions',lambda:cli('Linux','external-service'),'external Google service allowed / local catalog owns learning text')
        if args.mock_startup:
            def mock():
                c=context();c.route('https://translate.google.com/translate_a/element.js*',lambda r:r.fulfill(content_type='application/javascript',body="setTimeout(()=>{window.google={translate:{TranslateElement:function(){const s=document.createElement('select');s.className='goog-te-combo';s.innerHTML='<option value=es>Español</option>';document.getElementById('google_translate_element').append(s)}}};window.projectsGoogleTranslateInit()},1500)"))
                p=open_page(c,'CLIs/Linux/index.html');p.wait_for_timeout(1800)
                p.locator('#cmdInput').fill('pwd');p.locator('#cmdInput').press('Enter');visible(p)
                text=p.locator('#scenarioGoal').inner_text();c.close();return {'nextVisibleTask':text}
            check('Slow startup-only translator cannot overwrite local Spanish',mock,'MOCKED external translator / real local HTTP and production catalog')
        browser.close()
    server.shutdown();server.server_close()
    (args.output/'results.json').write_text(json.dumps({'transport':'real Chromium / local HTTP','checks':results,'limitations':['Machine-translated quiz catalog with structural checks and targeted semantic review; no independent bilingual review of every quiz sentence','External service behavior only tested in explicitly marked smoke test']},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f"{sum(r['status']=='PASS' for r in results)}/{len(results)} checks passed")
    return int(any(r['status']=='FAIL' for r in results))

if __name__=='__main__':raise SystemExit(main())
