/**
 * RAJESH FRAMING - CHECKOUT CONTROLLER
 * Handles Customer Order Placement, Authentication Gate, and Order Summary
 */

let selectedPaymentMethod = 'pickup';
let isCheckoutFormBound = false;

/**
 * Configure payment handlers (Single Option: Pick up from shop)
 */
function setupUpiPayment(amount) {
  selectedPaymentMethod = 'pickup';
}

/**
 * Update Customer Authentication UI state on checkout page
 */
function updateCheckoutAuthUI() {
  const noticeEl = document.getElementById('checkoutAuthNotice');
  const verifiedEl = document.getElementById('checkoutAuthVerified');
  const loggedEmailEl = document.getElementById('checkoutLoggedEmail');
  const custNameInput = document.getElementById('custName');
  const custEmailInput = document.getElementById('custEmail');
  const custPhoneInput = document.getElementById('custPhone');

  const loggedIn = typeof isCustomerLoggedIn === 'function'
    ? isCustomerLoggedIn()
    : (window.CustomerAuth ? window.CustomerAuth.isCustomerLoggedIn() : !!localStorage.getItem('rf_customer_token'));

  const user = typeof getCustomerUser === 'function'
    ? getCustomerUser()
    : (window.CustomerAuth ? window.CustomerAuth.getCustomerUser() : null);

  if (loggedIn) {
    if (noticeEl) noticeEl.style.setProperty('display', 'none', 'important');
    if (verifiedEl) verifiedEl.style.setProperty('display', 'flex', 'important');

    if (loggedEmailEl) {
      if (user && (user.name || user.email)) {
        const displayLabel = user.name && user.name.trim() !== 'Valued Customer'
          ? `${user.name} (${user.email || 'Verified Account'})`
          : (user.email || 'Verified Customer');
        loggedEmailEl.textContent = displayLabel;
      } else {
        loggedEmailEl.textContent = 'Verified Customer';
      }
    }

    // Auto-fill customer details if fields are empty
    if (user) {
      if (custNameInput && !custNameInput.value.trim() && user.name && user.name !== 'Valued Customer') {
        custNameInput.value = user.name;
      }
      if (custEmailInput && !custEmailInput.value.trim() && user.email) {
        custEmailInput.value = user.email;
      }
      if (custPhoneInput && !custPhoneInput.value.trim() && user.phone) {
        custPhoneInput.value = user.phone;
      }
    }
  } else {
    if (noticeEl) noticeEl.style.setProperty('display', 'flex', 'important');
    if (verifiedEl) verifiedEl.style.setProperty('display', 'none', 'important');
  }
}

/**
 * Render items and totals in Order Summary
 */
