/**
 * RAJESH FRAMING - SHOPPING CART & CHECKOUT ENGINE
 * Handles persistent localStorage cart, Navbar badge sync, Cart Drawer, and Checkout routing
 */

const CART_KEY = 'rf_cart';

// Base API URL
const CART_API_BASE = window.location.origin.includes(':5500') 
  ? 'http://localhost:5000' 
  : window.location.origin;

/* ==========================================================================
   CART DATA OPERATIONS (LOCALSTORAGE & PER-CUSTOMER ACCOUNT ISOLATION)
   ========================================================================== */
function getActiveCustomerEmail() {
  try {
    if (typeof getCustomerUser === 'function') {
      const u = getCustomerUser();
      if (u && u.email) return u.email.toLowerCase().trim();
    }
    const raw = localStorage.getItem('rf_customer_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) return u.email.toLowerCase().trim();
    }
  } catch (_) {}
  return null;
}

function getCartStorageKey() {
  const email = getActiveCustomerEmail();
  return email ? `rf_cart_${email}` : 'rf_cart_guest';
}

function getCart() {
  const email = getActiveCustomerEmail();
  // Strictly isolate per customer: If not logged in, return empty cart so no data leaks!
  if (!email) {
    return [];
  }
  try {
    const raw = localStorage.getItem(getCartStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading cart from localStorage:', e);
    return [];
  }
}

let syncCartTimer = null;
function syncCartToServer(cart) {
  const email = getActiveCustomerEmail();
  const token = typeof getCustomerToken === 'function' ? getCustomerToken() : localStorage.getItem('rf_customer_token');
  if (!email || !token) return;

  clearTimeout(syncCartTimer);
  syncCartTimer = setTimeout(() => {
    fetch(`${CART_API_BASE}/api/customer/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cart })
    }).catch(err => console.warn('Background cart sync warning:', err.message));
  }, 400);
}

function saveCart(cart) {
  const email = getActiveCustomerEmail();
  if (!email) return;

  try {
    localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
    updateCartBadges();
    renderCartDrawer();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    syncCartToServer(cart);
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
}

async function loadCustomerCartFromServer() {
  const email = getActiveCustomerEmail();
  const token = typeof getCustomerToken === 'function' ? getCustomerToken() : localStorage.getItem('rf_customer_token');
  if (!email || !token) {
    updateCartBadges();
    renderCartDrawer();
    return;
  }

  try {
    const res = await fetch(`${CART_API_BASE}/api/customer/sync`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.cart)) {
        localStorage.setItem(getCartStorageKey(), JSON.stringify(data.cart));
        updateCartBadges();
        renderCartDrawer();
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: data.cart } }));
      }
    }
  } catch (e) {
    console.warn('Customer cart server sync note:', e.message);
  }
}

window.addEventListener('customerAuthStateChanged', (e) => {
  const detail = e && e.detail;
  if (detail && detail.isLoggedIn) {
    loadCustomerCartFromServer();
  } else {
    // Logged out: reset cart view to empty for security & privacy
    updateCartBadges();
    renderCartDrawer();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
  }
});

function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
}

/**
 * Add Product to Cart
 * @param {Object} product - Product details { id, name, price, image, category, size, finish, leadTime }
 * @param {number} quantity - Quantity to add (default 1)
 * @param {boolean} openDrawer - Whether to slide open the cart drawer immediately
 */
function addToCart(product, quantity = 1, openDrawer = true) {
  if (!product || !product.id) return;

  // Mandatory Sign-In Requirement: Customer must be logged in before adding to cart
  const loggedIn = typeof isCustomerLoggedIn === 'function' 
    ? isCustomerLoggedIn() 
    : (window.CustomerAuth ? window.CustomerAuth.isCustomerLoggedIn() : !!localStorage.getItem('rf_customer_token'));

  if (!loggedIn) {
    if (typeof openCustomerAuthModal === 'function') {
      openCustomerAuthModal(() => {
        addToCart(product, quantity, openDrawer);
      }, {
        title: 'Sign In to Add to Cart',
        subtitle: `Please sign in or create an account to add "${product.name || 'product'}" to your cart.`
      });
    } else {
      alert('Please sign in or create an account to add items to your cart.');
    }
    return;
  }

  const cart = getCart();
  const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
  const size = product.size || 'Standard';
  const finish = product.finish || 'Standard';

  // Check if same product with same size & finish is already in cart
  const existingIndex = cart.findIndex(item => 
    item.id === product.id && 
    (item.size || 'Standard') === size && 
    (item.finish || 'Standard') === finish
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += qtyToAdd;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 650,
      image: product.image || 'assets/images/custom_canvas.jpg',
      category: product.category || 'frames',
      size: size,
      finish: finish,
      leadTime: product.leadTime || '24 - 48 Hours',
      quantity: qtyToAdd
    });
  }

  saveCart(cart);
  showCartToast(product.name, qtyToAdd);

  if (openDrawer) {
    openCartDrawer();
  }
}

/**
 * Buy Now: Immediately add product and redirect to checkout
 */
function buyNow(product, quantity = 1) {
  if (!product || !product.id) return;

  // Customer Login Requirement: Must be logged in before buying
  const loggedIn = typeof isCustomerLoggedIn === 'function' 
    ? isCustomerLoggedIn() 
    : (window.CustomerAuth ? window.CustomerAuth.isCustomerLoggedIn() : !!localStorage.getItem('rf_customer_token'));

  if (!loggedIn) {
    if (typeof openCustomerAuthModal === 'function') {
      openCustomerAuthModal(() => {
        buyNow(product, quantity);
      }, {
        title: 'Sign In to Buy Now',
        subtitle: 'Please sign in or create an account to proceed directly to checkout.'
      });
    } else {
      alert('Please log in to your account first.');
    }
    return;
  }

  addToCart(product, quantity, false);
  window.location.href = 'checkout';
}

function updateQuantity(index, newQty) {
  const cart = getCart();
  if (!cart[index]) return;

  const qty = parseInt(newQty, 10);
  if (qty <= 0) {
    removeFromCart(index);
    return;
  }

  cart[index].quantity = qty;
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  if (cart[index]) {
    cart.splice(index, 1);
    saveCart(cart);
  }
}

function clearCart() {
  saveCart([]);
}

/* ==========================================================================
   UI: CART BADGE & NOTIFICATIONS
   ========================================================================== */
function updateCartBadges() {
  const count = getCartCount();
  const badges = document.querySelectorAll('.cart-badge, #navbarCartBadge');

  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
    badge.classList.remove('bump');
    void badge.offsetWidth; // Trigger reflow
    if (count > 0) {
      badge.classList.add('bump');
    }
  });
}

function showCartToast(productName, quantity) {
  let toast = document.getElementById('cartToastNotification');
  if (!toast) {
    injectCartDrawerMarkup();
    toast = document.getElementById('cartToastNotification');
  }
  if (!toast) return;

  const msg = toast.querySelector('.toast-msg');
  if (msg) {
    msg.textContent = `${quantity > 1 ? `${quantity}x ` : ''}"${productName}" added to cart!`;
  }

  toast.classList.add('show');
  if (window._cartToastTimeout) clearTimeout(window._cartToastTimeout);
  window._cartToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/* ==========================================================================
   UI: CART DRAWER INJECTION & RENDERING
   ========================================================================== */
function injectCartDrawerMarkup() {
  if (document.getElementById('cartDrawerOverlay')) return;

  const drawerHtml = `
    <!-- Cart Drawer Overlay -->
    <div class="cart-drawer-overlay" id="cartDrawerOverlay" aria-modal="true" role="dialog">
      <div class="cart-drawer" id="cartDrawer">
        
        <!-- Header -->
        <div class="cart-drawer-header">
          <div class="cart-drawer-title-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold, #C99A3D);">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h3 class="cart-drawer-title">Shopping Cart</h3>
            <span class="cart-count-pill" id="drawerCartCountPill">0</span>
          </div>
          <button type="button" class="cart-drawer-close" id="cartDrawerCloseBtn" aria-label="Close cart">&times;</button>
        </div>

        <!-- Shipping / Studio Pick Notice -->
        <div class="cart-shipping-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669; flex-shrink: 0;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span><strong>Free Studio Pickup</strong> &amp; Safe Bubble Transit across Dahej / Bharuch</span>
        </div>

        <!-- Items Body -->
        <div class="cart-drawer-body" id="cartDrawerBody">
          <!-- Rendered dynamically -->
        </div>

        <!-- Footer -->
        <div class="cart-drawer-footer" id="cartDrawerFooter">
          <div class="cart-summary-row">
            <span>Subtotal:</span>
            <span id="drawerSubtotalAmount">₹0</span>
          </div>
          <div class="cart-summary-row">
            <span>Packaging &amp; Corner Shields:</span>
            <span style="color: #059669; font-weight: 600;">FREE</span>
          </div>
          <div class="cart-summary-row total">
            <span>Estimated Total:</span>
            <span id="drawerTotalAmount">₹0</span>
          </div>

          <a href="checkout" class="btn-cart-checkout" id="drawerCheckoutBtn">
            <span>Proceed to Checkout</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>

          <button type="button" class="btn-cart-continue" id="drawerContinueBtn">
            ← Continue Browsing Catalog
          </button>
        </div>

      </div>
    </div>

    <!-- Floating Toast Notification -->
    <div class="cart-toast" id="cartToastNotification">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #10B981; flex-shrink: 0;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span class="toast-msg" style="font-size: 0.85rem; font-weight: 500;">Item added to cart!</span>
      <button type="button" class="cart-toast-btn" id="cartToastViewBtn" onclick="handleViewCartClick(event)">View Cart</button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', drawerHtml);
  bindDrawerEvents();
}

function renderCartDrawer() {
  const body = document.getElementById('cartDrawerBody');
  const footer = document.getElementById('cartDrawerFooter');
  const countPill = document.getElementById('drawerCartCountPill');
  const subtotalEl = document.getElementById('drawerSubtotalAmount');
  const totalEl = document.getElementById('drawerTotalAmount');
  const checkoutBtn = document.getElementById('drawerCheckoutBtn');

  if (!body) return;

  const cart = getCart();
  const count = getCartCount();
  const subtotal = getCartSubtotal();

  if (countPill) countPill.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (totalEl) totalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h4 class="cart-empty-title">Your Cart is Empty</h4>
        <p class="cart-empty-text">Browse our luxury glass frames, personalized bottles, mugs, and fine art prints to add items to your cart.</p>
        <a href="products" class="btn btn-gold shimmer-effect" style="display: inline-block; padding: 10px 24px;" onclick="closeCartDrawer()">
          Explore Products
        </a>
      </div>
    `;

    if (checkoutBtn) {
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '0.5';
    }
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.style.pointerEvents = 'auto';
    checkoutBtn.style.opacity = '1';
  }

  body.innerHTML = cart.map((item, index) => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    
    // Resolve product detail URL
    let targetId = item.id || item.productId || '';
    if (!targetId && typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
      const found = PRODUCTS_DATA.find(p => p.name && p.name.trim().toLowerCase() === (item.name || '').trim().toLowerCase());
      if (found) targetId = found.id;
    }
    const isHtml = window.location.protocol === 'file:' || (window.location.pathname && window.location.pathname.endsWith('.html') && window.location.protocol !== 'http:' && window.location.protocol !== 'https:');
    const base = isHtml ? 'product-detail.html' : 'product-detail';
    let productUrl = targetId ? `${base}?id=${encodeURIComponent(targetId)}` : 'products';
    let finishId = item.finishId;
    if (!finishId && item.finish && item.finish !== 'Standard' && typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
      const p = PRODUCTS_DATA.find(prod => prod.id === targetId);
      if (p && Array.isArray(p.finishes)) {
        const matchedFinish = p.finishes.find(f => f.name && f.name.trim().toLowerCase() === item.finish.trim().toLowerCase());
        if (matchedFinish && matchedFinish.id) finishId = matchedFinish.id;
      }
    }
    if (finishId) productUrl += `&finish=${encodeURIComponent(finishId)}`;

    return `
      <div class="cart-item" data-index="${index}">
        <a href="${productUrl}" class="cart-item-img-link" title="View ${escapeCartHtml(item.name)}" onclick="closeCartDrawer();">
          <img src="${item.image || 'assets/images/custom_canvas.jpg'}" alt="${item.name}" class="cart-item-img" onerror="this.src='assets/images/custom_canvas.jpg'" />
        </a>
        
        <div class="cart-item-info">
          <div>
            <h4 class="cart-item-title">
              <a href="${productUrl}" class="cart-item-title-link" title="View ${escapeCartHtml(item.name)}" onclick="closeCartDrawer();">
                ${escapeCartHtml(item.name)}
              </a>
            </h4>
            <div class="cart-item-meta">
              ${item.size && item.size !== 'Standard' ? `<span>Size: <strong>${escapeCartHtml(item.size)}</strong></span> • ` : ''}
              ${item.finish && item.finish !== 'Standard' ? `<span>Finish: <strong>${escapeCartHtml(item.finish)}</strong></span>` : ''}
            </div>
            ${item.uploadedPhoto ? `
              <div style="margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #059669; background: #ECFDF5; padding: 2px 7px; border-radius: 4px; border: 1px solid #A7F3D0;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>Photo Attached</span>
                ${item.uploadedPhoto.fileUrl ? `<a href="${item.uploadedPhoto.fileUrl}" target="_blank" style="color: #059669; text-decoration: underline; margin-left: 2px;" onclick="event.stopPropagation()">View</a>` : ''}
              </div>
            ` : ''}
            <div class="cart-item-price">₹${Number(item.price).toLocaleString('en-IN')}</div>
          </div>

          <div class="cart-qty-stepper">
            <button type="button" class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
            <span class="qty-display">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <button type="button" class="cart-item-remove" onclick="removeFromCart(${index})" title="Remove item" aria-label="Remove item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

// Variables to keep track of previously active navigation items
let previousActiveNavElement = null;
let previousActiveMobileElement = null;

function highlightCartNav() {
  // Desktop Nav Highlight
  const activeDesktopNav = document.querySelector('.nav-menu .nav-link.active, .nav-menu .nav-item-btn.active');
  const cartDesktopBtn = document.getElementById('navbarCartBtn') || 
                         document.querySelector('.nav-menu button[onclick*="openCartDrawer"]');
  
  if (cartDesktopBtn && !cartDesktopBtn.classList.contains('active')) {
    if (activeDesktopNav && activeDesktopNav !== cartDesktopBtn) {
      previousActiveNavElement = activeDesktopNav;
      activeDesktopNav.classList.remove('active');
    }
    cartDesktopBtn.classList.add('active');
  }

  // Mobile Bottom Nav Highlight
  const activeMobileNav = document.querySelector('.mobile-bottom-nav .mobile-nav-item.active');
  const cartMobileBtn = document.getElementById('mobileNavCart');
  
  if (cartMobileBtn && !cartMobileBtn.classList.contains('active')) {
    if (activeMobileNav && activeMobileNav !== cartMobileBtn) {
      previousActiveMobileElement = activeMobileNav;
      activeMobileNav.classList.remove('active');
    }
    cartMobileBtn.classList.add('active');
  }
}

function unhighlightCartNav() {
  // Do not unhighlight on checkout page
  const isCheckoutPage = window.location.pathname.includes('checkout') || 
                         window.location.href.includes('checkout');
  if (isCheckoutPage) return;

  const cartDesktopBtn = document.getElementById('navbarCartBtn') || 
                         document.querySelector('.nav-menu button[onclick*="openCartDrawer"]');
  if (cartDesktopBtn) {
    cartDesktopBtn.classList.remove('active');
  }
  if (previousActiveNavElement) {
    previousActiveNavElement.classList.add('active');
    previousActiveNavElement = null;
  }

  const cartMobileBtn = document.getElementById('mobileNavCart');
  if (cartMobileBtn) {
    cartMobileBtn.classList.remove('active');
  }
  if (previousActiveMobileElement) {
    previousActiveMobileElement.classList.add('active');
    previousActiveMobileElement = null;
  }
}

function openCartDrawer(forceOpen = false) {
  const existingOverlay = document.getElementById('cartDrawerOverlay');
  if (!forceOpen && existingOverlay && existingOverlay.classList.contains('open')) {
    closeCartDrawer();
    return;
  }

  if (typeof closeWishlistDrawer === 'function') {
    closeWishlistDrawer();
  }
  if (typeof closeCustomerAuthModal === 'function') {
    closeCustomerAuthModal();
  }

  highlightCartNav();
  let overlay = document.getElementById('cartDrawerOverlay');
  if (!overlay) {
    injectCartDrawerMarkup();
    overlay = document.getElementById('cartDrawerOverlay');
  }
  if (!overlay) {
    window.location.href = 'checkout';
    return;
  }
  renderCartDrawer();
  overlay.classList.add('open');
  document.body.classList.add('drawer-open', 'cart-open');
  document.body.classList.add('drawer-open', 'cart-open');
  document.body.style.overflow = 'hidden';

  // Dismiss toast if currently showing
  const toast = document.getElementById('cartToastNotification');
  if (toast) toast.classList.remove('show');
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.classList.remove('drawer-open', 'cart-open');
  document.body.classList.remove('drawer-open', 'cart-open');
  document.body.style.overflow = '';
  unhighlightCartNav();
}

function handleViewCartClick(event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }
  const toast = document.getElementById('cartToastNotification');
  if (toast) {
    toast.classList.remove('show');
  }
  openCartDrawer();
}

function bindDrawerEvents() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const closeBtn = document.getElementById('cartDrawerCloseBtn');
  const continueBtn = document.getElementById('drawerContinueBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  if (continueBtn) continueBtn.addEventListener('click', closeCartDrawer);

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCartDrawer();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      closeCartDrawer();
    }
  });
}

/* ==========================================================================
   GLOBAL CLICK LISTENERS & INITIALIZATION
   ========================================================================== */
function initCart() {
  injectCartDrawerMarkup();
  updateCartBadges();
  loadCustomerCartFromServer();

  const isCheckoutPage = window.location.pathname.includes('checkout') || 
                         window.location.href.includes('checkout');
  if (isCheckoutPage) {
    highlightCartNav();
  }

  // Global delegated click listeners
  document.addEventListener('click', (e) => {
    // 1. Toast "View Cart" button
    const toastBtn = e.target.closest('.cart-toast-btn');
    if (toastBtn) {
      e.preventDefault();
      e.stopPropagation();
      handleViewCartClick(e);
      return;
    }

    // 2. Navbar cart buttons
    const cartTrigger = e.target.closest('#navbarCartBtn, .navbar-cart-btn, [data-open-cart]');
    if (cartTrigger) {
      e.preventDefault();
      openCartDrawer();
      return;
    }

    // 3. Direct Add to Cart attribute
    const addTrigger = e.target.closest('[data-add-to-cart]');
    if (addTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const productId = addTrigger.getAttribute('data-product-id');
      quickAddToCart(productId, e);
      return;
    }
  });
}

function quickAddToCart(productId, event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }

  // Add to cart and open drawer for instant visual confirmation
  handleProductCardAddToCart(productId, true, event);

  // Visual button feedback
  const btn = (event && (event.currentTarget || (event.target && event.target.closest('button')))) || 
              document.querySelector(`button[data-product-id="${productId}"][data-add-to-cart]`);
  if (btn) {
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<span>Added ✓</span>';
    btn.style.background = '#2E7D32';
    btn.style.color = '#FFFFFF';
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.style.background = '';
      btn.style.color = '';
    }, 1500);
  }
}

