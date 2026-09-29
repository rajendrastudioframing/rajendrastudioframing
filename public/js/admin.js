/**
 * RAJESH FRAMING - GRAPHURA SAAS EXECUTIVE DASHBOARD CONTROLLER
 * Architecture: Graphura Studio OS Design System
 * Features: Order Card Rows, Leads Avatar Table, Products Catalog, CSV Export, WhatsApp Connect
 */

const API_BASE = window.location.origin.includes(':5500') 
  ? 'http://localhost:5000' 
  : window.location.origin;

let token = localStorage.getItem('rf_admin_token');
let currentAdminUser = null;
let allInquiries = [];
let allProducts = [];
let allMessages = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  const authenticated = await verifyAdminSession();
  if (!authenticated) return;

  initNavigation();
  initSidebarToggle();
  initThemeToggle();
  initLogout();
  initOrderFiltering();
  initLeadFiltering();
  initProductModals();
  initNewOrderModal();
  initEditOrderModal();
  initCancelOrderModal();
  initSettingsForms();

  // Initial Data Load
  await loadDashboardStats();
  await loadInquiries();
  await loadProducts();
  await loadMessages();
  await loadSettings();
});

/* ==========================================================================
   AUTHENTICATION & SESSION VERIFICATION
   ========================================================================== */
async function verifyAdminSession() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.admin) {
      currentAdminUser = data.admin;
      updateAdminProfileUI(data.admin);
      return true;
    } else {
      handleAuthFailure();
      return false;
    }
  } catch (err) {
    console.error('Session verification failed:', err);
    handleAuthFailure();
    return false;
  }
}

function updateAdminProfileUI(admin) {
  const nameEl = document.getElementById('sidebarAdminName');
  const avatarEl = document.getElementById('sidebarAvatar');
  const headerAvatar = document.querySelector('.header-profile-avatar');

  if (nameEl) nameEl.textContent = admin.name || 'Rajesh Kumar';
  
  const initials = (admin.name || 'Rajesh Kumar')
    .split(' ')
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (avatarEl) avatarEl.textContent = initials || 'RK';
  if (headerAvatar) headerAvatar.textContent = initials || 'RK';
}

function handleAuthFailure() {
  localStorage.removeItem('rf_admin_token');
  localStorage.removeItem('rf_admin_user');
  window.location.href = 'admin-login.html';
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to end your administrative session?')) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('Logout notification error:', e);
      }
      handleAuthFailure();
    }
  });
}

/* ==========================================================================
   NAVIGATION & TAB ROUTING
   ========================================================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-link[data-view]');
  const viewPanels = document.querySelectorAll('.dashboard-view-panel');
  const titleEl = document.getElementById('pageHeadingTitle');

  const titles = {
    viewOverview: 'Dashboard',
    viewProducts: 'Products',
    viewOrders: 'Orders',
    viewLeads: 'Leads',
    viewMessages: 'Messages',
    viewSettings: 'Settings'
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetViewId = link.getAttribute('data-view');
      switchTab(targetViewId);
    });
  });

  // Handle URL hash on load
  const hash = window.location.hash.replace('#', '');
  if (hash === 'orders') switchTab('viewOrders');
  else if (hash === 'leads') switchTab('viewLeads');
  else if (hash === 'products') switchTab('viewProducts');
  else if (hash === 'messages') switchTab('viewMessages');
  else if (hash === 'settings') switchTab('viewSettings');

  window.switchTab = (viewId) => {
    navLinks.forEach(l => {
      if (l.getAttribute('data-view') === viewId) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    viewPanels.forEach(panel => {
      if (panel.id === viewId) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (titleEl && titles[viewId]) {
      titleEl.textContent = titles[viewId];
    }

    // Close mobile drawer
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }

    // Refresh specific section
    if (viewId === 'viewOverview') loadDashboardStats();
    if (viewId === 'viewOrders' || viewId === 'viewLeads') loadInquiries();
    if (viewId === 'viewProducts') loadProducts();
    if (viewId === 'viewMessages') loadMessages();
    if (viewId === 'viewSettings') loadSettings();
  };
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('adminSidebar');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking any navigation link on mobile
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });

  // Close when clicking outside sidebar on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

/* ==========================================================================
   THEME SWITCHER: LIGHT SAAS / DARK SAAS
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeToggleIcon');
  const text = document.getElementById('themeToggleText');
  if (!toggleBtn) return;

  let savedTheme = localStorage.getItem('rf_admin_theme') || 'light';
  applyTheme(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('rf_admin_theme', theme);
    if (icon && text) {
      if (theme === 'dark') {
        icon.textContent = '🌙';
        text.textContent = 'Dark Mode';
      } else {
        icon.textContent = '☀️';
        text.textContent = 'Light Luxury';
      }
    }
  }
}

/* ==========================================================================
   PRODUCT IMAGE MATCHER
   ========================================================================== */
function getProductThumbnail(productString) {
  const str = (productString || '').toLowerCase();
  if (str.includes('glass')) return 'assets/images/glass_frame.jpg';
  if (str.includes('plastic')) return 'assets/images/plastic_frame.jpg';
  if (str.includes('bottle')) return 'assets/images/printed_bottle.jpg';
  if (str.includes('mug')) return 'assets/images/custom_mug.jpg';
  if (str.includes('file')) return 'assets/images/printed_file.jpg';
  if (str.includes('folder')) return 'assets/images/printed_folder.jpg';
  if (str.includes('canvas') || str.includes('custom')) return 'assets/images/custom_canvas.jpg';
  return 'assets/images/glass_frame.jpg';
}

/* ==========================================================================
   DASHBOARD STATS & KPI CALCULATION
   ========================================================================== */
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return;

    const stats = data.stats;

    // Overview KPIs
    const kpiNew = document.getElementById('kpiNewInquiries');
    const kpiProcessing = document.getElementById('kpiProcessingOrders');
    const kpiCompleted = document.getElementById('kpiCompletedOrders');
    const kpiPipeline = document.getElementById('kpiPipelineValue');
    const badgeInquiries = document.getElementById('sidebarNewInquiriesBadge');
    const badgeMessages = document.getElementById('sidebarUnreadMessagesBadge');

    if (kpiNew) kpiNew.textContent = stats.newInquiries || 0;
    if (kpiPipeline) kpiPipeline.textContent = `₹${(stats.totalPipelineValue || 0).toLocaleString('en-IN')}`;

    if (badgeInquiries) {
      badgeInquiries.textContent = stats.newInquiries;
      badgeInquiries.style.display = stats.newInquiries > 0 ? 'inline-block' : 'none';
    }

    if (badgeMessages) {
      badgeMessages.textContent = stats.unreadMessages;
      badgeMessages.style.display = stats.unreadMessages > 0 ? 'inline-block' : 'none';
    }

  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}

/* ==========================================================================
   ORDERS & INQUIRIES DATA CONTROLLER
   ========================================================================== */
