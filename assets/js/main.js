/* ==========================================================================
   STUDIO THAINÁ, movimento e interação
   GSAP + ScrollTrigger + Lenis. Tudo degrada: sem CDN, sem JS ou com
   "reduzir movimento" o site aparece inteiro e estático.
   ========================================================================== */

const REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const ANIMATE  = HAS_GSAP && !REDUCED;
const FINE     = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
window.__ready = true;
if (!ANIMATE) document.documentElement.classList.remove('js-anim');

/* ---- 1 · Rolagem suave ---------------------------------------------------- */
let lenis = null;
function initSmoothScroll () {
  if (!ANIMATE || typeof window.Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); closeMenu(); lenis.scrollTo(target, { offset: -20 });
  }));
}

/* ---- 2 · Títulos palavra por palavra (preserva <b>) ------------------------ */
function splitWords (el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (!node.nodeValue.trim()) return;
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(tok => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
      const w = document.createElement('span'); w.className = 'w';
      const i = document.createElement('i'); i.textContent = tok; w.appendChild(i); frag.appendChild(w);
    });
    node.parentNode.replaceChild(frag, node);
  });
  return el.querySelectorAll('.w > i');
}

/* ---- 3 · Entrada da hero ---------------------------------------------------- */
function initHero () {
  if (!ANIMATE) return;
  // hero sem texto visível: vídeo aproxima, barra desce, botão e cards sobem
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__media', { scale: 1.18, duration: 2 }, 0)
    .from('.bar > *', { y: -20, opacity: 0, duration: .9, stagger: .06 }, .2)
    .to('[data-hero]', { opacity: 1, y: 0, duration: .9, stagger: .1 }, .6);
}

