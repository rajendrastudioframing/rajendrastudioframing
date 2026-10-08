const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const NEW_MOBILE_CSS = `
/* ==========================================================================
   MOBILE PRODUCT CARD COMPACT & PROPERLY ARRANGED LAYOUT (PHONE VIEWPORT)
   ========================================================================== */
@media (max-width: 680px) {
  /* Container Edge Padding */
  .catalog-layout-container {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Catalog Grid: strict 2-column layout with clear 12px gap */
  .catalog-main-content .products-grid,
  .products-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 12px !important;
    width: 100% !important;
  }

  /* Single Column View (when user toggles to ☰) */
  .products-grid.single-col-view {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }

  /* Compact Card: Integrated Photo (Top) + Clean Details (Bottom) */
  .product-card {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
    min-height: unset !important;
    max-height: unset !important;
    aspect-ratio: unset !important;
    border-radius: 14px !important;
    background: #14161E !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22) !important;
    overflow: hidden !important;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    cursor: pointer !important;
  }

  .product-card:hover {
    transform: none !important;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
    border-color: rgba(201, 154, 61, 0.35) !important;
  }

  /* Top Overlay: Badge (left) & Wishlist Heart (right) directly on photo */
  .product-card-top {
    position: absolute !important;
    top: 6px !important;
    left: 6px !important;
    right: 6px !important;
    z-index: 5 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: none !important;
  }

  .product-card-top > * {
    pointer-events: auto !important;
  }

  .product-badge-pill,
  .product-badge-tag {
    font-size: 0.55rem !important;
    font-weight: 800 !important;
    letter-spacing: 0.3px !important;
    padding: 3px 7px !important;
    border-radius: 9999px !important;
    background: rgba(18, 20, 26, 0.88) !important;
    color: #E6C687 !important;
    border: 1px solid rgba(201, 154, 61, 0.3) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
    max-width: calc(100% - 32px) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    line-height: 1.1 !important;
    text-transform: uppercase !important;
  }

  .product-wishlist-btn {
    width: 26px !important;
    height: 26px !important;
    min-width: 26px !important;
    border-radius: 50% !important;
    background: rgba(18, 20, 26, 0.88) !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .product-wishlist-btn svg {
    width: 12px !important;
    height: 12px !important;
  }

  /* Photo Box: Clear, Unobstructed, Natural Height at TOP of Card */
  .product-image-box,
  .product-image-wrap {
    position: relative !important;
    inset: unset !important;
    top: unset !important;
    left: unset !important;
    right: unset !important;
    bottom: unset !important;
    width: 100% !important;
    height: 140px !important;
    min-height: 140px !important;
    max-height: 140px !important;
    aspect-ratio: unset !important;
    overflow: hidden !important;
    border-radius: 13px 13px 0 0 !important;
    background: #0D0E13 !important;
    margin: 0 !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    display: block !important;
    z-index: 1 !important;
  }

  .product-image-box .product-image,
  .product-image-wrap .product-image {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    display: block !important;
    border-radius: 13px 13px 0 0 !important;
    transform: none !important;
    transition: transform 0.3s ease !important;
  }

  /* No dark black gradient overlay over the image on mobile */
  .product-image-overlay {
    display: none !important;
  }

  /* Card Body (Capsule converted to natural bottom card details) */
  .product-capsule,
  .product-card-body {
    position: relative !important;
    inset: unset !important;
    top: unset !important;
    left: unset !important;
    right: unset !important;
    bottom: unset !important;
    width: 100% !important;
    border-radius: 0 0 13px 13px !important;
    background: #14161E !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 8px 8px 10px 8px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    gap: 4px !important;
    box-sizing: border-box !important;
    flex: 1 1 auto !important;
    transform: none !important;
    z-index: 2 !important;
  }

  /* Top Info: Clean Title and Bold Price */
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
    font-size: 0.78rem !important;
    font-weight: 700 !important;
    line-height: 1.22 !important;
    color: #FFFFFF !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    width: 100% !important;
    letter-spacing: 0.1px !important;
    margin: 0 !important;
    display: block !important;
  }

  .capsule-title a,
  .product-card-title a {
    color: #FFFFFF !important;
    text-decoration: none !important;
  }

  .capsule-price,
  .product-price-amount {
    font-size: 0.88rem !important;
    font-weight: 800 !important;
    color: #D4AF37 !important;
    letter-spacing: -0.01em !important;
    margin: 0 !important;
    display: inline-block !important;
    line-height: 1.15 !important;
  }

  /* Color Finish Dots */
  .card-color-swatches {
    display: flex !important;
    align-items: center !important;
    gap: 3px !important;
    margin: 1px 0 2px 0 !important;
    max-height: 16px !important;
    overflow: hidden !important;
    padding: 0 !important;
  }

  .card-swatch-dot {
    width: 10px !important;
    height: 10px !important;
    border-radius: 50% !important;
    border: 1px solid #FFFFFF !important;
    flex-shrink: 0 !important;
    padding: 0 !important;
  }

  .card-swatch-dot.active {
    outline: 1.5px solid #C99A3D !important;
    outline-offset: 1px !important;
  }

  .capsule-store-info {
    display: none !important;
  }

  /* Action Buttons: Neatly fitted, readable, no overflow */
  .capsule-bottom-row {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 4px !important;
    width: 100% !important;
    margin-top: 3px !important;
    padding-top: 0 !important;
  }

  .capsule-bottom-row .capsule-action-btn,
  .capsule-bottom-row .product-cart-btn,
  .btn-catalog-cart,
  .btn-catalog-buynow {
    flex: 1 1 0 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 27px !important;
    padding: 0 4px !important;
    font-size: 0.64rem !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
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
    box-shadow: 0 2px 6px rgba(201, 154, 61, 0.3) !important;
  }

  .btn-catalog-buynow {
    background: #111111 !important;
    border: 1px solid #C99A3D !important;
    color: #E6C687 !important;
  }

  /* Single Column Layout (when user clicks ☰) */
  .products-grid.single-col-view .product-card {
    border-radius: 16px !important;
  }

  .products-grid.single-col-view .product-image-box,
  .products-grid.single-col-view .product-image-wrap {
    height: 220px !important;
    min-height: 220px !important;
    max-height: 220px !important;
    border-radius: 15px 15px 0 0 !important;
  }

  .products-grid.single-col-view .capsule-title {
    font-size: 0.95rem !important;
  }

  .products-grid.single-col-view .capsule-price {
    font-size: 1.1rem !important;
  }

  .products-grid.single-col-view .card-swatch-dot {
    width: 14px !important;
    height: 14px !important;
  }

  .products-grid.single-col-view .capsule-bottom-row .capsule-action-btn {
    height: 36px !important;
    font-size: 0.76rem !important;
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

/* Safe clearance on mobile: floating WhatsApp will NEVER overlap bottom cards */
@media (max-width: 768px) {
  .catalog-main-content,
  .catalog-layout-container,
  #catalogProductsGrid,
  .section-cream {
    padding-bottom: 110px !important;
  }

  .floating-actions-wrap {
    bottom: 14px !important;
    right: 12px !important;
  }
}

/* Fallback for ultra-narrow phones (<= 360px) */
@media (max-width: 360px) {
  .catalog-main-content .products-grid,
  .products-grid {
    grid-template-columns: 1fr !important;
    gap: 14px !important;
  }
  .product-image-box,
  .product-image-wrap {
    height: 190px !important;
    min-height: 190px !important;
    max-height: 190px !important;
  }
}
`;

