/**
 * components/bc-nav.js
 *
 * BC Nav — the simple shape-coded navigation component.
 * Entirely separate from the VEXTREME arc system.
 *
 * RESPONSIBILITY:
 *   Reads window.bcNavConfig.pages, renders shape + title links
 *   into #bcNavContainer.
 *
 * DATA CONTRACT — window.bcNavConfig:
 * {
 *   pages: [
 *     { slug: '/some-page', title: 'Page Title', level: 1 },
 *     ...
 *   ]
 * }
 *
 * LEVELS → SHAPES:
 *   1 → ●   (top-level)
 *   2 → ■
 *   3 → ▲
 *   4 → ◆
 *   5 → ⬟
 *   6 → ⬢
 *   7 → –   (fallback / leaf)
 *
 * ACTIVE STATE:
 *   A page is active when page.slug === window.location.pathname
 *   Adds class 'active' to the link element.
 *
 * CSS CLASSES RENDERED:
 *   .bc-nav-item         — every link
 *   .bc-level-{n}        — level-specific indent/style hook
 *   .active              — current page
 *   .bc-nav-shape        — the shape glyph span
 *   .bc-nav-title        — the title span
 *
 * NOTE:
 *   Styles for bc-nav live in styles/bc-nav.css (not yet created —
 *   add when porting the Squarespace CSS for this component).
 */

(function () {
  'use strict';

  var SHAPES = {
    1: '●',
    2: '■',
    3: '▲',
    4: '◆',
    5: '⬟',
    6: '⬢',
    7: '–'
  };

  function init() {
    var container = document.getElementById('bcNavContainer');
    if (!container || !window.bcNavConfig) return;

    var pages = window.bcNavConfig.pages || [];

    pages.forEach(function (page) {
      var isActive = page.slug === window.location.pathname;

      var link      = document.createElement('a');
      link.href     = page.slug;
      link.className = 'bc-nav-item bc-level-' + page.level + (isActive ? ' active' : '');

      var shape      = document.createElement('span');
      shape.className = 'bc-nav-shape';
      shape.textContent = SHAPES[page.level] || SHAPES[7];

      var title      = document.createElement('span');
      title.className = 'bc-nav-title';
      title.textContent = page.title;

      link.appendChild(shape);
      link.appendChild(title);
      container.appendChild(link);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

}());
