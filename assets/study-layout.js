// The tabs template previously repeated this exact controller in 28 pages.
// Keep globals for native onclick controls and the original no-enhancement view.
(() => {
  if (document.documentElement.dataset.studyTemplate !== 'tabs') return;
  let lessonIndex = 0;
  const panels = Array.from(document.querySelectorAll('.lesson-panel'));
  const tabs = Array.from(document.querySelectorAll('.lesson-tab'));
  function switchLesson(index, button) {
    lessonIndex = index;
    panels.forEach(panel => panel.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));
    panels[index].classList.add('active');
    button.classList.add('active');
    updateCounter();
  }
  function goToLesson(index) {
    if (index < 0 || index >= panels.length) return;
    switchLesson(index, tabs[index]);
  }
  function nextLesson() { goToLesson(lessonIndex + 1); }
  function prevLesson() { goToLesson(lessonIndex - 1); }
  function updateCounter() {
    document.getElementById('counter').textContent = `${lessonIndex + 1} / ${panels.length}`;
    document.getElementById('prevBtn').disabled = lessonIndex === 0;
    document.getElementById('nextBtn').disabled = lessonIndex === panels.length - 1;
  }
  function goHome() { window.location.href = '../index.html'; }
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') nextLesson();
    if (event.key === 'ArrowLeft') prevLesson();
    if (event.key === 'Home') goToLesson(0);
  });
  updateCounter();
  Object.assign(window, {switchLesson, goToLesson, nextLesson, prevLesson, updateCounter, goHome});
})();

