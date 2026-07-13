// Sticky nav shadow on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const navmenu = document.getElementById('navmenu');
menuBtn.addEventListener('click', () => navmenu.classList.toggle('open'));
navmenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navmenu.classList.remove('open'))
);

// Reveal sections on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---- Auto-fill galleries and carousels from images in a subfolder ----
// A container with data-seq="images/little-mermaid" loads
//   images/little-mermaid/1.jpg, images/little-mermaid/2.jpg, ... until one is missing.
// Supports .jpg, .jpeg, .png. Empty containers stay hidden (see CSS :empty).
// Just drop photos in the matching subfolder named 1, 2, 3, ... (no gaps).
function loadSequence(container) {
  const base = container.getAttribute('data-seq');
  const alt = container.getAttribute('data-alt') || '';
  const exts = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
  let index = 1;
  function tryLoad(extIdx) {
    const probe = new Image();
    probe.onload = () => {
      const img = document.createElement('img');
      img.src = probe.src;
      img.alt = alt;
      img.loading = 'lazy';
      container.appendChild(img);
      index++;
      tryLoad(0);
    };
    probe.onerror = () => {
      if (extIdx < exts.length - 1) {
        tryLoad(extIdx + 1);
      } else if (container.children.length === 0 && container.hasAttribute('data-hide-section-when-empty')) {
        // No images found at all — hide the whole section so there's no empty band.
        const section = container.closest('section');
        if (section) section.style.display = 'none';
      }
      // else: reached the end of this sequence -> stop.
    };
    probe.src = base + '/' + index + '.' + exts[extIdx];
  }
  tryLoad(0);
}
document.querySelectorAll('[data-seq]').forEach(loadSequence);

// ---- Build a viewer + thumbnail rail for each non-empty carousel ----
function initCarousel(car) {
  const imgs = Array.prototype.slice.call(car.querySelectorAll('img'));
  if (!imgs.length || car.dataset.slideReady) return;
  car.dataset.slideReady = '1';
  let idx = 0;

  // main stage: move the images in and show the first
  const stage = document.createElement('div');
  stage.className = 'carousel-stage';
  imgs.forEach(function (im, i) { stage.appendChild(im); im.classList.toggle('active', i === 0); });

  const bg = document.createElement('div');
  bg.className = 'stage-bg';
  bg.style.backgroundImage = 'url("' + imgs[0].src + '")';
  stage.appendChild(bg);

  const count = document.createElement('div');
  count.className = 'carousel-count';
  count.textContent = '1 / ' + imgs.length;
  stage.appendChild(count);
  car.appendChild(stage);

  const thumbBtns = [];

  function show(i) {
    imgs[idx].classList.remove('active');
    if (thumbBtns[idx]) thumbBtns[idx].classList.remove('active');
    idx = (i + imgs.length) % imgs.length;
    imgs[idx].classList.add('active');
    bg.style.backgroundImage = 'url("' + imgs[idx].src + '")';
    count.textContent = (idx + 1) + ' / ' + imgs.length;
    if (thumbBtns[idx]) {
      thumbBtns[idx].classList.add('active');
      const t = thumbBtns[idx];
      thumbs.scrollTo({ left: t.offsetLeft - thumbs.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' });
    }
  }

  var thumbs = null;
  if (imgs.length > 1) {
    const prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'carousel-btn prev';
    prev.textContent = '‹'; prev.setAttribute('aria-label', 'Previous');
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'carousel-btn next';
    next.textContent = '›'; next.setAttribute('aria-label', 'Next');
    stage.appendChild(prev);
    stage.appendChild(next);
    prev.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });

    // thumbnail rail
    thumbs = document.createElement('div');
    thumbs.className = 'carousel-thumbs';
    imgs.forEach(function (im, i) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'View photo ' + (i + 1));
      const t = document.createElement('img');
      t.src = im.src; t.alt = ''; t.loading = 'lazy';
      b.appendChild(t);
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { show(i); });
      thumbs.appendChild(b);
      thumbBtns.push(b);
    });
    car.appendChild(thumbs);
  } else {
    count.style.display = 'none';
  }
}
document.querySelectorAll('.carousel').forEach(initCarousel);
window.addEventListener('load', () => document.querySelectorAll('.carousel').forEach(initCarousel));

// ---- Lightbox: click any carousel photo to view it full size ----
(function () {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close">×</button>' +
    '<button class="lb-nav lb-prev" aria-label="Previous">‹</button>' +
    '<img alt="">' +
    '<button class="lb-nav lb-next" aria-label="Next">›</button>' +
    '<div class="lb-count"></div>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');
  const lbCount = lb.querySelector('.lb-count');
  let group = [], idx = 0;

  function render() {
    lbImg.src = group[idx].currentSrc || group[idx].src;
    lbCount.textContent = (idx + 1) + ' / ' + group.length;
  }
  function open(imgs, i) {
    group = imgs; idx = i; render();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  function step(d) { idx = (idx + d + group.length) % group.length; render(); }

  // delegated click: only the big stage image opens the lightbox (thumbnails just switch)
  document.addEventListener('click', function (e) {
    const im = e.target.closest('.carousel-stage img');
    if (!im) return;
    const imgs = Array.prototype.slice.call(im.closest('.carousel-stage').querySelectorAll('img'));
    open(imgs, imgs.indexOf(im));
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImg) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
