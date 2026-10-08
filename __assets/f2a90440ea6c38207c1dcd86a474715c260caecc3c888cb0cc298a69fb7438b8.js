/**
 * VEXTREME — lib/shell.js
 *
 * GitHub Pages bootstrap. Add ONE script tag to each page:
 *
 *   <script src="https://cdn.jsdelivr.net/gh/vgong24/vextreme@main/lib/shell.js"></script>
 *
 * NO version number in the page's script tag. shell.js is stable and
 * minimal — it only loads vextreme.js. The version that matters is on
 * vextreme.js (below), which controls all downstream asset cache busting.
 *
 * TO UPDATE ASSETS: bump VEXTREME_VER below and in vextreme.js DEFAULT_CACHE.
 * Push both files. Every page picks up the new version automatically —
 * no page HTML needs to be touched.
 *
 * OVERRIDES (rare — declare before shell.js loads):
 *   <script>window.VEXTREME_OVERRIDE = { slug: 'different-slug' };</script>
 *   <script src=".../shell.js"></script>
 *
 * FORK USAGE:
 *   <script>window.VEXTREME_OVERRIDE = { baseUrl: 'https://cdn.jsdelivr.net/gh/yourname/yourrepo@main' };</script>
 *   <script src="[your fork shell.js]"></script>
 */

(function () {
  'use strict';

  var BASE = 'https://cdn.jsdelivr.net/gh/vgong24/vextreme@main';

  // Version lives here and in vextreme.js DEFAULT_CACHE.
  // Bump both together when any asset changes. Pages never need updating.
  var VEXTREME_VER = '?v=8';

  var el    = document.createElement('script');
  el.src    = BASE + '/lib/vextreme.js' + VEXTREME_VER;
  el.onload = function () {
    if (typeof window.VEXTREME === 'function') {
      // Pass override config if declared, otherwise call with no args
      window.VEXTREME(window.VEXTREME_OVERRIDE || {});
    } else {
      console.warn('[VEXTREME shell] vextreme.js loaded but VEXTREME not defined');
    }
  };
  el.onerror = function () {
    console.warn('[VEXTREME shell] Failed to load vextreme.js from: ' + el.src);
  };
  document.head.appendChild(el);

}());
