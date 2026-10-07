/**
 * RAJESH FRAMING - GRAPHURA SAAS EXECUTIVE DASHBOARD CONTROLLER
 * Architecture: Graphura Studio OS Design System
 * Features: Order Card Rows, Leads Avatar Table, Products Catalog, CSV Export, WhatsApp Connect
 */

const CLOUD_API_FALLBACK = 'https://rajesh-framing.vercel.app';

function resolveApiBase() {
  const isLocalDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.protocol === 'file:';
  if (window.location.protocol === 'file:' || window.location.origin === 'null' || !window.location.origin) {
    return CLOUD_API_FALLBACK;
  }
  if (isLocalDev && window.location.port !== '5000') {
    return 'http://localhost:5000';
  }
  return window.location.origin;
}

let API_BASE = resolveApiBase();

let token = sessionStorage.getItem('rf_admin_token') || localStorage.getItem('rf_admin_token');
if (token) {
  sessionStorage.setItem('rf_admin_token', token);
}
let currentAdminUser = null;
let allInquiries = [];
let allProducts = [];
let allMessages = [];
let allCustomers = [];

/* ==========================================================================
   SIDEBAR NOTIFICATION BADGE CONTROLLER
   - Shows badge count only when there are new unread updates
   - Hides badge completely when section is currently open (active)
   - Marks updates as seen when user opens that section
   ========================================================================== */
let currentActiveView = 'viewOverview';

const STORAGE_SEEN_ORDERS = 'rf_admin_seen_orders';
const STORAGE_SEEN_LEADS = 'rf_admin_seen_leads';
const STORAGE_SEEN_CUSTOMERS = 'rf_admin_seen_customers';

