/* Assessment controller. Keep the five track copies identical. */
(function () {
  'use strict';
  const embedded = document.currentScript && document.currentScript.dataset.assessment;
  const settings = embedded ? JSON.parse(embedded) : (window.QUIZ_CONFIG || {});
  const config = embedded ? {
    timed: true, timeLimitMinutes: settings.minutes,
    useScaledScore: Boolean(settings.passScore), passScore: settings.passScore,
    passPercent: 80
  } : settings;
  const form = document.getElementById('quizForm');
  const results = document.getElementById('results');
  const timer = document.getElementById('timer');
  if (!form || !results || form.dataset.initialized) return;
  const labels = window.MODULE_LABELS || {};
  const escape = value => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  let questions;

  if (embedded) {
    // Preserve the static Linux question text and option values verbatim.
    questions = Object.entries(settings.answers).map(([id, answer]) => {
      const inputs = [...form.querySelectorAll(`input[name="q${id}"]`)];
      const card = inputs[0].closest('.question');
      const title = card.querySelector('.question-title');
      card.id = `question-${id}`;
      title.id = `question-title-${id}`;
      card.setAttribute('role', 'group');
      card.setAttribute('aria-labelledby', title.id);
      const explanation = document.createElement('div');
      explanation.className = 'explanation';
      explanation.id = `exp-${id}`;
      card.append(explanation);
      return { id, module: 'Linux+', question: title.textContent,
        options: inputs.map(input => input.closest('label').querySelector('span').textContent),
        values: inputs.map(input => input.value), answer: String(answer), explanation: '' };
    });
  } else {
    const bank = window.QUIZ_BANK || [];
    questions = (config.questionIds && config.questionIds.length
      ? config.questionIds.map(id => bank.find(q => q.id === id)).filter(Boolean)
      : bank.filter(q => !config.module || q.module === config.module))
      .map(q => ({...q, answer: String(q.answer), values: q.options.map((_, i) => String(i))}));
    const body = document.getElementById('quizBody');
    if (!body) return;
    body.innerHTML = questions.map((q, index) => `
      <fieldset class="question-card" id="question-${q.id}">
        <legend class="question-text"><span class="question-meta">Question ${index + 1} - ${escape(labels[q.module] || q.module)}</span>${escape(q.question)}</legend>
        <div class="options">${q.options.map((option, i) => `
          <label class="option" id="q${q.id}_opt${i}">
            <input type="radio" name="q${q.id}" value="${i}">
            <span class="option-label"><strong>${String.fromCharCode(65 + i)}.</strong> ${escape(option)}</span>
          </label>`).join('')}</div>
        <div class="explanation" id="exp-${q.id}"></div>
      </fieldset>`).join('');
  }
  if (!questions.length) {
    results.textContent = 'No questions could be loaded. Please return to the course and try again.';
    results.classList.add('show');
    return;
  }
  form.dataset.initialized = 'true';
  // Keep the current question ahead of supporting copy and exam menus.
  const introduction = document.querySelector('.hero > p');
  if (introduction) {
    const details = document.createElement('details');
    details.className = 'assessment-intro';
    const summary = document.createElement('summary');
    summary.textContent = 'About this assessment';
    introduction.before(details);
    details.append(summary, introduction);
  }
  const picker = document.querySelector('.exam-picker');
  if (picker) {
    const details = document.createElement('details');
    details.className = 'assessment-picker';
    const summary = document.createElement('summary');
    summary.textContent = 'Exam options - change version or open a lab';
    picker.before(details);
    details.append(summary, picker);
  }
  const submit = form.querySelector('[type="submit"]');
  submit.classList.add('assessment-submit');
  submit.textContent = 'Submit assessment';
  const count = document.getElementById('questionCount');
  if (count) count.textContent = `${questions.length} Questions`;
  const helper = document.getElementById('helperText');
  if (helper) helper.textContent = 'Your attempt resumes after a reload. Use Start new attempt to clear it.';
  results.tabIndex = -1;
  results.setAttribute('role', 'region');
  results.setAttribute('aria-label', 'Assessment result');
  if (timer) { timer.setAttribute('role', 'timer'); timer.setAttribute('aria-live', 'off'); }

  const key = 'projects-assessment:v1:' + location.pathname.replace(/\/index\.html$/, '/') + '?version=' + (new URLSearchParams(location.search).get('version') || '');
  // Include content and scoring rules so changed banks cannot reuse stale answers.
  const signature = JSON.stringify([questions, config.timed, config.timeLimitMinutes,
    config.useScaledScore, config.passScore, config.passPercent]);
  const duration = (config.timeLimitMinutes || 0) * 60000;
  let attempt = { signature, answers: {}, deadline: config.timed ? Date.now() + duration : null,
    submittedAt: null, expired: false, secondsLeft: Math.ceil(duration / 1000) };
  let submitted = false;
  let restarting = false;
  let interval = null;
  const notice = document.createElement('p');
  notice.className = 'attempt-storage-notice';
  notice.setAttribute('role', 'status');
  notice.hidden = true;
  form.before(notice);
  function storageFailure() {
    notice.hidden = false;
    notice.textContent = 'Progress cannot be saved in this browser. Keep this page open; reloading may discard your attempt.';
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (saved && saved.signature === signature && saved.answers && typeof saved.answers === 'object' &&
        (config.timed ? Number.isFinite(saved.deadline) : saved.deadline === null) &&
        (saved.submittedAt === null || Number.isFinite(saved.submittedAt)) &&
        typeof saved.expired === 'boolean' && Number.isFinite(saved.secondsLeft)) attempt = saved;
  } catch (error) { storageFailure(); }
  form.querySelectorAll('input[type="radio"]').forEach(input => {
    input.checked = attempt.answers[input.name] === input.value;
  });
  function save() {
    if (restarting) return true;
    attempt.answers = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
      attempt.answers[input.name] = input.value;
    });
    try {
      sessionStorage.setItem(key, JSON.stringify(attempt));
      notice.hidden = true;
      return true;
    } catch (error) { storageFailure(); return false; }
  }

  const actions = document.createElement('div');
  actions.className = 'assessment-actions';
  const progress = document.createElement('div');
  progress.id = 'answerProgress';
  progress.className = 'assessment-progress';
  progress.setAttribute('role', 'status');
  const review = document.createElement('button');
  review.type = 'button';
  review.className = 'btn';
  review.textContent = 'Review unanswered';
  actions.append(progress, review);
  form.before(actions);
  const selected = q => form.querySelector(`input[name="q${q.id}"]:checked`);
  function updateProgress() {
    const answered = questions.filter(q => selected(q)).length;
    progress.textContent = `${answered} / ${questions.length} answered`;
    review.disabled = submitted || answered === questions.length;
  }
  review.addEventListener('click', () => {
    const first = questions.find(q => !selected(q));
    if (!first) return;
    const input = form.querySelector(`input[name="q${first.id}"]`);
    input.focus({preventScroll: true});
    document.getElementById(`question-${first.id}`).scrollIntoView({block: 'start'});
  });
  function restart(event) {
    event.preventDefault();
    if (!window.confirm('Start a new attempt? Your saved answers and result for this assessment will be cleared.')) return;
    try { sessionStorage.removeItem(key); } catch (error) {
      storageFailure();
      notice.textContent = 'The saved attempt could not be cleared. Enable browser storage before starting a new attempt.';
      return;
    }
    restarting = true;
    window.location.reload();
  }
  const restartLinks = [...document.querySelectorAll('a[href^="javascript:"], #restartLink')]
    .filter(link => link.id === 'restartLink' || /location\.reload\(/.test(link.getAttribute('href') || ''));
  if (!restartLinks.length) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn'; button.textContent = 'Start new attempt';
    button.addEventListener('click', restart);
    actions.append(button);
  }
  restartLinks.forEach(link => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = link.className; button.id = link.id;
    button.textContent = 'Start new attempt'; button.addEventListener('click', restart);
    link.replaceWith(button);
  });
  function feedback(input, message) {
    const text = document.createElement('span');
    text.className = 'answer-feedback'; text.textContent = message;
    input.closest('label').append(text);
  }
  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function grade(fromTimer = false, restoring = false) {
    if (submitted) return;
    submitted = true;
    clearInterval(interval);
    if (!restoring) {
      attempt.submittedAt = Date.now();
      attempt.expired = Boolean(fromTimer || (config.timed && Date.now() >= attempt.deadline));
      attempt.secondsLeft = config.timed ? Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000)) : 0;
    }
    let correct = 0;
    let unanswered = 0;
    const misses = {};
    questions.forEach(q => {
      const choice = selected(q);
      const value = choice ? choice.value : null;
      const card = document.getElementById(`question-${q.id}`);
      card.classList.add('reviewed');
      if (value === q.answer) { correct++; card.classList.add('correct'); }
      else {
        if (value === null) unanswered++;
        else card.classList.add('incorrect');
        misses[q.module] = (misses[q.module] || 0) + 1;
      }
      const right = form.querySelector(`input[name="q${q.id}"][value="${q.answer}"]`);
      right.closest('label').classList.add('correct-answer');
      feedback(right, value === q.answer ? 'Your answer - correct' : 'Correct answer');
      if (choice && value !== q.answer) {
        choice.closest('label').classList.add('user-wrong');
        feedback(choice, 'Your answer - incorrect');
      }
      const explanation = document.getElementById(`exp-${q.id}`);
      const answerIndex = q.values.indexOf(q.answer);
      explanation.innerHTML = `${value === null ? '<strong>Not answered.</strong><br>' : ''}<strong>Answer:</strong> ${escape(q.options[answerIndex])}${q.explanation ? `<br><strong>Why:</strong> ${escape(q.explanation)}` : ''}`;
    });
    const total = questions.length;
    const percent = Math.round(correct / total * 100);
    const scaled = Math.round(100 + correct / total * 800);
    const target = config.useScaledScore ? (config.passScore || 750) : (config.passPercent || 80);
    const pass = (config.useScaledScore ? scaled : percent) >= target;
    const weakAreas = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([module, n]) => `${labels[module] || module} (${n})`).join(', ');
    const stats = [
      [config.useScaledScore ? 'Scaled score' : 'Score', config.useScaledScore ? `${scaled} / 900` : `${percent}%`],
      ['Correct', `${correct}/${total}`], ['Unanswered', unanswered],
      ['Pass mark', config.useScaledScore ? target : `${target}%`]
    ];
    results.innerHTML = `<h2>${pass ? 'Nice work.' : 'Keep going.'}</h2>
      <p>${attempt.expired ? 'Time expired. Your assessment was submitted automatically.' : 'Your assessment has been scored and locked.'}</p>
      <div class="results-grid">${stats.map(([label, value]) => `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`).join('')}</div>
      <p class="callout ${pass ? 'good' : 'bad'}">${escape(pass ? (config.passMessage || 'You are on track. Keep practicing.') : (config.failMessage || 'Review the missed questions and try a new attempt.'))}</p>
      ${config.useScaledScore ? '<p>This is a practice scoring model, not an official exam score.</p>' : ''}
      ${weakAreas ? `<p class="weak-areas"><strong>Focus next on:</strong> ${escape(weakAreas)}</p>` : ''}`;
    results.classList.add('show');
    submit.disabled = true;
    form.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = true; });
    if (timer && config.timed) timer.textContent = attempt.expired ? 'Time expired - submitted' : `Submitted with ${formatTime(attempt.secondsLeft)} remaining`;
    updateProgress();
    save();
    if (!restoring) { results.focus({preventScroll: true}); results.scrollIntoView({block: 'start'}); }
  }
  function tick() {
    if (submitted || !config.timed) return;
    const seconds = Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
    if (timer) timer.textContent = `Time remaining: ${formatTime(seconds)}`;
    if (!seconds) grade(true);
  }
  form.addEventListener('submit', event => { event.preventDefault(); grade(); });
  form.addEventListener('change', () => {
    if (submitted) return;
    if (config.timed && Date.now() >= attempt.deadline) {
      form.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = attempt.answers[input.name] === input.value;
      });
      grade(true);
      return;
    }
    updateProgress(); save();
  });
  window.addEventListener('pagehide', save);
  window.addEventListener('pageshow', tick);
  document.addEventListener('visibilitychange', () => { tick(); if (document.hidden) save(); });
  window.addEventListener('projects:before-language-change', event => { if (!save()) event.preventDefault(); });
  updateProgress();
  if (attempt.submittedAt !== null) grade(attempt.expired, true);
  else { save(); tick(); if (config.timed && !submitted) interval = setInterval(tick, 1000); }
})();
