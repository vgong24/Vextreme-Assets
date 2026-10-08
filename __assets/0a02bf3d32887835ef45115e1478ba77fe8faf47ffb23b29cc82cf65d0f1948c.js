/**
 * lib/archive-renderer.js
 *
 * Renders entry rows for the archives page by merging the three-layer
 * token system from data/pages.json:
 *
 *   _base  →  preset  →  per-slug overrides
 *
 * RESPONSIBILITY:
 *   - Resolve display tokens for a given slug
 *   - Render a single entry row HTML string
 *   - Render a full section entry list
 *
 * NOT RESPONSIBLE FOR:
 *   - Section toggle behavior    → components/section-toggle.js
 *   - Arc nav widget             → lib/arc-nav.js
 *   - CSS classes/styles         → styles/design-system.css
 *
 * DATA LOADED VIA:
 *   window.VEXTREME_PAGES  — from data/pages.json (the full parsed object)
 *   window.VEXTREME_ARCS   — from data/arcs.json  (for href resolution)
 *
 * USAGE:
 *   // Render a single entry row by slug:
 *   const html = VEXTREME_renderEntryRow('the-firmament-conversation', {
 *     title: 'The Firmament Conversation',
 *     date:  'March 21, 2026',
 *     tags:  'Conversation with God',
 *     section: 'convos_with_god'   // used for sectionDefault fallback
 *   });
 *
 *   // Render a full archive section from arc data:
 *   VEXTREME_renderSection('convos_with_god', document.getElementById('vex-archive-convos'));
 */

