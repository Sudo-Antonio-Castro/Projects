(() => {
  'use strict';
  const normalizePath = value => decodeURIComponent(value).toLowerCase().replace(/\/index\.html$/, '/');
  const path = normalizePath(location.pathname);
  let homePage = false;
  document.querySelectorAll('.roadmap-global-nav a[data-section]').forEach(link => {
    const section = link.dataset.section;
    const active = section === 'home'
      ? path === normalizePath(new URL(link.getAttribute('href'), document.baseURI).pathname)
      : path.includes('/' + section + '/');
    link.removeAttribute('aria-current');
    if (active) link.setAttribute('aria-current', 'page');
    if (section === 'home') homePage = active;
  });
  document.body.classList.toggle('rm-home', homePage);

  // A single delegated owner also handles legacy pages with inline listeners.
  // Capture stops those older listeners from toggling twice or printing twice.
  const themes = ['light', 'dark', 'noir'];
  const validTheme = value => themes.includes(value);
  let saved;
  try {
    const current = localStorage.getItem('projects-roadmap-theme');
    saved = validTheme(current) ? current : localStorage.getItem('kb_theme');
  } catch (error) { /* Theme changes still work without browser storage. */ }
  if (validTheme(saved)) document.documentElement.dataset.theme = saved;
  else if (!validTheme(document.documentElement.dataset.theme)) {
    document.documentElement.dataset.theme = document.body.classList.contains('noir-article') ? 'light' : 'dark';
  }
  if (!document.querySelector('#themeBtn,.theme-toggle')) {
    const host = document.querySelector('.topbar .controls,.topbar,header.top,header .nav');
    if (host) {
      const button = document.createElement('button');
      button.type = 'button'; button.id = 'themeBtn'; button.className = 'theme-toggle';
      button.textContent = '\u25d0'; host.append(button);
    }
  }
  const nextTheme = () => themes[(themes.indexOf(document.documentElement.dataset.theme) + 1) % themes.length];
  function labelThemeButtons() {
    const next = nextTheme();
    const source = { light: 'Use light theme', dark: 'Use dark theme', noir: 'Use noir theme' }[next];
    const short = { light: 'Light', dark: 'Dark', noir: 'Noir' }[next];
    document.querySelectorAll('#themeBtn,.theme-toggle').forEach(button => {
      button.type = 'button';
      button.dataset.learningAriaLabel = source;
      button.classList.add('notranslate');
      button.setAttribute('translate', 'no');
      const label = window.ProjectsLearningLocale?.message(source) || source;
      button.setAttribute('aria-label', label);
      button.title = label;
      const text = button.querySelector('#themeLabel');
      if (text) {
        text.dataset.learningSource = short;
        text.textContent = window.ProjectsLearningLocale?.message(short) || short;
      }
    });
  }
  labelThemeButtons();
  window.addEventListener('projects:learning-language-ready', labelThemeButtons);
  document.addEventListener('click', event => {
    const button = event.target.closest('#themeBtn,.theme-toggle,#printBtn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.id === 'printBtn') { window.print(); return; }
    const theme = nextTheme();
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('projects-roadmap-theme', theme);
      localStorage.setItem('kb_theme', theme);
    } catch (error) { /* Keep the current visual state when storage is blocked. */ }
    labelThemeButtons();
  }, true);
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const header = document.querySelector('header');
  if (header) {
    const updateHeaderOffset = () => document.documentElement.style.setProperty(
      '--projects-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    updateHeaderOffset();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderOffset).observe(header);
  }
  const main = document.querySelector('main');
  if (main && document.body.classList.contains('roadmap-theme') && !document.querySelector('.skip-link')) {
    if (!main.id) main.id = 'main-content';
    main.tabIndex = -1;
    const skip = document.createElement('a');
    skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  }
})();
