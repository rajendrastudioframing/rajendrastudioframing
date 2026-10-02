/**
 * RAJESH FRAMING - CUSTOMER ORDER TRACKING CONTROLLER
 * Real-time order status, 5-stage craftsmanship timeline, and status updates
 */

const API_BASE = window.location.origin.includes(':5500') 
  ? 'http://localhost:5000' 
  : window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('orderTrackForm');
  const input = document.getElementById('trackOrderIdInput');
  const resultContainer = document.getElementById('trackingResultContainer');

  // Check URL query parameter (e.g. track-order?id=RF-ORD-1001 or track-order?tab=my-orders)
  const urlParams = new URLSearchParams(window.location.search);
  const initialId = urlParams.get('id') || urlParams.get('orderId');
  const requestedTab = urlParams.get('tab') || (window.location.hash === '#my-orders' ? 'my-orders' : '');

  if (requestedTab === 'my-orders') {
    switchTrackTab('my-orders');
  } else if (initialId && input) {
    input.value = initialId.trim();
    trackOrder(initialId.trim());
  }

  // Listen to customer auth changes to re-render my orders
  window.addEventListener('customerAuthStateChanged', () => {
    if (currentTrackTab === 'my-orders') {
      renderMyOrdersHistory();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const orderId = (input.value || '').trim();
      if (!orderId) {
        input.focus();
        return;
      }
      trackOrder(orderId);
    });
  }

  // Setup Customer Edit Order Form
  const editOrderForm = document.getElementById('customerEditOrderForm');
  if (editOrderForm) {
    editOrderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('customerEditSaveBtn');
      const origText = saveBtn ? saveBtn.innerHTML : 'Save Changes';
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Saving...';
      }

      const orderId = (document.getElementById('customerEditOrderId')?.value || '').trim();
      const payload = {
        name: document.getElementById('customerEditName')?.value.trim(),
        phone: document.getElementById('customerEditPhone')?.value.trim(),
        email: document.getElementById('customerEditEmail')?.value.trim(),
        address: document.getElementById('customerEditAddress')?.value.trim(),
        city: document.getElementById('customerEditCity')?.value.trim(),
        pincode: document.getElementById('customerEditPincode')?.value.trim(),
        notes: document.getElementById('customerEditNotes')?.value.trim()
      };

      try {
        const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/customer-update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ Your order details have been updated successfully!');
          closeCustomerEditOrderModal();
          trackOrder(orderId);
        } else {
          alert(data.message || 'Could not update order details. Please contact studio on WhatsApp.');
        }
      } catch (err) {
        console.error('Customer update order error:', err);
        alert('Network connection error. Please try again.');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = origText;
        }
      }
    });
  }

  // Close modal when clicking on backdrop
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('customerEditOrderModal');
    if (modal && e.target === modal) {
      closeCustomerEditOrderModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCustomerEditOrderModal();
    }
  });
});

async function trackOrder(orderId) {
  const container = document.getElementById('trackingResultContainer');
  if (!container) return;

  // Normalize order ID
  const cleanId = orderId.trim().replace(/^#/, '');

  // Check if edit action requested in URL
  const currentParams = new URLSearchParams(window.location.search);
  const actionParam = currentParams.get('action');
  const actionQuery = actionParam ? `&action=${encodeURIComponent(actionParam)}` : '';

  // Update browser URL without reloading so customer can bookmark/share
  const newUrl = `${window.location.pathname}?id=${encodeURIComponent(cleanId)}${actionQuery}`;
  window.history.replaceState({ orderId: cleanId, action: actionParam }, '', newUrl);

  // Show Loading Spinner
  container.innerHTML = `
    <div class="track-skeleton-card">
      <div class="track-spinner"></div>
      <div style="font-weight: 700; font-size: 1.05rem; color: #1A1A18; margin-bottom: 6px;">Retrieving Order Status...</div>
      <div style="font-size: 0.86rem; color: #76746E;">Querying studio production records for #${escapeHtml(cleanId)}</div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/orders/track/${encodeURIComponent(cleanId)}`);
    const data = await res.json();

    if (data.success && data.order) {
      renderTrackingResult(data.order, container);
      if (actionParam === 'edit' && data.order.canEdit) {
        setTimeout(() => {
          openCustomerEditOrderModal();
        }, 150);
      }
    } else {
      renderNotFound(cleanId, data.message, container);
    }
  } catch (err) {
    console.error('Tracking fetch error:', err);
    renderNotFound(cleanId, 'Unable to connect to Rajesh Framing studio server. Please check your internet connection and try again.', container);
  }
}

