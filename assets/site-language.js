(() => {
  'use strict';

  const STORAGE_KEY = 'projects-site-language';
  const COOKIE_NAME = 'googtrans';
  const BASE_LANGUAGE = 'en';
  const SUPPORTED_LANGUAGES = {
    en: { nativeName: 'English', label: 'Language', note: 'Original content', dir: 'ltr' },
    es: { nativeName: 'Español', label: 'Idioma', note: 'Traducción automática', dir: 'ltr' },
    ar: { nativeName: 'العربية', label: 'اللغة', note: 'ترجمة آلية', dir: 'rtl' }
  };

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

    root.querySelectorAll?.(selector).forEach(element => {
      element.classList.add('notranslate');
      element.setAttribute('translate', 'no');
    });
  }

  function addStyles() {
    if (document.getElementById('site-language-styles')) return;

    const style = document.createElement('style');
    style.id = 'site-language-styles';
    style.textContent = `
      .site-language-control{
        position:fixed;
        right:18px;
        bottom:18px;
        z-index:2147483000;
        display:flex;
        align-items:center;
        gap:10px;
        min-width:210px;
        padding:10px 12px;
        border:1px solid rgba(255,255,255,.16);
        border-radius:16px;
        background:rgba(17,21,28,.94);
        color:#f5f7fb;
        box-shadow:0 16px 42px rgba(0,0,0,.38);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
      }
      .site-language-icon{
        display:grid;
        place-items:center;
        width:34px;
        height:34px;
        flex:0 0 34px;
        border-radius:11px;
        background:linear-gradient(135deg,#7cc7ff,#9effc6);
        color:#071018;
        font-size:17px;
      }
      .site-language-copy{
        display:flex;
        flex-direction:column;
        min-width:0;
        flex:1;
      }
      .site-language-label{
        margin:0 0 2px;
        color:#aab3c5;
        font-size:10px;
        font-weight:700;
        letter-spacing:.1em;
        line-height:1.2;
        text-transform:uppercase;
      }
      .site-language-select{
        width:100%;
        min-width:130px;
        margin:0;
        padding:4px 24px 4px 0;
        border:0;
        outline:0;
        background:transparent;
        color:#f5f7fb;
        font:inherit;
        font-size:14px;
        font-weight:700;
        cursor:pointer;
      }
      .site-language-select option{
        background:#11151c;
        color:#f5f7fb;
      }
      .site-language-note{
        display:block;
        margin-top:1px;
        color:#8f9aae;
        font-size:10px;
        line-height:1.2;
      }
      .site-language-rtl .site-language-control{
        direction:rtl;
        right:auto;
        left:18px;
      }
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
      @media(max-width:640px){
        .site-language-control{
          right:10px;
          bottom:10px;
          min-width:178px;
          padding:8px 10px;
          border-radius:14px;
        }
        .site-language-rtl .site-language-control{left:10px;right:auto}
        .site-language-icon{width:30px;height:30px;flex-basis:30px;font-size:15px}
        .site-language-select{min-width:108px;font-size:13px}
      }
      @media print{.site-language-control,#google_translate_element{display:none!important}}
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
    saveLanguage(normalized);
    setTranslationCookie(normalized);
    applyDocumentDirection(normalized);

    const control = document.querySelector('.site-language-control');
    if (control) updateControlText(control, normalized);

    if (!applyGoogleSelection(normalized)) {
      window.location.reload();
      return;
    }

    // A reload gives Google Translate a clean source document and keeps the
    // selected language consistent when moving between GitHub Pages routes.
    window.setTimeout(() => window.location.reload(), 120);
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
    document.body.appendChild(control);
  }

  function loadGoogleTranslate(language) {
    if (language === BASE_LANGUAGE) return;

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
        applyGoogleSelection(language);
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
        const note = document.querySelector('.site-language-note');
        if (note) note.textContent = language === 'ar' ? 'تعذر تحميل الترجمة' : 'Translation unavailable';
      };
      document.head.appendChild(script);
    }
  }

  function initialize() {
    const language = getSavedLanguage();
    addStyles();
    applyDocumentDirection(language);
    protectTechnicalContent();
    createControl(language);
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
