const fs = require('fs');

const slotHtml = `          <!-- Customer Sign In / Account Button -->
          <div class="nav-customer-slot" id="navCustomerSlot">
            <button type="button" class="btn btn-sm btn-outline cust-sign-in-btn" style="border-radius: 9999px; padding: 7px 16px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600;" onclick="openCustomerAuthModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Sign In</span>
            </button>
          </div>
`;

const files = ['index.html', 'products.html', 'track-order.html', 'about.html', 'contact.html', 'product-detail.html', 'checkout.html'];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('nav-customer-slot')) {
      content = content.replace(/(<button[^>]*class="[^"]*navbar-quote-btn[^"]*")/i, slotHtml + '          $1');
      fs.writeFileSync(f, content, 'utf8');
      console.log('Updated ' + f);
    }
    // Also copy to public/
    const publicPath = 'public/' + f;
    fs.writeFileSync(publicPath, content, 'utf8');
    console.log('Mirrored to ' + publicPath);
  }
});