async function loadInquiries() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/inquiries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return;

    allInquiries = data.inquiries || [];

    // Separate Orders and Leads
    const orders = allInquiries.filter(i => 
      i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]'))
    );
    const leads = allInquiries.filter(i => 
      !i.id.startsWith('RF-ORD') && (!i.product || !i.product.includes('[ONLINE ORDER]'))
    );

    // Update KPI Counters
    updateOrdersKPIs(orders);
    updateLeadsKPIs(leads);

    // Render Views
    renderOverviewOrders(orders.slice(0, 5));
    renderAllOrders(orders);
    renderAllLeads(leads);

  } catch (err) {
    console.error('Failed to load inquiries/orders:', err);
  }
}

function updateOrdersKPIs(orders) {
  const newCount = orders.filter(o => o.status === 'New').length;
  const processingCount = orders.filter(o => o.status === 'In Progress').length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

  const elNew = document.getElementById('ordersKpiNew');
  const elProc = document.getElementById('ordersKpiProcessing');
  const elComp = document.getElementById('ordersKpiCompleted');
  const elCanc = document.getElementById('ordersKpiCancelled');

  const elOverProc = document.getElementById('kpiProcessingOrders');
  const elOverComp = document.getElementById('kpiCompletedOrders');

  if (elNew) elNew.textContent = newCount;
  if (elProc) elProc.textContent = processingCount;
  if (elComp) elComp.textContent = completedCount;
  if (elCanc) elCanc.textContent = cancelledCount;

  if (elOverProc) elOverProc.textContent = processingCount;
  if (elOverComp) elOverComp.textContent = completedCount;
}

function updateLeadsKPIs(leads) {
  const total = leads.length;
  const active = leads.filter(l => l.status === 'In Progress' || l.status === 'Contacted').length;
  const closed = leads.filter(l => l.status === 'Completed').length;
  const newInq = leads.filter(l => l.status === 'New').length;

  const elTot = document.getElementById('leadsKpiTotal');
  const elAct = document.getElementById('leadsKpiActive');
  const elClo = document.getElementById('leadsKpiClosed');
  const elNew = document.getElementById('leadsKpiNew');

  if (elTot) elTot.textContent = total;
  if (elAct) elAct.textContent = active;
  if (elClo) elClo.textContent = closed;
  if (elNew) elNew.textContent = newInq;
}

/* ==========================================================================
   RENDER: GRAPHURA ORDER CARD ROWS (IMAGE 1)
   ========================================================================== */
function renderOverviewOrders(orders) {
  const container = document.getElementById('overviewOrdersContainer');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<div class="order-empty-state">No recent customer orders found.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => createOrderCardRowHTML(order)).join('');
}

function renderAllOrders(orders) {
  const container = document.getElementById('allOrdersContainer');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<div class="order-empty-state">No orders matching selected criteria.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => createOrderCardRowHTML(order)).join('');
}

