"""Real Chromium/local HTTP assessment UX checks.

External HTTPS is blocked; the production Spanish catalog is used. Clock changes,
legacy saved records and storage denial are explicitly controlled test inputs.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timezone, timedelta
from playwright.sync_api import sync_playwright
import argparse, json, re, threading, traceback

ROOT = Path(__file__).resolve().parents[1]
CAT = json.loads((ROOT / 'assets/learning-es.json').read_text(encoding='utf8'))
LINUX = 'CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html'
FINAL = 'CompTIA/A+/1201/Final_Exam/index.html'
QUIZ = 'CompTIA/A+/1201/Quiz_System_Devices/index.html'
PAGES = [FINAL + '?version=1', FINAL + '?version=2', 'CompTIA/A+/1202/Final_Exam/index.html',
         'CompTIA/Linux+/final/index.html', LINUX, 'CompTIA/Security+/Final_Exam/index.html',
         'EC-Council/CEH/Final_Exam/index.html', QUIZ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'test-results/assessment/experience')
    parser.add_argument('--match', action='append', help='Run checks containing any supplied text; omitted checks are not counted')
    args = parser.parse_args(); args.output.mkdir(parents=True, exist_ok=True); rows = []
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
        def log_message(self, *a): pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start(); base = f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as pw:
        browser = pw.chromium.launch(); contexts = []

        def ready(p):
            try: p.locator('#quizForm[data-initialized="true"]').wait_for(state='attached')
            except Exception as error:
                state = p.evaluate("() => ({url:location.href,form:!!document.querySelector('#quizForm'),initialized:document.querySelector('#quizForm')?.dataset.initialized,bank:window.QUIZ_BANK?.length,config:window.QUIZ_CONFIG,scripts:[...document.scripts].filter(s=>s.src.includes('quiz-')).map(s=>s.src),results:document.querySelector('#results')?.textContent})")
                raise AssertionError({'startup': state, 'pageErrors': p.assessment_errors, 'network': p.assessment_network}) from error

        def page(route=LINUX, language='en', width=390, theme='dark', clock=False, denied=False):
            c = browser.new_context(viewport={'width': width, 'height': 844}, reduced_motion='reduce'); contexts.append(c)
            c.route('https://**/*', lambda r: r.abort())
            c.add_init_script(f"if(!localStorage.getItem('projects-site-language'))localStorage.setItem('projects-site-language','{language}');localStorage.setItem('projects-roadmap-theme','{theme}');localStorage.setItem('kb_theme','{theme}')")
            if denied: c.add_init_script("Object.defineProperty(window,'sessionStorage',{value:{getItem(){throw Error('controlled storage denial')},setItem(){throw Error('controlled storage denial')},removeItem(){throw Error('controlled storage denial')}}})")
            p = c.new_page(); p.set_default_timeout(6000); errors = []; p.on('pageerror', lambda e: errors.append(str(e)))
            p.assessment_errors = errors
            p.assessment_network = []
            p.on('requestfailed', lambda request: p.assessment_network.append({'url': request.url, 'failure': request.failure}) if 'quiz-' in request.url else None)
            p.on('response', lambda response: p.assessment_network.append({'url': response.url, 'status': response.status}) if 'quiz-app.js' in response.url else None)
            p.on('console', lambda message: p.assessment_network.append({'console': message.text}) if message.type == 'error' else None)
            if clock: p.clock.install(time=datetime(2026, 10, 15, 18, 0, tzinfo=timezone.utc))
            assert p.goto(base + route, wait_until='networkidle').ok
            ready(p)
            if language == 'es': p.wait_for_function("document.querySelector('#startAssessment')?.lang==='es'")
            assert not errors, errors
            return p

        def record(p):
            return p.evaluate("() => {const key=Object.keys(sessionStorage).find(k=>k.startsWith('projects-assessment:')&&k.endsWith('?version='+(new URLSearchParams(location.search).get('version')||'')));return {key,state:JSON.parse(sessionStorage.getItem(key))}}")

        def restore(p, data):
            url = p.url
            # Let the previous page checkpoint before installing a legacy record.
            p.goto(base + 'index.html', wait_until='domcontentloaded')
            p.evaluate('data=>sessionStorage.setItem(data.key,JSON.stringify(data.state))', data)
            p.goto(url, wait_until='networkidle')
            ready(p)

        def start(p):
            if p.locator('#startAssessment').is_visible(): p.locator('#startAssessment').click()

        def answer(p, index=0):
            q = p.locator('.question-card,.question').nth(index)
            q.locator('input[type=radio]').first.check(); return q.get_attribute('id').removeprefix('question-')

        def submit(p):
            p.locator('button[type=submit]').click(); assert p.locator('dialog').evaluate('e=>e.open')
            p.locator('#confirmSubmit').click()

        def local_text(p):
            nodes = p.locator('[data-learning-source]:visible').evaluate_all("ns=>ns.map(n=>({source:n.dataset.learningSource,params:JSON.parse(n.dataset.learningParams||'{}'),paramSources:JSON.parse(n.dataset.learningParamSources||'{}'),text:n.textContent,lang:n.lang}))")
            for node in nodes:
                assert node['source'] in CAT, node
                values = {**node['params'], **{k: CAT[v] for k, v in node['paramSources'].items()}}
                expected = re.sub(r'\{(\w+)\}', lambda m: str(values.get(m[1], m[0])), CAT[node['source']])
                assert node['text'] == expected and node['lang'] == 'es', node
            for node in p.locator('[data-learning-aria-label]').all():
                assert node.get_attribute('aria-label') == CAT[node.get_attribute('data-learning-aria-label')]
            assert p.locator('#learning-language-status').is_hidden()

        def check(name, fn, mode='LOCAL HTTP / production catalog / ordinary clock'):
            if args.match and not any(part in name for part in args.match): return
            try:
                details = fn(); rows.append({'test': name, 'mode': mode, 'status': 'PASS', 'details': details})
            except Exception: rows.append({'test': name, 'mode': mode, 'status': 'FAIL', 'error': traceback.format_exc()})
            print(rows[-1]['status'], name, rows[-1].get('error', '')[-1500:], flush=True)
            (args.output / 'results.json').write_text(json.dumps({'environment': 'Real Chromium / local HTTP / external HTTPS blocked / no translation mocks', 'selection': args.match or 'all', 'checks': rows}, ensure_ascii=False, indent=2), encoding='utf8')
            for c in contexts: c.close()
            contexts.clear()

        def lifecycle(route):
            p = page(route, clock=True); initial = record(p); timed = route != QUIZ
            n = p.locator('.question-card,.question').count()
            if timed:
                assert initial['state']['deadline'] is None and initial['state']['started'] is False
                assert p.locator('#quizForm').is_hidden()
                assert p.locator('.assessment-name').inner_text().strip()
                assert p.locator('input[type=radio]:not(:disabled)').count() == 0
                p.clock.fast_forward(300000); assert record(p)['state']['deadline'] is None
                p.reload(wait_until='networkidle'); assert p.locator('#startAssessment').is_visible()
                info = p.locator('[data-learning-source="{count} questions · {minutes} minutes"]').evaluate('e=>JSON.parse(e.dataset.learningParams)')
                assert info['count'] == n
                p.clock.pause_at(datetime(2026, 10, 15, 18, 0, tzinfo=timezone.utc) + timedelta(minutes=10))
                start(p); active = record(p)['state']; deadline = active['deadline']
                assert deadline == p.evaluate('Date.now()') + info['minutes'] * 60000
                p.clock.fast_forward(2000)
                p.locator('#startAssessment').evaluate("e=>{e.dispatchEvent(new Event('click'));e.dispatchEvent(new Event('click'))}")
                assert record(p)['state']['deadline'] == deadline
            else:
                assert p.locator('#startAssessment').is_hidden() and p.locator('#quizForm').is_visible()
                assert initial['state']['deadline'] is None
            answer(p); state = record(p)['state']; p.reload(wait_until='networkidle')
            assert p.locator('input:checked').count() == 1
            assert record(p)['state']['deadline'] == state['deadline']
            submit(p); result = p.locator('#results').inner_text(); locked = record(p)['state']
            feedback_count = p.locator('.answer-feedback').count()
            assert p.locator('.correct-answer').count() == n
            p.locator('#confirmSubmit').evaluate("e=>e.dispatchEvent(new Event('click'))")
            p.locator('#quizForm').evaluate("e=>e.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))")
            assert record(p)['state']['submittedAt'] == locked['submittedAt']
            assert p.locator('.answer-feedback').count() == feedback_count
            p.reload(wait_until='networkidle'); assert p.locator('#results').inner_text() == result
            assert p.locator('input[type=radio]:not(:disabled)').count() == 0
            return {'timed': timed, 'questions': n, 'newAttemptWaitsForStart': timed, 'singleDeadline': state['deadline'], 'lockedResult': result}

        for route in PAGES: check('Start/reload/submit/lock: ' + route, lambda route=route: lifecycle(route), 'LOCAL HTTP / controlled clock')

        def navigation():
            p = page(clock=True); start(p)
            p.locator('.assessment-overview summary').click()
            p.locator('[data-review-filter=flagged]').click()
            assert p.locator('.assessment-question-link:visible').count() == 0
            assert p.get_by_text('No questions match this filter.', exact=True).is_visible()
            p.locator('[data-review-filter=all]').click()
            first = answer(p)
            p.locator(f'.assessment-flag[data-question-id="{first}"]').click()
            assert p.locator(f'.assessment-flag[data-question-id="{first}"]').get_attribute('aria-pressed') == 'true'
            second = p.locator('.assessment-question-link').nth(1).get_attribute('data-question-id')
            p.locator(f'.assessment-question-link[data-question-id="{second}"]').click()
            assert p.locator('input:focus').get_attribute('name') == 'q' + second
            flag = p.locator(f'.assessment-flag[data-question-id="{second}"]'); flag.click(); flag.click()
            assert flag.get_attribute('aria-pressed') == 'false'
            p.locator('[data-review-filter=flagged]').click(); assert p.locator('.assessment-question-link:visible').count() == 1
            p.locator('[data-review-filter=unanswered]').click(); assert p.locator('.assessment-question-link:visible').count() == 5
            p.locator('button[data-learning-source="Review flagged"]').click()
            assert p.locator('input:focus').get_attribute('name') == 'q' + first
            p.locator('button[data-learning-source="Review unanswered"]').click()
            assert p.locator('input:focus').get_attribute('name') == 'q' + second
            assert p.locator('.answer-feedback').count() == 0
            assert p.locator('.correct-answer,.user-wrong,.reviewed').count() == 0
            before = record(p)['state']; chosen = p.locator('input:checked').get_attribute('value')
            p.locator('.site-language-settings summary').click(); p.locator('#site-language-select').focus()
            for language in ['es', 'en', 'es']:
                p.locator('#site-language-select').select_option(language)
                if language == 'es': p.wait_for_function("document.querySelector('#answerProgress').lang==='es'"); local_text(p)
                assert p.locator('#site-language-select').evaluate('e=>e===document.activeElement')
                assert record(p)['state'] == before
                assert p.locator('input:checked').get_attribute('value') == chosen
            p.reload(wait_until='networkidle'); local_text(p)
            assert record(p)['state'] == before
            assert p.locator('input:focus').get_attribute('name') == 'q' + second
            rect = p.locator('input:focus').bounding_box()
            assert rect['y'] >= p.locator('header').bounding_box()['height'] and rect['y'] + rect['height'] <= 844
            return {'state': before, 'visibleSpanishProgress': p.locator('#answerProgress').inner_text(), 'flags': p.locator('.assessment-flag[aria-pressed=true]').all_inner_texts()}
        check('Flags, filters, explicit question focus and language/reload preservation', navigation, 'LOCAL HTTP / local catalog / controlled clock')

        def confirmation_expiry():
            p = page(clock=True); start(p); first = answer(p); p.locator(f'.assessment-flag[data-question-id="{first}"]').click()
            p.locator('.assessment-overview summary').click()
            p.locator('.assessment-question-link').nth(2).click()
            before = record(p)['state']; p.locator('button[type=submit]').click()
            assert p.locator('#submissionCounts').inner_text() == '1 answered, 5 unanswered, 1 flagged for review.'
            p.clock.fast_forward(2000); assert '11:58' in p.locator('#submissionTimer').inner_text()
            p.keyboard.press('Escape'); assert not p.locator('dialog').evaluate('e=>e.open')
            assert record(p)['state'] == before
            p.locator('button[type=submit]').click(); p.locator('#returnQuestions').click(); assert record(p)['state'] == before
            p.locator('button[type=submit]').click(); p.clock.fast_forward(720000)
            assert not p.locator('dialog').evaluate('e=>e.open')
            locked = record(p)['state']; assert locked['expired'] and locked['submittedAt'] is not None
            assert locked['deadline'] == before['deadline'] and locked['answers'] == before['answers'] and locked['flags'] == before['flags']
            p.locator('#confirmSubmit').evaluate("e=>e.dispatchEvent(new Event('click'))"); p.clock.fast_forward(3000)
            assert record(p)['state'] == locked
            assert p.locator('.correct-answer').count() == 6
            assert p.locator('.answer-feedback').count() == 7
            return {'counts': '1 answered, 5 unanswered, 1 flagged for review.', 'lockedState': locked, 'result': p.locator('#results').inner_text()}
        check('Canceled confirmation and exactly-once expiry while dialog is open', confirmation_expiry, 'LOCAL HTTP / controlled clock')

        def legacy(route):
            p = page(route, clock=True); start(p); answer(p); data = record(p)
            for key in ['started', 'flags', 'lastQuestionId']: data['state'].pop(key, None)
            original = data['state'].copy(); restore(p, data)
            assert p.locator('#startAssessment').is_hidden() and p.locator('input:checked').count() == 1
            for key, value in original.items(): assert record(p)['state'][key] == value, key
            submit(p); submitted = record(p); result = p.locator('#results').inner_text()
            for key in ['started', 'flags', 'lastQuestionId']: submitted['state'].pop(key, None)
            restore(p, submitted); assert p.locator('#results').inner_text() == result
            assert record(p)['state']['submittedAt'] == submitted['state']['submittedAt']
            assert p.locator('input:not(:disabled)').count() == 0
            # An old active record which elapsed while away grades on restoration.
            if route != QUIZ:
                data['state']['deadline'] = p.evaluate('Date.now()-1000'); restore(p, data)
                assert record(p)['state']['expired'] and p.locator('input:not(:disabled)').count() == 0
            return {'oldActiveFieldsPreserved': list(original), 'oldSubmittedLocked': True, 'oldExpiredAutoSubmitted': route != QUIZ}
        for route in PAGES: check('Legacy active/submitted/expired schema: ' + route, lambda route=route: legacy(route), 'LOCAL HTTP / controlled legacy saved records and clock')

        def failures():
            p = page(); key = record(p)['key']
            start(p); answer(p); data = record(p)
            data['state']['flags'] = ['1', '1', 'unknown', None, {}]; data['state']['lastQuestionId'] = 'unknown'
            restore(p, data); cleaned = record(p)['state']
            assert cleaned['answers'] == data['state']['answers'] and cleaned['deadline'] == data['state']['deadline']
            assert cleaned['flags'] == ['1'] and cleaned['lastQuestionId'] is None
            assert p.locator('.attempt-recovery-notice').is_hidden()
            incompatible = {**cleaned, 'signature': 'different-content'}
            for raw in ['{', '{}', 'null', '[]', json.dumps(incompatible)]:
                url = p.url; p.goto(base + 'index.html', wait_until='domcontentloaded')
                p.evaluate('a=>sessionStorage.setItem(a.key,a.raw)', {'key': key, 'raw': raw}); p.goto(url, wait_until='networkidle')
                assert p.locator('.attempt-recovery-notice').is_visible()
                assert p.evaluate('key=>sessionStorage.getItem(key)', key) == raw
                assert p.locator('#startAssessment').is_visible()
                start(p); assert record(p)['state']['started'] is True
                assert p.locator('.attempt-recovery-notice').is_hidden()
            p = page(denied=True); assert p.locator('.attempt-storage-notice').is_visible()
            start(p); answer(p); submit(p)
            assert p.locator('input:not(:disabled)').count() == 0 and p.locator('#results').is_visible()
            return {'malformedRecordsRetainedUntilStart': 5, 'controlledStorageDenialStillAllowsInMemoryGrading': True}
        check('Unavailable storage and explicit malformed-record recovery', failures, 'LOCAL HTTP / controlled storage fault and malformed-record injection')

        def tab_to(p, selector, backwards=False):
            for _ in range(160):
                if p.locator(selector).evaluate('e=>e===document.activeElement'): return
                p.keyboard.press('Shift+Tab' if backwards else 'Tab')
            raise AssertionError('Keyboard target unreachable: ' + selector)

        def matrix():
            evidence = []
            for width in [320, 390, 768, 1440]:
                for language in ['en', 'es']:
                    for theme in ['light', 'dark']:
                        p = page(language=language, width=width, theme=theme)
                        slug = f'{language}-{theme}-{width}'
                        if language == 'es': local_text(p)
                        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                        p.screenshot(path=str(args.output / f'start-{slug}.png'), full_page=True)
                        tab_to(p, '#startAssessment')
                        assert p.locator('#startAssessment').evaluate('e=>parseFloat(getComputedStyle(e).outlineWidth)') >= 3
                        p.keyboard.press('Enter')
                        p.keyboard.press('ArrowDown')
                        tab_to(p, '.assessment-flag[data-question-id="1"]', backwards=True); p.keyboard.press('Space')
                        tab_to(p, '.assessment-overview summary', backwards=True); p.keyboard.press('Enter')
                        tab_to(p, '.assessment-question-link[data-question-id="2"]'); p.keyboard.press('Enter')
                        assert p.locator('input:focus').get_attribute('name') == 'q2'
                        rect = p.locator('input:focus').evaluate('e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,visible:e===document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)}}')
                        assert rect['visible'] and rect['top'] >= p.locator('header').bounding_box()['height'] and rect['bottom'] <= 844, rect
                        if language == 'es': local_text(p)
                        p.screenshot(path=str(args.output / f'question-{slug}.png'))
                        tab_to(p, 'button[type=submit]'); p.keyboard.press('Enter')
                        assert p.locator('#returnQuestions').evaluate('e=>e===document.activeElement')
                        p.screenshot(path=str(args.output / f'review-{slug}.png'))
                        if language == 'es': local_text(p)
                        p.keyboard.press('Enter'); assert not p.locator('dialog').evaluate('e=>e.open')
                        p.keyboard.press('Enter'); p.keyboard.press('Tab'); assert p.locator('#confirmSubmit').evaluate('e=>e===document.activeElement')
                        p.keyboard.press('Enter'); assert p.locator('#results').is_visible()
                        assert p.locator('input:not(:disabled)').count() == 0
                        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                        evidence.append({'width': width, 'language': language, 'theme': theme, 'keyboardOnly': True, 'focus': rect, 'reviewCounts': p.locator('#submissionCounts').inner_text()})
                        contexts.remove(p.context); p.context.close()
            return evidence
        check('Keyboard-only assessment, localization, focus and screenshots across four widths/two themes', matrix)

        def bank_layouts():
            evidence = []
            for route, slug in [(FINAL + '?version=2', 'a-plus-version-2'), (QUIZ, 'untimed')]:
                for width in [320, 390, 768, 1440]:
                    for language in ['en', 'es']:
                        for theme in ['light', 'dark']:
                            p = page(route, language, width, theme)
                            name = f'{slug}-{language}-{theme}-{width}'
                            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                            if language == 'es': local_text(p)
                            p.screenshot(path=str(args.output / f'initial-{name}.png'), full_page=route != QUIZ)
                            start(p); first = answer(p)
                            p.locator(f'.assessment-flag[data-question-id="{first}"]').click()
                            p.locator('.assessment-overview summary').click()
                            p.locator('.assessment-overview').scroll_into_view_if_needed()
                            p.screenshot(path=str(args.output / f'overview-{name}.png'))
                            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                            if language == 'es': local_text(p)
                            evidence.append({'route': route, 'width': width, 'language': language, 'theme': theme,
                                             'overviewLabel': p.locator('.assessment-question-link').first.inner_text()})
                            contexts.remove(p.context); p.context.close()
            return evidence
        check('Bank-rendered timed and untimed layouts/local text across four widths/two themes', bank_layouts)
        browser.close()
    server.shutdown(); server.server_close()
    print(f"{sum(row['status']=='PASS' for row in rows)}/{len(rows)} checks passed")
    raise SystemExit(any(row['status'] != 'PASS' for row in rows))


if __name__ == '__main__': main()
