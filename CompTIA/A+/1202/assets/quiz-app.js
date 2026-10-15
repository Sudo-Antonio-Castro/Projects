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

  // Source keys survive language changes; display text never supplies identity.
  function label(element, source, params = {}) {
    element.dataset.learningSource = source;
    element.dataset.learningParams = JSON.stringify(params);
    element.classList.add('notranslate');
    element.setAttribute('translate', 'no');
    element.textContent = source.replace(/\{(\w+)\}/g, (match, key) => params[key] ?? match);
    window.ProjectsLearningLocale?.apply(element);
  }
  function localized(source, params = {}) {
    return `<span class="notranslate" translate="no" data-learning-source="${escape(source)}" data-learning-params="${escape(JSON.stringify(params))}">${escape(source.replace(/\{(\w+)\}/g, (match, key) => params[key] ?? match))}</span>`;
  }
  function applyLocale() { window.ProjectsLearningLocale?.apply(); }
  let questions;

  if (embedded) {
    // Preserve the static Linux question text and option values verbatim.
    questions = Object.entries(settings.answers).map(([id, answer]) => {
      const inputs = [...form.querySelectorAll(`input[name="q${id}"]`)];
      const card = inputs[0].closest('.question');
      const title = card.querySelector('.question-title');
      card.id = `question-${id}`;
      title.id = `question-title-${id}`;
      label(title, title.textContent);
      inputs.forEach(input => { const option = input.closest('label').querySelector('span'); label(option, option.textContent); });
      card.setAttribute('role', 'group');
      card.setAttribute('aria-labelledby', title.id);
      const explanation = document.createElement('div');
      explanation.className = 'explanation';
      explanation.id = `exp-${id}`;
      card.append(explanation);
      return { id, module: 'Linux+', question: title.dataset.learningSource,
        options: inputs.map(input => input.closest('label').querySelector('span').dataset.learningSource),
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
        <legend class="question-text"><span class="question-meta">${localized('Question {number}', {number: index + 1})} - ${localized(labels[q.module] || q.module)}</span>${localized(q.question)}</legend>
        <div class="options">${q.options.map((option, i) => `
          <label class="option" id="q${q.id}_opt${i}">
            <input type="radio" name="q${q.id}" value="${i}">
            <span class="option-label"><strong>${String.fromCharCode(65 + i)}.</strong> ${localized(option)}</span>
          </label>`).join('')}</div>
        <div class="explanation" id="exp-${q.id}"></div>
      </fieldset>`).join('');
  }
  if (!questions.length) {
    label(results, 'No questions could be loaded. Please return to the course and try again.');
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
    label(summary, 'About this assessment');
    introduction.before(details);
    details.append(summary, introduction);
  }
  const picker = document.querySelector('.exam-picker');
  if (picker) {
    const details = document.createElement('details');
    details.className = 'assessment-picker';
    const summary = document.createElement('summary');
    label(summary, 'Exam options - change version or open a lab');
    picker.before(details);
    details.append(summary, picker);
  }
  const submit = form.querySelector('[type="submit"]');
  submit.classList.add('assessment-submit');
  label(submit, 'Review and submit');
  const count = document.getElementById('questionCount');
  if (count) label(count, '{count} Questions', {count: questions.length});
  const helper = document.getElementById('helperText');
  if (helper) label(helper, 'Your attempt resumes after a reload. Use Start new attempt to clear it.');
  results.tabIndex = -1;
  results.setAttribute('role', 'region');
  results.dataset.learningAriaLabel = 'Assessment result';
  results.setAttribute('aria-label', 'Assessment result');
  if (timer) { timer.setAttribute('role', 'timer'); timer.setAttribute('aria-live', 'off'); }
  if (timer && !config.timed) label(timer, 'Untimed');

  const key = 'projects-assessment:v1:' + location.pathname.replace(/\/index\.html$/, '/') + '?version=' + (new URLSearchParams(location.search).get('version') || '');
  // Include content and scoring rules so changed banks cannot reuse stale answers.
  const signature = JSON.stringify([questions, config.timed, config.timeLimitMinutes,
    config.useScaledScore, config.passScore, config.passPercent]);
  const duration = (config.timeLimitMinutes || 0) * 60000;
  let attempt = { signature, answers: {}, deadline: null, started: !config.timed,
    flags: [], lastQuestionId: null,
    submittedAt: null, expired: false, secondsLeft: Math.ceil(duration / 1000) };
  let submitted = false;
  let restarting = false;
  let interval = null;
  let preserveInvalid = false;
  const notice = document.createElement('p');
  notice.className = 'attempt-storage-notice';
  notice.setAttribute('role', 'status');
  notice.hidden = true;
  form.before(notice);
  function storageFailure() {
    notice.hidden = false;
    label(notice, 'Progress cannot be saved in this browser. Keep this page open; reloading may discard your attempt.');
  }
  const recovery = document.createElement('p');
  recovery.className = 'attempt-recovery-notice';
  recovery.setAttribute('role', 'status');
  recovery.hidden = true;
  form.before(recovery);
  const validId = id => questions.some(q => String(q.id) === String(id));
  function restoreAnswers() {
    form.querySelectorAll('input[type="radio"]').forEach(input => {
      input.checked = attempt.answers[input.name] === input.value;
    });
  }
  function captureAnswers() {
    attempt.answers = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
      attempt.answers[input.name] = input.value;
    });
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (raw !== null) {
      try {
        const saved = JSON.parse(raw);
        const validAnswers = saved && saved.answers && !Array.isArray(saved.answers) &&
          typeof saved.answers === 'object' && Object.entries(saved.answers).every(([name, value]) =>
            questions.some(q => name === `q${q.id}` && q.values.includes(value)));
        const waiting = saved?.started === false && saved.deadline === null &&
          saved.submittedAt === null && validAnswers && !Object.keys(saved.answers).length;
        if (!saved || saved.signature !== signature || !validAnswers ||
            !(config.timed ? (waiting || Number.isFinite(saved.deadline)) : saved.deadline === null) ||
            !(saved.submittedAt === null || Number.isFinite(saved.submittedAt)) ||
            typeof saved.expired !== 'boolean' || !Number.isFinite(saved.secondsLeft) || saved.secondsLeft < 0) {
          throw new Error('Invalid saved attempt');
        }
        // UI metadata is optional. Old active/submitted attempts retain all core
        // fields, the same content signature, storage key and original deadline.
        attempt = { ...saved, started: !config.timed || !waiting,
          flags: Array.isArray(saved.flags) ? [...new Set(saved.flags.filter(validId).map(String))] : [],
          lastQuestionId: validId(saved.lastQuestionId) ? String(saved.lastQuestionId) : null };
      } catch (error) {
        preserveInvalid = true;
        recovery.hidden = false;
        label(recovery, 'Saved attempt data could not be restored. It is kept until you start or change this attempt.');
      }
    }
  } catch (error) { storageFailure(); }
  restoreAnswers();
  function save() {
    if (restarting) return true;
    if (preserveInvalid) return true;
    // A locked submission is a snapshot; pagehide/language changes cannot read
    // modified DOM values back into it.
    if (attempt.started && !submitted) captureAnswers();
    try {
      sessionStorage.setItem(key, JSON.stringify(attempt));
      notice.hidden = true;
      recovery.hidden = true;
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
  label(review, 'Review unanswered');
  actions.append(progress, review);
  form.before(actions);
  const selected = q => form.querySelector(`input[name="q${q.id}"]:checked`);
  const flaggedReview = document.createElement('button');
  flaggedReview.type = 'button'; flaggedReview.className = 'btn';
  label(flaggedReview, 'Review flagged');
  actions.append(flaggedReview);

  const overview = document.createElement('details');
  overview.className = 'assessment-overview';
  const overviewTitle = document.createElement('summary');
  label(overviewTitle, 'Question overview');
  overview.append(overviewTitle);
  const filters = document.createElement('div');
  filters.className = 'assessment-filters'; filters.setAttribute('role', 'group');
  filters.dataset.learningAriaLabel = 'Filter question overview';
  const filterButtons = new Map();
  let filter = 'all';
  ['all', 'unanswered', 'flagged'].forEach(mode => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn';
    label(button, {all: 'All questions', unanswered: 'Unanswered questions', flagged: 'Flagged questions'}[mode]);
    button.dataset.reviewFilter = mode;
    button.addEventListener('click', () => { filter = mode; updateProgress(); });
    filters.append(button); filterButtons.set(mode, button);
  });
  overview.append(filters);
  const questionLinks = document.createElement('div'); questionLinks.className = 'assessment-question-links';
  overview.append(questionLinks);
  const emptyOverview = document.createElement('p'); label(emptyOverview, 'No questions match this filter.');
  overview.append(emptyOverview);
  actions.after(overview);
  const entries = questions.map((q, index) => {
    const card = document.getElementById(`question-${q.id}`);
    card.tabIndex = -1;
    const flag = document.createElement('button'); flag.type = 'button'; flag.className = 'btn assessment-flag';
    flag.dataset.questionId = q.id;
    flag.addEventListener('click', () => {
      if (submitted || !attempt.started) return;
      if (config.timed && Date.now() >= attempt.deadline) { grade(true); return; }
      const id = String(q.id);
      attempt.flags = attempt.flags.includes(id) ? attempt.flags.filter(value => value !== id) : [...attempt.flags, id];
      preserveInvalid = false; updateProgress(); save();
    });
    card.querySelector('.question-text,.question-title').after(flag);
    const link = document.createElement('button'); link.type = 'button';
    link.className = 'btn assessment-question-link'; link.dataset.questionId = q.id;
    link.setAttribute('aria-controls', card.id);
    link.addEventListener('click', () => navigate(q));
    questionLinks.append(link);
    return {q, index, card, flag, link};
  });
  function counts() {
    const answered = questions.filter(q => selected(q)).length;
    return {answered, unanswered: questions.length - answered, flagged: attempt.flags.length};
  }
  function updateProgress() {
    const {answered, flagged} = counts();
    label(progress, '{answered} / {total} answered', {answered, total: questions.length});
    review.disabled = !attempt.started || answered === questions.length;
    flaggedReview.disabled = !attempt.started || !flagged;
    let visible = 0;
    entries.forEach(({q, index, flag, link}) => {
      const isFlagged = attempt.flags.includes(String(q.id));
      const answered = Boolean(selected(q));
      flag.disabled = submitted || !attempt.started;
      flag.setAttribute('aria-pressed', String(isFlagged));
      label(flag, isFlagged ? 'Unflag question {number}' : 'Flag question {number}', {number: index + 1});
      label(link, isFlagged
        ? (answered ? 'Question {number}: answered, flagged' : 'Question {number}: unanswered, flagged')
        : (answered ? 'Question {number}: answered' : 'Question {number}: unanswered'), {number: index + 1});
      link.hidden = filter === 'unanswered' ? answered : filter === 'flagged' ? !isFlagged : false;
      if (!link.hidden) visible++;
      if (attempt.lastQuestionId === String(q.id)) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    filterButtons.forEach((button, mode) => button.setAttribute('aria-pressed', String(mode === filter)));
    emptyOverview.hidden = visible !== 0;
  }
  function navigate(q, remember = true) {
    const card = document.getElementById(`question-${q.id}`);
    if (remember) { positionPending = false; attempt.lastQuestionId = String(q.id); updateProgress(); save(); }
    const header = document.querySelector('header');
    if (header) document.documentElement.style.setProperty('--projects-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    const target = card.querySelector('input:not(:disabled)') || card;
    target.focus({preventScroll: true});
    card.scrollIntoView({block: 'start', behavior: 'instant'});
  }
  review.addEventListener('click', () => {
    filter = 'unanswered'; overview.open = true; updateProgress();
    const first = questions.find(q => !selected(q));
    if (first) navigate(first);
  });
  flaggedReview.addEventListener('click', () => {
    filter = 'flagged'; overview.open = true; updateProgress();
    const first = questions.find(q => attempt.flags.includes(String(q.id)));
    if (first) navigate(first);
  });

  const startScreen = document.createElement('section');
  startScreen.className = 'assessment-start'; startScreen.setAttribute('aria-labelledby', 'assessmentStartTitle');
  startScreen.innerHTML = `<h2 id="assessmentStartTitle">${localized('Before you start')}</h2>
    <p>${localized('{count} questions · {minutes} minutes', {count: questions.length, minutes: config.timeLimitMinutes || 0})}</p>
    <p>${config.useScaledScore
      ? localized('Practice scoring: 100–900; pass mark {target}.', {target: config.passScore || 750})
      : localized('Pass mark: {target}%.', {target: config.passPercent || 80})}</p>
    ${config.useScaledScore ? `<p>${localized('This is a practice scoring model, not an official exam score.')}</p>` : ''}
    <p>${localized('The timer starts only when you select Start assessment. Once started, time continues while you are away, reloading, or reviewing submission.')}</p>
    <p>${localized('When time expires, your answers are submitted automatically.')}</p>`;
  if (config.timed) {
    // Reuse locally translated course/page identity rather than synthesizing
    // identity from translated question text or relying on the page translator.
    const identity = document.createElement('p'); identity.className = 'assessment-name';
    document.querySelectorAll('.project-breadcrumb li:not(:first-child) [data-learning-source]').forEach(source => {
      if (identity.childNodes.length) identity.append(' / ');
      const name = document.createElement('span');
      ['learningSource', 'learningParams', 'learningParamSources'].forEach(key => {
        if (source.dataset[key]) name.dataset[key] = source.dataset[key];
      });
      name.textContent = source.textContent; identity.append(name);
    });
    startScreen.querySelector('h2').after(identity);
  }
  const version = new URLSearchParams(location.search).get('version');
  if (version && /^\d+$/.test(version)) {
    const versionText = document.createElement('p'); label(versionText, 'Version {version}', {version});
    startScreen.querySelector('h2').after(versionText);
  }
  const start = document.createElement('button'); start.type = 'button'; start.id = 'startAssessment'; start.className = 'btn assessment-submit';
  label(start, 'Start assessment'); startScreen.append(start); form.before(startScreen);
  function showAttempt() {
    startScreen.hidden = !config.timed || attempt.started;
    form.hidden = !attempt.started;
    actions.hidden = !attempt.started;
    overview.hidden = !attempt.started;
    form.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = !attempt.started || submitted; });
    if (timer && config.timed && !attempt.started) label(timer, 'Not started');
  }
  start.addEventListener('click', () => {
    if (attempt.started || submitted) return;
    attempt.started = true; attempt.deadline = Date.now() + duration;
    start.disabled = true; preserveInvalid = false;
    showAttempt(); save(); tick();
    if (!submitted) { interval = setInterval(tick, 1000); navigate(questions[0]); }
  });

  const confirmation = document.createElement('dialog');
  confirmation.className = 'assessment-confirmation'; confirmation.setAttribute('aria-labelledby', 'submissionReviewTitle');
  confirmation.innerHTML = `<h2 id="submissionReviewTitle">${localized('Review before submitting')}</h2>`;
  const confirmationCounts = document.createElement('p'); confirmationCounts.id = 'submissionCounts';
  confirmation.append(confirmationCounts);
  const confirmationTimer = document.createElement('p');
  confirmationTimer.id = 'submissionTimer'; confirmationTimer.setAttribute('role', 'timer');
  confirmationTimer.setAttribute('aria-live', 'off'); confirmationTimer.hidden = !config.timed;
  confirmation.append(confirmationTimer);
  if (config.timed) {
    const timing = document.createElement('p');
    label(timing, 'Time continues during this review. If it expires, your answers are submitted automatically.'); confirmation.append(timing);
  }
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.id = 'returnQuestions'; cancel.className = 'btn';
  label(cancel, 'Return to questions');
  cancel.addEventListener('click', () => confirmation.close());
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.id = 'confirmSubmit'; confirm.className = 'btn assessment-submit';
  label(confirm, 'Submit and lock answers');
  confirm.addEventListener('click', () => grade(Boolean(config.timed && Date.now() >= attempt.deadline)));
  confirmation.append(cancel, confirm); form.before(confirmation);
  function restart(event) {
    event.preventDefault();
    if (!window.confirm(window.ProjectsLearningLocale?.language === 'es' ? '¿Iniciar un nuevo intento? Se borrarán las respuestas y el resultado guardados de esta evaluación.' : 'Start a new attempt? Your saved answers and result for this assessment will be cleared.')) return;
    try { sessionStorage.removeItem(key); } catch (error) {
      storageFailure();
      label(notice, 'The saved attempt could not be cleared. Enable browser storage before starting a new attempt.');
      return;
    }
    restarting = true;
    window.location.reload();
  }
  const restartLinks = [...document.querySelectorAll('a[href^="javascript:"], #restartLink')]
    .filter(link => link.id === 'restartLink' || /location\.reload\(/.test(link.getAttribute('href') || ''));
  if (!restartLinks.length) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn'; label(button, 'Start new attempt');
    button.addEventListener('click', restart);
    actions.append(button);
  }
  restartLinks.forEach(link => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = link.className; button.id = link.id;
    label(button, 'Start new attempt'); button.addEventListener('click', restart);
    link.replaceWith(button);
  });
  function feedback(input, message) {
    const text = document.createElement('span');
    text.className = 'answer-feedback'; label(text, message);
    input.closest('label').append(text);
  }
  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function grade(fromTimer = false, restoring = false) {
    if (submitted || !attempt.started) return;
    if (fromTimer) restoreAnswers();
    else captureAnswers();
    preserveInvalid = false;
    submitted = true;
    confirm.disabled = true;
    if (confirmation.open) confirmation.close();
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
      explanation.innerHTML = `${value === null ? `<strong>${localized('Not answered.')}</strong><br>` : ''}<strong>${localized('Answer:')}</strong> ${localized(q.options[answerIndex])}${q.explanation ? `<br><strong>${localized('Why:')}</strong> ${localized(q.explanation)}` : ''}`;
    });
    const total = questions.length;
    const percent = Math.round(correct / total * 100);
    const scaled = Math.round(100 + correct / total * 800);
    const target = config.useScaledScore ? (config.passScore || 750) : (config.passPercent || 80);
    const pass = (config.useScaledScore ? scaled : percent) >= target;
    const weakAreas = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([module, n]) => `${localized(labels[module] || module)} (${n})`).join(', ');
    const stats = [
      [config.useScaledScore ? 'Scaled score' : 'Score', config.useScaledScore ? `${scaled} / 900` : `${percent}%`],
      ['Correct', `${correct}/${total}`], ['Unanswered', unanswered],
      ['Pass mark', config.useScaledScore ? target : `${target}%`]
    ];
    results.innerHTML = `<h2>${localized(pass ? 'Nice work.' : 'Keep going.')}</h2>
      <p>${localized(attempt.expired ? 'Time expired. Your assessment was submitted automatically.' : 'Your assessment has been scored and locked.')}</p>
      <div class="results-grid">${stats.map(([label, value]) => `<div class="stat"><div class="stat-label">${localized(label)}</div><div class="stat-value">${value}</div></div>`).join('')}</div>
      <p class="callout ${pass ? 'good' : 'bad'}">${localized(pass ? (config.passMessage || 'You are on track. Keep practicing.') : (config.failMessage || 'Review the missed questions and try a new attempt.'))}</p>
      ${config.useScaledScore ? `<p>${localized('This is a practice scoring model, not an official exam score.')}</p>` : ''}
      ${weakAreas ? `<p class="weak-areas"><strong>${localized('Focus next on:')}</strong> ${weakAreas}</p>` : ''}`;
    applyLocale();
    results.classList.add('show');
    submit.disabled = true;
    form.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = true; });
    if (timer && config.timed) label(timer, attempt.expired ? 'Time expired - submitted' : 'Submitted with {time} remaining', {time: formatTime(attempt.secondsLeft)});
    updateProgress();
    save();
    if (!restoring) { results.focus({preventScroll: true}); results.scrollIntoView({block: 'start'}); }
  }
  function tick() {
    if (submitted || !config.timed || !attempt.started) return;
    const seconds = Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
    if (timer) label(timer, 'Time remaining: {time}', {time: formatTime(seconds)});
    if (confirmation.open) label(confirmationTimer, 'Time remaining: {time}', {time: formatTime(seconds)});
    if (!seconds) grade(true);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submitted || !attempt.started) return;
    if (config.timed && Date.now() >= attempt.deadline) { grade(true); return; }
    if (confirmation.open) return;
    save();
    label(confirmationCounts, '{answered} answered, {unanswered} unanswered, {flagged} flagged for review.', counts());
    confirmation.showModal();
    tick();
    if (confirmation.open) cancel.focus();
  });
  form.addEventListener('change', () => {
    if (submitted || !attempt.started) { restoreAnswers(); return; }
    if (config.timed && Date.now() >= attempt.deadline) {
      form.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = attempt.answers[input.name] === input.value;
      });
      grade(true);
      return;
    }
    preserveInvalid = false;
    updateProgress(); save();
  });
  let positionPending = Boolean(attempt.started && attempt.lastQuestionId && !attempt.expired);
  let pageShown = document.readyState === 'complete';
  if (positionPending && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
  function restorePosition() {
    if (!positionPending || !pageShown || attempt.expired || !window.ProjectsLearningLocale?.ready) return;
    positionPending = false;
    const last = questions.find(q => String(q.id) === attempt.lastQuestionId);
    if (last) navigate(last, false);
  }
  window.addEventListener('pagehide', save);
  window.addEventListener('pageshow', () => { pageShown = true; tick(); restorePosition(); });
  document.addEventListener('visibilitychange', () => { tick(); if (document.hidden) save(); });
  window.addEventListener('projects:before-language-change', event => { positionPending = false; if (!save()) event.preventDefault(); });
  window.addEventListener('projects:learning-language-ready', () => { applyLocale(); restorePosition(); });
  showAttempt();
  applyLocale();
  updateProgress();
  if (attempt.submittedAt !== null) grade(attempt.expired, true);
  else { save(); tick(); if (config.timed && attempt.started && !submitted) interval = setInterval(tick, 1000); }
  restorePosition();
})();
