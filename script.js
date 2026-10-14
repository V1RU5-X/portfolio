const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

// Scroll reveal, staggered by each element's index among its siblings
const revealEls = document.querySelectorAll('.reveal, .draw');
revealEls.forEach(el => el.style.setProperty('--i', [...el.parentElement.children].indexOf(el)));
if (reduced || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      // drop the stagger delay afterwards so hover/tilt transitions stay instant
      el.addEventListener('transitionend', () => el.classList.add('done'), { once: true });
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
}

// Text decode: the hero name and section headings scramble, then settle left to right (once each)
function decode(el, delay = 0) {
  const text = el.textContent, glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_<>';
  const { width, height } = el.getBoundingClientRect();
  el.setAttribute('aria-label', text); // assistive tech only ever gets the real text
  el.style.width = width + 'px'; el.style.overflow = 'hidden'; // fixed (not min) width: heading is a flex item
  el.style.height = height + 'px';
  const t0 = performance.now() + delay;
  (function frame(now) {
    const p = Math.min((now - t0) / 600, 1);
    const keep = Math.floor(p * text.length);
    el.textContent = [...text].map((ch, i) => (i < keep || ch === ' ' ? ch : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
    if (p < 1) return requestAnimationFrame(frame);
    el.textContent = text;
    el.removeAttribute('aria-label');
    el.style.width = el.style.height = el.style.overflow = '';
    if (!el.getAttribute('style')) el.removeAttribute('style');
  })(performance.now());
}
if (!reduced && 'IntersectionObserver' in window) {
  decode(document.querySelector('.hero-title'), 100); // matches the hero rise delay
  const dio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    dio.unobserve(e.target);
    decode(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll('h2.h2').forEach(h => dio.observe(h));
}

// Nav: blurred bar once scrolled, scroll progress, active section link
const header = document.querySelector('.site-header');
const bar = document.querySelector('.progress');
function onScroll() {
  header.classList.toggle('scrolled', scrollY > 8);
  const max = root.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

if ('IntersectionObserver' in window) {
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => {
        const on = a.hash === '#' + e.target.id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));
}

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', open);
  links.classList.toggle('open', open);
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

const resetTilt = c => { c.classList.remove('tilting'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); };

// Hero spotlight + card tilt: skipped entirely for touch or reduced motion
if (!reduced && !coarse) {
  root.classList.add('fx-on');
  // Hero spotlight + grid glow
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hero.style.setProperty('--my', `${e.clientY - r.top}px`);
  });

  // Card tilt (max 3deg) + border highlight
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (card.querySelector('details[open]')) return resetTilt(card); // open case study: no tilt
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add('tilting');
      card.style.setProperty('--ry', `${(px - 0.5) * 6}deg`);
      card.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => resetTilt(card));
  });
}

// Project filter: chips are built here so without JS every card just shows
const cardEls = [...document.querySelectorAll('.card[data-tags]')];
const cardsBox = document.querySelector('.cards');
const filterTags = [...new Set(cardEls.flatMap(c => c.dataset.tags.split(',')))].sort();
const filters = Object.assign(document.createElement('div'), { className: 'filters' });
filters.setAttribute('role', 'group');
filters.setAttribute('aria-label', 'Filter projects by technology');
const filterStatus = Object.assign(document.createElement('p'), { className: 'sr' });
filterStatus.setAttribute('aria-live', 'polite');
['All', ...filterTags].forEach(tag => {
  const b = Object.assign(document.createElement('button'), { type: 'button', textContent: tag });
  b.setAttribute('aria-pressed', String(tag === 'All'));
  b.addEventListener('click', () => applyFilter(tag));
  filters.append(b);
});
cardsBox.before(filters, filterStatus);

function applyFilter(tag) {
  filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === tag)));
  let n = 0;
  cardEls.forEach(c => {
    clearTimeout(c.hideTimer);
    if (tag === 'All' || c.dataset.tags.split(',').includes(tag)) {
      n++;
      if (c.hidden) { c.hidden = false; if (!reduced) { c.classList.add('out'); c.offsetWidth; } } // reflow so the fade-in runs
      c.classList.remove('out');
    } else if (!c.hidden) {
      resetTilt(c); // no stale tilt on a hidden card
      if (reduced) c.hidden = true;
      else { c.classList.add('out'); c.hideTimer = setTimeout(() => { c.hidden = true; }, 200); }
    }
  });
  filterStatus.textContent = `Showing ${n} of ${cardEls.length} projects`;
}

const scrollBehavior = () => (reduced ? 'auto' : 'smooth');

