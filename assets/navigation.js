// Standalone article/lab pages use the same section semantics as roadmap pages.
(() => {
  // Roadmap pages already own these behaviors in roadmap-theme.js.
  if (document.body.classList.contains('roadmap-theme')) return;
  const path = decodeURIComponent(location.pathname).toLowerCase();
  document.querySelectorAll('.roadmap-global-nav a[data-section]').forEach(link => {
    const active = path.includes('/' + link.dataset.section + '/');
    link.toggleAttribute('aria-current', active);
    if (active) link.setAttribute('aria-current', 'page');
  });
  const header = document.querySelector('header');
  if (header && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => document.documentElement.style.setProperty(
      '--projects-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`)).observe(header);
  }
})();

/* Learning context and course-card resume. Lesson content stays in source HTML. */
(() => {
  'use strict';
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const coursePath = document.body.dataset.studyHub || document.body.dataset.studyCourse;
  if (!coursePath) return;
  const courses = [
    ['A+ Core 1','CompTIA/A+/1201/index.html'],
    ['A+ Core 2','CompTIA/A+/1202/index.html'],
    ['Security+','CompTIA/Security+/index.html'],
    ['Linux+','CompTIA/Linux+/index.html'],
    ['CEH','EC-Council/CEH/index.html']
  ];
  const hub = document.body.dataset.studyHub;
  const current = new URL(coursePath, hub ? root : location.href).pathname;
  const make = (tag, cls, source) => {
    const el = document.createElement(tag); el.className = cls;
    if (source) { el.textContent = source; el.dataset.learningSource = source; }
    return el;
  };
  function initialize() {
    const context = document.querySelector('.project-breadcrumb');
    if (!context) return;
    context.classList.add('study-context');
    const label = make('label','study-course-picker');
    const caption = make('span','study-course-label','Switch course');
    const select = make('select','study-course-select');
    caption.id = 'study-course-label'; select.setAttribute('aria-labelledby',caption.id);
    courses.forEach(([name,path]) => {
      const option = make('option','',name); option.value = new URL(path,root).href;
      option.selected = new URL(path,root).pathname === current; select.append(option);
    });
    select.addEventListener('change',()=>location.assign(select.value));
    label.append(caption,select);
    // The source course link remains the working fallback without JavaScript.
    const item = hub ? context.querySelector('li:last-child') : context.querySelector('li:first-child');
    if (hub) {
      context.querySelectorAll('li:not(:last-child)').forEach(li=>li.remove());
      item.removeAttribute('aria-current');
    }
    item.replaceChildren(label);
    window.ProjectsLearningLocale?.apply(context);
    if (!hub) return;
    fetch(new URL('study-navigation.json',script.src)).then(r=>{
      if (!r.ok) throw new Error('Navigation metadata unavailable'); return r.json();
    }).then(data => {
      data.modules.filter(m=>m.course===hub).forEach(module => {
        const url = new URL(module.path,root);
        let saved;
        try { saved = localStorage.getItem('projects-study-place:v1:'+url.pathname.replace(/index\.html$/,'')); }
        catch (_) { return; }
        if (saved === null || !/^\d+$/.test(saved) || Number(saved)>=module.lessons.length) return;
        const index = Number(saved);
        const normalize = value => new URL(value).pathname.replace(/index\.html$/,'');
        const anchor = [...document.querySelectorAll('main a.card[href], main .module-row a[href]')].find(a=>normalize(a.href)===normalize(url.href));
        if (!anchor) return;
        const card = anchor.closest('.card,.module-row') || anchor;
        const info = make('span','study-resume-info');
        const position = make('span','study-resume-position');
        position.dataset.learningSource = 'Lesson {current} of {total}';
        position.dataset.learningParams = JSON.stringify({current:index+1,total:module.lessons.length});
        position.textContent = `Lesson ${index+1} of ${module.lessons.length}`;
        const caption = make('span','','Last viewed');
        const title = make('span','',module.lessons[index]);
        info.append(position,caption,document.createTextNode(': '),title);
        const target = url.href+'#study-'+(index+1)+'-lesson';
        if (card === anchor) {
          // Whole-card links remain one semantic anchor; never nest links.
          anchor.href=target; anchor.classList.add('study-resume-link');
          info.append(make('span','study-resume-action','Continue →')); anchor.append(info);
        } else {
          const resume = make('a','study-resume-link study-resume-action','Continue →');
          resume.href=target; info.append(resume); card.append(info);
        }
      });
      window.ProjectsLearningLocale?.apply(document.querySelector('main'));
    }).catch(()=>{ /* Original module links remain usable when metadata is unavailable. */ });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
