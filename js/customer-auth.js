/**
 * RAJESH FRAMING - CUSTOMER AUTHENTICATION & ACCOUNT CONTROLLER
 * Email + OTP Only • Zero Password Login • Secure Sessions & Order History
 */

(function () {
  'use strict';

  const STORAGE_TOKEN_KEY = 'rf_customer_token';
  const STORAGE_EMAIL_KEY = 'rf_customer_email';

  let currentEmail = '';
  let resendCountdown = 30;
  let resendTimerInterval = null;

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomerAuth);
  } else {
    initCustomerAuth();
  }

  function initCustomerAuth() {
    injectCustomerAuthModal();
    injectNavbarUserButton();
    syncNavbarState();
    verifyExistingSession();
    bindCheckoutIntegration();
  }

  /* ==========================================================================
     1. INJECT NAVBAR USER BUTTON (DESKTOP & MOBILE DRAWER)
     ========================================================================== */
  function injectNavbarUserButton() {
    // 1. Desktop Navbar: Insert before Cart button if not already present
    const navbarActions = document.querySelector('.navbar-actions');
    const navbarCartBtn = document.getElementById('navbarCartBtn');

    if (navbarActions && !document.getElementById('navbarUserBtn')) {
      const userBtn = document.createElement('button');
      userBtn.type = 'button';
      userBtn.className = 'navbar-user-btn';
      userBtn.id = 'navbarUserBtn';
      userBtn.setAttribute('aria-label', 'Customer Login');
      userBtn.title = 'Customer Login';
      userBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `;
      userBtn.addEventListener('click', () => {
        const token = localStorage.getItem(STORAGE_TOKEN_KEY);
        if (token) {
          openCustomerAuthModal('account');
        } else {
          openCustomerAuthModal('login');
        }
      });

      if (navbarCartBtn) {
        navbarActions.insertBefore(userBtn, navbarCartBtn);
      } else {
        navbarActions.prepend(userBtn);
      }
    }

    // 2. Mobile Drawer: Insert Login / Account link into .drawer-nav
    const drawerNav = document.querySelector('.drawer-nav');
    if (drawerNav && !document.getElementById('drawerAuthItem')) {
      const li = document.createElement('li');
      li.id = 'drawerAuthItem';
      li.innerHTML = `
        <a href="javascript:void(0)" class="nav-link" id="drawerAuthLink" style="display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span id="drawerAuthText">Customer Login</span>
        </a>
      `;
      li.querySelector('#drawerAuthLink').addEventListener('click', () => {
        // Close mobile drawer if open
        const drawerClose = document.querySelector('.drawer-close');
        if (drawerClose) drawerClose.click();

        const token = localStorage.getItem(STORAGE_TOKEN_KEY);
        if (token) {
          openCustomerAuthModal('account');
        } else {
          openCustomerAuthModal('login');
        }
      });
      drawerNav.appendChild(li);
    }
  }

  /* ==========================================================================
     2. SYNC NAVBAR STATE (LOGGED IN vs LOGGED OUT)
     ========================================================================== */
  function syncNavbarState() {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const email = localStorage.getItem(STORAGE_EMAIL_KEY) || '';
    const userBtn = document.getElementById('navbarUserBtn');
    const drawerAuthText = document.getElementById('drawerAuthText');

    if (token && email) {
      // Logged in
      if (userBtn) {
        const initial = email.charAt(0).toUpperCase();
        userBtn.title = `My Account (${email})`;
        userBtn.setAttribute('aria-label', `My Account (${email})`);
        userBtn.innerHTML = `
          <span class="user-avatar-initial">${initial}</span>
          <span class="user-active-dot" title="Logged in"></span>
        `;
      }
      if (drawerAuthText) {
        drawerAuthText.textContent = `My Account (${email.split('@')[0]})`;
      }
    } else {
      // Logged out
      if (userBtn) {
        userBtn.title = 'Customer Login';
        userBtn.setAttribute('aria-label', 'Customer Login');
        userBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        `;
      }
      if (drawerAuthText) {
        drawerAuthText.textContent = 'Customer Login';
      }
    }
  }

  /* ==========================================================================
     3. VERIFY SESSION WITH BACKEND ON LOAD
     ========================================================================== */
  async function verifyExistingSession() {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token) return;

    try {
      const res = await fetch('/api/customer/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        // Session expired or invalid
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_EMAIL_KEY);
        syncNavbarState();
      } else {
        localStorage.setItem(STORAGE_EMAIL_KEY, data.customer.email);
        syncNavbarState();
      }
    } catch (_) {
      // Offline or network glitch, retain existing local token
    }
  }

  /* ==========================================================================
     4. INJECT CUSTOMER AUTH MODAL MARKUP
     ========================================================================== */
  function injectCustomerAuthModal() {
    if (document.getElementById('customerAuthModal')) return;

    const modalHtml = `
      <div class="modal-overlay" id="customerAuthModal" role="dialog" aria-modal="true" aria-labelledby="custModalTitle">
        <div class="modal-container" style="max-width: 440px;">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-title" id="custModalTitle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span id="custModalHeaderHeading">Customer Login</span>
            </div>
            <button type="button" class="modal-close-btn" id="closeCustAuthModalBtn" aria-label="Close modal">&times;</button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body" id="custAuthModalBody">
            
            <!-- Global Message Notification Box -->
            <div id="custAuthAlert" class="auth-notice-box" style="display: none;"></div>

            <!-- STEP 1: EMAIL ADDRESS FORM -->
            <div id="custStepEmail">
              <p style="font-size: 0.9rem; color: #555555; line-height: 1.5; margin-bottom: 20px;">
                Enter your email address to receive a secure 6-digit One-Time Passcode (OTP). No password needed.
              </p>

              <form id="custEmailForm">
                <div class="form-group" style="margin-bottom: 18px;">
                  <label class="form-label" for="custLoginEmail">Email Address <span class="required" style="color: #DC2626;">*</span></label>
                  <input type="email" id="custLoginEmail" class="form-input" placeholder="e.g. yourname@gmail.com" required autocomplete="email" />
                </div>

                <button type="submit" class="btn btn-gold shimmer-effect" id="custSendOtpSubmitBtn" style="width: 100%; justify-content: center; padding: 12px 20px;">
                  <span>Send OTP</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </form>
            </div>

            <!-- STEP 2: ENTER OTP FORM -->
            <div id="custStepOtp" style="display: none;">
              <div class="auth-notice-box auth-notice-info" style="margin-bottom: 18px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <div>
                  OTP sent to your email address: <strong id="custTargetEmailText"></strong>
                </div>
              </div>

              <form id="custOtpForm">
                <div class="form-group" style="margin-bottom: 18px;">
                  <label class="form-label" for="custLoginOtp">Enter 6-Digit OTP <span class="required" style="color: #DC2626;">*</span></label>
                  <input type="text" id="custLoginOtp" class="form-input auth-otp-input" placeholder="• • • • • •" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" required autocomplete="one-time-code" />
                </div>

                <button type="submit" class="btn btn-gold shimmer-effect" id="custVerifyOtpSubmitBtn" style="width: 100%; justify-content: center; padding: 12px 20px; margin-bottom: 16px;">
                  <span>Verify OTP &amp; Login</span>
                </button>

                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; color: #6B7280; padding-top: 8px; border-top: 1px solid var(--border-light, #E5E7EB);">
                  <div>
                    <span id="custResendTimerText" class="auth-timer-text">Resend OTP in <strong>30s</strong></span>
                    <button type="button" id="custResendOtpBtn" class="auth-resend-btn" style="display: none;">Resend OTP</button>
                  </div>
                  <button type="button" id="custChangeEmailBtn" style="background: none; border: none; color: #4B5563; cursor: pointer; text-decoration: underline; font-size: 0.8125rem;">
                    Change email
                  </button>
                </div>
              </form>
            </div>

            <!-- STEP 3: CUSTOMER ACCOUNT AREA (WHEN LOGGED IN) -->
            <div id="custStepAccount" style="display: none;">
              <!-- User Profile Header -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--border-light, #E5E7EB);">
                <div>
                  <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent-gold, #C99A3D); font-weight: 700;">
                    Logged In As
                  </div>
                  <div id="custAccountEmailDisplay" style="font-weight: 700; font-size: 0.95rem; color: var(--primary-black, #111111); word-break: break-all;">
                  </div>
                </div>
                <button type="button" class="btn btn-outline btn-sm" id="custLogoutActionBtn" style="color: #DC2626; border-color: #FCA5A5; padding: 6px 14px; font-size: 0.75rem;">
                  Log Out
                </button>
              </div>

              <!-- My Orders Section -->
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <h3 style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: #111111; margin: 0;">
                    My Orders
                  </h3>
                  <a href="track-order" style="font-size: 0.75rem; color: var(--accent-gold, #C99A3D); font-weight: 600; text-decoration: none;">
                    Track Order &rarr;
                  </a>
                </div>

                <div id="custOrdersLoading" style="text-align: center; padding: 20px; font-size: 0.875rem; color: #6B7280;">
                  Loading your orders...
                </div>

                <div id="custOrdersContainer" style="display: none; max-height: 260px; overflow-y: auto; padding-right: 4px;">
                </div>

                <div id="custNoOrdersState" style="display: none; text-align: center; padding: 24px 12px; background: #FAF9F6; border-radius: 10px; border: 1px dashed var(--border-light, #E5E7EB);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color: #9CA3AF; margin: 0 auto 8px; display: block;">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <p style="font-size: 0.85rem; color: #6B7280; margin: 0 0 10px;">No orders found for this email yet.</p>
                  <a href="products" class="btn btn-gold btn-sm shimmer-effect" style="display: inline-block; padding: 6px 16px; font-size: 0.75rem;">
                    Browse Catalog
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    bindModalEvents();
  }

  /* ==========================================================================
     5. BIND MODAL EVENTS & FORM SUBMISSIONS
     ========================================================================== */
  function bindModalEvents() {
    const modal = document.getElementById('customerAuthModal');
    const closeBtn = document.getElementById('closeCustAuthModalBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeCustomerAuthModal);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCustomerAuthModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        closeCustomerAuthModal();
      }
    });

    // Step 1: Send OTP Submit
    const emailForm = document.getElementById('custEmailForm');
    if (emailForm) {
      emailForm.addEventListener('submit', handleSendOtp);
    }

    // Step 2: Verify OTP Submit
    const otpForm = document.getElementById('custOtpForm');
    if (otpForm) {
      otpForm.addEventListener('submit', handleVerifyOtp);
    }

    // Resend OTP button
    const resendBtn = document.getElementById('custResendOtpBtn');
    if (resendBtn) {
      resendBtn.addEventListener('click', handleResendOtp);
    }

    // Change Email button
    const changeEmailBtn = document.getElementById('custChangeEmailBtn');
    if (changeEmailBtn) {
      changeEmailBtn.addEventListener('click', () => {
        clearInterval(resendTimerInterval);
        showStep('email');
      });
    }

    // Logout action in Account step
    const logoutBtn = document.getElementById('custLogoutActionBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }

  /* ==========================================================================
     6. STEP DISPLAY HELPER
     ========================================================================== */
  function showStep(step) {
    const stepEmail = document.getElementById('custStepEmail');
    const stepOtp = document.getElementById('custStepOtp');
    const stepAccount = document.getElementById('custStepAccount');
    const headerHeading = document.getElementById('custModalHeaderHeading');
    const alertBox = document.getElementById('custAuthAlert');

    if (alertBox) alertBox.style.display = 'none';

    if (stepEmail) stepEmail.style.display = 'none';
    if (stepOtp) stepOtp.style.display = 'none';
    if (stepAccount) stepAccount.style.display = 'none';

    if (step === 'email') {
      if (stepEmail) stepEmail.style.display = 'block';
      if (headerHeading) headerHeading.textContent = 'Customer Login';
      setTimeout(() => {
        const input = document.getElementById('custLoginEmail');
        if (input) input.focus();
      }, 100);
    } else if (step === 'otp') {
      if (stepOtp) stepOtp.style.display = 'block';
      if (headerHeading) headerHeading.textContent = 'Verify Email OTP';
      const targetText = document.getElementById('custTargetEmailText');
      if (targetText) targetText.textContent = currentEmail;
      setTimeout(() => {
        const input = document.getElementById('custLoginOtp');
        if (input) {
          input.value = '';
          input.focus();
        }
      }, 100);
    } else if (step === 'account') {
      if (stepAccount) stepAccount.style.display = 'block';
      if (headerHeading) headerHeading.textContent = 'My Account';
      const emailDisplay = document.getElementById('custAccountEmailDisplay');
      const email = localStorage.getItem(STORAGE_EMAIL_KEY) || '';
      if (emailDisplay) emailDisplay.textContent = email;
      loadCustomerOrders();
    }
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('custAuthAlert');
    if (!alertBox) return;

    alertBox.className = `auth-notice-box auth-notice-${type || 'info'}`;
    alertBox.textContent = msg;
    alertBox.style.display = 'flex';
  }

  /* ==========================================================================
     7. SEND OTP HANDLER
     ========================================================================== */
  async function handleSendOtp(e) {
    e.preventDefault();
    const emailInput = document.getElementById('custLoginEmail');
    const submitBtn = document.getElementById('custSendOtpSubmitBtn');
    const email = (emailInput.value || '').trim();

    if (!email) return;

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Sending OTP...</span>';

    try {
      const res = await fetch('/api/customer/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        currentEmail = email;
        showStep('otp');
        startResendTimer();
      } else {
        showAlert(data.message || 'Failed to send OTP. Please try again.', 'error');
      }
    } catch (err) {
      showAlert('Network error connecting to server. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /* ==========================================================================
     8. VERIFY OTP HANDLER
     ========================================================================== */
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const otpInput = document.getElementById('custLoginOtp');
    const submitBtn = document.getElementById('custVerifyOtpSubmitBtn');
    const otp = (otpInput.value || '').trim();

    if (!otp || otp.length !== 6) {
      showAlert('Please enter the full 6-digit OTP passcode.', 'error');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Verifying OTP...</span>';

    try {
      const res = await fetch('/api/customer/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, otp })
      });
      const data = await res.json();

      if (data.success && data.token) {
        // Save session securely
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_EMAIL_KEY, data.customer.email);

        syncNavbarState();
        showAlert('Successfully logged in! Welcome back.', 'success');

        // Dispatch global event for checkout/cart integrations
        document.dispatchEvent(new CustomEvent('customerAuthChange', {
          detail: { loggedIn: true, email: data.customer.email }
        }));

        // Autofill checkout email if on checkout page
        const checkoutEmail = document.getElementById('custEmail');
        if (checkoutEmail) checkoutEmail.value = data.customer.email;

        // Transition to Account view or close
        setTimeout(() => {
          clearInterval(resendTimerInterval);
          showStep('account');
        }, 800);

      } else {
        showAlert(data.message || 'Incorrect OTP passcode. Please try again.', 'error');
      }
    } catch (err) {
      showAlert('Network error verifying OTP. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /* ==========================================================================
     9. RESEND OTP HANDLER & COUNTDOWN
     ========================================================================== */
  function startResendTimer() {
    clearInterval(resendTimerInterval);
    resendCountdown = 30;

    const timerText = document.getElementById('custResendTimerText');
    const resendBtn = document.getElementById('custResendOtpBtn');

    if (timerText) {
      timerText.style.display = 'inline';
      timerText.innerHTML = `Resend OTP in <strong>${resendCountdown}s</strong>`;
    }
    if (resendBtn) resendBtn.style.display = 'none';

    resendTimerInterval = setInterval(() => {
      resendCountdown -= 1;
      if (resendCountdown <= 0) {
        clearInterval(resendTimerInterval);
        if (timerText) timerText.style.display = 'none';
        if (resendBtn) {
          resendBtn.style.display = 'inline';
          resendBtn.disabled = false;
        }
      } else {
        if (timerText) {
          timerText.innerHTML = `Resend OTP in <strong>${resendCountdown}s</strong>`;
        }
      }
    }, 1000);
  }

  async function handleResendOtp() {
    const resendBtn = document.getElementById('custResendOtpBtn');
    if (!currentEmail) return;

    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Resending...';
    }

    try {
      const res = await fetch('/api/customer/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail })
      });
      const data = await res.json();

      if (data.success) {
        showAlert('A new 6-digit OTP has been sent to your email.', 'success');
        startResendTimer();
      } else {
        showAlert(data.message || 'Failed to resend OTP.', 'error');
        if (resendBtn) resendBtn.disabled = false;
      }
    } catch (err) {
      showAlert('Error resending OTP. Please try again.', 'error');
      if (resendBtn) resendBtn.disabled = false;
    }
  }

  /* ==========================================================================
     10. LOGOUT HANDLER (KEEPS CART 100% INTACT)
     ========================================================================== */
  async function handleLogout() {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);

    if (token) {
      try {
        await fetch('/api/customer/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (_) {}
    }

    // Clear only customer auth credentials - CART IS KEPT INTACT!
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_EMAIL_KEY);

    syncNavbarState();

    document.dispatchEvent(new CustomEvent('customerAuthChange', {
      detail: { loggedIn: false }
    }));

    closeCustomerAuthModal();
  }

  /* ==========================================================================
     11. LOAD CUSTOMER ORDERS (PROTECTED)
     ========================================================================== */
  async function loadCustomerOrders() {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const loading = document.getElementById('custOrdersLoading');
    const container = document.getElementById('custOrdersContainer');
    const noOrders = document.getElementById('custNoOrdersState');

    if (!token) return;

    if (loading) loading.style.display = 'block';
    if (container) container.style.display = 'none';
    if (noOrders) noOrders.style.display = 'none';

    try {
      const res = await fetch('/api/customer/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (loading) loading.style.display = 'none';

      if (data.success && data.orders && data.orders.length > 0) {
        container.innerHTML = data.orders.map(order => {
          const orderId = order.orderId || order.id || 'N/A';
          const status = order.status || 'Confirmed';
          const statusClass = status.toLowerCase().replace(/\s+/g, '-');
          const total = Number(order.total || order.estimatedValue || 0).toLocaleString('en-IN');
          const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
          const itemCount = order.items && order.items.length ? `${order.items.length} item(s)` : 'Custom Framing';

          return `
            <div class="cust-order-card">
              <div class="cust-order-header">
                <a href="track-order?id=${encodeURIComponent(orderId)}" class="cust-order-id" title="Track this order">
                  #${orderId}
                </a>
                <span class="cust-order-badge ${statusClass}">${status}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; color: #6B7280; margin-bottom: 4px;">
                <span>${dateStr} • ${itemCount}</span>
                <strong style="color: #111111;">₹${total}</strong>
              </div>
              <div style="text-align: right; margin-top: 6px;">
                <a href="track-order?id=${encodeURIComponent(orderId)}" style="font-size: 0.75rem; color: var(--accent-gold, #C99A3D); font-weight: 600; text-decoration: none;">
                  Track Live Status &rarr;
                </a>
              </div>
            </div>
          `;
        }).join('');
        container.style.display = 'block';
      } else {
        if (noOrders) noOrders.style.display = 'block';
      }
    } catch (err) {
      if (loading) loading.style.display = 'none';
      if (noOrders) {
        noOrders.innerHTML = '<p style="font-size: 0.85rem; color: #EF4444;">Unable to load order history right now.</p>';
        noOrders.style.display = 'block';
      }
    }
  }

  /* ==========================================================================
     12. CHECKOUT INTEGRATION
     ========================================================================== */
  function bindCheckoutIntegration() {
    const custEmailField = document.getElementById('custEmail');
    if (!custEmailField) return;

    // If customer is already logged in, auto-fill email in checkout
    const savedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);
    if (savedEmail && !custEmailField.value) {
      custEmailField.value = savedEmail;
    }

    // Add minimal prompt below email field if not logged in
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const parent = custEmailField.parentElement;
    if (parent && !token && !document.getElementById('checkoutLoginHint')) {
      const hint = document.createElement('span');
      hint.id = 'checkoutLoginHint';
      hint.style.cssText = 'font-size: 0.75rem; color: #6B7280; margin-top: 4px; display: block;';
      hint.innerHTML = `Have an account? <a href="javascript:void(0)" id="checkoutLoginLink" style="color: var(--accent-gold, #C99A3D); font-weight: 600;">Sign in with OTP</a> to auto-fill.`;
      parent.appendChild(hint);

      hint.querySelector('#checkoutLoginLink').addEventListener('click', () => {
        openCustomerAuthModal('login');
      });
    }

    // Listen for customer auth changes
    document.addEventListener('customerAuthChange', (e) => {
      if (e.detail && e.detail.loggedIn && e.detail.email) {
        if (custEmailField) custEmailField.value = e.detail.email;
        const hint = document.getElementById('checkoutLoginHint');
        if (hint) hint.remove();
      }
    });
  }

  /* ==========================================================================
     13. PUBLIC GLOBAL API
     ========================================================================== */
  window.openCustomerAuthModal = function (mode) {
    const modal = document.getElementById('customerAuthModal');
    if (!modal) return;

    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (token && mode !== 'login') {
      showStep('account');
    } else {
      showStep('email');
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeCustomerAuthModal = function () {
    const modal = document.getElementById('customerAuthModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    clearInterval(resendTimerInterval);
  };

  window.customerLogout = handleLogout;

})();
