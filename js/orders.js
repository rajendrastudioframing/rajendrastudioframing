/**
 * DAHEJ SUPPORT / RAJENDRA STUDIO - ORDERS CONTROLLER
 * Full order history management, craftsmanship tracking, printable invoices, and guest lookup
 */

const API_BASE = window.location.origin.includes(':5500') 
  ? 'http://localhost:5000' 
  : window.location.origin;

let allCustomerOrders = [];
let activeFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initOrdersPage();

  // Listen to customer auth changes (login/logout) to re-render automatically
  window.addEventListener('customerAuthStateChanged', () => {
    initOrdersPage();
  });
});

async function initOrdersPage() {
  const user = window.CustomerAuth ? window.CustomerAuth.getCustomerUser() : null;
  const isLoggedIn = window.CustomerAuth ? window.CustomerAuth.isCustomerLoggedIn() : false;

  updateUserGreetingUI(user, isLoggedIn);

  // Parse URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search') || urlParams.get('id');
  const filterParam = urlParams.get('filter');

  if (filterParam) {
    activeFilter = filterParam;
  }
  if (searchParam) {
    searchQuery = searchParam.trim();
    const searchInput = document.getElementById('ordersSearchInput');
    if (searchInput) searchInput.value = searchQuery;
  }

  // Set active tab button style
  updateTabButtonsUI();

  if (isLoggedIn) {
    await fetchAndRenderCustomerOrders();
  } else {
    renderLoggedOutState();
  }
}

function updateUserGreetingUI(user, isLoggedIn) {
  const pill = document.getElementById('ordersUserPill');
  if (!pill) return;

  if (isLoggedIn && user) {
    const displayName = (user.name && user.name.trim() !== 'Valued Customer') 
      ? user.name 
      : (user.email ? user.email.split('@')[0] : 'Valued Customer');
    const firstLetter = (displayName.charAt(0) || 'K').toUpperCase();

    pill.style.display = 'inline-flex';
    pill.innerHTML = `
      <span class="orders-user-avatar">${escapeHtml(firstLetter)}</span>
      <span>Viewing orders for <strong>${escapeHtml(displayName)}</strong> (${escapeHtml(user.email || '')})</span>
      <button type="button" onclick="logoutCustomer(true)" style="background:none; border:none; color:#DC2626; font-size:0.78rem; font-weight:700; cursor:pointer; margin-left:6px; text-decoration:underline;">Switch</button>
    `;
  } else {
    pill.style.display = 'none';
  }
}

function updateTabButtonsUI() {
  document.querySelectorAll('.orders-tab-btn').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab === activeFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function switchOrdersTab(tab) {
  activeFilter = tab;
  updateTabButtonsUI();
  renderOrdersList();
}

function handleOrdersSearch(val) {
  searchQuery = (val || '').trim().toLowerCase();
  renderOrdersList();
}

async function fetchAndRenderCustomerOrders() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  const token = window.CustomerAuth ? window.CustomerAuth.getCustomerToken() : null;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <div class="track-spinner" style="margin: 0 auto 16px;"></div>
      <div style="font-weight: 700; font-size: 1.1rem; color: #111;">Loading Your Studio Orders...</div>
      <p style="font-size: 0.88rem; color: #6B7280; margin-top: 4px;">Synchronizing verified orders and production milestones</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/customer/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      allCustomerOrders = data.orders || [];
      updateTabCounts();
      renderOrdersList();
    } else {
      throw new Error(data.message || 'Could not retrieve orders.');
    }
  } catch (err) {
    console.error('Customer orders fetch error:', err);
    container.innerHTML = `
      <div class="orders-empty-card">
        <div class="orders-empty-icon" style="color: #DC2626; background: rgba(220, 38, 38, 0.1);">⚠️</div>
        <h3 class="orders-empty-title">Failed to Load Orders</h3>
        <p class="orders-empty-desc">${escapeHtml(err.message || 'Unable to connect to studio order services.')}</p>
        <button type="button" class="order-btn order-btn-primary" onclick="fetchAndRenderCustomerOrders()">Try Again</button>
      </div>
    `;
  }
}

