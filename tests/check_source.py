#!/usr/bin/env python3
"""Check static references and JavaScript syntax without executing site scripts."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from bs4 import BeautifulSoup
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
failures=[]; scripts=0; references=0
for path in ROOT.rglob('*.js'):
    if '.git' in path.parts: continue
    result=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    scripts+=1
    if result.returncode: failures.append({'file':str(path.relative_to(ROOT)),'syntax':result.stderr})
html_files=list(ROOT.rglob('*.html'))
for path in html_files:
    soup=BeautifulSoup(path.read_text(),'html.parser')
    for tag in soup.find_all(['a','link','script','img']):
        value=tag.get('src') or tag.get('href') or ''
        ref=urlsplit(value)
        if not value or ref.scheme or ref.netloc or not ref.path: continue
        rel=unquote(ref.path)
        if rel.startswith('/Projects/'):target=ROOT/rel[len('/Projects/'):]
        elif rel.startswith('/'):target=ROOT/rel.lstrip('/')
        else:target=(path.parent/rel).resolve()
        references+=1
        if not target.exists():failures.append({'file':str(path.relative_to(ROOT)),'missing':value})
    for tag in soup.select('script:not([src])'):
        if tag.get('type','') not in ('','text/javascript','application/javascript','module'):continue
        result=subprocess.run(['node','--check'],input=tag.get_text(),capture_output=True,text=True)
        scripts+=1
        if result.returncode:failures.append({'file':str(path.relative_to(ROOT)),'inlineSyntax':result.stderr})
engines=list(ROOT.glob('assets/assessment-controller.js'))
if len(engines)!=1 or list(ROOT.rglob('quiz-app.js')):failures.append({'controllers':'Expected one canonical assessment controller and no copies'})
print(json.dumps({'htmlPages':len(html_files),'javascriptBlocksChecked':scripts,'localFileReferences':references,'canonicalAssessmentControllers':len(engines),'failures':failures},indent=2))
sys.exit(bool(failures))
