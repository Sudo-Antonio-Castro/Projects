"""Native keyboard/mouse interactions, persistence and layout over local HTTP.

External resources are blocked. This suite tests the production local catalog,
not a mocked translator. Deployed and actual-service evidence is kept separate.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
import argparse,json,re,threading,traceback
ROOT=Path(__file__).resolve().parents[1]
CATALOG=json.loads((ROOT/'assets/learning-es.json').read_text(encoding='utf-8'))
CONNECTOR='CompTIA/A+/1201/Final_Exam/connector-match-lab.html'

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'test-results/mobile/interactions');args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/';results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch()
  def context(language,width=390):
   c=browser.new_context(viewport={'width':width,'height':844});c.route('https://**/*',lambda r:r.abort());c.add_init_script(f"localStorage.setItem('projects-site-language','{language}')");return c
  def page(c,path,language):
   p=c.new_page();p.set_default_timeout(5000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+path,wait_until='domcontentloaded')
   p.wait_for_function("document.querySelector('[data-learning-source]')")
   if language=='es':p.wait_for_function("document.querySelector('[data-learning-source][lang=es]')")
   assert not errors,errors
   return p
  def localized(p):
   rows=p.locator('[data-learning-source]').evaluate_all("nodes=>nodes.map(n=>({source:n.dataset.learningSource,params:JSON.parse(n.dataset.learningParams||'{}'),paramSources:JSON.parse(n.dataset.learningParamSources||'{}'),text:n.textContent,lang:n.lang}))")
   for row in rows:
    assert row['source'] in CATALOG,row
    values={**row['params'],**{k:CATALOG[v] for k,v in row['paramSources'].items()}}
    expected=re.sub(r'\{(\w+)\}',lambda m:str(values.get(m.group(1),m.group(0))),CATALOG[row['source']])
    assert row['text']==expected and row['lang']=='es',row
   assert p.locator('#learning-language-status').is_hidden()
  def check(name,fn):
   try:details=fn();results.append({'test':name,'status':'PASS','details':details});print('PASS',name,flush=True)
   except Exception:results.append({'test':name,'status':'FAIL','error':traceback.format_exc()});print('FAIL',name,results[-1]['error'][-700:],flush=True)
   (args.output/'checkpoint.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
  def tab_to(p,selector):
   for _ in range(70):
    if p.locator(selector).evaluate('node=>node===document.activeElement'):return
    p.keyboard.press('Tab')
   raise AssertionError('Control unreachable by Tab: '+selector)
  def connector_keyboard(language):
   c=context(language);p=page(c,CONNECTOR,language);announcements=[]
   for index,(cable,port) in enumerate([('c2','eth-wall'),('c4','phone-wall'),('c3','coax-wall'),('c1','fiber-wall')]):
    cableSelector=f'button.cable-card[data-cable-id="{cable}"]';portSelector=f'button.port-card[data-port-id="{port}"]'
    tab_to(p,cableSelector);assert float(p.locator(cableSelector).evaluate("e=>parseFloat(getComputedStyle(e).outlineWidth)"))>=3
    p.keyboard.press('Enter' if index%2==0 else 'Space')
    assert p.locator(cableSelector).get_attribute('aria-pressed')=='true'
    assert p.locator(cableSelector).evaluate('e=>e===document.activeElement')
    tab_to(p,portSelector);p.keyboard.press('Space' if index%2==0 else 'Enter')
    assert p.locator(portSelector).evaluate('e=>e===document.activeElement')
    assert p.locator(portSelector).get_attribute('aria-disabled')=='true'
    assert p.evaluate('Object.keys(state.scenarios[0].matched).length')==index+1
    assert p.locator('#statusMessage').get_attribute('role')=='status'
    assert p.locator('#statusMessage').get_attribute('aria-live')=='polite'
    announcements.append(p.locator('#statusMessage').inner_text())
    if language=='es':localized(p)
   expected='Escenario completado. Los 4 conectores están emparejados correctamente.' if language=='es' else 'Scenario complete. All 4 connectors are matched correctly.'
   assert announcements[-1]==expected,announcements
   p.screenshot(path=str(args.output/f'connector-keyboard-{language}.png'),full_page=True)
   snapshot=p.locator('#portGrid').aria_snapshot();c.close();return {'keyboardOnly':True,'announcements':announcements,'accessibilitySnapshot':snapshot,'focusRetainedAfterEachRender':True}
  for language in ['en','es']:check('Keyboard-only connector completion: '+language,lambda l=language:connector_keyboard(l))
  def connector_pointer():
   c=context('es',1440);p=page(c,CONNECTOR,'es');p.locator('.port-card[data-port-id="eth-wall"]').click()
   assert 'Selecciona primero' in p.locator('#statusMessage').inner_text()
   p.locator('.cable-card[data-cable-id="c2"]').click();p.locator('.port-card[data-port-id="phone-wall"]').click()
   assert 'no encaja' in p.locator('#statusMessage').inner_text();assert p.evaluate('Object.keys(state.scenarios[0].matched).length')==0
   p.locator('.port-card[data-port-id="eth-wall"]').click()
   # Start an actual native drag before scrolling the off-screen target into view.
   # drag_to scrolls both endpoints first, which can move a tall board between
   # mousedown and dragstart and prevent the gesture from starting.
   source=p.locator('.cable-card[data-cable-id="c4"]');target=p.locator('.port-card[data-port-id="phone-wall"]')
   source.hover();box=source.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+12,y-12,steps=5)
   target.scroll_into_view_if_needed();box=target.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   p.mouse.move(x,y,steps=10);p.mouse.move(x+1,y+1);p.mouse.up()
   assert p.evaluate('state.scenarios[0].matched["phone-wall"]')=='c4';localized(p)
   p.locator('#hintBtn').click();assert 'Pista:' in p.locator('#statusMessage').inner_text();localized(p)
   p.locator('.scenario-btn[data-index="1"]').click();assert p.locator('.scenario-btn[data-index="1"]').evaluate('e=>e===document.activeElement')
   p.locator('#nextBtn').click();localized(p);p.locator('#resetBtn').click();localized(p)
   c.close();return {'click':True,'wrongMatchAnnounced':True,'nativeDragAndDrop':True,'scenarioButtonFocusRetained':True}
  check('Connector click, native drag, wrong match, hints and scenario focus',connector_pointer)
  def cli(platform,language):
   path=f'CLIs/{platform}/index.html';data=json.loads(re.search(r'const labData = (.*);',(ROOT/path).read_text(encoding='utf-8')).group(1));first=data['scenarios'][0]['steps'][0]
   c=context(language);p=page(c,path,language);orders=[]
   p.locator('#cmdInput').fill('unfinished-command');p.locator('#cmdInput').evaluate('e=>e.setSelectionRange(3,8)')
   for width in [320,390,768,1440,390]:
    p.set_viewport_size({'width':width,'height':844});p.wait_for_timeout(50)
    expected=['terminal-wrap','task-panel','scenario-panel'] if width<=780 else ['scenario-panel','terminal-wrap','task-panel']
    order=p.locator('#app > *').evaluate_all("nodes=>nodes.map(n=>['terminal-wrap','task-panel','scenario-panel'].find(k=>n.classList.contains(k)))")
    assert order==expected,(width,order)
    visual=p.locator('#app > *').evaluate_all('nodes=>nodes.map(n=>({y:n.getBoundingClientRect().top,x:n.getBoundingClientRect().left}))')
    if width<=780:assert visual[0]['y']<visual[1]['y']<visual[2]['y'],visual
    else:assert visual[0]['x']<visual[1]['x']<visual[2]['x'],visual
    assert p.locator('#cmdInput').input_value()=='unfinished-command'
    assert p.locator('#cmdInput').evaluate('e=>e===document.activeElement && e.selectionStart===3 && e.selectionEnd===8')
    assert float(p.locator('#cmdInput').evaluate('e=>parseFloat(getComputedStyle(e).outlineWidth)'))>=3
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    orders.append({'width':width,'DOMOrder':order})
   p.locator('#cmdInput').fill(first['expected']);p.locator('#cmdInput').press('Enter');p.locator('#revealBtn').click()
   assert p.evaluate('state.outcomes[0].slice(0,2)')==['independent','assisted']
   independent='Sin ayuda' if language=='es' else 'Independent';assisted='Con ayuda: respuesta mostrada' if language=='es' else 'Assisted — revealed'
   assert p.locator('.step-result').all_inner_texts()==[independent,assisted]
   p.locator('#cmdInput').fill('draft-for-reload');before=p.evaluate('JSON.stringify(state)')
   p.reload(wait_until='domcontentloaded');p.wait_for_selector('#cmdInput');assert p.locator('#cmdInput').input_value()=='draft-for-reload'
   assert p.evaluate('JSON.stringify(state)')==before
   if not p.locator('#site-language-select').is_visible():p.locator('.site-language-settings summary').click()
   p.select_option('#site-language-select','en' if language=='es' else 'es');p.wait_for_timeout(100)
   p.select_option('#site-language-select',language);assert p.locator('#cmdInput').input_value()=='draft-for-reload';assert p.evaluate('JSON.stringify(state)')==before
   if language=='es':p.wait_for_function("document.getElementById('scenarioGoal').lang==='es'");localized(p)
   p.screenshot(path=str(args.output/f'cli-{platform}-{language}-assistance.png'),full_page=True)
   dialogs=[]
   for button in ['resetScenarioBtn','resetAllBtn']:
    p.once('dialog',lambda d:(dialogs.append(d.message),d.dismiss()));p.locator('#'+button).click();assert p.evaluate('JSON.stringify(state)')==before
   assert all(text.startswith('¿Reiniciar') if language=='es' else text.startswith('Reset ') for text in dialogs),dialogs
   p.once('dialog',lambda d:d.accept());p.locator('#resetScenarioBtn').click();assert p.evaluate('state.progress[0]')==0;assert p.locator('#cmdInput').input_value()==''
   # Complete a scenario entirely through reveal: it must never claim independent completion.
   for _ in data['scenarios'][0]['steps']:p.locator('#revealBtn').click()
   source=p.locator('#scenarioGoal').get_attribute('data-learning-source');assert source=='Scenario complete with assistance.'
   assert p.evaluate('state.outcomes[0].every(x=>x==="assisted")')
   completion=p.locator('#scenarioGoal').inner_text();p.once('dialog',lambda d:d.accept());p.locator('#resetAllBtn').click();assert p.evaluate('state.progress.every(x=>x===0)')
   p.locator('#cmdInput').fill('first-scenario-draft');p.locator('#scenarioList button').nth(1).click()
   assert p.evaluate('state.active')==1
   assert p.locator('#scenarioGoal').evaluate('e=>e.getBoundingClientRect().top>=document.querySelector("header").getBoundingClientRect().bottom && e.getBoundingClientRect().bottom<innerHeight')
   p.locator('#cmdInput').fill('second-scenario-draft');p.locator('#scenarioList button').first.click()
   assert p.locator('#cmdInput').input_value()=='first-scenario-draft'
   c.close();return {'orders':orders,'independentLabel':independent,'assistedLabel':assisted,'assistedCompletion':completion,'genuineReloadPreservedProgressOutcomesAndDraft':True,'resetDialogs':dialogs,'cancelPreservedState':True,'confirmClearedState':True}
  for platform in ['Linux','Windows','MacOS']:
   for language in ['en','es']:check('CLI mobile order, assistance, reset and real reload: '+platform+' '+language,lambda x=platform,l=language:cli(x,l))
  def legacy(platform):
   path=f'CLIs/{platform}/index.html';data=json.loads(re.search(r'const labData = (.*);',(ROOT/path).read_text(encoding='utf-8')).group(1));count=len(data['scenarios']);old={'active':0,'progress':[2]+[0]*(count-1),'complete':[False]*count,'commands':[[s['expected'] for s in data['scenarios'][0]['steps'][:2]]]+[[] for _ in range(count-1)]}
   c=context('es');key='/'+path+'::progress-v2';c.add_init_script(f"if(!localStorage.getItem({json.dumps(key)}))localStorage.setItem({json.dumps(key)},{json.dumps(json.dumps(old))})")
   p=page(c,path,'es');assert p.evaluate('state.outcomes[0].slice(0,2)')==['legacy','legacy'];assert p.evaluate('state.progress[0]')==2
   assert p.locator('.step-result').all_inner_texts()==['Completado en una versión anterior']*2
   text=p.locator('#completionSummary').inner_text();assert 'Se desconoce si se usó ayuda en 2 pasos anteriores.' in text
   p.reload(wait_until='domcontentloaded');p.wait_for_function("document.getElementById('scenarioGoal').lang==='es'");assert p.evaluate('state.outcomes[0].slice(0,2)')==['legacy','legacy'];c.close();return {'legacyProgress':2,'outcomes':['legacy','legacy'],'visibleSummary':text}
  for platform in ['Linux','Windows','MacOS']:check('Compatible legacy saved data: '+platform,lambda x=platform:legacy(x))
  def article(path):
   c=context('en');p=c.new_page();p.goto(base+path,wait_until='domcontentloaded')
   code=p.locator('pre code').all_text_contents();rows=[]
   for width in [320,390,768,1440]:
    p.set_viewport_size({'width':width,'height':844})
    dimensions=p.evaluate("({viewport:innerWidth,content:document.documentElement.scrollWidth,bodyOverflow:getComputedStyle(document.body).overflowX,htmlOverflow:getComputedStyle(document.documentElement).overflowX})")
    assert dimensions['content']<=width+1,dimensions
    assert dimensions['bodyOverflow']!='hidden' and dimensions['htmlOverflow']!='hidden',dimensions
    assert p.locator('pre code').all_text_contents()==code
    for element in p.locator('header .controls input,header .controls button').all():
     rect=element.bounding_box();assert rect['x']>=0 and rect['x']+rect['width']<=width+1,rect
    assert all(value in ['auto','scroll'] for value in p.locator('pre').evaluate_all('nodes=>nodes.map(n=>getComputedStyle(n).overflowX)'))
    rows.append(dimensions)
   c.close();return {'widths':rows,'technicalCodeUnchanged':True,'codeBlocksScrollLocally':True}
  for path in ['IT-Knowledge-Base-Articles/AI/Ollama.html','IT-Knowledge-Base-Articles/Kali-Linux/Wifite.html']:
   check('Article containers and header fit without page clipping: '+path,lambda x=path:article(x))
  browser.close()
 server.shutdown();server.server_close();(args.output/'results.json').write_text(json.dumps({'environment':'LOCAL HTTP / real Chromium / external resources blocked / no translation mock','checks':results,'limitations':['ARIA and keyboard behavior checked in Chromium; no NVDA, VoiceOver or TalkBack session','Deployed-site results are recorded separately']},ensure_ascii=False,indent=2),encoding='utf-8');print(f"{sum(r['status']=='PASS' for r in results)}/{len(results)} checks passed");return int(any(r['status']=='FAIL' for r in results))
if __name__=='__main__':raise SystemExit(main())
