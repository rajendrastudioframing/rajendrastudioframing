/**
 * RAJESH FRAMING - WISHLIST SYSTEM
 * Persistent wishlist management via localStorage, interactive heart toggles,
 * luxury slide-out wishlist drawer, and seamless "Move to Cart" actions.
 */

const WISHLIST_STORAGE_KEY = 'rajesh_framing_wishlist';

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading wishlist from localStorage:', e);
    return [];
  }
}

function saveWishlist(wishlist) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    updateWishlistUI();
  } catch (e) {
    console.error('Error saving wishlist to localStorage:', e);
  }
}

function getWishlistCount() {
  return getWishlist().length;
}

function isInWishlist(productId) {
  if (!productId) return false;
  const list = getWishlist();
  return list.some(item => item.id === productId);
}

function toggleWishlist(productId, event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }

  if (!productId) return;

  let list = getWishlist();
  const existingIdx = list.findIndex(item => item.id === productId);

  if (existingIdx > -1) {
    // Remove from wishlist
    const removedItem = list.splice(existingIdx, 1)[0];
    saveWishlist(list);
    showWishlistToast(`"${removedItem.name}" removed from Wishlist`, false);
  } else {
    // Add to wishlist
    const products = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
    const product = products.find(p => p.id === productId);

    const newItem = {
      id: productId,
      name: product ? product.name : 'Custom Framing Product',
      price: product ? (Number(product.price) || 650) : 650,
      image: product ? product.image : 'assets/images/custom_canvas.jpg',
      category: product ? product.category : 'frames',
      dateAdded: new Date().toISOString()
    };

    list.unshift(newItem);
    saveWishlist(list);
    showWishlistToast(`"${newItem.name}" added to Wishlist!`, true);
  }

  // Visual animation on clicked button
  if (event && event.currentTarget) {
    const btn = event.currentTarget;
    btn.classList.add('heart-pop');
    setTimeout(() => btn.classList.remove('heart-pop'), 400);
  }

  renderWishlistDrawer();
}

function removeFromWishlist(productId, event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }
  let list = getWishlist();
  list = list.filter(item => item.id !== productId);
  saveWishlist(list);
  renderWishlistDrawer();
}

function moveWishlistItemToCart(productId, event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }

  let list = getWishlist();
  const item = list.find(p => p.id === productId);
  if (!item) return;

  // Add to cart
  if (window.addToCart) {
    window.addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      size: 'Standard',
      finish: 'Warm Gold',
      leadTime: '24 - 48 Hours'
    }, 1, false);
  }

  // Remove from wishlist
  list = list.filter(p => p.id !== productId);
  saveWishlist(list);
  renderWishlistDrawer();

  // Show confirmation toast
  showWishlistToast(`"${item.name}" moved to Cart!`, false);

  // Open cart drawer after slight delay
  setTimeout(() => {
    closeWishlistDrawer();
    if (window.openCartDrawer) window.openCartDrawer();
  }, 400);
}

function moveAllWishlistToCart() {
  const list = getWishlist();
  if (list.length === 0) return;

  list.forEach(item => {
    if (window.addToCart) {
      window.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        size: 'Standard',
        finish: 'Warm Gold',
        leadTime: '24 - 48 Hours'
      }, 1, false);
    }
  });

  saveWishlist([]);
  renderWishlistDrawer();
  closeWishlistDrawer();

  if (window.openCartDrawer) {
    setTimeout(window.openCartDrawer, 300);
  }
}

