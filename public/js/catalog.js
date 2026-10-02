/**
 * RAJESH FRAMING - PRODUCTS CATALOG CONTROLLER
 * Category Filtering, Real-time Search, Sorting & Redesigned Luxury Product Cards
 */

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
});

let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'featured';

async function initCatalog() {
  const gridContainer = document.getElementById('catalogProductsGrid');
  if (!gridContainer) return;

  // Sync fresh products from server if available
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        window.PRODUCTS_DATA = data.products.map(p => {
          const existing = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []).find(e => e.id === p.id);
          return { ...existing, ...p };
        });
      }
    }
  } catch (e) {
    // Fallback to static PRODUCTS_DATA
  }

  if (typeof PRODUCTS_DATA === 'undefined') return;

  // Check URL query params for initial category filter
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  if (paramCategory) {
    currentCategory = paramCategory;
  }

  setupFilterButtons();
  setupSearchInput();
  setupSortSelect();
  renderCatalog();
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    const filterVal = btn.getAttribute('data-filter');
    if (filterVal === currentCategory) {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = filterVal;
      renderCatalog();
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById('catalogSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderCatalog();
  });
}

function setupSortSelect() {
  const sortSelect = document.getElementById('catalogSortSelect');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderCatalog();
  });
}

function renderCatalog() {
  const gridContainer = document.getElementById('catalogProductsGrid');
  const countBadge = document.getElementById('catalogResultsCount');
  if (!gridContainer) return;

  // Filter products
  let filtered = PRODUCTS_DATA.filter(item => {
    const matchesCategory = (currentCategory === 'all') || (item.category === currentCategory);

    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery) ||
      item.shortDescription.toLowerCase().includes(searchQuery) ||
      item.categoryLabel.toLowerCase().includes(searchQuery) ||
      item.material.toLowerCase().includes(searchQuery);

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
    const initialCardImg = (product.finishes && product.finishes.length > 0 && product.finishes[0].image) ? product.finishes[0].image : product.image;

    const defaultFinish = (product.finishes && product.finishes.length > 0) ? product.finishes[0] : null;
    const finishesHtml = (product.finishes && product.finishes.length > 0) ? `
      <div class="card-color-swatches" onclick="event.stopPropagation();" aria-label="Available Colors">
        ${product.finishes.map((f, i) => `
          <button type="button" 
            class="card-swatch-dot ${i === 0 ? 'active' : ''}" 
            style="background-color: ${f.color};" 
            title="${f.name}"
            aria-label="${f.name}"
            data-product-id="${product.id}"
            data-finish-id="${f.id}"
            data-finish-name="${f.name}"
            data-finish-img="${f.image || product.image}"
            onclick="changeCatalogCardImage('${product.id}', '${f.image || product.image}', this, event, '${f.id}', '${f.name}');">
          </button>
        `).join('')}
      </div>
    ` : '';

    return `
    <article class="product-card" data-id="${product.id}" data-selected-finish-id="${defaultFinish ? defaultFinish.id : ''}" data-selected-finish-name="${defaultFinish ? defaultFinish.name : ''}" data-selected-finish-img="${initialCardImg}" onclick="window.location.href='product-detail?id=${product.id}${defaultFinish ? `&finish=${defaultFinish.id}` : ''}'">
      <div class="product-card-top">
        ${product.badge ? `<span class="product-badge-pill">${product.badge}</span>` : '<span></span>'}
        <button type="button" class="product-wishlist-btn ${wishActive ? 'active' : ''}" data-wishlist-id="${product.id}" aria-label="Add to wishlist" onclick="toggleWishlist('${product.id}', event);" title="Add to Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="product-image-box">
        <img src="${initialCardImg}" alt="${product.name}" class="product-image" loading="lazy" />
        <div class="product-image-overlay"></div>
      </div>

      <div class="product-capsule">
        <div class="capsule-top-row">
          <h3 class="capsule-title">
            <a href="product-detail?id=${product.id}${defaultFinish ? `&finish=${defaultFinish.id}` : ''}">${product.name}</a>
          </h3>
          <span class="capsule-price">${priceFormatted}</span>
        </div>
        ${finishesHtml}
        <div class="capsule-bottom-row" style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
          <button type="button" class="capsule-action-btn" data-add-to-cart data-product-id="${product.id}" onclick="quickAddToCart('${product.id}', event);" title="Add to Cart" style="flex: 1; justify-content: center; padding: 6px 10px; font-size: 0.72rem;">
            <span>+ Cart</span>
          </button>
          <button type="button" class="capsule-action-btn" onclick="event.stopPropagation(); window.quickBuyNow('${product.id}', event);" title="Buy Now" style="flex: 1; justify-content: center; padding: 6px 10px; font-size: 0.72rem; background: #111111 !important; border: 1px solid #C99A3D !important; color: #FFFFFF !important;">
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </article>
  `}).join('');
}

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

  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) sortSelect.value = 'featured';

  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    if (btn.getAttribute('data-filter') === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderCatalog();
}

window.resetFilters = resetFilters;
