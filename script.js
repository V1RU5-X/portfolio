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
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add('tilting');
      card.style.setProperty('--ry', `${(px - 0.5) * 6}deg`);
      card.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}