function updateWishlistUI() {
  const list = getWishlist();
  const count = list.length;

  // 1. Update navbar badge
  const badges = document.querySelectorAll('.wishlist-badge, #navbarWishlistBadge, .wishlist-badge-inline');
  badges.forEach(badge => {
    badge.textContent = count;
    if (badge.classList.contains('wishlist-badge')) {
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  });

  // 2. Sync all heart buttons on the page
  const heartButtons = document.querySelectorAll('.product-wishlist-btn, [data-wishlist-id]');
  heartButtons.forEach(btn => {
    const id = btn.getAttribute('data-wishlist-id') || btn.closest('[data-id]')?.getAttribute('data-id');
    if (id) {
      const active = isInWishlist(id);
      btn.classList.toggle('active', active);
    }
  });

  // 3. Detail page wishlist button
  const detailBtn = document.getElementById('detailWishlistBtn');
  if (detailBtn) {
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('id') || 'glass-frame-classic';
    const active = isInWishlist(prodId);
    detailBtn.classList.toggle('active', active);
    const label = detailBtn.querySelector('.wishlist-btn-text');
    if (label) {
      label.textContent = active ? 'Saved to Wishlist' : 'Add to Wishlist';
    }
  }
}

/* ==========================================================================
   UI: WISHLIST DRAWER
   ========================================================================== */
function injectWishlistDrawerMarkup() {
  if (document.getElementById('wishlistDrawerOverlay')) return;

  const drawerHtml = `
    <!-- Wishlist Drawer Overlay -->
    <div class="wishlist-drawer-overlay" id="wishlistDrawerOverlay" aria-modal="true" role="dialog">
      <div class="wishlist-drawer" id="wishlistDrawer">
        
        <!-- Header -->
        <div class="wishlist-drawer-header">
          <div class="wishlist-drawer-title-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3 class="wishlist-drawer-title">My Wishlist</h3>
            <span class="wishlist-count-pill" id="drawerWishlistCountPill">0 items</span>
          </div>
          <button type="button" class="wishlist-drawer-close" id="wishlistDrawerCloseBtn" aria-label="Close wishlist">&times;</button>
        </div>

        <!-- Wishlist Items Body -->
        <div class="wishlist-drawer-body" id="wishlistDrawerBody">
          <!-- Rendered dynamically -->
        </div>

        <!-- Footer -->
        <div class="wishlist-drawer-footer" id="wishlistDrawerFooter">
          <button type="button" class="btn-wishlist-move-all" id="btnWishlistMoveAll" onclick="moveAllWishlistToCart()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Move All to Cart</span>
          </button>
          <button type="button" class="btn-wishlist-continue" id="wishlistContinueBtn" onclick="closeWishlistDrawer()">
            ← Continue Browsing
          </button>
        </div>

      </div>
    </div>

    <!-- Floating Wishlist Toast Notification -->
    <div class="wishlist-toast" id="wishlistToastNotification">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48" stroke-width="1" style="flex-shrink: 0;">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span class="wishlist-toast-msg" style="font-size: 0.85rem; font-weight: 500;">Saved to Wishlist!</span>
      <button type="button" class="wishlist-toast-btn" onclick="openWishlistDrawer()">View Wishlist</button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', drawerHtml);
  bindWishlistDrawerEvents();
}

function renderWishlistDrawer() {
  const body = document.getElementById('wishlistDrawerBody');
  const countPill = document.getElementById('drawerWishlistCountPill');
  const footer = document.getElementById('wishlistDrawerFooter');
  if (!body) return;

  const list = getWishlist();
  if (countPill) countPill.textContent = `${list.length} ${list.length === 1 ? 'item' : 'items'}`;

  if (list.length === 0) {
    body.innerHTML = `
      <div class="wishlist-empty-state">
        <div class="wishlist-empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <h4 class="wishlist-empty-title">Your Wishlist is Empty</h4>
        <p class="wishlist-empty-text">Explore our custom frames, personalized mugs, bottles, and office printing to save your favorite designs.</p>
        <a href="products.html" class="btn btn-gold shimmer-effect" style="display: inline-block; padding: 10px 24px;" onclick="closeWishlistDrawer()">
          Explore Collection
        </a>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  body.innerHTML = list.map(item => `
    <div class="wishlist-item" data-id="${item.id}">
      <img src="${item.image || 'assets/images/custom_canvas.jpg'}" alt="${escapeWishlistHtml(item.name)}" class="wishlist-item-img" onerror="this.src='assets/images/custom_canvas.jpg'" />
      
      <div class="wishlist-item-info">
        <h4 class="wishlist-item-title">${escapeWishlistHtml(item.name)}</h4>
        <div class="wishlist-item-price">₹${Number(item.price).toLocaleString('en-IN')}</div>
        
        <div class="wishlist-item-actions">
          <button type="button" class="btn-wishlist-cart" onclick="moveWishlistItemToCart('${item.id}', event)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span>Move to Cart</span>
          </button>
          
          <button type="button" class="btn-wishlist-remove" onclick="removeFromWishlist('${item.id}', event)" title="Remove item" aria-label="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openWishlistDrawer() {
  let overlay = document.getElementById('wishlistDrawerOverlay');
  if (!overlay) {
    injectWishlistDrawerMarkup();
    overlay = document.getElementById('wishlistDrawerOverlay');
  }
  if (!overlay) return;

  renderWishlistDrawer();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWishlistDrawer() {
  const overlay = document.getElementById('wishlistDrawerOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function bindWishlistDrawerEvents() {
  const overlay = document.getElementById('wishlistDrawerOverlay');
  const closeBtn = document.getElementById('wishlistDrawerCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeWishlistDrawer);

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeWishlistDrawer();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      closeWishlistDrawer();
    }
  });
}

function showWishlistToast(message, showViewBtn = true) {
  let toast = document.getElementById('wishlistToastNotification');
  if (!toast) return;

  const msgEl = toast.querySelector('.wishlist-toast-msg');
  if (msgEl) msgEl.textContent = message;

  const btn = toast.querySelector('.wishlist-toast-btn');
  if (btn) btn.style.display = showViewBtn ? 'inline-block' : 'none';

  toast.classList.add('show');
  if (window._wishlistToastTimeout) clearTimeout(window._wishlistToastTimeout);
  window._wishlistToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function escapeWishlistHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global click listeners for Wishlist buttons
document.addEventListener('DOMContentLoaded', () => {
  injectWishlistDrawerMarkup();
  updateWishlistUI();

  document.addEventListener('click', (e) => {
    // Open wishlist drawer trigger
    const trigger = e.target.closest('#navbarWishlistBtn, .navbar-wishlist-btn, [data-open-wishlist]');
    if (trigger) {
      e.preventDefault();
      openWishlistDrawer();
      return;
    }

    // Product card wishlist toggle button
    const heartBtn = e.target.closest('.product-wishlist-btn');
    if (heartBtn) {
      e.preventDefault();
      e.stopPropagation();
      const prodId = heartBtn.getAttribute('data-wishlist-id') || heartBtn.closest('[data-id]')?.getAttribute('data-id');
      if (prodId) {
        toggleWishlist(prodId, e);
      }
      return;
    }
  });
});

// Export functions to window
window.getWishlist = getWishlist;
window.saveWishlist = saveWishlist;
window.getWishlistCount = getWishlistCount;
window.isInWishlist = isInWishlist;
window.toggleWishlist = toggleWishlist;
window.removeFromWishlist = removeFromWishlist;
window.moveWishlistItemToCart = moveWishlistItemToCart;
window.moveAllWishlistToCart = moveAllWishlistToCart;
window.openWishlistDrawer = openWishlistDrawer;
window.closeWishlistDrawer = closeWishlistDrawer;
window.updateWishlistUI = updateWishlistUI;
