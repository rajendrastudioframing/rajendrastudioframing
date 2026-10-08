/**
 * make-responsive.js
 * Comprehensive Responsive Optimization Script for Rajesh Framing / Dahej Support
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

console.log('🚀 Starting responsive upgrades across project...');

// 1. UPDATE CUSTOMER AUTH IN JS
const customerAuthFiles = [
  path.join(rootDir, 'js', 'customer-auth.js'),
  path.join(publicDir, 'js', 'customer-auth.js')
];

const drawerSlotHandler = `
    // Also look for mobile drawer account slot
    const drawerSlots = document.querySelectorAll('.drawer-account-slot, #drawerAccountSlot');
    drawerSlots.forEach(slot => {
      if (loggedIn && user) {
        const displayName = (user.name && user.name.trim() !== 'Valued Customer') 
          ? user.name 
          : (user.email ? user.email.split('@')[0] : 'My Account');
        const firstLetter = (displayName.charAt(0) || 'A').toUpperCase();
        slot.innerHTML = \`
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 32px; height: 32px; border-radius: 50%; background: #C99A3D; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0;">
                \${firstLetter}
              </span>
              <div style="min-width: 0; flex: 1;">
                <div style="font-weight: 700; font-size: 0.875rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${displayName}</div>
                <div style="font-size: 0.75rem; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${user.email || ''}</div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; border-top: 1px solid #E5E7EB; padding-top: 8px;">
              <a href="track-order" class="btn btn-sm btn-outline" style="flex: 1; justify-content: center; font-size: 0.75rem; padding: 6px 8px; border-radius: 8px; text-decoration: none;">Track Orders</a>
              <button type="button" onclick="logoutCustomer(true)" class="btn btn-sm btn-outline" style="font-size: 0.75rem; padding: 6px 10px; color: #DC2626; border-color: #FECACA; border-radius: 8px;">Sign Out</button>
            </div>
          </div>
        \`;
      } else {
        slot.innerHTML = \`
          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.08);">
            <button type="button" class="btn btn-outline" style="width: 100%; border-radius: 9999px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; padding: 9px 16px; font-size: 0.85rem;" onclick="openCustomerAuthModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Sign In / My Account</span>
            </button>
          </div>
        \`;
      }
    });
`;

customerAuthFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('drawer-account-slot')) {
      // Find where updateNavbarCustomerUI loops over customerBtns
      content = content.replace(/(customerBtns\.forEach\(container => \{[\s\S]*?\}\);\s*)/m, `$1${drawerSlotHandler}\n`);
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated customer-auth: ${file}`);
    }
  }
});

// 2. UPDATE HTML PAGES WITH DRAWER ACCOUNT SLOT & CHECKOUT FIXES
const htmlPages = [
  'index.html',
  'products.html',
  'product-detail.html',
  'about.html',
  'contact.html',
  'track-order.html',
  'checkout.html'
];

htmlPages.forEach(filename => {
  [path.join(rootDir, filename), path.join(publicDir, filename)].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Add drawer-account-slot if not present inside mobile-drawer
      if (!content.includes('drawerAccountSlot') && content.includes('</aside>')) {
        content = content.replace(/(<\/aside>)/i, `    <!-- Customer Account Slot for Mobile -->\n    <div class="drawer-account-slot" id="drawerAccountSlot"></div>\n  $1`);
        changed = true;
      }

      // In checkout.html, fix "on the left" instruction
      if (filename === 'checkout.html' && content.includes('Scan the live QR code on the left.')) {
        content = content.replace('Scan the live QR code on the left.', 'Scan the live QR code with your phone or UPI app.');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated HTML: ${filePath}`);
      }
    }
  });
});

// 3. UPDATE CART.CSS WITH ENHANCED MOBILE RESPONSIVENESS
const cartCssAdditions = `
/* ==========================================================================
   MOBILE & TABLET RESPONSIVE CART & CHECKOUT POLISH
   ========================================================================== */
