/**
 * RAJESH FRAMING - CHECKOUT CONTROLLER
 * Validates customer details, calculates totals, and submits order to backend API
 */

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
});

function initCheckoutPage() {
  // Ensure success modal is strictly hidden on initial page load
  const successModal = document.getElementById('orderSuccessModal');
  if (successModal) {
    successModal.style.setProperty('display', 'none', 'important');
    successModal.classList.remove('open');
  }

  handleBuyNowQueryParam();
  renderCheckoutSummary();
  bindCheckoutForm();
  updateCheckoutAuthUI();

  // Listen to cart updates in case drawer changes items
  window.addEventListener('cartUpdated', () => {
    renderCheckoutSummary();
  });

  // Listen to customer auth changes (login/logout)
  window.addEventListener('customerAuthStateChanged', () => {
    updateCheckoutAuthUI();
  });
}

function updateCheckoutAuthUI() {
  const noticeBanner = document.getElementById('checkoutAuthNotice');
  const verifiedBanner = document.getElementById('checkoutAuthVerified');
  const loggedEmailEl = document.getElementById('checkoutLoggedEmail');
  const emailInput = document.getElementById('custEmail');
  const nameInput = document.getElementById('custName');
  const phoneInput = document.getElementById('custPhone');

  const isLoggedIn = typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn();
  const user = typeof getCustomerUser === 'function' ? getCustomerUser() : null;

  if (isLoggedIn && user) {
    if (noticeBanner) noticeBanner.style.display = 'none';
    if (verifiedBanner) verifiedBanner.style.display = 'flex';
    if (loggedEmailEl) loggedEmailEl.textContent = user.email || 'customer@example.com';

    // Auto-fill customer details if fields are empty
    if (emailInput && (!emailInput.value || emailInput.value !== user.email)) {
      emailInput.value = user.email;
    }
    if (nameInput && !nameInput.value && user.name && user.name !== 'Valued Customer') {
      nameInput.value = user.name;
    }
    if (phoneInput && !phoneInput.value && user.phone) {
      phoneInput.value = user.phone;
    }
  } else {
    if (noticeBanner) noticeBanner.style.display = 'flex';
    if (verifiedBanner) verifiedBanner.style.display = 'none';
  }
}

/**
 * If user clicked "Buy Now" on a product, check URL parameter
 */
function handleBuyNowQueryParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const buyNowId = urlParams.get('buyNow');
  const qtyParam = parseInt(urlParams.get('qty'), 10) || 1;
  const sizeParam = urlParams.get('size') || 'Standard';
  const finishParam = urlParams.get('finish') || 'Standard';

  if (buyNowId && typeof PRODUCTS_DATA !== 'undefined') {
    const prod = PRODUCTS_DATA.find(p => p.id === buyNowId);
    if (prod) {
      // Add this product to cart if not present
      const currentCart = getCart();
      const existing = currentCart.find(i => i.id === prod.id && i.size === sizeParam && i.finish === finishParam);
      if (!existing) {
        addToCart({
          id: prod.id,
          name: prod.name,
          price: prod.price || 650,
          image: prod.image,
          category: prod.category,
          size: sizeParam,
          finish: finishParam,
          leadTime: prod.leadTime || '24 - 48 Hours'
        }, qtyParam, false);
      }
    }
  }
}

/**
 * Render order items preview and totals on checkout page
 */
function renderCheckoutSummary() {
  const activeContainer = document.getElementById('checkoutActiveContainer');
  const emptyContainer = document.getElementById('checkoutEmptyState');
  const itemsContainer = document.getElementById('checkoutItemsList');
  const subtotalEl = document.getElementById('summarySubtotal');
  const totalEl = document.getElementById('summaryGrandTotal');

  if (!itemsContainer) return;

  const cart = getCart();

  if (!cart || cart.length === 0) {
    if (activeContainer) activeContainer.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'block';
    return;
  }

  if (activeContainer) activeContainer.style.display = 'grid';
  if (emptyContainer) emptyContainer.style.display = 'none';

  const subtotal = getCartSubtotal();

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (totalEl) totalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

  // Initialize and update Dynamic UPI QR Code
  setupUpiPayment(subtotal);

  itemsContainer.innerHTML = cart.map(item => {
    const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    const displayThumb = (item.uploadedPhoto && item.uploadedPhoto.fileUrl) ? item.uploadedPhoto.fileUrl : (item.image || 'assets/images/custom_canvas.jpg');
    return `
      <div class="order-item-row">
        <img src="${displayThumb}" alt="${escapeHtml(item.name)}" class="order-item-img" onerror="this.src='assets/images/custom_canvas.jpg'" />
        
        <div class="order-item-details">
          <div class="order-item-name">${escapeHtml(item.name)}</div>
          <div class="order-item-qty">
            Qty: <strong>${item.quantity}</strong>
            ${item.size && item.size !== 'Standard' ? ` • ${escapeHtml(item.size)}` : ''}
            ${item.finish && item.finish !== 'Standard' ? ` • ${escapeHtml(item.finish)}` : ''}
          </div>
          ${item.uploadedPhoto ? `
            <div style="font-size: 0.72rem; color: #059669; font-weight: 600; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
              <span>📸 Custom Photo Attached</span>
            </div>
          ` : ''}
        </div>

        <div class="order-item-price">₹${lineTotal.toLocaleString('en-IN')}</div>
      </div>
    `;
  }).join('');
}

