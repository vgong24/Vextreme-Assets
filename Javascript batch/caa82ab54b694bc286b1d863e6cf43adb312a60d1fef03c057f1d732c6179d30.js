/**
 * components/section-toggle.js
 *
 * Section expand/collapse toggle for the archives page.
 * Previously inlined at the bottom of archives.html.
 *
 * RESPONSIBILITY:
 *   Toggle .collapsed state on .section-body elements,
 *   animate max-height, persist state to localStorage.
 *
 * DATA CONTRACT:
 *   Pass an array of section IDs to init(), or let it
 *   auto-discover by reading window.VEXTREME_SECTIONS if set.
 *
 * USAGE (archives page, after DOM is ready):
 *
 *   // Option A — explicit IDs:
 *   window.VEXTREME_SECTIONS = [
 *     'vex-archive-convos',
 *     'vex-archive-victors-record',
 *     'vex-archive-records',
 *     ...
 *   ];
 *
 *   // Option B — auto-discover from [data-section] attributes:
 *   // (no config needed — just include this script)
 *
 * HTML STRUCTURE expected:
 *   <div class="section-header" data-section="my-section-id">
 *     ...
 *     <span class="toggle-chevron">▾</span>
 *   </div>
 *   <div class="section-body" id="my-section-id">
 *     ...
 *   </div>
 *
 * CSS classes used (defined in styles/design-system.css):
 *   .section-header.collapsed  → rotates chevron
 *   .section-body.collapsed    → max-height: 0, opacity: 0
 */

(function () {
  'use strict';

  var STORAGE_PREFIX = 'vex-section-';

  function getSectionIds() {
    // Prefer explicit list if provided
    if (window.VEXTREME_SECTIONS && window.VEXTREME_SECTIONS.length) {
      return window.VEXTREME_SECTIONS;
    }
    // Auto-discover from [data-section] attributes
    var headers = document.querySelectorAll('[data-section]');
    return Array.prototype.slice.call(headers).map(function (el) {
      return el.getAttribute('data-section');
    });
  }

  function initSection(id) {
    var header = document.querySelector('[data-section="' + id + '"]');
    var body   = document.getElementById(id);
    if (!header || !body) return;

    // Disable transitions during initial state restore
    body.style.transition = 'none';
    body.style.maxHeight  = '';
    body.style.opacity    = '';

    var saved = localStorage.getItem(STORAGE_PREFIX + id);
    if (saved === 'collapsed') {
      header.classList.add('collapsed');
      body.classList.add('collapsed');
      body.style.maxHeight = '0';
      body.style.opacity   = '0';
    }

    // Re-enable transitions after paint
    requestAnimationFrame(function () {
      body.style.transition = '';
    });

    header.addEventListener('click', function () {
      var isCollapsed = body.classList.contains('collapsed');

      if (isCollapsed) {
        // Expand
        body.classList.remove('collapsed');
        header.classList.remove('collapsed');
        body.style.maxHeight = body.scrollHeight + 'px';
        body.style.opacity   = '1';
        localStorage.setItem(STORAGE_PREFIX + id, 'open');

        // After transition, allow max-height to be fluid again
        setTimeout(function () {
          body.style.maxHeight = '';
        }, 360);
      } else {
        // Collapse — needs two rAF frames to trigger CSS transition
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            body.classList.add('collapsed');
            header.classList.add('collapsed');
            body.style.maxHeight = '0';
            body.style.opacity   = '0';
            localStorage.setItem(STORAGE_PREFIX + id, 'collapsed');
          });
        });
      }
    });
  }

  function init() {
    // Guard against double-init
    if (window._vexSectionToggleInit) return;
    window._vexSectionToggleInit = true;

    getSectionIds().forEach(initSection);
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

}());
