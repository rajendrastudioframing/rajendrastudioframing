const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update css/components.css and public/css/components.css
['css/components.css', 'public/css/components.css'].forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // Replace .catalog-main-content .products-grid
  content = content.replace(
    /\.catalog-main-content \.products-grid\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(4,\s*1fr\)\s*!important;\s*gap:\s*16px\s*!important;\s*width:\s*100%;\s*\}/g,
    `.catalog-main-content .products-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  gap: 12px !important;
  width: 100%;
}`
  );

  content = content.replace(
    /\.products-grid\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(4,\s*1fr\);\s*gap:\s*16px;\s*\}/g,
    `.products-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}`
  );

  content = content.replace(
    /@media \(max-width: 1200px\) \{\s*\.catalog-main-content \.products-grid,\s*\.products-grid \{\s*grid-template-columns:\s*repeat\(3,\s*1fr\)\s*!important;\s*gap:\s*16px\s*!important;\s*\}\s*\}/g,
    `@media (max-width: 991px) and (min-width: 768px) {
  .catalog-main-content .products-grid,
  .products-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 12px !important;
  }
}`
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${relPath}`);
});

// 2. Update css/ecom-ui.css and public/css/ecom-ui.css
const COMPACT_STYLES = `
/* --- 5. RESPONSIVE PRODUCT LAYOUT: 5 CARDS PER ROW ON DESKTOP --- */
.products-grid,
.catalog-main-content .products-grid,
#catalogProductsGrid {
  display: grid !important;
  width: 100% !important;
}

/* Desktop/laptop (>= 992px): 5 product cards per row */
@media (min-width: 992px) {
  .products-grid,
  .catalog-main-content .products-grid,
  #catalogProductsGrid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 12px !important;
  }
}

/* Tablet (768px - 991px): 3 product cards per row */
@media (min-width: 768px) and (max-width: 991px) {
  .products-grid,
  .catalog-main-content .products-grid,
  #catalogProductsGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 12px !important;
  }
}

/* Mobile phones (<= 767px): 2 product cards per row */
@media (max-width: 767px) {
  .products-grid,
  .catalog-main-content .products-grid,
  #catalogProductsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
}

/* Single column toggle on mobile */
.products-grid.single-col-view,
#catalogProductsGrid.single-col-view {
  grid-template-columns: 1fr !important;
  gap: 12px !important;
}

/* --- COMPACT SMALL PRODUCT CARD DESIGN (5 CARDS PER ROW) --- */
.product-card {
  border-radius: 12px !important;
}

.product-image-box,
.product-image-wrap {
  border-radius: 12px 12px 0 0 !important;
}

.product-image-box img,
.product-image-box .product-image,
.product-image-wrap img,
.product-image-wrap .product-image {
  border-radius: 12px 12px 0 0 !important;
}

.product-card-top {
  top: 7px !important;
  left: 7px !important;
  right: 7px !important;
}

.product-badge-pill {
  padding: 2.5px 7px !important;
  font-size: 0.58rem !important;
  letter-spacing: 0.3px !important;
}

.product-wishlist-btn {
  width: 28px !important;
  height: 28px !important;
}

.product-wishlist-btn svg {
  width: 13px !important;
  height: 13px !important;
}

.product-capsule,
.product-card-body {
  padding: 10px 10px 12px !important;
  border-radius: 0 0 12px 12px !important;
  gap: 5px !important;
}

.product-card-meta {
  gap: 4px !important;
  margin-bottom: 0 !important;
}

.product-card-category {
  font-size: 0.625rem !important;
  letter-spacing: 0.4px !important;
}

.product-card-rating {
  font-size: 0.68rem !important;
  gap: 2px !important;
}

.product-card-rating .rating-star {
  font-size: 0.7rem !important;
}

.product-card-rating .rating-count {
  font-size: 0.65rem !important;
}

.capsule-title,
.product-card-title {
  font-family: var(--font-heading, 'DM Sans', sans-serif) !important;
  font-size: 0.8125rem !important; /* 13px */
  font-weight: 700 !important;
  line-height: 1.3 !important;
  min-height: 2.25em !important;
}

.card-color-swatches {
  gap: 4px !important;
  margin: 1px 0 !important;
}

.card-swatch-dot {
  width: 11px !important;
  height: 11px !important;
}

.product-card-price-row,
.capsule-price-row {
  gap: 5px !important;
  margin: 1px 0 !important;
}

.capsule-price,
.product-card-price,
.product-price-amount {
  font-size: 0.9375rem !important; /* 15px */
}

.product-card-mrp {
  font-size: 0.72rem !important;
}

.product-card-discount {
  font-size: 0.62rem !important;
  padding: 1px 5px !important;
  border-radius: 3px !important;
}

.capsule-bottom-row,
.product-card-actions {
  gap: 5px !important;
  margin-top: 3px !important;
}

.capsule-action-btn,
.product-add-cart-btn,
.product-cart-btn {
  padding: 7px 8px !important;
  font-size: 0.72rem !important;
  border-radius: 8px !important;
  gap: 4px !important;
}

.capsule-action-btn svg,
.product-add-cart-btn svg,
.product-cart-btn svg {
  width: 12px !important;
  height: 12px !important;
}
`;

['css/ecom-ui.css', 'public/css/ecom-ui.css'].forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // Replace Section 5 Layout
  const layoutPattern = /\/\* --- 5\. RESPONSIVE PRODUCT LAYOUT[\s\S]*?@media \(max-width: 767px\) \{\s*\.products-grid \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important;\s*gap: 10px !important;\s*\}\s*\}/;
  
  if (layoutPattern.test(content)) {
    content = content.replace(layoutPattern, COMPACT_STYLES);
  } else {
    // Append to end of file
    content += `\n${COMPACT_STYLES}\n`;
  }

  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${relPath} with compact 5-column layout`);
});

console.log('=== All CSS files updated to 5 cards per row with compact styling ===');