function createOrderCardRowHTML(order) {
  const thumb = getProductThumbnail(order.product);
  const cleanPhone = (order.phone || '').replace(/\D/g, '');

  const dateObj = new Date(order.createdAt);
  const dateFormatted = isNaN(dateObj) ? '25 Sep 2026 • 11:45 PM' : dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ' • ' + dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Clean Product Title
  const cleanTitle = (order.product || 'Photo Frame')
    .replace('[ONLINE ORDER]', '')
    .trim();

  // Payment Status & Delivery Status Derivations
  const isOnlinePayment = (order.specs && order.specs.toLowerCase().includes('instant upi')) || false;
  const paymentStatus = isOnlinePayment ? 'Paid' : (order.status === 'Completed' ? 'Paid' : 'Pending');
  const paymentClass = paymentStatus.toLowerCase();
  const paymentMethod = isOnlinePayment ? 'Online UPI (QR)' : 'Pay on Delivery';

  const deliveryClass = order.status.toLowerCase().replace(/\s+/g, '-');
  const trackingText = order.specs && order.specs.includes('Deliver to:') 
    ? 'Doorstep Delivery' 
    : 'Studio Pickup';

  const noteText = order.notes && !order.notes.includes('None')
    ? escapeHtml(order.notes)
    : (order.specs ? escapeHtml(order.specs) : 'Standard Studio Packaging');

  const waText = encodeURIComponent(`Hello ${order.name}, Rajesh Framing here regarding your Order #${order.id} for ${cleanTitle}. Total: ₹${order.estimatedValue}.`);

  return `
    <div class="order-card-row" id="orderRow_${escapeHtml(order.id)}">
      <div class="order-card-body">
        <!-- 1. Thumbnail -->
        <div class="order-thumb-wrap" title="${escapeHtml(cleanTitle)}">
          <img src="${thumb}" alt="${escapeHtml(cleanTitle)}" class="order-thumb-img" onerror="this.src='assets/images/glass_frame.jpg'" />
        </div>

        <!-- 2. Order ID & Date -->
        <div class="order-col-info">
          <span class="order-id-num" onclick="copyToClipboard('${escapeHtml(order.id)}', 'Order ID')" title="Click to copy Order ID">#${escapeHtml(order.id)}</span>
          <span class="order-timestamp">${dateFormatted}</span>
        </div>

        <!-- 3. Customer -->
        <div class="order-col-info">
          <span class="col-field-label">Customer</span>
          <span class="cust-name-text">${escapeHtml(order.name)}</span>
          <span class="cust-phone-text">
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" title="Chat on WhatsApp">💬 ${escapeHtml(order.phone)}</a>
          </span>
        </div>

        <!-- 4. Product -->
        <div class="order-col-info">
          <span class="col-field-label">Product</span>
          <span class="prod-name-text" title="${escapeHtml(cleanTitle)}">${escapeHtml(cleanTitle)}</span>
          <span class="prod-qty-text">Qty: ${order.quantity || 1}</span>
        </div>

        <!-- 5. Payment Status -->
        <div class="order-col-info">
          <span class="col-field-label">Payment Status</span>
          <span class="status-pill ${paymentClass}">
            <span class="status-dot"></span>
            ${paymentStatus}
          </span>
          <span class="sub-meta-text">${paymentMethod}</span>
        </div>

        <!-- 6. Delivery Status -->
        <div class="order-col-info">
          <span class="col-field-label">Delivery Status</span>
          <span class="status-pill ${deliveryClass}">
            <span class="status-dot"></span>
            ${order.status}
          </span>
          <span class="sub-meta-text">${trackingText}</span>
        </div>

        <!-- 7. Amount -->
        <div class="order-col-info" style="align-items: flex-end;">
          <span class="col-field-label">Amount</span>
          <span class="order-amount-text">₹${Number(order.estimatedValue || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Order Footer Bar -->
      <div class="order-card-footer">
        <div class="order-note-block" title="${noteText}">
          <span class="order-note-icon">📝</span>
          <span class="order-note-label">Order Note:</span>
          <span>${noteText}</span>
        </div>
        <div class="order-action-buttons">
          <!-- Direct Status Switcher (Always accessible for all orders) -->
          <div class="order-quick-status-wrap" title="Quick change fulfillment status">
            <select class="order-quick-status-select" onchange="changeOrderStatusDirectly('${order.id}', this.value)">
              <option value="New" ${order.status === 'New' || order.status === 'Pending' ? 'selected' : ''}>🔵 New Order (Pending)</option>
              <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>✓ Confirmed (In Production)</option>
              <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>🟡 In Production</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>🟣 Dispatched / Ready</option>
              <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>🟢 Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>🔴 Cancelled</option>
            </select>
          </div>

          <!-- Contextual Primary Workflow Actions -->
          ${order.status === 'New' || order.status === 'Pending' ? `
            <button type="button" class="btn-card-action accept" onclick="acceptOrderQuick('${order.id}')" title="Confirm order & move to production">
              ✓ Confirm Order
            </button>
            <button type="button" class="btn-card-action cancel" onclick="openCancelOrderModal('${order.id}')" title="Cancel order and notify customer">
              ✕ Cancel Order
            </button>
          ` : (order.status === 'In Progress' || order.status === 'Confirmed' ? `
            <button type="button" class="btn-card-action dispatch" onclick="updateInquiryStatus('${order.id}', 'Shipped')" title="Mark as Dispatched / Ready for Pickup">
              🚚 Mark Dispatched
            </button>
            <button type="button" class="btn-card-action accept" onclick="updateInquiryStatus('${order.id}', 'Completed')" title="Mark order as completed/delivered">
              ✓ Mark Delivered
            </button>
            <button type="button" class="btn-card-action revert" onclick="updateInquiryStatus('${order.id}', 'New')" title="Revert order back to New status">
              ↩ Move to New
            </button>
            <button type="button" class="btn-card-action cancel" onclick="openCancelOrderModal('${order.id}')" title="Cancel order and notify customer">
              ✕ Cancel Order
            </button>
          ` : (order.status === 'Shipped' ? `
            <button type="button" class="btn-card-action accept" onclick="updateInquiryStatus('${order.id}', 'Completed')" title="Mark order as completed/delivered">
              ✓ Mark Delivered
            </button>
            <button type="button" class="btn-card-action revert" onclick="updateInquiryStatus('${order.id}', 'In Progress')" title="Move back to In Production">
              ↩ In Production
            </button>
            <button type="button" class="btn-card-action cancel" onclick="openCancelOrderModal('${order.id}')" title="Cancel order">
              ✕ Cancel Order
            </button>
          ` : (order.status === 'Completed' ? `
            <span class="status-pill completed" style="font-size: 0.72rem; padding: 4px 8px;">✓ Delivered</span>
            <button type="button" class="btn-card-action reopen" onclick="updateInquiryStatus('${order.id}', 'In Progress')" title="Reopen order into Production">
              🔄 Reopen Order
            </button>
          ` : (order.status === 'Cancelled' ? `
            <span class="status-pill cancelled" style="font-size: 0.72rem; padding: 4px 8px;">✕ Cancelled</span>
            <button type="button" class="btn-card-action reopen" onclick="restoreCancelledOrder('${order.id}', 'In Progress')" title="Restore and put order back into Production">
              🔄 Reopen &amp; Confirm
            </button>
            <button type="button" class="btn-card-action revert" onclick="restoreCancelledOrder('${order.id}', 'New')" title="Restore and move back to New Orders">
              ↩ Restore to New
            </button>
          ` : ''))))}
          
          <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn-card-action invoice" title="Chat on WhatsApp">
            💬 WhatsApp / Invoice
          </a>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   RENDER: GRAPHURA LEADS TABLE (IMAGE 3)
   ========================================================================== */
function renderAllLeads(leads) {
  const tbody = document.getElementById('allLeadsTableBody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No leads recorded yet.</td>
      </tr>
    `;
    return;
  }

  const avatarColors = ['pink', 'blue', 'purple', 'green'];

  tbody.innerHTML = leads.map((lead, idx) => {
    const color = avatarColors[idx % avatarColors.length];
    const initials = (lead.name || 'Lead')
      .split(' ')
      .map(p => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    const dateObj = new Date(lead.createdAt);
    const dateFormatted = isNaN(dateObj) ? '12 Jun 2026<br><span style="font-size: 0.72rem; color: var(--text-muted);">10:45 AM</span>' : `${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br><span style="font-size: 0.72rem; color: var(--text-muted);">${dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>`;

    const inquiryType = lead.hasUpload ? 'Custom Frame' : (lead.product || 'Product Inquiry');
    const waText = encodeURIComponent(`Hello ${lead.name}, Rajesh Framing here regarding your inquiry for ${inquiryType}.`);

    return `
      <tr>
        <td>
          <div class="lead-cust-cell">
            <div class="lead-avatar-circle ${color}">${initials}</div>
            <div class="lead-cust-info">
              <span class="lead-cust-name">${escapeHtml(lead.name)}</span>
              <span class="lead-cust-email">${escapeHtml(lead.email || 'customer@gmail.com')}</span>
            </div>
          </div>
        </td>
        <td>
          <strong style="color: var(--text-main); font-size: 0.85rem;">📞 ${escapeHtml(lead.phone)}</strong>
        </td>
        <td>
          <span class="status-pill inquiry">${escapeHtml(inquiryType)}</span>
        </td>
        <td>
          <strong style="font-size: 0.82rem; color: var(--text-main); display: block;">WhatsApp Inquiry</strong>
          <span class="status-pill active" style="font-size: 0.68rem; padding: 1px 6px; margin-top: 2px;">Active</span>
        </td>
        <td>
          ${dateFormatted}
        </td>
        <td style="text-align: center;">
          <div class="table-action-icons">
            <button type="button" class="btn-table-icon edit" onclick="viewInquiryDetail('${lead.id}')" title="View Full Specs">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn-table-icon chat" title="Chat on WhatsApp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.51.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
              </svg>
            </a>
            <button type="button" class="btn-table-icon delete" onclick="deleteInquiry('${lead.id}')" title="Delete Lead">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   ORDER FILTERING & SEARCH CONTROLLER
   ========================================================================== */
function initOrderFiltering() {
  const tabs = document.querySelectorAll('#orderFilterTabs .pill-tab-btn');
  const searchInput = document.getElementById('orderSearchInput');
  const globalSearch = document.getElementById('globalSidebarSearch');
  const sortSelect = document.getElementById('orderSortSelect');

  let activeFilter = 'all';

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-filter');
      applyOrderFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => applyOrderFilters());
  }

  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      const q = e.target.value;
      if (searchInput) searchInput.value = q;
      applyOrderFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => applyOrderFilters());
  }

  function applyOrderFilters() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const sortVal = sortSelect ? sortSelect.value : 'newest';

    const orders = allInquiries.filter(i => 
      i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]'))
    );

    let filtered = orders.filter(order => {
      const matchesFilter = activeFilter === 'all' || 
        order.status === activeFilter ||
        (activeFilter === 'In Progress' && (order.status === 'In Progress' || order.status === 'Confirmed')) ||
        (activeFilter === 'New' && (order.status === 'New' || order.status === 'Pending'));
      const matchesQuery = !query || 
        order.id.toLowerCase().includes(query) ||
        (order.name && order.name.toLowerCase().includes(query)) ||
        (order.phone && order.phone.includes(query)) ||
        (order.product && order.product.toLowerCase().includes(query));

      return matchesFilter && matchesQuery;
    });

    if (sortVal === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortVal === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortVal === 'amount-high') {
      filtered.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
    } else if (sortVal === 'amount-low') {
      filtered.sort((a, b) => (a.estimatedValue || 0) - (b.estimatedValue || 0));
    }

    renderAllOrders(filtered);
  }
}

function initLeadFiltering() {
  const searchInput = document.getElementById('leadSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const leads = allInquiries.filter(i => 
      !i.id.startsWith('RF-ORD') && (!i.product || !i.product.includes('[ONLINE ORDER]'))
    );

    const filtered = leads.filter(l => 
      !query || 
      l.id.toLowerCase().includes(query) ||
      (l.name && l.name.toLowerCase().includes(query)) ||
      (l.phone && l.phone.includes(query)) ||
      (l.email && l.email.toLowerCase().includes(query))
    );

    renderAllLeads(filtered);
  });
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE & SHORTCUTS
   ========================================================================== */
function showToast(title, message, type = 'success') {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const icons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    danger: '✕'
  };

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <div class="admin-toast-icon">${icons[type] || '✓'}</div>
    <div class="admin-toast-content">
      <div class="admin-toast-title">${escapeHtml(title)}</div>
      <div class="admin-toast-msg">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="admin-toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

window.copyToClipboard = (text, label = 'Text') => {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to Clipboard', `${label} ${text} copied successfully!`, 'info');
  }).catch(() => {
    showToast('Copied', text, 'info');
  });
};

// Global Shortcut: Cmd+K / Ctrl+K or '/' to focus search
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('globalSidebarSearch') || document.getElementById('orderSearchInput');
    if (searchInput) searchInput.focus();
  }
});

/* ==========================================================================
   STATUS CYCLE & ACTIONS
   ========================================================================== */
window.cycleOrderStatus = async (id) => {
  const item = allInquiries.find(i => i.id === id);
  if (!item) return;

  const sequence = ['New', 'In Progress', 'Completed', 'Cancelled'];
  const curIdx = sequence.indexOf(item.status);
  const nextStatus = sequence[(curIdx + 1) % sequence.length];

  await updateInquiryStatus(id, nextStatus);
};

window.updateInquiryStatus = async (id, newStatus, customNotes = null) => {
  const cleanId = (id || '').replace(/^#/, '');
  try {
    const payload = {
      status: newStatus,
      notifyCustomer: true
    };
    if (customNotes) {
      payload.notes = customNotes;
    } else if (newStatus === 'Confirmed' || newStatus === 'In Progress') {
      payload.notes = 'Order confirmed by studio. Custom framing and crafting underway.';
    } else if (newStatus === 'Shipped') {
      payload.notes = 'Your order has been dispatched for delivery / studio pickup.';
    } else if (newStatus === 'Completed') {
      payload.notes = 'Order delivered successfully. Thank you for choosing Rajesh Framing!';
    }

    const res = await fetch(`${API_BASE}/api/admin/inquiries/${encodeURIComponent(cleanId)}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      const item = allInquiries.find(i => i.id === cleanId || i.id === id);
      if (item) item.status = newStatus;
      await loadInquiries();
      await loadDashboardStats();
      const emailNotice = data.emailResult && data.emailResult.sent ? ` (Customer notified via email)` : '';
      showToast('Status Updated', `Order #${cleanId} status changed to "${newStatus}".${emailNotice}`, 'success');
    } else {
      showToast('Update Failed', data.message || 'Status update failed.', 'danger');
    }
  } catch (err) {
    console.error('Error updating status:', err);
    showToast('Network Error', 'Could not reach server to update status.', 'danger');
  }
};

