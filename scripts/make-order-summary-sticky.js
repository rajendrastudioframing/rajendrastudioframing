const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update css/style.css & public/css/style.css
['css/style.css', 'public/css/style.css'].forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  content = content.replace(
    /html\s*\{([\s\S]*?)overflow-x:\s*(?:hidden|clip);/g,
    'html {$1overflow-x: clip;'
  );

  content = content.replace(
    /body\s*\{([\s\S]*?)overflow-x:\s*(?:hidden|clip);/g,
    'body {$1overflow-x: clip;'
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${relPath} (overflow-x: clip)`);
});

// 2. Comprehensive Sticky Order Summary CSS Rules
const STICKY_SUMMARY_CSS = `
/* ==========================================================================
   ORDER SUMMARY CARD - RESPONSIVE & MOBILE-FRIENDLY SCROLLING
   ========================================================================== */
.order-summary-card {
  background: #FFFFFF !important;
  border: 1px solid var(--border-light, #E5E0D5) !important;
  border-radius: 16px !important;
  padding: 20px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
  box-sizing: border-box !important;
}

.order-summary-card .checkout-title {
  font-family: var(--font-heading, "Playfair Display", serif) !important;
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: #111111 !important;
  margin-bottom: 12px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px solid #F0ECE4 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.order-item-row {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding-bottom: 10px !important;
  border-bottom: 1px solid #F0ECE4 !important;
}

.order-item-img {
  width: 48px !important;
  height: 48px !important;
  object-fit: cover !important;
  border-radius: 8px !important;
  background: #FAF7F2 !important;
  flex-shrink: 0 !important;
}

.order-item-details {
  flex: 1 !important;
  min-width: 0 !important;
}

.order-item-name {
  font-size: 0.875rem !important;
  font-weight: 700 !important;
  color: #111111 !important;
  margin-bottom: 3px !important;
  line-height: 1.3 !important;
}

.order-item-qty {
  font-size: 0.75rem !important;
  color: #6B7280 !important;
  line-height: 1.4 !important;
}

.order-item-price {
  font-weight: 700 !important;
  color: var(--accent-gold, #C99A3D) !important;
  font-size: 0.9rem !important;
  white-space: nowrap !important;
}

.order-breakdown-row {
  display: flex !important;
  justify-content: space-between !important;
  font-size: 0.85rem !important;
  color: #4B5563 !important;
  margin-bottom: 6px !important;
}

.order-breakdown-row.grand-total {
  font-size: 1.15rem !important;
  font-weight: 800 !important;
  color: #111111 !important;
  padding-top: 10px !important;
  border-top: 2px solid #F0ECE4 !important;
  margin-top: 10px !important;
  margin-bottom: 14px !important;
}

.order-breakdown-row.grand-total span:last-child {
  color: var(--accent-gold, #C99A3D) !important;
}

.btn-place-order {
  width: 100% !important;
  padding: 13px 18px !important;
  font-size: 0.95rem !important;
  font-weight: 800 !important;
  border-radius: 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  background: linear-gradient(135deg, #C99A3D 0%, #A87A24 100%) !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 16px rgba(201, 154, 61, 0.3) !important;
  cursor: pointer !important;
  border: none !important;
}

.order-guarantee-badges {
  margin-top: 12px !important;
  padding-top: 12px !important;
  border-top: 1px dashed #E5E0D5 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.order-badge-row {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 0.75rem !important;
  color: #4B5563 !important;
}

.order-badge-row svg {
  width: 15px !important;
  height: 15px !important;
  color: var(--accent-gold, #C99A3D) !important;
  flex-shrink: 0 !important;
}

/* --- DESKTOP VIEW (STICKY SIDEBAR WITH NATURAL SCROLLING) --- */
@media (min-width: 993px) {
  .checkout-grid {
    display: grid !important;
    grid-template-columns: 1fr 400px !important;
    gap: 28px !important;
    align-items: start !important;
  }

  .order-summary-card {
    position: -webkit-sticky !important;
    position: sticky !important;
    top: 90px !important;
    max-height: calc(100vh - 110px) !important;
    overflow-y: auto !important;
    overscroll-behavior: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: thin !important;
    z-index: 20 !important;
  }

  .order-items-preview {
    max-height: 260px !important;
    overflow-y: auto !important;
    overscroll-behavior: auto !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;
    scrollbar-width: thin !important;
    margin-bottom: 12px !important;
    padding-right: 4px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }
}

/* --- MOBILE & TABLET VIEW (NATURAL FLOW, NO TRAPPED SCROLLING) --- */
@media (max-width: 992px) {
  .checkout-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
    width: 100% !important;
  }

  .order-summary-card {
    position: static !important;
    top: auto !important;
    max-height: none !important;
    overflow: visible !important;
    overscroll-behavior: auto !important;
    z-index: 1 !important;
    margin-top: 8px !important;
    margin-bottom: 30px !important;
  }

  .order-items-preview {
    max-height: none !important;
    overflow: visible !important;
    overscroll-behavior: auto !important;
    touch-action: pan-y !important;
    margin-bottom: 14px !important;
    padding-right: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  .checkout-wrapper {
    padding-bottom: 100px !important;
  }
}
`;

// Append / replace in css/cart.css, public/css/cart.css, css/ecom-ui.css, public/css/ecom-ui.css
['css/cart.css', 'public/css/cart.css'].forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  const marker = '/* ==========================================================================\n   STICKY ORDER SUMMARY CARD';
  if (content.includes(marker)) {
    content = content.replace(new RegExp(escapeRegex(marker) + '[\\s\\S]*$'), STICKY_SUMMARY_CSS);
  } else {
    content += '\n' + STICKY_SUMMARY_CSS + '\n';
  }

  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${relPath} with compact sticky summary styles`);
});

['css/ecom-ui.css', 'public/css/ecom-ui.css'].forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  const marker = '/* ==========================================================================\n   STICKY ORDER SUMMARY CARD';
  if (content.includes(marker)) {
    content = content.replace(new RegExp(escapeRegex(marker) + '[\\s\\S]*$'), STICKY_SUMMARY_CSS);
  } else {
    content += '\n' + STICKY_SUMMARY_CSS + '\n';
  }

  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${relPath} with compact sticky summary styles`);
});

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('=== All files successfully updated for sticky order summary ===');