function updateTabCounts() {
  const total = allCustomerOrders.length;
  const active = allCustomerOrders.filter(isOrderActive).length;
  const delivered = allCustomerOrders.filter(isOrderDelivered).length;
  const cancelled = allCustomerOrders.filter(isOrderCancelled).length;

  setCountText('countAll', total);
  setCountText('countActive', active);
  setCountText('countDelivered', delivered);
  setCountText('countCancelled', cancelled);
}

function setCountText(id, count) {
  const el = document.getElementById(id);
  if (el) el.textContent = count;
}

function isOrderActive(o) {
  const s = (o.status || 'placed').toLowerCase();
  return s !== 'delivered' && s !== 'completed' && s !== 'cancelled';
}

function isOrderDelivered(o) {
  const s = (o.status || '').toLowerCase();
  return s === 'delivered' || s === 'completed';
}

function isOrderCancelled(o) {
  const s = (o.status || '').toLowerCase();
  return s === 'cancelled';
}

function renderOrdersList() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  // Filter by active tab
  let filtered = allCustomerOrders.filter(o => {
    if (activeFilter === 'active') return isOrderActive(o);
    if (activeFilter === 'delivered') return isOrderDelivered(o);
    if (activeFilter === 'cancelled') return isOrderCancelled(o);
    return true; // 'all'
  });

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(o => {
      const idMatch = (o.orderId || '').toLowerCase().includes(searchQuery);
      const nameMatch = (o.customer?.name || '').toLowerCase().includes(searchQuery);
      const itemsMatch = (o.items || []).some(item => (item.name || '').toLowerCase().includes(searchQuery));
      return idMatch || nameMatch || itemsMatch;
    });
  }

  if (filtered.length === 0) {
    if (allCustomerOrders.length === 0) {
      // Zero orders placed yet
      const user = window.CustomerAuth ? window.CustomerAuth.getCustomerUser() : null;
      const email = user ? user.email : 'your account';
      container.innerHTML = `
        <div class="orders-empty-card">
          <div class="orders-empty-icon">🖼️</div>
          <h3 class="orders-empty-title">No Orders Placed Yet</h3>
          <p class="orders-empty-desc">
            You don't have any orders linked with <strong>${escapeHtml(email)}</strong> yet. Explore our handcrafted frames, personalized gifts, and office stationery!
          </p>
          <a href="products" class="order-btn order-btn-primary" style="margin: 0 auto;">
            <span>Browse Products &amp; Frames</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      `;
    } else {
      // Filter returned empty
      container.innerHTML = `
        <div class="orders-empty-card">
          <div class="orders-empty-icon">🔍</div>
          <h3 class="orders-empty-title">No Orders Matching Your Filter</h3>
          <p class="orders-empty-desc">
            No orders found under the "<strong>${escapeHtml(activeFilter)}</strong>" filter or matching "${escapeHtml(searchQuery)}".
          </p>
          <button type="button" class="order-btn order-btn-outline" onclick="switchOrdersTab('all'); handleOrdersSearch(''); document.getElementById('ordersSearchInput').value='';" style="margin: 0 auto;">
            Reset Filters
          </button>
        </div>
      `;
    }
    return;
  }

  // Render Order Cards
  container.innerHTML = `
    <div class="orders-list-grid">
      ${filtered.map(order => createOrderCardHtml(order)).join('')}
    </div>
  `;
}

