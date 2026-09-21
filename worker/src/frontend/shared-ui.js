// AI Creative Studio — Generic Shared Browser Components (V2 refactor, rule 7)
// -----------------------------------------------------------------------------
// Canonical home for the GENERIC shared components: Loading, Toast, Copy,
// Error Dialog, Confirm Dialog, Modal, Common Utilities.
//
// IMPORTANT (rule 8 — duplicates are NOT deleted until regression-tested):
// The 6 studio packages still ship their own byte-identical copies of these
// helpers (extracted verbatim in each studio's helpers.js) so that v1 behaviour
// is guaranteed. This module is the MERGE TARGET: new pages/components should
// use these exports, and each duplicate can be migrated here one-by-one after
// browser-level regression passes (see DUPLICATE_REPORT.md — KEEP/MOVE/MERGE/
// DELETE-LATER classification).
//
// NOT shared (Studio identity is preserved): Story UI, Content UI, Voice UI,
// Image UI, Shop workflow, Short workflow — those live in the studio packages.

// ---------------------------------------------------------------------------
// Loading — the result-loading card (already shared in shared.js as
// aicsResultLoadingHtml; kept here as the documented canonical entry).
// ---------------------------------------------------------------------------
export { aicsResultLoadingHtml } from './shared.js';

// ---------------------------------------------------------------------------
// Toast — canonical base component (HTML element + browser-side script)
// ---------------------------------------------------------------------------
export function aicsToastHtml(defaultText) {
  return '<div class="toast" id="toast">' + (defaultText || '&#9989; ကူးယူပြီးပါပြီ') + '</div>';
}

export const AICS_TOAST_SCRIPT = `
function aicsShowToast(msg, type, ms) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg || '';
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(function () { t.className = 'toast'; }, ms || 2500);
}
`;

// ---------------------------------------------------------------------------
// Copy — clipboard helper (canonical implementation)
// ---------------------------------------------------------------------------
export const AICS_COPY_SCRIPT = `
function aicsCopyText(text, doneMsg) {
  if (!text) { if (typeof aicsShowToast === 'function') aicsShowToast('Text မရှိပါ'); return; }
  var onDone = function () { if (typeof aicsShowToast === 'function') aicsShowToast(doneMsg || '&#9989; ကူးယူပြီးပါပြီ'); };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(onDone);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onDone();
  }
}
`;

// ---------------------------------------------------------------------------
// Error Dialog — base show/hide helpers (friendly messages)
// ---------------------------------------------------------------------------
export const AICS_ERROR_SCRIPT = `
function aicsShowError(prefix, e) {
  var el = document.getElementById('errorMsg');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = '<span style="opacity:.85">' + (prefix || '') + '</span> ' +
    (e && e.message ? String(e.message) : 'Something went wrong. Please try again.');
}
function aicsHideError() {
  var el = document.getElementById('errorMsg');
  if (!el) return;
  el.style.display = 'none';
}
`;

// ---------------------------------------------------------------------------
// Confirm Dialog — safe wrapper around the native confirm()
// ---------------------------------------------------------------------------
export const AICS_CONFIRM_SCRIPT = `
function aicsConfirm(message, onYes) {
  if (window.confirm(message || 'ဆက်လုပ်မည်လား?')) { if (onYes) onYes(); return true; }
  return false;
}
`;

// ---------------------------------------------------------------------------
// Modal — generic overlay helpers (login overlay pattern)
// ---------------------------------------------------------------------------
export const AICS_MODAL_SCRIPT = `
function aicsShowModal(id) { var m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function aicsHideModal(id) { var m = document.getElementById(id); if (m) m.style.display = 'none'; }
`;

// ---------------------------------------------------------------------------
// Common Utilities — canonical implementations (each studio's helpers.js has
// its own byte-identical v1 copy; migrate per-function after regression).
// ---------------------------------------------------------------------------
export const AICS_COMMON_UTILS_SCRIPT = `
function aicsEscapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}
function aicsDebounce(fn, ms) {
  var t = null;
  return function () {
    var a = arguments, c = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(c, a); }, ms || 400);
  };
}
function aicsSel(id) { return document.getElementById(id); }
function aicsFillSelect(el, arr, valKey, labelKey) {
  if (!el || !arr) return;
  el.innerHTML = '';
  arr.forEach(function (x) {
    var o = document.createElement('option');
    o.value = x[valKey || 'v'];
    o.textContent = x[labelKey || 'label'];
    el.appendChild(o);
  });
}
function aicsAutoExpand(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight + 2) + 'px';
}
`;

// Note: apiCall is intentionally NOT centralised here — each studio talks to a
// different endpoint set and has bespoke error handling. Studio isolation rule
// (rule 6) keeps API logic inside each studio package's api/helpers modules.

