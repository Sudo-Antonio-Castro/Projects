/* Browser-local summaries. Assessment controllers and CLI state remain authoritative. */
(() => {
  'use strict';
  const base = new URL('../', document.currentScript.src);
  const KEY = 'projects-learning-progress';
  const CLEAR = 'projects-learning-clear';
  const REVISIONS = 'projects-learning-reset-revisions';
  const catalog = window.ProjectsActivities || [];
  const byId = new Map(catalog.map(a => [a.id, a]));
  let hidden = false;
  let writing = false;
  let expiryTimer = null;
  const read = (storage, key) => { try { return JSON.parse(storage.getItem(key)); } catch (_) { return null; } };
  const local = () => { try { return localStorage; } catch (_) { return null; } };
  const session = () => { try { return sessionStorage; } catch (_) { return null; } };
  const validResult = r => r && Number.isInteger(r.correct) && Number.isInteger(r.total) && r.total > 0 && r.correct >= 0 && r.correct <= r.total;
  function metadata() {
    const raw = read(local(), KEY);
    const result = {version: 1, activities: {}};
    // No earlier summary schema existed. Unknown versions are read-only, never guessed.
    if (raw?.version !== 1 || !raw.activities || typeof raw.activities !== 'object') return result;
    for (const [id, item] of Object.entries(raw.activities)) {
      if (!byId.has(id) || !item || !Number.isFinite(item.updatedAt) || item.updatedAt < 0) continue;
      result.activities[id] = {updatedAt: item.updatedAt,
        started: item.started === true, completed: item.completed === true,
        expired: item.expired === true, count: Number.isInteger(item.count) && item.count >= 0 ? item.count : 0,
        total: Number.isInteger(item.total) && item.total > 0 ? item.total : 0,
        ...(validResult(item.result) ? {result:{correct:item.result.correct, total:item.result.total}} : {})};
    }
    return result;
  }
  function write(data) {
    try {
      const raw = read(local(), KEY);
      if (raw?.version && raw.version !== 1) return false;
      local().setItem(KEY, JSON.stringify(data)); return true;
    } catch (_) { return false; }
  }
  const assessmentKey = a => 'projects-assessment:v1:' + new URL(a.id, base).pathname + (a.id.includes('?') ? '?' + a.id.split('?')[1] : '');
  const cliKey = a => new URL(a.url, base).pathname + '::progress-v2';
  function revisions() {
    try {
      const raw = local().getItem(REVISIONS);
      if (raw === null) return {version:1, activities:{}};
      const data = JSON.parse(raw);
      return data?.version === 1 && data.activities && typeof data.activities === 'object' ? data : null;
    } catch (_) { return null; }
  }
  function revision(key) {
    const a = catalog.find(a=>a.type==='assessment' && assessmentKey(a)===key);
    const data = revisions();
    if (!a || !data) return null;
    const value = data.activities[a.id];
    return value === undefined ? 0 : Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  function attempt(a) {
    const s = read(session(), assessmentKey(a));
    if (window.ProjectsProgress.isCleared(assessmentKey(a), s)) return null;
    // Full compatibility/signature validation still belongs solely to the controller.
    if (!s || typeof s.signature !== 'string' || !s.answers || Array.isArray(s.answers) || typeof s.answers !== 'object' || typeof s.expired !== 'boolean') return null;
    if (!(s.submittedAt === null || Number.isFinite(s.submittedAt)) || !(s.deadline === null || Number.isFinite(s.deadline))) return null;
    return s;
  }
  function cli(a, state = read(local(), cliKey(a))) {
    if (!state || !Array.isArray(state.progress) || state.progress.length !== a.steps.length) return null;
    const progress = a.steps.map((n, i) => Number.isInteger(state.progress[i]) ? Math.max(0, Math.min(n, state.progress[i])) : 0);
    const active = Number.isInteger(state.active) && state.active >= 0 && state.active < a.steps.length ? state.active : 0;
    const completed = progress.filter((n, i) => n === a.steps[i]).length;
    const assisted = progress.some((n, i) => Array.from({length:n}, (_, j) => state.outcomes?.[i]?.[j]).includes('assisted'));
    const legacy = progress.some((n, i) => Array.from({length:n}, (_, j) => state.outcomes?.[i]?.[j]).some(v => !['independent','assisted'].includes(v)));
    const started = progress.some(n => n > 0) || (Array.isArray(state.drafts) && state.drafts.some(s => typeof s === 'string' && s.length > 0));
    return {active, progress, started, completed: completed === a.steps.length, count: completed, total:a.steps.length, assisted, legacy};
  }
  function update(a, values, meaningful) {
    const data = metadata();
    const old = data.activities[a.id];
    if (!values.started && !values.completed) delete data.activities[a.id];
    else data.activities[a.id] = {...old, ...values, updatedAt: meaningful ? Date.now() : (old?.updatedAt || 0)};
    write(data);
  }
  window.ProjectsProgress = {
    assessmentRevision: revision,
    isCleared(key, raw) {
      try {
        const current = revision(key);
        const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const previous = saved?.progressRevision ?? 0;
        return current !== null && Number.isSafeInteger(previous) && previous >= 0 && previous < current;
      } catch (_) { return false; }
    },
    assessment(key, state, details, meaningful = false) {
      try {
        const a = catalog.find(a => a.type === 'assessment' && assessmentKey(a) === key);
        if (!a) return;
        const started = state.started && (state.deadline !== null || Object.keys(state.answers).length > 0 || state.flags?.length > 0 || state.lastQuestionId !== null || state.submittedAt !== null);
        update(a, {started:Boolean(started), completed:state.submittedAt !== null, expired:state.expired,
          count:Object.keys(state.answers).length, total:details.total, ...(validResult(details.result) ? {result:details.result} : {result:undefined})}, meaningful);
      } catch (_) { /* Summary failure must never interrupt an assessment. */ }
    },
    cli(key, state, meaningful = true) {
      try {
        const a = catalog.find(a => a.type === 'cli' && cliKey(a) === key);
        const s = a && cli(a, state);
        if (s) update(a, {started:s.started, completed:s.completed, count:s.count, total:s.total}, meaningful);
      } catch (_) { /* CLI state remains usable without summaries. */ }
    },
    forgetAssessment(key) {
      const a = catalog.find(a => a.type === 'assessment' && assessmentKey(a) === key);
      if (a) { const data = metadata(); delete data.activities[a.id]; write(data); }
    }
  };
  function entries() {
    const data = metadata();
    const rows = [];
    for (const a of catalog) {
      let m = data.activities[a.id];
      if (a.type === 'cli') {
        const s = cli(a);
        if (!s?.started) continue;
        rows.push({...a, ...s, updatedAt:m?.updatedAt || 0, available:true, state:s.completed ? (s.assisted ? 'Assisted completion' : 'Completed') : 'In progress'});
      } else {
        const s = attempt(a);
        if (s) {
          const completed = s.submittedAt !== null;
          const started = s.deadline !== null || completed || Object.keys(s.answers).length > 0 ||
            (s.started !== false && (s.flags?.length > 0 || s.lastQuestionId));
          if (!started) continue;
          const expired = !completed && s.deadline !== null && Date.now() >= s.deadline;
          rows.push({...a, ...m, started:true, completed, deadline:s.deadline, count:Object.keys(s.answers).length,
            updatedAt:m?.updatedAt || 0, available:true,
            state:completed ? (s.expired ? 'Expired / submitted' : 'Submitted') : expired ? 'Time expired — open to submit' : 'In progress'});
        } else if (m?.started || m?.completed) {
          rows.push({...a, ...m, available:false, state:m.completed ? (m.expired ? 'Expired / submitted' : 'Submitted') : 'Open in the original tab'});
        }
      }
    }
    return rows.sort((a,b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id, 'en'));
  }
  function text(tag, source, params = {}) {
    const n = document.createElement(tag);
    n.dataset.learningSource = source; n.dataset.learningParams = JSON.stringify(params);
    n.classList.add('notranslate'); n.setAttribute('translate', 'no');
    n.textContent = source.replace(/\{(\w+)\}/g, (m,k) => params[k] ?? m);
    window.ProjectsLearningLocale?.apply(n); return n;
  }
  const message = source => window.ProjectsLearningLocale?.message(source) || source;
  function settingsLink() { const a = text('a', 'Manage learning progress'); a.href = new URL('progress/index.html', base); return a; }
  function row(item, management = false) {
    const box = document.createElement('article'); box.className = 'learning-activity'; box.dataset.activityId = item.id;
    const title = text('strong', item.title); box.append(title);
    const status = document.createElement('p'); const icon = document.createElement('span'); icon.setAttribute('aria-hidden','true'); icon.textContent = item.completed ? '✓ ' : '◷ ';
    const stateText = text('span', item.state); stateText.dataset.progressState = '';
    status.append(icon, stateText); box.append(status);
    if (item.type === 'cli') {
      box.append(text('p', 'Scenario {scenario} of {total} · {count}/{steps} steps', {scenario:item.active+1, total:item.total, count:item.progress[item.active], steps:item.steps[item.active]}));
      box.append(text('p', '{count} of {total} scenarios completed', {count:item.count, total:item.total}));
      if (item.assisted && !item.completed) box.append(text('p', 'Includes steps completed with Reveal.'));
      if (item.legacy) box.append(text('p', 'Earlier assistance history is unknown.'));
    } else if (item.result) box.append(text('p', 'Latest result: {correct}/{total} correct', item.result));
    else if (item.total) box.append(text('p', '{count}/{total} answered', {count:item.count, total:item.total}));
    if (item.available) {
      const link = text('a', item.type === 'cli' ? (item.completed ? 'Review lab' : 'Continue lab') : item.completed ? 'Review submitted assessment' : item.state === 'Time expired — open to submit' ? 'Open expired assessment' : 'Resume assessment');
      link.href = new URL(item.url, base); box.append(link);
    } else box.append(text('p', 'Assessment answers and locked review remain in the original browser tab.'));
    if (management) {
      const clear = text('button', 'Clear progress'); clear.type = 'button';
      clear.addEventListener('click', () => {
        if (!window.confirm(message('Clear this activity? Its saved answers, result or lab steps will be removed.'))) return;
        clearActivities([item.id]);
      }); box.append(clear);
    }
    return box;
  }
  function clearActivities(ids) {
    const data = metadata();
    try {
      const resets = revisions();
      if (!resets) throw Error('unknown reset schema');
      for (const id of ids) {
        const a = byId.get(id);
        if (a?.type === 'assessment') {
          const previous = resets.activities[id];
          resets.activities[id] = (Number.isSafeInteger(previous) && previous >= 0 ? previous : 0) + 1;
        }
      }
      local().setItem(REVISIONS, JSON.stringify(resets));
      for (const id of ids) {
        const a = byId.get(id); if (!a) continue;
        if (a.type === 'cli') local().removeItem(cliKey(a));
        else session().removeItem(assessmentKey(a));
        delete data.activities[id];
      }
      if (!write(data)) throw Error('summary storage unavailable');
      // Other open tabs clear their own session records before reloading. No progress is transmitted.
      local().setItem(CLEAR, JSON.stringify({ids})); local().removeItem(CLEAR);
      render(true);
      const status = document.getElementById('progress-status');
      if (status) { status.replaceChildren(text('span', 'Progress cleared.')); }
    } catch (_) {
      const status = document.getElementById('progress-status');
      if (status) status.replaceChildren(text('span', 'Progress could not be fully cleared. Enable browser storage and try again.'));
    }
  }
  window.addEventListener('storage', event => {
    if (event.key === CLEAR && event.newValue) {
      try {
        const ids = JSON.parse(event.newValue).ids.filter(id => byId.has(id));
        for (const id of ids) { const a = byId.get(id); if (a.type === 'assessment') session()?.removeItem(assessmentKey(a)); }
        // Suppress controller pagehide checkpoints before reloading a cleared activity.
        window.dispatchEvent(new CustomEvent('projects:progress-cleared', {detail:{ids, assessmentKeys:ids.map(id=>byId.get(id)).filter(a=>a.type==='assessment').map(assessmentKey)}}));
      } catch (_) { /* Malformed cross-tab notifications are ignored. */ }
    }
    if (event.key === KEY || event.key?.endsWith('::progress-v2')) render();
  });
  function render(force = false) {
    if (writing) return;
    // Background storage notifications must not replace a keyboard user's controls.
    if (force !== true && document.activeElement?.closest('.learning-progress') && document.activeElement.matches('a,button')) return;
    writing = true;
    try {
      const rows = entries();
      clearTimeout(expiryTimer);
      const upcoming = rows.filter(r => !r.completed && Number.isFinite(r.deadline) && r.deadline > Date.now());
      if (upcoming.length) expiryTimer = setTimeout(refreshExpired, Math.min(2147483647, Math.max(0, Math.min(...upcoming.map(r=>r.deadline)) - Date.now()) + 20));
      const recent = document.getElementById('continue-learning');
      if (recent) {
        recent.hidden = hidden || !rows.length;
        if (!recent.hidden) {
          recent.replaceChildren(text('h2', 'Continue learning'), row(rows.find(r => r.available) || rows[0]));
          const dismiss = text('button', 'Hide for this view'); dismiss.type = 'button';
          dismiss.addEventListener('click', () => { hidden = true; recent.hidden = true; });
          recent.append(dismiss, settingsLink());
        }
      }
      document.querySelectorAll('[data-progress-track]').forEach(node => {
        const track = node.dataset.progressTrack;
        const activities = catalog.filter(a => track === 'comptia' ? ['a','linux','security'].includes(a.track) : a.track === track);
        const done = rows.filter(r => r.completed && activities.some(a => a.id === r.id)).length;
        node.replaceChildren(text('p', track === 'clis' ? '{count} of {total} labs completed' : '{count} of {total} assessments completed', {count:done, total:activities.length}));
        const active = rows.find(r => activities.some(a => a.id === r.id) && r.available && !r.completed);
        if (active) node.append(row(active));
        else if (!done && !rows.some(r=>activities.some(a=>a.id===r.id))) {
          const icon = document.createElement('span'); icon.setAttribute('aria-hidden','true'); icon.textContent = '○ ';
          node.append(icon, text('span', 'Not started'));
        }
      });
      const list = document.getElementById('progress-list');
      if (list) {
        list.replaceChildren(...(rows.length ? rows.map(r=>row(r,true)) : [text('p','No learning progress saved yet. Explore a track or try a lab.')]));
      }
    } finally { writing = false; }
  }
  function refreshExpired() {
    // Update text in place: an expiring dashboard must neither grade nor move focus.
    for (const item of entries().filter(r=>r.state === 'Time expired — open to submit')) {
      document.querySelectorAll('[data-activity-id]').forEach(box => {
        if (box.dataset.activityId !== item.id) return;
        const stateText = box.querySelector('[data-progress-state]');
        if (stateText) {
          delete stateText.dataset.learningSource; delete stateText.dataset.learningParams;
          stateText.replaceChildren(text('span', item.state));
        }
        const link = box.querySelector('a');
        if (link) {
          delete link.dataset.learningSource; delete link.dataset.learningParams;
          link.replaceChildren(text('span', 'Open expired assessment'));
        }
      });
    }
    const upcoming = entries().filter(r=>!r.completed && Number.isFinite(r.deadline) && r.deadline>Date.now());
    if (upcoming.length) expiryTimer = setTimeout(refreshExpired, Math.min(2147483647, Math.max(0, Math.min(...upcoming.map(r=>r.deadline))-Date.now())+20));
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-clear-all-progress]')?.addEventListener('click', () => {
      if (window.confirm(message('Clear all local learning progress? Saved assessment attempts, results and CLI lab steps will be removed from open tabs in this browser. Language and theme preferences are kept.'))) clearActivities(catalog.map(a=>a.id));
    });
    render();
  });
  window.addEventListener('pageshow', render);
  window.addEventListener('focus', render);
})();
