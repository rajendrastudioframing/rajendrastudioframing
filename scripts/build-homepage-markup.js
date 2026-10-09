const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf-8'));

// Filter products into the 5 categories
const catFrames = products.filter(p => p.category === 'frames');
const catPersonalized = products.filter(p => p.category === 'personalized');
const catOffice = products.filter(p => p.category === 'office');
const catCustom = products.filter(p => p.category === 'custom');
const catGifts = products.filter(p => p.category === 'gifts');

console.log('Categories verification:');
console.log('Studio & Framing:', catFrames.length);
console.log('Personalized Printing:', catPersonalized.length);
console.log('Office Printing:', catOffice.length);
console.log('Custom Printing:', catCustom.length);
console.log('Photo Gifts & Keepsakes:', catGifts.length);

function renderProductCard(p) {
  const badgeHtml = p.badge 
    ? `<span class="product-badge-pill">${p.badge}</span>` 
    : `<span></span>`;

  return `
          <!-- Product Card: ${p.id} -->
          <article class="product-card" data-id="${p.id}" onclick="window.location.href='product-detail?id=${p.id}'">
            <div class="product-card-top">
              ${badgeHtml}
              <button type="button" class="product-wishlist-btn" data-wishlist-id="${p.id}" aria-label="Add to wishlist" onclick="event.stopPropagation(); toggleWishlist('${p.id}', event);" title="Add to Wishlist">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
            <div class="product-image-box">
              <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" />
            </div>
            <div class="product-capsule">
              <div class="capsule-top-row">
                <h3 class="capsule-title">
                  <a href="product-detail?id=${p.id}">${p.name}</a>
                </h3>
                <span class="capsule-price">₹${p.price}</span>
              </div>
              <div class="capsule-bottom-row">
                <button type="button" class="capsule-action-btn" data-add-to-cart data-product-id="${p.id}" onclick="event.stopPropagation(); quickAddToCart('${p.id}', event);" title="Add to Cart">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </article>`;
}

function renderCategorySection(id, eyebrow, title, desc, items, isCream = false) {
  return `
    <!-- Category Section: ${title} (${items.length} Products) -->
    <section class="section category-showcase-section ${isCream ? 'section-cream' : ''}" id="${id}">
      <div class="container">
        <div class="category-showcase-header">
          <div class="category-header-text">
            <span class="eyebrow">${eyebrow}</span>
            <h2>${title}</h2>
            <p>${desc}</p>
          </div>
          <div class="category-count-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${items.length} Products Available</span>
          </div>
        </div>

        <div class="products-grid" id="grid-${id}">
${items.map(renderProductCard).join('\n')}
        </div>
      </div>
    </section>`;
}

const categoryNavMarkup = `
    <!-- 1. Category Quick-Jump Navigation Bar (Shown Immediately on Open) -->
    <section class="category-nav-section" id="categoriesSection">
      <div class="container">
        <div class="category-nav-header">
          <span class="eyebrow">Explore Our Collections</span>
          <h2 class="category-nav-title">Shop by Category</h2>
          <p class="category-nav-subtitle">Browse through 125 handcrafted framing options, personalized drinkware, executive stationery, fine art canvas, and keepsake gifts.</p>
        </div>

        <div class="category-jump-bar" role="navigation" aria-label="Category Navigation">
          <a href="#cat-frames" class="category-jump-btn active" data-cat-target="cat-frames">
            <span class="cat-jump-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10"/></svg>
            </span>
            <span class="cat-jump-name">Studio &amp; Framing</span>
            <span class="cat-jump-count">25 Items</span>
          </a>

          <a href="#cat-personalized" class="category-jump-btn" data-cat-target="cat-personalized">
            <span class="cat-jump-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="6" x2="6" y2="4"/><line x1="10" y1="6" x2="10" y2="4"/><line x1="14" y1="6" x2="14" y2="4"/></svg>
            </span>
            <span class="cat-jump-name">Personalized Printing</span>
            <span class="cat-jump-count">25 Items</span>
          </a>

          <a href="#cat-office" class="category-jump-btn" data-cat-target="cat-office">
            <span class="cat-jump-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span class="cat-jump-name">Office Printing</span>
            <span class="cat-jump-count">25 Items</span>
          </a>

          <a href="#cat-custom" class="category-jump-btn" data-cat-target="cat-custom">
            <span class="cat-jump-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </span>
            <span class="cat-jump-name">Custom Printing</span>
            <span class="cat-jump-count">25 Items</span>
          </a>

          <a href="#cat-gifts" class="category-jump-btn" data-cat-target="cat-gifts">
            <span class="cat-jump-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            </span>
            <span class="cat-jump-name">Photo Gifts &amp; Keepsakes</span>
            <span class="cat-jump-count">25 Items</span>
          </a>
        </div>
      </div>
    </section>`;

