const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');

const defaultLinks = {
  orderMarketplace: 'https://www.facebook.com/marketplace/',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  contactEmail: 'sophlyde@gmail.com',
  cashapp: 'https://cash.app/$$Sophiaslattes'
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

const defaultSlides = [
  {
    src: 'assets/slideshow/IMG_0993.avif',
    alt: 'Sophia\'s Lattes gallery image',
    caption: 'A fresh Sophia\'s Lattes moment.'
  },
  {
    src: 'assets/slideshow/5D9DD774-FEC9-4F41-B24D-84F2E0B277CC.avif',
    alt: 'Sophia\'s Lattes gallery image',
    caption: 'Simple drinks, made with care.'
  },
  {
    src: 'assets/slideshow/2513C594-46B6-4542-9397-69A5CA0F0C0B.avif',
    alt: 'Sophia\'s Lattes gallery image',
    caption: 'Campus coffee energy, bottled into every cup.'
  }
];

const slideData = [];
const SLIDESHOW_PATH = 'slideshow.json';

const slidesHost = document.querySelector('.slides');
const dotsHost = document.querySelector('.slide-dots');
const prevBtn = document.querySelector('.slide-btn.prev');
const nextBtn = document.querySelector('.slide-btn.next');
const menuGrid = document.querySelector('[data-menu-grid]');
const menuStatus = document.querySelector('[data-menu-status]');

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
    image.alt = slide.alt;
    image.dataset.src = slide.src;
    image.loading = idx === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (idx === 0) {
      image.src = slide.src;
      image.fetchPriority = 'high';
    }

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

function ensureSlideImage(index) {
  const slides = document.querySelectorAll('.slide');
  const slide = slides[index];
  if (!slide) return;

  const image = slide.querySelector('img');
  if (!(image instanceof HTMLImageElement)) return;
  if (image.src) return;

  const src = image.dataset.src;
  if (!src) return;

  image.src = src;
}

function preloadNearbySlides(index) {
  if (slideData.length < 2) return;

  ensureSlideImage(index);
  ensureSlideImage((index + 1) % slideData.length);
}

function updateSlideState(preloadAdjacent = false) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slide-dot');

  ensureSlideImage(currentIndex);

  slides.forEach((slide, idx) => {
    slide.classList.toggle('is-active', idx === currentIndex);
  });

  dots.forEach((dot, idx) => {
    dot.setAttribute('aria-current', idx === currentIndex ? 'true' : 'false');
  });

  if (preloadAdjacent) {
    preloadNearbySlides(currentIndex);
  }
}

