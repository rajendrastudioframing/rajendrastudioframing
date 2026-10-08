/**
 * fix-mobile-cards.js
 * Comprehensive Mobile Responsive Fix for Rajesh Framing Product Cards
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

console.log('🚀 Fixing mobile product card layout and responsiveness...');

// 1. UPDATE js/catalog.js and public/js/catalog.js
const catalogJsFiles = [
  path.join(rootDir, 'js', 'catalog.js'),
  path.join(publicDir, 'js', 'catalog.js')
];

catalogJsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Clean up hardcoded inline button styles in capsule-bottom-row
    const oldRowRegex = /<div class="capsule-bottom-row"[^>]*>[\s\S]*?<\/div>/;
    const cleanRowHtml = `<div class="capsule-bottom-row">
          <button type="button" class="capsule-action-btn btn-catalog-cart" data-add-to-cart data-product-id="\${product.id}" onclick="quickAddToCart('\${product.id}', event);" title="Add to Cart">
            <span>+ Cart</span>
          </button>
          <button type="button" class="capsule-action-btn btn-catalog-buynow" onclick="event.stopPropagation(); window.quickBuyNow('\${product.id}', event);" title="Buy Now">
            <span>Buy Now</span>
          </button>
        </div>`;

    if (content.includes('capsule-bottom-row')) {
      content = content.replace(oldRowRegex, cleanRowHtml);
    }

    // Add view toggle helper function if not present
    if (!content.includes('setCatalogView')) {
      content += `
// Mobile View Toggle Handler
window.setCatalogView = function(view) {
  const grid = document.getElementById('catalogProductsGrid');
  const btnGrid = document.getElementById('viewBtnGrid');
  const btnSingle = document.getElementById('viewBtnSingle');
  if (!grid) return;

  if (view === 'single') {
    grid.classList.add('single-col-view');
    if (btnSingle) btnSingle.classList.add('active');
    if (btnGrid) btnGrid.classList.remove('active');
    localStorage.setItem('rf_catalog_view', 'single');
  } else {
    grid.classList.remove('single-col-view');
    if (btnGrid) btnGrid.classList.add('active');
    if (btnSingle) btnSingle.classList.remove('active');
    localStorage.setItem('rf_catalog_view', 'grid');
  }
};

// Restore saved view preference
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('rf_catalog_view');
  if (saved === 'single') {
    window.setCatalogView('single');
  }
});
`;
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated catalog.js: ${file}`);
  }
});

// 2. APPEND CSS FIXES TO css/components.css and public/css/components.css
const cssMobileFix = `
/* ==========================================================================
   MOBILE PRODUCT CARD OVERLAP & RESPONSIVENESS FIX (PHONE VIEWPORT)
   ========================================================================== */
