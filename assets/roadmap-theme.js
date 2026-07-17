(() => {
  const path = decodeURIComponent(location.pathname).toLowerCase();
  document.querySelectorAll('.roadmap-global-nav a[data-section]').forEach(link => {
    const section = link.dataset.section;
    const active = section === 'home'
      ? /\/index\.html$/.test(path) && !/(comptia|ec-council|clis|it-knowledge-base-articles|apps|design-mockups)/.test(path)
      : path.includes('/' + section + '/');
    if (active) link.setAttribute('aria-current', 'page');
  });

  // Keep the selected light/dark palette consistent across page families.
  const saved = localStorage.getItem('projects-roadmap-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  document.querySelectorAll('#themeBtn,.theme-toggle').forEach(button => {
    button.addEventListener('click', () => {
      setTimeout(() => {
        const theme = document.documentElement.dataset.theme || 'dark';
        localStorage.setItem('projects-roadmap-theme', theme);
      }, 0);
    });
  });
})();