function createOrderCardHtml(order) {
  const orderId = order.orderId || 'RF-ORD-000';
  const rawStatus = order.status || 'Order Placed';
  const statusSlug = rawStatus.toLowerCase().replace(/\s+/g, '-');
  const dateFormatted = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recently Placed';

  const items = order.items || [];
  const total = Number(order.total || 0).toLocaleString('en-IN');
  const paymentMethod = order.paymentMethod || 'UPI';
  const customer = order.customer || {};

  // Timeline progress & stage calculation
  const timeline = getTimelineStage(rawStatus);

  // Craft WhatsApp Pre-filled message
  const waMsg = encodeURIComponent(`Hello Dahej Support Studio! I have a question regarding my Order #${orderId} (${rawStatus}). Please share an update.`);

  return `
    <article class="order-card" id="orderCard_${escapeHtml(orderId)}">
      
      <!-- Card Header -->
      <div class="order-card-header">
        <div class="order-card-meta">
          <div class="order-id-badge">
            <span>#${escapeHtml(orderId)}</span>
            <button type="button" class="order-copy-btn" onclick="copyOrderId('${escapeHtml(orderId)}')" title="Copy Order ID" aria-label="Copy Order ID">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <span class="order-date-text">• Placed on ${escapeHtml(dateFormatted)}</span>
        </div>
        <div class="order-status-badge status-${statusSlug}">
          <span class="order-status-dot"></span>
          <span>${escapeHtml(rawStatus)}</span>
        </div>
      </div>

      <!-- Craftsmanship Timeline Bar -->
      <div class="order-timeline-wrap">
        <div class="order-timeline-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Craftsmanship &amp; Fulfillment Timeline</span>
        </div>
        <div class="order-timeline-steps">
          <div class="order-timeline-progress" style="width: ${timeline.progressPercent}%;"></div>

          <!-- Step 1: Placed -->
          <div class="order-timeline-step ${timeline.step1Class}">
            <div class="order-step-node">✓</div>
            <div class="order-step-label">Order Placed</div>
          </div>

          <!-- Step 2: In Production -->
          <div class="order-timeline-step ${timeline.step2Class}">
            <div class="order-step-node">${timeline.step2Class === 'completed' ? '✓' : '2'}</div>
            <div class="order-step-label">In Production</div>
          </div>

          <!-- Step 3: Studio Framing -->
          <div class="order-timeline-step ${timeline.step3Class}">
            <div class="order-step-node">${timeline.step3Class === 'completed' ? '✓' : '3'}</div>
            <div class="order-step-label">Studio Crafting</div>
          </div>

          <!-- Step 4: Dispatched -->
          <div class="order-timeline-step ${timeline.step4Class}">
            <div class="order-step-node">${timeline.step4Class === 'completed' ? '✓' : '4'}</div>
            <div class="order-step-label">Dispatched</div>
          </div>

          <!-- Step 5: Delivered -->
          <div class="order-timeline-step ${timeline.step5Class}">
            <div class="order-step-node">${timeline.step5Class === 'completed' ? '✓' : '5'}</div>
            <div class="order-step-label">Delivered</div>
          </div>
        </div>
      </div>

      <!-- Ordered Items Showcase -->
      <div class="order-items-wrap">
        ${items.map(item => `
          <div class="order-item-row">
            <img 
              src="${escapeHtml(item.image || 'assets/images/glass_frame.jpg')}" 
              alt="${escapeHtml(item.name || 'Custom Framed Piece')}" 
              class="order-item-thumb" 
              onerror="this.src='assets/images/glass_frame.jpg'"
            />
            <div class="order-item-details">
              <div class="order-item-title">${escapeHtml(item.name || 'Bespoke Framing')}</div>
              <div class="order-item-specs">
                ${item.size ? `<span class="order-item-spec-tag">📐 ${escapeHtml(item.size)}</span>` : ''}
                ${item.finish ? `<span class="order-item-spec-tag">🎨 ${escapeHtml(item.finish)}</span>` : ''}
                ${item.category ? `<span class="order-item-spec-tag">🏷️ ${escapeHtml(item.category)}</span>` : ''}
              </div>
            </div>
            <div class="order-item-price-block">
              <div class="order-item-total">₹${Number(item.price || 0).toLocaleString('en-IN')}</div>
              <div class="order-item-qty">Qty: ${item.quantity || 1}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Delivery Details & Billing -->
      <div class="order-info-footer">
        <div class="order-delivery-box">
          <div><strong>Delivery Recipient:</strong> ${escapeHtml(customer.name || 'Customer')} (${escapeHtml(customer.phone || '')})</div>
          <div><strong>Address:</strong> ${escapeHtml(customer.address || '')}, ${escapeHtml(customer.city || '')} ${customer.pincode ? `(${escapeHtml(customer.pincode)})` : ''}</div>
          ${order.notes ? `<div style="font-style: italic; color: #76746E; margin-top: 4px;">Note: "${escapeHtml(order.notes)}"</div>` : ''}
        </div>
        <div class="order-total-block">
          <div class="order-total-label">Total Amount Paid / Due</div>
          <div class="order-total-amount">₹${total}</div>
          <div class="order-payment-method">Payment: <strong>${escapeHtml(paymentMethod)}</strong> ${order.paymentStatus ? `(${escapeHtml(order.paymentStatus)})` : ''}</div>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="order-actions-bar">
        <a href="track-order?id=${encodeURIComponent(orderId)}" class="order-btn order-btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Live Tracking</span>
        </a>

        <button type="button" class="order-btn order-btn-outline" onclick="openInvoiceModal('${escapeHtml(orderId)}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Invoice Receipt</span>
        </button>

        ${isOrderActive(order) ? `
          <button type="button" class="order-btn order-btn-outline" onclick="openEditOrderModal('${escapeHtml(orderId)}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit Address</span>
          </button>
        ` : ''}

        <button type="button" class="order-btn order-btn-outline" onclick="reorderItems('${escapeHtml(orderId)}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          <span>Order Again</span>
        </button>

        <a href="https://wa.me/919601574966?text=${waMsg}" target="_blank" class="order-btn order-btn-whatsapp" title="WhatsApp Studio Support">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.974.57 1.879.88 2.791.88 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm0 10.375c-.864 0-1.71-.24-2.449-.694l-.175-.108-1.579.414.421-1.54-.114-.182c-.482-.767-.736-1.564-.736-2.5 0-2.518 2.049-4.567 4.568-4.567 2.519 0 4.568 2.049 4.568 4.567 0 2.518-2.049 4.567-4.568 4.567z"/></svg>
          <span>Support</span>
        </a>
      </div>

    </article>
  `;
}

function getTimelineStage(status) {
  const s = (status || '').toLowerCase();
  
  if (s === 'delivered' || s === 'completed') {
    return {
      progressPercent: 100,
      step1Class: 'completed',
      step2Class: 'completed',
      step3Class: 'completed',
      step4Class: 'completed',
      step5Class: 'completed'
    };
  }

  if (s === 'dispatched' || s === 'shipped') {
    return {
      progressPercent: 75,
      step1Class: 'completed',
      step2Class: 'completed',
      step3Class: 'completed',
      step4Class: 'active',
      step5Class: ''
    };
  }

  if (s === 'framing' || s === 'in production' || s === 'processing') {
    return {
      progressPercent: 50,
      step1Class: 'completed',
      step2Class: 'completed',
      step3Class: 'active',
      step4Class: '',
      step5Class: ''
    };
  }

  if (s === 'new' || s === 'placed' || s === 'order placed') {
    return {
      progressPercent: 25,
      step1Class: 'completed',
      step2Class: 'active',
      step3Class: '',
      step4Class: '',
      step5Class: ''
    };
  }

  // Cancelled or other
  return {
    progressPercent: 0,
    step1Class: 'completed',
    step2Class: '',
    step3Class: '',
    step4Class: '',
    step5Class: ''
  };
}

function renderLoggedOutState() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  container.innerHTML = `
    <!-- Guest Order Lookup Card -->
    <div class="guest-lookup-card">
      <div style="font-size: 2.2rem; margin-bottom: 10px;">🔍</div>
      <h3 class="guest-lookup-title">Track an Existing Order</h3>
      <p class="guest-lookup-desc">
        Placed an order as a guest or looking for instant status updates? Enter your Order ID below:
      </p>
      <form class="guest-lookup-form" onsubmit="handleGuestOrderLookup(event)">
        <input 
          type="text" 
          id="guestLookupInput" 
          class="guest-lookup-input" 
          placeholder="e.g. RF-ORD-2026-001" 
          required 
          autocomplete="off" 
        />
        <button type="submit" class="order-btn order-btn-primary">
          <span>Search Order</span>
        </button>
      </form>
    </div>

    <!-- Sign In Card -->
    <div class="orders-empty-card" style="border-style: solid;">
      <div class="orders-empty-icon">🔐</div>
      <h3 class="orders-empty-title">Customer Sign In Required</h3>
      <p class="orders-empty-desc">
        Sign in to view your complete order history, download tax invoices, track framing progress in real-time, and manage delivery addresses.
      </p>
      <button type="button" class="order-btn order-btn-primary" style="margin: 0 auto;" onclick="openCustomerAuthModal()">
        <span>Sign In to My Account</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  `;
}

async function handleGuestOrderLookup(e) {
  e.preventDefault();
  const input = document.getElementById('guestLookupInput');
  const cleanId = (input?.value || '').trim().replace(/^#/, '');
  if (!cleanId) return;

  window.location.href = `track-order?id=${encodeURIComponent(cleanId)}`;
}

function copyOrderId(orderId) {
  navigator.clipboard.writeText(orderId).then(() => {
    alert(`✅ Order ID #${orderId} copied to clipboard!`);
  }).catch(() => {
    prompt('Copy Order ID:', orderId);
  });
}