function renderTrackingResult(order, container) {
  window.currentTrackedOrder = order;
  const isCancelled = order.status === 'Cancelled' || order.isCancelled;
  const statusClass = (order.status || 'in-progress').toLowerCase().replace(/\s+/g, '-');

  const createdDate = new Date(order.createdAt);
  const dateFormatted = isNaN(createdDate) ? 'Recent' : createdDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Timeline Step Icons
  const stepIcons = ['1', '2', '3', '4', '5'];

  const timelineHtml = isCancelled ? '' : `
    <div class="track-timeline-section">
      <ul class="track-steps-bar">
        ${(order.timeline || []).map((step, idx) => {
          let itemClass = '';
          if (step.completed) itemClass = 'completed';
          if (step.current) itemClass += ' current';

          return `
            <li class="track-step-item ${itemClass}">
              <div class="track-step-circle">
                ${step.completed ? '✓' : stepIcons[idx]}
              </div>
              <div class="track-step-info">
                <div class="track-step-title">${escapeHtml(step.title)}</div>
                <div class="track-step-sub">${escapeHtml(step.description)}</div>
                ${step.date && step.date !== 'Pending' ? `
                  <div style="font-size: 0.7rem; color: #8C6A1E; font-weight: 600; margin-top: 3px;">
                    ${escapeHtml(step.date)}
                  </div>
                ` : ''}
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;

  // WhatsApp Support Text
  const waText = encodeURIComponent(`Hello Rajesh Framing Studio, I am tracking my order #${order.orderId}. Could you please provide an update?`);
  const waLink = `https://wa.me/919601574966?text=${waText}`;

  // Customer Masked Details
  const cust = order.customer || {};

  container.innerHTML = `
    <div class="track-card">
      <!-- Card Header -->
      <div class="track-card-header">
        <div class="track-order-meta">
          <span class="track-order-id">#${escapeHtml(order.orderId)}</span>
          <span class="track-order-date">Placed on ${dateFormatted}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${order.canEdit ? `
            <button type="button" class="btn btn-gold btn-sm" onclick="openCustomerEditOrderModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.82rem; font-weight: 700;">
              ✏️ Edit Order
            </button>
          ` : ''}
          <span class="track-status-badge ${statusClass}">
            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:currentColor; margin-right:4px;"></span>
            ${escapeHtml(order.status)}
          </span>
        </div>
      </div>

      <!-- Cancelled Notice if applicable -->
      ${isCancelled ? `
        <div class="track-cancelled-banner">
          <div class="cancelled-icon">✕</div>
          <div>
            <div class="cancelled-title">Order Has Been Cancelled</div>
            <p class="cancelled-text">
              ${order.notes && order.notes.includes('Reason:') ? escapeHtml(order.notes) : 'This order was cancelled by the studio. If any advance payment was made, our accounts team will process the refund to your source account.'}
              For immediate clarification, please contact our studio on WhatsApp.
            </p>
          </div>
        </div>
      ` : ''}

      <!-- 5-Stage Craftsmanship Stepper -->
      ${timelineHtml}

      <!-- Order Details Grid -->
      <div class="track-details-grid">
        <div class="track-info-box">
          <div class="track-info-heading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Recipient &amp; Delivery
          </div>
          <div class="track-info-line"><strong>Recipient:</strong> ${escapeHtml(cust.name || 'Valued Customer')}</div>
          ${cust.phoneMasked ? `<div class="track-info-line"><strong>Phone:</strong> ${escapeHtml(cust.phoneMasked)}</div>` : ''}
          ${cust.emailMasked ? `<div class="track-info-line"><strong>Email:</strong> ${escapeHtml(cust.emailMasked)}</div>` : ''}
          <div class="track-info-line" style="margin-top: 6px;">
            <strong>Delivery Address:</strong><br>
            <span style="color: #4A4843;">${escapeHtml(cust.address || 'Studio Pickup')}, ${escapeHtml(cust.city || 'Dahej')} ${escapeHtml(cust.pincode ? '(' + cust.pincode + ')' : '')}</span>
          </div>
          ${order.canEdit ? `
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #E5E0D8;">
              <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 4px 10px;" onclick="openCustomerEditOrderModal()">
                ✏️ Edit Address / Contact Info
              </button>
            </div>
          ` : ''}
        </div>

        <div class="track-info-box">
          <div class="track-info-heading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Payment &amp; Fulfillment
          </div>
          <div class="track-info-line"><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || 'Pay on Delivery')}</div>
          <div class="track-info-line">
            <strong>Payment Status:</strong> 
            <span style="color: ${order.paymentStatus === 'Paid' ? '#027A48' : '#B54708'}; font-weight: 700;">
              ${order.paymentStatus || 'Pending'}
            </span>
          </div>
          ${order.notes && !isCancelled ? `
            <div class="track-info-line" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #E5E0D8;">
              <strong>Studio Notes:</strong><br>
              <span style="color: #4A4843;">${escapeHtml(order.notes)}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Items Section -->
      <div class="track-items-section">
        <div class="track-items-heading">Order Summary (${(order.items || []).length} items)</div>
        <div class="track-items-list">
          ${(order.items || []).map(item => `
            <div class="track-item-row">
              <img src="${item.image || 'assets/images/glass_frame.jpg'}" alt="${escapeHtml(item.name)}" class="track-item-thumb" onerror="this.src='assets/images/glass_frame.jpg'" />
              <div class="track-item-info">
                <div class="track-item-name">${escapeHtml(item.name)}</div>
                <div class="track-item-meta">
                  Qty: ${item.quantity || 1} • Size: ${escapeHtml(item.size || 'Standard')} • Finish: ${escapeHtml(item.finish || 'Standard')}
                </div>
              </div>
              <div class="track-item-price">
                ₹${Number(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="track-card-footer">
        <div class="track-total-display">
          <span class="track-total-label">Total Amount:</span>
          <span class="track-total-val">₹${Number(order.total || 0).toLocaleString('en-IN')}</span>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${order.canEdit ? `
            <button type="button" class="btn btn-gold btn-sm" onclick="openCustomerEditOrderModal()" style="font-weight: 700;">
              ✏️ Edit Order Details
            </button>
          ` : ''}
          <button type="button" class="btn btn-outline btn-sm" onclick="copyTrackingUrl('${escapeHtml(order.orderId)}')">
            🔗 Copy Tracking Link
          </button>
          <a href="${waLink}" target="_blank" class="track-support-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.51.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
            </svg>
            <span>Need Assistance? WhatsApp Studio</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderNotFound(orderId, message, container) {
  const waText = encodeURIComponent(`Hello Rajesh Framing, I cannot find my order #${orderId} on the website tracking tool. Could you please help check my order status?`);
  const waLink = `https://wa.me/919601574966?text=${waText}`;

  container.innerHTML = `
    <div class="track-not-found-card">
      <div class="track-not-found-icon">🔍</div>
      <h3 class="track-not-found-title">Order #${escapeHtml(orderId)} Not Found</h3>
      <p class="track-not-found-desc">
        ${escapeHtml(message || 'We could not locate an order with this ID in our records. Please verify the code on your order confirmation email or invoice.')}
      </p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('trackOrderIdInput').focus()">
          Try Another Order ID
        </button>
        <a href="${waLink}" target="_blank" class="track-support-btn">
          <span>Inquire via WhatsApp</span>
        </a>
      </div>
    </div>
  `;
}

window.openCustomerEditOrderModal = () => {
  const order = window.currentTrackedOrder;
  if (!order) return;

  const modal = document.getElementById('customerEditOrderModal');
  if (!modal) return;

  const modalIdSpan = document.getElementById('customerEditOrderModalId');
  if (modalIdSpan) modalIdSpan.textContent = '#' + (order.orderId || '');

  const idInput = document.getElementById('customerEditOrderId');
  if (idInput) idInput.value = order.orderId || '';

  const cust = order.customer || {};
  const nameInput = document.getElementById('customerEditName');
  if (nameInput) nameInput.value = cust.name || '';

  const phoneInput = document.getElementById('customerEditPhone');
  if (phoneInput) phoneInput.value = cust.phone || '';

  const emailInput = document.getElementById('customerEditEmail');
  if (emailInput) emailInput.value = cust.email || '';

  const addressInput = document.getElementById('customerEditAddress');
  if (addressInput) addressInput.value = cust.address || '';

  const cityInput = document.getElementById('customerEditCity');
  if (cityInput) cityInput.value = cust.city || 'Dahej';

  const pincodeInput = document.getElementById('customerEditPincode');
  if (pincodeInput) pincodeInput.value = cust.pincode || '';

  const notesInput = document.getElementById('customerEditNotes');
  if (notesInput) notesInput.value = order.notes || '';

  modal.classList.add('open');
  modal.classList.add('active');
};

window.closeCustomerEditOrderModal = () => {
  const modal = document.getElementById('customerEditOrderModal');
  if (modal) {
    modal.classList.remove('open');
    modal.classList.remove('active');
  }
};

window.copyTrackingUrl = (orderId) => {
  const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(orderId)}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Tracking link copied to clipboard!');
  }).catch(() => {
    alert(url);
  });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   TAB SWITCHING & CUSTOMER ORDER HISTORY
   ========================================================================== */
