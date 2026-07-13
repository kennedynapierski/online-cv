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

// ---- Add prev/next scroll arrows to every non-empty carousel ----
function addCarouselControls(car) {
  if (!car.children.length) return;                 // skip empty ones
  if (car.parentNode.classList.contains('carousel-wrap')) return; // already wrapped
  const wrap = document.createElement('div');
  wrap.className = 'carousel-wrap';
  car.parentNode.insertBefore(wrap, car);
  wrap.appendChild(car);

  function makeBtn(dir, symbol) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'carousel-btn ' + dir;
    b.setAttribute('aria-label', dir === 'prev' ? 'Previous' : 'Next');
    b.textContent = symbol;
    b.addEventListener('click', () => {
      const step = Math.max(car.clientWidth * 0.85, 260);
      car.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
    });
    wrap.appendChild(b);
    return b;
  }
  const prev = makeBtn('prev', '‹');
  const next = makeBtn('next', '›');

  function update() {
    prev.disabled = car.scrollLeft <= 2;
    next.disabled = car.scrollLeft + car.clientWidth >= car.scrollWidth - 2;
  }
  car.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
// run now, and again shortly after in case images/data-seq finished loading and changed widths
document.querySelectorAll('.carousel').forEach(addCarouselControls);
window.addEventListener('load', () => document.querySelectorAll('.carousel').forEach(addCarouselControls));

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

  // delegated click so it also works for images added dynamically
  document.addEventListener('click', function (e) {
    const im = e.target.closest('.carousel img');
    if (!im) return;
    const imgs = Array.prototype.slice.call(im.closest('.carousel').querySelectorAll('img'));
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