function goToSlide(index) {
  currentIndex = (index + slideData.length) % slideData.length;
  updateSlideState(true);
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

function getCashappCashtag(value) {
  const cleaned = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const marker = 'cash.app/';
  const markerIndex = cleaned.indexOf(marker);
  if (markerIndex === -1) return cleaned;

  const cashappPath = cleaned.slice(markerIndex + marker.length).replace(/^\$+/, '');
  return cashappPath ? `$${cashappPath}` : cleaned;
}

function applyLinkConfig() {
  const linkNodes = document.querySelectorAll('[data-link-key]');

  linkNodes.forEach((node) => {
    const key = node.getAttribute('data-link-key');
    if (!key) return;

    const value = siteLinks[key];
    if (!value) return;

    const linkTextType = node.getAttribute('data-link-text');

    if (node instanceof HTMLAnchorElement) {
      const linkType = node.getAttribute('data-link-type');
      if (linkType === 'email') {
        node.href = `mailto:${value}`;
        if (linkTextType === 'email-address') {
          node.textContent = value;
        }
        return;
      }

      node.href = value;
      if (linkTextType === 'url-without-protocol') {
        node.textContent = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
      } else if (linkTextType === 'cashapp-cashtag') {
        node.textContent = getCashappCashtag(value);
      }
      return;
    }

    if (linkTextType === 'cashapp-cashtag') {
      node.textContent = getCashappCashtag(value);
    } else if (linkTextType === 'url-without-protocol') {
      node.textContent = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
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

function normalizeSlides(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.slides)) {
    return [];
  }

  return raw.slides
    .filter((slide) => slide && typeof slide === 'object' && typeof slide.src === 'string' && slide.src.trim() !== '')
    .map((slide, index) => ({
      src: slide.src.trim(),
      alt: typeof slide.alt === 'string' && slide.alt.trim() !== '' ? slide.alt.trim() : `Gallery image ${index + 1}`,
      caption: typeof slide.caption === 'string' && slide.caption.trim() !== '' ? slide.caption.trim() : ''
    }));
}

async function loadSlides() {
  try {
    const response = await fetch(SLIDESHOW_PATH, { cache: 'no-store' });
    if (!response.ok) return defaultSlides;

    const data = await response.json();
    const slides = normalizeSlides(data);
    return slides.length > 0 ? slides : defaultSlides;
  } catch {
    return defaultSlides;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function formatPrice(price) {
  if (typeof price === 'number' && Number.isFinite(price)) {
    return `$${price.toFixed(2)}`;
  }

  if (isNonEmptyString(price)) {
    return price.trim();
  }

  return '';
}

function normalizeMenuData(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.menu)) {
    return [];
  }

  return raw.menu
    .filter((group) => group && typeof group === 'object')
    .map((group) => {
      const title = isNonEmptyString(group.group) ? group.group.trim() : '';
      const items = Array.isArray(group.items) ? group.items : [];

      return {
        title,
        items: items
          .filter((item) => item && typeof item === 'object' && isNonEmptyString(item.name))
          .map((item) => ({
            name: item.name.trim(),
            description: isNonEmptyString(item.description) ? item.description.trim() : '',
            price: formatPrice(item.price)
          }))
      };
    })
    .filter((group) => group.title !== '' && group.items.length > 0);
}

function renderMenu(groups) {
  if (!menuGrid) return;

  menuGrid.innerHTML = '';

  if (groups.length === 0) {
    if (menuStatus) menuStatus.hidden = false;
    return;
  }

  if (menuStatus) menuStatus.hidden = true;

  groups.forEach((group) => {
    const card = document.createElement('article');
    card.className = 'menu-card menu-group-card';

    const heading = document.createElement('h3');
    heading.textContent = group.title;

    const itemList = document.createElement('ul');
    itemList.className = 'menu-item-list';

    group.items.forEach((item) => {
      const itemRow = document.createElement('li');
      itemRow.className = 'menu-item';

      const header = document.createElement('div');
      header.className = 'menu-item-header';

      const name = document.createElement('span');
      name.className = 'menu-item-name';
      name.textContent = item.name;
      header.appendChild(name);

      if (item.price) {
        const price = document.createElement('span');
        price.className = 'menu-item-price';
        price.textContent = item.price;
        header.appendChild(price);
      }

      itemRow.appendChild(header);

      if (item.description) {
        const description = document.createElement('p');
        description.className = 'menu-item-description';
        description.textContent = item.description;
        itemRow.appendChild(description);
      }

      itemList.appendChild(itemRow);
    });

    card.append(heading, itemList);
    menuGrid.appendChild(card);
  });
}

async function loadMenuConfig() {
  try {
    const response = await fetch('menu.json', { cache: 'no-store' });
    if (!response.ok) {
      return [];
    }

    const incoming = await response.json();
    return normalizeMenuData(incoming);
  } catch {
    return [];
  }
}

async function initMenu() {
  if (!menuGrid) return;
  const groups = await loadMenuConfig();
  renderMenu(groups);
}

async function initSite() {
  await loadLinkConfig();
  applyLinkConfig();
  const loadedSlides = await loadSlides();
  slideData.splice(0, slideData.length, ...loadedSlides);
  await initMenu();
  initSlideshow();
  initContactForm();
  initFooterYear();
}

initSite();