let currentTrackTab = 'track-id';

window.switchTrackTab = function(tabName) {
  currentTrackTab = tabName;
  const tabBtnTrackId = document.getElementById('tabBtnTrackId');
  const tabBtnMyOrders = document.getElementById('tabBtnMyOrders');
  const trackSearchCardWrap = document.getElementById('trackSearchCardWrap');
  const trackResultSection = document.getElementById('trackResultSection');
  const myOrdersSection = document.getElementById('myOrdersSection');

  if (tabName === 'my-orders') {
    if (tabBtnTrackId) tabBtnTrackId.classList.remove('active');
    if (tabBtnMyOrders) tabBtnMyOrders.classList.add('active');
    if (trackSearchCardWrap) trackSearchCardWrap.style.display = 'none';
    if (trackResultSection) trackResultSection.style.display = 'none';
    if (myOrdersSection) myOrdersSection.style.display = 'block';
    renderMyOrdersHistory();
  } else {
    if (tabBtnTrackId) tabBtnTrackId.classList.add('active');
    if (tabBtnMyOrders) tabBtnMyOrders.classList.remove('active');
    if (trackSearchCardWrap) trackSearchCardWrap.style.display = 'block';
    if (trackResultSection) trackResultSection.style.display = 'block';
    if (myOrdersSection) myOrdersSection.style.display = 'none';
  }
};

