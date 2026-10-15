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

// Text decode: the hero name and section headings scramble, then settle left to right (once each).
// With `to`, it scrambles toward new text (the menu label); a newer call on the same element cancels the older one
function decode(el, delay = 0, to) {
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_<>', run = el.decodeRun = {};
  el.style.width = el.style.height = ''; // measure free of an earlier run's lock
  let { width, height } = el.getBoundingClientRect();
  const text = to ?? el.textContent;
  if (to !== undefined) { el.textContent = to; width = Math.max(width, el.getBoundingClientRect().width); } // wider of old/new, so nothing jumps
  const name = el.getAttribute('aria-label'); // a fixed name (nav links) is put back afterwards
  el.setAttribute('aria-label', text); // assistive tech only ever gets the real text
  el.style.width = width + 'px'; el.style.overflow = 'hidden'; // fixed (not min) width: heading is a flex item
  el.style.height = height + 'px';
  const t0 = performance.now() + delay;
  (function frame(now) {
    if (el.decodeRun !== run) return;
    const p = Math.min((now - t0) / 600, 1);
    const keep = Math.floor(p * text.length);
    el.textContent = [...text].map((ch, i) => (i < keep || ch === ' ' ? ch : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
    if (p < 1) return requestAnimationFrame(frame);
    el.textContent = text;
    if (name === null) el.removeAttribute('aria-label'); else el.setAttribute('aria-label', name);
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
const navLinks = [...document.querySelectorAll('.nav-links a')];
let cur; // section the observer last reported
const mark = () => { // at the very bottom the last link wins: a tall screen never lets Contact reach the observer band
  const h = root.scrollHeight - innerHeight > 0 && root.scrollHeight - innerHeight - scrollY < 2 ? navLinks.at(-1).hash : cur;
  navLinks.forEach(a => {
    const on = a.hash === h;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
};
function onScroll() {
  header.classList.toggle('scrolled', scrollY > 8);
  const max = root.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
  mark();
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { cur = '#' + e.target.id; mark(); } });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));
}

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
const label = toggle.querySelector('.nav-toggle-label');
const narrow = matchMedia('(max-width: 720px)');
const full = navLinks.map(a => a.textContent); // real link text; the visible text is typed in and out on phones
navLinks.forEach((a, i) => a.setAttribute('aria-label', full[i]));
toggle.setAttribute('aria-label', 'Menu'); // stable name while the label decodes; aria-expanded carries the state
const caret = Object.assign(document.createElement('span'), { className: 'caret' });
caret.setAttribute('aria-hidden', 'true');
const total = full.join('').length;
let typed = 0, menuTimer;
const show = () => { // `typed` characters across the links in order, caret after the last one
  let rest = typed;
  navLinks.forEach((a, i) => { a.textContent = full[i].slice(0, Math.max(rest, 0)); rest -= full[i].length; });
  (navLinks.findLast(a => a.textContent) || navLinks[0]).append(caret);
};
function setMenu(open) {
  const instant = reduced || !narrow.matches;
  if (toggle.getAttribute('aria-expanded') !== String(open)) {
    toggle.setAttribute('aria-expanded', open);
    if (instant) label.textContent = open ? 'Close' : 'Menu'; else decode(label, 0, open ? 'Close' : 'Menu');
  }
  clearTimeout(menuTimer);
  if (instant) { caret.remove(); navLinks.forEach((a, i) => { a.textContent = full[i]; }); links.classList.toggle('open', open); return; }
  if (!open && !links.classList.contains('open')) return;
  let wait = 0;
  if (open && !links.classList.contains('open')) { typed = 0; show(); links.classList.add('open'); wait = 180; } // let the panel grow first
  const tick = () => { // a toggle mid-way just clears the timer and runs this from the current `typed` the other way
    if (open ? typed < total : typed > 0) { typed += open ? 1 : -1; show(); menuTimer = setTimeout(tick, open ? 25 : 8); }
    else if (!open) { caret.remove(); links.classList.remove('open'); }
  };
  menuTimer = setTimeout(tick, wait);
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('click', e => { // capture: a tap outside only closes the menu, it doesn't also hit the tile or link underneath
  if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(e.target)) { e.preventDefault(); e.stopPropagation(); setMenu(false); }
}, true);
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
  if (links.contains(document.activeElement)) toggle.focus();
  setMenu(false);
});
if (!reduced) navLinks.forEach(a => a.addEventListener('pointerenter', e => { // desktop hover: the name decodes; `to` is the real text, so a rapid re-hover never starts from scrambled glyphs
  if (e.pointerType === 'mouse' && !narrow.matches) decode(a, 0, a.getAttribute('aria-label'));
}));
narrow.addEventListener('change', () => setMenu(false)); // past 720px this restores the full desktop links at once

const resetTilt = c => { c.classList.remove('tilting'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); };

// Card tilt: skipped entirely for touch or reduced motion
if (!reduced && !coarse) {
  // Card tilt (max 3deg) + border highlight
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
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

// Dot field: one fixed canvas, dots sit on a page-anchored grid and scroll with the content, fading out above #contact.
// Dots near the pointer light up and shift away, then spring back (static when reduced)
const dots = document.createElement('canvas'), dc = dots.getContext && dots.getContext('2d'), dotsEnd = document.getElementById('contact');
if (dc && dotsEnd && 'ResizeObserver' in window) {
  dots.className = 'dots'; dots.setAttribute('aria-hidden', 'true'); document.body.prepend(dots); root.classList.add('dots-on');
  const cs = getComputedStyle(root), px = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = v => { px.clearRect(0, 0, 1, 1); px.fillStyle = v.trim(); px.fillRect(0, 0, 1, 1); return px.getImageData(0, 0, 1, 1).data; };
  const base = rgba(cs.getPropertyValue('--line-strong')), acc = rgba(cs.getPropertyValue('--accent'));
  const R = 120, PUSH = 8, ptr = { x: 0, y: 0, on: false };
  let w, h, dpr, n, cols, step, end, fade, bx, by, ox, oy, vx, vy, k, raf = 0, sig = '';
  const range = () => { // dots whose rows are inside the viewport
    const y = scrollY, r0 = Math.max(0, Math.floor((y - R - by[0] - PUSH) / step)), r1 = Math.floor((y + h + R + PUSH - by[0]) / step) + 1;
    return [Math.min(n, r0 * cols), Math.min(n, (r1 + 1) * cols)];
  };
  const draw = () => {
    dc.setTransform(dpr, 0, 0, dpr, 0, 0); dc.clearRect(0, 0, w, h);
    const sy = scrollY, [a, z] = range();
    for (let i = a; i < z; i++) {
      const f = Math.min(1, (end - by[i]) / fade); if (f <= 0) continue;
      const t = k[i], c = j => base[j] + (acc[j] - base[j]) * t, y = by[i] + oy[i] - sy;
      if (y < -4 || y > h + 4) continue;
      dc.fillStyle = `rgba(${c(0) | 0},${c(1) | 0},${c(2) | 0},${(base[3] + (255 - base[3]) * t * .8) / 255 * f})`;
      dc.beginPath(); dc.arc(bx[i] + ox[i], y, 1.2 + t * .6, 0, 6.2832); dc.fill();
    }
  };
  const tick = () => {
    raf = 0; let moving = false;
    const py = ptr.y + scrollY, [a, z] = range();
    for (let i = a; i < z; i++) {
      const dx = bx[i] - ptr.x, dy = by[i] - py, d = Math.hypot(dx, dy) || 1, near = ptr.on && d < R ? 1 - d / R : 0;
      vx[i] = (vx[i] + (dx / d * near * PUSH - ox[i]) * .12) * .8; vy[i] = (vy[i] + (dy / d * near * PUSH - oy[i]) * .12) * .8;
      ox[i] += vx[i]; oy[i] += vy[i]; k[i] += (near - k[i]) * .15;
      if (Math.abs(vx[i]) + Math.abs(vy[i]) > .01 || Math.abs(near - k[i]) > .005) moving = true; // still easing; a resting pointer lets the loop stop
    }
    draw();
    if (moving) go();
  };
  const go = () => { if (!raf && !document.hidden && scrollY < end) raf = requestAnimationFrame(tick); }; // nothing to draw at or below Contact
  const build = () => {
    w = root.clientWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    end = dotsEnd.getBoundingClientRect().top + scrollY; fade = 15 * parseFloat(cs.fontSize);
    const next = [w, h, dpr, Math.round(end)].join();
    if (next === sig) return; sig = next;
    dots.width = Math.round(w * dpr); dots.height = Math.round(h * dpr);
    step = Math.max(28, Math.sqrt(w * h / 3000)); cols = Math.floor(w / step) + 1;
    const rows = Math.floor(end / step) + 1, left = (w - (cols - 1) * step) / 2;
    n = cols * rows; [bx, by, ox, oy, vx, vy, k] = Array.from({ length: 7 }, () => new Float32Array(n));
    for (let i = 0; i < n; i++) { bx[i] = (i % cols) * step + left; by[i] = Math.floor(i / cols) * step + step / 2; }
    go();
  };
  build();
  addEventListener('resize', build); new ResizeObserver(build).observe(document.querySelector('main'));
  addEventListener('scroll', go, { passive: true });
  if (!reduced) {
    const aim = e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; go(); };
    addEventListener('pointermove', aim); addEventListener('pointerdown', aim);
    const off = () => { ptr.on = false; go(); };
    document.documentElement.addEventListener('pointerleave', off); addEventListener('blur', off);
    document.addEventListener('visibilitychange', go);
  }
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
      if (reduced) { c.hidden = true; console.assert(!c.offsetParent, 'hidden card still laid out'); }
      else { c.classList.add('out'); c.hideTimer = setTimeout(() => { c.hidden = true; console.assert(!c.offsetParent, 'hidden card still laid out'); }, 200); }
    }
  });
  filterStatus.textContent = `Showing ${n} of ${cardEls.length} projects`;
}

