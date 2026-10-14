// Theme events are owned by assets/roadmap-theme.js.
(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
