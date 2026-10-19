"""Guard shared asset references, CSS syntax, token and directory contracts."""
from pathlib import Path
from bs4 import BeautifulSoup
import re, tinycss2

ROOT=Path(__file__).resolve().parents[1]
tokens=(ROOT/'assets/design-tokens.css').read_text(encoding='utf8')
for name in ['bg','bg-deep','panel','panel-2','text','muted','line','pink','blue','yellow','mint','shadow','max','focus','space-4','radius-card','font-body','reading-width','dialog-width']:
    assert f'--rm-{name}:' in tokens,name
def luminance(value):
    channels=[int(value.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return sum(weight*(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4) for weight,c in zip([.2126,.7152,.0722],channels))
for block in re.findall(r'\{([^{}]+)\}',tokens):
    colors=dict(re.findall(r'(--rm-[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;',block))
    if '--rm-muted' not in colors:continue
    for foreground in ['--rm-text','--rm-muted']:
        for background in ['--rm-bg','--rm-panel']:
            a,b=sorted([luminance(colors[foreground]),luminance(colors[background])])
            assert (b+.05)/(a+.05)>=4.5,(foreground,background)
def check_css(path):
    def rules(nodes):
        for node in nodes:
            assert node.type!='error',(path,node)
            if node.type=='at-rule' and node.lower_at_keyword=='import':
                match=re.search(r'url\("([^"]+)"\)',tinycss2.serialize(node.prelude));assert match and (path.parent/match[1]).is_file(),path
            if node.type=='at-rule' and node.content is not None and node.lower_at_keyword in ['media','supports','layer']:rules(tinycss2.parse_rule_list(node.content,skip_whitespace=True,skip_comments=True))
            if node.type=='qualified-rule':
                declarations=tinycss2.parse_declaration_list(node.content,skip_whitespace=True,skip_comments=True)
                assert not any(d.type=='error' for d in declarations),(path,declarations)
    rules(tinycss2.parse_stylesheet(path.read_text(encoding='utf8'),skip_comments=True,skip_whitespace=True))
for path in (ROOT/'assets').glob('*.css'):check_css(path)
components=(ROOT/'assets/roadmap-components.css').read_text(encoding='utf8')
assert '!important' not in components
compat=(ROOT/'assets/legacy-hub-compat.css').read_text(encoding='utf8')
for selector,body in re.findall(r'([^{}]+)\{([^{}]+)\}',compat):
    if '!important' in body:assert ':not(.ds-hub)' in selector
pages=0;links=0
for path in ROOT.rglob('*.html'):
    if any(p in path.parts for p in ['.git','test-results']):continue
    soup=BeautifulSoup(path.read_text(encoding='utf8'),'html.parser')
    if soup.body and 'directory-hub' in soup.body.get('class',[]):
        pages+=1;assert 'ds-hub' in soup.body['class'],path
        # These two one-off directory skins retain distinct header/hero geometry.
        # Do not extract unique blocks solely to improve a metric.
        if path.relative_to(ROOT).as_posix() in ['EC-Council/index.html','CompTIA/A+/index.html']:assert len(soup.select('style'))==1
        else:assert not soup.select('style'),f'Directory skin should be shared: {path}'
        for node in soup.select('.grid,.card-grid,.home-table'):assert 'ds-directory-list' in node.get('class',[]),(path,node)
        for node in soup.select('.card,.module-row'):assert 'ds-directory-row' in node.get('class',[]),(path,node)
    if soup.select_one('#quizForm'):
        for script in soup.select('script[src]'):
            if script['src'].endswith('assessment-controller.js'):
                assert (path.parent/script['src']).resolve()==ROOT/'assets/assessment-controller.js';links+=1
assert pages>=8 and links>=70,(pages,links)
assert not list(ROOT.rglob('quiz-app.js')) and not list(ROOT.rglob('quiz.css'))
print(f'PASS CSS syntax/imports, token roles, {pages} modern directories, {links} canonical static controller references; scoped legacy spacing only')
