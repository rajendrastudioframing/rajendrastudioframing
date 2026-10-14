const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Sidebar HTML snippet to insert after Customers link
const sidebarSnippets = `
        <a href="#messages" class="sidebar-link" data-view="viewMessages">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>Messages</span>
          <span class="sidebar-badge" id="sidebarUnreadMessagesBadge" style="display: none;">0</span>
        </a>

        <a href="#reviews" class="sidebar-link" data-view="viewReviews">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>Reviews</span>
        </a>
`;

// 2. Main content panels snippet to insert before viewSettings
const viewsSnippet = `
          <!-- ==========================================
               VIEW 5: MESSAGES (CONTACT ENQUIRIES)
               ========================================== -->
          <section class="dashboard-view-panel" id="viewMessages">
            <div class="page-subheader">
              <div class="subheader-text">
                Manage contact form inquiries and customer messages submitted from website.
              </div>
              <div class="subheader-actions">
                <button type="button" class="btn-sub-action secondary" onclick="loadMessages()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Refresh Messages</span>
                </button>
              </div>
            </div>

            <div class="section-title-bar">
              <h3 class="section-title-text">Contact Messages &amp; Queries</h3>
            </div>

            <!-- Messages Table Card -->
            <div class="graphura-card-table-wrap">
              <table class="graphura-table messages-table">
                <thead>
                  <tr>
                    <th style="width: 170px;">Customer</th>
                    <th style="width: 140px;">Phone</th>
                    <th style="width: 180px;">Email</th>
                    <th style="width: 150px;">Subject</th>
                    <th>Message Details</th>
                    <th style="width: 110px;">Date</th>
                    <th style="width: 120px; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody id="contactMessagesTableBody">
                  <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Loading contact messages...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ==========================================
               VIEW: CUSTOMER REVIEWS
               ========================================== -->
          <section class="dashboard-view-panel" id="viewReviews">
            <div class="page-subheader">
              <div class="subheader-text">
                Manage customer product reviews, star ratings, and testimonials across your catalog.
              </div>
              <div class="subheader-actions">
                <button type="button" class="btn-sub-action secondary" onclick="loadReviews()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Refresh Reviews</span>
                </button>
              </div>
            </div>

            <div class="section-title-bar">
              <h3 class="section-title-text">All Customer Reviews</h3>
            </div>

            <!-- Reviews Table Card -->
            <div class="graphura-card-table-wrap">
              <table class="graphura-table reviews-table">
                <thead>
                  <tr>
                    <th style="width: 170px;">Product</th>
                    <th style="width: 160px;">Customer</th>
                    <th style="width: 120px;">Rating</th>
                    <th style="width: 180px;">Headline</th>
                    <th>Customer Comment</th>
                    <th style="width: 100px;">Date</th>
                    <th style="width: 80px; text-align: center;">Action</th>
                  </tr>
                </thead>
                <tbody id="reviewsTableBody">
                  <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Loading reviews...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
`;

function patchAdminHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert sidebar items if not present
  if (!content.includes('data-view="viewMessages"')) {
    const custSearch = `<a href="#customers" class="sidebar-link" data-view="viewCustomers">`;
    const custEndIdx = content.indexOf('</a>', content.indexOf(custSearch));
    if (custEndIdx !== -1) {
      const insertionPoint = custEndIdx + 4;
      content = content.slice(0, insertionPoint) + sidebarSnippets + content.slice(insertionPoint);
      console.log(`✅ Patched sidebar in ${filePath}`);
    }
  }

  // Insert view panels if not present
  if (!content.includes('id="viewMessages"')) {
    const settingsIdx = content.indexOf('<section class="dashboard-view-panel" id="viewSettings">');
    if (settingsIdx !== -1) {
      content = content.slice(0, settingsIdx) + viewsSnippet + content.slice(settingsIdx);
      console.log(`✅ Patched view panels in ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

patchAdminHtml(path.join(rootDir, 'admin.html'));
patchAdminHtml(path.join(rootDir, 'public', 'admin.html'));

// 3. Patch js/admin.js and public/js/admin.js
const reviewsJsCode = `
/* ==========================================================================
   CUSTOMER REVIEWS CONTROLLER
   ========================================================================== */
let allReviews = [];

async function loadReviews() {
  try {
    const tbody = document.getElementById('reviewsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">Loading reviews...</td></tr>';
    }
    const res = await apiFetch('/api/admin/reviews');
    const data = await res.json();
    if (data && data.success) {
      allReviews = data.reviews || [];
      renderReviewsTable(allReviews);
    } else {
      throw new Error(data.message || 'Failed to fetch admin reviews');
    }
  } catch (err) {
    console.warn('Admin reviews API unavailable, falling back to public endpoint:', err.message);
    try {
      const fallbackRes = await fetch(\`\${API_BASE}/api/reviews\`);
      const fallbackData = await fallbackRes.json();
      allReviews = fallbackData.reviews || [];
      renderReviewsTable(allReviews);
    } catch (fbErr) {
      console.error('Failed to load reviews:', fbErr);
    }
  }
}

function renderReviewsTable(reviews) {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  if (!reviews || reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No customer reviews yet.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(Math.max(0, 5 - (r.rating || 5)));
    const prod = (allProducts || []).find(p => p.id === r.productId);
    const prodName = prod ? prod.name : (r.productId || 'General Catalog');

    return \`
      <tr>
        <td>
          <strong style="font-size: 0.84rem; color: var(--text-main); font-weight: 700;">\${escapeHtml(prodName)}</strong>
        </td>
        <td>
          <div style="font-weight: 700; font-size: 0.84rem; color: var(--text-main);">\${escapeHtml(r.author || 'Anonymous')}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">📍 \${escapeHtml(r.city || 'Dahej / Bharuch')}</div>
        </td>
        <td>
          <div style="color: #F59E0B; font-size: 0.95rem; letter-spacing: 1px;">\${stars}</div>
          <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">\${r.rating}.0 / 5.0</span>
        </td>
        <td>
          <strong style="font-size: 0.82rem; color: var(--text-main);">\${escapeHtml(r.headline || '')}</strong>
        </td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 320px; line-height: 1.45;">
            \${escapeHtml(r.comment || '')}
          </div>
        </td>
        <td>
          <span style="font-size: 0.76rem; color: var(--text-muted);">\${escapeHtml(r.date || '')}</span>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-table-icon delete" onclick="deleteReview('\${r.id}')" title="Delete Review">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      </tr>
    \`;
  }).join('');
}

window.deleteReview = async (id) => {
  if (!confirm('Are you sure you want to delete this customer review?')) return;
  try {
    const res = await apiFetch(\`/api/admin/reviews/\${encodeURIComponent(id)}\`, { method: 'DELETE' });
    const data = await res.json();
    if (data && data.success) {
      allReviews = allReviews.filter(r => r.id !== id);
      renderReviewsTable(allReviews);
      showToast('Review Deleted', 'The review has been removed.', 'info');
    } else {
      showToast('Action Notice', data.message || 'Review removed from view.', 'info');
      allReviews = allReviews.filter(r => r.id !== id);
      renderReviewsTable(allReviews);
    }
  } catch (err) {
    showToast('Error', 'Could not delete review: ' + err.message, 'danger');
  }
};

window.loadReviews = loadReviews;
`;

function patchAdminJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Update titles map in initNavigation
  content = content.replace(
    /viewCustomers:\s*'Customers',/g,
    "viewCustomers: 'Customers',\n    viewMessages: 'Messages',\n    viewReviews: 'Reviews',"
  );

  // Update switchTab calls
  content = content.replace(
    /if\s*\(\s*viewId\s*===\s*'viewCustomers'\s*\)\s*loadCustomers\(\);/g,
    "if (viewId === 'viewCustomers') loadCustomers();\n    if (viewId === 'viewMessages') loadMessages();\n    if (viewId === 'viewReviews') loadReviews();"
  );

  // Update hash router
  content = content.replace(
    /else if\s*\(\s*hash\s*===\s*'customers'\s*\)\s*switchTab\('viewCustomers'\);/g,
    "else if (hash === 'customers') switchTab('viewCustomers');\n  else if (hash === 'messages') switchTab('viewMessages');\n  else if (hash === 'reviews') switchTab('viewReviews');"
  );

  // Append reviews controller if not already present
  if (!content.includes('CUSTOMER REVIEWS CONTROLLER')) {
    content += '\n' + reviewsJsCode;
    console.log(`✅ Added reviews controller to ${filePath}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

patchAdminJs(path.join(rootDir, 'js', 'admin.js'));
patchAdminJs(path.join(rootDir, 'public', 'js', 'admin.js'));

console.log('--- ADMIN PANEL EXPANSION COMPLETE ---');
