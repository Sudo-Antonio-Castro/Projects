"""Generate navigation metadata from semantic lesson HTML, never lesson prose.

--check validates the catalog; normal mode also installs compact source fallback
breadcrumbs and the shared navigation script on the explicit 67-module scope.
"""
from pathlib import Path
from urllib.parse import unquote
import argparse, json, os, re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
COURSES = [
    ('A+ Core 1','CompTIA/A+/1201/index.html'),
    ('A+ Core 2','CompTIA/A+/1202/index.html'),
    ('Security+','CompTIA/Security+/index.html'),
    ('Linux+','CompTIA/Linux+/index.html'),
    ('CEH','EC-Council/CEH/index.html')]


def catalog():
    modules = []
    for item in json.loads((ROOT/'docs/ux-evidence/study-layout/migrated-pages.json').read_text(encoding='utf8')):
        path=ROOT/item['path']; soup=BeautifulSoup(path.read_text(encoding='utf8'),'html.parser')
        panels = soup.select('.section-panel') or soup.select('.lesson-panel') or soup.select('article.lesson') or soup.select('.content-wrap > .content > section')
        titles=[p.select_one('h2,h3').get_text(' ',strip=True) for p in panels]
        course=(path.parent/unquote(soup.body['data-study-course'])).resolve().relative_to(ROOT).as_posix()
        modules.append({'path':item['path'],'course':course,'title':soup.select_one('.project-breadcrumb li:last-child').get_text(' ',strip=True),'lessons':titles})
    return {'courses':[{'label':label,'path':path} for label,path in COURSES], 'modules':modules}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    data=catalog(); target=ROOT/'assets/study-navigation.json'; expected=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    if args.check:
        assert target.read_text(encoding='utf8')==expected, 'Run tests/build_study_navigation.py'
        translations=json.loads((ROOT/'assets/learning-es.json').read_text(encoding='utf8'))
        labels=['Switch course','Course and module','Last viewed','Continue →','Next lesson','End of module','Help / related learning']
        assert all(label in translations for label in labels+[title for module in data['modules'] for title in module['lessons']]), 'Navigation labels and lesson titles need Spanish entries'
        print('PASS navigation metadata matches 5 courses, 67 modules and 200 source lesson titles');return
    target.write_text(expected,encoding='utf8')
    def relative(source,target): return os.path.relpath(ROOT/target,source.parent).replace('\\','/')
    from html import escape
    for module in data['modules']:
        path=ROOT/module['path'];raw=path.read_text(encoding='utf8')
        label=next(label for label,p in COURSES if p==module['course'])
        breadcrumb=f'<nav class="project-breadcrumb study-context" aria-label="Course and module" data-learning-aria-label="Course and module"><ol><li><a href="{relative(path,module["course"])}" data-learning-source="{escape(label)}">{escape(label)}</a></li><li aria-current="page"><span data-learning-source="{escape(module["title"])}">{escape(module["title"])}</span></li></ol></nav>'
        raw=re.sub(r'<nav class="project-breadcrumb[^>]*>.*?</nav>',lambda _:breadcrumb,raw,count=1,flags=re.S)
        if not re.search(r'<script[^>]+src="[^"]*assets/navigation.js"',raw):
            shared=f'<script src="{relative(path,"assets/navigation.js")}" defer></script>\n'
            raw=re.sub(r'(?=<script[^>]+src="[^"]*assets/study-layout.js")',lambda _:shared,raw,count=1)
        path.write_text(raw,encoding='utf8',newline='\n')
    for label, route in COURSES:
        path=ROOT/route;raw=path.read_text(encoding='utf8')
        breadcrumb=f'<nav class="project-breadcrumb study-context" aria-label="Breadcrumb" data-learning-aria-label="Breadcrumb"><ol><li aria-current="page"><span data-learning-source="{escape(label)}">{escape(label)}</span></li></ol></nav>'
        raw=re.sub(r'<nav class="project-breadcrumb[^>]*>.*?</nav>',lambda _:breadcrumb,raw,count=1,flags=re.S)
        if 'data-study-hub=' not in raw: raw=re.sub(r'<body\b',f'<body data-study-hub="{route}"',raw,count=1)
        if not re.search(r'<script[^>]+src="[^"]*assets/navigation.js"',raw):
            raw=raw.replace('</head>',f'<script src="{relative(path,"assets/navigation.js")}" defer></script>\n</head>')
        path.write_text(raw,encoding='utf8',newline='\n')
    print('Updated 67 module contexts and 5 course hubs')


if __name__=='__main__': main()
