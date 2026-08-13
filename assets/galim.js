/* ============================================================
   Galim Health — landing interactions
   - Mobile nav drawer
   - Waitlist modal (opened from any [data-gh-waitlist-open])
   - Sticky header condense on scroll
   - Package cards: accordion (collapsed to name + subtitle by default)
   - Private invitation page (/invitacion-especial)
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
      /* Delay autofocus until the opacity transition has finished. Focusing
         an input immediately triggers the mobile keyboard, which resizes the
         viewport WHILE the fixed-position panel is still mid-transition —
         iOS Safari's compositor can glitch in that window, leaving a "ghost"
         of the page behind painted through the modal. Waiting the same
         duration as the CSS transition (see .gh-modal { transition }) avoids
         the race entirely. */
      window.setTimeout(function () {
        var field = modal.querySelector('input, select, button');
        if (field) field.focus({ preventScroll: true });
      }, 300);
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

  /* Show/hide the "Please specify" field when the source dropdown is "Other" */
  var modalForm = modal ? modal.querySelector('form') : null;
  if (modalForm) {
    var sourceSelect = modalForm.querySelector('[data-gh-source]');
    var otherField = modalForm.querySelector('[data-gh-other-field]');
    var otherInput = modalForm.querySelector('[data-gh-other-input]');
    var isOtherSelected = function () {
      if (!sourceSelect) return false;
      var opt = sourceSelect.options[sourceSelect.selectedIndex];
      return !!(opt && opt.hasAttribute('data-gh-other'));
    };
    var syncOther = function () {
      if (!otherField) return;
      var show = isOtherSelected();
      otherField.hidden = !show;
      if (otherInput) {
        otherInput.required = show;
        if (show) setTimeout(function () { otherInput.focus(); }, 0);
        else otherInput.value = '';
      }
    };
    if (sourceSelect) {
      sourceSelect.addEventListener('change', syncOther);
      syncOther();
    }

    /* Pack phone + referral source into the customer note before the native form
       posts, and merge the two apellidos into Shopify's single last_name field. */
    modalForm.addEventListener('submit', function () {
      var note = modalForm.querySelector('[data-gh-note]');
      if (!note) return; // external endpoint: fields post with their own names

      /* Shopify's customer object has only one last_name, so combine
         "apellido paterno" + "apellido materno" into a hidden field. Writing to
         a hidden field (instead of mutating the visible input) keeps this
         idempotent: if the post fails and the customer submits again, the
         apellido isn't appended twice. */
      var lastName = modalForm.querySelector('[data-gh-lastname]');
      var last1 = modalForm.querySelector('[data-gh-last1]');
      var last2 = modalForm.querySelector('[data-gh-last2]');
      if (lastName) {
        lastName.value = [
          last1 ? last1.value.trim() : '',
          last2 ? last2.value.trim() : ''
        ].filter(Boolean).join(' ');
      }

      /* Age, phone and package have no home on the Shopify customer object
         either, so they ride along in the note next to the referral source. */
      var age = modalForm.querySelector('[data-gh-age]');
      var phone = modalForm.querySelector('[data-gh-phone]');
      var pkg = modalForm.querySelector('[data-gh-package]');
      var parts = ['Galim waitlist'];
      if (age && age.value) parts.push('Age: ' + age.value.trim());
      if (phone && phone.value) parts.push('Phone: ' + phone.value);
      if (pkg && pkg.value) parts.push('Package: ' + pkg.value);
      if (sourceSelect && sourceSelect.selectedIndex >= 0) {
        var label = sourceSelect.options[sourceSelect.selectedIndex].text;
        if (isOtherSelected() && otherInput && otherInput.value.trim()) {
          label = 'Other — ' + otherInput.value.trim();
        }
        parts.push('Source: ' + label);
      }
      note.value = parts.join(' · ');
    });
  }

  /* After the form posts, the page reloads — reopen the modal to show success/errors */
  if (modal && modal.querySelector('.gh-modal__success, .gh-modal__error')) {
    openModal();
  }

  /* ---- Private invitation page (/invitacion-especial) ---- */
  var invitePanel = document.querySelector('[data-gh-invite-form]');
  var inviteForm = invitePanel ? invitePanel.querySelector('form') : null;
  if (inviteForm) {
    /* Liquid can't read query strings, so the referrer's name ("Private
       Invitation by Michelle Gutierrez" on the physical card) is read from
       ?ref= client-side and both displayed and packed into the note. */
    var refName = new URLSearchParams(window.location.search).get('ref');
    if (refName) {
      var refEl = document.querySelector('[data-gh-invite-ref]');
      if (refEl) {
        refEl.textContent = 'Invitación privada de ' + refName;
        refEl.hidden = false;
      }
    }

    inviteForm.addEventListener('submit', function () {
      var note = inviteForm.querySelector('[data-gh-invite-note]');
      if (!note) return; // external endpoint: fields post with their own names

      var lastName = inviteForm.querySelector('[data-gh-invite-lastname]');
      var last1 = inviteForm.querySelector('[data-gh-invite-last1]');
      var last2 = inviteForm.querySelector('[data-gh-invite-last2]');
      if (lastName) {
        lastName.value = [
          last1 ? last1.value.trim() : '',
          last2 ? last2.value.trim() : ''
        ].filter(Boolean).join(' ');
      }

      var phone = inviteForm.querySelector('[data-gh-invite-phone]');
      var guest = inviteForm.querySelector('[data-gh-invite-guest]');
      var parts = ['Private invitation booking'];
      if (phone && phone.value) parts.push('Phone: ' + phone.value);
      if (guest && guest.value.trim()) parts.push('Guest: ' + guest.value.trim());
      if (refName) parts.push('Referred by: ' + refName);
      note.value = parts.join(' · ');
    });
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

  /* ---- Package cards: accordion ----
     Each card opens independently (no accordion-style "close the others").
     The panel's own CSS (grid-template-rows 0fr -> 1fr) does the animated
     reveal; this just flips the state that CSS reads. inert keeps the CTA
     link and everything else in a collapsed panel out of the tab order and
     off screen readers' radar — a 0-height overflow:hidden box still lets a
     browser tab focus INTO a link inside it, which would otherwise land a
     keyboard user on a button they can't see. */
  document.querySelectorAll('[data-gh-pkg-toggle]').forEach(function (toggle) {
    var panel = toggle.nextElementSibling;
    if (!panel || !panel.hasAttribute('data-gh-pkg-panel')) return;
    panel.inert = true;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      panel.inert = !open;
    });
  });

  /* ---- Floating pill header: condense + park under the announcement bar ----
     The pill is position: fixed, so it can't know how tall the announcement bar
     above it is. Measure that bar and let the pill ride up to the screen edge as
     the bar scrolls away, instead of hard-coding an offset that breaks the moment
     the announcement text wraps or gets turned off. */
  var header = document.querySelector('.gh-header');
  if (header) {
    var island = header.closest('.gh-header-section');
    var announcement = document.querySelector('.gh-announcement');
    var EDGE_GAP = 10;
    var onScroll = function () {
      header.classList.toggle('is-condensed', window.scrollY > 40);
      if (!island) return;
      var rest = announcement ? announcement.offsetHeight : 0;
      var top = Math.max(EDGE_GAP, rest + EDGE_GAP - window.scrollY);
      island.style.setProperty('--gh-hdr-top', top + 'px');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
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
        '.gh-protocols__eyebrow, .gh-protocols__h2, .gh-diag__eyebrow, .gh-diag__h2, .gh-diag__sub, .gh-axes__eyebrow, ' +
        '.gh-mq__eyebrow, .gh-mq__h2, .gh-mq__card, ' +
        '.gh-gallery__eyebrow, .gh-gallery__h2, .gh-gallery__nav, .gh-gallery__slide, ' +
        '.gh-app__text, .gh-app__media, .gh-app__btns'
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
