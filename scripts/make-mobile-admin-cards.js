const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const mobileCssRules = `
  /* ==========================================================================
     ATTRACTIVE COMPACT 2-COLUMN METRIC CARDS ON MOBILE (PHONE POLISH)
     ========================================================================== */
  @media (max-width: 768px) {
    .metric-segment-bar,
    .metric-segment-bar.five-cols {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      margin-bottom: 14px !important;
      overflow: visible !important;
    }

    .metric-segment-bar.five-cols .metric-segment:last-child {
      grid-column: span 2 !important;
    }

    .metric-segment {
      background: var(--bg-card) !important;
      border: 1px solid var(--border-subtle) !important;
      border-radius: 12px !important;
      padding: 10px 12px !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      min-height: 82px !important;
      border-right: 1px solid var(--border-subtle) !important;
      border-bottom: 1px solid var(--border-subtle) !important;
      transition: transform 0.15s ease, box-shadow 0.15s ease !important;
    }

    .metric-segment:hover {
      background: var(--bg-card) !important;
      box-shadow: 0 2px 6px rgba(201, 154, 61, 0.12) !important;
    }

    .metric-segment-top {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: 2px !important;
    }

    .metric-label-group {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      min-width: 0 !important;
      flex: 1 !important;
    }

    .metric-icon-dot {
      width: 6px !important;
      height: 6px !important;
      flex-shrink: 0 !important;
    }

    .metric-segment-label {
      font-size: 0.64rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.4px !important;
      color: var(--text-muted) !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .metric-segment-dots {
      display: none !important;
    }

    .metric-segment-val {
      font-size: 1.35rem !important;
      font-weight: 800 !important;
      margin: 3px 0 5px !important;
      line-height: 1.15 !important;
      letter-spacing: -0.02em !important;
      color: var(--text-main) !important;
    }

    .metric-segment-tag {
      font-size: 0.62rem !important;
      padding: 2px 7px !important;
      border-radius: 9999px !important;
      font-weight: 600 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 100% !important;
    }

    .page-subheader {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 8px !important;
      margin-bottom: 12px !important;
      padding: 0 !important;
    }

    .subheader-text {
      font-size: 0.78rem !important;
      line-height: 1.35 !important;
      color: var(--text-muted) !important;
    }

    .subheader-actions {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 6px !important;
      width: 100% !important;
    }

    .subheader-actions .btn-sub-action {
      padding: 7px 10px !important;
      font-size: 0.76rem !important;
      font-weight: 600 !important;
      border-radius: 9px !important;
      min-height: 34px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
    }

    .subheader-actions .btn-sub-action.primary {
      grid-column: span 2 !important;
      padding: 8px 12px !important;
      font-weight: 700 !important;
    }
  }
`;

function patchCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the old 1fr overriding rules if present
  content = content.replace(/\.metric-segment-bar\s*\{\s*grid-template-columns:\s*1fr\s*!important;\s*\}/g, '');
  content = content.replace(/\.metric-segment-bar\s*\{\s*grid-template-columns:\s*1fr;\s*\}/g, '');

  if (!content.includes('ATTRACTIVE COMPACT 2-COLUMN METRIC CARDS ON MOBILE')) {
    content += '\n' + mobileCssRules;
  } else {
    // Replace old block with new
    const idx = content.indexOf('/* ==========================================================================\n     ATTRACTIVE COMPACT 2-COLUMN');
    if (idx !== -1) {
      content = content.slice(0, idx) + mobileCssRules;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Patched CSS: ${filePath}`);
}

patchCss(path.join(rootDir, 'css', 'admin.css'));
patchCss(path.join(rootDir, 'public', 'css', 'admin.css'));

function patchHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Update version
  html = html.replace(/css\/admin\.css\?v=[^"']+/g, 'css/admin.css?v=mobile_cards_v4');

  // Add mobile cards rule to inline style tag
  if (!html.includes('ATTRACTIVE COMPACT 2-COLUMN METRIC CARDS ON MOBILE')) {
    html = html.replace('</style>', mobileCssRules + '\n  </style>');
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Patched HTML: ${filePath}`);
}

patchHtml(path.join(rootDir, 'admin.html'));
patchHtml(path.join(rootDir, 'public', 'admin.html'));

console.log('--- MOBILE ADMIN CARD UPGRADE COMPLETE ---');