@media (max-width: 600px) {
  .upi-qr-content-box {
    grid-template-columns: 1fr !important;
    text-align: center;
    gap: 16px;
  }
  .upi-qr-card {
    margin: 0 auto;
    padding: 10px;
  }
  .upi-qr-card img {
    width: 140px !important;
    height: 140px !important;
  }
  .upi-scan-steps ol {
    text-align: left;
    display: inline-block;
    margin: 6px auto 0;
  }
  .upi-copy-row {
    justify-content: center;
    margin: 0 auto;
    max-width: 280px;
  }
  .btn-upi-intent {
    width: 100%;
    justify-content: center;
  }
  .payment-brand-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }
  .payment-option-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .cart-drawer {
    width: 100vw !important;
    max-width: 100vw !important;
  }
  .checkout-card {
    padding: 16px 12px !important;
  }
}
`;

const cartCssFiles = [
  path.join(rootDir, 'css', 'cart.css'),
  path.join(publicDir, 'css', 'cart.css')
];

cartCssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('MOBILE & TABLET RESPONSIVE CART & CHECKOUT POLISH')) {
      content += '\n' + cartCssAdditions;
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated cart.css: ${file}`);
    }
  }
});

// 4. UPDATE ADMIN.CSS WITH COMPLETE RESPONSIVENESS FOR TABLET AND MOBILE
const adminCssAdditions = `
/* ==========================================================================
   MOBILE & TABLET RESPONSIVE ADMIN PORTAL POLISH
   ========================================================================== */
@media (max-width: 992px) {
  .topbar-breadcrumb {
    display: none;
  }
  .metric-segment-bar {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .admin-layout {
    overflow-x: hidden;
  }
  .admin-sidebar {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    left: -270px !important;
    width: 260px !important;
    z-index: 1000 !important;
    box-shadow: 10px 0 35px rgba(0, 0, 0, 0.45) !important;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .admin-sidebar.open {
    transform: translateX(270px) !important;
  }
  .sidebar-toggle-btn {
    display: flex !important;
  }
  .admin-topbar {
    padding: 10px 16px !important;
  }
  .topbar-title {
    font-size: 1.15rem !important;
  }
  .btn-theme-toggle #themeToggleText {
    display: none;
  }
  .btn-view-site span {
    display: none;
  }
  .server-status-chip span:last-child {
    display: none;
  }
  .server-status-chip {
    padding: 6px;
  }
  .admin-content {
    padding: 12px 10px !important;
  }
  .metric-segment-bar {
    grid-template-columns: 1fr !important;
  }
  .table-responsive,
  .orders-table-wrapper,
  .products-table-wrapper,
  .leads-table-wrapper {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
  }
  .page-subheader {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }
  .subheader-actions {
    flex-wrap: wrap !important;
    width: 100% !important;
    gap: 8px !important;
  }
  .subheader-actions .btn-sub-action {
    flex: 1 1 auto !important;
    justify-content: center !important;
  }
}

@media (max-width: 480px) {
  .admin-topbar {
    padding: 8px 12px !important;
    gap: 8px !important;
  }
  .topbar-left {
    gap: 8px !important;
  }
  .topbar-right {
    gap: 6px !important;
  }
  .topbar-title {
    font-size: 1.05rem !important;
  }
  .admin-avatar {
    width: 28px !important;
    height: 28px !important;
    font-size: 0.75rem !important;
  }
}
`;

const adminCssFiles = [
  path.join(rootDir, 'css', 'admin.css'),
  path.join(publicDir, 'css', 'admin.css')
];

adminCssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('MOBILE & TABLET RESPONSIVE ADMIN PORTAL POLISH')) {
      content += '\n' + adminCssAdditions;
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated admin.css: ${file}`);
    }
  }
});

// 5. UPDATE ADMIN-LOGIN.CSS WITH RESPONSIVE CARD SIZING
const adminLoginCssAdditions = `
/* ==========================================================================
   MOBILE RESPONSIVE ADMIN LOGIN POLISH
   ========================================================================== */
@media (max-width: 480px) {
  .login-wrapper {
    padding: 16px 12px !important;
  }
  .login-card {
    padding: 30px 20px 24px !important;
    border-radius: 20px !important;
  }
  .login-brand-logo-img {
    height: 38px !important;
  }
  .login-brand-text-img {
    height: 20px !important;
  }
  .login-title {
    font-size: 1.45rem !important;
  }
  .login-subtitle {
    font-size: 0.8rem !important;
  }
  .login-input {
    font-size: 16px !important;
    padding: 12px 14px !important;
  }
  .btn-login-submit {
    padding: 13px !important;
    font-size: 0.92rem !important;
  }
}
`;

const adminLoginCssFiles = [
  path.join(rootDir, 'css', 'admin-login.css'),
  path.join(publicDir, 'css', 'admin-login.css')
];

adminLoginCssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('MOBILE RESPONSIVE ADMIN LOGIN POLISH')) {
      content += '\n' + adminLoginCssAdditions;
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated admin-login.css: ${file}`);
    }
  }
});

console.log('🎉 All responsive optimizations completed successfully!');
