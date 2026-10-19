"""Ordinary-clock deployed assessment smoke; no state or translation mocks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

OUT = Path('test-results/progress/release')
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.goto('https://sudo-antonio-castro.github.io/Projects/CompTIA/Linux+/quizzes/linux-landscape-and-server-roles-quiz/index.html', wait_until='networkidle')
    page.locator('#startAssessment').wait_for()
    def state():
        return page.evaluate("JSON.parse(sessionStorage.getItem(Object.keys(sessionStorage).find(k=>k.startsWith('projects-assessment:'))))")
    assert state()['deadline'] is None and not state()['started']
    page.reload(wait_until='networkidle')
    assert state()['deadline'] is None
    page.locator('#startAssessment').click()
    deadline = state()['deadline']
    page.locator('#startAssessment').evaluate("e=>e.dispatchEvent(new Event('click'))")
    assert state()['deadline'] == deadline
    page.locator('input[type=radio]').first.check()
    page.locator('.assessment-overview summary').click()
    page.locator('.assessment-flag').first.click()
    page.locator('.assessment-question-link').nth(1).click()
    saved = state()
    page.reload(wait_until='networkidle')
    assert state() == saved
    page.locator('.site-language-settings summary').click()
    for lang in ['es', 'en']:
        page.locator('#site-language-select').select_option(lang)
        page.wait_for_function('(lang)=>document.querySelector("#answerProgress").lang===lang', arg=lang)
        assert state() == saved
    page.locator('button[type=submit]').click()
    assert page.locator('dialog').evaluate('e=>e.open')
    page.keyboard.press('Escape')
    assert state()['submittedAt'] is None
    page.locator('button[type=submit]').click()
    page.locator('#confirmSubmit').click()
    assert state()['submittedAt'] and state()['deadline'] == deadline
    page.reload(wait_until='networkidle')
    assert page.locator('input[type=radio]:not(:disabled)').count() == 0
    page.screenshot(path=str(OUT/'submitted.png'), full_page=True)
    (OUT/'results.json').write_text(json.dumps({'origin': page.url, 'mode':'DEPLOYED / real Chromium / ordinary clock / external resources allowed / no fixtures', 'status':'PASS', 'checks':['pre-start reload has no deadline', 'start creates one deadline', 'flags and question navigation', 'reload preserves active attempt', 'English-Spanish-English preserves state', 'cancel and confirm manual submission', 'submitted reload locks answers']}, indent=2))
    browser.close()