// Update components.css files
const componentsPaths = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(publicDir, 'css', 'components.css')
];

componentsPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let css = fs.readFileSync(filePath, 'utf8');
    const marker = '/* ==========================================================================\r\n   MOBILE PRODUCT CARD OVERLAP & RESPONSIVENESS FIX (PHONE VIEWPORT)';
    const altMarker = '/* ==========================================================================\n   MOBILE PRODUCT CARD OVERLAP & RESPONSIVENESS FIX (PHONE VIEWPORT)';
    
    let idx = css.indexOf(marker);
    if (idx === -1) {
      idx = css.indexOf(altMarker);
    }

    if (idx !== -1) {
      css = css.substring(0, idx).trimEnd() + '\n\n' + NEW_MOBILE_CSS;
    } else {
      css = css.trimEnd() + '\n\n' + NEW_MOBILE_CSS;
    }

    fs.writeFileSync(filePath, css, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  }
});

// Update cache busting query in all HTML files
const htmlFiles = [
  'index.html',
  'products.html',
  'product-detail.html',
  'about.html',
  'contact.html',
  'checkout.html',
  'track-order.html'
];

htmlFiles.forEach(file => {
  const targets = [
    path.join(rootDir, file),
    path.join(publicDir, file)
  ];

  targets.forEach(targetPath => {
    if (fs.existsSync(targetPath)) {
      let content = fs.readFileSync(targetPath, 'utf8');
      content = content.replace(/components\.css(\?v=[a-zA-Z0-9_-]+)?/g, 'components.css?v=card_compact_v3');
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`✅ Cache-busted ${targetPath}`);
    }
  });
});

console.log('🎉 Done applying compact mobile cards!');
