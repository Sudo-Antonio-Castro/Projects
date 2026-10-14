(() => {
  'use strict';

  const STORAGE_KEY = 'projects-site-language';
  const COOKIE_NAME = 'googtrans';
  const BASE_LANGUAGE = 'en';
  const assetBase = new URL('.', document.currentScript.src || new URL('assets/site-language.js', document.baseURI));
  let spanishCatalog = null;
  let catalogRequest = null;
  let catalogFailed = false;
  const missingSources = new Set();
  const SUPPORTED_LANGUAGES = {
    en: { nativeName: 'English', label: 'Language', note: 'Original content', dir: 'ltr' },
    es: { nativeName: 'Español', label: 'Idioma', note: 'Traducción local de aprendizaje; resto automático solicitado', dir: 'ltr' },
    ar: { nativeName: 'العربية', label: 'اللغة', note: 'ترجمة آلية', dir: 'rtl' }
  };
  let activeLanguage = getSavedLanguage();

  function normalizeLanguage(value) {
    const language = String(value || '').toLowerCase().split('-')[0];
    return Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, language)
      ? language
      : BASE_LANGUAGE;
  }

  function getSavedLanguage() {
    try {
      return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return BASE_LANGUAGE;
    }
  }

  function saveLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // The selector still works for the current page when storage is unavailable.
    }
  }

  function setTranslationCookie(language) {
    const value = language === BASE_LANGUAGE ? '' : `/${BASE_LANGUAGE}/${language}`;
    const expires = language === BASE_LANGUAGE
      ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      : '; max-age=31536000';

    document.cookie = `${COOKIE_NAME}=${value}; path=/${expires}; SameSite=Lax`;
  }

  function applyDocumentDirection(language) {
    const config = SUPPORTED_LANGUAGES[language];
    document.documentElement.lang = language;
    document.documentElement.dir = config.dir;
    document.body?.classList.toggle('site-language-rtl', config.dir === 'rtl');
  }

  function protectTechnicalContent(root = document) {
    const selector = [
      'code',
      'pre',
      'kbd',
      'samp',
      '.screen',
      '.platform-terminal',
      '.cmd-input',
      '.prompt-line',
      '.command-line',
      '.output-line'
    ].join(',');

    const elements = [...(root.querySelectorAll?.(selector) || [])];
    if (root.matches?.(selector)) elements.push(root);
    elements.forEach(element => {
      element.classList.add('notranslate');
      element.setAttribute('translate', 'no');
    });
  }

  // Learning renderers retain English source keys and stable IDs. Only display
  // strings change; translated DOM never becomes question data or scoring state.
  function learningStatus() {
    const learning = document.querySelector('[data-learning-source]');
    if (!learning) return;
    let notice = document.getElementById('learning-language-status');
    if (!notice) {
      notice = document.createElement('p');
      notice.id = 'learning-language-status';
      notice.className = 'notranslate';
      notice.setAttribute('translate', 'no');
      notice.setAttribute('role', 'status');
      document.querySelector('.site-language-settings')?.after(notice);
    }
    notice.hidden = activeLanguage === 'en' ||
      (activeLanguage === 'es' && spanishCatalog && !missingSources.size);
    notice.lang = activeLanguage === 'es' ? 'es' : 'en';
    notice.textContent = activeLanguage === 'es'
      ? (!spanishCatalog && !catalogFailed
        ? 'Cargando la traducción local. El contenido de aprendizaje se muestra en inglés mientras tanto.'
        : 'La traducción local no está disponible para parte del contenido. Ese contenido se muestra en inglés; tu progreso se conserva.')
      : 'Local learning translations are available in English and Spanish. Learning content is shown in English; your progress is preserved.';
  }

  function applyLearningLanguage(root = document) {
    const nodes = [...root.querySelectorAll('[data-learning-source]')];
    if (root.matches?.('[data-learning-source]')) nodes.unshift(root);
    nodes.forEach(node => {
      const source = node.dataset.learningSource;
      const available = activeLanguage === 'es' && spanishCatalog &&
        Object.prototype.hasOwnProperty.call(spanishCatalog, source);
      if (activeLanguage === 'es' && spanishCatalog && !available) missingSources.add(source);
      const params = JSON.parse(node.dataset.learningParams || '{}');
      node.textContent = (available ? spanishCatalog[source] : source)
        .replace(/\{(\w+)\}/g, (match, key) => Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match);
      node.lang = available ? 'es' : 'en';
      node.classList.add('notranslate');
      node.setAttribute('translate', 'no');
    });
    learningStatus();
  }

  function loadLearningLanguage() {
    missingSources.clear();
    applyLearningLanguage();
    if (activeLanguage !== 'es' || spanishCatalog || catalogRequest) return;
    catalogFailed = false;
    const abort = new AbortController();
    // A finite timeout only exposes failure. It is not a translation retry loop.
    const timeout = setTimeout(() => abort.abort(), 8000);
    catalogRequest = fetch(new URL('learning-es.json', assetBase), { signal: abort.signal })
      .then(response => {
        if (!response.ok) throw new Error('Spanish catalog unavailable');
        return response.json();
      }).then(catalog => {
        if (!catalog || Array.isArray(catalog) || typeof catalog !== 'object' ||
            Object.values(catalog).some(value => typeof value !== 'string' || !value.trim())) {
          throw new Error('Invalid Spanish catalog');
        }
        spanishCatalog = catalog;
      }).catch(() => { catalogFailed = true; })
      .finally(() => {
        clearTimeout(timeout);
        missingSources.clear();
        applyLearningLanguage();
        window.dispatchEvent(new Event('projects:learning-language-ready'));
      });
  }

  window.ProjectsLearningLocale = {
    apply: applyLearningLanguage,
    get language() { return activeLanguage; }
  };

  function addStyles() {
    if (document.getElementById('site-language-styles')) return;

    const style = document.createElement('style');
    style.id = 'site-language-styles';
    style.textContent = `
      .site-language-settings{
        max-width:var(--rm-max,1200px);margin:0 auto;padding:6px 18px;
        color:var(--rm-text,var(--text,#f5f7fb));font:inherit;
      }
      .site-language-settings summary{
        cursor:pointer;width:fit-content;margin-inline-start:auto;
        padding:6px 10px;border-radius:8px;font-size:13px;
      }
      .site-language-control{
        display:flex;align-items:center;gap:10px;max-width:320px;
        margin:4px 0 8px auto;padding:12px;border:1px solid var(--rm-line,var(--border,#555));
        border-radius:10px;background:var(--rm-panel,var(--panel,#11151c));
        color:var(--rm-text,var(--text,#f5f7fb));box-sizing:border-box;
      }
      .site-language-icon{font-size:20px;flex:0 0 28px;text-align:center}
      .site-language-copy{display:flex;flex-direction:column;min-width:0;flex:1}
      .site-language-label{font-size:12px;font-weight:700}
      .site-language-select{
        width:100%;min-height:36px;margin:4px 0;padding:4px 8px;border-radius:6px;
        border:1px solid var(--rm-line,var(--border,#555));
        background:var(--rm-panel,var(--panel,#11151c));color:inherit;font:inherit;cursor:pointer;
      }
      .site-language-select option{background:var(--rm-panel,var(--panel,#11151c));color:inherit}
      .site-language-select:focus-visible,.site-language-settings summary:focus-visible{
        outline:3px solid var(--rm-blue,#63c7ff);outline-offset:3px;
      }
      .site-language-note{font-size:12px;color:var(--rm-muted,var(--muted,#aab3c5));line-height:1.4}
      .site-language-rtl .site-language-control{margin:4px auto 8px 0}
      code,pre,kbd,samp,.screen,.platform-terminal,.cmd-input,.prompt-line,.command-line,.output-line{
        direction:ltr!important;
        text-align:left!important;
      }
      #google_translate_element{
        position:fixed!important;
        width:1px!important;
        height:1px!important;
        left:-10000px!important;
        bottom:-10000px!important;
        overflow:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }
      .goog-te-banner-frame.skiptranslate,
      iframe.goog-te-banner-frame,
      iframe.VIpgJd-ZVi9od-ORHb-OEVmcd,
      body > .VIpgJd-ZVi9od-ORHb-OEVmcd,
      body > .skiptranslate:not(.site-language-control):not(#google_translate_element),
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .goog-te-spinner-pos{display:none!important;visibility:hidden!important;height:0!important}
      html{margin-top:0!important;top:0!important}
      body{margin-top:0!important;top:0!important}
      @media print{.site-language-settings,#google_translate_element{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function suppressGoogleTranslateBanner() {
    const selectors = [
      'iframe.goog-te-banner-frame',
      'iframe.VIpgJd-ZVi9od-ORHb-OEVmcd',
      'body > .goog-te-banner-frame',
      'body > .VIpgJd-ZVi9od-ORHb-OEVmcd',
      'body > .skiptranslate:not(.site-language-control):not(#google_translate_element)'
    ].join(',');

    document.querySelectorAll(selectors).forEach(element => {
      element.style.setProperty('display', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
      element.style.setProperty('height', '0', 'important');
    });

    document.documentElement.style.setProperty('margin-top', '0px', 'important');
    document.documentElement.style.setProperty('top', '0px', 'important');

    if (document.body) {
      document.body.style.setProperty('margin-top', '0px', 'important');
      document.body.style.setProperty('top', '0px', 'important');
    }
  }

  function updateControlText(control, language) {
    const config = SUPPORTED_LANGUAGES[language];
    control.querySelector('.site-language-label').textContent = config.label;
    control.querySelector('.site-language-note').textContent = config.note;
    control.dir = config.dir;
  }

  function applyGoogleSelection(language) {
    const combo = document.querySelector('.goog-te-combo');
    if (!combo) return false;

    combo.value = language === BASE_LANGUAGE ? '' : language;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function changeLanguage(language) {
    const normalized = normalizeLanguage(language);
    const previous = activeLanguage;
    if (normalized === previous) return;
    // Assessment controllers checkpoint before any translation changes the DOM.
    const checkpoint = new Event('projects:before-language-change', { cancelable: true });
    const learningPage = document.querySelector('[data-learning-source]');
    const warning = learningPage
      ? (previous === 'es'
        ? 'No se puede guardar el progreso. Se conservará mientras mantengas esta página abierta. ¿Cambiar idioma?'
        : 'Progress cannot be saved. It is preserved while this page stays open. Change language?')
      : 'Your answers cannot be saved in this browser. Changing language will discard this attempt. Continue?';
    if (!window.dispatchEvent(checkpoint) && !window.confirm(warning)) {
      document.getElementById('site-language-select').value = previous;
      return;
    }
    saveLanguage(normalized);
    setTranslationCookie(normalized);
    if (learningPage) {
      activeLanguage = normalized;
      applyDocumentDirection(normalized);
      updateControlText(document.querySelector('.site-language-control'), normalized);
      document.querySelector('.site-language-settings summary').textContent =
        `${SUPPORTED_LANGUAGES[normalized].label}: ${SUPPORTED_LANGUAGES[normalized].nativeName}`;
      loadLearningLanguage();
      // The local renderer owns learning text. A reload is unnecessary and
      // would discard CLI input, scroll position and transient hints.
      applyGoogleSelection(normalized);
      loadGoogleTranslate(normalized);
      window.dispatchEvent(new Event('projects:learning-language-ready'));
      return;
    }
    // Reload from the original document; resume answers and the original deadline.
    window.location.reload();
  }

  function createControl(language) {
    if (document.querySelector('.site-language-control')) return;

    const control = document.createElement('div');
    control.className = 'site-language-control notranslate';
    control.setAttribute('translate', 'no');
    control.setAttribute('aria-label', 'Website language');
    control.innerHTML = `
      <span class="site-language-icon" aria-hidden="true">🌐</span>
      <span class="site-language-copy">
        <label class="site-language-label" for="site-language-select">Language</label>
        <select class="site-language-select" id="site-language-select" aria-label="Website language">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ar">العربية</option>
        </select>
        <span class="site-language-note">Original content</span>
      </span>
    `;

    const select = control.querySelector('select');
    select.value = language;
    select.addEventListener('change', event => changeLanguage(event.target.value));
    updateControlText(control, language);
    const settings = document.createElement('details');
    settings.className = 'site-language-settings notranslate';
    settings.setAttribute('translate', 'no');
    const summary = document.createElement('summary');
    summary.textContent = `${SUPPORTED_LANGUAGES[language].label}: ${SUPPORTED_LANGUAGES[language].nativeName}`;
    settings.append(summary, control);
    const header = document.querySelector('header');
    if (header) header.after(settings);
    else document.body.prepend(settings);
  }

  function loadGoogleTranslate(language) {
    if (language === BASE_LANGUAGE) {
      const status = document.getElementById('page-translation-status');
      if (status) status.hidden = true;
      return;
    }
    let status = document.getElementById('page-translation-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'page-translation-status';
      status.className = 'notranslate';
      status.setAttribute('translate', 'no');
      status.setAttribute('role', 'status');
      document.querySelector('.site-language-settings').after(status);
    }
    status.lang = language;
    status.hidden = false;
    const unavailable = () => {
      if (activeLanguage !== language) return;
      status.textContent = language === 'es'
        ? 'La traducción automática del resto de la página no está disponible o no se ha podido confirmar. Puede mostrarse texto en inglés. La traducción local del contenido de aprendizaje funciona por separado.'
        : 'Automatic page translation is unavailable or unconfirmed. Page text may remain in English. Local learning translations work separately.';
    };
    status.textContent = language === 'es'
      ? 'Traducción automática solicitada para el resto de la página; puede haber texto en inglés. El contenido de aprendizaje usa traducciones locales.'
      : 'Automatic page translation requested; page text may remain in English. Learning content uses local translations.';
    const startupTimeout = setTimeout(unavailable, 8000);

    if (!document.getElementById('google_translate_element')) {
      const mount = document.createElement('div');
      mount.id = 'google_translate_element';
      mount.className = 'notranslate';
      mount.setAttribute('translate', 'no');
      document.body.appendChild(mount);
    }

    window.projectsGoogleTranslateInit = () => {
      if (!window.google?.translate?.TranslateElement) return;

      new window.google.translate.TranslateElement({
        pageLanguage: BASE_LANGUAGE,
        includedLanguages: Object.keys(SUPPORTED_LANGUAGES).join(','),
        autoDisplay: false
      }, 'google_translate_element');

      suppressGoogleTranslateBanner();
      window.setTimeout(() => {
        if (!applyGoogleSelection(activeLanguage)) unavailable();
        suppressGoogleTranslateBanner();
      }, 250);
      window.setTimeout(suppressGoogleTranslateBanner, 750);
      window.setTimeout(suppressGoogleTranslateBanner, 1500);
    };

    if (!document.querySelector('script[data-projects-google-translate]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=projectsGoogleTranslateInit';
      script.async = true;
      script.dataset.projectsGoogleTranslate = 'true';
      script.onerror = () => {
        clearTimeout(startupTimeout);
        unavailable();
        const note = document.querySelector('.site-language-note');
        if (note) note.textContent = language === 'ar' ? 'تعذر تحميل الترجمة' : 'Traducción automática no disponible';
      };
      document.head.appendChild(script);
    }
  }

  function initialize() {
    const language = activeLanguage;
    addStyles();
    applyDocumentDirection(language);
    protectTechnicalContent();
    createControl(language);
    loadLearningLanguage();
    setTranslationCookie(language);
    loadGoogleTranslate(language);
    suppressGoogleTranslateBanner();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) protectTechnicalContent(node);
        });
      }
      suppressGoogleTranslateBanner();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