// ---------------------------------------------------------------------------
// Result Hub — V2.1 Unified Workflow Hub (ADDITIVE; no existing export changed)
// Shared "step 4" component: progress chain + result body + toolbar + "continue
// with this result" cards. A studio passes plain data; the component only builds
// HTML. Callbacks are registered per render (window.aicsHubRun(index)).
//
//   aicsResultHub({
//     pipeline: [{ label, done, current }],       // e.g. Audio ✓ → SRT → Translate
//     body:     '<html>',                          // the result itself (audio, textarea…)
//     tools:    [{ label, fn }],                   // Copy / Save / Retry …
//     afterHtml:'<html>',                          // optional options placed above the next-cards
//     nextTitle:'Continue with this result',
//     next:     [{ icon, label, desc, locked, fn }]
//   })  ->  HTML string
// ---------------------------------------------------------------------------
export const AICS_RESULT_HUB_CSS = `
.aics-work .aics-hub-pipe{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 0 12px;font-size:12px}
.aics-work .aics-hub-pill{padding:3px 10px;border-radius:999px;border:1px solid var(--border,rgba(0,229,255,.15));color:var(--muted,#8b95a8);background:var(--card2,#111a2e)}
.aics-work .aics-hub-pill.done{color:var(--success,#00e676);border-color:rgba(0,230,118,.3);background:rgba(0,230,118,.08)}
.aics-work .aics-hub-pill.current{border-color:rgba(123,92,255,.6);color:#fff}
.aics-work .aics-hub-arrow{color:var(--muted,#8b95a8)}
.aics-work .aics-hub-tools{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}
.aics-work .aics-hub-tool{appearance:none;min-height:40px;padding:8px 13px;border-radius:9px;border:1px solid var(--border,rgba(0,229,255,.15));background:var(--card2,#111a2e);color:var(--text,#e8ecf4);font-size:13px;font-weight:600;cursor:pointer}
.aics-work .aics-hub-tool:hover{border-color:var(--cyan,#00e5ff)}
.aics-work .aics-hub-title{font-weight:700;color:var(--cyan,#00e5ff);margin:16px 0 8px;font-size:13px}
.aics-work .aics-hub-next-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.aics-work .aics-hub-next{appearance:none;text-align:left;display:flex;flex-direction:column;gap:3px;padding:13px;border-radius:12px;border:1px solid var(--border,rgba(0,229,255,.15));background:var(--card2,#111a2e);color:var(--text,#e8ecf4);cursor:pointer;min-height:64px}
.aics-work .aics-hub-next:hover{border-color:var(--cyan,#00e5ff)}
.aics-work .aics-hub-next b{font-size:14px}
.aics-work .aics-hub-next span{font-size:12px;color:var(--muted,#8b95a8)}
.aics-work .aics-hub-lock{font-size:11px;color:var(--warn,#ffc107)}
@media(max-width:700px){.aics-work .aics-hub-next-grid{grid-template-columns:1fr}}
`;

export const AICS_RESULT_HUB_SCRIPT = `
var __aicsHubCbs = [];
function aicsHubEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function aicsHubRun(i) { var f = __aicsHubCbs[i]; if (typeof f === 'function') f(); }
function aicsResultHub(o) {
  o = o || {};
  __aicsHubCbs = [];
  function reg(fn) { __aicsHubCbs.push(fn); return __aicsHubCbs.length - 1; }
  var h = '';
  if (o.pipeline && o.pipeline.length) {
    h += '<div class="aics-hub-pipe">';
    o.pipeline.forEach(function (p, i) {
      if (i) h += '<span class="aics-hub-arrow">→</span>';
      h += '<span class="aics-hub-pill' + (p.done ? ' done' : '') + (p.current ? ' current' : '') + '">' + (p.done ? '✓ ' : '') + aicsHubEsc(p.label) + '</span>';
    });
    h += '</div>';
  }
  h += o.body || '';
  if (o.tools && o.tools.length) {
    h += '<div class="aics-hub-tools">';
    o.tools.forEach(function (t) {
      h += '<button type="button" class="aics-hub-tool" onclick="aicsHubRun(' + reg(t.fn) + ')">' + aicsHubEsc(t.label) + '</button>';
    });
    h += '</div>';
  }
  h += o.afterHtml || '';
  if (o.next && o.next.length) {
    h += '<div class="aics-hub-title">' + aicsHubEsc(o.nextTitle || 'Continue with this result') + '</div><div class="aics-hub-next-grid">';
    o.next.forEach(function (n) {
      h += '<button type="button" class="aics-hub-next" onclick="aicsHubRun(' + reg(n.fn) + ')"><b>' + (n.icon ? aicsHubEsc(n.icon) + ' ' : '') + aicsHubEsc(n.label) + (n.locked ? ' <span class="aics-hub-lock">🔒 Pro</span>' : '') + '</b>' + (n.desc ? '<span>' + aicsHubEsc(n.desc) + '</span>' : '') + '</button>';
    });
    h += '</div>';
  }
  return h;
}
`;