function reorderItems(orderId) {
  const order = allCustomerOrders.find(o => o.orderId === orderId);
  if (!order || !order.items || !order.items.length) {
    alert('Unable to retrieve items for reorder.');
    return;
  }

  try {
    let cart = [];
    const saved = localStorage.getItem('rf_cart');
    if (saved) cart = JSON.parse(saved);

    order.items.forEach(item => {
      const cartItem = {
        id: item.id || `reorder-${Date.now()}`,
        name: item.name || 'Custom Framing Piece',
        price: Number(item.price) || 0,
        quantity: item.quantity || 1,
        size: item.size || 'Standard',
        finish: item.finish || 'Standard',
        image: item.image || 'assets/images/glass_frame.jpg'
      };
      cart.push(cartItem);
    });

    localStorage.setItem('rf_cart', JSON.stringify(cart));

    // Update cart badges
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof renderCartDrawer === 'function') renderCartDrawer();
    if (typeof openCartDrawer === 'function') openCartDrawer();

    alert(`🛍️ ${order.items.length} item(s) from Order #${orderId} have been added to your cart!`);
  } catch (err) {
    console.error('Reorder error:', err);
    alert('Could not add items to cart.');
  }
}

/* --- Printable Invoice Modal --- */
function openInvoiceModal(orderId) {
  const order = allCustomerOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const modal = document.getElementById('invoiceModal');
  const content = document.getElementById('invoiceModalContent');
  if (!modal || !content) return;

  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recent';

  const items = order.items || [];
  const subtotal = Number(order.subtotal || order.total || 0);
  const shipping = Number(order.shipping || 0);
  const total = Number(order.total || 0);

  content.innerHTML = `
    <div class="invoice-header">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <img src="assets/images/logo-icon.png" alt="Dahej Support" style="height: 38px; width: auto;" />
          <h2 style="font-family: var(--font-heading); font-size: 1.4rem; color: #111; margin: 0;">DAHEJ SUPPORT STUDIO</h2>
        </div>
        <p style="font-size: 0.8rem; color: #6B7280; margin: 0; line-height: 1.4;">
          Rajendra Studio &amp; Framing • Dahej GIDC, Bharuch, Gujarat 392130<br>
          Direct Hotline: +91 96015 74966 • Support: rajendrastudioframing@gmail.com
        </p>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; background: #FAF8F5; border: 1px solid #E8E3DA; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #8C6A1E; text-transform: uppercase;">
          Official Order Receipt
        </span>
        <div style="font-size: 1.15rem; font-weight: 800; color: #111; margin-top: 6px;">#${escapeHtml(order.orderId)}</div>
        <div style="font-size: 0.8rem; color: #6B7280;">Date: ${escapeHtml(dateStr)}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px; background: #FAF8F5; border-radius: 10px; margin-bottom: 20px; font-size: 0.84rem;">
      <div>
        <strong style="color: #111; display: block; margin-bottom: 4px;">Billed To:</strong>
        <div>${escapeHtml(order.customer?.name || 'Customer')}</div>
        <div>Phone: ${escapeHtml(order.customer?.phone || 'N/A')}</div>
        <div>Email: ${escapeHtml(order.customer?.email || 'N/A')}</div>
      </div>
      <div>
        <strong style="color: #111; display: block; margin-bottom: 4px;">Delivery Address:</strong>
        <div>${escapeHtml(order.customer?.address || 'Studio Pickup')}</div>
        <div>${escapeHtml(order.customer?.city || 'Dahej, Bharuch')}, Gujarat ${escapeHtml(order.customer?.pincode || '')}</div>
      </div>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>
              <strong>${escapeHtml(i.name || 'Custom Framed Piece')}</strong>
              <div style="font-size: 0.78rem; color: #6B7280;">
                ${i.size ? `Size: ${escapeHtml(i.size)} • ` : ''}${i.finish ? `Finish: ${escapeHtml(i.finish)}` : ''}
              </div>
            </td>
            <td style="text-align: center;">${i.quantity || 1}</td>
            <td style="text-align: right;">₹${Number(i.price || 0).toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 700;">₹${(Number(i.price || 0) * Number(i.quantity || 1)).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right; font-weight: 600; border: none; padding-top: 14px;">Subtotal:</td>
          <td style="text-align: right; font-weight: 700; border: none; padding-top: 14px;">₹${subtotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right; color: #6B7280; border: none; padding-top: 4px;">Studio Packaging &amp; Delivery:</td>
          <td style="text-align: right; color: #047857; font-weight: 700; border: none; padding-top: 4px;">${shipping === 0 ? 'FREE' : `₹${shipping}`}</td>
        </tr>
        <tr style="border-top: 2px solid #111;">
          <td colspan="3" style="text-align: right; font-size: 1.05rem; font-weight: 800; color: #111; padding-top: 10px;">Total Amount:</td>
          <td style="text-align: right; font-size: 1.25rem; font-weight: 800; color: #8C6A1E; padding-top: 10px;">₹${total.toLocaleString('en-IN')}</td>
        </tr>
      </tfoot>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E8E3DA; padding-top: 20px; margin-top: 20px;">
      <div style="font-size: 0.8rem; color: #6B7280;">
        Payment: <strong>${escapeHtml(order.paymentMethod || 'UPI')}</strong> • Status: <strong>${escapeHtml(order.paymentStatus || 'Verified')}</strong>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" class="order-btn order-btn-outline" onclick="closeInvoiceModal()">Close</button>
        <button type="button" class="order-btn order-btn-primary" onclick="window.print()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* --- Edit Order Delivery Address Modal --- */
function openEditOrderModal(orderId) {
  const order = allCustomerOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const modal = document.getElementById('editOrderModal');
  if (!modal) return;

  document.getElementById('editOrderIdInput').value = order.orderId;
  document.getElementById('editNameInput').value = order.customer?.name || '';
  document.getElementById('editPhoneInput').value = order.customer?.phone || '';
  document.getElementById('editAddressInput').value = order.customer?.address || '';
  document.getElementById('editCityInput').value = order.customer?.city || '';
  document.getElementById('editPincodeInput').value = order.customer?.pincode || '';
  document.getElementById('editNotesInput').value = order.notes || '';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditOrderModal() {
  const modal = document.getElementById('editOrderModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

async function handleSaveOrderEdit(e) {
  e.preventDefault();
  const orderId = document.getElementById('editOrderIdInput').value;
  const saveBtn = document.getElementById('editSaveBtn');

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Updating...';
  }

  const payload = {
    name: document.getElementById('editNameInput').value.trim(),
    phone: document.getElementById('editPhoneInput').value.trim(),
    address: document.getElementById('editAddressInput').value.trim(),
    city: document.getElementById('editCityInput').value.trim(),
    pincode: document.getElementById('editPincodeInput').value.trim(),
    notes: document.getElementById('editNotesInput').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/customer-update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert('✅ Order delivery details updated successfully!');
      closeEditOrderModal();
      await fetchAndRenderCustomerOrders();
    } else {
      alert(data.message || 'Could not update order.');
    }
  } catch (err) {
    console.error('Save order edit error:', err);
    alert('Network error. Please try again or message WhatsApp support.');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Changes';
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
