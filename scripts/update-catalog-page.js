const fs = require('fs');
const path = require('path');

const UNIFIED_BAR_HTML = `        <!-- Unified Catalog Toolbar ("ONE BAR" with Category & Filter Options) -->
        <div class="catalog-unified-bar-wrapper">
          <div class="catalog-unified-bar">
            <!-- Category Option Selector Dropdown -->
            <div class="bar-control-item bar-category-picker">
              <button type="button" class="bar-btn bar-category-btn" id="categoryDropdownTrigger" aria-haspopup="true" aria-expanded="false" title="Filter by Category">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 6h16M4 12h16M4 18h7"></path>
                </svg>
                <span class="bar-btn-text">
                  <span class="bar-btn-label">Category:</span>
                  <span class="bar-btn-value" id="currentCategoryText">All Products</span>
                </span>
                <svg class="bar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <!-- Category Dropdown Popover -->
              <div class="bar-dropdown-menu" id="categoryDropdownMenu">
                <div class="dropdown-title">Select Category</div>
                <button type="button" class="dropdown-item active" data-filter="all" onclick="selectCatalogCategory('all', 'All Products')">
                  <span>All Products</span>
                </button>
                <button type="button" class="dropdown-item" data-filter="frames" onclick="selectCatalogCategory('frames', 'Studio & Framing')">
                  <span>Studio &amp; Framing</span>
                </button>
                <button type="button" class="dropdown-item" data-filter="personalized" onclick="selectCatalogCategory('personalized', 'Personalized Printing')">
                  <span>Personalized Printing</span>
                </button>
                <button type="button" class="dropdown-item" data-filter="office" onclick="selectCatalogCategory('office', 'Office Printing')">
                  <span>Office Printing</span>
                </button>
                <button type="button" class="dropdown-item" data-filter="custom" onclick="selectCatalogCategory('custom', 'Custom Printing')">
                  <span>Custom Printing</span>
                </button>
                <button type="button" class="dropdown-item" data-filter="gifts" onclick="selectCatalogCategory('gifts', 'Photo Gifts & Keepsakes')">
                  <span>Photo Gifts &amp; Keepsakes</span>
                </button>
              </div>
            </div>

            <!-- Quick Search Input (Desktop) -->
            <div class="bar-search-box">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="catalogSearchInput" class="bar-search-input" placeholder="Search frames, canvas, mugs..." />
            </div>

            <!-- Filter Option Button & Reset Controls -->
            <div class="bar-actions-group">
              <div class="bar-control-item bar-filter-action">
                <button type="button" class="bar-btn bar-filter-btn" id="filterDrawerTrigger" onclick="toggleFilterDrawer(true)" aria-label="Open Filters">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                  </svg>
                  <span>Filter</span>
                  <span class="filter-count-badge" id="activeFilterBadge" style="display: none;">0</span>
                </button>
              </div>

              <button type="button" class="bar-reset-btn" id="catalogBarResetBtn" onclick="resetFilters()" title="Reset All Filters" style="opacity: 0.4; pointer-events: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span class="reset-text">Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div class="catalog-layout">
          <!-- Main Content: Results Count & Products Grid -->
          <div class="catalog-main-content">`;

