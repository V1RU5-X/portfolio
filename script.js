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

// Terminal: built here so the static about lines are all that shows without JS
const term = document.querySelector('.term');
const termText = sel => document.querySelector(sel)?.textContent.trim() ?? '';
const scrollBehavior = () => (reduced ? 'auto' : 'smooth');
const log = Object.assign(document.createElement('div'), { className: 'term-log' });
log.setAttribute('role', 'log');
log.setAttribute('aria-live', 'polite');
log.tabIndex = 0; // scrollable region must be keyboard reachable
const form = document.createElement('form');
form.className = 'term-form';
form.innerHTML = '<label for="term-input">Terminal command</label><span class="term-prompt" aria-hidden="true">&gt;</span>' +
  '<input class="term-input" id="term-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="type a command, or try help">'; // static markup only, no user text
const input = form.querySelector('input');
const chips = Object.assign(document.createElement('div'), { className: 'term-chips' });
['help', 'about', 'projects', 'contact'].forEach(name => {
  const b = Object.assign(document.createElement('button'), { type: 'button', textContent: name });
  b.addEventListener('click', () => run(name));
  chips.append(b);
});
term.append(log, form, chips);

function line(text, cls) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = text;
  log.append(d);
  log.scrollTop = log.scrollHeight;
  return d;
}
function goTo(id) { document.getElementById(id).scrollIntoView({ behavior: scrollBehavior() }); }

const commands = {
  help: ['list commands', () => Object.entries(commands).forEach(([n, c]) => line(`${n.padEnd(9)}${c[0]}`))],
  about: ['who I am', () => {
    [termText('.hero-title'), termText('.hero-role'), ...[...document.querySelectorAll('.about-grid p')].map(p => p.textContent.trim())].forEach(t => line(t));
    document.querySelectorAll('.term-body > div').forEach(r => line(`${r.querySelector('dt').textContent}: ${r.querySelector('dd').textContent}`));
  }],
  skills: ['what I work with', () => line([...document.querySelectorAll('.about-grid .tags li')].map(li => li.textContent.trim()).join(', '))],
  projects: ['list projects, jump to them', () => {
    document.querySelectorAll('.card h3').forEach((h, i) => line(`${i + 1}. ${h.textContent.trim()}`));
    goTo('projects');
  }],
  contact: ['email and links, jump to them', () => {
    document.querySelectorAll('.contact a:not(.btn)').forEach(src => {
      const d = line('');
      const a = document.createElement('a');
      a.href = src.href;
      a.textContent = src.textContent.trim();
      if (/^https?:/.test(src.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      d.append(a);
    });
    goTo('contact');
  }],
  resume: ['open the resume in a new tab', () => {
    const a = document.querySelector('a[href$="resume.pdf"]');
    if (a) window.open(a.href, '_blank', 'noopener');
    else line('no resume found', 'err');
  }],
  clear: ['empty the log', () => { log.textContent = ''; }],
};
const names = Object.keys(commands);
const cmdHistory = [];
let hpos = 0;

function run(raw) {
  const cmd = raw.trim().toLowerCase();
  stopIntro();
  line(`> ${raw.trim()}`, 'cmd');
  if (!cmd) return;
  if (cmd !== cmdHistory[cmdHistory.length - 1]) cmdHistory.push(cmd);
  hpos = cmdHistory.length;
  if (commands[cmd]) commands[cmd][1]();
  else line(`command not found: ${raw.trim()} \u2014 try help`, 'err');
}

form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
input.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    hpos = Math.max(0, Math.min(cmdHistory.length, hpos + (e.key === 'ArrowUp' ? -1 : 1)));
    input.value = cmdHistory[hpos] ?? '';
  } else if (e.key === 'Tab') {
    const v = input.value.trim().toLowerCase();
    const m = v && names.filter(n => n.startsWith(v));
    if (m && m.length === 1) { e.preventDefault(); input.value = m[0]; } // otherwise Tab keeps moving focus
  }
});
input.addEventListener('input', () => stopIntro());

// Intro: type "help" once, instantly under reduced motion or when the user interacts
let introTimer = null, introLine = null;
function stopIntro() {
  if (introTimer === null) return;
  clearInterval(introTimer);
  introTimer = null;
  introLine.textContent = '> help';
  commands.help[1]();
}
if (reduced) {
  line('> help', 'cmd');
  commands.help[1]();
} else {
  introLine = line('> ', 'cmd');
  let n = 0;
  introTimer = setInterval(() => {
    introLine.textContent = '> help'.slice(0, 2 + ++n);
    if (n === 4) { stopIntro(); }
  }, 40);
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
  add('Open terminal', 'action', () => {
    document.querySelector('.hero').scrollIntoView({ behavior: scrollBehavior() });
    document.getElementById('term-input').focus({ preventScroll: true });
  });

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
    // Actions that move focus (terminal) win; otherwise hand it back
    if ((!document.activeElement || document.activeElement === document.body) && prev?.isConnected) prev.focus({ preventScroll: true });
  });
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(); }
    else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !dlg.open && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); open(); }
  });

})();
