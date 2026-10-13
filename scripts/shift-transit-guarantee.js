const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update HTML files
const htmlFiles = [
  path.join(rootDir, 'product-detail.html'),
  path.join(rootDir, 'public', 'product-detail.html')
];

const transitPillHtml = `          <!-- Safe Transit Guarantee Bar (Shifted directly under photo upload) -->
          <div class="transit-guarantee-pill" style="margin-top: 10px; margin-bottom: 12px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold); flex-shrink: 0;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span><strong>Safe Transit Guarantee:</strong> 100% zero-damage arrival with reinforced air bubble &amp; corner guards.</span>
          </div>`;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  // Remove the old transit guarantee pill from under detail-overview-card
  const oldTransitPattern = /\s*<!-- Safe Transit Guarantee Bar \(Minimal Strip\) -->\s*<div class="transit-guarantee-pill">[\s\S]*?<\/div>/;
  if (oldTransitPattern.test(html)) {
    html = html.replace(oldTransitPattern, '');
    console.log(`Removed old transit pill in ${file}`);
  }

  // Insert transit guarantee pill directly after photo-upload-container
  const photoUploadEndMarker = '<!-- Quality Badges (Under Upload Photo Section) -->';
  if (html.includes(photoUploadEndMarker) && !html.includes('<!-- Safe Transit Guarantee Bar (Shifted directly under photo upload) -->')) {
    html = html.replace(photoUploadEndMarker, `${transitPillHtml}\n\n          ${photoUploadEndMarker}`);
    console.log(`Inserted transit pill under photo upload in ${file}`);
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log(`Saved ${file}`);
});

// 2. Update CSS files for responsive ordering
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let css = fs.readFileSync(file, 'utf8');

  // Find the mobile order block:
  // photo-upload-container (order 5), detail-actions-card (order 6), detail-overview-card (order 7), guarantee-list (order 8), transit-guarantee-pill (order 9)
  const oldMobileOrderPattern = /\.photo-upload-container\s*\{\s*order:\s*5;[\s\S]*?\.transit-guarantee-pill\s*\{\s*order:\s*9;\s*margin-bottom:\s*0;\s*width:\s*100%\s*!important;\s*box-sizing:\s*border-box\s*!important;\s*\}/;

  const newMobileOrderBlock = `.photo-upload-container {
    order: 5;
    margin-top: 0;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .transit-guarantee-pill {
    order: 6;
    margin-top: 4px;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-actions-card {
    order: 7;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-overview-card {
    order: 8;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .guarantee-list,
  .detail-gallery .guarantee-list {
    order: 9;
    margin-top: 4px;
    margin-bottom: 0;
    width: 100% !important;
    box-sizing: border-box !important;
  }`;

  if (oldMobileOrderPattern.test(css)) {
    css = css.replace(oldMobileOrderPattern, newMobileOrderBlock);
    console.log(`Updated mobile order in ${file}`);
  } else {
    console.log(`Mobile order pattern not matched in ${file}`);
  }

  fs.writeFileSync(file, css, 'utf8');
  console.log(`Saved ${file}`);
});

console.log('Shift transit guarantee pill completed successfully!');
