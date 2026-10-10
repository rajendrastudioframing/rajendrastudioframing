/**
 * Configure payment handlers (Single Option: Pick up from shop)
 */
function setupUpiPayment(amount) {
  selectedPaymentMethod = 'pickup';
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

    const paymentLabel = 'Pick up from shop';

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
