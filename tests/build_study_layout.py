"""Idempotent opt-in for supported study templates; preserves source formatting."""
from pathlib import Path
from bs4 import BeautifulSoup
import json, os, re

ROOT = Path(__file__).resolve().parents[1]
rows = []
for family in ['CompTIA', 'EC-Council']:
    for path in sorted((ROOT/family).rglob('index.html')):
        source = path.read_text(encoding='utf8')
        soup = BeautifulSoup(source,'html.parser')
        if not soup.select_one('body.rm-lesson') or soup.select_one('#quizForm'): continue
        lessons = soup.select('.section-panel') or soup.select('.lesson-panel') or soup.select('article.lesson') or soup.select('.content-wrap > .content > section')
        if not lessons: continue
        rel = lambda p: os.path.relpath(p, path.parent).replace('\\','/')
        assets = rel(ROOT/'assets')
        if 'study-layout.js' not in source:
            source = source.replace('</head>', f'<link rel="stylesheet" href="{assets}/study-layout.css">\n<script defer src="{assets}/study-layout.js"></script>\n</head>')
        quiz = path.parent.parent/('Quiz_'+path.parent.name)/'index.html'
        if 'Linux+' in path.parts: quiz = ROOT/'CompTIA/Linux+/quizzes'/(path.parent.name+'-quiz')/'index.html'
        course = ROOT/'CompTIA/Linux+/index.html' if 'Linux+' in path.parts else path.parent.parent/'index.html'
        attrs = {'study-course':rel(course)}
        if quiz.exists(): attrs['study-quiz'] = rel(quiz)
        if '1201' in path.parts and path.parent.name == 'Motherboard_and_Connectors':
            attrs['study-lab'] = '../Final_Exam/connector-match-lab.html'
        if 'Linux+' in path.parts: attrs['study-lab'] = rel(ROOT/'CLIs/Linux/index.html')
        for key,value in attrs.items():
            if f'data-{key}=' not in source:
                source = re.sub(r'<body\b', f'<body data-{key}="{value}"', source, count=1)
        if source != path.read_text(encoding='utf8'): path.write_text(source,encoding='utf8',newline='')
        rows.append({'path':path.relative_to(ROOT).as_posix(),'lessons':len(lessons),'quiz':attrs.get('study-quiz')})
out = ROOT/'docs/ux-evidence/study-layout'; out.mkdir(parents=True,exist_ok=True)
(out/'migrated-pages.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf8')
print(f'{len(rows)} study modules / {sum(r["lessons"] for r in rows)} lesson panels')