/* ---- 4 · Revelações ao rolar ------------------------------------------------ */
function initReveals () {
  if (!ANIMATE) return;
  document.querySelectorAll('[data-split]').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(splitWords(el), { y: '0%', duration: 1, ease: 'expo.out', stagger: .035,
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  document.querySelectorAll('[data-reveal]').forEach(el => gsap.to(el, {
    opacity: 1, y: 0, duration: .9, ease: 'expo.out', delay: parseFloat(el.dataset.delay || 0),
    scrollTrigger: { trigger: el, start: 'top 90%' } }));
  document.querySelectorAll('[data-reveal-stagger]').forEach(g => gsap.to(g.children, {
    opacity: 1, y: 0, duration: .8, ease: 'expo.out', stagger: .07,
    scrollTrigger: { trigger: g, start: 'top 88%' } }));
  // ferramentas entram deslizando da borda direita e depois flutuam com a rolagem
  const tools = document.querySelector('.how__tools');
  if (tools) {
    gsap.from(tools, { xPercent: 60, opacity: 0, rotate: -6, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: tools, start: 'top 85%' } });
    gsap.to(tools, { y: -60, ease: 'none',
      scrollTrigger: { trigger: '.how', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  // contadores: sem JS o HTML já mostra o número final
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseInt(el.dataset.count, 10), obj = { n: 0 };
    el.textContent = '0';
    // conta de 0 até o número, segura 3s e recomeça (só roda quando está na tela)
    gsap.to(obj, { n: end, duration: 2.2, ease: 'power3.out', repeat: -1, repeatDelay: 3,
      onUpdate: () => { el.textContent = Math.round(obj.n); },
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 10%', toggleActions: 'play pause resume pause' } });
  });
  document.querySelectorAll('[data-reveal-img]').forEach(el => gsap.to(el, {
    clipPath: 'inset(0% 0% 0% 0% round 8px)', opacity: 1, duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%' } }));
}

/* ---- 5 · Parallax ----------------------------------------------------------- */
function initParallax () {
  if (!ANIMATE) return;
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const f = parseFloat(el.dataset.parallax) || .1;
    gsap.fromTo(el, { yPercent: -f * 40 }, { yPercent: f * 40, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---- 6 · Vídeos só tocam quando aparecem ----------------------------------- */
function initVideos () {
  const io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (target.closest('[hidden]')) return;
    isIntersecting ? target.play().catch(() => {}) : target.pause();
  }), { rootMargin: '120px 0px' });
  document.querySelectorAll('video:not(.hero__video)').forEach(v => { if (!v.closest('.media-replay')) io.observe(v); });
}

/* ---- 7 · Abas genéricas (serviços, cursos, resultados) ----------------------- */
function makeTabs (buttons, panels, { onClass, offClass } = {}) {
  const select = (i, focus) => {
    buttons.forEach((b, k) => {
      const on = k === i;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      if (onClass) { b.classList.toggle(onClass, on); b.classList.toggle(offClass, !on); }
      if (on && focus) b.focus();
    });
    panels.forEach((p, k) => {
      const on = k === i; p.hidden = !on; p.classList.toggle('is-on', on);
      p.querySelectorAll('video').forEach(v => on ? v.play().catch(() => {}) : v.pause());
      if (on && ANIMATE) gsap.fromTo(p.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: 'expo.out', clearProps: 'opacity,transform' });
    });
    if (HAS_GSAP) ScrollTrigger.refresh();
  };
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); select((i + d + buttons.length) % buttons.length, true); }
    });
  });
  return select;
}

function initTabs () {
  makeTabs([...document.querySelectorAll('.svc')], [...document.querySelectorAll('.svc-panel')]);

  const cBtns = [...document.querySelectorAll('[data-course]')];
  const cSel = makeTabs(cBtns, [...document.querySelectorAll('.course')], { onClass: 'pill--dark', offClass: 'pill--line' });
  let ci = 0;
  document.querySelector('[data-course-next]')?.addEventListener('click', () => cSel(ci = (ci + 1) % cBtns.length));
  document.querySelector('[data-course-prev]')?.addEventListener('click', () => cSel(ci = (ci - 1 + cBtns.length) % cBtns.length));
  cBtns.forEach((b, i) => b.addEventListener('click', () => { ci = i; }));

  const rBtns = [...document.querySelectorAll('.results .tabs [role="tab"]')];
  makeTabs(rBtns, rBtns.map(b => document.getElementById(b.getAttribute('aria-controls'))), { onClass: 'pill--dark', offClass: 'pill--line' });
}

/* ---- 8 · Carrossel inclinado ------------------------------------------------ */
function initSkewCarousel () {
  const section = document.querySelector('.skew'); if (!section || !ANIMATE) return;
  const track = section.querySelector('.skew__track');
  const SPEED = 0.05;                 // px por ms (~50px/s), constante
  let x = 0, visible = false;
  gsap.ticker.add((t, dt) => {
    if (!visible) return;
    const half = track.scrollWidth / 2;
    x -= SPEED * dt; if (x <= -half) x += half;
    gsap.set(track, { x });
  });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px 0px' }).observe(section);
}

/* ---- 8a · Caixa de preço: seletor Iniciante / Aperfeiçoamento ------------- */
/* Troca só os textos do card; os [ ] são pendências a confirmar com a Thainá. */
const PLANS = [
  { name: 'Design de Sobrancelhas', desc: 'Pra quem está começando do zero e quer entrar na profissão com base sólida.', value: '[VALOR]', terms: 'ou [X]x no cartão', spots: 'Turma pequena · próxima: [DATA]', dur: '[DURAÇÃO]' },
  { name: 'Aperfeiçoamento em Design', desc: 'Pra quem já atende e quer elevar o nível dos resultados.', value: '[VALOR]', terms: 'ou [X]x no cartão', spots: 'Turma pequena · próxima: [DATA]', dur: '[DURAÇÃO]' },
];
function initPrice () {
  const card = document.querySelector('.price__card'); if (!card) return;
  const tabs = [...card.querySelectorAll('[data-plan]')];
  const fields = [...card.querySelectorAll('[data-f]')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    const plan = PLANS[+tab.dataset.plan];
    fields.forEach(f => { f.textContent = plan[f.dataset.f]; });
    if (HAS_GSAP && !REDUCED) gsap.fromTo(fields, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .45, stagger: .03, ease: 'power2.out' });
  }));
}