@media (max-width: 680px) {
  /* Container Edge Padding */
  .catalog-layout-container {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Catalog Grid spacing */
  .catalog-main-content .products-grid,
  .products-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }

  /* Single Column View (via toggle or small screen) */
  .products-grid.single-col-view {
    grid-template-columns: 1fr !important;
    gap: 14px !important;
  }
  .products-grid.single-col-view .product-card {
    min-height: 380px !important;
  }

  /* Taller card so the product image is clear and not covered */
  .product-card {
    border-radius: 16px !important;
    min-height: 345px !important;
    height: 100% !important;
    aspect-ratio: auto !important;
  }

  .product-image-box,
  .product-image-wrap,
  .product-image-box .product-image,
  .product-image-wrap .product-image {
    border-radius: 16px !important;
  }

  /* Badges & Wishlist Top Bar */
  .product-card-top {
    top: 8px !important;
    left: 8px !important;
    right: 8px !important;
    gap: 4px !important;
  }

  .product-badge-pill,
  .product-badge-tag {
    font-size: 0.58rem !important;
    padding: 3px 7px !important;
    max-width: calc(100% - 36px) !important;
    letter-spacing: 0.3px !important;
    font-weight: 800 !important;
  }

  .product-wishlist-btn {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
  }
  .product-wishlist-btn svg {
    width: 13px !important;
    height: 13px !important;
  }

  /* Glassmorphic Capsule at Bottom */
  .product-capsule,
  .product-card-body {
    bottom: 8px !important;
    left: 8px !important;
    right: 8px !important;
    padding: 8px 10px !important;
    border-radius: 12px !important;
    gap: 3px !important;
    background: rgba(18, 20, 26, 0.92) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
  }

  /* VERTICAL STACKING: Title on top, Price on its own line */
  .capsule-top-row {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    gap: 2px !important;
    width: 100% !important;
    margin-bottom: 2px !important;
  }

  .capsule-title,
  .product-card-title {
    font-size: 0.82rem !important;
    font-weight: 700 !important;
    line-height: 1.22 !important;
    white-space: normal !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    min-height: auto !important;
    width: 100% !important;
    letter-spacing: 0.1px !important;
    margin: 0 !important;
    color: #FFFFFF !important;
  }

  .capsule-price,
  .product-price-amount {
    font-size: 0.95rem !important;
    font-weight: 800 !important;
    color: #D4AF37 !important;
    margin: 0 !important;
    display: inline-block !important;
    white-space: nowrap !important;
    line-height: 1.2 !important;
  }

  /* Swatches */
  .card-color-swatches {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 3px !important;
    margin: 2px 0 !important;
    max-height: 22px !important;
    overflow: hidden !important;
    padding: 0 !important;
  }

  .card-swatch-dot {
    width: 12px !important;
    height: 12px !important;
    flex-shrink: 0 !important;
  }

  .capsule-store-info {
    display: none !important;
  }

  /* Action Buttons */
  .capsule-bottom-row {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 5px !important;
    width: 100% !important;
    margin-top: 4px !important;
    padding-top: 4px !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  }

  .capsule-bottom-row .capsule-action-btn,
  .capsule-bottom-row .product-cart-btn {
    flex: 1 1 0 !important;
    height: 29px !important;
    min-width: 0 !important;
    max-width: 100% !important;
    padding: 0 4px !important;
    font-size: 0.68rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.2px !important;
    border-radius: 9999px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    white-space: nowrap !important;
    text-transform: uppercase !important;
  }

  .btn-catalog-cart {
    background: linear-gradient(135deg, #C99A3D 0%, #A87A24 100%) !important;
    color: #FFFFFF !important;
    border: none !important;
    box-shadow: 0 2px 8px rgba(201, 154, 61, 0.35) !important;
  }

  .btn-catalog-buynow {
    background: #111111 !important;
    border: 1px solid #C99A3D !important;
    color: #FFFFFF !important;
  }

  /* Catalog Results Header with View Toggle */
  .catalog-results-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 0 2px 10px !important;
    margin-bottom: 12px !important;
    gap: 8px !important;
  }

  .catalog-view-toggle {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    background: #F3F4F6 !important;
    padding: 3px !important;
    border-radius: 8px !important;
    border: 1px solid #E5E7EB !important;
  }

  .catalog-view-toggle .view-btn {
    width: 28px !important;
    height: 28px !important;
    border: none !important;
    background: transparent !important;
    border-radius: 6px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #6B7280 !important;
    cursor: pointer !important;
    padding: 0 !important;
    transition: all 0.2s ease !important;
  }

  .catalog-view-toggle .view-btn.active {
    background: #FFFFFF !important;
    color: #111827 !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }
}

/* Safe bottom clearance for catalog & products on mobile so floating WhatsApp NEVER covers cards */
@media (max-width: 768px) {
  .catalog-main-content,
  .catalog-layout-container,
  #catalogProductsGrid,
  .section-cream {
    padding-bottom: 96px !important;
  }
}

/* Fallback for ultra-compact devices (<= 360px) */
@media (max-width: 360px) {
  .catalog-main-content .products-grid,
  .products-grid {
    grid-template-columns: 1fr !important;
    gap: 14px !important;
  }
  .product-card {
    min-height: 330px !important;
  }
}
`;

const componentsCssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(publicDir, 'css', 'components.css')
];

componentsCssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('MOBILE PRODUCT CARD OVERLAP & RESPONSIVENESS FIX')) {
      content += '\n' + cssMobileFix;
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated components.css: ${file}`);
    }
  }
});

// 3. UPDATE products.html AND public/products.html WITH VIEW TOGGLE
const productsHtmlFiles = [
  path.join(rootDir, 'products.html'),
  path.join(publicDir, 'products.html')
];

const toggleHtml = `<div class="catalog-results-header">
              <div class="results-left">
                <span id="catalogResultsCount" class="results-count-text">
                  Showing all products
                </span>
                <span class="custom-sizes-pill" style="display: block; font-size: 0.75rem; margin-top: 2px;">
                  ✓ Custom Sizes &amp; Bulk Orders Welcome
                </span>
              </div>
              <div class="catalog-view-toggle" id="catalogViewToggle" aria-label="Toggle grid layout">
                <button type="button" class="view-btn active" id="viewBtnGrid" title="2 Columns" onclick="setCatalogView('grid')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                <button type="button" class="view-btn" id="viewBtnSingle" title="Single Column" onclick="setCatalogView('single')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="6" rx="1"></rect><rect x="3" y="14" width="18" height="6" rx="1"></rect></svg>
                </button>
              </div>
            </div>`;

productsHtmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('catalogViewToggle')) {
      content = content.replace(/<div class="catalog-results-header">[\s\S]*?<\/div>/, toggleHtml);
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated products.html with view toggle: ${file}`);
    }
  }
});

console.log('🎉 Mobile product card fixes successfully applied!');
