const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('--- Step 1: Updating scripts/build-homepage-markup.js ---');
const builderPath = path.join(rootDir, 'scripts', 'build-homepage-markup.js');
let builderContent = fs.readFileSync(builderPath, 'utf-8');

const newRenderProductCardFn = `function renderProductCard(p) {
  const badgeHtml = p.badge 
    ? \`<span class="product-badge-pill">\${p.badge}</span>\` 
    : \`<span></span>\`;

  const originalPrice = Math.round(p.price * 1.25);
  const ratingVal = p.rating || 4.9;
  const reviewsCount = p.reviewsCount || (40 + (p.id.length * 7) % 80);
  const categoryLabel = p.categoryLabel || 'Studio Craft';

  return \`
          <!-- Product Card: \${p.id} -->
          <article class="product-card" data-id="\${p.id}" onclick="window.location.href='product-detail?id=\${p.id}'">
            <div class="product-card-top">
              \${badgeHtml}
              <button type="button" class="product-wishlist-btn" data-wishlist-id="\${p.id}" aria-label="Add to wishlist" onclick="event.stopPropagation(); toggleWishlist('\${p.id}', event);" title="Add to Wishlist">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
            <div class="product-image-box">
              <img src="\${p.image}" alt="\${p.name}" class="product-image" loading="lazy" />
            </div>
            <div class="product-capsule product-card-body">
              <div class="product-card-meta">
                <span class="product-card-category">\${categoryLabel}</span>
                <div class="product-card-rating">
                  <span class="rating-star">★</span>
                  <span class="rating-val">\${ratingVal}</span>
                  <span class="rating-count">(\${reviewsCount})</span>
                </div>
              </div>
              <h3 class="capsule-title product-card-title">
                <a href="product-detail?id=\${p.id}">\${p.name}</a>
              </h3>
              <div class="product-card-price-row capsule-price-row">
                <span class="capsule-price product-card-price">₹\${p.price}</span>
                <span class="product-card-mrp">₹\${originalPrice}</span>
                <span class="product-card-discount">20% OFF</span>
              </div>
              <div class="capsule-bottom-row product-card-actions">
                <button type="button" class="capsule-action-btn product-add-cart-btn" data-add-to-cart data-product-id="\${p.id}" onclick="event.stopPropagation(); quickAddToCart('\${p.id}', event);" title="Add to Cart">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </article>\`;
}`;

builderContent = builderContent.replace(
  /function renderProductCard\(p\) \{[\s\S]*?\n\}/,
  newRenderProductCardFn
);
fs.writeFileSync(builderPath, builderContent, 'utf-8');
console.log('Updated scripts/build-homepage-markup.js');

