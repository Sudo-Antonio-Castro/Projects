"""Check Spanish learning coverage and invariants without translating source data."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
CATALOG=json.loads((ROOT/'assets/learning-es.json').read_text(encoding='utf-8'))
sources=set();counts={'bankQuestions':0,'linuxAssessments':0,'cliScenarios':0,'cliTasks':0};failures=[]
def bank(path):
    code='const fs=require("fs"),vm=require("vm");const c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],"utf8"),c);console.log(JSON.stringify(c.window))'
    return json.loads(subprocess.check_output(['node','-e',code,str(path)],text=True,encoding='utf-8'))
for path in ROOT.rglob('quiz-data.js'):
    data=bank(path)
    for q in data['QUIZ_BANK']:
        counts['bankQuestions']+=1;sources.update([q['question'],q.get('explanation',''),*q['options']])
    sources.update(data.get('MODULE_LABELS',{}).values())
for path in ROOT.rglob('*.html'):
    if '.git' in path.parts or 'test-results' in path.parts:continue
    raw=path.read_text(encoding='utf-8')
    if 'const labData = ' in raw or 'const SCENARIOS = ' in raw:
        # Literal messages passed to the existing localization helpers.
        sources.update(re.findall(r'(?:localized|confirmation)\([\"\']([^\"\'\n]+)[\"\']',raw))
        sources.update(re.findall(r'label\([^,\n]+,\s*[\"\']([^\"\'\n]+)[\"\']',raw))
    sources.update(re.findall(r'"(?:passMessage|failMessage)"\s*:\s*"([^\"]+)"',raw))
    soup=BeautifulSoup(raw,'html.parser')
    for node in soup.select('[data-learning-source],[data-learning-aria-label]'):
        sources.update(node.get(key) for key in ['data-learning-source','data-learning-aria-label'] if node.has_attr(key))
        sources.update(json.loads(node.get('data-learning-param-sources','{}')).values())
    if soup.select_one('[data-assessment]'):
        counts['linuxAssessments']+=1;sources.update(x.get_text() for x in soup.select('.question-title,.choice > span'))
    match=re.search(r'const labData = (.*);',raw)
    if path.name == 'connector-match-lab.html' and 'const SCENARIOS = ' in raw:
        extract='const fs=require("fs"),vm=require("vm");const s=fs.readFileSync(process.argv[1],"utf8");const m=s.match(/const SCENARIOS = (\\[[\\s\\S]*?\\n  \\]);/);const c={};vm.runInNewContext("data="+m[1],c);console.log(JSON.stringify(c.data))'
        connector=json.loads(subprocess.check_output(['node','-e',extract,str(path)],text=True,encoding='utf-8'))
        for scenario in connector:
            sources.update(scenario[key] for key in ['title','blurb','helper'])
            for port in scenario['ports']:sources.update(port[key] for key in ['name','sub','desc','note'])
            for cable in scenario['cables']:sources.update(cable[key] for key in ['name','desc'])
        counts['connectorScenarios']=len(connector)
        counts['connectorPorts']=sum(len(s['ports']) for s in connector)
    if not match:continue
    for scenario in json.loads(match.group(1))['scenarios']:
        counts['cliScenarios']+=1;sources.update([scenario['title'],scenario['summary']])
        for step in scenario['steps']:
            counts['cliTasks']+=1;sources.update([step['target'],step['hint']])
            # Technical literals in task prose must survive translation verbatim.
            literals=set(re.findall(r'(?:[A-Za-z]:\\|\.\\|/)[\w./\\-]+|[\w-]+\.(?:txt|md|bak|sh|zip|gz|com|log)|\b(?:root:root|student:staff|Get-Service|AppleInterfaceStyle|ssh_config|old_backups)\b',step['target']))
            for literal in literals:
                if literal not in CATALOG.get(step['target'],''):failures.append({'literalChanged':literal,'source':step['target']})
sources.discard('')
controller=(ROOT/'CompTIA/A+/1201/assets/quiz-app.js').read_text(encoding='utf-8')
sources.update(re.findall(r'localized\(\s*[\"\']([^\"\'\n]+)[\"\']',controller))
sources.update(re.findall(r'label\([^,\n]+,\s*[\"\']([^\"\'\n]+)[\"\']',controller))
sources.update(re.findall(r'learningAriaLabel\s*=\s*[\"\']([^\"\'\n]+)[\"\']',controller))
sources.update(['All questions','Unanswered questions','Flagged questions','Flag question {number}',
    'Unflag question {number}','Question {number}: answered','Question {number}: unanswered',
    'Question {number}: answered, flagged','Question {number}: unanswered, flagged','Not started'])
sources.update(['Complete with assistance','Complete; earlier assistance unknown','Assisted — revealed',
    'Completed — previous version','Independent','Reveal and advance (assisted)',
    'Scenario complete with assistance.','Scenario complete; earlier assistance history is unknown.',
    'Selected: {name}','No cable selected','completed','{matched}/{total} matched'])
for source in sorted(sources):
    if source not in CATALOG:failures.append({'missing':source})
for source,value in CATALOG.items():
    if not isinstance(value,str) or not value.strip():failures.append({'empty':source})
    if set(re.findall(r'\{\w+\}',source)) != set(re.findall(r'\{\w+\}',value)):failures.append({'placeholders':source})
    # Decimal comma/dot and surrounding units can localize; numeric values and
    # their order must not change (ports, capacities, counts, modes, versions).
    if re.findall(r'\d+',source) != re.findall(r'\d+',value):failures.append({'numbersChanged':source})
    # Canonical technical names may be identical. Prose cannot silently be English.
    commandChoice = bool(re.match(r'^(?:dnf|apt|rpm|dpkg|docker|chmod|chown|ip|passwd|usermod|ps|grep|sudo)\s',source)) and not source.endswith('.') and ' and ' not in source
    if source==value and not commandChoice and re.search(r'\b(the|is|of|in|to|and|from|for|with|which|what|why|how|during|by|should|can|will|without|never|always|because|they|it|something|someone|display|show|list|create|change|open|set|read|search|only|network|printer|power|file|device|attack|install|increase|backup|module|motherboard|mouse|speaker|fuser|monitor|reset|replacing|use)\b',source,re.I):
        failures.append({'untranslatedProse':source})
print(json.dumps({**counts,'requiredSourceStrings':len(sources),'catalogEntries':len(CATALOG),'failures':failures},ensure_ascii=False,indent=2))
sys.exit(bool(failures))
