
(function(){
  const themeBtn = document.getElementById('themeBtn');
  const saved = localStorage.getItem('kb_theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('kb_theme', next);
    });
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const config = window.QUIZ_CONFIG || {};
  const bank = window.QUIZ_BANK || [];
  const moduleLabels = window.MODULE_LABELS || {};
  const ids = config.questionIds || [];
  const questions = ids.length ? ids.map(id => bank.find(q => q.id === id)).filter(Boolean) : bank.filter(q => !config.module || q.module === config.module);

  const quizForm = document.getElementById('quizForm');
  const resultsEl = document.getElementById('results');
  const timerEl = document.getElementById('timer');
  const summaryCountEl = document.getElementById('questionCount');
  const helperEl = document.getElementById('helperText');
  const submitBtn = document.getElementById('submitBtn');

  if (summaryCountEl) summaryCountEl.textContent = `${questions.length} Questions`;
  if (helperEl) helperEl.textContent = config.timed ? `This ${config.label || 'quiz'} is timed.` : `This ${config.label || 'quiz'} is untimed.`;

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(s){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s];
    });
  }

  function renderQuiz() {
    const body = document.getElementById('quizBody');
    body.innerHTML = questions.map((q, index) => {
      const options = q.options.map((opt, i) => `
        <label class="option" id="q${q.id}_opt${i}">
          <input type="radio" name="q${q.id}" value="${i}" />
          <span class="option-label"><strong>${String.fromCharCode(65+i)}.</strong> ${escapeHtml(opt)}</span>
        </label>
      `).join('');
      return `
        <section class="question-card" id="question-${q.id}">
          <div class="question-meta">Question ${index + 1} · ${escapeHtml(moduleLabels[q.module] || q.module)}</div>
          <div class="question-text">${escapeHtml(q.question)}</div>
          <div class="options">${options}</div>
          <div class="explanation" id="exp-${q.id}"></div>
        </section>
      `;
    }).join('');
  }

  let timerId = null;
  let secondsLeft = (config.timeLimitMinutes || 0) * 60;
  let submitted = false;

  function formatTime(totalSeconds){
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function startTimer(){
    if (!config.timed || !timerEl) return;
    timerEl.textContent = `Time Left ${formatTime(secondsLeft)}`;
    timerId = window.setInterval(() => {
      secondsLeft -= 1;
      timerEl.textContent = `Time Left ${formatTime(Math.max(secondsLeft, 0))}`;
      if (secondsLeft <= 0) {
        window.clearInterval(timerId);
        if (!submitted) gradeQuiz(true);
      }
    }, 1000);
  }

  function buildWeakAreas(missesByModule){
    const entries = Object.entries(missesByModule).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return '';
    return entries.slice(0, 3).map(([mod, count]) => `${moduleLabels[mod] || mod} (${count})`).join(', ');
  }

  function gradeQuiz(fromTimer){
    if (submitted) return;
    submitted = true;
    if (timerId) window.clearInterval(timerId);

    let correct = 0;
    let unanswered = 0;
    const missesByModule = {};
    questions.forEach(q => {
      const card = document.getElementById(`question-${q.id}`);
      const selected = quizForm.querySelector(`input[name="q${q.id}"]:checked`);
      const userValue = selected ? Number(selected.value) : null;
      const exp = document.getElementById(`exp-${q.id}`);
      if (userValue === null) {
        unanswered += 1;
        missesByModule[q.module] = (missesByModule[q.module] || 0) + 1;
      } else if (userValue === q.answer) {
        correct += 1;
        card.classList.add('correct');
      } else {
        missesByModule[q.module] = (missesByModule[q.module] || 0) + 1;
        card.classList.add('incorrect');
      }
      card.classList.add('reviewed');
      const correctLabel = document.getElementById(`q${q.id}_opt${q.answer}`);
      if (correctLabel) correctLabel.classList.add('correct-answer');
      if (selected && userValue !== q.answer) {
        const wrongLabel = document.getElementById(`q${q.id}_opt${userValue}`);
        if (wrongLabel) wrongLabel.classList.add('user-wrong');
      }
      exp.innerHTML = `<strong>Answer:</strong> ${String.fromCharCode(65 + q.answer)}. ${escapeHtml(q.options[q.answer])}<br><strong>Why:</strong> ${escapeHtml(q.explanation)}`;
    });

    const total = questions.length;
    const percent = Math.round((correct / total) * 100);
    const weakAreas = buildWeakAreas(missesByModule);
    let scoreHeading = `${percent}%`;
    let pass = false;
    let summaryHtml = '';

    if (config.useScaledScore) {
      const scaled = Math.round(100 + ((correct / total) * 800));
      const passTarget = config.passScore || 750;
      const minCorrect = Math.ceil(((passTarget - 100) / 800) * total);
      pass = scaled >= passTarget;
      scoreHeading = `${scaled}`;
      summaryHtml = `
        <div class="results-grid">
          <div class="stat"><div class="stat-label">Scaled Score</div><div class="stat-value">${scaled}</div></div>
          <div class="stat"><div class="stat-label">Correct</div><div class="stat-value">${correct}/${total}</div></div>
          <div class="stat"><div class="stat-label">Unanswered</div><div class="stat-value">${unanswered}</div></div>
          <div class="stat"><div class="stat-label">Pass Mark</div><div class="stat-value">${passTarget}</div></div>
        </div>
        <p>A score of ${passTarget} or higher is a pass. On this 100–900 scaled model, that is about ${minCorrect}/${total} correct answers.</p>
      `;
    } else {
      pass = percent >= (config.passPercent || 80);
      summaryHtml = `
        <div class="results-grid">
          <div class="stat"><div class="stat-label">Score</div><div class="stat-value">${percent}%</div></div>
          <div class="stat"><div class="stat-label">Correct</div><div class="stat-value">${correct}/${total}</div></div>
          <div class="stat"><div class="stat-label">Unanswered</div><div class="stat-value">${unanswered}</div></div>
          <div class="stat"><div class="stat-label">Recommendation</div><div class="stat-value">${pass ? 'Ready' : 'Review'}</div></div>
        </div>
      `;
    }

    const message = pass
      ? (config.passMessage || 'You are ready!')
      : (config.failMessage || 'You should practice more.');

    resultsEl.innerHTML = `
      <h2>${pass ? 'Nice work.' : 'Keep going.'}</h2>
      <p>${fromTimer ? 'Time expired, so the assessment was submitted automatically.' : 'Your assessment has been scored.'}</p>
      ${summaryHtml}
      <div class="callout ${pass ? 'good' : 'bad'}">
        <strong>${message}</strong>
        <span>${pass ? 'Your result shows solid readiness in this set of objectives.' : 'Use the study modules and missed explanations below, then try again.'}</span>
      </div>
      ${weakAreas ? `<div class="weak-areas"><strong>Focus next on:</strong> ${weakAreas}</div>` : ''}
    `;
    resultsEl.classList.add('show');
    submitBtn.disabled = true;
    document.querySelectorAll('input[type="radio"]').forEach(el => el.disabled = true);
    resultsEl.scrollIntoView({behavior:'smooth', block:'start'});
  }

  if (quizForm) quizForm.addEventListener('submit', function(e){ e.preventDefault(); gradeQuiz(false); });
  renderQuiz();
  startTimer();
})();