function getSeenIds(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveSeenIds(storageKey, ids) {
  try {
    const trimmed = Array.isArray(ids) ? ids.slice(-500) : [];
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Could not persist seen IDs:', e);
  }
}

function markSectionAsSeen(viewId) {
  if (viewId === 'viewOrders') {
    const orders = (allInquiries || []).filter(i => 
      i && i.id && (i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]')))
    );
    const seen = new Set(getSeenIds(STORAGE_SEEN_ORDERS));
    orders.forEach(o => { if (o.id) seen.add(o.id); });
    saveSeenIds(STORAGE_SEEN_ORDERS, Array.from(seen));
  } else if (viewId === 'viewLeads') {
    const leads = (allInquiries || []).filter(i => 
      i && i.id && !i.id.startsWith('RF-ORD') && (!i.product || !i.product.includes('[ONLINE ORDER]'))
    );
    const seen = new Set(getSeenIds(STORAGE_SEEN_LEADS));
    leads.forEach(l => { if (l.id) seen.add(l.id); });
    saveSeenIds(STORAGE_SEEN_LEADS, Array.from(seen));
  } else if (viewId === 'viewCustomers') {
    const seen = new Set(getSeenIds(STORAGE_SEEN_CUSTOMERS));
    (allCustomers || []).forEach(c => {
      const key = c.id || c.email || c.phone;
      if (key) seen.add(String(key).toLowerCase().trim());
    });
    saveSeenIds(STORAGE_SEEN_CUSTOMERS, Array.from(seen));
  }
}

function updateNotificationBadges() {
  const badgeOrders = document.getElementById('sidebarNewInquiriesBadge');
  const badgeLeads = document.getElementById('sidebarLeadsBadge');
  const badgeCustomers = document.getElementById('sidebarCustomersBadge');
  const headerDot = document.getElementById('headerNotifyDot');

  // If current section is open, mark its contents as seen immediately
  if (currentActiveView) {
    markSectionAsSeen(currentActiveView);
  }

  // 1. ORDERS BADGE
  let unseenOrders = 0;
  if (currentActiveView !== 'viewOrders') {
    const seenOrders = new Set(getSeenIds(STORAGE_SEEN_ORDERS));
    const newOrders = (allInquiries || []).filter(i => 
      i && i.id && 
      (i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]'))) &&
      (i.status === 'New' || i.status === 'Pending')
    );
    unseenOrders = newOrders.filter(o => !seenOrders.has(o.id)).length;
  }
  if (badgeOrders) {
    if (currentActiveView === 'viewOrders' || unseenOrders <= 0) {
      badgeOrders.textContent = '0';
      badgeOrders.style.display = 'none';
    } else {
      badgeOrders.textContent = unseenOrders;
      badgeOrders.style.display = 'inline-block';
    }
  }

  // 2. LEADS BADGE
  let unseenLeads = 0;
  if (currentActiveView !== 'viewLeads') {
    const seenLeads = new Set(getSeenIds(STORAGE_SEEN_LEADS));
    const newLeads = (allInquiries || []).filter(i => 
      i && i.id && 
      !i.id.startsWith('RF-ORD') && 
      (!i.product || !i.product.includes('[ONLINE ORDER]')) &&
      i.status === 'New'
    );
    unseenLeads = newLeads.filter(l => !seenLeads.has(l.id)).length;
  }
  if (badgeLeads) {
    if (currentActiveView === 'viewLeads' || unseenLeads <= 0) {
      badgeLeads.textContent = '0';
      badgeLeads.style.display = 'none';
    } else {
      badgeLeads.textContent = unseenLeads;
      badgeLeads.style.display = 'inline-block';
    }
  }

  // 3. CUSTOMERS BADGE
  let unseenCustomers = 0;
  if (currentActiveView !== 'viewCustomers') {
    const seenCustomers = new Set(getSeenIds(STORAGE_SEEN_CUSTOMERS));
    if (localStorage.getItem(STORAGE_SEEN_CUSTOMERS) !== null) {
      unseenCustomers = (allCustomers || []).filter(c => {
        const key = c.id || c.email || c.phone;
        return key && !seenCustomers.has(String(key).toLowerCase().trim());
      }).length;
    } else {
      unseenCustomers = 0;
    }
  }
  if (badgeCustomers) {
    if (currentActiveView === 'viewCustomers' || unseenCustomers <= 0) {
      badgeCustomers.textContent = '0';
      badgeCustomers.style.display = 'none';
    } else {
      badgeCustomers.textContent = unseenCustomers;
      badgeCustomers.style.display = 'inline-block';
    }
  }

  // 4. HEADER NOTIFICATION DOT
  if (headerDot) {
    const totalUnseen = (currentActiveView !== 'viewOrders' ? unseenOrders : 0) +
                        (currentActiveView !== 'viewLeads' ? unseenLeads : 0) +
                        (currentActiveView !== 'viewCustomers' ? unseenCustomers : 0);
    headerDot.style.display = totalUnseen > 0 ? 'inline-block' : 'none';
  }
}

/* ==========================================================================
   MODAL BACKGROUND SCROLL LOCK CONTROLLER
   - Freezes background page scroll whenever any modal is open
   - Restores background page scroll when all modals are closed
   ========================================================================== */
function syncModalScrollLock() {
  const hasOpenModal = !!document.querySelector('.admin-modal-overlay.open');
  if (hasOpenModal) {
    document.body.classList.add('modal-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  } else {
    document.body.classList.remove('modal-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}

function initModalScrollLock() {
  syncModalScrollLock();
  if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
      syncModalScrollLock();
    });
    document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
      observer.observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
    });
  }

  // Click & ESC key fallbacks
  document.addEventListener('click', () => {
    setTimeout(syncModalScrollLock, 40);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setTimeout(syncModalScrollLock, 40);
    }
  });
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  token = sessionStorage.getItem('rf_admin_token') || localStorage.getItem('rf_admin_token');
  if (!token) {
    handleAuthFailure();
    return;
  }
  sessionStorage.setItem('rf_admin_token', token);

  const authenticated = await verifyAdminSession();
  if (!authenticated) return;

  // Authentication successfully verified! Remove security shield and reveal dashboard
  const shield = document.getElementById('rf-auth-shield');
  if (shield) shield.remove();
  document.documentElement.style.display = '';

  initNavigation();
  initSidebarToggle();
  initThemeToggle();
  initLogout();
  initOrderFiltering();
  initLeadFiltering();
  initCustomerFiltering();
  initProductModals();
  initNewOrderModal();
  initEditOrderModal();
  initCancelOrderModal();
  initSettingsForms();
  initModalScrollLock();

  // Initial Data Load
  await loadDashboardStats();
  await loadInquiries();
  await loadProducts();
  await loadCustomers();
  await loadMessages();
  await loadSettings();

  // Background live update sync (checks every 20 seconds for new orders/inquiries)
  setInterval(async () => {
    if (!token) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/inquiries`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.inquiries)) {
        allInquiries = data.inquiries;
        const orders = allInquiries.filter(i => 
          i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]'))
        );
        const leads = allInquiries.filter(i => 
          !i.id.startsWith('RF-ORD') && (!i.product || !i.product.includes('[ONLINE ORDER]'))
        );
        updateOrdersKPIs(orders);
        updateLeadsKPIs(leads);
        updateNotificationBadges();
      }
      // Also background sync live customer accounts & metrics
      loadCustomers();
      loadDashboardStats();
    } catch (e) {
      // Background sync quiet
    }
  }, 15000);
});

/* ==========================================================================
   AUTHENTICATION & SESSION VERIFICATION
   ========================================================================== */
/**
 * Resilient API fetch wrapper with automatic live cloud fallback
 */
async function apiFetch(urlOrEndpoint, options = {}) {
  const fullUrl = urlOrEndpoint.startsWith('http') ? urlOrEndpoint : `${API_BASE}${urlOrEndpoint}`;
  const headers = Object.assign({
    'Authorization': `Bearer ${token}`
  }, options.headers || {});
  const opts = Object.assign({}, options, { headers });

  try {
    return await fetch(fullUrl, opts);
  } catch (err) {
    if (API_BASE !== CLOUD_API_FALLBACK) {
      console.warn(`Local API request failed (${fullUrl}). Auto-switching API_BASE to cloud fallback: ${CLOUD_API_FALLBACK}`);
      API_BASE = CLOUD_API_FALLBACK;
      const retryUrl = urlOrEndpoint.startsWith('http') 
        ? urlOrEndpoint.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, CLOUD_API_FALLBACK)
        : `${API_BASE}${urlOrEndpoint}`;
      return await fetch(retryUrl, opts);
    }
    throw err;
  }
}

async function verifyAdminSession() {
  try {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (networkErr) {
      if (API_BASE !== CLOUD_API_FALLBACK) {
        console.warn('API at ' + API_BASE + ' unreachable. Falling back to live cloud API: ' + CLOUD_API_FALLBACK);
        API_BASE = CLOUD_API_FALLBACK;
        res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        throw networkErr;
      }
    }

    if (!res || !res.ok) {
      if (API_BASE !== CLOUD_API_FALLBACK) {
        try {
          console.warn('API returned ' + (res ? res.status : 'null') + '. Trying live cloud fallback: ' + CLOUD_API_FALLBACK);
          API_BASE = CLOUD_API_FALLBACK;
          res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (_) {}
      }
    }

    if (!res || !res.ok) {
      handleAuthFailure();
      return false;
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      console.warn('Could not parse auth response JSON:', jsonErr);
      handleAuthFailure();
      return false;
    }

    if (data && data.success && data.admin) {
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
  sessionStorage.removeItem('rf_admin_token');
  sessionStorage.removeItem('rf_admin_user');
  try {
    localStorage.removeItem('rf_admin_token');
    localStorage.removeItem('rf_admin_user');
  } catch (_) {}
  document.documentElement.style.display = 'none';
  const hasHtml = window.location.pathname.endsWith('.html') || window.location.protocol === 'file:';
  window.location.replace(hasHtml ? 'admin-login.html' : 'admin-login');
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('sidebarLogoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to end your administrative session?')) {
      try {
        await apiFetch('/api/auth/logout', {
          method: 'POST'
        });
      } catch (e) {
        console.warn('Logout notification error:', e);
      }
      sessionStorage.removeItem('rf_admin_token');
      sessionStorage.removeItem('rf_admin_user');
      try {
        localStorage.removeItem('rf_admin_token');
        localStorage.removeItem('rf_admin_user');
      } catch (_) {}
      const hasHtml = window.location.pathname.endsWith('.html') || window.location.protocol === 'file:';
      window.location.href = (hasHtml ? 'admin-login.html' : 'admin-login') + '?logout=true';
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
    viewCustomers: 'Customers',
    viewSettings: 'Settings'
  };

  function switchTab(viewId) {
    if (!viewId) return;
    currentActiveView = viewId;

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

    // Mark current section as seen and immediately update notification badges
    markSectionAsSeen(viewId);
    updateNotificationBadges();

    // Close mobile drawer
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }

    // Refresh specific section
    if (viewId === 'viewOverview') loadDashboardStats();
    if (viewId === 'viewOrders' || viewId === 'viewLeads') loadInquiries();
    if (viewId === 'viewCustomers') loadCustomers();
    if (viewId === 'viewProducts') loadProducts();
    if (viewId === 'viewSettings') loadSettings();
  }

  window.switchTab = switchTab;

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetViewId = link.getAttribute('data-view');
      switchTab(targetViewId);
    });
  });

  // Handle URL hash on load
  const hash = (window.location.hash || '').replace('#', '');
  if (hash === 'orders') switchTab('viewOrders');
  else if (hash === 'leads') switchTab('viewLeads');
  else if (hash === 'customers') switchTab('viewCustomers');
  else if (hash === 'products') switchTab('viewProducts');
  else if (hash === 'settings') switchTab('viewSettings');
  else switchTab('viewOverview');
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

    if (kpiNew) kpiNew.textContent = stats.newInquiries || 0;
    if (kpiPipeline) kpiPipeline.textContent = `₹${(stats.totalPipelineValue || 0).toLocaleString('en-IN')}`;

    const kpiCustomers = document.getElementById('kpiTotalCustomers');
    if (kpiCustomers && stats.totalCustomers !== undefined) {
      kpiCustomers.textContent = stats.totalCustomers;
    }

    // Refresh smart notification badges (hides for active/seen sections)
    updateNotificationBadges();

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

  // Refresh smart notification badges
  updateNotificationBadges();
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

  // Refresh smart notification badges
  updateNotificationBadges();
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

function getOrderDeliveryAddress(order) {
  if (order.deliveryAddress && typeof order.deliveryAddress === 'string' && order.deliveryAddress.trim() && !order.deliveryAddress.includes('undefined')) {
    return order.deliveryAddress.trim();
  }
  if (order.customer && typeof order.customer === 'object') {
    const parts = [
      order.customer.address,
      order.customer.city,
      order.customer.state,
      order.customer.pincode ? `(${order.customer.pincode})` : ''
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  if (order.notes && typeof order.notes === 'string') {
    const fullMatch = order.notes.match(/full\s*address:\s*(.+)$/im);
    if (fullMatch && fullMatch[1] && fullMatch[1].trim()) {
      return fullMatch[1].trim();
    }
  }
  if (order.specs && typeof order.specs === 'string') {
    const delMatch = order.specs.match(/deliver\s*to:\s*([^•\n\r]+)/i);
    if (delMatch && delMatch[1] && delMatch[1].trim()) {
      return delMatch[1].trim();
    }
  }
  if (order.specs && order.specs.includes('Deliver to:')) {
    return 'Doorstep Delivery';
  }
  return 'Studio Pickup / Counter';
}

function getOrderCustomerNote(order) {
  let raw = (order.notes || '').trim();
  if (!raw || raw.toLowerCase() === 'none' || raw.toLowerCase() === 'standard studio packaging') {
    return '';
  }
  // If note contains "Full address:", extract only the genuine customer instruction preceding it
  if (raw.toLowerCase().includes('full address:')) {
    const notePart = raw.replace(/full\s*address:\s*.*$/i, '').trim();
    const cleaned = notePart.replace(/^order\s*notes:\s*/i, '').trim().replace(/\.+$/, '');
    if (cleaned && cleaned.toLowerCase() !== 'none' && cleaned.toLowerCase() !== 'standard studio packaging') {
      return cleaned;
    }
    return '';
  }
  return raw.replace(/^order\s*notes:\s*/i, '').trim();
}

function getOrderCustomerPhoto(order) {
  if (order.customerPhotoUrl && typeof order.customerPhotoUrl === 'string') {
    return { url: order.customerPhotoUrl, name: order.customerPhotoName || 'Customer Photo' };
  }
  if (order.uploadedFileUrl && typeof order.uploadedFileUrl === 'string') {
    return { url: order.uploadedFileUrl, name: order.uploadFileName || order.uploadedFileName || 'Customer Photo' };
  }
  if (order.uploadedPhoto && order.uploadedPhoto.fileUrl) {
    return { url: order.uploadedPhoto.fileUrl, name: order.uploadedPhoto.fileName || 'Customer Photo' };
  }
  if (order.orderPhoto && order.orderPhoto.fileUrl) {
    return { url: order.orderPhoto.fileUrl, name: order.orderPhoto.fileName || 'Customer Photo' };
  }
  if (Array.isArray(order.items)) {
    const it = order.items.find(i => i && i.uploadedPhoto && (i.uploadedPhoto.fileUrl || typeof i.uploadedPhoto === 'string'));
    if (it) {
      return {
        url: it.uploadedPhoto.fileUrl || it.uploadedPhoto,
        name: it.uploadedPhoto.fileName || it.uploadedPhoto.originalName || 'Customer Photo'
      };
    }
  }
  if (order.hasUpload && order.uploadFileName) {
    if (order.uploadFileName.startsWith('http') || order.uploadFileName.startsWith('assets/') || order.uploadFileName.startsWith('/')) {
      return { url: order.uploadFileName, name: order.uploadFileName.split('/').pop() };
    }
    return { url: `assets/images/uploads/${order.uploadFileName}`, name: order.uploadFileName };
  }
  return null;
}

window.openCustomerPhotoModal = (photoUrl, orderId, customerName, fileName) => {
  const modal = document.getElementById('viewCustomerPhotoModal');
  const img = document.getElementById('photoModalImg');
  const orderIdEl = document.getElementById('photoModalOrderId');
  const nameEl = document.getElementById('photoModalCustName');
  const fileEl = document.getElementById('photoModalFileName');
  const openTab = document.getElementById('photoModalOpenTab');

  if (img) img.src = photoUrl;
  if (orderIdEl) orderIdEl.textContent = `#${orderId}`;
  if (nameEl) nameEl.textContent = customerName || 'Customer';
  if (fileEl) fileEl.textContent = fileName || 'Customer Uploaded Photo';
  if (openTab) openTab.href = photoUrl;

  if (modal) modal.classList.add('open');
};

window.closeCustomerPhotoModal = () => {
  const modal = document.getElementById('viewCustomerPhotoModal');
  if (modal) modal.classList.remove('open');
};

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
  const isOnlinePayment = (order.specs && order.specs.toLowerCase().includes('instant upi')) || (order.paymentMethod && order.paymentMethod.toLowerCase().includes('upi')) || false;
  const paymentStatus = isOnlinePayment ? 'Paid' : (order.status === 'Completed' ? 'Paid' : 'Pending');
  const paymentClass = paymentStatus.toLowerCase();
  const paymentMethod = isOnlinePayment ? 'Online UPI' : 'Pay on Delivery';

  const deliveryClass = order.status.toLowerCase().replace(/\s+/g, '-');
  const trackingText = order.specs && order.specs.includes('Deliver to:') 
    ? 'Doorstep Delivery' 
    : 'Studio Pickup';

  const deliveryAddress = getOrderDeliveryAddress(order);
  const custPhoto = getOrderCustomerPhoto(order);
  const userNote = getOrderCustomerNote(order);

  const noteText = userNote || (order.notes && !order.notes.includes('None') ? order.notes : 'Standard Studio Packaging');

  const waText = encodeURIComponent(`Hello ${order.name}, Rajesh Framing here regarding your Order #${order.id} for ${cleanTitle}. Total: ₹${order.estimatedValue}.`);

  const custEmail = order.customerEmail || (order.customer && order.customer.email) || (order.email && order.email.includes('@') ? order.email : '');

  // Extract selected frame size and finish/color
  let itemSize = '';
  let itemFinish = '';
  let extraItemsCount = 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    const firstItem = order.items[0];
    if (firstItem.size && firstItem.size.toLowerCase() !== 'standard') {
      itemSize = firstItem.size;
    }
    if (firstItem.finish && firstItem.finish.toLowerCase() !== 'standard') {
      itemFinish = firstItem.finish;
    }
    extraItemsCount = order.items.length - 1;
  } else if (order.specs) {
    const sizeMatch = order.specs.match(/(\d+[\s"x×]+[\d"'\s]+|[A-Za-z0-9]+\s*(?:Classic|Large|Small|Medium|Square|Mini|Portrait|Landscape))/i);
    if (sizeMatch) itemSize = sizeMatch[1].trim();
    const finishMatch = order.specs.match(/(?:in|with|finish|color|standoffs|black|gold|wood|white|silver)[\s:]*([^,•\n\r]+)/i);
    if (finishMatch) itemFinish = finishMatch[1].trim();
  }

  return `
    <div class="order-card-row" id="orderRow_${escapeHtml(order.id)}">
      <div class="order-card-body">
        <!-- 1. Thumbnail -->
        <div class="order-thumb-wrap" title="${escapeHtml(cleanTitle)}" onclick="openOrderDetailsModal('${escapeHtml(order.id)}')">
          <img src="${thumb}" alt="${escapeHtml(cleanTitle)}" class="order-thumb-img" onerror="this.src='assets/images/glass_frame.jpg'" />
        </div>

        <!-- 2. Order ID & Date -->
        <div class="order-col-info order-col-id">
          <span class="order-id-num" onclick="openOrderDetailsModal('${escapeHtml(order.id)}')" title="Click to view complete order sheet">#${escapeHtml(order.id)}</span>
          <span class="order-timestamp">${dateFormatted}</span>
        </div>

        <!-- 3. Customer -->
        <div class="order-col-info order-col-cust">
          <span class="col-field-label">Customer</span>
          <span class="cust-name-text" title="${escapeHtml(order.name)}">${escapeHtml(order.name)}</span>
          <span class="cust-phone-text">
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" title="Chat on WhatsApp">💬 ${escapeHtml(order.phone)}</a>
          </span>
          ${custEmail ? `<span class="cust-email-text" title="${escapeHtml(custEmail)}">✉️ ${escapeHtml(custEmail)}</span>` : ''}
        </div>

        <!-- 4. Product -->
        <div class="order-col-info order-col-prod">
          <span class="col-field-label">Product</span>
          <span class="prod-name-text" title="${escapeHtml(cleanTitle)}">${escapeHtml(cleanTitle)}</span>
          <div class="order-prod-specs-tags">
            <span class="prod-qty-text">Qty: ${order.quantity || 1}</span>
            ${itemSize ? `<span class="prod-spec-chip size" title="Customer Selected Size">📏 ${escapeHtml(itemSize)}</span>` : ''}
            ${itemFinish ? `<span class="prod-spec-chip finish" title="Customer Selected Frame Color / Finish">🎨 ${escapeHtml(itemFinish)}</span>` : ''}
            ${extraItemsCount > 0 ? `<span class="prod-extra-chip" onclick="openOrderDetailsModal('${escapeHtml(order.id)}')" title="Click to view all items">+${extraItemsCount} more</span>` : ''}
          </div>
        </div>

        <!-- 5. Customer Photo (Dedicated Column) -->
        <div class="order-col-info order-col-photo">
          <span class="col-field-label">Customer Photo</span>
          ${custPhoto ? `
            <div class="cust-photo-preview-box" onclick="openCustomerPhotoModal('${escapeHtml(custPhoto.url)}', '${escapeHtml(order.id)}', '${escapeHtml(order.name)}', '${escapeHtml(custPhoto.name)}')" title="Click to view customer photo">
              <img src="${escapeHtml(custPhoto.url)}" alt="${escapeHtml(custPhoto.name)}" class="cust-photo-mini-img" onerror="this.onerror=null; this.src='assets/images/custom_canvas.jpg';" />
              <span class="cust-photo-hover-tag">🔍</span>
            </div>
            <span class="photo-attached-tag" title="Photo Attached">
              <span class="photo-dot"></span> Attached
            </span>
          ` : `
            <div class="cust-photo-none-box" title="Standard product (No photo uploaded)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <span>No Photo</span>
            </div>
            <span class="photo-none-tag">Standard</span>
          `}
        </div>

        <!-- 6. Deliver To (Dedicated Column) -->
        <div class="order-col-info order-col-delivery">
          <span class="col-field-label">Deliver To</span>
          <div class="order-delivery-address" title="${escapeHtml(deliveryAddress)}">
            <span class="delivery-pin-icon">📍</span>
            <span class="delivery-address-text" title="${escapeHtml(deliveryAddress)}">${escapeHtml(deliveryAddress)}</span>
          </div>
          <span class="delivery-type-tag">${trackingText}</span>
        </div>

        <!-- 7. Payment Status -->
        <div class="order-col-info order-col-payment">
          <span class="col-field-label">Payment</span>
          <span class="status-pill ${paymentClass}">
            <span class="status-dot"></span>
            ${paymentStatus}
          </span>
          <span class="sub-meta-text">${paymentMethod}</span>
        </div>

        <!-- 8. Delivery Status -->
        <div class="order-col-info order-col-status">
          <span class="col-field-label">Delivery Status</span>
          <span class="status-pill ${deliveryClass}">
            <span class="status-dot"></span>
            ${order.status}
          </span>
          <span class="sub-meta-text">${trackingText}</span>
        </div>

        <!-- 9. Amount (Right Aligned, Guaranteed No Cutoff) -->
        <div class="order-col-info order-col-amount">
          <span class="col-field-label" style="text-align: right;">Amount</span>
          <span class="order-amount-text">₹${Number(order.estimatedValue || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Order Footer Bar -->
      <div class="order-card-footer">
        <div class="order-note-block" title="${escapeHtml(noteText)}">
          <span class="order-note-icon">📝</span>
          <span class="order-note-label">ORDER NOTE:</span>
          <span class="order-note-content">${escapeHtml(noteText)}</span>
        </div>
        <div class="order-action-buttons">
          <!-- Direct Status Switcher -->
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

          <!-- View Details Action Button -->
          <button type="button" class="btn-card-action details" onclick="openOrderDetailsModal('${order.id}')" title="View complete order specifications & customer choices">
            👁️ View Details
          </button>

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
   FULL ORDER DETAILS & SPECIFICATIONS MODAL CONTROLLER
   ========================================================================== */
let currentViewingOrder = null;

window.openOrderDetailsModal = (orderId) => {
  const order = allInquiries.find(i => i.id === orderId);
  if (!order) return;

  const modal = document.getElementById('orderDetailsModal');
  const idEl = document.getElementById('orderDetailModalId');
  const badgeEl = document.getElementById('orderDetailModalStatusBadge');
  const bodyEl = document.getElementById('orderDetailsModalBody');
  const waBtn = document.getElementById('orderDetailModalWaBtn');
  if (!modal || !bodyEl) return;

  currentViewingOrder = order;

  if (idEl) idEl.textContent = `#${order.id}`;

  const statusClass = (order.status || 'New').toLowerCase().replace(/\s+/g, '-');
  if (badgeEl) {
    badgeEl.className = `status-pill ${statusClass}`;
    badgeEl.innerHTML = `<span class="status-dot"></span> ${escapeHtml(order.status || 'New')}`;
  }

  const cleanPhone = (order.phone || '').replace(/\D/g, '');
  const deliveryAddress = getOrderDeliveryAddress(order);
  const custPhoto = getOrderCustomerPhoto(order);
  const custEmail = order.customerEmail || (order.customer && order.customer.email) || (order.email && order.email.includes('@') ? order.email : 'Not provided');
  const paymentMethod = order.paymentMethod || (order.specs && order.specs.includes('Instant UPI') ? 'Instant UPI Payment (QR Code)' : 'Pay on Delivery / COD');
  const upiUtr = order.upiUtr || (order.specs && order.specs.match(/UTR:\s*([^\]]+)/) ? order.specs.match(/UTR:\s*([^\]]+)/)[1] : null);
  const trackingMode = (order.specs && order.specs.includes('Deliver to:')) || deliveryAddress.length > 5 ? 'Doorstep Delivery' : 'Studio Pickup';

  const dateObj = new Date(order.createdAt);
  const dateFormatted = isNaN(dateObj) ? 'Recent' : dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const waText = encodeURIComponent(`Hello ${order.name}, Rajesh Framing here regarding your Order #${order.id} for ${order.product}. Status: ${order.status}. Total: ₹${order.estimatedValue}.`);
  if (waBtn) waBtn.href = `https://wa.me/${cleanPhone}?text=${waText}`;

  // Structured items list
  let items = Array.isArray(order.items) && order.items.length ? order.items : [];
  if (!items.length) {
    let size = 'Standard';
    let finish = 'Standard';
    if (order.specs) {
      const sm = order.specs.match(/(\d+[\s"x×]+[\d"'\s]+|[A-Za-z0-9]+\s*(?:Classic|Large|Small|Medium|Square|Mini|Portrait|Landscape))/i);
      if (sm) size = sm[1].trim();
      const fm = order.specs.match(/(?:in|with|finish|color|standoffs|black|gold|wood|white|silver)[\s:]*([^,•\n\r]+)/i);
      if (fm) finish = fm[1].trim();
    }
    items = [{
      name: (order.product || 'Photo Frame').replace('[ONLINE ORDER]', '').trim(),
      quantity: order.quantity || 1,
      size: order.size || size,
      finish: order.finish || finish,
      price: order.estimatedValue || 0,
      lineTotal: order.estimatedValue || 0,
      image: getProductThumbnail(order.product),
      uploadedPhoto: custPhoto ? { fileUrl: custPhoto.url, fileName: custPhoto.name } : null
    }];
  }

  const itemsRowsHTML = items.map(it => {
    const itemImg = it.image || getProductThumbnail(it.name);
    const itemPhoto = it.uploadedPhoto ? (it.uploadedPhoto.fileUrl || it.uploadedPhoto) : (custPhoto ? custPhoto.url : null);
    const itemPhotoName = it.uploadedPhoto ? (it.uploadedPhoto.fileName || it.uploadedPhoto.originalName || 'Customer Photo') : (custPhoto ? custPhoto.name : null);
    const itemSize = it.size || 'Standard';
    const itemFinish = it.finish || 'Standard';
    const lineTotal = Number(it.lineTotal || (it.price * it.quantity) || 0).toLocaleString('en-IN');

    return `
      <tr class="order-detail-item-row">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${itemImg}" alt="${escapeHtml(it.name)}" class="order-detail-item-thumb" onerror="this.src='assets/images/glass_frame.jpg'" />
            <div>
              <div style="font-weight: 700; color: var(--text-main); font-size: 0.88rem;">${escapeHtml(it.name)}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Item ID: ${escapeHtml(it.id || 'std')}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="order-detail-spec-badge size">📏 ${escapeHtml(itemSize)}</span>
        </td>
        <td>
          <span class="order-detail-spec-badge finish">🎨 ${escapeHtml(itemFinish)}</span>
        </td>
        <td>
          ${itemPhoto ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="${escapeHtml(itemPhoto)}" alt="Photo" class="order-detail-photo-mini" onclick="openCustomerPhotoModal('${escapeHtml(itemPhoto)}', '${escapeHtml(order.id)}', '${escapeHtml(order.name)}', '${escapeHtml(itemPhotoName)}')" title="Click to view full photo" />
              <button type="button" class="btn-detail-view-photo" onclick="openCustomerPhotoModal('${escapeHtml(itemPhoto)}', '${escapeHtml(order.id)}', '${escapeHtml(order.name)}', '${escapeHtml(itemPhotoName)}')">🔍 View</button>
            </div>
          ` : `
            <span style="font-size: 0.72rem; color: var(--text-muted);">No Custom Photo</span>
          `}
        </td>
        <td style="text-align: center; font-weight: 600;">${it.quantity || 1}</td>
        <td style="text-align: right; font-weight: 600;">₹${Number(it.price || 0).toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: 800; color: var(--primary);">₹${lineTotal}</td>
      </tr>
    `;
  }).join('');

  const subtotalVal = Number(order.subtotal || order.estimatedValue || 0).toLocaleString('en-IN');
  const totalVal = Number(order.total || order.estimatedValue || 0).toLocaleString('en-IN');

  bodyEl.innerHTML = `
    <!-- Top 3 Info Cards -->
    <div class="order-detail-cards-grid">
      <!-- 1. Customer & Contact -->
      <div class="order-detail-card">
        <div class="order-detail-card-title">👤 CUSTOMER &amp; CONTACT</div>
        <div class="order-detail-card-name">${escapeHtml(order.name)}</div>
        <div class="order-detail-card-row">
          <span>📞 Phone:</span>
          <a href="tel:${cleanPhone}" style="color: var(--primary); text-decoration: none; font-weight: 600;">${escapeHtml(order.phone)}</a>
          <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="order-detail-wa-link" title="Open WhatsApp Chat">💬 Chat</a>
        </div>
        <div class="order-detail-card-row">
          <span>✉️ Email:</span>
          <a href="mailto:${escapeHtml(custEmail)}" style="color: var(--text-secondary); text-decoration: none;">${escapeHtml(custEmail)}</a>
        </div>
        <div class="order-detail-card-row" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
          <span>🕒 Ordered:</span> <span>${dateFormatted}</span>
        </div>
      </div>

      <!-- 2. Delivery & Destination -->
      <div class="order-detail-card">
        <div class="order-detail-card-title">📍 DELIVERY &amp; DESTINATION</div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span class="order-detail-delivery-pill">${trackingMode === 'Doorstep Delivery' ? '🚚 Deliver to Doorstep' : '🏢 Studio Counter Pickup'}</span>
        </div>
        <div class="order-detail-card-address">${escapeHtml(deliveryAddress)}</div>
      </div>

      <!-- 3. Payment & Settlement -->
      <div class="order-detail-card">
        <div class="order-detail-card-title">💳 PAYMENT &amp; SETTLEMENT</div>
        <div class="order-detail-card-row">
          <span>Method:</span>
          <strong>${escapeHtml(paymentMethod)}</strong>
        </div>
        <div class="order-detail-card-row">
          <span>Status:</span>
          <span class="status-pill ${order.status === 'Completed' || paymentMethod.includes('UPI') ? 'paid' : 'pending'}" style="font-size: 0.68rem; padding: 2px 7px;">
            <span class="status-dot"></span> ${paymentMethod.includes('UPI') ? 'Paid Online' : 'Pending (Pay on Delivery)'}
          </span>
        </div>
        ${upiUtr ? `
          <div class="order-detail-card-row">
            <span>UTR / Ref:</span>
            <code style="background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(upiUtr)}</code>
          </div>
        ` : ''}
        <div class="order-detail-card-row" style="margin-top: 4px; border-top: 1px dashed var(--border-subtle); padding-top: 4px;">
          <span>Total Value:</span>
          <strong style="color: var(--primary); font-size: 1.1rem;">₹${totalVal}</strong>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div style="margin-top: 20px;">
      <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px;">
        📦 ORDERED PRODUCTS &amp; CUSTOM SPECIFICATIONS (${items.length} item${items.length > 1 ? 's' : ''})
      </div>
      <div class="order-detail-table-wrap">
        <table class="order-detail-table">
          <thead>
            <tr>
              <th>Product Ordered</th>
              <th>Selected Size</th>
              <th>Frame Color / Finish</th>
              <th>Customer Photo</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHTML}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Notes Callout -->
    ${order.notes && order.notes.trim() && !order.notes.toLowerCase().includes('none') ? `
      <div class="order-detail-note-box">
        <span style="font-size: 1.1rem; flex-shrink: 0;">📝</span>
        <div>
          <strong style="color: var(--primary); font-size: 0.75rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Customer Special Instructions / Notes:</strong>
          <span style="font-size: 0.84rem; color: var(--text-main);">${escapeHtml(order.notes)}</span>
        </div>
      </div>
    ` : ''}

    <!-- Financial Breakdown -->
    <div class="order-detail-summary-grid">
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: var(--text-muted);">
        <div>✓ Museum Archival Grade Quality Framing</div>
        <div>✓ 12-Color HD Custom Printing Included</div>
        <div>✓ GST &amp; Taxes Included</div>
      </div>
      <div class="order-detail-totals-box">
        <div class="order-detail-total-line">
          <span>Items Subtotal:</span>
          <span>₹${subtotalVal}</span>
        </div>
        <div class="order-detail-total-line">
          <span>Shipping &amp; Transit Packaging:</span>
          <span style="color: #10B981; font-weight: 700;">FREE</span>
        </div>
        <div class="order-detail-total-line grand-total">
          <span>Grand Total:</span>
          <span>₹${totalVal}</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
};

window.closeOrderDetailsModal = () => {
  const modal = document.getElementById('orderDetailsModal');
  if (modal) modal.classList.remove('open');
};

window.printCurrentOrderReceipt = () => {
  if (!currentViewingOrder) return;
  const order = currentViewingOrder;
  const deliveryAddress = getOrderDeliveryAddress(order);
  const custEmail = order.customerEmail || (order.customer && order.customer.email) || order.email || 'N/A';
  const paymentMethod = order.paymentMethod || (order.specs && order.specs.includes('Instant UPI') ? 'Instant UPI Payment (QR Code)' : 'Pay on Delivery / COD');
  const upiUtr = order.upiUtr || '';
  
  let items = Array.isArray(order.items) && order.items.length ? order.items : [];
  if (!items.length) {
    items = [{
      name: (order.product || 'Photo Frame').replace('[ONLINE ORDER]', '').trim(),
      quantity: order.quantity || 1,
      size: order.size || 'Standard',
      finish: order.finish || 'Standard',
      price: order.estimatedValue || 0,
      lineTotal: order.estimatedValue || 0
    }];
  }

  const itemsHtml = items.map((it, idx) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
        <strong>${escapeHtml(it.name)}</strong>
        <div style="font-size: 11px; color: #64748b;">Size: ${escapeHtml(it.size || 'Standard')} | Finish: ${escapeHtml(it.finish || 'Standard')}</div>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity || 1}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${Number(it.price || 0).toLocaleString('en-IN')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${Number(it.lineTotal || (it.price * it.quantity) || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order Receipt #${escapeHtml(order.id)} - Rajesh Framing</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 32px; margin: 0; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #C99A3D; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .brand span { color: #C99A3D; }
        .order-meta { text-align: right; font-size: 13px; color: #475569; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; }
        .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1; }
        .total-box { margin-left: auto; width: 280px; font-size: 13px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .grand-total { border-top: 2px solid #0f172a; padding-top: 8px; font-size: 16px; font-weight: 800; color: #C99A3D; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">RAJESH <span>FRAMING</span></div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Custom Framing &amp; Archival Printing Studio</div>
          <div style="font-size: 11px; color: #94a3b8;">Near Railway Station, Dahej / Bharuch, Gujarat • Tel: +91 96015 74966</div>
        </div>
        <div class="order-meta">
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">#${escapeHtml(order.id)}</div>
          <div>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div>Status: <strong>${escapeHtml(order.status)}</strong></div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">CUSTOMER DETAILS</div>
          <div style="font-weight: 700; font-size: 14px;">${escapeHtml(order.name)}</div>
          <div>Phone: ${escapeHtml(order.phone)}</div>
          <div>Email: ${escapeHtml(custEmail)}</div>
        </div>
        <div class="card">
          <div class="card-title">DELIVERY &amp; PAYMENT</div>
          <div><strong>Deliver to:</strong> ${escapeHtml(deliveryAddress)}</div>
          <div style="margin-top: 4px;"><strong>Payment:</strong> ${escapeHtml(paymentMethod)} ${upiUtr ? '[UTR: ' + escapeHtml(upiUtr) + ']' : ''}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Item &amp; Specifications</th>
            <th style="text-align: center; width: 60px;">Qty</th>
            <th style="text-align: right; width: 90px;">Rate</th>
            <th style="text-align: right; width: 100px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-row">
          <span>Items Total:</span>
          <span>₹${Number(order.subtotal || order.estimatedValue || 0).toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row">
          <span>Shipping:</span>
          <span>FREE</span>
        </div>
        <div class="total-row grand-total">
          <span>Total Payable:</span>
          <span>₹${Number(order.total || order.estimatedValue || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${order.notes && order.notes.trim() ? `
        <div style="margin-top: 20px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 12px;">
          <strong>Order Notes:</strong> ${escapeHtml(order.notes)}
        </div>
      ` : ''}

      <div class="footer">
        Thank you for choosing Rajesh Framing Studio! For inquiries or re-prints, WhatsApp us at +91 96015 74966.
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

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
              <span class="lead-cust-email">${escapeHtml(lead.email || 'No email provided')}</span>
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
          <strong style="font-size: 0.82rem; color: var(--text-main); display: block;">${escapeHtml(lead.specs || 'Website Inquiry')}</strong>
          <span class="status-pill ${lead.status === 'Completed' ? 'completed' : (lead.status === 'In Progress' ? 'processing' : 'active')}" style="font-size: 0.68rem; padding: 1px 6px; margin-top: 2px;">${escapeHtml(lead.status || 'New')}</span>
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
   UNIVERSAL CSV EXPORT ENGINE (ALL ADMIN PAGES)
   ========================================================================== */

/**
 * Robust RFC-4180 CSV Downloader with UTF-8 BOM for Microsoft Excel / Google Sheets
 */
function downloadCSV(filename, headers, rows) {
  const formatCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    headers.map(h => formatCell(h)).join(','),
    ...rows.map(row => row.map(c => formatCell(c)).join(','))
  ];

  const csvContent = csvRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function formatCSVDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 1. EXPORT ORDERS TO CSV (Orders Management & Dashboard)
 * Includes all customer choices: size, color/finish, email, address, photo, payment details
 */
window.exportOrdersToCSV = () => {
  if (!allInquiries || allInquiries.length === 0) {
    showToast('Export Alert', 'No order data available to export.', 'warning');
    return;
  }

  const orders = allInquiries.filter(i => 
    i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]'))
  );
  const exportList = orders.length > 0 ? orders : allInquiries;

  const headers = [
    'Order ID',
    'Date & Time',
    'Customer Name',
    'Phone',
    'Email',
    'Delivery Address',
    'Delivery Mode',
    'Product Name',
    'Selected Size',
    'Frame Color / Finish',
    'Quantity',
    'Customer Photo Attached',
    'Customer Photo URL',
    'Payment Method',
    'Payment Status',
    'UPI UTR / Ref',
    'Subtotal (INR)',
    'Shipping (INR)',
    'Total Amount (INR)',
    'Fulfillment Status',
    'Order Notes'
  ];

  const rows = exportList.map(order => {
    const cleanPhone = (order.phone || (order.customer && order.customer.phone) || '').replace(/\D/g, '');
    const custEmail = order.customerEmail || (order.customer && order.customer.email) || (order.email && order.email.includes('@') ? order.email : '');
    const deliveryAddress = getOrderDeliveryAddress(order);
    const trackingMode = (order.specs && order.specs.includes('Counter Pickup')) ? 'Studio Counter Pickup' : 'Doorstep Delivery';
    const custPhoto = getOrderCustomerPhoto(order);

    let itemSize = 'Standard';
    let itemFinish = 'Standard';
    let prodTitle = (order.product || 'Photo Frame').replace('[ONLINE ORDER]', '').trim();

    if (Array.isArray(order.items) && order.items.length > 0) {
      const first = order.items[0];
      if (first.name) prodTitle = first.name;
      if (first.size) itemSize = first.size;
      if (first.finish) itemFinish = first.finish;
    } else if (order.specs) {
      const sizeMatch = order.specs.match(/(\d+[\s"x×]+[\d"'\s]+|[A-Za-z0-9]+\s*(?:Classic|Large|Small|Medium|Square|Mini|Portrait|Landscape))/i);
      if (sizeMatch) itemSize = sizeMatch[1].trim();
      const finishMatch = order.specs.match(/(?:in|with|finish|color|standoffs|black|gold|wood|white|silver)[\s:]*([^,•\n\r]+)/i);
      if (finishMatch) itemFinish = finishMatch[1].trim();
    }

    const paymentMethod = order.paymentMethod || (order.specs && order.specs.includes('Instant UPI') ? 'Instant UPI Payment (QR Code)' : 'Pay on Delivery / COD');
    const paymentStatus = order.status === 'Completed' || paymentMethod.includes('UPI') ? 'Paid Online' : 'Pending (Pay on Delivery)';
    const upiUtr = order.upiUtr || '';
    const subtotal = Number(order.subtotal || order.estimatedValue || 0);
    const total = Number(order.total || order.estimatedValue || 0);
    const shipping = Number(order.shipping || 0);

    return [
      order.id,
      formatCSVDate(order.createdAt),
      order.name || (order.customer && order.customer.name) || '',
      cleanPhone || order.phone || '',
      custEmail,
      deliveryAddress,
      trackingMode,
      prodTitle,
      itemSize,
      itemFinish,
      order.quantity || 1,
      custPhoto ? 'Yes' : 'No',
      custPhoto ? custPhoto.url : '',
      paymentMethod,
      paymentStatus,
      upiUtr,
      subtotal,
      shipping,
      total,
      order.status || 'New',
      order.notes || ''
    ];
  });

  const today = new Date().toISOString().slice(0, 10);
  downloadCSV(`Rajesh_Framing_Orders_${today}.csv`, headers, rows);
  showToast('Orders Exported', `Successfully exported ${exportList.length} orders.`, 'success');
};

/**
 * 2. EXPORT LEADS TO CSV (Leads & Inquiries View)
 */
window.exportLeadsToCSV = () => {
  if (!allInquiries || allInquiries.length === 0) {
    showToast('Export Alert', 'No lead inquiry data available to export.', 'warning');
    return;
  }

  const leads = allInquiries.filter(i => 
    !i.id.startsWith('RF-ORD') && (!i.product || !i.product.includes('[ONLINE ORDER]'))
  );
  const exportList = leads.length > 0 ? leads : allInquiries;

  const headers = [
    'Lead ID',
    'Date & Time',
    'Customer Name',
    'Phone',
    'Email',
    'Inquiry Type',
    'Specifications & Requirements',
    'Lead Status',
    'Photo Attached',
    'Photo URL',
    'Notes / Details'
  ];

  const rows = exportList.map(lead => {
    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    const inquiryType = lead.hasUpload ? 'Custom Frame Inquiry' : (lead.product || 'Product Inquiry');
    const photo = getOrderCustomerPhoto(lead);

    return [
      lead.id,
      formatCSVDate(lead.createdAt),
      lead.name || '',
      cleanPhone || lead.phone || '',
      lead.email || '',
      inquiryType,
      lead.specs || '',
      lead.status || 'New',
      photo ? 'Yes' : 'No',
      photo ? photo.url : '',
      lead.notes || ''
    ];
  });

  const today = new Date().toISOString().slice(0, 10);
  downloadCSV(`Rajesh_Framing_Leads_${today}.csv`, headers, rows);
  showToast('Leads Exported', `Successfully exported ${exportList.length} leads.`, 'success');
};

/**
 * 3. EXPORT PRODUCTS TO CSV (Products & Pricing View)
 */
window.exportProductsToCSV = async () => {
  try {
    let prods = allProducts;
    if (!prods || prods.length === 0) {
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.products) {
        prods = data.products;
        allProducts = prods;
      }
    }

    if (!prods || prods.length === 0) {
      showToast('Export Alert', 'No products available in catalog to export.', 'warning');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'Category',
      'Base Price (INR)',
      'Compare Price (INR)',
      'Stock Status',
      'Customer Rating',
      'Review Count',
      'Marketing Badge',
      'Production Lead Time',
      'Short Description',
      'Product Image URL'
    ];

    const rows = prods.map(p => [
      p.id,
      p.name || '',
      p.categoryLabel || p.category || '',
      Number(p.price || 0),
      Number(p.comparePrice || p.originalPrice || 0),
      p.status || 'In Stock',
      p.rating || 5,
      p.reviewCount || p.reviews || 0,
      p.badge || '',
      p.leadTime || '24 - 48 Hours',
      p.description || '',
      p.image || ''
    ]);

    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`Rajesh_Framing_Products_${today}.csv`, headers, rows);
    showToast('Products Exported', `Successfully exported ${prods.length} products.`, 'success');
  } catch (err) {
    console.error('Error exporting products:', err);
    showToast('Export Error', 'Could not export products catalog.', 'danger');
  }
};

/**
 * 4. EXPORT CUSTOMERS TO CSV (Customers Accounts View)
 */
window.exportCustomersToCSV = async () => {
  try {
    let custs = allCustomers;
    if (!custs || custs.length === 0) {
      const res = await fetch(`${API_BASE}/api/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.customers) {
        custs = data.customers;
        allCustomers = custs;
      }
    }

    if (!custs || custs.length === 0) {
      showToast('Export Alert', 'No customer records available to export.', 'warning');
      return;
    }

    const headers = [
      'Customer ID',
      'Customer Name',
      'Phone',
      'Email',
      'Delivery Address',
      'City',
      'Pincode',
      'Registered Date',
      'Last Login Date',
      'Login Count',
      'Total Orders Placed',
      'Total Lifetime Spent (INR)',
      'Account Status'
    ];

    const rows = custs.map(c => [
      c.id || c.phone || '',
      c.name || 'Registered Customer',
      c.phone || '',
      c.email || '',
      c.address || '',
      c.city || '',
      c.pincode || '',
      formatCSVDate(c.registeredAt || c.createdAt),
      formatCSVDate(c.lastLoginAt),
      Number(c.loginCount || 1),
      Number(c.totalOrders || 0),
      Number(c.totalSpent || 0),
      c.isVerified !== false ? 'Verified (Active)' : 'Unverified'
    ]);

    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`Rajesh_Framing_Customers_${today}.csv`, headers, rows);
    showToast('Customers Exported', `Successfully exported ${custs.length} customer accounts.`, 'success');
  } catch (err) {
    console.error('Error exporting customers:', err);
    showToast('Export Error', 'Could not export customers list.', 'danger');
  }
};

/**
 * 5. EXPORT ALL STUDIO DATA (Consolidated Batch Export)
 */
window.exportAllStudioDataToCSV = async () => {
  showToast('Starting Export', 'Preparing CSV downloads for Orders, Leads, Products, and Customers...', 'info');

  // Export Orders immediately
  window.exportOrdersToCSV();

  // Export Leads
  setTimeout(() => {
    window.exportLeadsToCSV();
  }, 400);

  // Export Products
  setTimeout(async () => {
    await window.exportProductsToCSV();
  }, 800);

  // Export Customers
  setTimeout(async () => {
    await window.exportCustomersToCSV();
    showToast('Studio Export Complete', 'All 4 studio datasets exported successfully!', 'success');
  }, 1200);
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

    ${inq.notes ? `
      <div style="margin-bottom: 14px;">
        <label style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Customer Message / Enquiry Notes:</label>
        <div style="background: var(--bg-hover); border: 1px solid var(--border-subtle); padding: 12px 14px; border-radius: 8px; font-size: 0.88rem; color: var(--text-main); margin-top: 6px; line-height: 1.5; white-space: pre-wrap;">
          ${escapeHtml(inq.notes)}
        </div>
      </div>
    ` : ''}

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
    let data;
    try {
      const res = await apiFetch('/api/admin/products');
      data = await res.json();
    } catch (_) {}

    if (!data || !data.success) {
      const fallbackRes = await fetch(`${API_BASE}/api/products`);
      data = await fallbackRes.json();
    }

    if (data && (data.success || Array.isArray(data.products))) {
      allProducts = data.products || [];
      renderAdminProducts(allProducts);
    }
  } catch (err) {
    console.error('Failed to load products:', err);
    try {
      const fallbackRes = await fetch(`${API_BASE}/api/products`);
      const data = await fallbackRes.json();
      if (data && (data.success || Array.isArray(data.products))) {
        allProducts = data.products || [];
        renderAdminProducts(allProducts);
      }
    } catch (e2) {
      console.error('Public products fallback also failed:', e2);
    }
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

  let uploadedProductImageBase64 = null;
  let adminImageMode = 'upload'; // 'upload' or 'preset'

  window.switchAdminImageMode = (mode) => {
    adminImageMode = mode;
    const tabUpload = document.getElementById('tabUploadImage');
    const tabPreset = document.getElementById('tabPresetImage');
    const boxUpload = document.getElementById('adminImageUploadBox');
    const boxPreset = document.getElementById('adminImagePresetBox');

    if (mode === 'upload') {
      if (tabUpload) tabUpload.classList.add('active');
      if (tabPreset) tabPreset.classList.remove('active');
      if (boxUpload) boxUpload.style.display = 'block';
      if (boxPreset) boxPreset.style.display = 'none';
    } else {
      if (tabPreset) tabPreset.classList.add('active');
      if (tabUpload) tabUpload.classList.remove('active');
      if (boxPreset) boxPreset.style.display = 'block';
      if (boxUpload) boxUpload.style.display = 'none';
    }
  };

  window.handleAdminImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      uploadedProductImageBase64 = loadEvt.target.result;
      const previewImg = document.getElementById('adminDropzonePreviewImg');
      const previewBox = document.getElementById('adminDropzonePreview');
      const emptyBox = document.getElementById('adminDropzoneEmpty');
      const fileNameEl = document.getElementById('adminDropzoneFileName');
      const fileSizeEl = document.getElementById('adminDropzoneFileSize');

      if (previewImg) previewImg.src = uploadedProductImageBase64;
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (fileSizeEl) fileSizeEl.textContent = (file.size / 1024 < 1024) ? `${Math.round(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      if (emptyBox) emptyBox.style.display = 'none';
      if (previewBox) previewBox.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  };

  window.removeAdminImage = (e) => {
    if (e) e.stopPropagation();
    uploadedProductImageBase64 = null;
    const fileInput = document.getElementById('newProductImageFile');
    if (fileInput) fileInput.value = '';
    const previewBox = document.getElementById('adminDropzonePreview');
    const emptyBox = document.getElementById('adminDropzoneEmpty');
    const previewImg = document.getElementById('adminDropzonePreviewImg');
    if (previewImg) previewImg.src = '';
    if (previewBox) previewBox.style.display = 'none';
    if (emptyBox) emptyBox.style.display = 'flex';
  };

  // Drag and drop for dropzone
  const dropzone = document.getElementById('adminImageDropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt ? dt.files : null;
      if (files && files.length > 0) {
        const fileInput = document.getElementById('newProductImageFile');
        if (fileInput) {
          fileInput.files = files;
          window.handleAdminImageUpload({ target: { files } });
        }
      }
    });
  }

  window.toggleAdminPill = (btn) => {
    if (btn) btn.classList.toggle('active');
  };

  window.toggleAdminColor = (btn) => {
    if (btn) btn.classList.toggle('active');
  };

  window.addCustomAdminColor = () => {
    const picker = document.getElementById('newProductCustomColorPicker');
    const nameInput = document.getElementById('newProductCustomColorName');
    const swatches = document.getElementById('adminColorSwatches');
    if (!swatches) return;

    const hex = picker ? picker.value : '#C99A3D';
    let name = nameInput ? nameInput.value.trim() : '';
    if (!name) name = hex.toUpperCase();

    // Check if duplicate name exists
    const existing = Array.from(swatches.querySelectorAll('.admin-color-chip')).find(
      el => el.getAttribute('data-name').toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      existing.classList.add('active');
      if (nameInput) nameInput.value = '';
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-color-chip active';
    btn.setAttribute('data-name', name);
    btn.setAttribute('data-color', hex);
    btn.onclick = function() { window.toggleAdminColor(this); };
    btn.innerHTML = `
      <span class="color-dot" style="background-color: ${hex};"></span>
      <span>${name}</span>
      <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
    `;
    swatches.appendChild(btn);
    if (nameInput) nameInput.value = '';
  };

  window.openAddProductModal = () => {
    if (addForm) addForm.reset();
    window.removeAdminImage();
    window.switchAdminImageMode('upload');
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

      // Sizes
      const activeSizePills = Array.from(document.querySelectorAll('#adminSizePills .admin-choice-pill.active')).map(p => p.getAttribute('data-size')).filter(Boolean);
      const customSizesVal = document.getElementById('newProductCustomSizes') ? document.getElementById('newProductCustomSizes').value.trim() : '';
      if (customSizesVal) {
        customSizesVal.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
          if (!activeSizePills.includes(s)) activeSizePills.push(s);
        });
      }

      // Colors
      const activeColorChips = Array.from(document.querySelectorAll('#adminColorSwatches .admin-color-chip.active')).map(c => ({
        name: c.getAttribute('data-name'),
        color: c.getAttribute('data-color')
      })).filter(c => c.name);

      // Variants
      const activeVariantPills = Array.from(document.querySelectorAll('#adminVariantPills .admin-choice-pill.active')).map(v => v.getAttribute('data-variant')).filter(Boolean);
      const customVariantsVal = document.getElementById('newProductCustomVariants') ? document.getElementById('newProductCustomVariants').value.trim() : '';
      if (customVariantsVal) {
        customVariantsVal.split(',').map(v => v.trim()).filter(Boolean).forEach(v => {
          if (!activeVariantPills.includes(v)) activeVariantPills.push(v);
        });
      }

      // Image
      let finalImage = '';
      if (adminImageMode === 'upload' && uploadedProductImageBase64) {
        finalImage = uploadedProductImageBase64;
      } else {
        finalImage = document.getElementById('newProductImagePreset') ? document.getElementById('newProductImagePreset').value : '';
      }

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
            image: finalImage,
            sizes: activeSizePills,
            colors: activeColorChips,
            variants: activeVariantPills
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
    const badgeEl = document.getElementById('editProductBadge');
    if (badgeEl) badgeEl.value = prod.badge || '';
    document.getElementById('editProductStatus').value = prod.status || 'In Stock';
    const leadTimeEl = document.getElementById('editProductLeadTime');
    if (leadTimeEl) leadTimeEl.value = prod.leadTime || '';
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
      const prod = allProducts.find(p => p.id === id);
      const name = document.getElementById('editProductName').value.trim();
      const price = document.getElementById('editProductPrice').value;
      const badgeEl = document.getElementById('editProductBadge');
      const badge = badgeEl ? badgeEl.value.trim() : (prod && prod.badge ? prod.badge : '');
      const status = document.getElementById('editProductStatus').value;
      const leadTimeEl = document.getElementById('editProductLeadTime');
      const leadTime = leadTimeEl ? leadTimeEl.value.trim() : (prod && prod.leadTime ? prod.leadTime : '24 - 48 Hours');
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
   CUSTOMER ACCOUNTS & TRACKING DATA CONTROLLER
   ========================================================================== */
async function loadCustomers() {
  try {
    const res = await apiFetch('/api/admin/customers');
    const data = await res.json();
    if (!data || !data.success) return;

    allCustomers = data.customers || [];

    // Update KPI badges and numbers
    const kpiTotal = document.getElementById('custKpiTotal');
    const kpiActiveBuyers = document.getElementById('custKpiActiveBuyers');
    const kpiTotalRevenue = document.getElementById('custKpiTotalRevenue');
    const kpiTotalLogins = document.getElementById('custKpiTotalLogins');
    const overviewKpi = document.getElementById('kpiTotalCustomers');

    if (kpiTotal) kpiTotal.textContent = allCustomers.length;
    if (overviewKpi) overviewKpi.textContent = allCustomers.length;

    // If customers seen storage not initialized, initialize it so total customers count isn't treated as new unread
    if (localStorage.getItem(STORAGE_SEEN_CUSTOMERS) === null && allCustomers.length > 0) {
      const initialSeen = allCustomers.map(c => String(c.id || c.email || c.phone).toLowerCase().trim()).filter(Boolean);
      saveSeenIds(STORAGE_SEEN_CUSTOMERS, initialSeen);
    }
    updateNotificationBadges();

    const activeBuyers = allCustomers.filter(c => (Number(c.totalOrders) || 0) > 0).length;
    if (kpiActiveBuyers) kpiActiveBuyers.textContent = activeBuyers;

    const totalRevenue = allCustomers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
    if (kpiTotalRevenue) kpiTotalRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

    const totalLogins = allCustomers.reduce((sum, c) => sum + (Number(c.loginCount) || 1), 0);
    if (kpiTotalLogins) kpiTotalLogins.textContent = totalLogins;

    renderCustomersTable(allCustomers);
  } catch (err) {
    console.error('Failed to load customers:', err);
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 36px;">
          No customer accounts found matching your query.
        </td>
      </tr>
    `;
    return;
  }

  const avatarColors = ['pink', 'blue', 'purple', 'green'];

  tbody.innerHTML = customers.map((cust, idx) => {
    const color = avatarColors[idx % avatarColors.length];
    const initials = (cust.name || 'Customer')
      .split(' ')
      .map(p => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CU';

    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const regDate = cust.registeredAt ? new Date(cust.registeredAt) : null;
    const regDateFormatted = regDate && !isNaN(regDate)
      ? `${regDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br><span style="font-size: 0.72rem; color: var(--text-muted);">${regDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>`
      : 'Verified User';

    const lastLogin = cust.lastLoginAt ? new Date(cust.lastLoginAt) : null;
    const lastLoginFormatted = lastLogin && !isNaN(lastLogin)
      ? `${lastLogin.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}<br><span style="font-size: 0.72rem; color: var(--text-muted);">${lastLogin.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>`
      : 'Just now';

    const waText = encodeURIComponent(`Hello ${cust.name || 'Customer'}, Rajesh Framing Studio here. Thank you for registering with us!`);
    const totalOrders = Number(cust.totalOrders) || 0;
    const totalSpent = Number(cust.totalSpent) || 0;
    const logins = Number(cust.loginCount) || 1;

    return `
      <tr>
        <td>
          <div class="lead-cust-cell">
            <div class="lead-avatar-circle ${color}" style="position: relative;">
              ${initials}
              ${cust.isOnline ? `<span style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background: #10B981; border: 2px solid #fff;" title="Online Now"></span>` : ''}
            </div>
            <div class="lead-cust-info">
              <span class="lead-cust-name">${escapeHtml(cust.name || 'Registered Customer')}</span>
              <span class="lead-cust-email">${escapeHtml(cust.email)}</span>
            </div>
          </div>
        </td>
        <td>
          ${cust.phone ? `
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" style="text-decoration: none; color: var(--text-main); font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
              <span style="color: #25D366; font-size: 0.95rem;">💬</span> ${escapeHtml(cust.phone)}
            </a>
          ` : `<span style="color: var(--text-muted); font-size: 0.82rem;">Not provided</span>`}
        </td>
        <td>
          ${regDateFormatted}
        </td>
        <td>
          ${lastLoginFormatted}
        </td>
        <td style="text-align: center;">
          <span class="status-pill neutral" style="font-weight: 700; padding: 2px 8px;">${logins}</span>
        </td>
        <td style="text-align: center;">
          <span class="status-pill ${totalOrders > 0 ? 'completed' : 'neutral'}" style="font-weight: 700; padding: 2px 8px;">
            ${totalOrders}
          </span>
        </td>
        <td>
          <strong style="color: var(--text-main); font-size: 0.9rem;">₹${totalSpent.toLocaleString('en-IN')}</strong>
        </td>
        <td style="text-align: center;">
          ${cust.isOnline ? `
            <span class="status-pill completed" style="font-size: 0.72rem; padding: 3px 8px; background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700;">
              <span class="status-dot pulse" style="background: #10B981;"></span> Online Now
            </span>
          ` : `
            <span class="status-pill ${cust.status === 'Active' ? 'active' : 'neutral'}" style="font-size: 0.72rem; padding: 3px 8px;">
              <span class="status-dot"></span> ${escapeHtml(cust.status || 'Active')}
            </span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function initCustomerFiltering() {
  const searchInput = document.getElementById('customerSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderCustomersTable(allCustomers);
      return;
    }

    const filtered = allCustomers.filter(c => {
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });

    renderCustomersTable(filtered);
  });
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

    // Update unread badge in sidebar
    const unreadCount = allMessages.filter(m => m.status === 'Unread').length;
    const badgeMessages = document.getElementById('sidebarUnreadMessagesBadge');
    if (badgeMessages) {
      badgeMessages.textContent = unreadCount;
      badgeMessages.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
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
    const subject = msg.subject || msg.service || 'General Inquiry';
    const waText = encodeURIComponent(`Hello ${msg.name}, Rajesh Framing here responding to your message regarding ${subject}.`);

    return `
      <tr>
        <td>
          <strong style="color: var(--text-main); font-size: 0.88rem;">${escapeHtml(msg.name)}</strong>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-muted);">💬 ${escapeHtml(msg.phone)}</span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(msg.email || 'No email provided')}</span>
        </td>
        <td>
          <strong style="font-size: 0.82rem; color: var(--text-main);">${escapeHtml(subject)}</strong>
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
            <button type="button" class="btn-table-icon edit" onclick="viewMessageDetail('${msg.id}')" title="View Full Message">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
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

window.viewMessageDetail = (id) => {
  const msg = allMessages.find(m => m.id === id);
  if (!msg) return;

  const modal = document.getElementById('inquiryDetailModal');
  const titleEl = document.getElementById('modalInquiryId');
  const bodyEl = document.getElementById('modalInquiryContent');
  const waBtn = document.getElementById('modalWhatsAppActionBtn');

  if (!modal || !bodyEl) return;

  titleEl.textContent = `Contact Message #${msg.id}`;

  const cleanPhone = (msg.phone || '').replace(/\D/g, '');
  const subject = msg.subject || msg.service || 'General Inquiry';
  const waText = encodeURIComponent(`Hello ${msg.name}, Rajesh Framing here regarding your message about ${subject}.`);
  if (waBtn) waBtn.href = `https://wa.me/${cleanPhone}?text=${waText}`;

  bodyEl.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
      <div style="background: var(--bg-hover); padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Customer Info</span>
        <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-main); margin-top: 4px;">${escapeHtml(msg.name)}</div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">📞 ${escapeHtml(msg.phone)}</div>
        <div style="font-size: 0.82rem; color: var(--text-muted);">✉️ ${escapeHtml(msg.email || 'Not provided')}</div>
      </div>

      <div style="background: var(--bg-hover); padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Subject / Service</span>
        <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-main); margin-top: 4px;">${escapeHtml(subject)}</div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">Status: <strong style="color: var(--primary);">${escapeHtml(msg.status || 'Unread')}</strong></div>
      </div>
    </div>

    <div style="margin-bottom: 14px;">
      <label style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Full Customer Message:</label>
      <div style="background: var(--bg-hover); border: 1px solid var(--border-subtle); padding: 14px 16px; border-radius: 8px; font-size: 0.92rem; color: var(--text-main); margin-top: 6px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeHtml(msg.message)}
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-subtle); font-size: 0.78rem; color: var(--text-muted);">
      <span>Received: ${new Date(msg.createdAt).toLocaleString('en-IN')}</span>
      <span>Source: <strong>Website Contact Form</strong></span>
    </div>
  `;

  modal.classList.add('open');
};

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
      await loadDashboardStats();
      showToast('Message Deleted', 'Contact message was deleted.', 'info');
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
