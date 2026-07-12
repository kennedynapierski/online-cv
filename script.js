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