window.changeOrderStatusDirectly = async (id, newStatus) => {
  const cleanId = (id || '').replace(/^#/, '');
  if (!newStatus) return;
  if (newStatus === 'Cancelled') {
    openCancelOrderModal(cleanId);
    return;
  }
  await updateInquiryStatus(cleanId, newStatus);
};

window.restoreCancelledOrder = async (id, targetStatus = 'In Progress') => {
  const cleanId = (id || '').replace(/^#/, '');
  try {
    showToast('Restoring Order', `Restoring Order #${cleanId} to "${targetStatus}"...`, 'info');
    const res = await fetch(`${API_BASE}/api/admin/inquiries/${encodeURIComponent(cleanId)}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: targetStatus,
        notes: `Order restored by studio admin to ${targetStatus}.`,
        notifyCustomer: true
      })
    });
    const data = await res.json();
    if (data.success) {
      await loadInquiries();
      await loadDashboardStats();
      showToast('Order Restored! ✓', `Order #${cleanId} is now ${targetStatus}.`, 'success');
    } else {
      showToast('Action Failed', data.message || 'Could not restore order.', 'danger');
    }
  } catch (err) {
    console.error('Error restoring order:', err);
    showToast('Network Error', 'Failed to restore order.', 'danger');
  }
};

window.deleteInquiry = async (id) => {
  if (!confirm(`Are you sure you want to remove ${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/inquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      allInquiries = allInquiries.filter(i => i.id !== id);
      await loadInquiries();
      await loadDashboardStats();
      showToast('Order Deleted', `Order #${id} was deleted successfully.`, 'danger');
    } else {
      showToast('Delete Failed', data.message || 'Could not delete order.', 'danger');
    }
  } catch (err) {
    console.error('Error deleting order:', err);
    showToast('Network Error', 'Could not connect to server.', 'danger');
  }
};

/* ==========================================================================
   EXPORT TO CSV (GRAPHURA FEATURE)
   ========================================================================== */
window.exportOrdersToCSV = () => {
  if (!allInquiries || allInquiries.length === 0) {
    showToast('Export Alert', 'No order data available to export.', 'warning');
    return;
  }

  const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Email', 'Product', 'Quantity', 'Amount (INR)', 'Status', 'Notes'];
  const rows = allInquiries.map(inq => {
    // Format Date cleanly as YYYY-MM-DD HH:mm:ss without unquoted commas that break CSV column alignment
    let dateStr = '';
    if (inq.createdAt) {
      const d = new Date(inq.createdAt);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        dateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else {
        dateStr = String(inq.createdAt);
      }
    }

    // Resolve Email reliably across inquiries and order objects
    const email = (inq.customer && inq.customer.email) || inq.email || '';
    const phone = (inq.customer && inq.customer.phone) || inq.phone || '';
    const name = (inq.customer && inq.customer.name) || inq.name || '';
    const product = inq.product || (inq.items && inq.items.map(it => `${it.name} (x${it.quantity})`).join('; ')) || '';
    const notes = inq.notes || inq.specs || '';

    return [
      `"${String(inq.id || '').replace(/"/g, '""')}"`,
      `"${dateStr.replace(/"/g, '""')}"`,
      `"${String(name).replace(/"/g, '""')}"`,
      `"${String(phone).replace(/"/g, '""')}"`,
      `"${String(email).replace(/"/g, '""')}"`,
      `"${String(product).replace(/"/g, '""')}"`,
      inq.quantity || 1,
      Number(inq.estimatedValue || inq.total || 0),
      `"${String(inq.status || 'New').replace(/"/g, '""')}"`,
      `"${String(notes).replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Rajesh_Framing_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Export Downloaded', `Successfully exported ${allInquiries.length} orders to CSV.`, 'info');
};

/* ==========================================================================
   MODAL: NEW ORDER CREATION
   ========================================================================== */
function initNewOrderModal() {
  const modal = document.getElementById('newOrderModal');
  const form = document.getElementById('newOrderForm');
  if (!form || !modal) return;

  window.openNewOrderModal = () => {
    form.reset();
    modal.classList.add('open');
  };

  window.closeNewOrderModal = () => {
    modal.classList.remove('open');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newOrderCustName').value.trim();
    const phone = document.getElementById('newOrderCustPhone').value.trim();
    const email = document.getElementById('newOrderCustEmail').value.trim();
    const product = document.getElementById('newOrderProductSelect').value;
    const qty = parseInt(document.getElementById('newOrderQty').value) || 1;
    const amount = parseInt(document.getElementById('newOrderAmount').value) || 0;
    const notes = document.getElementById('newOrderNotes').value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          product: `[ONLINE ORDER] ${product} (x${qty})`,
          specs: notes || `Direct Studio Order - ${product}`,
          quantity: qty,
          notes: notes || 'Direct Studio Custom Order'
        })
      });

      const data = await res.json();
      if (data.success) {
        closeNewOrderModal();
        await loadInquiries();
        await loadDashboardStats();
        alert('New order recorded successfully!');
      } else {
        alert(data.message || 'Failed to record order.');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Could not connect to server.');
    }
  });
}

/* ==========================================================================
   ACCEPT ORDER (QUICK ACTION WITH EMAIL NOTIFICATION)
   ========================================================================== */
window.acceptOrderQuick = async (id) => {
  const cleanId = (id || '').replace(/^#/, '');
  const item = allInquiries.find(i => i.id === cleanId || i.id === id);
  if (!item) return;

  try {
    showToast('Confirming Order', `Confirming Order #${cleanId} and sending confirmation email to customer...`, 'info');
    const res = await fetch(`${API_BASE}/api/admin/inquiries/${encodeURIComponent(cleanId)}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'Confirmed',
        notes: 'Order confirmed by studio. Custom framing and crafting underway.',
        notifyCustomer: true
      })
    });

    const data = await res.json();
    if (data.success) {
      if (item) item.status = 'Confirmed';
      await loadInquiries();
      await loadDashboardStats();
      const emailNotice = data.emailResult && data.emailResult.sent ? ` Confirmation email sent to ${data.emailResult.recipient}!` : '';
      showToast('Order Confirmed! ✓', `Order #${cleanId} is now Confirmed.${emailNotice}`, 'success');
    } else {
      showToast('Action Failed', data.message || 'Could not confirm order.', 'danger');
    }
  } catch (err) {
    console.error('Error confirming order:', err);
    showToast('Network Error', 'Failed to connect to server.', 'danger');
  }
};

/* ==========================================================================
   MODAL: EDIT ORDER DETAILS & STATUS
   ========================================================================== */
window.openEditOrderModal = (id) => {
  const item = allInquiries.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('editOrderModal');
  const orderNumSpan = document.getElementById('editModalOrderNum');
  const idInput = document.getElementById('editOrderId');
  const statusSelect = document.getElementById('editOrderStatus');
  const payRefInput = document.getElementById('editOrderPaymentRef');
  const nameInput = document.getElementById('editOrderCustName');
  const phoneInput = document.getElementById('editOrderCustPhone');
  const emailInput = document.getElementById('editOrderCustEmail');
  const addressInput = document.getElementById('editOrderAddress');
  const notesText = document.getElementById('editOrderNotes');
  const notifyCheck = document.getElementById('editOrderNotifyCheckbox');

  if (!modal) return;

  idInput.value = item.id;
  if (orderNumSpan) orderNumSpan.textContent = `#${item.id}`;
  if (statusSelect) statusSelect.value = item.status || 'In Progress';

  const isOnlinePayment = (item.specs && item.specs.toLowerCase().includes('instant upi'));
  if (payRefInput) {
    payRefInput.value = isOnlinePayment ? 'Online UPI (Verified QR)' : 'Pay on Delivery / Studio Pickup';
  }

  if (nameInput) nameInput.value = item.name || '';
  if (phoneInput) phoneInput.value = item.phone || '';
  if (emailInput) emailInput.value = item.email || '';

  let addressVal = '';
  if (item.specs && item.specs.includes('Deliver to:')) {
    const parts = item.specs.split('•');
    addressVal = parts[0].replace('Deliver to:', '').trim();
  } else {
    addressVal = item.specs || '';
  }
  if (addressInput) addressInput.value = addressVal;

  if (notesText) notesText.value = item.notes || '';
  if (notifyCheck) notifyCheck.checked = true;

  modal.classList.add('open');
};

window.closeEditOrderModal = () => {
  const modal = document.getElementById('editOrderModal');
  if (modal) modal.classList.remove('open');
};

function initEditOrderModal() {
  const form = document.getElementById('editOrderForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editOrderId').value;
    const status = document.getElementById('editOrderStatus').value;
    const name = document.getElementById('editOrderCustName').value.trim();
    const phone = document.getElementById('editOrderCustPhone').value.trim();
    const email = document.getElementById('editOrderCustEmail').value.trim();
    const address = document.getElementById('editOrderAddress').value.trim();
    const notes = document.getElementById('editOrderNotes').value.trim();
    const notifyCustomer = document.getElementById('editOrderNotifyCheckbox').checked;

    const saveBtn = document.getElementById('saveEditOrderBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving & Sending Email...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          address,
          notes,
          notifyCustomer
        })
      });

      const data = await res.json();
      if (data.success) {
        closeEditOrderModal();
        await loadInquiries();
        await loadDashboardStats();
        const emailNotice = data.emailResult && data.emailResult.sent ? ' Customer email notification dispatched!' : '';
        showToast('Order Updated', `Order #${id} updated successfully.${emailNotice}`, 'success');
      } else {
        showToast('Update Failed', data.message || 'Could not update order.', 'danger');
      }
    } catch (err) {
      console.error('Error saving order edits:', err);
      showToast('Network Error', 'Could not reach server to update order.', 'danger');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes & Notify Customer';
      }
    }
  });
}

