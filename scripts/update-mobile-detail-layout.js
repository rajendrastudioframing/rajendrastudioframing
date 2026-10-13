const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

const targetPattern = /@media\s*\(\s*max-width:\s*992px\s*\)\s*\{\s*\.product-detail-layout\s*\{\s*grid-template-columns:\s*1fr;\s*gap:\s*24px;\s*\}\s*\}/;

const replacement = `@media (max-width: 992px) {
  .product-detail-layout {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .detail-gallery,
  .detail-info {
    display: contents;
  }

  /* Natural Mobile Ecommerce Hierarchy: Image -> Product Name & Price -> Size & Options -> Upload Photo -> Action Buttons -> Overview -> Badges */
  .detail-main-img-box {
    order: 1;
  }

  .detail-thumbs-strip {
    order: 2;
    margin-bottom: 6px;
  }

  .detail-header-compact {
    order: 3;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  .detail-customization-card {
    order: 4;
    margin-bottom: 0;
  }

  .photo-upload-container {
    order: 5;
    margin-top: 0;
    margin-bottom: 0;
  }

  .detail-actions-card {
    order: 6;
    margin-bottom: 0;
  }

  .detail-overview-card {
    order: 7;
    margin-bottom: 0;
  }

  .guarantee-list,
  .detail-gallery .guarantee-list {
    order: 8;
    margin-top: 4px;
    margin-bottom: 0;
  }

  .transit-guarantee-pill {
    order: 9;
    margin-bottom: 0;
  }
}`;

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated mobile detail layout in ${file}`);
  } else {
    console.log(`Pattern not matched in ${file}`);
  }
});

console.log('Mobile layout script finished.');
