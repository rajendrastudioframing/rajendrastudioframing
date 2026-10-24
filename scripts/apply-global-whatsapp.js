const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const WHATSAPP_URL = 'https://wa.me/919510757513?text=Hello%20Rajendra%20Studio%20%26%20Framing,%20I%20have%20an%20enquiry.';

const FLOATING_ACTIONS_HTML = `  <!-- Floating Actions (WhatsApp & Back to Top) -->
  <div class="floating-actions-wrap">
    <a href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" class="floating-whatsapp-btn pulse-ring" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.18-.553-1.638-.673-2.684-2.336-2.766-2.445-.082-.109-.661-.88-.661-1.678 0-.798.419-1.189.569-1.353.15-.164.33-.205.441-.205.111 0 .222.001.32.006.103.004.24-.039.375.285.144.344.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.087.186-.173.287-.087.1-.183.224-.262.301-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087.159.058 1.009.477 1.182.564.173.087.289.13.332.204.043.074.043.431-.101.836z"></path>
      </svg>
      <span>Chat on WhatsApp</span>
    </a>

    <button type="button" class="back-to-top-btn" aria-label="Back to top">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  </div>`;

// 1. Update CSS in components.css
function updateComponentsCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace display: none on mobile for product-page-active
  const targetRegex = /body\.product-page-active\s+\.floating-actions-wrap\s*\{\s*display:\s*none\s*!important;\s*\}/g;
  if (targetRegex.test(content)) {
    content = content.replace(targetRegex, `body.product-page-active .floating-actions-wrap {\n    display: flex !important;\n    bottom: calc(75px + env(safe-area-inset-bottom, 0px)) !important;\n  }`);
    console.log(`Updated product-page-active floating wrap in ${filePath}`);
  }

  // Ensure floating-actions-wrap has high z-index and flex
  const wrapRuleRegex = /\.floating-actions-wrap\s*\{([^}]+)\}/g;
  content = content.replace(wrapRuleRegex, (match, inner) => {
    if (!inner.includes('z-index')) {
      return `.floating-actions-wrap {\n  z-index: 99999 !important;${inner}}`;
    } else {
      return match.replace(/z-index:\s*[^;]+;/g, 'z-index: 99999 !important;');
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved CSS updates in ${filePath}`);
}

// 2. Update CSS in style.css
function updateStyleCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace z-index in .floating-actions-wrap to 99999 !important
  content = content.replace(/\.floating-actions-wrap\s*\{([^}]+)\}/g, (match, inner) => {
    let updated = inner;
    if (updated.includes('z-index:')) {
      updated = updated.replace(/z-index:\s*[^;]+;/g, 'z-index: 99999 !important;');
    } else {
      updated += '\n  z-index: 99999 !important;';
    }
    return `.floating-actions-wrap {${updated}}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved CSS updates in ${filePath}`);
}

// 3. Update HTML files
const htmlFiles = [
  'index.html',
  'categories.html',
  'products.html',
  'product-detail.html',
  'about.html',
  'contact.html',
  'checkout.html',
  'orders.html',
  'track-order.html'
];

function updateHtmlFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if floating-actions-wrap exists
  if (content.includes('class="floating-actions-wrap"')) {
    // Replace the existing wrap with our complete version
    const regex = /<!--\s*Floating Actions[^>]*-->\s*<div class="floating-actions-wrap">[\s\S]*?<\/div>|<div class="floating-actions-wrap">[\s\S]*?<\/div>/;
    content = content.replace(regex, FLOATING_ACTIONS_HTML);
    console.log(`Replaced floating actions in ${filePath}`);
  } else {
    // Inject right before footer or scripts or body
    if (content.includes('<footer class="site-footer">')) {
      content = content.replace('<footer class="site-footer">', `${FLOATING_ACTIONS_HTML}\n\n  <footer class="site-footer">`);
      console.log(`Injected floating actions before footer in ${filePath}`);
    } else if (content.includes('<!-- Premium Footer')) {
      content = content.replace('<!-- Premium Footer', `${FLOATING_ACTIONS_HTML}\n\n  <!-- Premium Footer`);
      console.log(`Injected floating actions before footer comment in ${filePath}`);
    } else if (content.includes('<nav class="mobile-bottom-nav"')) {
      content = content.replace('<nav class="mobile-bottom-nav"', `${FLOATING_ACTIONS_HTML}\n\n  <nav class="mobile-bottom-nav"`);
      console.log(`Injected floating actions before mobile-bottom-nav in ${filePath}`);
    } else if (content.includes('</body>')) {
      content = content.replace('</body>', `${FLOATING_ACTIONS_HTML}\n</body>`);
      console.log(`Injected floating actions before </body> in ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// 4. Update JS in main.js
function updateMainJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Add initGlobalWhatsAppButton to DOMContentLoaded if not present
  if (!content.includes('initGlobalWhatsAppButton();')) {
    content = content.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n  initGlobalWhatsAppButton();");
  }

  // Define initGlobalWhatsAppButton if not present
  if (!content.includes('function initGlobalWhatsAppButton()')) {
    const waFunction = `
/* --- Global Floating WhatsApp Button & Back to Top Assurance --- */
function initGlobalWhatsAppButton() {
  let wrap = document.querySelector('.floating-actions-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'floating-actions-wrap';
    const footer = document.querySelector('.site-footer') || document.querySelector('.mobile-bottom-nav');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(wrap, footer);
    } else {
      document.body.appendChild(wrap);
    }
  }

  // Ensure WhatsApp button exists
  let waBtn = wrap.querySelector('.floating-whatsapp-btn');
  if (!waBtn) {
    waBtn = document.createElement('a');
    waBtn.href = '${WHATSAPP_URL}';
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    waBtn.className = 'floating-whatsapp-btn pulse-ring';
    waBtn.setAttribute('aria-label', 'Chat on WhatsApp');
    waBtn.innerHTML = \`
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.18-.553-1.638-.673-2.684-2.336-2.766-2.445-.082-.109-.661-.88-.661-1.678 0-.798.419-1.189.569-1.353.15-.164.33-.205.441-.205.111 0 .222.001.32.006.103.004.24-.039.375.285.144.344.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.087.186-.173.287-.087.1-.183.224-.262.301-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087.159.058 1.009.477 1.182.564.173.087.289.13.332.204.043.074.043.431-.101.836z"></path>
      </svg>
      <span>Chat on WhatsApp</span>
    \`;
    wrap.insertBefore(waBtn, wrap.firstChild);
  }

  // Ensure Back to Top button exists
  let topBtn = wrap.querySelector('.back-to-top-btn');
  if (!topBtn) {
    topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'back-to-top-btn';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.innerHTML = \`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    \`;
    wrap.appendChild(topBtn);
  }

  // Attach click listener to back to top if not already attached
  if (topBtn && !topBtn.dataset.bound) {
    topBtn.dataset.bound = 'true';
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// Auto-run if DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initGlobalWhatsAppButton();
}
`;
    content += '\n' + waFunction;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved JS updates in ${filePath}`);
}

// Run updates on CSS
updateComponentsCss(path.join(rootDir, 'css', 'components.css'));
updateComponentsCss(path.join(rootDir, 'public', 'css', 'components.css'));
updateStyleCss(path.join(rootDir, 'css', 'style.css'));
updateStyleCss(path.join(rootDir, 'public', 'css', 'style.css'));

// Run updates on JS
updateMainJs(path.join(rootDir, 'js', 'main.js'));
updateMainJs(path.join(rootDir, 'public', 'js', 'main.js'));

// Run updates on HTML files in both root and public
htmlFiles.forEach(file => {
  updateHtmlFile(path.join(rootDir, file));
  updateHtmlFile(path.join(rootDir, 'public', file));
});

console.log('Global WhatsApp button successfully applied to all pages and CSS/JS files!');