let selectedPaymentMethod = 'upi';
const UPI_ID = 'rajeshframing0@okaxis';
const UPI_PAYEE = 'Rajesh Framing';

/**
 * Configure and render dynamic UPI QR code and payment handlers
 */
function setupUpiPayment(amount) {
  const upiCard = document.getElementById('payOptionUpi');
  const codCard = document.getElementById('payOptionCod');
  const qrDrawer = document.getElementById('upiQrDrawer');
  const qrImg = document.getElementById('dynamicUpiQrImg');
  const amountPill = document.getElementById('upiQrAmountPill');
  const deepLinkBtn = document.getElementById('btnUpiDeepLink');
  const copyBtn = document.getElementById('btnCopyUpiId');
  const copyText = document.getElementById('copyUpiText');
  const upiDisplay = document.getElementById('upiIdDisplay');

  if (upiDisplay) upiDisplay.textContent = UPI_ID;

  // Build standard NPCI UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Rajesh Framing Custom Order')}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUri)}`;

  if (qrImg) qrImg.src = qrUrl;
  if (amountPill) amountPill.textContent = `Pay ₹${amount.toLocaleString('en-IN')}`;
  if (deepLinkBtn) deepLinkBtn.href = upiUri;

  if (copyBtn && !copyBtn.dataset.bound) {
    copyBtn.dataset.bound = 'true';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(UPI_ID).then(() => {
        if (copyText) copyText.textContent = 'Copied!';
        setTimeout(() => { if (copyText) copyText.textContent = 'Copy'; }, 2000);
      }).catch(() => {
        alert(`UPI ID: ${UPI_ID}`);
      });
    });
  }

  // Toggle Payment Option Cards
  if (upiCard && !upiCard.dataset.bound) {
    upiCard.dataset.bound = 'true';
    upiCard.addEventListener('click', () => {
      selectedPaymentMethod = 'upi';
      upiCard.classList.add('active');
      if (codCard) codCard.classList.remove('active');
      if (qrDrawer) qrDrawer.style.display = 'grid';
    });
  }

  if (codCard && !codCard.dataset.bound) {
    codCard.dataset.bound = 'true';
    codCard.addEventListener('click', () => {
      selectedPaymentMethod = 'cod';
      codCard.classList.add('active');
      if (upiCard) upiCard.classList.remove('active');
      if (qrDrawer) qrDrawer.style.display = 'none';
    });
  }
}

/**
 * Bind form submit and place order action
 */
function bindCheckoutForm() {
  const form = document.getElementById('checkoutOrderForm');
  const desktopBtn = document.getElementById('desktopPlaceOrderBtn');
  const btnText = document.getElementById('placeOrderBtnText');

  if (!form) return;

  const submitOrder = async (e) => {
    if (e) e.preventDefault();

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = document.getElementById('custEmail').value.trim();
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

    const cart = getCart();
    if (!cart || cart.length === 0) {
      alert('Your cart is empty. Please add products before placing an order.');
      window.location.href = 'products';
      return;
    }

    // GATE: Customer MUST be logged in before placing an order
    if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) {
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

    const subtotal = getCartSubtotal();
    const total = subtotal; // Free shipping

    // UI Loading state
    if (desktopBtn) desktopBtn.disabled = true;
    if (btnText) btnText.textContent = 'Processing Order...';

    const paymentLabel = selectedPaymentMethod === 'upi' ? 'Instant UPI Payment (QR Code)' : 'Pay on Delivery / Studio Pickup';

    const orderPayload = {
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
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
    const customerToken = typeof getCustomerToken === 'function' ? getCustomerToken() : null;
    if (customerToken) {
      headers['Authorization'] = `Bearer ${customerToken}`;
    }

    try {
      const response = await fetch(`${CART_API_BASE}/api/orders`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (response.status === 401 && result.requiresLogin) {
        if (desktopBtn) desktopBtn.disabled = false;
        if (btnText) btnText.textContent = 'Place Order via UPI / Cash';
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
        document.getElementById('successCustName').textContent = name;
        document.getElementById('successOrderId').textContent = orderId;
        document.getElementById('successOrderTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
        
        const successPayEl = document.getElementById('successPaymentMethod');
        if (successPayEl) {
          successPayEl.textContent = paymentLabel;
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
          `• Payment Method: ${paymentLabel}\n` +
          (utr ? `• UPI Ref / UTR: ${utr}\n` : '') +
          `• Delivery Address: ${address}, ${city} (${pincode})\n\n` +
          `Please confirm my order and share the digital preview proof!`
        );

        const waBtn = document.getElementById('successWhatsAppBtn');
        if (waBtn) {
          waBtn.href = `https://wa.me/919328081006?text=${waMsg}`;
        }

        const trackBtn = document.getElementById('successTrackBtn');
        if (trackBtn) {
          trackBtn.href = `track-order?id=${encodeURIComponent(orderId)}`;
        }

        // Clear cart
        clearCart();

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
      document.getElementById('successCustName').textContent = name;
      document.getElementById('successOrderId').textContent = fallbackId;
      document.getElementById('successOrderTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
      clearCart();
      const modal = document.getElementById('orderSuccessModal');
      if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    } finally {
      if (desktopBtn) desktopBtn.disabled = false;
      if (btnText) btnText.textContent = 'Place Order';
    }
  };

  form.addEventListener('submit', submitOrder);
  if (desktopBtn) desktopBtn.addEventListener('click', submitOrder);
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