console.log('--- Step 2: Updating css/components.css and public/css/components.css ---');
function cleanComponentsCss(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace lines 131 to 610 (EDITORIAL FULL-BLEED LUXURY PRODUCT CARD) with neutral passthrough
  const editorialRegex = /\/\* ==========================================================================\s+EDITORIAL FULL-BLEED LUXURY PRODUCT CARD[\s\S]*?\/\* ==========================================================================\s+PRODUCT SHOWCASE SLIDER/i;
  if (editorialRegex.test(content)) {
    content = content.replace(
      editorialRegex,
      `/* ==========================================================================
   PRODUCT CARD BASE ARCHITECTURE (Styling handled in ecom-ui.css)
   ========================================================================== */

/* ==========================================================================
   PRODUCT SHOWCASE SLIDER`
    );
  }

  // Replace obsolete mobile dark card block
  const mobileDarkRegex = /\/\* ==========================================================================\s+MOBILE PRODUCT CARD COMPACT[\s\S]*?\/\* Safe clearance on mobile/i;
  if (mobileDarkRegex.test(content)) {
    content = content.replace(
      mobileDarkRegex,
      `/* Safe clearance on mobile`
    );
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Cleaned', filePath);
}

cleanComponentsCss(path.join(rootDir, 'css', 'components.css'));
cleanComponentsCss(path.join(rootDir, 'public', 'css', 'components.css'));

console.log('--- Step 3: Updating css/ecom-ui.css and public/css/ecom-ui.css ---');
const luxuryCardsCss = `/* --- 6. MODERN ATTRACTIVE LUXURY PRODUCT CARD STYLES --- */
.product-card {
  display: flex !important;
  flex-direction: column !important;
  background: #FFFFFF !important;
  border-radius: 16px !important;
  border: 1px solid #E5E7EB !important;
  overflow: hidden !important;
  position: relative !important;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease !important;
  cursor: pointer !important;
  height: 100% !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
  box-sizing: border-box !important;
  min-height: unset !important;
  aspect-ratio: unset !important;
}

.product-card:hover {
  transform: translateY(-6px) !important;
  box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.1), 0 4px 14px -2px rgba(201, 154, 61, 0.18) !important;
  border-color: rgba(201, 154, 61, 0.45) !important;
}

/* Card Top Badges & Actions Overlay */
.product-card-top {
  position: absolute !important;
  top: 10px !important;
  left: 10px !important;
  right: 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  z-index: 5 !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.product-card-top > * {
  pointer-events: auto !important;
}

.product-badge-pill {
  display: inline-flex !important;
  align-items: center !important;
  padding: 4px 10px !important;
  font-size: 0.65rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  border-radius: 9999px !important;
  background: rgba(17, 17, 17, 0.85) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  color: #F59E0B !important;
  border: 1px solid rgba(245, 158, 11, 0.35) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  line-height: 1.2 !important;
}

.product-wishlist-btn {
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #6B7280 !important;
  cursor: pointer !important;
  transition: all 0.22s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  margin-left: auto !important;
  padding: 0 !important;
}

.product-wishlist-btn:hover {
  transform: scale(1.14) !important;
  color: #EF4444 !important;
  background: #FFFFFF !important;
  border-color: rgba(239, 68, 68, 0.2) !important;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25) !important;
}

.product-wishlist-btn.active {
  color: #EF4444 !important;
  background: #FFFFFF !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.product-wishlist-btn.active svg {
  fill: #EF4444 !important;
}

/* Clear Product Image Area */
.product-image-box,
.product-image-wrap {
  position: relative !important;
  width: 100% !important;
  aspect-ratio: 1 / 1 !important;
  background: #F9FAFB !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  inset: unset !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 16px 16px 0 0 !important;
  height: auto !important;
  min-height: unset !important;
  max-height: unset !important;
  border: none !important;
}

.product-image-box img,
.product-image-box .product-image,
.product-image-wrap img,
.product-image-wrap .product-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  border-radius: 16px 16px 0 0 !important;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.product-card:hover .product-image-box img,
.product-card:hover .product-image-wrap img {
  transform: scale(1.06) !important;
}

.product-image-overlay {
  display: none !important; /* Never block product imagery with dark overlays */
}

/* Card Body (Below Image, Clean White, Luxury Layout) */
.product-capsule,
.product-card-body {
  position: relative !important;
  inset: unset !important;
  top: unset !important;
  left: unset !important;
  right: unset !important;
  bottom: unset !important;
  width: 100% !important;
  padding: 14px 14px 16px !important;
  background: #FFFFFF !important;
  border-radius: 0 0 16px 16px !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  justify-content: space-between !important;
  gap: 8px !important;
  box-sizing: border-box !important;
  box-shadow: none !important;
  border: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transform: none !important;
}

.product-card:hover .product-capsule,
.product-card:hover .product-card-body {
  background: #FFFFFF !important;
  border: none !important;
  transform: none !important;
}

/* Card Metadata (Category Eyebrow + Rating) */
.product-card-meta {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 6px !important;
  margin-bottom: 2px !important;
}

.product-card-category {
  font-size: 0.6875rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.75px !important;
  color: #9CA3AF !important;
}

.product-card-rating {
  display: inline-flex !important;
  align-items: center !important;
  gap: 3px !important;
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  color: #D97706 !important;
}

.product-card-rating .rating-star {
  color: #F59E0B !important;
}

.product-card-rating .rating-count {
  color: #9CA3AF !important;
  font-weight: 500 !important;
}

/* Card Title (2-Line Clamp, Elegant Typography) */
.capsule-title,
.product-card-title {
  font-family: var(--font-heading, 'DM Sans', sans-serif) !important;
  font-size: 0.9375rem !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
  color: #111827 !important;
  margin: 0 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  min-height: 2.65em !important;
  word-break: break-word !important;
  white-space: normal !important;
  text-align: left !important;
}

.capsule-title a,
.product-card-title a {
  color: #111827 !important;
  text-decoration: none !important;
  transition: color 0.2s ease !important;
}

.product-card:hover .capsule-title a,
.product-card:hover .product-card-title a {
  color: #C99A3D !important;
}

/* Price & Discount Row */
.product-card-price-row,
.capsule-price-row {
  display: flex !important;
  align-items: baseline !important;
  gap: 6px !important;
  flex-wrap: wrap !important;
  margin: 2px 0 !important;
}

.capsule-price,
.product-card-price,
.product-price-amount {
  font-family: var(--font-heading, 'DM Sans', sans-serif) !important;
  font-size: 1.125rem !important;
  font-weight: 800 !important;
  color: #111827 !important;
  letter-spacing: -0.01em !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

.product-card-mrp {
  font-size: 0.8125rem !important;
  color: #9CA3AF !important;
  text-decoration: line-through !important;
  font-weight: 500 !important;
}

.product-card-discount {
  font-size: 0.6875rem !important;
  font-weight: 700 !important;
  color: #059669 !important;
  background: rgba(5, 150, 105, 0.1) !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
}

/* Card Actions (Add to Cart) */
.capsule-bottom-row,
.product-card-actions {
  margin-top: 4px !important;
  display: flex !important;
  gap: 8px !important;
  width: 100% !important;
  border-top: none !important;
  padding-top: 0 !important;
}

.capsule-action-btn,
.product-add-cart-btn,
.product-cart-btn {
  flex: 1 !important;
  width: 100% !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  padding: 10px 14px !important;
  border-radius: 10px !important;
  font-family: var(--font-heading, 'DM Sans', sans-serif) !important;
  font-size: 0.8125rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.2px !important;
  background: #111827 !important;
  color: #FFFFFF !important;
  border: 1px solid #111827 !important;
  cursor: pointer !important;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
  text-transform: none !important;
  white-space: nowrap !important;
  height: auto !important;
  box-sizing: border-box !important;
}

.capsule-action-btn:hover,
.product-add-cart-btn:hover,
.product-cart-btn:hover {
  background: #C99A3D !important;
  border-color: #C99A3D !important;
  color: #FFFFFF !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(201, 154, 61, 0.35) !important;
}

.capsule-action-btn:active,
.product-add-cart-btn:active,
.product-cart-btn:active {
  transform: scale(0.97) !important;
}

/* Dual button support (Catalog: Cart + Buy Now) */
.btn-catalog-cart {
  background: #C99A3D !important;
  border-color: #C99A3D !important;
  color: #FFFFFF !important;
}
.btn-catalog-cart:hover {
  background: #B6862B !important;
  border-color: #B6862B !important;
}

.btn-catalog-buynow {
  background: #111827 !important;
  border-color: #111827 !important;
  color: #FFFFFF !important;
}
.btn-catalog-buynow:hover {
  background: #000000 !important;
  border-color: #000000 !important;
}

/* Swatches styling */
.card-color-swatches {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  margin: 2px 0 !important;
}
.card-swatch-dot {
  width: 14px !important;
  height: 14px !important;
  border-radius: 50% !important;
  border: 1.5px solid #E5E7EB !important;
  cursor: pointer !important;
  transition: transform 0.15s ease !important;
}
.card-swatch-dot:hover, .card-swatch-dot.active {
  transform: scale(1.2) !important;
  border-color: #C99A3D !important;
}

/* Mobile Screens (<= 767px) */
@media (max-width: 767px) {
  .product-card {
    border-radius: 13px !important;
  }
  .product-image-box,
  .product-image-wrap {
    aspect-ratio: 1 / 1 !important;
    height: auto !important;
    max-height: unset !important;
    min-height: unset !important;
    border-radius: 13px 13px 0 0 !important;
  }
  .product-image-box img,
  .product-image-wrap img {
    border-radius: 13px 13px 0 0 !important;
  }
  .product-card-top {
    top: 6px !important;
    left: 6px !important;
    right: 6px !important;
  }
  .product-badge-pill {
    font-size: 0.58rem !important;
    padding: 3px 7px !important;
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
  .product-capsule,
  .product-card-body {
    padding: 10px 10px 12px !important;
    gap: 6px !important;
    border-radius: 0 0 13px 13px !important;
  }
  .product-card-meta {
    margin-bottom: 0 !important;
  }
  .product-card-category {
    font-size: 0.6rem !important;
  }
  .product-card-rating {
    font-size: 0.65rem !important;
  }
  .capsule-title,
  .product-card-title {
    font-size: 0.8125rem !important;
    line-height: 1.3 !important;
    min-height: 2.45em !important;
  }
  .capsule-price,
  .product-card-price,
  .product-price-amount {
    font-size: 0.9375rem !important;
  }
  .product-card-mrp {
    font-size: 0.72rem !important;
  }
  .product-card-discount {
    font-size: 0.625rem !important;
    padding: 1px 4px !important;
  }
  .capsule-action-btn,
  .product-add-cart-btn,
  .product-cart-btn,
  .btn-catalog-cart,
  .btn-catalog-buynow {
    padding: 8px 8px !important;
    font-size: 0.75rem !important;
    border-radius: 8px !important;
    height: auto !important;
  }
}
`;

function updateEcomUiCss(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const section6Regex = /\/\* --- 6\. MODERN ATTRACTIVE PRODUCT CARD STYLES --- \*\/[\s\S]*$/;
  if (section6Regex.test(content)) {
    content = content.replace(section6Regex, luxuryCardsCss);
  } else {
    content += '\n\n' + luxuryCardsCss;
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated', filePath);
}

updateEcomUiCss(path.join(rootDir, 'css', 'ecom-ui.css'));
updateEcomUiCss(path.join(rootDir, 'public', 'css', 'ecom-ui.css'));

console.log('--- Step 4: Updating js/catalog.js and public/js/catalog.js ---');
function updateCatalogJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Enhance renderCards output in catalog.js
  const cardReturnRegex = /return `\s*<article class="product-card"[\s\S]*?<\/article>\s*`/g;
  
  content = content.replace(cardReturnRegex, (match) => {
    return `return \`
    <article class="product-card" data-id="\${product.id}" data-selected-finish-id="\${defaultFinish ? defaultFinish.id : ''}" data-selected-finish-name="\${defaultFinish ? defaultFinish.name : ''}" data-selected-finish-img="\${initialCardImg}" onclick="window.location.href='product-detail?id=\${product.id}\${defaultFinish ? \`&finish=\${defaultFinish.id}\` : ''}'">
      <div class="product-card-top">
        \${product.badge ? \`<span class="product-badge-pill">\${product.badge}</span>\` : '<span></span>'}
        <button type="button" class="product-wishlist-btn \${wishActive ? 'active' : ''}" data-wishlist-id="\${product.id}" aria-label="Add to wishlist" onclick="toggleWishlist('\${product.id}', event);" title="Add to Wishlist">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="product-image-box">
        <img src="\${initialCardImg}" alt="\${product.name}" class="product-image" loading="lazy" />
      </div>

      <div class="product-capsule product-card-body">
        <div class="product-card-meta">
          <span class="product-card-category">\${product.categoryLabel || 'Studio Craft'}</span>
          <div class="product-card-rating">
            <span class="rating-star">★</span>
            <span class="rating-val">\${product.rating || 4.9}</span>
            <span class="rating-count">(\${product.reviewsCount || 85})</span>
          </div>
        </div>
        <h3 class="capsule-title product-card-title">
          <a href="product-detail?id=\${product.id}\${defaultFinish ? \`&finish=\${defaultFinish.id}\` : ''}">\${product.name}</a>
        </h3>
        \${finishesHtml}
        <div class="product-card-price-row capsule-price-row">
          <span class="capsule-price product-card-price">\${priceFormatted}</span>
          <span class="product-card-mrp">₹\${Math.round((product.price || 500) * 1.25)}</span>
          <span class="product-card-discount">20% OFF</span>
        </div>
        <div class="capsule-bottom-row product-card-actions">
          <button type="button" class="capsule-action-btn btn-catalog-cart" data-add-to-cart data-product-id="\${product.id}" onclick="quickAddToCart('\${product.id}', event);" title="Add to Cart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>+ Cart</span>
          </button>
          <button type="button" class="capsule-action-btn btn-catalog-buynow" onclick="event.stopPropagation(); window.quickBuyNow('\${product.id}', event);" title="Buy Now">
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </article>
  \``;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated', filePath);
}

updateCatalogJs(path.join(rootDir, 'js', 'catalog.js'));
updateCatalogJs(path.join(rootDir, 'public', 'js', 'catalog.js'));

console.log('--- Step 5: Updating js/product-detail.js and public/js/product-detail.js ---');
function updateProductDetailJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(
    /<article class="product-card"[\s\S]*?<\/article>/g,
    (match) => {
      if (!match.includes('product-detail?id=${p.id}')) return match;
      return `<article class="product-card" data-id="\${p.id}" onclick="window.location.href='product-detail?id=\${p.id}'">
      <div class="product-card-top">
        \${p.badge ? \`<span class="product-badge-pill">\${p.badge}</span>\` : '<span></span>'}
        <button type="button" class="product-wishlist-btn \${isWishlisted ? 'active' : ''}" aria-label="Add to wishlist" onclick="event.stopPropagation(); if (typeof toggleWishlist === 'function') { toggleWishlist('\${p.id}', event); } else { this.classList.toggle('active'); }">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="product-image-box">
        <img src="\${p.image}" alt="\${p.name}" class="product-image" loading="lazy" />
      </div>

      <div class="product-capsule product-card-body">
        <div class="product-card-meta">
          <span class="product-card-category">\${p.categoryLabel || 'Studio Craft'}</span>
          <div class="product-card-rating">
            <span class="rating-star">★</span>
            <span class="rating-val">\${p.rating || 4.9}</span>
          </div>
        </div>
        <h4 class="capsule-title product-card-title">
          <a href="product-detail?id=\${p.id}">\${p.name}</a>
        </h4>
        <div class="product-card-price-row capsule-price-row">
          <span class="capsule-price product-card-price">\${priceFormatted}</span>
        </div>
        <div class="capsule-bottom-row product-card-actions">
          <button type="button" class="capsule-action-btn product-add-cart-btn" onclick="event.stopPropagation(); window.location.href='product-detail?id=\${p.id}'" style="width: 100%; justify-content: center;">
            <span>View Details</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </article>`;
    }
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated', filePath);
}

updateProductDetailJs(path.join(rootDir, 'js', 'product-detail.js'));
updateProductDetailJs(path.join(rootDir, 'public', 'js', 'product-detail.js'));

console.log('--- Step 6: Regenerating homepage HTML ---');
require('./build-homepage-markup.js');

console.log('--- Product card redesign script completed successfully! ---');