const cat1Html = renderCategorySection(
  'cat-frames',
  'Category 01 • Studio &amp; Framing',
  'Studio &amp; Framing Collection',
  'Preserve life’s greatest milestones with diamond-beveled glass, engineered gallery polymer frames, and museum archival conservation mounts.',
  catFrames,
  false
);

const cat2Html = renderCategorySection(
  'cat-personalized',
  'Category 02 • Personalized Printing',
  'Personalized Printing Collection',
  'Customized double-wall insulated drinkware, thermal color-changing mugs, and personalized everyday lifestyle essentials.',
  catPersonalized,
  true
);

const cat3Html = renderCategorySection(
  'cat-office',
  'Category 03 • Office Printing',
  'Office &amp; Corporate Printing Collection',
  'Executive presentation folders, customized document files, tender folios, and luxury foil-stamped business stationery.',
  catOffice,
  false
);

const cat4Html = renderCategorySection(
  'cat-custom',
  'Category 04 • Custom Printing',
  'Custom Fine Art &amp; Large-Format Canvas',
  'Archival cotton gallery wraps, 6mm floating optic acrylic prints, and bespoke large-format statement wall art.',
  catCustom,
  true
);

const cat5Html = renderCategorySection(
  'cat-gifts',
  'Category 05 • Photo Gifts &amp; Keepsakes',
  'Photo Gifts &amp; Keepsakes Collection',
  'Heartfelt keepsakes, 3D laser crystals, illuminated ambient LED plaques, and personalized milestone treasures.',
  catGifts,
  false
);

const full5CategoriesHtml = `
${categoryNavMarkup}
${cat1Html}
${cat2Html}
${cat3Html}
${cat4Html}
${cat5Html}
`;

const whyChooseSectionHtml = `
    <!-- Trust & Why Choose Section (Moved below products) -->
    <section class="section section-cream" id="whyChooseSection">
      <div class="container">
        <div class="section-header reveal">
          <span class="eyebrow">Trust &amp; Heritage</span>
          <h2 class="section-title">Why Choose Rajendra Studio &amp; Framing?</h2>
          <p class="section-subtitle">
            Every frame we build and print we produce reflects our dedication to preserving your most treasured milestones with perfection and permanence.
          </p>
        </div>

        <div class="trust-grid">
          <div class="trust-item reveal reveal-delay-1" style="background: #FFFFFF; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
            <div class="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div>
              <h3 class="trust-title">Premium Quality</h3>
              <p class="trust-desc">High-quality materials and professional finishing.</p>
            </div>
          </div>

          <div class="trust-item reveal reveal-delay-2" style="background: #FFFFFF; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
            <div class="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                <line x1="3" y1="22" x2="21" y2="22"></line>
              </svg>
            </div>
            <div>
              <h3 class="trust-title">Custom Designs</h3>
              <p class="trust-desc">Personalized designs created according to customer requirements.</p>
            </div>
          </div>

          <div class="trust-item reveal reveal-delay-3" style="background: #FFFFFF; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
            <div class="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </div>
            <div>
              <h3 class="trust-title">Professional Printing</h3>
              <p class="trust-desc">Sharp, vibrant and long-lasting printing.</p>
            </div>
          </div>

          <div class="trust-item reveal reveal-delay-4" style="background: #FFFFFF; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);">
            <div class="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <div>
              <h3 class="trust-title">Customer Satisfaction</h3>
              <p class="trust-desc">Focused on quality, service and customer satisfaction.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
`;

function updateHomepageHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');

  // Replace everything from `<main id="mainContent">` up to `<!-- 6. About` or `About Rajesh Framing` / `About Rajendra Studio`
  // with `<main id="mainContent">\n` + full5CategoriesHtml + whyChooseSectionHtml
  const mainRegex = /<main id="mainContent">[\s\S]*?(<!-- 6\.\s*About)/i;

  if (mainRegex.test(html)) {
    html = html.replace(
      mainRegex,
      `<main id="mainContent">\n${full5CategoriesHtml}\n${whyChooseSectionHtml}\n\n    $1`
    );
  } else {
    console.error('Could not find main regex match in', filePath);
  }

  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Successfully updated ${filePath}`);
}

// Update both index.html and public/index.html
updateHomepageHtml(path.join(__dirname, '..', 'index.html'));
updateHomepageHtml(path.join(__dirname, '..', 'public', 'index.html'));
