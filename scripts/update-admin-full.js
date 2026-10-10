const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. New HTML for section #viewProducts
const newViewProductsHtml = `          <!-- ==========================================
               VIEW 4: PRODUCTS & PRICING
               ========================================== -->
          <section class="dashboard-view-panel" id="viewProducts">
            
            <div class="page-subheader">
              <div class="subheader-text">
                Control live catalog products, category filters, pricing, stock availability, and marketing badges.
              </div>
              <div class="subheader-actions">
                <button type="button" class="btn-sub-action outline" onclick="exportProductsToCSV()" title="Export products catalog and pricing">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Export Products</span>
                </button>
                <button type="button" class="btn-sub-action primary" id="openAddProductModalBtn" onclick="openAddProductModal()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Product / Stock</span>
                </button>
              </div>
            </div>

            <!-- Products KPI Bar -->
            <div class="metric-segment-bar five-cols">
              <div class="metric-segment">
                <div class="metric-segment-top">
                  <div class="metric-label-group">
                    <span class="metric-icon-dot blue"></span>
                    <span class="metric-segment-label">Total Catalog</span>
                  </div>
                  <span class="metric-segment-dots">•••</span>
                </div>
                <div class="metric-segment-val" id="kpiActiveProducts">125</div>
                <div class="metric-segment-tag positive"><span style="font-size:0.85em;">●</span> 5 Categories</div>
              </div>

              <div class="metric-segment">
                <div class="metric-segment-top">
                  <div class="metric-label-group">
                    <span class="metric-icon-dot green"></span>
                    <span class="metric-segment-label">In Stock Items</span>
                  </div>
                  <span class="metric-segment-dots">•••</span>
                </div>
                <div class="metric-segment-val" id="kpiInStockProducts">125</div>
                <div class="metric-segment-tag positive"><span style="font-size:0.85em;">✓</span> Ready to ship</div>
              </div>

              <div class="metric-segment">
                <div class="metric-segment-top">
                  <div class="metric-label-group">
                    <span class="metric-icon-dot purple"></span>
                    <span class="metric-segment-label">Marketing Badges</span>
                  </div>
                  <span class="metric-segment-dots">•••</span>
                </div>
                <div class="metric-segment-val" id="kpiBadgeProducts">48</div>
                <div class="metric-segment-tag in-progress"><span style="font-size:0.85em;">★</span> Bestsellers &amp; Hot</div>
              </div>

              <div class="metric-segment">
                <div class="metric-segment-top">
                  <div class="metric-label-group">
                    <span class="metric-icon-dot amber"></span>
                    <span class="metric-segment-label">Studio Starting Price</span>
                  </div>
                  <span class="metric-segment-dots">•••</span>
                </div>
                <div class="metric-segment-val" id="kpiStartingPrice">₹120</div>
                <div class="metric-segment-tag neutral">Pocket-friendly gifts</div>
              </div>

              <div class="metric-segment">
                <div class="metric-segment-top">
                  <div class="metric-label-group">
                    <span class="metric-icon-dot blue"></span>
                    <span class="metric-segment-label">Average Rating</span>
                  </div>
                  <span class="metric-segment-dots">•••</span>
                </div>
                <div class="metric-segment-val" id="kpiAvgRating">4.89 ★</div>
                <div class="metric-segment-tag positive"><span style="font-size:0.85em;">↑</span> Verified customer reviews</div>
              </div>
            </div>

            <!-- Category Selector Tabs (Interactive category option in product dashboard) -->
            <div class="admin-category-tabs-bar" id="productCategoryTabs" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 18px 0 14px 0;">
              <button type="button" class="admin-tab-btn active" data-category="all" onclick="selectAdminCategory('all')">
                <span>All Products</span>
                <span class="category-badge-count" id="countAll">125</span>
              </button>
              <button type="button" class="admin-tab-btn" data-category="frames" onclick="selectAdminCategory('frames')">
                <span>🖼️ Studio &amp; Framing</span>
                <span class="category-badge-count" id="countFrames">25</span>
              </button>
              <button type="button" class="admin-tab-btn" data-category="personalized" onclick="selectAdminCategory('personalized')">
                <span>☕ Personalized Printing</span>
                <span class="category-badge-count" id="countPersonalized">25</span>
              </button>
              <button type="button" class="admin-tab-btn" data-category="office" onclick="selectAdminCategory('office')">
                <span>📁 Office Printing</span>
                <span class="category-badge-count" id="countOffice">25</span>
              </button>
              <button type="button" class="admin-tab-btn" data-category="custom" onclick="selectAdminCategory('custom')">
                <span>🎨 Custom Printing</span>
                <span class="category-badge-count" id="countCustom">25</span>
              </button>
              <button type="button" class="admin-tab-btn" data-category="gifts" onclick="selectAdminCategory('gifts')">
                <span>🎁 Photo Gifts &amp; Keepsakes</span>
                <span class="category-badge-count" id="countGifts">25</span>
              </button>
            </div>

            <!-- Active Category Info Banner / Card -->
            <div class="admin-category-info-card" id="adminCategoryInfoCard">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div class="category-icon-box" id="categoryInfoIcon">📦</div>
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main);" id="categoryInfoTitle">All Products Catalog</h3>
                    <span class="badge" id="categoryInfoCountBadge" style="background: rgba(201, 154, 61, 0.15); color: #b8860b; border: 1px solid rgba(201, 154, 61, 0.3); font-size: 0.72rem; padding: 2px 8px; border-radius: 999px;">125 Items</span>
                  </div>
                  <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted); max-width: 680px;" id="categoryInfoDesc">
                    Complete studio catalog featuring handcrafted frames, corporate stationery, personalized merchandise, and photo gifts.
                  </p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                <div style="text-align: right;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 600;">Price Range</span>
                  <strong style="font-size: 0.95rem; color: var(--text-main);" id="categoryInfoPriceRange">₹120 – ₹2,499</strong>
                </div>
                <div style="height: 28px; width: 1px; background: var(--border-subtle);"></div>
                <div style="text-align: right;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 600;">Stock Availability</span>
                  <strong style="font-size: 0.95rem; color: #16a34a;" id="categoryInfoStockStatus">100% In Stock</strong>
                </div>
                <a id="categoryInfoStorefrontLink" href="products.html" target="_blank" class="btn-sub-action outline" style="padding: 6px 12px; font-size: 0.78rem;" title="View in storefront">
                  <span>Storefront ↗</span>
                </a>
              </div>
            </div>

            <!-- Search, Filter & Sort Controls Row -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
              <div style="position: relative; flex: 1; min-width: 240px; max-width: 440px;">
                <input type="text" id="productSearchInput" class="setting-input" placeholder="Search by product name, SKU / ID, badge, material..." style="padding-left: 36px; height: 38px; font-size: 0.84rem;" oninput="filterAdminProducts()" />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>

              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <select id="productStockFilterSelect" class="setting-select" style="width: auto; height: 38px; font-size: 0.82rem; padding: 0 10px;" onchange="filterAdminProducts()">
                  <option value="all">All Stock Statuses</option>
                  <option value="in_stock">🟢 In Stock Only</option>
                  <option value="out_of_stock">🔴 Out of Stock Only</option>
                </select>

                <select id="productSortSelect" class="setting-select" style="width: auto; height: 38px; font-size: 0.82rem; padding: 0 10px;" onchange="filterAdminProducts()">
                  <option value="default">Default Order</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Highest Rated ★</option>
                  <option value="name_asc">Name (A – Z)</option>
                </select>

                <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 4px;" id="productFilteredCountLabel">
                  Showing 125 products
                </span>
              </div>
            </div>

            <!-- Products Table Card -->
            <div class="graphura-card-table-wrap">
              <table class="graphura-table products-table">
                <thead>
                  <tr>
                    <th style="width: 65px; text-align: center;">Image</th>
                    <th style="min-width: 200px;">Product Name &amp; ID</th>
                    <th style="width: 140px;">Category</th>
                    <th style="width: 130px;">Price &amp; MRP</th>
                    <th style="width: 110px;">Rating</th>
                    <th style="width: 110px;">Badge</th>
                    <th style="width: 120px; text-align: center;">Stock Status</th>
                    <th style="width: 100px;">Lead Time</th>
                    <th style="width: 90px; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody id="adminProductsTableBody">
                  <tr>
                    <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px;">Loading catalog products...</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </section>`;

