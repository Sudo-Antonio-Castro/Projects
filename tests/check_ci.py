"""Validate workflow syntax and non-deployment/minimum-permission policy locally."""
from pathlib import Path
import re, yaml

ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'.github/workflows/regression.yml';raw=path.read_text(encoding='utf8')
data=yaml.load(raw,Loader=yaml.BaseLoader)
assert data['permissions']=={'contents':'read'}
assert set(data['on'])=={'push','pull_request'}
assert data['on']['push']['branches-ignore']==['main']
assert data['on']['pull_request']['branches']==['main']
assert set(data['jobs'])=={'static','browser','visual'}
expected={'ux_regression','language_regression','mobile_accessibility','navigation_directory','assessment_experience','progress_resume'}
assert set(data['jobs']['browser']['strategy']['matrix']['suite'])==expected
assert all((ROOT/'tests'/f'{name}.py').is_file() for name in expected)
allowed={'actions/checkout','actions/setup-python','actions/setup-node','actions/upload-artifact'}
for job in data['jobs'].values():
    assert 1<=int(job['timeout-minutes'])<=20
    assert 'environment' not in job and 'permissions' not in job
    for step in job['steps']:
        if 'uses' not in step:continue
        action,sha=step['uses'].split('@');assert action in allowed and re.fullmatch('[a-f0-9]{40}',sha)
        inputs=step.get('with',{})
        if action=='actions/checkout':assert inputs['persist-credentials']=='false'
        if action=='actions/setup-python':assert inputs['cache']=='pip' and 'requirements' in inputs['cache-dependency-path']
        if action=='actions/upload-artifact':
            assert step['if']=='failure()' and int(inputs['retention-days'])<=7
            assert all(p.startswith('test-results/') and p.endswith(('.png','.json','.log')) for p in inputs['path'].splitlines())
assert not re.search(r'deploy-pages|upload-pages-artifact|configure-pages|secrets\.|gh release|--external|--offline',raw)
assert 'git diff --check' in raw
assert 'tests/check_source.py' in raw and 'tests/check_learning_catalog.py' in raw
assert 'tests/design_visual.py --site-root' in raw and '--baseline test-results/visual/before' in raw
print('PASS workflow YAML, read-only permission, pinned official actions, all six browser suites, local visual comparison, bounded failure evidence, no deployment or external-service smoke')
