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
   STICKY ORDER SUMMARY CARD (STAYS PINNED AND STATIONARY WHEN SCROLLING)
   ========================================================================== */
.checkout-grid {
  display: grid !important;
  grid-template-columns: 1fr 400px !important;
  gap: 28px !important;
  align-items: start !important;
}

@media (max-width: 992px) {
  .checkout-grid {
    grid-template-columns: 1fr !important;
  }
}

.order-summary-card {
  background: #FFFFFF !important;
  border: 1px solid var(--border-light, #E5E0D5) !important;
  border-radius: 16px !important;
  padding: 18px 20px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
  position: -webkit-sticky !important;
  position: sticky !important;
  top: 84px !important;
  z-index: 30 !important;
  align-self: start !important;
  box-sizing: border-box !important;
  max-height: calc(100vh - 96px) !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
  scrollbar-width: thin !important;
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

.order-items-preview {
  max-height: 140px !important;
  overflow-y: auto !important;
  margin-bottom: 12px !important;
  padding-right: 4px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  scrollbar-width: thin !important;
}

.order-item-row {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px solid #F0ECE4 !important;
}

.order-item-img {
  width: 42px !important;
  height: 42px !important;
  object-fit: cover !important;
  border-radius: 6px !important;
  background: #FAF7F2 !important;
  flex-shrink: 0 !important;
}

.order-item-details {
  flex: 1 !important;
  min-width: 0 !important;
}

.order-item-name {
  font-size: 0.8125rem !important;
  font-weight: 700 !important;
  color: #111111 !important;
  margin-bottom: 1px !important;
  line-height: 1.25 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.order-item-qty {
  font-size: 0.7rem !important;
  color: #6B7280 !important;
}

.order-item-price {
  font-weight: 700 !important;
  color: var(--accent-gold, #C99A3D) !important;
  font-size: 0.85rem !important;
  white-space: nowrap !important;
}

.order-breakdown-row {
  display: flex !important;
  justify-content: space-between !important;
  font-size: 0.8125rem !important;
  color: #4B5563 !important;
  margin-bottom: 5px !important;
}

.order-breakdown-row.grand-total {
  font-size: 1.15rem !important;
  font-weight: 800 !important;
  color: #111111 !important;
  padding-top: 8px !important;
  border-top: 2px solid #F0ECE4 !important;
  margin-top: 8px !important;
  margin-bottom: 12px !important;
}

.order-breakdown-row.grand-total span:last-child {
  color: var(--accent-gold, #C99A3D) !important;
}

.btn-place-order {
  width: 100% !important;
  padding: 12px 18px !important;
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
}

.order-guarantee-badges {
  margin-top: 10px !important;
  padding-top: 10px !important;
  border-top: 1px dashed #E5E0D5 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 5px !important;
}

.order-badge-row {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 0.72rem !important;
  color: #4B5563 !important;
}

.order-badge-row svg {
  width: 14px !important;
  height: 14px !important;
  color: var(--accent-gold, #C99A3D) !important;
  flex-shrink: 0 !important;
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