/* ==========================================================================
   MODAL: CANCEL ORDER (WITH REASON & CUSTOMER NOTIFICATION)
   ========================================================================== */
window.openCancelOrderModal = (id) => {
  const cleanId = (id || '').trim().replace(/^#/, '');
  const item = allInquiries.find(i => i.id && (i.id === id || i.id.replace(/^#/, '') === cleanId));
  if (!item) return;

  const modal = document.getElementById('cancelOrderModal');
  const idInput = document.getElementById('cancelOrderId');
  const subTitle = document.getElementById('cancelModalOrderSubtitle');
  const reasonSelect = document.getElementById('cancelOrderReason');
  const remarksText = document.getElementById('cancelOrderRemarks');
  const notifyCheck = document.getElementById('cancelNotifyCheckbox');

  if (!modal) return;

  idInput.value = item.id;
  if (subTitle) subTitle.textContent = `Order #${item.id} • Customer: ${item.name || 'Customer'}`;
  if (reasonSelect) reasonSelect.selectedIndex = 0;
  if (remarksText) remarksText.value = '';
  if (notifyCheck) notifyCheck.checked = true;

  modal.classList.add('open');
};

window.closeCancelOrderModal = () => {
  const modal = document.getElementById('cancelOrderModal');
  if (modal) modal.classList.remove('open');
};

function initCancelOrderModal() {
  const form = document.getElementById('cancelOrderForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cancelOrderId').value.trim();
    const cleanId = id.replace(/^#/, '');
    const reason = document.getElementById('cancelOrderReason').value;
    const remarks = document.getElementById('cancelOrderRemarks').value.trim();
    const notifyCustomer = document.getElementById('cancelNotifyCheckbox').checked;

    const cancelNotes = `Order cancelled by studio. Reason: ${reason}.${remarks ? ' Remarks: ' + remarks : ''}`;

    const confirmBtn = document.getElementById('confirmCancelBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Cancelling & Notifying...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/inquiries/${encodeURIComponent(cleanId)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Cancelled',
          notes: cancelNotes,
          notifyCustomer
        })
      });

      const data = await res.json();
      if (data.success) {
        closeCancelOrderModal();
        await loadInquiries();
        await loadDashboardStats();
        if (data.emailResult && data.emailResult.sent) {
          showToast('Order Cancelled', `Order #${cleanId} cancelled and cancellation email sent to ${data.emailResult.recipient}!`, 'warning');
        } else if (notifyCustomer && data.emailResult && data.emailResult.reason) {
          showToast('Order Cancelled', `Order #${cleanId} marked Cancelled. (Email notice: ${data.emailResult.reason})`, 'info');
        } else {
          showToast('Order Cancelled', `Order #${cleanId} has been marked as Cancelled.`, 'warning');
        }
      } else {
        showToast('Action Failed', data.message || 'Could not cancel order.', 'danger');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showToast('Network Error', 'Failed to communicate with server.', 'danger');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Cancellation';
      }
    }
  });
}