/* ---- 8b · Depoimentos: uma fala por vez ------------------------------------ */
/* Troca sozinha a cada 7s (pausa com mouse/foco; não troca com "reduzir
   movimento"). Leitor de tela só anuncia quando a pessoa escolhe pela bolinha. */
function initTestimonials () {
  const box = document.querySelector('.testi'); if (!box) return;
  const items = [...box.querySelectorAll('.testi__item')];
  const dots  = [...box.querySelectorAll('.testi__dots button')];
  const stage = box.querySelector('.testi__stage');
  let i = 0, timer = null;

  const show = (n, manual) => {
    stage.setAttribute('aria-live', manual ? 'polite' : 'off');
    items.forEach((it, k) => { it.hidden = k !== n; it.classList.toggle('is-on', k === n); });
    dots.forEach((d, k) => k === n ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
    if (ANIMATE) gsap.fromTo(items[n].children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'expo.out' });
    i = n;
  };
  const stop  = () => clearInterval(timer);
  const start = () => { stop(); if (!REDUCED) timer = setInterval(() => show((i + 1) % items.length, false), 7000); };

  dots.forEach((d, k) => d.addEventListener('click', () => { show(k, true); start(); }));
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  box.addEventListener('focusin', stop);
  box.addEventListener('focusout', start);
  start();
}

/* ---- 9 · Botões magnéticos -------------------------------------------------- */
function initMagnetic () {
  if (!ANIMATE || !FINE) return;
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    const sx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), sy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); sx((e.clientX - r.left - r.width / 2) * .3); sy((e.clientY - r.top - r.height / 2) * .3); });
    el.addEventListener('mouseleave', () => { sx(0); sy(0); });
  });
}

