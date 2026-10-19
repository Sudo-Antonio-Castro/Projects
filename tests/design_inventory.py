"""Measure checked-in source only; duplicates are evidence, not a deletion list."""
from pathlib import Path
from collections import defaultdict, Counter
from bs4 import BeautifulSoup
import argparse, hashlib, json, re, subprocess

ROOT=Path(__file__).resolve().parents[1]
def inventory():
    files=[ROOT/p for p in subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines()]
    html=[p for p in files if p.suffix=='.html' and p.exists()]
    groups=defaultdict(list); cssgroups=defaultdict(list); jsgroups=defaultdict(list); styles=0; attrs=0; important=0; family=Counter()
    for p in files:
        if not p.exists() or p.suffix not in ['.html','.css','.js']:continue
        raw=p.read_text(encoding='utf8')
        if p.suffix=='.css':
            important+=len(re.findall(r'!important\b',re.sub(r'/\*.*?\*/','',raw,flags=re.S),re.I))
            cssgroups[hashlib.sha256(raw.encode()).hexdigest()].append(p.relative_to(ROOT).as_posix())
        elif p.suffix=='.js':jsgroups[hashlib.sha256(raw.encode()).hexdigest()].append(p.relative_to(ROOT).as_posix())
        else:
            soup=BeautifulSoup(raw,'html.parser'); family.update(soup.body.get('class',[]) if soup.body else [])
            for style in soup.select('style'):
                styles+=1; code=style.get_text(); important+=len(re.findall(r'!important\b',re.sub(r'/\*.*?\*/','',code,flags=re.S),re.I))
                groups[hashlib.sha256(code.strip().encode()).hexdigest()].append(p.relative_to(ROOT).as_posix())
            for node in soup.select('[style]'):
                attrs+=1;important+=len(re.findall(r'!important\b',node['style'],re.I))
    duplicates=lambda g:[{'copies':len(paths),'paths':paths} for paths in g.values() if len(paths)>1]
    return {'scope':'git-tracked HTML/CSS/JS; CSS declarations in stylesheets, style blocks and attributes; excludes comments and JS strings',
        'htmlPages':len(html),'inlineStyleBlocks':styles,'styleAttributes':attrs,'importantDeclarations':important,
        'identicalEmbeddedCss':duplicates(groups),'identicalCssFiles':duplicates(cssgroups),'identicalJsFiles':duplicates(jsgroups),
        'pageFamilyClasses':dict(family),'workflows':[p.relative_to(ROOT).as_posix() for p in files if '.github/workflows/' in p.as_posix() and p.suffix in ['.yml','.yaml']]}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);args=parser.parse_args();data=inventory()
    raw=json.dumps(data,indent=2)+'\n'
    if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(raw,encoding='utf8')
    print(raw)