// Hero code panel: types itself once when scrolled into view, keeping the token spans
const codeEl = document.querySelector('.code');
if (codeEl && !reduced && 'IntersectionObserver' in window) {
  const code = codeEl.querySelector('code');
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n; (n = walker.nextNode());) nodes.push([n, n.data]);
  nodes.forEach(([n]) => { n.data = ''; });
  const caret = Object.assign(document.createElement('span'), { className: 'caret' });
  caret.setAttribute('aria-hidden', 'true');
  nodes[0][0].before(caret);
  codeEl.setAttribute('aria-hidden', 'true');
  codeEl.classList.add('typing');
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    let i = 0, c = 0;
    const timer = setInterval(() => {
      const [n, full] = nodes[i];
      n.data = full.slice(0, ++c);
      if (c >= full.length) { i++; c = 0; nodes[i]?.[0].before(caret); }
      if (i >= nodes.length) { clearInterval(timer); code.lastElementChild.append(caret); codeEl.removeAttribute('aria-hidden'); }
    }, 30);
  }, { threshold: 0.4 }).observe(codeEl);
}

// Command palette: every action is read from the page, so there is no second copy of the text
(() => {
  const dlg = document.createElement('dialog');
  dlg.className = 'palette';
  dlg.setAttribute('aria-label', 'Command palette');
  const box = document.createElement('div');
  const lab = Object.assign(document.createElement('label'), { className: 'sr', htmlFor: 'palette-input', textContent: 'Search commands' });
  const q = Object.assign(document.createElement('input'), { id: 'palette-input', className: 'palette-input', type: 'text', placeholder: 'Type a command or search…', autocomplete: 'off', spellcheck: false });
  q.setAttribute('role', 'combobox');
  q.setAttribute('aria-expanded', 'true');
  q.setAttribute('aria-controls', 'palette-list');
  q.setAttribute('aria-autocomplete', 'list');
  const list = Object.assign(document.createElement('ul'), { id: 'palette-list', className: 'palette-list' });
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Commands');
  const empty = Object.assign(document.createElement('p'), { className: 'palette-empty', textContent: 'No results', hidden: true });
  const foot = Object.assign(document.createElement('p'), { className: 'palette-foot', textContent: '↑↓ navigate · ↵ select · esc close' });
  box.append(lab, q, list, empty, foot);
  dlg.append(box);
  const toast = Object.assign(document.createElement('div'), { className: 'toast' });
  toast.setAttribute('role', 'status');
  document.body.append(dlg, toast);

  let toastTimer;
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  };

  const items = [];
  const add = (label, hint, run) => items.push({ label, hint, run });
  document.querySelectorAll('.nav-links a').forEach(a => {
    add('Go to ' + a.textContent.trim(), 'section', () => document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: scrollBehavior() }));
  });
  const mail = document.querySelector('#contact a[href^="mailto:"]');
  if (mail) {
    const addr = mail.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
    add('Copy email', 'action', async () => {
      try { await navigator.clipboard.writeText(addr); say('Email copied'); }
      catch { say('Couldn’t copy — ' + addr); }
    });
  }
  document.querySelectorAll('#contact a[href]').forEach(a => {
    if (!/^https?:/.test(a.getAttribute('href'))) return;
    add('Open ' + a.textContent.trim(), 'link', () => window.open(a.href, '_blank', 'noopener,noreferrer'));
  });
  const resume = document.querySelector('#contact a[download]');
  if (resume) add('Download resume', 'action', () => resume.click());

  let shown = [], cur = 0, prev = null;
  function highlight(i) {
    if (!shown.length) { q.removeAttribute('aria-activedescendant'); return; }
    cur = (i + shown.length) % shown.length;
    [...list.children].forEach((li, n) => li.setAttribute('aria-selected', n === cur));
    q.setAttribute('aria-activedescendant', list.children[cur].id);
    list.children[cur].scrollIntoView({ block: 'nearest' });
  }
  function choose(it) {
    dlg.close();
    it.run();
  }
  function render() {
    const s = q.value.trim().toLowerCase();
    shown = items.filter(it => it.label.toLowerCase().includes(s));
    list.replaceChildren(...shown.map((it, n) => {
      const li = document.createElement('li');
      li.id = 'palette-opt-' + n;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.append(Object.assign(document.createElement('span'), { textContent: it.label }), Object.assign(document.createElement('kbd'), { textContent: it.hint }));
      li.addEventListener('pointermove', () => cur !== n && highlight(n));
      li.addEventListener('click', () => choose(it));
      return li;
    }));
    empty.hidden = shown.length > 0;
    highlight(0);
  }
  function open() {
    if (dlg.open) return;
    prev = document.activeElement;
    q.value = '';
    render();
    dlg.showModal();
    q.focus();
  }
  q.addEventListener('input', render);
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); highlight(cur + (e.key === 'ArrowDown' ? 1 : -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[cur]) choose(shown[cur]); }
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => {
    // Hand focus back unless an action moved it
    if ((!document.activeElement || document.activeElement === document.body) && prev?.isConnected) prev.focus({ preventScroll: true });
  });
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(); }
    else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !dlg.open && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); open(); }
  });

})();
