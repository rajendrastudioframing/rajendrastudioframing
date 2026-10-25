/**
 * RAJESH FRAMING - PRODUCTS CATALOG CONTROLLER
 * Category Filtering, Real-time Search, Sorting & Unified Toolbar / Filter Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
});

let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'featured';

const CATEGORY_MAP = {
  'all': 'All Products',
  'frames': 'Studio & Framing',
  'personalized': 'Personalized Printing',
  'office': 'Office Printing',
  'custom': 'Custom Printing',
  'gifts': 'Photo Gifts & Keepsakes'
};

async function initCatalog() {
  const gridContainer = document.getElementById('catalogProductsGrid');
  if (!gridContainer) return;

  // Sync fresh products from server if available
  try {
    const res = await fetch('/api/products?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        window.PRODUCTS_DATA = data.products;
      }
    }
  } catch (e) {
    // Fallback to static PRODUCTS_DATA
  }

  if (typeof PRODUCTS_DATA === 'undefined') return;

  // Check URL query params for initial category filter
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  if (paramCategory && CATEGORY_MAP[paramCategory]) {
    currentCategory = paramCategory;
  }

  setupFilterButtons();
  setupSearchInput();
  setupSortSelect();
  initUnifiedBar();
  updateCategoryUI();
  renderCatalog();
}

function updateCategoryUI() {
  const label = CATEGORY_MAP[currentCategory] || 'All Products';
  const labelEl = document.getElementById('currentCategoryText');
  if (labelEl) labelEl.textContent = label;

  // Sync all category buttons and dropdown items
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === currentCategory);
  });
}

function selectCatalogCategory(catKey, catLabel) {
  currentCategory = catKey;
  updateCategoryUI();

  // Close dropdown if open
  const menu = document.getElementById('categoryDropdownMenu');
  const trigger = document.getElementById('categoryDropdownTrigger');
  if (menu) menu.classList.remove('show');
  if (trigger) trigger.classList.remove('open');

  renderCatalog();
}
window.selectCatalogCategory = selectCatalogCategory;

function toggleFilterDrawer(open) {
  const drawer = document.getElementById('catalogFilterDrawer');
  const backdrop = document.getElementById('filterDrawerBackdrop');
  if (!drawer || !backdrop) return;

  if (open) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}
window.toggleFilterDrawer = toggleFilterDrawer;

function initUnifiedBar() {
  const trigger = document.getElementById('categoryDropdownTrigger');
  const menu = document.getElementById('categoryDropdownMenu');

  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('show');
      menu.classList.toggle('show', !isOpen);
      trigger.classList.toggle('open', !isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.classList.remove('show');
        trigger.classList.remove('open');
      }
    });
  }

  // Bind drawer search
  const drawerSearch = document.getElementById('drawerSearchInput');
  if (drawerSearch) {
    drawerSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      const mainSearch = document.getElementById('catalogSearchInput');
      if (mainSearch) mainSearch.value = e.target.value;
      renderCatalog();
    });
  }

  // Bind drawer sort buttons
  const drawerSortBtns = document.querySelectorAll('.drawer-sort-btn');
  drawerSortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      drawerSortBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.getAttribute('data-sort');
      const sortSelect = document.getElementById('catalogSortSelect');
      if (sortSelect) sortSelect.value = currentSort;
      renderCatalog();
    });
  });
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterVal = btn.getAttribute('data-filter');
      currentCategory = filterVal;
      updateCategoryUI();

      const menu = document.getElementById('categoryDropdownMenu');
      const trigger = document.getElementById('categoryDropdownTrigger');
      if (menu) menu.classList.remove('show');
      if (trigger) trigger.classList.remove('open');

      renderCatalog();
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById('catalogSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    const drawerSearch = document.getElementById('drawerSearchInput');
    if (drawerSearch) drawerSearch.value = e.target.value;
    renderCatalog();
  });
}

function setupSortSelect() {
  const sortSelect = document.getElementById('catalogSortSelect');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    document.querySelectorAll('.drawer-sort-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-sort') === currentSort);
    });
    renderCatalog();
  });
}

function renderCatalog() {
  const gridContainer = document.getElementById('catalogProductsGrid');
  const countBadge = document.getElementById('catalogResultsCount');
  if (!gridContainer) return;

  updateCategoryUI();

  // Filter products
  let filtered = PRODUCTS_DATA.filter(item => {
    const matchesCategory = (currentCategory === 'all') || (item.category === currentCategory);

    const nameText = (item.name || '').toLowerCase();
    const descText = (item.shortDescription || item.description || '').toLowerCase();
    const catText = (item.categoryLabel || item.category || '').toLowerCase();
    const matText = (item.material || '').toLowerCase();
    const badgeText = (item.badge || '').toLowerCase();

    const matchesSearch = !searchQuery ||
      nameText.includes(searchQuery) ||
      descText.includes(searchQuery) ||
      catText.includes(searchQuery) ||
      matText.includes(searchQuery) ||
      badgeText.includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  // Sort products
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // Update counter
  if (countBadge) {
    countBadge.textContent = `Showing ${filtered.length} Product${filtered.length === 1 ? '' : 's'}`;
  }

  // Update drawer apply button text
  const drawerApplyText = document.getElementById('drawerApplyText');
  if (drawerApplyText) {
    drawerApplyText.textContent = `Show ${filtered.length} Product${filtered.length === 1 ? '' : 's'}`;
  }

  // Active filter badge
  let activeCount = 0;
  if (currentCategory !== 'all') activeCount++;
  if (searchQuery) activeCount++;
  if (currentSort !== 'featured') activeCount++;

  const badge = document.getElementById('activeFilterBadge');
  if (badge) {
    if (activeCount > 0) {
      badge.textContent = activeCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // Reset button visibility
  const resetBtns = document.querySelectorAll('#catalogBarResetBtn, .sidebar-reset-btn');
  resetBtns.forEach(btn => {
    btn.style.opacity = activeCount > 0 ? '1' : '0.4';
    btn.style.pointerEvents = activeCount > 0 ? 'auto' : 'none';
  });

  // Empty state
  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 14px;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">No matching products found</h3>
        <p style="color: var(--text-secondary); font-size: 0.9375rem; margin-bottom: 20px;">Try adjusting your search terms or select another category.</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  // Render cards in editorial full-bleed capsule format
  gridContainer.innerHTML = filtered.map(product => {
    const priceFormatted = product.price ? `₹${product.price}` : product.priceDisplay;
    const wishActive = typeof isInWishlist === 'function' && isInWishlist(product.id);
    const initialCardImg = product.image;

    return `
    <article class="product-card" data-id="${product.id}" onclick="window.location.href='product-detail?id=${product.id}'">
      <div class="product-card-top">
        ${product.badge ? `<span class="product-badge-pill">${product.badge}</span>` : '<span></span>'}
        <button type="button" class="product-wishlist-btn ${wishActive ? 'active' : ''}" data-wishlist-id="${product.id}" aria-label="Add to wishlist" onclick="toggleWishlist('${product.id}', event);" title="Add to Wishlist">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="product-image-box">
        <img src="${initialCardImg}" alt="${product.name}" class="product-image" loading="lazy" />
      </div>

      <div class="product-capsule product-card-body">
        <div class="product-card-meta">
          <span class="product-card-category">${product.categoryLabel || 'Studio Craft'}</span>
          <div class="product-card-rating">
            <span class="rating-star">★</span>
            <span class="rating-val">${product.rating || 4.9}</span>
            <span class="rating-count">(${product.reviewsCount || 85})</span>
          </div>
        </div>
        <h3 class="capsule-title product-card-title">
          <a href="product-detail?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-card-price-row capsule-price-row">
          <span class="capsule-price product-card-price">${priceFormatted}</span>
          <span class="product-card-mrp">₹${Math.round((product.price || 500) * 1.25)}</span>
          <span class="product-card-discount">20% OFF</span>
        </div>
        <div class="capsule-bottom-row product-card-actions">
          <div class="card-action-row-primary">
            <button type="button" class="capsule-action-btn btn-catalog-cart" data-add-to-cart data-product-id="${product.id}" onclick="quickAddToCart('${product.id}', event);" title="Add to Cart">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="btn-cart-icon"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span class="btn-cart-text"><span class="btn-cart-prefix">Add to </span>Cart</span>
            </button>
            <button type="button" class="capsule-action-btn btn-catalog-buynow" onclick="event.stopPropagation(); window.quickBuyNow('${product.id}', event);" title="Buy Now">
              <span>Buy Now</span>
            </button>
          </div>
          <button type="button" class="capsule-action-btn btn-catalog-whatsapp" onclick="event.stopPropagation(); window.quickWhatsApp('${product.id}', event);" title="Chat on WhatsApp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.18-.553-1.638-.673-2.684-2.336-2.766-2.445-.082-.109-.661-.88-.661-1.678 0-.798.419-1.189.569-1.353.15-.164.33-.205.441-.205.111 0 .222.001.32.006.103.004.24-.039.375.285.144.344.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.087.186-.173.287-.087.1-.183.224-.262.301-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087.159.058 1.009.477 1.182.564.173.087.289.13.332.204.043.074.043.431-.101.836z"/>
            </svg>
            <span class="btn-whatsapp-text">Chat on WhatsApp</span>
          </button>
        </div>
      </div>
    </article>
  `}).join('');
}

window.quickWhatsApp = function(productId, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }
  const products = (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) ? PRODUCTS_DATA : [];
  const product = products.find(p => p.id === productId);

  const productName = product ? product.name : 'Photo Frame & Printing Product';
  const productPrice = product ? `₹${product.price}` : '';
  const productCategory = (product && product.categoryLabel) ? `Category: ${product.categoryLabel}` : '';

  const message = `Hello Rajendra Studio!\n\nI am interested in:\n• Product: ${productName}${productPrice ? `\n• Price: ${productPrice}` : ''}${productCategory ? `\n• ${productCategory}` : ''}\n\nPlease share more details and customization options.`;

  const waUrl = `https://wa.me/919510757513?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
};

window.changeCatalogCardImage = function(productId, newImgSrc, swatchEl, event, finishId, finishName) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }
  const products = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
  const product = products.find(p => p.id === productId);

  const cards = document.querySelectorAll(`.product-card[data-id="${productId}"]`);
  cards.forEach(card => {
    if (finishId) card.setAttribute('data-selected-finish-id', finishId);
    if (finishName) card.setAttribute('data-selected-finish-name', finishName);
    if (newImgSrc) card.setAttribute('data-selected-finish-img', newImgSrc);

    // Update navigation destination
    const targetUrl = `product-detail?id=${productId}${finishId ? `&finish=${finishId}` : ''}`;
    card.setAttribute('onclick', `window.location.href='${targetUrl}'`);
    const cardTitleLink = card.querySelector('.capsule-title a');
    if (cardTitleLink) {
      cardTitleLink.setAttribute('href', targetUrl);
    }

    // Dynamic price update on card when finish/color is changed
    if (product) {
      const finish = product.finishes ? product.finishes.find(f => f.id === finishId) : null;
      const finishDelta = (finish && typeof finish.priceDelta === 'number') ? finish.priceDelta : 0;
      const cardPrice = product.price + finishDelta;
      const priceEl = card.querySelector('.capsule-price');
      if (priceEl) {
        priceEl.textContent = `₹${cardPrice}`;
      }
    }

    const img = card.querySelector('.product-image');
    if (img && newImgSrc) {
      img.style.transition = 'opacity 0.15s ease-out';
      img.style.opacity = '0.35';
      img.src = newImgSrc;
      if (img.complete) {
        img.style.opacity = '1';
      } else {
        img.onload = () => { img.style.opacity = '1'; };
        img.onerror = () => { img.style.opacity = '1'; };
      }
    }

    const dots = card.querySelectorAll('.card-swatch-dot');
    dots.forEach(d => d.classList.remove('active'));
  });

  if (swatchEl) swatchEl.classList.add('active');
};

function resetFilters() {
  currentCategory = 'all';
  searchQuery = '';
  currentSort = 'featured';

  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) searchInput.value = '';
  const drawerSearch = document.getElementById('drawerSearchInput');
  if (drawerSearch) drawerSearch.value = '';

  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) sortSelect.value = 'featured';

  document.querySelectorAll('.drawer-sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-sort') === 'featured');
  });

  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
  });

  const catText = document.getElementById('currentCategoryText');
  if (catText) catText.textContent = 'All Products';

  renderCatalog();
}

window.resetFilters = resetFilters;

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