const FILTER_DRAWER_HTML = `
    <!-- Slide-Over Filter Drawer Backdrop & Offcanvas Panel -->
    <div class="filter-drawer-backdrop" id="filterDrawerBackdrop" onclick="toggleFilterDrawer(false)"></div>
    <aside class="catalog-filter-drawer" id="catalogFilterDrawer" aria-label="Catalog Filters">
      <div class="filter-drawer-header">
        <div class="filter-drawer-title-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C99A3D" stroke-width="2">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <h3>Filters &amp; Sort</h3>
        </div>
        <div class="filter-drawer-actions">
          <button type="button" class="drawer-reset-btn sidebar-reset-btn" onclick="resetFilters()">Reset</button>
          <button type="button" class="drawer-close-btn" onclick="toggleFilterDrawer(false)" aria-label="Close filters">&times;</button>
        </div>
      </div>

      <div class="filter-drawer-body">
        <!-- Search Filter -->
        <div class="drawer-group">
          <label class="drawer-group-label" for="drawerSearchInput">Search Catalog</label>
          <div class="drawer-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="drawerSearchInput" class="drawer-search-input" placeholder="Search frames, canvas, gifts..." />
          </div>
        </div>

        <!-- Categories Filter Pills -->
        <div class="drawer-group">
          <label class="drawer-group-label">Categories</label>
          <div class="drawer-category-pills">
            <button type="button" class="drawer-pill-btn active" data-filter="all" onclick="selectCatalogCategory('all', 'All Products'); toggleFilterDrawer(false);">
              <span>All Products</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="drawer-pill-btn" data-filter="frames" onclick="selectCatalogCategory('frames', 'Studio & Framing'); toggleFilterDrawer(false);">
              <span>Studio &amp; Framing</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="drawer-pill-btn" data-filter="personalized" onclick="selectCatalogCategory('personalized', 'Personalized Printing'); toggleFilterDrawer(false);">
              <span>Personalized Printing</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="drawer-pill-btn" data-filter="office" onclick="selectCatalogCategory('office', 'Office Printing'); toggleFilterDrawer(false);">
              <span>Office Printing</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="drawer-pill-btn" data-filter="custom" onclick="selectCatalogCategory('custom', 'Custom Printing'); toggleFilterDrawer(false);">
              <span>Custom Printing</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="drawer-pill-btn" data-filter="gifts" onclick="selectCatalogCategory('gifts', 'Photo Gifts & Keepsakes'); toggleFilterDrawer(false);">
              <span>Photo Gifts &amp; Keepsakes</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <!-- Sort By -->
        <div class="drawer-group">
          <label class="drawer-group-label">Sort By</label>
          <div class="drawer-sort-options">
            <button type="button" class="drawer-sort-btn active" data-sort="featured">Featured</button>
            <button type="button" class="drawer-sort-btn" data-sort="rating">Top Rated</button>
            <button type="button" class="drawer-sort-btn" data-sort="price-asc">Price: Low</button>
            <button type="button" class="drawer-sort-btn" data-sort="price-desc">Price: High</button>
          </div>
        </div>

        <!-- Bespoke Sizing WhatsApp Card -->
        <div class="drawer-custom-card">
          <h4>Need Custom Sizing?</h4>
          <p>Bespoke canvas and frame sizing manufactured to your exact millimeters.</p>
          <a href="https://wa.me/919601574966?text=Hello%20Dahej%20Support,%20I%20need%20custom%20dimensions" target="_blank" class="drawer-whatsapp-btn">
            <span>WhatsApp Specs</span>
          </a>
        </div>
      </div>

      <div class="filter-drawer-footer">
        <button type="button" class="drawer-apply-btn" onclick="toggleFilterDrawer(false)">
          <span id="drawerApplyText">Show Products</span>
        </button>
      </div>
    </aside>
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match from <div class="catalog-layout"> down through </aside>\s*<!-- Right / Main Content: Results Count & Products Grid (Moved Up) -->\s*<div class="catalog-main-content">
  const sidebarPattern = /<div class="catalog-layout">[\s\S]*?<aside class="catalog-sidebar"[\s\S]*?<\/aside>[\s\S]*?<div class="catalog-main-content">/;
  
  if (!sidebarPattern.test(content)) {
    console.error(`Sidebar pattern not found in ${filePath}`);
    return false;
  }

  content = content.replace(sidebarPattern, UNIFIED_BAR_HTML);

  // Check if filter drawer is already inserted
  if (!content.includes('id="catalogFilterDrawer"')) {
    // Insert filter drawer right after the catalog section closing </section> or before </main>
    const sectionEnd = '    </section>';
    if (content.includes(sectionEnd)) {
      content = content.replace(sectionEnd, `${FILTER_DRAWER_HTML}\n    </section>`);
    } else {
      content = content.replace('</main>', `${FILTER_DRAWER_HTML}\n  </main>`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${filePath}`);
  return true;
}

const targets = [
  path.join(__dirname, '..', 'products.html'),
  path.join(__dirname, '..', 'public', 'products.html')
];

targets.forEach(processFile);