// Update function for admin.html and public/admin.html
function updateAdminHtmlFiles() {
  ['admin.html', path.join('public', 'admin.html')].forEach(relPath => {
    const filePath = path.join(rootDir, relPath);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace viewProducts section
    const sectionStart = content.indexOf('<section class="dashboard-view-panel" id="viewProducts">');
    if (sectionStart !== -1) {
      const sectionEnd = content.indexOf('</section>', sectionStart);
      if (sectionEnd !== -1) {
        const commentStart = content.lastIndexOf('<!-- ==========================================', sectionStart);
        const replaceStart = (commentStart !== -1 && (sectionStart - commentStart) < 150) ? commentStart : sectionStart;
        const replaceEnd = sectionEnd + '</section>'.length;
        content = content.substring(0, replaceStart) + newViewProductsHtml + content.substring(replaceEnd);
      }
    }

    // Add gifts option to #newProductCategory
    const giftsOption = '<option value="gifts">Photo Gifts &amp; Keepsakes (Crystals, Plaques, Clocks)</option>';
    if (!content.includes('value="gifts"') && content.includes('id="newProductCategory"')) {
      content = content.replace(
        '<option value="custom">Custom Printing (Canvas, Acrylic)</option>',
        '<option value="custom">Custom Printing (Canvas, Acrylic)</option>\n                ' + giftsOption
      );
    }

    // Add editProductCategory to editProductModal
    const editModalCategoryField = `\n          <div class="setting-row">
            <label class="setting-label">Category</label>
            <select class="setting-select" id="editProductCategory">
              <option value="frames">Studio &amp; Framing</option>
              <option value="personalized">Personalized Printing</option>
              <option value="office">Office Printing</option>
              <option value="custom">Custom Printing</option>
              <option value="gifts">Photo Gifts &amp; Keepsakes</option>
            </select>
          </div>`;

    if (!content.includes('id="editProductCategory"')) {
      const marker = '<input type="hidden" id="editProductId" />';
      if (content.includes(marker)) {
        content = content.replace(marker, marker + editModalCategoryField);
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated HTML: ${relPath}`);
  });
}

// 2. Logic code to inject into js/admin.js and public/js/admin.js
const adminJsCategoryLogic = `
/* ==========================================================================
   CATEGORY & PRODUCT DASHBOARD CONTROLLER (RICH PRODUCT INFO & FILTERS)
   ========================================================================== */
let adminActiveCategory = 'all';
let adminProductSearchQuery = '';
let adminProductStockFilter = 'all';
let adminProductSort = 'default';

const CATEGORY_META = {
  all: {
    name: 'All Products Catalog',
    badge: 'All Categories',
    icon: '📦',
    desc: 'Complete studio catalog featuring handcrafted frames, corporate stationery, personalized merchandise, and photo gifts.',
    anchor: 'products'
  },
  frames: {
    name: 'Studio & Framing',
    badge: 'Studio & Framing',
    icon: '🖼️',
    desc: 'Classic wood and acrylic glass frames, certificate frames, collage memory boxes, and gallery wall displays.',
    anchor: 'cat-frames'
  },
  personalized: {
    name: 'Personalized Printing',
    badge: 'Personalized Printing',
    icon: '☕',
    desc: 'Custom printed ceramic mugs, insulated bottles, custom apparel, and personalized daily keepsakes.',
    anchor: 'cat-personalized'
  },
  office: {
    name: 'Office Printing',
    badge: 'Office Printing',
    icon: '📁',
    desc: 'Corporate presentation folders, customized file binders, business cards, letterheads, and executive desk accessories.',
    anchor: 'cat-office'
  },
  custom: {
    name: 'Custom Printing',
    badge: 'Custom Printing',
    icon: '🎨',
    desc: 'Museum-grade canvas gallery wraps, edge-to-edge acrylic prints, metallic prints, and bespoke art installations.',
    anchor: 'cat-custom'
  },
  gifts: {
    name: 'Photo Gifts & Keepsakes',
    badge: 'Photo Gifts & Keepsakes',
    icon: '🎁',
    desc: 'Personalized 3D photo crystals, acrylic desktop plaques, customized keychains, and commemorative photo clocks.',
    anchor: 'cat-gifts'
  }
};

window.selectAdminCategory = function(catKey) {
  adminActiveCategory = catKey || 'all';
  const tabs = document.querySelectorAll('#productCategoryTabs .admin-tab-btn');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-category') === adminActiveCategory) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  window.filterAdminProducts();
};

window.filterAdminProducts = function() {
  const searchInput = document.getElementById('productSearchInput');
  const stockSelect = document.getElementById('productStockFilterSelect');
  const sortSelect = document.getElementById('productSortSelect');

  adminProductSearchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  adminProductStockFilter = stockSelect ? stockSelect.value : 'all';
  adminProductSort = sortSelect ? sortSelect.value : 'default';

  let filtered = [...allProducts];

  // 1. Filter by category
  if (adminActiveCategory && adminActiveCategory !== 'all') {
    filtered = filtered.filter(p => (p.category || '').toLowerCase() === adminActiveCategory.toLowerCase());
  }

  // 2. Filter by search query
  if (adminProductSearchQuery) {
    filtered = filtered.filter(p => {
      const title = (p.title || p.name || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const desc = (p.description || p.shortDescription || '').toLowerCase();
      const mat = (p.primaryMaterial || p.material || '').toLowerCase();
      const badge = (p.badge || '').toLowerCase();
      return title.includes(adminProductSearchQuery) || 
             id.includes(adminProductSearchQuery) || 
             desc.includes(adminProductSearchQuery) ||
             mat.includes(adminProductSearchQuery) ||
             badge.includes(adminProductSearchQuery);
    });
  }

  // 3. Filter by stock
  if (adminProductStockFilter === 'in_stock') {
    filtered = filtered.filter(p => p.inStock !== false && p.stockStatus !== 'Out of Stock' && p.status !== 'Out of Stock');
  } else if (adminProductStockFilter === 'out_of_stock') {
    filtered = filtered.filter(p => p.inStock === false || p.stockStatus === 'Out of Stock' || p.status === 'Out of Stock');
  }

  // 4. Sort
  if (adminProductSort === 'price_asc') {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (adminProductSort === 'price_desc') {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (adminProductSort === 'rating_desc') {
    filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  } else if (adminProductSort === 'name_asc') {
    filtered.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
  }

  // Update filtered counter label
  const countLabel = document.getElementById('productFilteredCountLabel');
  if (countLabel) {
    countLabel.textContent = \`Showing \${filtered.length} of \${allProducts.length} products\`;
  }

  // Update Category Info Banner
  updateAdminCategoryBanner(adminActiveCategory, filtered);

  // Render Table
  renderAdminProducts(filtered);
};

function updateAdminCategoryCounters(products) {
  const counts = { all: products.length, frames: 0, personalized: 0, office: 0, custom: 0, gifts: 0 };
  let inStockCount = 0;
  let badgeCount = 0;
  let minPrice = Infinity;
  let totalRating = 0;
  let ratingCount = 0;

  products.forEach(p => {
    const cat = (p.category || '').toLowerCase();
    if (counts[cat] !== undefined) counts[cat]++;
    const isAvail = p.inStock !== false && p.stockStatus !== 'Out of Stock' && p.status !== 'Out of Stock';
    if (isAvail) inStockCount++;
    if (p.badge) badgeCount++;
    const priceNum = Number(p.price);
    if (!isNaN(priceNum) && priceNum > 0 && priceNum < minPrice) minPrice = priceNum;
    if (p.rating) {
      totalRating += Number(p.rating);
      ratingCount++;
    }
  });

  const elAll = document.getElementById('countAll');
  const elFrames = document.getElementById('countFrames');
  const elPers = document.getElementById('countPersonalized');
  const elOff = document.getElementById('countOffice');
  const elCust = document.getElementById('countCustom');
  const elGifts = document.getElementById('countGifts');

  if (elAll) elAll.textContent = counts.all;
  if (elFrames) elFrames.textContent = counts.frames;
  if (elPers) elPers.textContent = counts.personalized;
  if (elOff) elOff.textContent = counts.office;
  if (elCust) elCust.textContent = counts.custom;
  if (elGifts) elGifts.textContent = counts.gifts;

  // KPI Bar update
  const kpiActive = document.getElementById('kpiActiveProducts');
  const kpiInStock = document.getElementById('kpiInStockProducts');
  const kpiBadges = document.getElementById('kpiBadgeProducts');
  const kpiStartPrice = document.getElementById('kpiStartingPrice');
  const kpiAvgRating = document.getElementById('kpiAvgRating');

  if (kpiActive) kpiActive.textContent = products.length;
  if (kpiInStock) kpiInStock.textContent = inStockCount;
  if (kpiBadges) kpiBadges.textContent = badgeCount;
  if (kpiStartPrice && minPrice !== Infinity) kpiStartPrice.textContent = \`₹\${minPrice}\`;
  if (kpiAvgRating && ratingCount > 0) kpiAvgRating.textContent = \`\${(totalRating / ratingCount).toFixed(2)} ★\`;
}

function updateAdminCategoryBanner(catKey, currentProducts) {
  const meta = CATEGORY_META[catKey] || CATEGORY_META.all;
  const iconEl = document.getElementById('categoryInfoIcon');
  const titleEl = document.getElementById('categoryInfoTitle');
  const countBadgeEl = document.getElementById('categoryInfoCountBadge');
  const descEl = document.getElementById('categoryInfoDesc');
  const priceRangeEl = document.getElementById('categoryInfoPriceRange');
  const stockStatusEl = document.getElementById('categoryInfoStockStatus');
  const storefrontLinkEl = document.getElementById('categoryInfoStorefrontLink');

  if (iconEl) iconEl.textContent = meta.icon;
  if (titleEl) titleEl.textContent = meta.name;
  if (countBadgeEl) countBadgeEl.textContent = \`\${currentProducts.length} Items\`;
  if (descEl) descEl.textContent = meta.desc;

  if (currentProducts.length > 0) {
    let min = Infinity;
    let max = -Infinity;
    let inStock = 0;
    currentProducts.forEach(p => {
      const price = Number(p.price) || 0;
      if (price < min) min = price;
      if (price > max) max = price;
      if (p.inStock !== false && p.stockStatus !== 'Out of Stock' && p.status !== 'Out of Stock') inStock++;
    });
    if (priceRangeEl) priceRangeEl.textContent = \`₹\${min.toLocaleString('en-IN')} – ₹\${max.toLocaleString('en-IN')}\`;
    const percent = Math.round((inStock / currentProducts.length) * 100);
    if (stockStatusEl) {
      stockStatusEl.textContent = \`\${inStock}/\${currentProducts.length} Available (\${percent}%)\`;
      stockStatusEl.style.color = percent > 80 ? '#16a34a' : (percent > 40 ? '#d97706' : '#dc2626');
    }
  } else {
    if (priceRangeEl) priceRangeEl.textContent = '—';
    if (stockStatusEl) stockStatusEl.textContent = '0 Available';
  }

  if (storefrontLinkEl) {
    storefrontLinkEl.href = catKey === 'all' ? 'products.html' : \`index.html#\${meta.anchor}\`;
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (!products || products.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 48px 24px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">No matching products found</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Try selecting another category or clearing your search filters.</div>
          <button type="button" class="btn-sub-action outline" style="margin-top: 14px;" onclick="selectAdminCategory('all'); if (document.getElementById('productSearchInput')) document.getElementById('productSearchInput').value=''; filterAdminProducts();">Reset All Filters</button>
        </td>
      </tr>
    \`;
    return;
  }

  const categoryLabels = {
    frames: { label: 'Studio & Framing', color: '#854d0e', bg: 'rgba(234, 179, 8, 0.15)' },
    personalized: { label: 'Personalized Printing', color: '#1e40af', bg: 'rgba(59, 130, 246, 0.15)' },
    office: { label: 'Office Printing', color: '#166534', bg: 'rgba(34, 197, 94, 0.15)' },
    custom: { label: 'Custom Printing', color: '#6b21a8', bg: 'rgba(168, 85, 247, 0.15)' },
    gifts: { label: 'Photo Gifts', color: '#9d174d', bg: 'rgba(236, 72, 153, 0.15)' }
  };

  tbody.innerHTML = products.map(p => {
    const isAvailable = p.inStock !== false && p.stockStatus !== 'Out of Stock' && p.status !== 'Out of Stock';
    const statusBtnClass = isAvailable ? 'in-stock' : 'out-stock';
    const statusText = isAvailable ? '🟢 In Stock' : '🔴 Out of Stock';
    const currentPrice = Number(p.price) || 0;
    const origPrice = p.originalPrice ? Number(p.originalPrice) : null;
    const discountPercent = origPrice && origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;

    const catKey = (p.category || 'frames').toLowerCase();
    const catStyle = categoryLabels[catKey] || { label: p.categoryLabel || p.category || 'General', color: '#475569', bg: 'rgba(100, 116, 139, 0.15)' };

    const ratingVal = p.rating ? Number(p.rating).toFixed(1) : '4.8';
    const revCount = p.reviewsCount || p.reviews || 42;

    const badgeHtml = p.badge 
      ? \`<span class="badge" style="background: rgba(201, 154, 61, 0.15); color: #b8860b; border: 1px solid rgba(201, 154, 61, 0.3); font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; font-weight: 600;">\${escapeHtml(p.badge)}</span>\`
      : '<span style="color: var(--text-muted); font-size: 0.75rem;">—</span>';

    const pName = p.name || p.title || 'Untitled Product';
    const pId = p.id || 'rf-prod';
    const pImage = p.image || 'assets/images/custom_canvas.jpg';
    const leadTime = p.leadTime || '24-48 Hours';

    return \`
      <tr data-product-id="\${escapeHtml(pId)}" data-category="\${escapeHtml(catKey)}">
        <td style="text-align: center; vertical-align: middle;">
          <a href="product-detail.html?id=\${encodeURIComponent(pId)}" target="_blank" title="Preview on Storefront" style="display: inline-block;">
            <img src="\${escapeHtml(pImage)}" alt="\${escapeHtml(pName)}" style="width: 46px; height: 46px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='assets/images/custom_canvas.jpg'" />
          </a>
        </td>
        <td style="vertical-align: middle;">
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem; line-height: 1.3;">
            <a href="product-detail.html?id=\${encodeURIComponent(pId)}" target="_blank" style="color: inherit; text-decoration: none;" title="Open Product Page">
              \${escapeHtml(pName)}
            </a>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 8px;">
            <code>\${escapeHtml(pId)}</code>
            <span>&bull;</span>
            <span style="color: var(--text-muted);">\${escapeHtml(p.primaryMaterial || p.material || 'Studio Archival')}</span>
          </div>
        </td>
        <td style="vertical-align: middle;">
          <span style="font-size: 0.74rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: \${catStyle.bg}; color: \${catStyle.color}; display: inline-block;">
            \${escapeHtml(catStyle.label)}
          </span>
        </td>
        <td style="vertical-align: middle;">
          <div style="font-weight: 700; color: var(--text-main); font-size: 0.92rem;">
            ₹\${currentPrice.toLocaleString('en-IN')}
          </div>
          \${origPrice && origPrice > currentPrice ? \`
            <div style="font-size: 0.72rem; color: var(--text-muted);">
              <span style="text-decoration: line-through;">₹\${origPrice.toLocaleString('en-IN')}</span>
              <span style="color: #16a34a; font-weight: 600; margin-left: 4px;">\${discountPercent}% OFF</span>
            </div>
          \` : ''}
        </td>
        <td style="vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 4px; font-size: 0.82rem; font-weight: 600; color: #b45309;">
            <span>★</span>
            <span>\${ratingVal}</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">
            (\${revCount} reviews)
          </div>
        </td>
        <td style="vertical-align: middle;">
          \${badgeHtml}
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <button type="button" class="btn-stock-toggle \${statusBtnClass}" onclick="toggleProductStock('\${escapeHtml(pId)}')" title="Click to toggle availability">
            \${statusText}
          </button>
        </td>
        <td style="vertical-align: middle; font-size: 0.78rem; color: var(--text-muted);">
          \${escapeHtml(leadTime)}
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <div class="table-action-icons" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            <button type="button" class="btn-table-icon edit" onclick="openEditProductModal('\${escapeHtml(pId)}')" title="Edit Product Details &amp; Pricing">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="btn-table-icon delete" onclick="deleteProduct('\${escapeHtml(pId)}')" title="Remove from catalog">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');
}
`;

function updateAdminJsFiles() {
  ['js/admin.js', path.join('public', 'js', 'admin.js')].forEach(relPath => {
    const filePath = path.join(rootDir, relPath);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace existing renderAdminProducts function
    const renderStart = content.indexOf('function renderAdminProducts(products)');
    if (renderStart !== -1) {
      // Find where next function starts (function initProductModals)
      const nextFnStart = content.indexOf('function initProductModals()', renderStart);
      if (nextFnStart !== -1) {
        content = content.substring(0, renderStart) + adminJsCategoryLogic + '\n' + content.substring(nextFnStart);
      }
    }

    // 2. Update loadAdminProducts calls to refresh counters and filter
    content = content.replace(/renderAdminProducts\(allProducts\);/g, 'updateAdminCategoryCounters(allProducts); window.filterAdminProducts();');

    // 3. Update openEditProductModal to populate category
    const openEditStart = content.indexOf('window.openEditProductModal = (id) =>');
    if (openEditStart !== -1) {
      const openEditEnd = content.indexOf('editModal.classList.add(\'open\');', openEditStart);
      if (openEditEnd !== -1) {
        const insertCategoryPopulate = `    const catEl = document.getElementById('editProductCategory');
    if (catEl) catEl.value = (prod.category || 'frames').toLowerCase();\n    `;
        if (!content.includes('editProductCategory\')')) {
          content = content.substring(0, openEditEnd) + insertCategoryPopulate + content.substring(openEditEnd);
        }
      }
    }

    // 4. Update editForm submission to send category and handle inStock
    const editFormSubmitMarker = 'const name = document.getElementById(\'editProductName\').value.trim();';
    if (content.includes(editFormSubmitMarker) && !content.includes('category: editCat')) {
      content = content.replace(
        editFormSubmitMarker,
        `const name = document.getElementById('editProductName').value.trim();
      const editCat = document.getElementById('editProductCategory') ? document.getElementById('editProductCategory').value : (prod ? prod.category : 'frames');`
      );

      content = content.replace(
        'name,',
        'name,\n            category: editCat,\n            categoryLabel: (CATEGORY_META[editCat] ? CATEGORY_META[editCat].name : editCat),\n            inStock: status === \'In Stock\','
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated JS: ${relPath}`);
  });
}

updateAdminHtmlFiles();
updateAdminJsFiles();
console.log('All admin UI files updated successfully!');
