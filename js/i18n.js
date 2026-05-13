const I18n = (() => {
  let _lang = CONFIG.DEFAULT_LANG;
  let _translations = {};

  async function init(lang) {
    const base = location.pathname.includes('/fr/') || location.pathname.includes('/es/')
      ? '../data/translations.json' : 'data/translations.json';
    const res = await fetch(base);
    _translations = await res.json();
    // Lang priority: 1) explicit URL path (/fr/, /es/) → 2) user-chosen via switcher (localStorage) → 3) default (English).
    // No browser-locale auto-detection: English is the global default.
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY + '_lang');
    _lang = lang || saved || CONFIG.DEFAULT_LANG;
    _apply();
  }

  function setLang(lang) {
    if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;
    _lang = lang;
    localStorage.setItem(CONFIG.STORAGE_KEY + '_lang', lang);
    _apply();
  }

  function getLang() { return _lang; }

  function t(key) {
    const dict = _translations[_lang] || _translations['en'] || {};
    if (key.includes('.')) {
      const parts = key.split('.');
      let obj = dict;
      for (const p of parts) { obj = obj?.[p]; }
      return obj || key;
    }
    return dict[key] || key;
  }

  function constraint(id) {
    return t('constraints.' + id);
  }

  function _apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.documentElement.lang = _lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === _lang);
    });
  }

  return { init, setLang, getLang, t, constraint };
})();