// Dialog motion: FLIP between a tile's rect and the dialog (transform-origin is top left in CSS)
const ease = 'cubic-bezier(.2, .8, .2, 1)';
const flip = (r, d) => `translate(${r.left - d.left}px, ${r.top - d.top}px) scale(${r.width / d.width}, ${r.height / d.height})`;
const settle = dlg => { dlg.classList.remove('shut'); dlg.getAnimations({ subtree: true }).forEach(a => a.cancel()); };
function shut(dlg, rect) { // animate out (into `rect` if given, else a reverse pop), then close; one path for button, backdrop and Esc
  if (!dlg.open || dlg.classList.contains('shut')) return;
  if (reduced) return dlg.close();
  settle(dlg); dlg.classList.add('shut'); // .shut fades the backdrop
  const to = rect ? { transform: flip(rect, dlg.getBoundingClientRect()), opacity: 0 } : { transform: 'scale(.96)', opacity: 0 };
  dlg.animate([{ transform: 'none', opacity: 1 }, to], { duration: rect ? 260 : 160, easing: rect ? ease : 'ease-in', fill: 'forwards' }).onfinish = () => dlg.close();
}

// Project dialog: each tile's title becomes a button; the dialog is filled from the card, so index.html stays the only copy
(() => {
  const dlg = document.createElement('dialog');
  dlg.className = 'project';
  dlg.setAttribute('aria-labelledby', 'project-title');
  document.body.append(dlg);
  let opener, typer;
  const tile = () => { // the opener's tile rect, or null when it is filtered out or off-screen
    const c = opener?.closest('.card'), r = c && !c.hidden && c.getBoundingClientRect();
    return r && r.width && r.bottom > 0 && r.top < innerHeight ? r : null;
  };
  const close = () => shut(dlg, tile());
  cardEls.forEach(card => {
    const h = card.querySelector('h3');
    const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'open' });
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.append(...h.childNodes);
    h.append(btn);
    btn.addEventListener('click', () => {
      opener = btn; resetTilt(card); clearInterval(typer);
      const body = Object.assign(document.createElement('div'), { className: 'project-body' });
      const x = Object.assign(document.createElement('button'), { type: 'button', className: 'close', textContent: 'Close' });
      x.addEventListener('click', close);
      const title = Object.assign(document.createElement('h3'), { id: 'project-title', textContent: btn.textContent });
      const div = (className, ...kids) => { const d = Object.assign(document.createElement('div'), { className }); d.append(...kids.filter(Boolean)); return d; };
      const copy = sel => card.querySelector(sel)?.cloneNode(true);
      const desc = copy(':scope > p');
      const info = div('project-info', title, desc, copy('.tags'), copy('.links'));
      body.append(div('project-top', div('project-shot', copy('.preview')), info), div('project-case', copy('.case dl')));
      settle(dlg);
      const from = card.getBoundingClientRect();
      const slug = btn.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const bar = div('term-bar', ...[0, 1, 2].map(() => Object.assign(document.createElement('i'), { ariaHidden: 'true' })), Object.assign(document.createElement('span'), { textContent: slug + '.md' }), x);
      dlg.replaceChildren(bar, body);
      dlg.showModal();
      if (reduced) return;
      // type the title and description: full text stays in the DOM (transparent where untyped), so wrapping and the name never change
      const caret = Object.assign(document.createElement('span'), { className: 'caret' });
      caret.setAttribute('aria-hidden', 'true');
      const lines = [title, desc].filter(Boolean).map(el => {
        const full = el.textContent, a = new Text(), b = Object.assign(document.createElement('span'), { className: 'typed-rest', textContent: full });
        el.replaceChildren(a, caret, b);
        return { a, b, full };
      });
      lines[0].a.after(caret);
      let i = 0, n = 0;
      const step = Math.ceil(lines.reduce((t, l) => t + l.full.length, 0) / 40); // whole thing in ~0.65s whatever the length
      typer = setTimeout(() => {
        typer = setInterval(() => {
          const l = lines[i], c = Math.min(n += step, l.full.length);
          l.a.data = l.full.slice(0, c); l.b.textContent = l.full.slice(c);
          if (c < l.full.length) return;
          if (i + 1 < lines.length) { n = 0; lines[++i].a.after(caret); } else clearInterval(typer);
        }, 16);
      }, 340);
      // grow out of the tile, then rise the content in once it has landed
      dlg.animate([{ transform: flip(from, dlg.getBoundingClientRect()), opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: ease });
      setTimeout(() => decode(x, 0, 'Close'), 300); // once the window has landed; a new button per open, so a stale run can't touch it
      dlg.querySelectorAll('.project-shot, .project-info, .project-case').forEach((el, i) =>
        el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 260 + i * 60, easing: ease, fill: 'backwards' }));
    });
    card.addEventListener('click', e => { if (!e.target.closest('a, summary, button')) btn.click(); }); // tilted corners can miss the overlay
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('close', () => { clearInterval(typer); settle(dlg); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
})();

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
  nodes[0][0].after(caret);
  codeEl.setAttribute('aria-hidden', 'true');
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    let i = 0, c = 0;
    const timer = setInterval(() => {
      const [n, full] = nodes[i];
      n.data = full.slice(0, ++c);
      if (c >= full.length) { i++; c = 0; nodes[i]?.[0].after(caret); }
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
    add('Go to ' + a.textContent.trim(), 'section', () => document.querySelector(a.getAttribute('href'))?.scrollIntoView());
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
  dlg.addEventListener('click', e => { if (e.target === dlg) shut(dlg); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); shut(dlg); });
  dlg.addEventListener('close', () => {
    settle(dlg);
    // Hand focus back unless an action moved it
    if ((!document.activeElement || document.activeElement === document.body) && prev?.isConnected) prev.focus({ preventScroll: true });
  });
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (dlg.open) shut(dlg); else if (!document.querySelector('dialog[open]')) open(); }
    else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !dlg.open && !document.querySelector('dialog[open]') && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); open(); }
  });

})();
