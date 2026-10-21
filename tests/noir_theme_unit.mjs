// Preference logic only: actual shared script in a minimal DOM, no browser claims.
import { readFile } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

export async function runThemeUnitChecks(root) {
  const source = await readFile(root + '/assets/roadmap-theme.js', 'utf8');
  const catalog = JSON.parse(await readFile(root + '/assets/learning-es.json', 'utf8'));
  const results = [];
  function fixture({ current, legacy, initial = 'dark', denied = false, spanish = false, article = false } = {}) {
    const attrs = {};
    const button = { type: '', dataset: {}, classList: { add() {} },
      setAttribute(k,v) { attrs[k] = v; }, querySelector() { return null; } };
    const document = {
      documentElement: { dataset: { theme: initial } },
      body: { classList: { toggle() {}, contains(name) { return name === 'noir-article' && article; } } },
      querySelectorAll(s) { return s === '#themeBtn,.theme-toggle' ? [button] : []; },
      getElementById() { return null; },
      querySelector(s) { return s === '#themeBtn,.theme-toggle' ? button : null; },
      addEventListener(k,fn) { handlers[k] = fn; }
    };
    const handlers = {}, events = {};
    const store = new Map([['projects-roadmap-theme', current], ['kb_theme', legacy]]);
    const sandbox = { document, location: { pathname: '/' }, URL,
      localStorage: {
        getItem(k) { if (denied) throw Error('Storage denied'); return store.get(k) ?? null; },
        setItem(k,v) { if (denied) throw Error('Storage denied'); store.set(k,v); }
      },
      window: { addEventListener(k,fn) { events[k] = fn; },
        ProjectsLearningLocale: { message(s) { return spanish ? catalog[s] || s : s; } } }
    };
    new Script(source).runInContext(createContext(sandbox));
    return { attrs, store, document,
      theme: () => document.documentElement.dataset.theme,
      click() { handlers.click({ target: { closest: () => button }, preventDefault() {}, stopImmediatePropagation() {} }); },
      language(es) { spanish = es; events['projects:learning-language-ready'](); }
    };
  }
  for (const key of ['current','legacy']) for (const theme of ['light','dark','noir']) {
    const f = fixture({ [key]: theme }); assert.equal(f.theme(),theme);
    results.push('Restores ' + key + ' ' + theme);
  }
  let f = fixture({ current:'noir',legacy:'light' });
  for (const theme of ['light','dark','noir']) {
    f.click(); assert.equal(f.theme(),theme);
    assert.equal(f.store.get('projects-roadmap-theme'),theme);
    assert.equal(f.store.get('kb_theme'),theme);
  }
  results.push('Noir -> light -> dark -> noir writes both existing keys');
  f = fixture({ current:'dark' }); assert.equal(f.attrs['aria-label'],'Use noir theme');
  f.language(true); assert.equal(f.attrs['aria-label'],'Usar tema noir'); assert.equal(f.theme(),'dark');
  f.language(false); assert.equal(f.attrs['aria-label'],'Use noir theme');
  results.push('English/Spanish action labels retain theme');
  f = fixture({ denied:true }); f.click(); assert.equal(f.theme(),'noir');
  results.push('Denied storage keeps in-memory theme usable');
  f = fixture({ current:'invalid',legacy:'light' }); assert.equal(f.theme(),'light');
  f = fixture({ current:'invalid',legacy:'invalid',initial:'invalid' }); assert.equal(f.theme(),'dark');
  f = fixture({ initial:'light' }); assert.equal(f.theme(),'light');
  f = fixture(); assert.equal(f.theme(),'dark');
  f = fixture({ initial:null, article:true }); assert.equal(f.theme(),'light');
  f = fixture({ initial:'invalid', article:true }); assert.equal(f.theme(),'light');
  results.push('Malformed preferences fall back safely; initial light/dark defaults retained');
  for (const key of ['Noir','Noir theme','Use noir theme','Use light theme','Use dark theme']) assert.ok(catalog[key]);
  const css = await readFile(root + '/assets/noir-theme.css', 'utf8');
  const palette = Object.fromEntries([...css.matchAll(/(--noir-[a-z-]+):\s*(#[a-f0-9]{6});/g)].map(m=>[m[1],m[2]]));
  function luminance(hex) {
    const c = hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
    return c.reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
  }
  for (const fg of ['--noir-cream','--noir-muted']) for (const bg of ['--noir-bg','--noir-surface','--noir-surface-raised']) {
    const a = luminance(palette[fg]), b = luminance(palette[bg]);
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,fg+' against '+bg);
  }
  results.push('Declared outer text/muted tokens exceed 4.5:1 on all outer surfaces (not computed browser styles)');
  return results;
}
if (typeof process !== 'undefined' && process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../',import.meta.url));
  console.log(JSON.stringify(await runThemeUnitChecks(root),null,2));
}