/* Progressive enhancement of existing lesson controllers; no assessment state ownership. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  const siteRoot = new URL('../', document.currentScript.src);
  // Static CEH articles and Linux sections share a small local controller adapter.
  // Their source markup stays readable when JavaScript is unavailable.
  let panel = main?.querySelector('article.panel');
  if (main && !panel) {
    const articles = [...main.querySelectorAll('article.lesson')];
    const linux = main.querySelector('.content-wrap > .content');
    const sections = linux ? [...linux.querySelectorAll(':scope > section')] : [];
    const items = articles.length ? articles : sections;
    if (items.length) {
      panel = document.createElement('article'); panel.className = 'panel';
      items[0].closest('.two-col,.shell').before(panel);
      const bar = document.createElement('div'); bar.className = 'bar';
      ['prevBtn','nextBtn'].forEach((id, i) => {
        const b = document.createElement('button'); b.id = id; b.className = 'btn';
        b.type = 'button'; b.textContent = i ? 'Next →' : '← Previous'; bar.append(b);
      });
      const tablist = document.createElement('div'); tablist.className = 'lesson-tabs';
      panel.append(bar, tablist);
      const [previousButton, nextButton] = bar.children;
      let current = 0;
      const activate = i => {
        if (i < 0 || i >= items.length) return;
        current = i;
        [...tablist.children].forEach((b,j)=>b.classList.toggle('active',j===i));
        panel.querySelectorAll('.lesson-panel').forEach((p,j)=>p.classList.toggle('active',j===i));
        previousButton.disabled = i === 0; nextButton.disabled = i === items.length - 1;
      };
      items.forEach((item,i) => {
        const title = item.querySelector('h3');
        const tab = document.createElement('button'); tab.className = 'lesson-tab';
        tab.type = 'button'; tab.textContent = title.textContent;
        tab.addEventListener('click',()=>activate(i)); tablist.append(tab);
        item.classList.add('lesson-panel');
        const content = document.createElement('div'); content.className = 'content';
        [...item.childNodes].forEach(n=>content.append(n)); item.append(content);
        const h2 = document.createElement('h2'); h2.textContent = title.textContent;
        title.replaceWith(h2);
        content.querySelectorAll('h4').forEach(h => {
          const h3 = document.createElement('h3'); h3.textContent = h.textContent; h.replaceWith(h3);
        });
        panel.append(item);
      });
      if (linux) {
        const last = items.at(-1).querySelector('.content');
        linux.querySelectorAll('.summary,.exam-tip').forEach(n=>last.append(n));
      }
      const old = main.querySelector('.two-col,.shell');
      // Preserve module context and next-module links in the collapsible overview.
      const context = old?.querySelector('.sidebar-list,.sidebar');
      if (context) main.querySelector('.hero')?.append(context);
      if (old && !old.querySelector('.lesson,.content-wrap > .content > section')) old.remove();
      previousButton.addEventListener('click',()=>activate(current-1));
      nextButton.addEventListener('click',()=>activate(current+1));
      activate(0);
    }
  }
  if (!panel || main.querySelector('#quizForm') || document.querySelector('.study-layout')) return;
  const nested = !!panel.querySelector('.section-panel');
  const lessons = [...panel.querySelectorAll(nested ? '.section-panel' : '.lesson-panel')];
  const tabs = [...panel.querySelectorAll(nested ? '.section-tab' : '.lesson-tab')];
  if (!lessons.length || lessons.length !== tabs.length) return;
  const make = (tag, cls, text) => {
    const el = document.createElement(tag); if (cls) el.className = cls;
    if (text) { el.textContent = text; el.dataset.learningSource = text; }
    return el;
  };
  const layout = make('div', 'study-layout');
  const canvas = make('div', 'study-canvas');
  const left = make('details', 'study-navigation study-rail');
  left.append(make('summary', '', 'Lesson navigation'));
  const leftBody = make('div', 'study-rail-body'); left.append(leftBody);
  const course = make('a', 'study-course-link', 'Course modules');
  course.href = document.body.dataset.studyCourse || '../index.html'; leftBody.append(course);
  leftBody.append(make('h2', 'study-module-title', 'Lessons'));
  const position = make('p', 'study-position');
  const meter = make('progress', 'study-meter'); meter.max = lessons.length;
  meter.setAttribute('aria-label', 'Lesson position'); meter.dataset.learningAriaLabel = 'Lesson position';
  leftBody.append(position, meter, make('p', 'study-caption', 'Your place in this module'));
  const list = make('nav', 'study-lessons'); list.setAttribute('aria-label', 'Lessons');
  list.dataset.learningAriaLabel = 'Lessons';
  leftBody.append(list);
  const controls = make('div', 'study-controls');
  const prev = document.getElementById('prevBtn'), next = document.getElementById('nextBtn');
  if (prev && next) {
    prev.dataset.learningAriaLabel = 'Previous lesson'; prev.setAttribute('aria-label','Previous lesson');
    next.dataset.learningAriaLabel = 'Next lesson'; next.setAttribute('aria-label','Next lesson');
    controls.append(prev, next);
  }
  leftBody.append(controls);
  const nextLabel = make('p', 'study-next-label'); leftBody.append(nextLabel);
  const right = make('aside', 'study-helper study-rail'); right.setAttribute('aria-label', 'Study tools');
  right.dataset.learningAriaLabel = 'Study tools';
  const tocCard = make('section', 'study-helper-card');
  tocCard.append(make('h2', '', 'On this page'));
  const toc = make('nav', 'study-toc'); toc.setAttribute('aria-label', 'On this page');
  toc.dataset.learningAriaLabel = 'On this page'; tocCard.append(toc);
  const factsCard = make('section', 'study-helper-card'); factsCard.append(make('h2', '', 'Key facts'));
  const facts = make('ul', 'study-facts'); factsCard.append(facts);
  const progressCard = make('section', 'study-helper-card');
  progressCard.append(make('h2', '', 'Your progress'));
  const helperPosition = make('p', 'study-helper-position');
  progressCard.append(helperPosition, make('p', 'study-caption', 'Your place in this module'));
  const tools = make('section', 'study-helper-card'); tools.append(make('h2', '', 'Study tools'));
  const quiz = document.body.dataset.studyQuiz;
  if (quiz) { const a = make('a', 'study-tool study-tool-primary', 'Start quiz'); a.href = quiz; tools.append(a); }
  const review = make('a', 'study-tool', 'Review key takeaways'); tools.append(review);
  if (document.body.dataset.studyLab) {
    const a = make('a', 'study-tool', 'View lab (optional)'); a.href = document.body.dataset.studyLab; tools.append(a);
  }
  const progress = make('a', 'study-tool', 'Your saved activity');
  progress.href = new URL('../progress/index.html', document.currentScript.src).href; tools.append(progress);
  const help = make('details','study-helper-card study-help');
  help.append(make('summary','','Help / related learning'));
  const modules = make('a','study-tool','Course modules'); modules.href = course.href;
  const library = make('a','study-tool','Library'); library.href = new URL('IT-Knowledge-Base-Articles/index.html',siteRoot).href;
  help.append(modules,library);
  right.append(tocCard, factsCard, progressCard, tools, help);
  const breadcrumb = main.querySelector('.project-breadcrumb');
  const hero = main.querySelector('.hero');
  // Keep module context available without repeating an oversized introduction above every lesson.
  if (hero) {
    hero.querySelectorAll('h1').forEach(original => {
      const heading = document.createElement('h2');
      [...original.attributes].forEach(a=>heading.setAttribute(a.name,a.value));
      heading.append(...original.childNodes); original.replaceWith(heading);
    });
    const overview = make('details', 'study-overview');
    overview.id = 'module-overview';
    overview.append(make('summary', '', 'Module overview'));
    hero.replaceWith(overview); overview.append(hero);
    leftBody.insertBefore(overview, list);
  }
  const wrap = panel.closest('.wrap');
  if (wrap) wrap.querySelector(':scope > .section-label')?.remove();
  canvas.append(panel);
  if (wrap && !wrap.children.length) wrap.remove();
  layout.append(canvas, left, right); main.prepend(layout);
  if (breadcrumb) main.prepend(breadcrumb);
  document.body.classList.add('study-page');
  // Reparent existing controls so their handlers, focus semantics and state survive.
  function compactHeader() {
    const header = document.querySelector('header');
    if (!header) return;
    const bar = make('div','study-global-bar');
    const brand = make('a','study-brand','Projects'); brand.href = siteRoot.href;
    bar.append(brand);
    const nav = header.querySelector('.roadmap-global-nav');
    const controls = header.querySelector('.controls') || make('div','controls');
    // Linux templates place the theme button directly in the header.
    // Keep native controls even when a legacy wrapper is absent.
    header.querySelectorAll('#themeBtn,.theme-toggle,#printBtn').forEach(control=>{
      if (!controls.contains(control)) controls.append(control);
    });
    const language = document.querySelector('.site-language-settings');
    [nav,controls,language].filter(Boolean).forEach(el=>bar.append(el));
    header.replaceChildren(bar);
    window.ProjectsLearningLocale?.apply(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',compactHeader,{once:true});
  else compactHeader();
  const media = matchMedia('(min-width:1100px)');
  const expand = () => { left.open = media.matches; };
  expand(); media.addEventListener('change', expand);

  // Chunk existing nodes without cloning content, IDs, handlers, or translated text.
  lessons.forEach((lesson, i) => {
    const content = lesson.querySelector('.content') || lesson;
    const originalTitle = content.querySelector('h2');
    if (originalTitle) {
      const title = document.createElement('h1');
      [...originalTitle.attributes].forEach(a=>title.setAttribute(a.name,a.value));
      title.append(...originalTitle.childNodes); originalTitle.replaceWith(title);
      title.classList.add('study-title'); title.tabIndex = -1;
      title.dataset.learningSource ||= title.textContent.trim();
      if (!title.id) title.id = `study-${i + 1}-lesson`;
      else if (title.id !== `study-${i + 1}-lesson`) {
        const target = make('span','study-lesson-target'); target.id = `study-${i + 1}-lesson`;
        title.before(target);
      }
    }
    let card = null;
    [...content.children].forEach(node => {
      if (node.tagName === 'H3') {
        card = make('section', 'study-content-card'); node.before(card); card.append(node);
      } else if (node.matches('.summary,.exam-tip')) {
        card = null; node.classList.add('study-content-card');
      } else if (card) card.append(node);
      else if (node.matches('ul,ol')) node.classList.add('study-content-card');
      if (node.matches('table')) {
        const scroll = make('div', 'study-table'); scroll.tabIndex = 0;
        scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', 'Scrollable table');
        scroll.dataset.learningAriaLabel = 'Scrollable table'; node.before(scroll); scroll.append(node);
      }
    });
    const cards = [...content.querySelectorAll(':scope > section.study-content-card')];
    if (cards.length >= 2 && cards.slice(0,2).every(c => c.textContent.length < 550 && !c.querySelector('table,pre'))) {
      const pair = make('div', 'study-card-pair'); cards[0].before(pair); pair.append(cards[0], cards[1]);
    }
    lesson.dataset.studyIndex = i;
  });
  const buttons = lessons.map((lesson, i) => {
    const button = make('button', 'study-lesson'); button.type = 'button';
    const number = make('span', 'study-lesson-number'); number.textContent = String(i + 1);
    const title = lesson.querySelector('.study-title');
    const label = make('span', '', title?.dataset.learningSource || title?.textContent.trim() || tabs[i].textContent.trim());
    button.append(number, label); list.append(button);
    button.addEventListener('click', () => select(i, true));
    return button;
  });
  const storageKey = 'projects-study-place:v1:' + location.pathname.replace(/index\.html$/, '');
  let active = -1, sectionObserver, restoring = true;
  function select(i, focus) {
    if (nested) {
      const mod = lessons[i].closest('.module-panel');
      const modules = [...panel.querySelectorAll('.module-panel')];
      panel.querySelectorAll('.module-tab')[modules.indexOf(mod)]?.click();
    }
    tabs[i].click();
    sync();
    if (focus) {
      lessons[i].querySelector('.study-title')?.focus({preventScroll:true});
      canvas.scrollIntoView({block:'start', behavior:'instant'});
      if (!media.matches) left.open = false;
    }
  }
  function sync() {
    const i = lessons.findIndex(l => l.classList.contains('active') &&
      (!nested || l.closest('.module-panel').classList.contains('active')));
    if (i < 0 || i === active) return;
    if (active >= 0) {
      if (!restoring) history.pushState({...history.state, projectsStudyLesson:i}, '', '#study-'+(i+1)+'-lesson');
      if (lessons[active].contains(document.activeElement)) lessons[i].querySelector('.study-title')?.focus({preventScroll:true});
    }
    active = i;
    buttons.forEach((b, j) => {
      if (i === j) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    position.textContent = `${i + 1} / ${lessons.length}`; helperPosition.textContent = position.textContent; meter.value = i + 1;
    nextLabel.replaceChildren();
    if (i+1 < lessons.length) {
      nextLabel.append(make('span','','Next lesson'),document.createTextNode(': '),
        make('span','',lessons[i+1].querySelector('.study-title')?.dataset.learningSource || lessons[i+1].querySelector('.study-title')?.textContent.trim()));
    } else nextLabel.append(make('span','','End of module'));
    if (media.matches) {
      const bounds = list.getBoundingClientRect(), current = buttons[i].getBoundingClientRect();
      if (current.bottom > bounds.bottom) list.scrollTop += current.bottom - bounds.bottom;
      else if (current.top < bounds.top) list.scrollTop -= bounds.top - current.top;
    }
    try { localStorage.setItem(storageKey, String(i)); } catch (_) { /* Navigation works without storage. */ }
    sectionObserver?.disconnect(); toc.replaceChildren(); facts.replaceChildren();
    const headings = [...lessons[i].querySelectorAll('h3,.summary-label,.exam-tip-label')];
    if (!headings.length) headings.push(lessons[i].querySelector('.study-title'));
    headings.filter(Boolean).forEach((heading, j) => {
      if (!heading.id) heading.id = `study-${i + 1}-${j + 1}`;
      heading.tabIndex = -1;
      const link = make('a', '', heading.dataset.learningSource || heading.textContent.trim());
      link.href = '#' + heading.id; toc.append(link);
      link.addEventListener('click', () => {
        heading.focus({preventScroll:true});
        toc.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));
        link.setAttribute('aria-current','location');
      });
    });
    const sources = [...lessons[i].querySelectorAll('.study-content-card')]
      .map(card => card.querySelector('li,p')).filter(Boolean).slice(0,3);
    sources.forEach(source => facts.append(make('li', '', source.dataset.learningSource || source.textContent.trim())));
    factsCard.hidden = !sources.length;
    const takeaway = lessons[i].querySelector('.summary-label,.summary h3') ||
      lessons[i].querySelector('.exam-tip-label') || headings.find(Boolean) || lessons[i].querySelector('.study-title');
    if (!takeaway.id) takeaway.id = `study-${i + 1}-takeaway`;
    review.href = '#' + takeaway.id;
    review.onclick = () => { takeaway.focus({preventScroll:true}); };
    if (toc.firstChild) toc.firstChild.setAttribute('aria-current', 'location');
    if ('IntersectionObserver' in window) {
      sectionObserver = new IntersectionObserver(entries => {
        const entry = entries.find(e => e.isIntersecting); if (!entry) return;
        toc.querySelectorAll('a').forEach(a => {
          if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current','location');
          else a.removeAttribute('aria-current');
        });
      }, {rootMargin:'-15% 0px -55% 0px'});
      headings.filter(Boolean).forEach(h => sectionObserver.observe(h));
    }
    window.ProjectsLearningLocale?.apply(layout);
  }
  // Class changes come from the original previous/next, tabs, and keyboard handlers.
  new MutationObserver(sync).observe(panel, {subtree:true, attributes:true, attributeFilter:['class']});
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) { /* Optional place memory. */ }
  const hashLesson = location.hash.match(/^#study-(\d+)-/);
  const requested = hashLesson ? Number(hashLesson[1]) - 1 : location.hash && lessons.findIndex(l => l.id === location.hash.slice(1) || [...l.querySelectorAll('[id]')].some(e => '#' + e.id === location.hash));
  if (Number.isInteger(requested) && requested >= 0 && requested < lessons.length) select(requested, false);
  else if (saved !== null && /^\d+$/.test(saved) && Number(saved) < lessons.length) select(Number(saved), false);
  sync();
  const initialLesson = active;
  history.replaceState({...history.state, projectsStudyLesson:active},'');
  restoring = false;
  function restoreLocation() {
    const hash = location.hash.match(/^#study-(\d+)-/);
    const index = hash ? Number(hash[1]) - 1 : location.hash ? lessons.findIndex(l => l.id === location.hash.slice(1) || [...l.querySelectorAll('[id]')].some(el=>'#'+el.id===location.hash)) : history.state?.projectsStudyLesson ?? initialLesson;
    if (Number.isInteger(index) && index >= 0 && index < lessons.length) {
      restoring = true;
      select(index, false);
      restoring = false;
      document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
    }
    if (location.hash === '#module-overview') {
      left.open=true;
      const overview=document.getElementById('module-overview'); if (overview) overview.open=true;
    }
  }
  window.addEventListener('hashchange',restoreLocation);
  window.addEventListener('popstate',restoreLocation);
  if (location.hash === '#module-overview') restoreLocation();
  document.addEventListener('keydown', event => {
    if (['ArrowLeft','ArrowRight','Home'].includes(event.key) &&
      (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,button,a,summary,[contenteditable]'))) {
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('projects:learning-language-ready', () => window.ProjectsLearningLocale?.apply(layout));
})();
