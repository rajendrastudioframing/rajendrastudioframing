const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Desktop Navigation Menu (5 items)
function getDesktopNav(activeItem) {
  return `
        <!-- Desktop Navigation Menu (5 Items Required) -->
        <ul class="nav-menu">
          <li>
            <a href="/#categoriesSection" class="nav-link ${activeItem === 'categories' ? 'active' : ''}" title="Categories">
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
            <a href="products" class="nav-link ${activeItem === 'products' ? 'active' : ''}" title="Products">
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
  `.trim();
}

// Mobile Bottom Navigation Bar (5 items)
function getMobileBottomNav(activeItem) {
  return `
  <!-- Mobile Fixed Bottom Navigation Bar (5 Items Required) -->
  <nav class="mobile-bottom-nav" id="mobileBottomNav" aria-label="Mobile Navigation">
    <a href="/#categoriesSection" class="mobile-nav-item ${activeItem === 'categories' ? 'active' : ''}" id="mobileNavCategories">
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

    <a href="products" class="mobile-nav-item ${activeItem === 'products' ? 'active' : ''}" id="mobileNavProducts">
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
  `.trim();
}

const pages = [
  { file: 'products.html', active: 'products' },
  { file: 'product-detail.html', active: 'products' },
  { file: 'checkout.html', active: 'cart' },
  { file: 'about.html', active: '' },
  { file: 'contact.html', active: '' },
  { file: 'track-order.html', active: 'profile' }
];

pages.forEach(({ file, active }) => {
  [path.join(rootDir, file), path.join(rootDir, 'public', file)].forEach(targetPath => {
    if (!fs.existsSync(targetPath)) return;
    let html = fs.readFileSync(targetPath, 'utf-8');

    // Link ecom-ui.css
    if (!html.includes('css/ecom-ui.css')) {
      html = html.replace('</head>', '  <link rel="stylesheet" href="css/ecom-ui.css" />\n</head>');
    }

    // Replace top nav
    html = html.replace(/<ul class="nav-menu">[\s\S]*?<\/ul>/, getDesktopNav(active));

    // Replace or add mobile bottom nav
    if (html.includes('id="mobileBottomNav"')) {
      html = html.replace(/<!-- Mobile Fixed Bottom Navigation Bar[\s\S]*?<\/nav>/, getMobileBottomNav(active));
    } else {
      html = html.replace('</body>', `${getMobileBottomNav(active)}\n</body>`);
    }

    // Special for products.html: update sidebar category filters to all 5 categories
    if (file === 'products.html') {
      const filtersRegex = /<div class="catalog-filters sidebar-filters">[\s\S]*?<\/div>/;
      const updatedFilters = `
                <div class="catalog-filters sidebar-filters">
                  <button type="button" class="filter-btn sidebar-filter-btn active" data-filter="all">
                    <span>All Products</span>
                  </button>
                  <button type="button" class="filter-btn sidebar-filter-btn" data-filter="frames">
                    <span>Studio &amp; Framing</span>
                  </button>
                  <button type="button" class="filter-btn sidebar-filter-btn" data-filter="personalized">
                    <span>Personalized Printing</span>
                  </button>
                  <button type="button" class="filter-btn sidebar-filter-btn" data-filter="office">
                    <span>Office Printing</span>
                  </button>
                  <button type="button" class="filter-btn sidebar-filter-btn" data-filter="custom">
                    <span>Custom Printing</span>
                  </button>
                  <button type="button" class="filter-btn sidebar-filter-btn" data-filter="gifts">
                    <span>Photo Gifts &amp; Keepsakes</span>
                  </button>
                </div>
      `.trim();
      html = html.replace(filtersRegex, updatedFilters);
    }

    fs.writeFileSync(targetPath, html, 'utf-8');
    console.log(`Updated navigation for: ${targetPath}`);
  });
});

console.log('All pages navigation updated successfully!');
