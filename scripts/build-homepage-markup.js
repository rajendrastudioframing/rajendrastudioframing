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
    <!-- Category Quick-Jump Navigation Bar -->
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

// Desktop Top Navigation (5 items)
const desktopNavMenuHtml = `
        <!-- Desktop Navigation Menu (5 Items Required) -->
        <ul class="nav-menu">
          <li>
            <a href="#categoriesSection" class="nav-link active" title="Categories">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>
              <span>Categories</span>
            </a>
          </li>
          <li>
            <a href="products" class="nav-link" title="Products">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>Products</span>
            </a>
          </li>
          <li>
            <button type="button" class="nav-link nav-item-btn" onclick="openCartDrawer()" title="Cart" aria-label="View shopping cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Cart</span>
              <span class="cart-badge navbar-cart-badge" id="navbarCartBadge">0</span>
            </button>
          </li>
          <li>
            <button type="button" class="nav-link nav-item-btn" onclick="openWishlistDrawer()" title="Wishlist" aria-label="View wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>Wishlist</span>
              <span class="wishlist-badge navbar-wishlist-badge" id="navbarWishlistBadge">0</span>
            </button>
          </li>
          <li>
            <div class="nav-customer-slot" id="navCustomerSlot">
              <button type="button" class="nav-link nav-item-btn" onclick="openCustomerAuthModal()" title="Profile" aria-label="Customer Profile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Profile</span>
              </button>
            </div>
          </li>
        </ul>
`;

// Mobile Fixed Bottom Navigation Bar (5 items)
const mobileBottomNavHtml = `
  <!-- Mobile Fixed Bottom Navigation Bar (5 Items Required) -->
  <nav class="mobile-bottom-nav" id="mobileBottomNav" aria-label="Mobile Navigation">
    <a href="#categoriesSection" class="mobile-nav-item active" id="mobileNavCategories">
      <div class="mobile-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      </div>
      <span class="mobile-nav-label">Categories</span>
    </a>

    <a href="products" class="mobile-nav-item" id="mobileNavProducts">
      <div class="mobile-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </div>
      <span class="mobile-nav-label">Products</span>
    </a>

    <button type="button" class="mobile-nav-item" id="mobileNavCart" onclick="openCartDrawer()" aria-label="View Cart">
      <div class="mobile-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="cart-badge mobile-nav-badge" id="mobileNavCartBadge">0</span>
      </div>
      <span class="mobile-nav-label">Cart</span>
    </button>

    <button type="button" class="mobile-nav-item" id="mobileNavWishlist" onclick="openWishlistDrawer()" aria-label="View Wishlist">
      <div class="mobile-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span class="wishlist-badge mobile-nav-badge" id="mobileNavWishlistBadge">0</span>
      </div>
      <span class="mobile-nav-label">Wishlist</span>
    </button>

    <button type="button" class="mobile-nav-item" id="mobileNavProfile" onclick="openCustomerAuthModal()" aria-label="User Profile">
      <div class="mobile-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <span class="mobile-nav-label">Profile</span>
    </button>
  </nav>
`;

// Update an HTML file
function updateHomepageHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');

  // 1. Add link to ecom-ui.css in head if not present
  if (!html.includes('css/ecom-ui.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="css/ecom-ui.css" />\n</head>');
  }

  // 2. Update brand title
  html = html.replace(
    /<title>.*?<\/title>/i,
    '<title>Rajendra Studio & Framing | Custom Photo Frames, Printing & Personalized Gifts</title>'
  );

  // 3. Replace desktop nav-menu in header
  // Find `<ul class="nav-menu">[\s\S]*?<\/ul>`
  html = html.replace(/<ul class="nav-menu">[\s\S]*?<\/ul>/, desktopNavMenuHtml.trim());

  // 4. In navbar-actions, ensure Quick Enquiry is cleanly displayed on desktop
  // Replace the old slider & old featured products sections with our 5 categories
  // Old sections start around `<section class="section product-slider-section">` or `<section class="section section-cream" id="whyChooseSection">`
  // Let's place categoriesSection and the 5 categories right after the hero section (after `</section>` of `hero-wrapper-section`)!
  
  const heroEndMarker = '<!-- 3. Why Choose Rajesh Framing -->';
  const heroEndAlt = '<section class="section section-cream" id="whyChooseSection">';

  // Remove the old product slider section & old featured products section
  // Old slider starts with `<!-- 4. Product Showcase Slider` and ends with `<!-- 5. Featured Products`
  // Old featured products starts with `<!-- 5. Featured Products` and ends with `<!-- 6. About Rajesh Framing`
  const oldSliderAndFeaturedRegex = /<!-- 4\. Product Showcase Slider[\s\S]*?<!-- 6\. About Rajesh Framing -->/;
  
  if (oldSliderAndFeaturedRegex.test(html)) {
    html = html.replace(
      oldSliderAndFeaturedRegex,
      `${full5CategoriesHtml}\n\n    <!-- 6. About Rajesh Framing -->`
    );
  } else {
    // Alternative replacement
    console.warn('Regex did not match oldSliderAndFeaturedRegex, falling back to after hero replacement');
    const heroRegex = /(<\/section>[\s\r\n]*)(<!-- 3\. Why Choose)/;
    html = html.replace(heroRegex, `$1${full5CategoriesHtml}\n\n$2`);
  }

  // 5. Add mobile bottom nav bar before closing body
  if (!html.includes('id="mobileBottomNav"')) {
    html = html.replace('</body>', `${mobileBottomNavHtml}\n</body>`);
  } else {
    html = html.replace(/<nav class="mobile-bottom-nav"[\s\S]*?<\/nav>/, mobileBottomNavHtml.trim());
  }

  // 6. Ensure Brand Name mentions in about / contact section say Rajendra Studio & Framing
  html = html.replace(/About Rajesh Framing/g, 'About Rajendra Studio & Framing');
  html = html.replace(/Rajesh Framing studio/g, 'Rajendra Studio & Framing');
  html = html.replace(/Rajesh Framing provides/g, 'Rajendra Studio & Framing provides');

  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Successfully updated ${filePath}`);
}

// Update both index.html and public/index.html
updateHomepageHtml(path.join(__dirname, '..', 'index.html'));
updateHomepageHtml(path.join(__dirname, '..', 'public', 'index.html'));