function renderCheckoutOrderSummary() {
  const emptyState = document.getElementById('checkoutEmptyState');
  const activeContainer = document.getElementById('checkoutActiveContainer');
  const itemsList = document.getElementById('checkoutItemsList');
  const subtotalEl = document.getElementById('summarySubtotal');
  const totalEl = document.getElementById('summaryGrandTotal');

  let cart = [];
  if (typeof getCart === 'function') {
    cart = getCart();
  } else {
    try {
      const raw = localStorage.getItem('rf_cart');
      cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
      cart = [];
    }
  }

  if (!cart || cart.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (activeContainer) activeContainer.style.display = 'none';
    if (subtotalEl) subtotalEl.textContent = '₹0';
    if (totalEl) totalEl.textContent = '₹0';
    if (itemsList) itemsList.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (activeContainer) activeContainer.style.display = 'grid';

  let subtotal = 0;
  if (typeof getCartSubtotal === 'function') {
    subtotal = getCartSubtotal();
  } else {
    subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  }

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (totalEl) totalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

  if (itemsList) {
    itemsList.innerHTML = cart.map((item, idx) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const lineTotal = price * qty;
      const image = item.image || 'assets/images/custom_canvas.jpg';

      const metaParts = [];
      if (item.size && item.size !== 'Standard') {
        metaParts.push(`Size: <strong>${escapeHtml(item.size)}</strong>`);
      }
      if (item.finish && item.finish !== 'Standard') {
        metaParts.push(`Finish: <strong>${escapeHtml(item.finish)}</strong>`);
      }
      const metaHtml = metaParts.length > 0 ? metaParts.join(' • ') + ' • ' : '';

      return `
        <div class="order-item-row" data-index="${idx}">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name || 'Product')}" class="order-item-img" onerror="this.src='assets/images/custom_canvas.jpg'" />
          <div class="order-item-details">
            <div class="order-item-name">${escapeHtml(item.name || 'Custom Product')}</div>
            <div class="order-item-qty">
              ${metaHtml}Qty: ${qty} × ₹${price.toLocaleString('en-IN')}
            </div>
            ${item.uploadedPhoto ? `
              <div style="margin-top: 3px; font-size: 0.72rem; color: #059669; display: inline-flex; align-items: center; gap: 4px;">
                <span>📷 Photo Attached</span>
              </div>
            ` : ''}
          </div>
          <div class="order-item-price">₹${lineTotal.toLocaleString('en-IN')}</div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Bind form submit and place order action
 */
function bindCheckoutForm() {
  if (isCheckoutFormBound) return;
  const form = document.getElementById('checkoutOrderForm');
  const desktopBtn = document.getElementById('desktopPlaceOrderBtn');
  const mobileBtn = document.getElementById('mobilePlaceOrderBtn');
  const btnText = document.getElementById('placeOrderBtnText');

  if (!form) return;
  isCheckoutFormBound = true;

  const submitOrder = async (e) => {
    if (e) e.preventDefault();

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    let email = document.getElementById('custEmail').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const state = document.getElementById('custState').value.trim();
    const pincode = document.getElementById('custPincode').value.trim();
    const fulfillment = document.getElementById('fulfillmentMethod').value;
    const notes = document.getElementById('orderNotes').value.trim();
    const utrInput = document.getElementById('upiUtrNumber');
    const utr = utrInput ? utrInput.value.trim() : '';

    // Validations
    if (!name) {
      alert('Please enter your full name.');
      document.getElementById('custName').focus();
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      alert('Please provide a valid 10-digit mobile number.');
      document.getElementById('custPhone').focus();
      return;
    }

    // Auto-fill from active customer session if empty
    if (!email) {
      const activeUser = typeof getCustomerUser === 'function'
        ? getCustomerUser()
        : (window.CustomerAuth ? window.CustomerAuth.getCustomerUser() : null);
      if (activeUser && activeUser.email) {
        email = activeUser.email.trim();
        const emailEl = document.getElementById('custEmail');
        if (emailEl) emailEl.value = email;
      }
    }

    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address so we can email your order receipt.');
      document.getElementById('custEmail').focus();
      return;
    }

    if (!address) {
      alert('Please provide your complete delivery or pickup address.');
      document.getElementById('custAddress').focus();
      return;
    }

    if (!pincode || pincode.length < 6) {
      alert('Please enter a valid 6-digit postal pincode.');
      document.getElementById('custPincode').focus();
      return;
    }

    const cart = typeof getCart === 'function' ? getCart() : JSON.parse(localStorage.getItem('rf_cart') || '[]');
    if (!cart || cart.length === 0) {
      alert('Your cart is empty. Please add products before placing an order.');
      window.location.href = 'products';
      return;
    }

    // GATE: Customer MUST be logged in before placing an order
    const loggedIn = typeof isCustomerLoggedIn === 'function'
      ? isCustomerLoggedIn()
      : (window.CustomerAuth ? window.CustomerAuth.isCustomerLoggedIn() : !!localStorage.getItem('rf_customer_token'));

    if (!loggedIn) {
      if (typeof openCustomerAuthModal === 'function') {
        openCustomerAuthModal((customer) => {
          updateCheckoutAuthUI();
          // After customer authenticates, auto-proceed with order placement
          submitOrder();
        });
      } else {
        alert('Please log in to your customer account to place an order.');
      }
      return;
    }

    const subtotal = typeof getCartSubtotal === 'function'
      ? getCartSubtotal()
      : cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const total = subtotal; // Free shipping

    // UI Loading state
    if (desktopBtn) desktopBtn.disabled = true;
    if (mobileBtn) mobileBtn.disabled = true;
    if (btnText) btnText.textContent = 'Processing Order...';

    const paymentLabel = 'Pick up from shop';

    const orderPayload = {
      customerName: name,
      customerPhone: phone,
      customerEmail: email.toLowerCase(),
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      fulfillmentMethod: fulfillment,
      paymentMethod: paymentLabel,
      upiUtr: utr || null,
      items: cart,
      subtotal: subtotal,
      shipping: 0,
      total: total,
      notes: notes
    };

    const headers = { 'Content-Type': 'application/json' };
    const customerToken = typeof getCustomerToken === 'function'
      ? getCustomerToken()
      : (window.CustomerAuth ? window.CustomerAuth.getCustomerToken() : localStorage.getItem('rf_customer_token'));
    if (customerToken) {
      headers['Authorization'] = `Bearer ${customerToken}`;
    }

    const apiBase = typeof CART_API_BASE !== 'undefined'
      ? CART_API_BASE
      : (window.location.origin.includes(':5500') ? 'http://localhost:5000' : window.location.origin);

    try {
      const response = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (response.status === 401 && result.requiresLogin) {
        if (desktopBtn) desktopBtn.disabled = false;
        if (mobileBtn) mobileBtn.disabled = false;
        if (btnText) btnText.textContent = 'Place Order';
        if (typeof openCustomerAuthModal === 'function') {
          openCustomerAuthModal(() => submitOrder());
        } else {
          alert(result.message || 'Please log in to your customer account to place an order.');
        }
        return;
      }

      if (response.ok && result.success) {
        // Success!
        const orderId = result.orderId || `RF-ORD-2026-${Math.floor(100 + Math.random() * 900)}`;

        // Populate Success Modal
        const successNameEl = document.getElementById('successCustName');
        if (successNameEl) successNameEl.textContent = name;
        const successIdEl = document.getElementById('successOrderId');
        if (successIdEl) successIdEl.textContent = orderId;
        const successTotalEl = document.getElementById('successOrderTotal');
        if (successTotalEl) successTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

        const successPayEl = document.getElementById('successPaymentMethod');
        if (successPayEl) {
          successPayEl.textContent = 'Pick up from shop';
        }

        // Configure WhatsApp Follow-up button
        const itemNames = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
        const waMsg = encodeURIComponent(
          `Hello Rajesh Framing!\n\n` +
          `I have just placed an order on your website:\n` +
          `• Order ID: ${orderId}\n` +
          `• Name: ${name}\n` +
          `• Phone: ${phone}\n` +
          `• Items: ${itemNames}\n` +
          `• Total Amount: ₹${total.toLocaleString('en-IN')}\n` +
          `• Payment Method: Pick up from shop (Pay on Collection)\n` +
          `• Delivery Address: ${address}, ${city} (${pincode})\n\n` +
          `Please confirm my order and share the digital preview proof!`
        );

        const waBtn = document.getElementById('successWhatsAppBtn');
        if (waBtn) {
          waBtn.href = `https://wa.me/919601574966?text=${waMsg}`;
        }

        const trackBtn = document.getElementById('successTrackBtn');
        if (trackBtn) {
          trackBtn.href = `track-order?id=${encodeURIComponent(orderId)}`;
        }

        // Clear cart
        if (typeof clearCart === 'function') {
          clearCart();
        } else {
          localStorage.removeItem('rf_cart');
        }

        // Show Modal exclusively now that order is confirmed
        const modal = document.getElementById('orderSuccessModal');
        if (modal) {
          modal.style.setProperty('display', 'flex', 'important');
          modal.classList.add('open');
          document.body.style.overflow = 'hidden';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

      } else {
        alert(result.message || 'Could not process order. Please try again or contact us directly on WhatsApp.');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      // Fallback local confirmation if server unreachable
      alert('Order noted! Connecting to WhatsApp studio...');
      const fallbackId = `RF-ORD-${Date.now().toString().slice(-4)}`;
      const successNameEl = document.getElementById('successCustName');
      if (successNameEl) successNameEl.textContent = name;
      const successIdEl = document.getElementById('successOrderId');
      if (successIdEl) successIdEl.textContent = fallbackId;
      const successTotalEl = document.getElementById('successOrderTotal');
      if (successTotalEl) successTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
      if (typeof clearCart === 'function') {
        clearCart();
      } else {
        localStorage.removeItem('rf_cart');
      }
      const modal = document.getElementById('orderSuccessModal');
      if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    } finally {
      if (desktopBtn) desktopBtn.disabled = false;
      if (mobileBtn) mobileBtn.disabled = false;
      if (btnText) btnText.textContent = 'Place Order';
    }
  };

  form.addEventListener('submit', submitOrder);
  if (desktopBtn) desktopBtn.addEventListener('click', submitOrder);
  if (mobileBtn) mobileBtn.addEventListener('click', submitOrder);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Initialize Checkout Page
 */
function initCheckoutPage() {
  // Parse query params for buyNow if present
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const buyNowId = urlParams.get('buyNow');
    if (buyNowId && typeof PRODUCTS_DATA !== 'undefined' && typeof addToCart === 'function') {
      const currentCart = typeof getCart === 'function' ? getCart() : [];
      if (currentCart.length === 0) {
        const p = PRODUCTS_DATA.find(x => x.id === buyNowId);
        if (p) {
          const qty = parseInt(urlParams.get('qty'), 10) || 1;
          const size = urlParams.get('size') || 'Standard';
          const finish = urlParams.get('finish') || 'Standard';
          const img = urlParams.get('image') || p.image;
          addToCart({ ...p, size, finish, image: img }, qty, false);
        }
      }
    }
  } catch (e) {
    console.warn('buyNow query parse warning:', e);
  }

  updateCheckoutAuthUI();
  renderCheckoutOrderSummary();
  bindCheckoutForm();
  setupUpiPayment();
}

// Auto-run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckoutPage);
} else {
  initCheckoutPage();
}

// Global exports & event bindings
window.updateCheckoutAuthUI = updateCheckoutAuthUI;
window.renderCheckoutOrderSummary = renderCheckoutOrderSummary;

window.addEventListener('customerAuthStateChanged', () => {
  updateCheckoutAuthUI();
});

window.addEventListener('cartUpdated', () => {
  renderCheckoutOrderSummary();
});

window.addEventListener('storage', (e) => {
  if (e.key === 'rf_customer_token' || e.key === 'rf_customer_user') {
    updateCheckoutAuthUI();
  }
  if (e.key === 'rf_cart') {
    renderCheckoutOrderSummary();
  }
});