function buyNowFromCard(productId, event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }
  const products = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
  const product = products.find(p => p.id === productId);
  if (!product) {
    window.location.href = `product-detail?id=${productId}`;
    return;
  }
  const card = event && event.target ? event.target.closest('.product-card') : document.querySelector(`.product-card[data-id="${productId}"]`);
  const selectedFinishId = card ? card.getAttribute('data-selected-finish-id') : null;
  const selectedFinishName = card ? card.getAttribute('data-selected-finish-name') : null;
  const selectedFinishImg = card ? card.getAttribute('data-selected-finish-img') : null;

  const selectedFinish = product.finishes ? product.finishes.find(f => f.id === selectedFinishId || f.name === selectedFinishName) : null;
  const finishDelta = (selectedFinish && typeof selectedFinish.priceDelta === 'number') ? selectedFinish.priceDelta : 0;
  const cardPrice = (Number(product.price) || 650) + finishDelta;

  buyNow({
    id: product.id,
    name: product.name,
    price: cardPrice,
    image: selectedFinishImg || product.image,
    category: product.category,
    size: 'Standard',
    finish: selectedFinishName || (product.finishes && product.finishes.length > 0 ? product.finishes[0].name : 'Standard'),
    leadTime: product.leadTime || '24 - 48 Hours'
  }, 1);
}

