/**
 * RAJESH FRAMING - CUSTOMER AUTHENTICATION CONTROLLER
 * Handles Customer Email + OTP Sign In, Session Tokens, and Interactive Modal
 */

(function () {
  'use strict';

  const CLOUD_API_FALLBACK = 'https://rajesh-framing.vercel.app';

  function getInitialApiBase() {
    const isLocalDev = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.protocol === 'file:';
    if (isLocalDev && window.location.port !== '5000') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }

  let activeApiBase = getInitialApiBase();

  async function requestApi(endpoint, options = {}) {
    const fullUrl = `${activeApiBase}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(fullUrl, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      const isLocal = activeApiBase.includes('localhost') || activeApiBase.includes('127.0.0.1');
      if (isLocal && activeApiBase !== CLOUD_API_FALLBACK) {
        console.warn(`Local server at ${activeApiBase} unavailable. Falling back to live cloud API: ${CLOUD_API_FALLBACK}...`);
        activeApiBase = CLOUD_API_FALLBACK;
        try {
          return await fetch(`${activeApiBase}${endpoint}`, options);
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  async function parseResponseJson(res) {
    if (!res) return { success: false, message: 'No response received from server' };
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch (e) {
      return { 
        success: false, 
        message: res.status === 404 ? 'Service endpoint not found (404)' : `Server error (${res.status || 'offline'})` 
      };
    }
  }

  // Session Storage Keys
  const TOKEN_KEY = 'rf_customer_token';
  const USER_KEY = 'rf_customer_user';

  // Public Auth API Object
  window.CustomerAuth = {
    isCustomerLoggedIn() {
      return Boolean(localStorage.getItem(TOKEN_KEY));
    },

    getCustomerToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    getCustomerUser() {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    async checkSession() {
      const token = this.getCustomerToken();
      if (!token) return false;
      try {
        const res = await requestApi('/api/customer/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await parseResponseJson(res);
        if (data && data.success && data.customer) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.customer));
          this.notifyStateChange(true, data.customer);
          return true;
        } else {
          this.logoutCustomer(false);
          return false;
        }
      } catch (e) {
        // Retain local session if network temporarily drops
        return true;
      }
    },

    async sendOtp(email, name = '', phone = '') {
      const res = await requestApi('/api/customer/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone })
      });
      return await parseResponseJson(res);
    },

    async verifyOtp(email, otp, name = '', phone = '') {
      const res = await requestApi('/api/customer/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name, phone })
      });
      const data = await parseResponseJson(res);
      if (res && res.ok && data && data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.customer || { email }));
        this.notifyStateChange(true, data.customer || { email });
      }
      return data;
    },

    async resendOtp(email) {
      const res = await requestApi('/api/customer/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await parseResponseJson(res);
    },

    logoutCustomer(redirect = true) {
      const token = this.getCustomerToken();
      if (token) {
        requestApi('/api/customer/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      this.notifyStateChange(false, null);
      if (redirect) {
        window.location.reload();
      }
    },

    notifyStateChange(isLoggedIn, customer) {
      window.dispatchEvent(new CustomEvent('customerAuthStateChanged', {
        detail: { isLoggedIn, customer }
      }));
      updateNavbarCustomerUI();
    },

    // Modal Control
    _onAuthSuccessCallback: null,
    _activeContext: null,

    openAuthModal(callback, context) {
      if (typeof callback === 'function') {
        this._onAuthSuccessCallback = callback;
      }
      this._activeContext = (context && typeof context === 'object') ? context : null;
      ensureModalInDom();
      const modal = document.getElementById('customerAuthModal');
      if (modal) {
        resetModalState();
        if (this._activeContext) {
          if (this._activeContext.title) {
            const titleEl = document.getElementById('custAuthModalTitle');
            if (titleEl) titleEl.textContent = this._activeContext.title;
          }
          if (this._activeContext.subtitle) {
            const subEl = document.getElementById('custAuthModalSubtitle');
            if (subEl) subEl.textContent = this._activeContext.subtitle;
          }
        }
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
          const emailInput = document.getElementById('custAuthEmail');
          if (emailInput) emailInput.focus();
        }, 150);
      }
    },

    closeAuthModal() {
      const modal = document.getElementById('customerAuthModal');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  };

  // Aliases for convenient usage
  window.isCustomerLoggedIn = () => window.CustomerAuth.isCustomerLoggedIn();
  window.getCustomerToken = () => window.CustomerAuth.getCustomerToken();
  window.getCustomerUser = () => window.CustomerAuth.getCustomerUser();
  window.openCustomerAuthModal = (cb, context) => window.CustomerAuth.openAuthModal(cb, context);
  window.closeCustomerAuthModal = () => window.CustomerAuth.closeAuthModal();
  window.logoutCustomer = (redirect) => window.CustomerAuth.logoutCustomer(redirect);

  /* --- DOM Setup & Event Listeners --- */
  document.addEventListener('DOMContentLoaded', () => {
    ensureModalInDom();
    updateNavbarCustomerUI();
    window.CustomerAuth.checkSession();
  });

  /* --- Navbar UI Integration --- */
  function updateNavbarCustomerUI() {
    const loggedIn = window.CustomerAuth.isCustomerLoggedIn();
    const user = window.CustomerAuth.getCustomerUser();

    // Look for all customer action buttons or containers across navbar
    const customerBtns = document.querySelectorAll('.navbar-customer-btn, #navCustomerBtn, .nav-customer-slot');
    customerBtns.forEach(container => {
      if (loggedIn && user) {
        const displayName = (user.name && user.name.trim() !== 'Valued Customer') 
          ? user.name.split(' ')[0] 
          : (user.email ? user.email.split('@')[0] : 'Account');

        container.innerHTML = `
          <div class="cust-account-dropdown-wrap" style="position: relative; display: inline-block;">
            <button type="button" class="btn btn-sm btn-outline cust-nav-profile-btn" style="border-radius: 9999px; padding: 7px 16px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; font-weight: 600;">
              <span style="width: 22px; height: 22px; border-radius: 50%; background: #C99A3D; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700;">
                ${displayName.charAt(0).toUpperCase()}
              </span>
              <span>Hi, ${displayName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="cust-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 6px); background: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); min-width: 200px; padding: 6px; z-index: 9999;">
              <div style="padding: 8px 12px; border-bottom: 1px solid #F3F4F6;">
                <div style="font-size: 0.75rem; color: #6B7280;">Signed in as</div>
                <div style="font-size: 0.8125rem; font-weight: 700; color: #111827; word-break: break-all;">${user.email}</div>
              </div>
              <a href="track-order" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 0.8125rem; color: #374151; text-decoration: none; border-radius: 8px;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Track My Orders</span>
              </a>
              <button type="button" onclick="logoutCustomer(true)" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 0.8125rem; color: #DC2626; background: none; border: none; cursor: pointer; border-radius: 8px;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='transparent'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        `;

        // Toggle dropdown on click
        const btn = container.querySelector('.cust-nav-profile-btn');
        const menu = container.querySelector('.cust-dropdown-menu');
        if (btn && menu) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
          });
          document.addEventListener('click', () => {
            menu.style.display = 'none';
          });
        }

      } else {
        container.innerHTML = `
          <button type="button" class="btn btn-sm btn-outline cust-sign-in-btn" style="border-radius: 9999px; padding: 7px 16px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600;" onclick="openCustomerAuthModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Sign In</span>
          </button>
        `;
      }
    });
  }

  /* --- Interactive Customer Modal Injection --- */
  function ensureModalInDom() {
    if (document.getElementById('customerAuthModal')) return;

    const modalHtml = `
      <div id="customerAuthModal" class="cust-auth-modal-overlay" aria-modal="true" role="dialog">
        <div class="cust-auth-modal-backdrop" onclick="closeCustomerAuthModal()"></div>
        <div class="cust-auth-modal-dialog">
          
          <!-- Close Button -->
          <button type="button" class="cust-auth-modal-close" onclick="closeCustomerAuthModal()" aria-label="Close dialog">&times;</button>

          <!-- Header -->
          <div class="cust-auth-modal-header">
            <div class="cust-auth-brand-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h3 class="cust-auth-title" id="custAuthModalTitle">Customer Sign In</h3>
            <p class="cust-auth-subtitle" id="custAuthModalSubtitle">Sign in or create your account to place your order with Rajesh Framing Studio.</p>
          </div>

          <!-- Alert Banner -->
          <div id="custAuthAlert" class="cust-auth-alert" style="display: none;"></div>

          <!-- Phase 1: Email & Optional Details Form -->
          <form id="custAuthEmailForm" class="cust-auth-form">
            <div class="cust-auth-input-group">
              <label for="custAuthEmail" class="cust-auth-label">Email Address <span style="color:#DC2626;">*</span></label>
              <div class="cust-auth-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cust-input-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input type="email" id="custAuthEmail" class="cust-auth-input" placeholder="e.g. rahul@gmail.com" required autocomplete="email" />
              </div>
            </div>

            <div class="cust-auth-input-group">
              <label for="custAuthName" class="cust-auth-label">Your Full Name <span style="color:#6B7280; font-weight: normal; font-size:0.75rem;">(Optional)</span></label>
              <div class="cust-auth-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cust-input-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input type="text" id="custAuthName" class="cust-auth-input" placeholder="e.g. Rahul Sharma" autocomplete="name" />
              </div>
            </div>

            <div class="cust-auth-input-group">
              <label for="custAuthPhone" class="cust-auth-label">Mobile Number <span style="color:#6B7280; font-weight: normal; font-size:0.75rem;">(Optional)</span></label>
              <div class="cust-auth-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cust-input-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <input type="tel" id="custAuthPhone" class="cust-auth-input" placeholder="e.g. +91 98765 43210" autocomplete="tel" />
              </div>
            </div>

            <button type="submit" id="custAuthSendOtpBtn" class="btn btn-gold shimmer-effect" style="width: 100%; justify-content: center; padding: 13px; font-weight: 700; margin-top: 10px;">
              <span id="custAuthSendBtnText">Send Login Passcode</span>
              <span id="custAuthSendSpinner" class="auth-spinner" style="display: none;"></span>
            </button>
            
            <div style="font-size: 0.72rem; color: #6B7280; text-align: center; margin-top: 12px; line-height: 1.4;">
              By signing in, you can place orders, view digital framing proofs, and track your deliveries in real-time.
            </div>
          </form>

          <!-- Phase 2: 6-Digit OTP Verification Form -->
          <form id="custAuthOtpForm" class="cust-auth-form" style="display: none;">
            <div style="text-align: center; margin-bottom: 14px;">
              <div style="font-size: 0.8125rem; color: #4B5563;">Passcode sent to:</div>
              <div style="font-size: 0.9375rem; font-weight: 700; color: #111827;" id="custAuthTargetEmailLabel">email@example.com</div>
            </div>

            <div class="cust-otp-boxes-wrap">
              <input type="text" maxlength="1" class="cust-otp-box" id="cust-otp-1" inputmode="numeric" autocomplete="one-time-code" />
              <input type="text" maxlength="1" class="cust-otp-box" id="cust-otp-2" inputmode="numeric" />
              <input type="text" maxlength="1" class="cust-otp-box" id="cust-otp-3" inputmode="numeric" />
              <input type="text" maxlength="1" class="cust-otp-box" id="cust-otp-4" inputmode="numeric" />
              <input type="text" maxlength="1" class="cust-otp-box" id="cust-otp-5" inputmode="numeric" />
              <input type="text" maxlength="1" class="cust-otp-box" id="cust-otp-6" inputmode="numeric" />
            </div>

            <button type="submit" id="custAuthVerifyBtn" class="btn btn-gold shimmer-effect" style="width: 100%; justify-content: center; padding: 13px; font-weight: 700; margin-top: 16px;">
              <span id="custAuthVerifyBtnText">Verify &amp; Continue</span>
              <span id="custAuthVerifySpinner" class="auth-spinner" style="display: none;"></span>
            </button>

            <div class="cust-auth-otp-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; font-size: 0.8125rem;">
              <button type="button" id="custAuthBackBtn" style="background: none; border: none; color: #4B5563; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                ← Change Email
              </button>
              <button type="button" id="custAuthResendBtn" style="background: none; border: none; color: #C99A3D; font-weight: 700; cursor: pointer;">
                Resend Code
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    injectModalStyles();
    bindModalEvents();
  }

  function injectModalStyles() {
    if (document.getElementById('custAuthModalStyles')) return;
    const style = document.createElement('style');
    style.id = 'custAuthModalStyles';
    style.textContent = `
      .cust-auth-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .cust-auth-modal-overlay.open {
        opacity: 1;
        visibility: visible;
      }
      .cust-auth-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(17, 24, 39, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .cust-auth-modal-dialog {
        position: relative;
        background: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3);
        border-radius: 24px;
        width: 100%;
        max-width: 440px;
        padding: 32px 28px;
        z-index: 2;
        transform: translateY(20px) scale(0.97);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: inherit;
        color: #111827;
      }
      .cust-auth-modal-overlay.open .cust-auth-modal-dialog {
        transform: translateY(0) scale(1);
      }
      .cust-auth-modal-close {
        position: absolute;
        top: 16px;
        right: 18px;
        background: none;
        border: none;
        font-size: 26px;
        color: #9CA3AF;
        cursor: pointer;
        line-height: 1;
        transition: color 0.2s ease;
      }
      .cust-auth-modal-close:hover {
        color: #111827;
      }
      .cust-auth-brand-badge {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: linear-gradient(135deg, #111827, #1F2937);
        color: #C99A3D;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        box-shadow: 0 8px 18px rgba(0,0,0,0.15);
      }
      .cust-auth-title {
        font-size: 1.35rem;
        font-weight: 800;
        text-align: center;
        color: #111827;
        margin: 0 0 6px;
      }
      .cust-auth-subtitle {
        font-size: 0.84rem;
        color: #6B7280;
        text-align: center;
        margin: 0 0 20px;
        line-height: 1.45;
      }
      .cust-auth-input-group {
        margin-bottom: 14px;
      }
      .cust-auth-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #374151;
        margin-bottom: 6px;
      }
      .cust-auth-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .cust-input-icon {
        position: absolute;
        left: 14px;
        color: #9CA3AF;
        pointer-events: none;
      }
      .cust-auth-input {
        width: 100%;
        padding: 12px 14px 12px 40px;
        border: 1.5px solid #E5E7EB;
        border-radius: 12px;
        font-size: 0.9375rem;
        color: #111827;
        background: #F9FAFB;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      .cust-auth-input:focus {
        border-color: #C99A3D;
        background: #ffffff;
        outline: none;
        box-shadow: 0 0 0 3px rgba(201, 154, 61, 0.18);
      }
      .cust-otp-boxes-wrap {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 16px 0;
      }
      .cust-otp-box {
        width: 48px;
        height: 54px;
        border-radius: 12px;
        border: 2px solid #E5E7EB;
        text-align: center;
        font-size: 1.35rem;
        font-weight: 800;
        color: #111827;
        background: #F9FAFB;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      .cust-otp-box:focus {
        border-color: #C99A3D;
        background: #ffffff;
        outline: none;
        box-shadow: 0 0 0 3px rgba(201, 154, 61, 0.18);
        transform: translateY(-2px);
      }
      .cust-auth-alert {
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 0.8125rem;
        font-weight: 600;
        margin-bottom: 16px;
        text-align: center;
      }
      .cust-auth-alert.danger {
        background: #FEE2E2;
        color: #991B1B;
        border: 1px solid #FCA5A5;
      }
      .cust-auth-alert.success {
        background: #D1FAE5;
        color: #065F46;
        border: 1px solid #6EE7B7;
      }
      .auth-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: custSpin 0.7s linear infinite;
        display: inline-block;
      }
      @keyframes custSpin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  let activeEmailForVerification = '';
  let activeNameForVerification = '';
  let activePhoneForVerification = '';

  function resetModalState() {
    const emailForm = document.getElementById('custAuthEmailForm');
    const otpForm = document.getElementById('custAuthOtpForm');
    const alertBox = document.getElementById('custAuthAlert');

    if (emailForm) emailForm.style.display = 'block';
    if (otpForm) otpForm.style.display = 'none';
    if (alertBox) alertBox.style.display = 'none';

    const ctx = (window.CustomerAuth && window.CustomerAuth._activeContext) ? window.CustomerAuth._activeContext : null;
    const titleEl = document.getElementById('custAuthModalTitle');
    const subEl = document.getElementById('custAuthModalSubtitle');
    if (titleEl) titleEl.textContent = (ctx && ctx.title) ? ctx.title : 'Customer Sign In';
    if (subEl) subEl.textContent = (ctx && ctx.subtitle) ? ctx.subtitle : 'Sign in or create your account to place your order with Rajesh Framing Studio.';

    // Clear OTP inputs
    for (let i = 1; i <= 6; i++) {
      const box = document.getElementById(`cust-otp-${i}`);
      if (box) box.value = '';
    }
  }

  function showModalAlert(type, message) {
    const alertBox = document.getElementById('custAuthAlert');
    if (!alertBox) return;
    alertBox.className = `cust-auth-alert ${type}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
  }

  function bindModalEvents() {
    const emailForm = document.getElementById('custAuthEmailForm');
    const otpForm = document.getElementById('custAuthOtpForm');
    const backBtn = document.getElementById('custAuthBackBtn');
    const resendBtn = document.getElementById('custAuthResendBtn');

    // 1. Submit Email Form
    if (emailForm) {
      emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('custAuthEmail');
        const nameInput = document.getElementById('custAuthName');
        const phoneInput = document.getElementById('custAuthPhone');
        const sendBtn = document.getElementById('custAuthSendOtpBtn');
        const sendBtnText = document.getElementById('custAuthSendBtnText');
        const spinner = document.getElementById('custAuthSendSpinner');

        const email = emailInput.value.trim();
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';

        if (!email) {
          showModalAlert('danger', 'Please enter your email address.');
          return;
        }

        sendBtn.disabled = true;
        sendBtnText.textContent = 'Sending Passcode...';
        spinner.style.display = 'inline-block';
        showModalAlert('success', 'Sending 6-digit passcode to your email...');

        try {
          const res = await window.CustomerAuth.sendOtp(email, name, phone);
          if (res.success) {
            activeEmailForVerification = email;
            activeNameForVerification = name;
            activePhoneForVerification = phone;

            emailForm.style.display = 'none';
            otpForm.style.display = 'block';

            document.getElementById('custAuthModalTitle').textContent = 'Enter Verification Passcode';
            document.getElementById('custAuthModalSubtitle').textContent = 'Enter the 6-digit verification code sent to your email inbox.';
            document.getElementById('custAuthTargetEmailLabel').textContent = email;

            showModalAlert('success', res.message || 'Passcode sent! Please check your email inbox to get your verification code.');
            const firstBox = document.getElementById('cust-otp-1');
            if (firstBox) firstBox.focus();

          } else {
            showModalAlert('danger', res.message || 'Failed to send OTP.');
          }
        } catch (err) {
          console.error('Customer send OTP error:', err);
          showModalAlert('danger', 'Could not connect to authentication service. Please try again.');
        } finally {
          sendBtn.disabled = false;
          sendBtnText.textContent = 'Send Login Passcode';
          spinner.style.display = 'none';
        }
      });
    }

    // 2. OTP Inputs Navigation
    const boxes = [
      document.getElementById('cust-otp-1'),
      document.getElementById('cust-otp-2'),
      document.getElementById('cust-otp-3'),
      document.getElementById('cust-otp-4'),
      document.getElementById('cust-otp-5'),
      document.getElementById('cust-otp-6')
    ];

    boxes.forEach((box, idx) => {
      if (!box) return;
      box.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val.charAt(0) : '';
        if (val && idx < 5) {
          boxes[idx + 1].focus();
        }
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].focus();
        }
      });

      // Handle paste of 6 digits
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
        const digits = pasted.replace(/\D/g, '').slice(0, 6);
        if (digits.length > 0) {
          for (let i = 0; i < 6; i++) {
            if (boxes[i] && digits[i]) {
              boxes[i].value = digits[i];
            }
          }
          const nextFocus = Math.min(digits.length, 5);
          if (boxes[nextFocus]) boxes[nextFocus].focus();
        }
      });
    });

    // 3. Verify OTP Form Submit
    if (otpForm) {
      otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = boxes.map(b => (b ? b.value : '')).join('');

        if (otp.length !== 6) {
          showModalAlert('danger', 'Please enter all 6 digits of your verification passcode.');
          return;
        }

        const verifyBtn = document.getElementById('custAuthVerifyBtn');
        const verifyBtnText = document.getElementById('custAuthVerifyBtnText');
        const spinner = document.getElementById('custAuthVerifySpinner');

        verifyBtn.disabled = true;
        verifyBtnText.textContent = 'Verifying Passcode...';
        spinner.style.display = 'inline-block';

        try {
          const res = await window.CustomerAuth.verifyOtp(
            activeEmailForVerification,
            otp,
            activeNameForVerification,
            activePhoneForVerification
          );

          if (res.success) {
            showModalAlert('success', 'Logged in successfully! Redirecting...');
            
            setTimeout(() => {
              window.CustomerAuth.closeAuthModal();
              if (typeof window.CustomerAuth._onAuthSuccessCallback === 'function') {
                const cb = window.CustomerAuth._onAuthSuccessCallback;
                window.CustomerAuth._onAuthSuccessCallback = null;
                cb(res.customer);
              }
            }, 600);

          } else {
            showModalAlert('danger', res.message || 'Invalid passcode. Please try again.');
            boxes.forEach(b => { if (b) b.value = ''; });
            if (boxes[0]) boxes[0].focus();
          }
        } catch (err) {
          console.error('Customer verify OTP error:', err);
          showModalAlert('danger', 'Could not verify passcode. Please try again.');
        } finally {
          verifyBtn.disabled = false;
          verifyBtnText.textContent = 'Verify & Continue';
          spinner.style.display = 'none';
        }
      });
    }

    // 5. Back button
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        resetModalState();
      });
    }

    // 6. Resend button
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        if (!activeEmailForVerification) return;
        resendBtn.disabled = true;
        resendBtn.textContent = 'Resending...';
        try {
          const res = await window.CustomerAuth.resendOtp(activeEmailForVerification);
          if (res.success) {
            showModalAlert('success', res.message || 'New verification code sent! Please check your email inbox.');
          } else {
            showModalAlert('danger', res.message || 'Could not resend code.');
          }
        } catch (err) {
          showModalAlert('danger', 'Network error resending code.');
        } finally {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Code';
        }
      });
    }
  }

})();
