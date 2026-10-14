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
  let saved;
  try { saved = localStorage.getItem('projects-roadmap-theme') || localStorage.getItem('kb_theme'); }
  catch (error) { /* Theme changes still work without browser storage. */ }
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  if (!document.querySelector('#themeBtn,.theme-toggle')) {
    const host = document.querySelector('.topbar .controls,.topbar,header.top,header .nav');
    if (host) {
      const button = document.createElement('button');
      button.type = 'button'; button.id = 'themeBtn'; button.className = 'theme-toggle';
      button.textContent = '\u25d0'; host.append(button);
    }
  }
  function labelThemeButtons() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.querySelectorAll('#themeBtn,.theme-toggle').forEach(button => {
      button.setAttribute('aria-label', `Switch to ${next} theme`);
      button.title = `Switch to ${next} theme`;
    });
  }
  labelThemeButtons();
  document.addEventListener('click', event => {
    const button = event.target.closest('#themeBtn,.theme-toggle,#printBtn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.id === 'printBtn') { window.print(); return; }
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
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
  if (main && !document.querySelector('.skip-link')) {
    if (!main.id) main.id = 'main-content';
    main.tabIndex = -1;
    const skip = document.createElement('a');
    skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  }
})();