/* ==========================================================================
   MODAL: VIEW INQUIRY DETAILS
   ========================================================================== */
window.viewInquiryDetail = (id) => {
  const inq = allInquiries.find(i => i.id === id);
  if (!inq) return;

  const modal = document.getElementById('inquiryDetailModal');
  const titleEl = document.getElementById('modalInquiryId');
  const bodyEl = document.getElementById('modalInquiryContent');
  const waBtn = document.getElementById('modalWhatsAppActionBtn');

  if (!modal || !bodyEl) return;

  titleEl.textContent = `Order / Inquiry #${inq.id}`;

  const cleanPhone = (inq.phone || '').replace(/\D/g, '');
  const waText = encodeURIComponent(`Hello ${inq.name}, Rajesh Framing here regarding your Order #${inq.id} for ${inq.product}.`);
  if (waBtn) waBtn.href = `https://wa.me/${cleanPhone}?text=${waText}`;

  bodyEl.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
      <div style="background: var(--bg-hover); padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Customer</span>
        <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-main); margin-top: 4px;">${escapeHtml(inq.name)}</div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">📞 ${escapeHtml(inq.phone)}</div>
        ${inq.email ? `<div style="font-size: 0.82rem; color: var(--text-muted);">✉️ ${escapeHtml(inq.email)}</div>` : ''}
      </div>

      <div style="background: var(--bg-hover); padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Order Value</span>
        <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-main); margin-top: 4px;">${escapeHtml(inq.product)}</div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">Quantity: <strong>${inq.quantity}</strong></div>
        <div style="font-size: 0.82rem; color: var(--text-muted);">Total: <strong style="color: var(--primary); font-size: 1.05rem;">₹${Number(inq.estimatedValue || 0).toLocaleString('en-IN')}</strong></div>
      </div>
    </div>

    <div style="margin-bottom: 14px;">
      <label style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Specifications / Delivery Address:</label>
      <div style="background: var(--bg-hover); border: 1px solid var(--border-subtle); padding: 12px 14px; border-radius: 8px; font-size: 0.88rem; color: var(--text-main); margin-top: 6px; line-height: 1.5;">
        ${inq.specs ? escapeHtml(inq.specs) : '<em style="color: var(--text-muted);">Standard Studio Pickup</em>'}
      </div>
    </div>

    ${inq.hasUpload && inq.uploadedFileUrl ? `
      <div style="margin-bottom: 14px; background: var(--bg-card-subtle); border: 1px solid var(--primary-border); border-radius: 10px; padding: 14px;">
        <label style="font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
          Customer Uploaded Frame Photo
        </label>
        <div style="display: flex; gap: 14px; align-items: center;">
          <a href="${inq.uploadedFileUrl}" target="_blank" style="display: block; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-subtle); flex-shrink: 0;">
            <img src="${inq.uploadedFileUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Frame Photo" />
          </a>
          <div>
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-main); margin-bottom: 6px;">${escapeHtml(inq.uploadedFileName || 'Frame_Photo.jpg')}</div>
            <a href="${inq.uploadedFileUrl}" target="_blank" class="btn-sub-action outline" style="padding: 4px 10px; font-size: 0.75rem;">
              Open Full Resolution ↗
            </a>
          </div>
        </div>
      </div>
    ` : ''}

    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-subtle); font-size: 0.78rem; color: var(--text-muted);">
      <span>Date Recorded: ${new Date(inq.createdAt).toLocaleString('en-IN')}</span>
      <span>Status: <strong style="color: var(--primary);">${inq.status}</strong></span>
    </div>
  `;

  modal.classList.add('open');
};

window.closeInquiryModal = () => {
  const modal = document.getElementById('inquiryDetailModal');
  if (modal) modal.classList.remove('open');
};

/* ==========================================================================
   PRODUCTS CATALOG (IMAGE 2 STYLE)
   ========================================================================== */
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return;

    allProducts = data.products || [];
    renderAdminProducts(allProducts);
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">No products in catalog.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(prod => {
    return `
      <tr>
        <td style="text-align: center;">
          <img src="${prod.image || 'assets/images/custom_canvas.jpg'}" alt="${escapeHtml(prod.name)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-subtle);" onerror="this.src='assets/images/custom_canvas.jpg'" />
        </td>
        <td>
          <strong style="color: var(--text-main); display: block; font-size: 0.88rem;">${escapeHtml(prod.name)}</strong>
          <span style="font-size: 0.73rem; color: var(--text-muted);">ID: ${prod.id}</span>
        </td>
        <td>
          <span class="status-pill blue" style="font-weight: 600;">
            ${escapeHtml(prod.categoryLabel || prod.category)}
          </span>
        </td>
        <td>
          <strong style="font-size: 0.95rem; color: var(--text-main);">₹${Number(prod.price).toLocaleString('en-IN')}</strong>
        </td>
        <td>
          ${prod.badge ? `<span class="status-pill amber">${escapeHtml(prod.badge)}</span>` : '<span style="color: var(--text-subtle);">—</span>'}
        </td>
        <td>
          <button type="button" class="btn-table-icon stock ${prod.status === 'In Stock' ? 'in-stock' : 'out-stock'}" onclick="toggleProductStock('${prod.id}')" title="Click to toggle: ${prod.status === 'In Stock' ? 'Mark Out of Stock' : 'Mark In Stock'}">
            ${prod.status === 'In Stock' ? '🟢 In Stock' : '🔴 Out of Stock'}
          </button>
        </td>
        <td>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(prod.leadTime || '24 - 48 Hours')}</span>
        </td>
        <td style="text-align: center;">
          <div class="table-action-icons">
            <button type="button" class="btn-table-icon edit" onclick="openEditProductModal('${prod.id}')" title="Edit Pricing">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="btn-table-icon delete" onclick="deleteProduct('${prod.id}')" title="Remove Product">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function initProductModals() {
  const openAddBtn = document.getElementById('openAddProductModalBtn');
  const addModal = document.getElementById('addProductModal');
  const addForm = document.getElementById('addProductForm');

  window.openAddProductModal = () => {
    if (addForm) addForm.reset();
    if (addModal) addModal.classList.add('open');
  };

  if (openAddBtn && addModal) {
    openAddBtn.addEventListener('click', window.openAddProductModal);
  }

  window.closeAddProductModal = () => {
    if (addModal) addModal.classList.remove('open');
  };

  window.toggleProductStock = async (id) => {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    const nextStatus = prod.status === 'In Stock' ? 'Out of Stock' : 'In Stock';
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        prod.status = nextStatus;
        renderAdminProducts(allProducts);
        showToast('Stock Status Updated', `${prod.name} is now ${nextStatus}!`, nextStatus === 'In Stock' ? 'success' : 'warning');
      } else {
        showToast('Update Failed', data.message || 'Failed to update stock.', 'danger');
      }
    } catch (err) {
      console.error('Error toggling product stock:', err);
      showToast('Error', 'Network error updating stock.', 'danger');
    }
  };

  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newProductName').value.trim();
      const category = document.getElementById('newProductCategory').value;
      const price = document.getElementById('newProductPrice').value;
      const status = document.getElementById('newProductStatus') ? document.getElementById('newProductStatus').value : 'In Stock';
      const stockQty = document.getElementById('newProductStockQty') ? document.getElementById('newProductStockQty').value : 100;
      const badge = document.getElementById('newProductBadge') ? document.getElementById('newProductBadge').value.trim() : '';
      const leadTime = document.getElementById('newProductLeadTime') ? document.getElementById('newProductLeadTime').value.trim() : '24 - 48 Hours';
      const material = document.getElementById('newProductMaterial') ? document.getElementById('newProductMaterial').value.trim() : 'Premium Material';
      const desc = document.getElementById('newProductDesc') ? document.getElementById('newProductDesc').value.trim() : '';
      const imagePreset = document.getElementById('newProductImagePreset') ? document.getElementById('newProductImagePreset').value : '';

      try {
        const res = await fetch(`${API_BASE}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            category,
            categoryLabel: getCategoryLabel(category),
            price,
            status,
            stockQty,
            badge,
            leadTime,
            material,
            shortDescription: desc,
            description: desc,
            image: imagePreset
          })
        });

        const data = await res.json();
        if (data.success) {
          closeAddProductModal();
          await loadProducts();
          showToast('Product & Stock Added', `"${name}" added successfully with status: ${status}!`, 'success');
        } else {
          showToast('Add Failed', data.message || 'Failed to add product.', 'danger');
        }
      } catch (err) {
        console.error('Error adding product:', err);
        showToast('Error', 'Network error adding product.', 'danger');
      }
    });
  }

  const editModal = document.getElementById('editProductModal');
  const editForm = document.getElementById('editProductForm');

  window.openEditProductModal = (id) => {
    const prod = allProducts.find(p => p.id === id);
    if (!prod || !editModal) return;

    document.getElementById('editProductId').value = prod.id;
    document.getElementById('editProductName').value = prod.name;
    document.getElementById('editProductPrice').value = prod.price;
    document.getElementById('editProductBadge').value = prod.badge || '';
    document.getElementById('editProductStatus').value = prod.status || 'In Stock';
    document.getElementById('editProductLeadTime').value = prod.leadTime || '';
    document.getElementById('editProductDesc').value = prod.shortDescription || '';

    editModal.classList.add('open');
  };

  window.closeEditProductModal = () => {
    if (editModal) editModal.classList.remove('open');
  };

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editProductId').value;
      const name = document.getElementById('editProductName').value.trim();
      const price = document.getElementById('editProductPrice').value;
      const badge = document.getElementById('editProductBadge').value.trim();
      const status = document.getElementById('editProductStatus').value;
      const leadTime = document.getElementById('editProductLeadTime').value.trim();
      const desc = document.getElementById('editProductDesc').value.trim();

      try {
        const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            price: Number(price),
            badge,
            status,
            leadTime,
            shortDescription: desc
          })
        });

        const data = await res.json();
        if (data.success) {
          closeEditProductModal();
          await loadProducts();
          showToast('Product Updated', `"${name}" updated successfully.`, 'success');
        } else {
          showToast('Update Failed', data.message || 'Update failed.', 'danger');
        }
      } catch (err) {
        console.error('Error updating product:', err);
        showToast('Error', 'Network error updating product.', 'danger');
      }
    });
  }
}

window.deleteProduct = async (id) => {
  if (!confirm(`Are you sure you want to remove this product from the catalog?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      allProducts = allProducts.filter(p => p.id !== id);
      renderAdminProducts(allProducts);
      showToast('Product Removed', 'Product was removed from the catalog.', 'info');
    } else {
      showToast('Delete Failed', data.message || 'Could not delete product.', 'danger');
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    showToast('Error', 'Network error deleting product.', 'danger');
  }
};