/* ---- 10 · Menu mobile e WhatsApp flutuante --------------------------------- */
const menu = document.getElementById('menu'), burger = document.getElementById('burger');
function openMenu () {
  menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); lenis && lenis.stop();
  if (ANIMATE) gsap.fromTo(menu, { clipPath: 'circle(0% at 40px 40px)' }, { clipPath: 'circle(150% at 40px 40px)', duration: .8, ease: 'expo.out' });
  menu.querySelector('a').focus({ preventScroll: true });
}
function closeMenu () {
  if (menu.hidden) return;
  burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start();
  const done = () => { menu.hidden = true; };
  ANIMATE ? gsap.to(menu, { clipPath: 'circle(0% at 40px 40px)', duration: .5, ease: 'expo.in', onComplete: done }) : done();
}
function initNav () {
  burger.addEventListener('click', openMenu);
  document.getElementById('menu-close').addEventListener('click', () => { closeMenu(); burger.focus(); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const wa = document.getElementById('wa');
  const onScroll = () => wa.classList.toggle('is-off', window.scrollY < window.innerHeight * .7);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ---- Vídeo dos cursos: o arquivo fica branco depois de 9,2s; volta ao início antes */
function initCourseVideo () {
  const v = document.querySelector('.courses__photo video'); if (!v) return;
  const END = 9.1;
  const tick = () => { if (v.currentTime >= END) { v.currentTime = 0; v.play(); } requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

/* ---- Vídeos de serviço: no fim aparece o botão de play pra ver de novo */
function initReplay () {
  document.querySelectorAll('.media-replay').forEach(fig => {
    const v = fig.querySelector('video'), b = fig.querySelector('.replay'); if (!v || !b) return;
    v.addEventListener('ended', () => { b.hidden = false; });
    v.addEventListener('play', () => { b.hidden = true; });
    b.addEventListener('click', () => { v.currentTime = 0; v.play(); });
    // navegador não deixa começar com som: o botão liga o áudio e recomeça do início
    const s = fig.querySelector('.sound');
    const setSound = on => { v.muted = !on; s.setAttribute('aria-pressed', String(on)); s.querySelector('span').textContent = on ? 'Som ligado' : 'Ativar som'; s.setAttribute('aria-label', on ? 'Desligar som' : 'Ativar som'); };
    if (s) s.addEventListener('click', () => {
      const on = v.muted;
      if (!on) v.dataset.userMuted = '1'; else delete v.dataset.userMuted;
      if (on) { document.querySelectorAll('.media-replay video').forEach(o => { if (o !== v && !o.muted) { o.muted = true; const ob = o.parentElement.querySelector('.sound'); ob && ob.click && (ob.setAttribute('aria-pressed','false'), ob.querySelector('span').textContent = 'Ativar som'); } });
        if (!v.dataset.heard) { v.currentTime = 0; v.dataset.heard = '1'; } v.play(); }
      setSound(on);
    });
    fig._setSound = setSound;
    // ao aparecer na tela: tenta tocar com som; se o navegador bloquear, toca mudo
    // e o som liga no primeiro toque/clique da pessoa na página
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (v.ended) return;
        if (v.dataset.userMuted) { v.play().catch(() => {}); return; }
        const others = [...document.querySelectorAll('.media-replay video')].filter(o => o !== v && !o.muted);
        if (others.length) { v.play().catch(() => {}); return; }
        v.muted = false;
        v.play().then(() => setSound(true)).catch(() => { setSound(false); v.play().catch(() => {}); window.__wantSound = fig; });
      } else { v.pause(); if (!v.muted) setSound(false); }
    }, { threshold: 0.5 }).observe(v);
  });
}

const unlockSound = e => {
  const fig = window.__wantSound; if (!fig || (e.target.closest && e.target.closest('.sound'))) return;
  const v = fig.querySelector('video'); window.__wantSound = null;
  if (v.dataset.userMuted) return;
  v.muted = false; v.play().then(() => fig._setSound(true)).catch(() => { v.muted = true; });
};
['pointerdown', 'keydown', 'touchstart'].forEach(t => document.addEventListener(t, unlockSound, { passive: true }));

/* ---- Vídeos pesados: o arquivo só é baixado quando o vídeo chega perto da tela */
function initLazyVideos () {
  const vids = document.querySelectorAll('video[data-src]');
  const load = v => { if (v.src) return; v.src = v.dataset.src; v.preload = 'auto'; if (v.hasAttribute('data-autoloop')) { v.loop = true; v.play().catch(() => {}); } };
  if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } }), { rootMargin: '300px 0px' });
  vids.forEach(v => io.observe(v));
  // o vídeo dos cursos pausa fora da tela
  document.querySelectorAll('video[data-autoloop]').forEach(v => new IntersectionObserver(([e]) => { if (!v.src) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.2 }).observe(v));
}

/* ---- Boot ------------------------------------------------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();
initNav();
initTabs();
initVideos();
// initSmoothScroll(); // desligado no refino (menos movimento)
initHero();
initReveals();
// initParallax(); // desligado no refino (menos movimento)
initSkewCarousel();
initTestimonials();
initPrice();
initLazyVideos();
initCourseVideo();
initReplay();
// initMagnetic(); // desligado no refino (menos movimento)
window.addEventListener('load', () => HAS_GSAP && ScrollTrigger.refresh());
// fotos com loading="lazy" mudam a altura da página quando chegam (mosaicos);
// recalcula os gatilhos de rolagem uma vez por rajada de carregamentos
if (HAS_GSAP) {
  let t;
  document.querySelectorAll('img[loading="lazy"]').forEach(img => img.addEventListener('load', () => {
    clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 200);
  }));
}
if (document.fonts) document.fonts.ready.then(() => HAS_GSAP && ScrollTrigger.refresh());