(function (global) {
  'use strict';

  var BASE_URL = global.VEXTREME_BASE_URL || 'https://www.vextreme24.com';

  // One-time warning per unique message — avoids console spam.
  var _warned = {};
  function warnOnce(msg) {
    if (_warned[msg]) return;
    _warned[msg] = true;
    console.warn('[VEXTREME]', msg);
  }

  // ─────────────────────────────────────────────
  // TOKEN RESOLUTION
  // Merge: _base → preset → per-slug overrides
  // ─────────────────────────────────────────────

  function resolveTokens(slug, sectionId) {
    var PAGES   = global.VEXTREME_PAGES;
    if (!PAGES) return {};

    var base     = PAGES.presets['_base']  || {};
    var presets  = PAGES.presets;
    var pages    = PAGES.pages    || {};
    var secDefs  = PAGES.sectionDefaults || {};

    // 1. Start from _base
    var tokens = Object.assign({}, base);

    // 2. Apply section default preset (if no per-slug entry exists)
    var pageDef = pages[slug];
    if (!pageDef && sectionId && secDefs[sectionId]) {
      var secDef = secDefs[sectionId];
      var secPreset = secDef.preset && presets[secDef.preset];
      if (secPreset) tokens = Object.assign({}, tokens, withoutMeta(secPreset));
      tokens = Object.assign({}, tokens, withoutMeta(secDef));
    }

    // 3. Apply per-slug preset
    // Unknown preset names fall back to whatever tokens were already
    // accumulated (_base) AND log a one-time warning — a typo'd preset
    // name no longer fails silently.
    if (pageDef && pageDef.preset) {
      var presetName = pageDef.preset;
      var preset = presets[presetName];
      if (preset) {
        tokens = Object.assign({}, tokens, withoutMeta(preset));
      } else if (presetName !== '_base') {
        warnOnce('Unknown preset "' + presetName + '" for slug "' + slug + '" — falling back to _base.');
      }
    }

    // 4. Apply per-slug overrides (everything except preset/pills/tags/desc/dateDisplay/_note)
    if (pageDef) {
      tokens = Object.assign({}, tokens, withoutMeta(pageDef));
    }

    return tokens;
  }

  // Strip meta-only fields that aren't style tokens
  function withoutMeta(obj) {
    var skip = ['_note', 'extends', 'preset', 'pills', 'tags', 'desc', 'dateDisplay'];
    var out = {};
    Object.keys(obj).forEach(function (k) {
      if (skip.indexOf(k) === -1) out[k] = obj[k];
    });
    return out;
  }

  // Resolve content fields (pills, tags, desc, dateDisplay) — slug overrides section default
  function resolveContent(slug, fallback, sectionId) {
    var PAGES  = global.VEXTREME_PAGES;
    var pages  = (PAGES && PAGES.pages)  || {};
    var pageDef = pages[slug] || {};

    return {
      pills:       pageDef.pills       || [],
      tags:        pageDef.tags        || fallback.tags  || '',
      desc:        pageDef.desc        || fallback.desc  || '',
      dateDisplay: pageDef.dateDisplay || fallback.date  || ''
    };
  }


  // ─────────────────────────────────────────────
  // PILL RENDERER
  // ─────────────────────────────────────────────

  function renderPills(pillKeys) {
    var PAGES   = global.VEXTREME_PAGES;
    var pillDef = (PAGES && PAGES.pills) || {};
    if (!pillKeys || !pillKeys.length) return '';

    return pillKeys.map(function (key) {
      var def = pillDef[key];
      if (!def) return '';
      return '<span style="'
        + 'display:inline-block;font-size:9px;font-weight:600;letter-spacing:1.8px;'
        + 'text-transform:uppercase;border-radius:20px;padding:2px 8px;'
        + 'font-family:\'IBM Plex Mono\',monospace;'
        + 'color:' + def.color + ';'
        + 'background:' + def.bg + ';'
        + 'border:1px solid ' + def.border + ';'
        + '">' + def.label + '</span>';
    }).join('');
  }


  // ─────────────────────────────────────────────
  // FONT RESOLVER
  // ─────────────────────────────────────────────

  function resolveFont(key) {
    var PAGES = global.VEXTREME_PAGES;
    var fonts = (PAGES && PAGES.fonts) || {};
    return fonts[key] || "'IBM Plex Sans', sans-serif";
  }


  // ─────────────────────────────────────────────
  // BORDER STYLES
  // ─────────────────────────────────────────────

  function buildBorderStyle(tokens) {
    var style = '';
    switch (tokens.borderStyle) {
      case 'left':
        style += 'border-left:2px solid ' + tokens.borderColor + ';';
        style += 'border-top:1px solid ' + (tokens.bgColor || '#ffffff') + ';';
        style += 'border-right:0.5px solid #e7e5e4;';
        style += 'border-bottom:1px solid #e7e5e4;';
        break;
      case 'full':
        style += 'border-top:1px solid ' + tokens.borderColor + ';';
        style += 'border-bottom:1px solid ' + tokens.borderColor + ';';
        break;
      default:
        // none — no border override, base CSS handles it via gap
        break;
    }
    return style;
  }

  // Build the hover CSS via a <style> injection keyed to a unique data attribute
  var _hoverStylesInjected = {};
  function ensureHoverStyle(slug, tokens) {
    if (_hoverStylesInjected[slug]) return;
    _hoverStylesInjected[slug] = true;

    var attr = 'data-vex-row="' + slug + '"';
    var css = [
      '[data-vex-row="' + slug + '"]:hover { background:' + tokens.hoverBg + ' !important; }',
      '[data-vex-row="' + slug + '"]:hover .vex-entry-title { color:' + tokens.hoverTitleColor + ' !important; }',
      '[data-vex-row="' + slug + '"]:hover .vex-entry-arrow { color:' + tokens.hoverArrowColor + ' !important; transform:translateX(3px); }'
    ].join('\n');

    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }


  // ─────────────────────────────────────────────
  // RENDER: SINGLE ENTRY ROW
  // ─────────────────────────────────────────────

  /**
   * Render one entry row HTML string.
   *
   * @param {string} slug      — page slug
   * @param {object} fallback  — { title, date, tags, desc } from arc data
   * @param {string} sectionId — archive section key for sectionDefault fallback
   * @return {string}          — HTML string for the <a> element
   */
  function renderEntryRow(slug, fallback, sectionId) {
    var tokens  = resolveTokens(slug, sectionId);
    var content = resolveContent(slug, fallback, sectionId);

    var href        = BASE_URL + '/' + slug;
    var title       = fallback.title || '';
    var date        = content.dateDisplay || fallback.date || '';
    var tags        = content.tags || fallback.tags || '';
    var desc        = content.desc || '';
    var pills       = content.pills || [];

    var paddingMap  = { sm: '10px 16px', md: '14px 24px', lg: '18px 24px' };
    var sizeMap     = { sm: '15px', md: 'clamp(15px,2vw,17px)', lg: 'clamp(17px,2.5vw,20px)' };
    var padding     = paddingMap[tokens.padding] || paddingMap.md;
    var titleSize   = sizeMap[tokens.titleSize]  || sizeMap.md;
    var titleFont   = resolveFont(tokens.titleFont);
    var descFont    = resolveFont(tokens.descFont);
    var dateFont    = resolveFont(tokens.dateFont);

    var containerStyle = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'gap:20px',
      'background:' + tokens.bgColor,
      'padding:' + padding,
      'text-decoration:none',
      'transition:background 0.15s',
      buildBorderStyle(tokens)
    ].filter(Boolean).join(';');

    var titleStyle = [
      'font-family:' + titleFont,
      'font-size:' + titleSize,
      'font-weight:400',
      'font-style:' + tokens.titleStyle,
      'color:' + tokens.titleColor,
      'line-height:1.3',
      'transition:color 0.15s'
    ].join(';');

    var dateStyle = [
      'font-family:' + dateFont,
      'font-size:11px',
      'color:' + tokens.dateColor,
      'letter-spacing:0.3px'
    ].join(';');

    var tagStyle = [
      'font-size:10px',
      'font-weight:600',
      'letter-spacing:1.4px',
      'text-transform:uppercase',
      'color:' + tokens.tagColor
    ].join(';');

    var descStyle = [
      'font-family:' + descFont,
      'font-size:12px',
      'color:' + tokens.descColor,
      'font-style:italic',
      'line-height:1.5',
      'margin-top:3px'
    ].join(';');

    var arrowStyle = [
      'font-size:14px',
      'color:' + tokens.arrowColor,
      'transition:color 0.15s,transform 0.15s',
      'flex-shrink:0'
    ].join(';');

    var metaRow = '';
    if (date)  metaRow += '<span class="vex-entry-date"  style="' + dateStyle + '">' + date + '</span>';
    if (tags)  metaRow += '<span class="vex-entry-tag"   style="' + tagStyle  + '">' + tags + '</span>';
    if (pills.length) metaRow += renderPills(pills);

    var html = '<a class="vex-entry-row" data-vex-row="' + slug + '" href="' + href + '" style="' + containerStyle + '">'
      + '<div style="display:flex;flex-direction:column;gap:3px;flex:1;">'
      + '<div class="vex-entry-title" style="' + titleStyle + '">' + title + '</div>';

    if (metaRow) {
      html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' + metaRow + '</div>';
    }

    if (desc) {
      html += '<div style="' + descStyle + '">' + desc + '</div>';
    }

    html += '</div>'
      + '<span class="vex-entry-arrow" style="' + arrowStyle + '">→</span>'
      + '</a>';

    // Inject hover styles for this slug (once per slug per page)
    if (typeof document !== 'undefined') {
      ensureHoverStyle(slug, tokens);
    }

    return html;
  }


  // ─────────────────────────────────────────────
  // RENDER: FULL SECTION
  // Reads from VEXTREME_ARCS to get the entry list for a given arc,
  // then renders each entry row.
  // ─────────────────────────────────────────────

  /**
   * Render all entries for an arc into a container element.
   *
   * @param {string}      arcId     — key in VEXTREME_ARCS
   * @param {HTMLElement} container — DOM element to inject into
   * @param {string}      sectionId — archive section key for sectionDefault fallback
   */
  function renderSection(arcId, container, sectionId) {
    var ARCS = global.VEXTREME_ARCS;
    var arc  = ARCS && ARCS[arcId];
    if (!arc || !container) return;

    var entries = arc.sections.reduce(function (acc, s) {
      return acc.concat(s.entries);
    }, []);

    var listEl = document.createElement('div');
    listEl.className = 'entry-list';

    entries.forEach(function (entry) {
      var slug = entry.slug;
      var html = renderEntryRow(slug, {
        title: entry.title,
        date:  entry.date || '',
        tags:  '',
        desc:  ''
      }, sectionId || arcId);

      listEl.insertAdjacentHTML('beforeend', html);
    });

    container.appendChild(listEl);
  }


  // ─────────────────────────────────────────────
  // EXPORTS
  // ─────────────────────────────────────────────

  global.VEXTREME_resolveTokens  = resolveTokens;
  global.VEXTREME_renderEntryRow = renderEntryRow;
  global.VEXTREME_renderSection  = renderSection;

}(window));