function getCategoryLabel(category) {
  switch (category) {
    case 'frames': return 'Glass & Plastic Frames';
    case 'personalized': return 'Personalized Printing';
    case 'office': return 'Office Printing';
    case 'custom': return 'Custom Printing';
    default: return category;
  }
}

/* ==========================================================================
   CONTACT FORM MESSAGES
   ========================================================================== */
async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return;

    allMessages = data.messages || [];
    renderContactMessages(allMessages);
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

function renderContactMessages(messages) {
  const tbody = document.getElementById('contactMessagesTableBody');
  if (!tbody) return;

  if (messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No contact messages yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = messages.map(msg => {
    const dateFormatted = new Date(msg.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });

    const cleanPhone = (msg.phone || '').replace(/\D/g, '');
    const waText = encodeURIComponent(`Hello ${msg.name}, Rajesh Framing here responding to your message regarding ${msg.subject || 'framing inquiry'}.`);

    return `
      <tr>
        <td>
          <strong style="color: var(--text-main); font-size: 0.88rem;">${escapeHtml(msg.name)}</strong>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-muted);">💬 ${escapeHtml(msg.phone)}</span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(msg.email)}</span>
        </td>
        <td>
          <strong style="font-size: 0.82rem; color: var(--text-main);">${escapeHtml(msg.subject || 'General Inquiry')}</strong>
        </td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(msg.message)}">
            ${escapeHtml(msg.message)}
          </div>
        </td>
        <td>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${dateFormatted}</span>
        </td>
        <td style="text-align: center;">
          <div class="table-action-icons">
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn-table-icon chat" title="Reply on WhatsApp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.51.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
              </svg>
            </a>
            <button type="button" class="btn-table-icon delete" onclick="deleteMessage('${msg.id}')" title="Delete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.deleteMessage = async (id) => {
  if (!confirm('Delete this contact message?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      allMessages = allMessages.filter(m => m.id !== id);
      renderContactMessages(allMessages);
    }
  } catch (err) {
    console.error('Error deleting message:', err);
  }
};

/* ==========================================================================
   SETTINGS & SMTP CONFIGURATION
   ========================================================================== */
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success || !data.settings) return;

    const s = data.settings;
    if (s.adminName) {
      const nameEl = document.getElementById('settingAdminName');
      if (nameEl) nameEl.value = s.adminName;
    }
    if (s.adminEmail) {
      const emailEl = document.getElementById('settingAdminEmail');
      if (emailEl) emailEl.value = s.adminEmail;
    }

    if (s.smtp) {
      const srvEl = document.getElementById('settingSmtpService');
      const usrEl = document.getElementById('settingSmtpUser');
      const passEl = document.getElementById('settingSmtpPass');
      const hostEl = document.getElementById('settingSmtpHost');
      const portEl = document.getElementById('settingSmtpPort');
      const customBox = document.getElementById('customSmtpFields');

      if (srvEl) {
        srvEl.value = s.smtp.service || 'gmail';
        if (customBox) customBox.style.display = s.smtp.service === 'custom' ? 'block' : 'none';
      }
      if (usrEl) usrEl.value = s.smtp.user || '';
      if (passEl) {
        passEl.value = '';
        passEl.placeholder = s.smtp.hasPassword ? '•••••••••••••••• (Saved App Password)' : '16-character Gmail App Password';
      }
      if (hostEl) hostEl.value = s.smtp.host || 'smtp.gmail.com';
      if (portEl) portEl.value = s.smtp.port || 465;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

function initSettingsForms() {
  // Toggle Custom SMTP Fields on select change
  const srvSelect = document.getElementById('settingSmtpService');
  if (srvSelect) {
    srvSelect.addEventListener('change', () => {
      const customBox = document.getElementById('customSmtpFields');
      if (customBox) customBox.style.display = srvSelect.value === 'custom' ? 'block' : 'none';
    });
  }

  // Profile Form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('settingAdminName').value.trim();
      const email = document.getElementById('settingAdminEmail').value.trim();
      const currentPassword = document.getElementById('settingCurrentPass').value;
      const newPassword = document.getElementById('settingNewPass').value;
      const confirmPassword = document.getElementById('settingConfirmPass').value;

      if (newPassword && newPassword !== confirmPassword) {
        showToast('Password Mismatch', 'New password and confirmation do not match.', 'danger');
        return;
      }

      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const oldBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating Profile...';
      }

      try {
        const res = await fetch(`${API_BASE}/api/admin/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, email, currentPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Profile Saved', 'Admin profile and credentials updated successfully.', 'success');
          updateAdminProfileUI({ name });
          if (newPassword) {
            document.getElementById('settingCurrentPass').value = '';
            document.getElementById('settingNewPass').value = '';
            document.getElementById('settingConfirmPass').value = '';
          }
        } else {
          showToast('Update Failed', data.message || 'Profile update failed.', 'danger');
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        showToast('Connection Error', 'Could not reach server to update profile.', 'danger');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = oldBtnText;
        }
      }
    });
  }

  // SMTP Gateway Form
  const smtpForm = document.getElementById('settingsSmtpForm');
  if (smtpForm) {
    smtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const service = document.getElementById('settingSmtpService').value;
      const user = document.getElementById('settingSmtpUser').value.trim();
      const pass = document.getElementById('settingSmtpPass').value.trim();
      const hostEl = document.getElementById('settingSmtpHost');
      const portEl = document.getElementById('settingSmtpPort');
      const host = hostEl ? hostEl.value.trim() : '';
      const port = portEl ? portEl.value.trim() : '';

      const submitBtn = smtpForm.querySelector('button[type="submit"]');
      const oldBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Settings...';
      }

      try {
        const res = await fetch(`${API_BASE}/api/admin/settings/smtp`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ service, user, pass, host, port })
        });
        const data = await res.json();
        if (data.success) {
          showToast('SMTP Saved', 'Email gateway settings saved and active!', 'success');
          if (pass) {
            document.getElementById('settingSmtpPass').value = '';
            document.getElementById('settingSmtpPass').placeholder = '•••••••••••••••• (App Password Saved)';
          }
        } else {
          showToast('Save Failed', data.message || 'Failed to save SMTP settings.', 'danger');
        }
      } catch (err) {
        console.error('Error saving SMTP settings:', err);
        showToast('Connection Error', 'Failed to communicate with server.', 'danger');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = oldBtnText;
        }
      }
    });
  }

  // SMTP Test Button
  const testSmtpBtn = document.getElementById('testSmtpBtn');
  if (testSmtpBtn) {
    testSmtpBtn.addEventListener('click', async () => {
      const userEmailInput = document.getElementById('settingSmtpUser');
      const adminEmailInput = document.getElementById('settingAdminEmail');
      const targetEmail = (userEmailInput && userEmailInput.value.trim()) || 
                          (adminEmailInput && adminEmailInput.value.trim()) || 
                          'rajeshframing0@gmail.com';

      testSmtpBtn.disabled = true;
      const originalText = testSmtpBtn.textContent;
      testSmtpBtn.textContent = 'Testing Connection...';

      try {
        const res = await fetch(`${API_BASE}/api/admin/settings/smtp/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            testEmail: targetEmail,
            targetEmail: targetEmail 
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('SMTP Test Passed', data.message || `Test verification email sent to ${targetEmail}!`, 'success');
        } else {
          showToast('SMTP Test Failed', data.message || 'Could not dispatch test email. Check your SMTP App Password.', 'danger');
        }
      } catch (err) {
        console.error('Test SMTP failed:', err);
        showToast('Endpoint Unreachable', 'Could not connect to SMTP server test endpoint. Please check if server is running.', 'danger');
      } finally {
        testSmtpBtn.disabled = false;
        testSmtpBtn.textContent = originalText;
      }
    });
  }
}

/* ==========================================================================
   MODERN GRAPHURA TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(title, message, type = 'info') {
  let container = document.getElementById('adminToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'adminToastContainer';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;

  const iconSvg = (type === 'success')
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : (type === 'danger' || type === 'error')
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : (type === 'warning')
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  toast.innerHTML = `
    <div class="admin-toast-icon">${iconSvg}</div>
    <div class="admin-toast-content">
      <div class="admin-toast-title">${escapeHtml(title)}</div>
      <div class="admin-toast-desc">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="admin-toast-close" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.admin-toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 250);
    });
  }

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 250);
    }
  }, 4500);
}
window.showToast = showToast;

// Utility HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
