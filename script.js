/**
 * FrontVisual — Переключение темы и интерактивность
 */

// Регистрируем отдельные игры-страницы (не через game.html)
window.gamesRegistry = window.gamesRegistry || {};
window.gamesRegistry.forest = window.gamesRegistry.forest || {
  id: 'forest',
  title: 'Forest',
  description: 'Выживи в тёмном лесу и выберись наружу.',
  genre: 'Хоррор',
  difficulty: 'Сложная',
  shortcode: 'FOREST',
  url: 'forest.html'
};

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initSmoothScroll();
  initScrollAnimations();
  initHeroParallax();
  initHeaderScroll();
  initMouseParallax();
  initClickRipples();
  initGamesCatalog();
});

/**
 * Мобильное меню
 */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  function closeNav() {
    nav?.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.getElementById('navOverlay')?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.documentElement.classList.remove('nav-locked');
  }

  toggle?.addEventListener('click', () => {
    const isOpen = !nav.classList.contains('nav-open');
    nav.classList.toggle('nav-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    document.getElementById('navOverlay')?.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    document.documentElement.classList.toggle('nav-locked', isOpen);
  });

  document.getElementById('navOverlay')?.addEventListener('click', closeNav);

  nav?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
  });
}

/**
 * Инициализация переключателя светлой/тёмной темы
 */
function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  // Загрузка сохранённой темы
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  } else {
    // Определение системной темы
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    
    // Небольшая анимация нажатия
    toggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
      toggle.style.transform = '';
    }, 150);
  });
}

/**
 * Плавная прокрутка по якорным ссылкам
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Анимация появления при скролле
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Наблюдаем за карточками и секциями
  document.querySelectorAll('.feature-card, .about-content').forEach(el => {
    el.classList.add('reveal-on-scroll');
    observer.observe(el);
  });
}

/**
 * Лёгкий параллакс и "дыхание" hero‑карточки при скролле
 */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const heroVisual = document.querySelector('.hero-visual');
  const heroCard = document.querySelector('.hero-card');

  if (!hero || !heroVisual || !heroCard) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  // Добавим лёгкое "дыхание" через scale поверх существующего свечения
  heroCard.style.transformOrigin = 'center center';

  function update() {
    const rect = hero.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    // Нормализованный прогресс секции hero в пределах видимой области [-1, 1]
    const centerOffset = (rect.top + rect.height / 2) - viewportHeight / 2;
    const normalized = Math.max(-1, Math.min(1, centerOffset / viewportHeight));

    const translateY = normalized * -20; // чуть поднимается при прокрутке
    const subtleScale = 1 + Math.max(-0.01, Math.min(0.02, -normalized * 0.02));

    heroVisual.style.transform = `translateY(${translateY}px)`;
    heroCard.style.transform = `scale(${subtleScale})`;

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  });

  // Первичная инициализация
  update();
}

/**
 * Компактная шапка при прокрутке
 */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  function onScroll() {
    const scrolled = window.scrollY > 16;
    header.classList.toggle('header-scrolled', scrolled);
  }

  window.addEventListener('scroll', onScroll);
  onScroll();
}

/**
 * Параллакс фоновых орбов от движения мыши
 */
function initMouseParallax() {
  const orbWraps = document.querySelectorAll('.glow-orb-wrap');
  const gridPattern = document.getElementById('gridPattern');

  let mouseX = 0.5, mouseY = 0.5;
  let currentX = 0.5, currentY = 0.5;
  const ease = 0.03;

  // Множители для каждого орба (разное направление/сила реакции)
  const orbFactors = [
    { x: 80, y: 60 },   // orb 1 — верхний правый
    { x: -100, y: 80 }, // orb 2 — нижний левый
    { x: 120, y: -60 }, // orb 3 — центр
    { x: -80, y: -100 } // orb 4 — нижний правый
  ];

  function updateMouse(x, y) {
    mouseX = x / window.innerWidth;
    mouseY = y / window.innerHeight;
  }

  document.addEventListener('mousemove', (e) => updateMouse(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
  });

  function animate() {
    currentX += (mouseX - 0.5 - currentX + 0.5) * ease;
    currentY += (mouseY - 0.5 - currentY + 0.5) * ease;

    const offsetX = (currentX - 0.5) * 2;
    const offsetY = (currentY - 0.5) * 2;

    orbWraps.forEach((wrap, i) => {
      const f = orbFactors[i] || { x: 50, y: 50 };
      const tx = offsetX * f.x;
      const ty = offsetY * f.y;
      wrap.style.transform = `translate(${tx}px, ${ty}px)`;
    });

    // Лёгкое смещение сетки
    if (gridPattern) {
      const gridX = offsetX * 15;
      const gridY = offsetY * 15;
      gridPattern.style.transform = `translate(${gridX}px, ${gridY}px)`;
    }

    requestAnimationFrame(animate);
  }
  animate();
}

/**
 * Всплески при клике
 */
function initClickRipples() {
  const container = document.getElementById('clickRipples');
  const orbs = document.querySelectorAll('.glow-orb');

  function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 900);

    orbs.forEach((orb) => {
      orb.classList.add('orb-click-pulse');
      setTimeout(() => orb.classList.remove('orb-click-pulse'), 600);
    });
  }

  document.addEventListener('click', (e) => createRipple(e.clientX, e.clientY));
  document.addEventListener('touchend', (e) => {
    if (e.changedTouches.length) {
      const t = e.changedTouches[0];
      createRipple(t.clientX, t.clientY);
    }
  });
}

/**
 * Каталог игр на главной странице.
 * Читает описание игр из window.gamesRegistry и создаёт кликабельные карточки,
 * которые ведут на страницу полноэкранного запуска.
 */
function initGamesCatalog() {
  const listEl = document.getElementById('gamesList');

  if (!listEl) {
    return;
  }

  const registry = window.gamesRegistry || {};
  const games = Object.values(registry);
  if (!games.length) {
    return;
  }

  // Создаём карточки игр
  games.forEach(game => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'game-card glow-card';
    card.dataset.gameId = game.id;
    card.dataset.shortcode = game.shortcode || game.id.toUpperCase();

    card.innerHTML = `
      <div class="game-card-title">${game.title}</div>
      <div class="game-card-desc">${game.description || ''}</div>
      <div class="game-card-meta">
        <span class="game-card-tag">${game.genre || 'Аркада'}</span>
        <span class="game-card-tag">Сложность: ${game.difficulty || 'Средняя'}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      const targetUrl = game.url || `game.html?game=${encodeURIComponent(game.id)}`;
      window.location.href = targetUrl;
    });

    listEl.appendChild(card);
  });
}