window.renderMyOrdersHistory = async function() {
  const container = document.getElementById('myOrdersListContainer');
  if (!container) return;

  const session = window.customerAuth && window.customerAuth.getSession ? window.customerAuth.getSession() : null;

  if (!session || !session.email) {
    container.innerHTML = `
      <div class="my-orders-empty-card">
        <div class="my-orders-empty-icon">🔐</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.35rem; color: #111; margin-bottom: 8px;">
          Customer Account Required
        </h3>
        <p style="font-size: 0.92rem; color: #76746E; max-width: 440px; margin: 0 auto 24px;">
          Sign in or create a quick account with your mobile number to view all your past and active bespoke framing orders in one place.
        </p>
        <button type="button" class="btn btn-gold" onclick="if(window.customerAuth) window.customerAuth.openModal('login');">
          Sign In / Register
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 0;">
      <div class="track-spinner" style="margin: 0 auto 14px;"></div>
      <p style="font-size: 0.92rem; color: #76746E;">Retrieving your orders for <strong>${escapeHtml(session.email)}</strong>...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/customer/orders`, {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load order history');
    }

    const orders = data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="my-orders-empty-card">
          <div class="my-orders-empty-icon">🛍️</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.35rem; color: #111; margin-bottom: 8px;">
            No Orders Found
          </h3>
          <p style="font-size: 0.92rem; color: #76746E; max-width: 440px; margin: 0 auto 24px;">
            You haven't placed any orders with <strong>${escapeHtml(session.email)}</strong> yet. Explore our bespoke frames and personalized drinkware today!
          </p>
          <a href="products" class="btn btn-gold">
            Browse Products &amp; Frames
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #111; margin: 0;">
          Your Order History (${orders.length})
        </h2>
        <span style="font-size: 0.85rem; color: #76746E;">
          Logged in as <strong>${escapeHtml(session.name || session.email)}</strong>
        </span>
      </div>
      <div class="my-orders-list">
        ${orders.map(ord => {
          const statusClass = (ord.status || 'Placed').toLowerCase().replace(/\s+/g, '-');
          const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
          const itemsSummary = (ord.items || []).map(i => `${escapeHtml(i.name || i.productName || 'Custom Item')} × ${i.quantity || 1}`).join(', ') || 'Custom Framing Order';
          return `
            <div class="customer-order-card">
              <div class="customer-order-header">
                <div>
                  <span class="customer-order-id">#${escapeHtml(ord.orderId)}</span>
                  <span class="customer-order-date">• Placed on ${dateStr}</span>
                </div>
                <span class="track-status-pill status-${statusClass}">
                  ${escapeHtml(ord.status || 'Placed')}
                </span>
              </div>
              <div class="customer-order-body">
                <div>
                  <div class="customer-order-items">
                    <strong>Items:</strong> ${itemsSummary}
                  </div>
                  <div style="font-size: 0.82rem; color: #76746E; margin-top: 4px;">
                    Payment: <strong>${escapeHtml(ord.paymentMethod || 'UPI')}</strong>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div class="customer-order-meta-total">
                    ₹${Number(ord.total || 0).toLocaleString('en-IN')}
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" onclick="trackFromOrderCard('${escapeHtml(ord.orderId)}')">
                    <span>Live Tracking</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

  } catch (err) {
    console.error('Error fetching customer orders:', err);
    container.innerHTML = `
      <div class="my-orders-empty-card">
        <div class="my-orders-empty-icon" style="color: #E53E3E; background: rgba(229, 62, 62, 0.1);">⚠️</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: #111; margin-bottom: 8px;">
          Unable to Load Orders
        </h3>
        <p style="font-size: 0.9rem; color: #76746E; max-width: 420px; margin: 0 auto 20px;">
          ${escapeHtml(err.message || 'Network error occurred while fetching your order history.')}
        </p>
        <button type="button" class="btn btn-outline btn-sm" onclick="renderMyOrdersHistory()">
          Try Again
        </button>
      </div>
    `;
  }
};

window.trackFromOrderCard = function(orderId) {
  switchTrackTab('track-id');
  const input = document.getElementById('trackOrderIdInput');
  if (input) {
    input.value = orderId;
  }
  trackOrder(orderId);
  window.scrollTo({ top: 300, behavior: 'smooth' });
};