function handleProductCardAddToCart(productId, openDrawer = false, event = null) {
  if (!productId) return;
  const products = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const card = event && event.target ? event.target.closest('.product-card') : document.querySelector(`.product-card[data-id="${productId}"]`);
  const selectedFinishId = card ? card.getAttribute('data-selected-finish-id') : null;
  const selectedFinishName = card ? card.getAttribute('data-selected-finish-name') : null;
  const selectedFinishImg = card ? card.getAttribute('data-selected-finish-img') : null;

  const selectedFinish = product.finishes ? product.finishes.find(f => f.id === selectedFinishId || f.name === selectedFinishName) : null;
  const finishDelta = (selectedFinish && typeof selectedFinish.priceDelta === 'number') ? selectedFinish.priceDelta : 0;
  const cardPrice = (Number(product.price) || 650) + finishDelta;

  addToCart({
    id: product.id,
    name: product.name,
    price: cardPrice,
    image: selectedFinishImg || product.image,
    category: product.category,
    size: 'Standard',
    finish: selectedFinishName || (product.finishes && product.finishes.length > 0 ? product.finishes[0].name : 'Standard'),
    leadTime: product.leadTime || '24 - 48 Hours'
  }, 1, openDrawer);
}

function escapeCartHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', initCart);

// Make functions globally accessible
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.quickAddToCart = quickAddToCart;
window.buyNowFromCard = buyNowFromCard;
window.quickBuyNow = buyNowFromCard;
window.handleProductCardAddToCart = handleProductCardAddToCart;
window.handleViewCartClick = handleViewCartClick;
window.buyNow = buyNow;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.getCartCount = getCartCount;
window.getCartSubtotal = getCartSubtotal;
window.openCartDrawer = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;

