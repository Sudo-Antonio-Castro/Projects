// Standalone article/lab pages use the same section semantics as roadmap pages.
(() => {
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
