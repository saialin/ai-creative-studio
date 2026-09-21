// AI Creative Studio — Shared Workflow Layer (Pilot — Phase 1)
// -------------------------------------------------------------------
// Additive shared module for the unified UX pattern:
//   INPUT → GENERATE → RESULT → REVIEW → FINAL
//
// Contents (pilot scope):
//   1. resultActionsHtml(opts) — server-side builder for the standard
//      Result-stage action row: [← Edit] [↻ Regenerate] [Continue →]
//   2. WORKFLOW_SCRIPT — browser-side:
//      window.aicsTransfer  — explicit cross-studio handoff contract
//                             { source, sourceType, payload, metadata, createdAt }
//
// Studio isolation is preserved: this module does NOT know any studio's
// internal state. Studios use it via adapters only.
// -------------------------------------------------------------------

// ============================================================
// 1. Result Actions Row (server-side HTML builder)
// ------------------------------------------------------------
// Renders the uniform Result-stage actions shared by every studio.
// Pass per-action onclick expressions (strings). All optional.
// ============================================================
export function resultActionsHtml(opts) {
  opts = opts || {};
  var buttons = [];
  if (opts.onEdit) {
    buttons.push('<button class="btn btn-secondary" onclick="' + opts.onEdit + '">&#8592; Edit</button>');
  }
  if (opts.onRegenerate) {
    buttons.push('<button class="btn btn-secondary" onclick="' + opts.onRegenerate + '">&#8635; Regenerate</button>');
  }
  if (opts.onContinue) {
    buttons.push('<button class="btn btn-primary" onclick="' + opts.onContinue + '">Continue &#8594;</button>');
  }
  if (!buttons.length) return '';
  return '<div class="btn-row aics-result-actions" style="margin-top:14px;align-items:center;">' +
    buttons.join('') + '</div>';
}

// ============================================================
// 2. Browser-side Workflow Script
// ------------------------------------------------------------
// Defines window.aicsTransfer — the explicit cross-studio handoff
// contract. Source Studio WRITES a JSON contract into
// localStorage['aics_transfer_<target>']; Target Studio READS it
// (auto-fills its input), then CLEARS it. The target never touches
// the source's internal state.
// ============================================================
export const WORKFLOW_SCRIPT = `
(function () {
  // ---- Explicit Handoff Contract (Cross-Studio) ----
  // contract = {
  //   source: 'content',          // source studio slug
  //   sourceType: 'text',         // text | image | audio | video | srt
  //   payload: { text: '…' },     // transferable data
  //   metadata: { … },            // optional prefill hints (voiceName, style…)
  //   createdAt: '2026-09-21T…'   // ISO timestamp
  // }
  var PREFIX = 'aics_transfer_';
  window.aicsTransfer = {
    write: function (target, contract) {
      if (!target || !contract) return false;
      try {
        contract.createdAt = contract.createdAt || new Date().toISOString();
        localStorage.setItem(PREFIX + target, JSON.stringify(contract));
        return true;
      } catch (e) { return false; }
    },
    read: function (target, maxAgeMs) {
      if (!target) return null;
      try {
        var raw = localStorage.getItem(PREFIX + target);
        if (!raw) return null;
        var c = JSON.parse(raw);
        if (maxAgeMs && c.createdAt) {
          var age = Date.now() - new Date(c.createdAt).getTime();
          if (age > maxAgeMs) { window.aicsTransfer.clear(target); return null; }
        }
        return c;
      } catch (e) { return null; }
    },
    clear: function (target) {
      try { localStorage.removeItem(PREFIX + target); } catch (e) {}
    }
  };
})();
`;

export default WORKFLOW_SCRIPT;
