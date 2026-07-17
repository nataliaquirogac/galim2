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

  /* Pack phone + referral source into the customer note before the native form posts */
  var modalForm = modal ? modal.querySelector('form') : null;
  if (modalForm) {
    modalForm.addEventListener('submit', function () {
      var note = modalForm.querySelector('[data-gh-note]');
      if (!note) return; // external endpoint: fields post with their own names
      var phone = modalForm.querySelector('[data-gh-phone]');
      var source = modalForm.querySelector('[data-gh-source]');
      var parts = ['Galim waitlist'];
      if (phone && phone.value) parts.push('Phone: ' + phone.value);
      if (source && source.selectedIndex >= 0) {
        parts.push('Source: ' + source.options[source.selectedIndex].text);
      }
      note.value = parts.join(' · ');
    });
  }

  /* After the form posts, the page reloads — reopen the modal to show success/errors */
  if (modal && modal.querySelector('.gh-modal__success, .gh-modal__error')) {
    openModal();
  }

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

  /* ---- Carousels: swipe + interactive scrubber + prev/next buttons ---- */
  document.querySelectorAll('[data-gh-carousel]').forEach(function (viewport) {
    var section = viewport.closest('section');
    var track = viewport.querySelector('[data-gh-track]');
    if (!track || !section) return;
    var bar = section.querySelector('[data-gh-progress]');
    var thumb = section.querySelector('[data-gh-thumb]');
    var scrubber = section.querySelector('[data-gh-scrubber]');
    var prev = section.querySelector('[data-gh-nav="prev"]');
    var next = section.querySelector('[data-gh-nav="next"]');
    var count = section.querySelector('[data-gh-count]');
    var cards = track.querySelectorAll('.gh-mq__card');

    function maxScroll() { return track.scrollWidth - track.clientWidth; }

    function updateCount(pct) {
      if (!count || !cards.length) return;
      var idx = Math.min(cards.length, Math.round(pct * (cards.length - 1)) + 1);
      count.textContent = (idx < 10 ? '0' : '') + idx;
    }

    function update() {
      var max = maxScroll();
      if (max <= 1) {
        if (bar) { bar.style.width = '100%'; bar.classList.add('is-end'); }
        if (thumb) thumb.style.left = '100%';
        if (scrubber) scrubber.setAttribute('aria-valuenow', 100);
        if (prev) prev.disabled = true;
        if (next) next.disabled = true;
        updateCount(1);
        return;
      }
      var pct = Math.max(0, Math.min(1, track.scrollLeft / max));
      if (bar) {
        bar.style.width = (pct * 100) + '%';
        bar.classList.toggle('is-end', pct >= 0.995);
      }
      if (thumb) thumb.style.left = (pct * 100) + '%';
      if (scrubber) scrubber.setAttribute('aria-valuenow', Math.round(pct * 100));
      if (prev) prev.disabled = pct <= 0.005;
      if (next) next.disabled = pct >= 0.995;
      updateCount(pct);
    }

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    /* Prev/next: scroll by one card width (first card as reference) */
    function step(dir) {
      var card = track.querySelector('.gh-mq__card');
      var by = card ? card.getBoundingClientRect().width + 10 : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * by, behavior: 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    /* Interactive scrubber: click/drag to jump */
    if (scrubber) {
      var dragging = false;
      function seekFromEvent(e) {
        var rect = scrubber.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        var max = maxScroll();
        track.scrollLeft = pct * max;
      }
      scrubber.addEventListener('pointerdown', function (e) {
        dragging = true;
        scrubber.classList.add('is-dragging');
        scrubber.setPointerCapture(e.pointerId);
        seekFromEvent(e);
      });
      scrubber.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        seekFromEvent(e);
      });
      var release = function (e) {
        dragging = false;
        scrubber.classList.remove('is-dragging');
        if (e && scrubber.hasPointerCapture && e.pointerId != null && scrubber.hasPointerCapture(e.pointerId)) {
          scrubber.releasePointerCapture(e.pointerId);
        }
      };
      scrubber.addEventListener('pointerup', release);
      scrubber.addEventListener('pointercancel', release);
      /* Keyboard: arrow keys move by one card, Home/End to extremes */
      scrubber.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1);
        } else if (e.key === 'Home') {
          e.preventDefault(); track.scrollTo({ left: 0, behavior: 'smooth' });
        } else if (e.key === 'End') {
          e.preventDefault(); track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
        }
      });
    }

    update();
  });

  /* ---- Reveal on scroll ----
     Rect-based instead of IntersectionObserver: IO callbacks are throttled or
     suspended in some embedded/background webviews, which would leave content
     stuck at opacity 0. A scroll+rAF rect check degrades safely everywhere. */
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.Shopify && window.Shopify.designMode) return;

    var els = Array.prototype.slice.call(
      document.querySelectorAll(
        '.gh-gap .gh-container, .gh-steps .gh-container, .gh-method__inner, .gh-cta__inner, ' +
        '.gh-axes__card, .gh-axes__bq, .gh-pkg, .gh-glp, .gh-diag__row, ' +
        '.gh-protocols__eyebrow, .gh-protocols__h2, .gh-diag__eyebrow, .gh-diag__h2, .gh-diag__sub, .gh-axes__eyebrow'
      )
    );
    if (!els.length) return;

    var counts = [];
    els.forEach(function (el) {
      var entry = null;
      for (var i = 0; i < counts.length; i++) {
        if (counts[i].parent === el.parentNode) { entry = counts[i]; break; }
      }
      if (!entry) { entry = { parent: el.parentNode, n: 0 }; counts.push(entry); }
      el.classList.add('gh-reveal');
      el.style.transitionDelay = Math.min(entry.n * 90, 450) + 'ms';
      entry.n++;
    });

    var pending = els.slice();

    function check() {
      if (!pending.length) return;
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add('is-visible');
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
      }
    }

    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    check();
  })();
})();
