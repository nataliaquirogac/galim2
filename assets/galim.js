/* ============================================================
   Galim Health — landing interactions
   - Mobile nav drawer
   - Waitlist modal (opened from any [data-gh-waitlist-open])
   - Sticky header condense on scroll
   ============================================================ */
(function () {
  'use strict';

  /* ---- Waitlist modal ---- */
  var modal = document.getElementById('gh-waitlist-modal');
  var lastFocused = null;

  function openModal() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var field = modal.querySelector('input, select, button');
      if (field) field.focus();
    });
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    window.setTimeout(function () {
      modal.hidden = true;
    }, 250);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-gh-waitlist-open]');
    if (opener) {
      e.preventDefault();
      openModal();
      return;
    }
    if (e.target.closest('[data-gh-waitlist-close]')) {
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  /* ---- Mobile nav drawer ---- */
  var drawer = document.getElementById('gh-drawer');

  function toggleDrawer(force) {
    if (!drawer) return;
    var open = typeof force === 'boolean' ? force : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', open);
    drawer.hidden = !open;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    var burger = document.querySelector('[data-gh-drawer-toggle]');
    if (burger) burger.setAttribute('aria-expanded', String(open));
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-gh-drawer-toggle]')) {
      e.preventDefault();
      toggleDrawer();
      return;
    }
    if (e.target.closest('[data-gh-drawer-close]')) {
      e.preventDefault();
      toggleDrawer(false);
    }
  });

  /* ---- Sticky header condense ---- */
  var header = document.querySelector('.gh-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-condensed', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
