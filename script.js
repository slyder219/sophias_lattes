const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');

const defaultLinks = {
  orderMarketplace: 'https://www.facebook.com/marketplace/',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  contactEmail: 'sophlyde@gmail.com'
};

let siteLinks = { ...defaultLinks };

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const slideData = [
  {
    src: 'assets/slideshow/mug-table.jpg',
    alt: 'Latte mug on a table',
    caption: 'Dorm-room roots, cafe-level care.'
  },
  {
    src: 'assets/slideshow/matcha-outside.jpg',
    alt: 'Iced matcha outside',
    caption: 'Fresh ideas inspired by campus energy.'
  },
  {
    src: 'assets/slideshow/latte-chocholate.jpg',
    alt: 'Chocolate latte close-up',
    caption: 'Crafted for simple daily joy.'
  }
];

const slidesHost = document.querySelector('.slides');
const dotsHost = document.querySelector('.slide-dots');
const prevBtn = document.querySelector('.slide-btn.prev');
const nextBtn = document.querySelector('.slide-btn.next');

let currentIndex = 0;
let autoTimer = null;
const AUTO_DELAY = 4200;

function renderSlides() {
  if (!slidesHost || !dotsHost) return;

  slidesHost.innerHTML = '';
  dotsHost.innerHTML = '';

  slideData.forEach((slide, idx) => {
    const figure = document.createElement('figure');
    figure.className = `slide${idx === 0 ? ' is-active' : ''}`;

    const image = document.createElement('img');
    image.src = slide.src;
    image.alt = slide.alt;
    image.loading = idx === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';

    const caption = document.createElement('figcaption');
    caption.textContent = slide.caption;

    figure.append(image, caption);
    slidesHost.appendChild(figure);

    const dot = document.createElement('button');
    dot.className = 'slide-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => {
      goToSlide(idx);
      restartAutoPlay();
    });
    dotsHost.appendChild(dot);
  });
}

function updateSlideState() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slide-dot');

  slides.forEach((slide, idx) => {
    slide.classList.toggle('is-active', idx === currentIndex);
  });

  dots.forEach((dot, idx) => {
    dot.setAttribute('aria-current', idx === currentIndex ? 'true' : 'false');
  });
}

function goToSlide(index) {
  currentIndex = (index + slideData.length) % slideData.length;
  updateSlideState();
}

function nextSlide() {
  goToSlide(currentIndex + 1);
}

function prevSlide() {
  goToSlide(currentIndex - 1);
}

function startAutoPlay() {
  stopAutoPlay();
  autoTimer = setInterval(nextSlide, AUTO_DELAY);
}

function stopAutoPlay() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function restartAutoPlay() {
  startAutoPlay();
}

function setupSwipe() {
  const root = document.querySelector('.slideshow');
  if (!root) return;

  let touchStartX = 0;

  root.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  root.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) < 40) return;

    if (deltaX < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
    restartAutoPlay();
  }, { passive: true });
}

function initSlideshow() {
  if (!slidesHost || !dotsHost || !prevBtn || !nextBtn || slideData.length === 0) return;

  renderSlides();
  updateSlideState();
  startAutoPlay();
  setupSwipe();

  prevBtn.addEventListener('click', () => {
    prevSlide();
    restartAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
    restartAutoPlay();
  });

  const root = document.querySelector('.slideshow');
  if (root) {
    root.addEventListener('mouseenter', stopAutoPlay);
    root.addEventListener('mouseleave', startAutoPlay);
    root.addEventListener('focusin', stopAutoPlay);
    root.addEventListener('focusout', startAutoPlay);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });
}

function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const contactEmail = siteLinks.contactEmail || defaultLinks.contactEmail;

    const subject = encodeURIComponent(`Sophia's Lattes Contact - ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  });
}

function applyLinkConfig() {
  const anchors = document.querySelectorAll('a[data-link-key]');

  anchors.forEach((anchor) => {
    const key = anchor.getAttribute('data-link-key');
    if (!key) return;

    const value = siteLinks[key];
    if (!value) return;

    const linkType = anchor.getAttribute('data-link-type');
    if (linkType === 'email') {
      anchor.href = `mailto:${value}`;
      if (anchor.getAttribute('data-link-text') === 'email-address') {
        anchor.textContent = value;
      }
      return;
    }

    anchor.href = value;
  });
}

async function loadLinkConfig() {
  try {
    const response = await fetch('links.json', { cache: 'no-store' });
    if (!response.ok) return;

    const incoming = await response.json();
    if (!incoming || typeof incoming !== 'object') return;

    siteLinks = {
      ...defaultLinks,
      ...Object.fromEntries(
        Object.entries(incoming).filter((entry) => typeof entry[1] === 'string' && entry[1].trim() !== '')
      )
    };
  } catch {
    siteLinks = { ...defaultLinks };
  }
}

function initFooterYear() {
  const yearNode = document.querySelector('#year');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

async function initSite() {
  await loadLinkConfig();
  applyLinkConfig();
  initSlideshow();
  initContactForm();
  initFooterYear();
}

initSite();
