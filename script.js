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
