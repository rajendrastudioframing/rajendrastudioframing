const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Fix components.css
function fixComponentsCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace bottom: 14px in .floating-actions-wrap
  content = content.replace(
    /\.floating-actions-wrap\s*\{\s*z-index:\s*99999\s*!important;\s*bottom:\s*14px\s*!important;\s*right:\s*12px\s*!important;\s*\}/g,
    `.back-to-top-btn {\n    display: none !important;\n  }\n  .floating-actions-wrap {\n    bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;\n    right: 16px !important;\n    gap: 0 !important;\n    z-index: 99995 !important;\n  }`
  );

  // Also replace any other bottom: 14px !important on floating-actions-wrap
  content = content.replace(
    /(\.floating-actions-wrap\s*\{[^}]*?)bottom:\s*14px\s*!important;([^}]*?\})/g,
    `$1bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;$2`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

// 2. Fix style.css
function fixStyleCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace lines in mobile responsive query
  const mobileWrapRegex = /@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\.floating-actions-wrap\s*\{[\s\S]*?\}\s*(\.product-page-active\s+\.floating-actions-wrap\s*\{[\s\S]*?\})?\s*\.floating-whatsapp-btn\s*\{[\s\S]*?\}\s*\.back-to-top-btn\s*\{[\s\S]*?\}/;

  if (mobileWrapRegex.test(content)) {
    content = content.replace(mobileWrapRegex, (match, prefix) => {
      return `@media (max-width: 768px) {${prefix}  .back-to-top-btn {
    display: none !important;
  }
  .floating-actions-wrap {
    bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
    right: 16px !important;
    gap: 0 !important;
    z-index: 99995 !important;
  }
  .product-page-active .floating-actions-wrap {
    display: flex !important;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
    z-index: 99995 !important;
  }
  .floating-whatsapp-btn {
    width: 48px !important;
    height: 48px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    box-shadow: 0 4px 18px rgba(37, 211, 102, 0.45) !important;
  }
  .floating-whatsapp-btn span {
    display: none !important;
  }
  .floating-whatsapp-btn svg {
    width: 26px !important;
    height: 26px !important;
  }`;
    });
    console.log(`Updated mobile floating styles in ${filePath}`);
  } else {
    // Append targeted override
    content += `\n
@media (max-width: 768px) {
  .back-to-top-btn {
    display: none !important;
  }
  .floating-actions-wrap {
    bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
    right: 16px !important;
    gap: 0 !important;
    z-index: 99995 !important;
  }
  .floating-whatsapp-btn {
    width: 48px !important;
    height: 48px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    box-shadow: 0 4px 18px rgba(37, 211, 102, 0.45) !important;
  }
  .floating-whatsapp-btn span {
    display: none !important;
  }
  .floating-whatsapp-btn svg {
    width: 26px !important;
    height: 26px !important;
  }
}
`;
    console.log(`Appended mobile floating styles to ${filePath}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// 3. Fix ecom-ui.css
function fixEcomUiCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure .back-to-top-btn is display: none !important on mobile
  content = content.replace(
    /\.floating-actions-wrap\s*\{\s*bottom:\s*calc\(75px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)\s*!important;\s*\}/g,
    `.back-to-top-btn {\n    display: none !important;\n  }\n  .floating-actions-wrap {\n    bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;\n    right: 16px !important;\n    gap: 0 !important;\n    z-index: 99995 !important;\n  }`
  );

  // In categories-showcase-section, give generous bottom padding on mobile
  if (!content.includes('.categories-showcase-section { padding-bottom: 90px !important; }')) {
    content = content.replace(
      /@media\s*\(max-width:\s*767px\)\s*\{\s*\.categories-main-grid/g,
      `@media (max-width: 767px) {\n  .categories-showcase-section {\n    padding-bottom: 90px !important;\n  }\n  .categories-main-grid`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

// 4. Fix main.js
function fixMainJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Update initBackToTop to never show on <= 768px
  const targetFn = `function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.innerWidth <= 768) {
      backToTopBtn.classList.remove('visible');
      return;
    }
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}`;

  content = content.replace(/function initBackToTop\(\)\s*\{[\s\S]*?backToTopBtn\.addEventListener\('click'[\s\S]*?\}\);?\s*\}/, targetFn);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

// Run fixes
fixComponentsCss(path.join(rootDir, 'css', 'components.css'));
fixComponentsCss(path.join(rootDir, 'public', 'css', 'components.css'));

fixStyleCss(path.join(rootDir, 'css', 'style.css'));
fixStyleCss(path.join(rootDir, 'public', 'css', 'style.css'));

fixEcomUiCss(path.join(rootDir, 'css', 'ecom-ui.css'));
fixEcomUiCss(path.join(rootDir, 'public', 'css', 'ecom-ui.css'));

fixMainJs(path.join(rootDir, 'js', 'main.js'));
fixMainJs(path.join(rootDir, 'public', 'js', 'main.js'));

// Also update scripts/apply-compact-mobile-cards.js
const compactScript = path.join(rootDir, 'scripts', 'apply-compact-mobile-cards.js');
if (fs.existsSync(compactScript)) {
  let s = fs.readFileSync(compactScript, 'utf8');
  s = s.replace(/bottom:\s*14px\s*!important;/g, 'bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;');
  fs.writeFileSync(compactScript, s, 'utf8');
}

console.log('Mobile phone view fix successfully applied!');
