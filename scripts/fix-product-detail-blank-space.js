const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

const oldMediaQueryPattern = /@media\s*\(\s*max-width:\s*992px\s*\)\s*\{\s*\.product-detail-layout\s*\{[\s\S]*?\.transit-guarantee-pill\s*\{\s*order:\s*9;\s*margin-bottom:\s*0;\s*\}\s*\}/;

const newResponsiveBlock = `/* Responsive Tablet Grid (769px - 992px): Maintain balanced 2-column layout to eliminate empty blank space */
@media (min-width: 769px) and (max-width: 992px) {
  .product-detail-layout {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 24px;
    align-items: start;
    width: 100%;
  }

  .detail-gallery {
    width: 100%;
  }

  .detail-info {
    width: 100%;
  }

  .detail-card,
  .photo-upload-container,
  .detail-actions-card,
  .detail-customization-card,
  .detail-overview-card {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
}

/* Responsive Mobile Phone Flow (<= 768px):
   Natural Mobile Hierarchy: Image -> Product Name & Price -> Size & Options -> Upload Photo -> Action Buttons -> Overview -> Badges
   Everything stretches to 100% full width to completely eliminate empty blank space */
@media (max-width: 768px) {
  .product-detail-layout {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: stretch !important;
    width: 100% !important;
  }

  .detail-gallery,
  .detail-info {
    display: contents;
  }

  .detail-main-img-box {
    order: 1;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-thumbs-strip {
    order: 2;
    margin-bottom: 6px;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-header-compact {
    order: 3;
    margin-top: 4px;
    margin-bottom: 4px;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-customization-card {
    order: 4;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .photo-upload-container {
    order: 5;
    margin-top: 0;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-actions-card {
    order: 6;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .detail-overview-card {
    order: 7;
    margin-bottom: 0;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .guarantee-list,
  .detail-gallery .guarantee-list {
    order: 8;
    margin-top: 4px;
    margin-bottom: 0;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .transit-guarantee-pill {
    order: 9;
    margin-bottom: 0;
    width: 100% !important;
    box-sizing: border-box !important;
  }
}`;

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Replace media query block
  if (oldMediaQueryPattern.test(content)) {
    content = content.replace(oldMediaQueryPattern, newResponsiveBlock);
    console.log(`Replaced media query in ${file}`);
  } else {
    console.log(`Media query pattern not found in ${file}`);
  }

  // 2. Ensure .detail-card has width: 100% and box-sizing: border-box
  const oldDetailCardPattern = /\.detail-card\s*\{\s*border-radius:\s*14px;/;
  const newDetailCard = `.detail-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 14px;`;
  if (oldDetailCardPattern.test(content)) {
    content = content.replace(oldDetailCardPattern, newDetailCard);
    console.log(`Updated .detail-card width in ${file}`);
  }

  // 3. Ensure .photo-upload-container has width: 100%
  const oldUploadPattern = /\.photo-upload-container\s*\{\s*margin-top:\s*18px;\s*\}/;
  const newUpload = `.photo-upload-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-top: 14px;
}`;
  if (oldUploadPattern.test(content)) {
    content = content.replace(oldUploadPattern, newUpload);
    console.log(`Updated .photo-upload-container width in ${file}`);
  }

  // 4. Ensure .photo-upload-dropzone has width: 100%
  const oldDropzonePattern = /\.photo-upload-dropzone\s*\{\s*position:\s*relative;/;
  const newDropzone = `.photo-upload-dropzone {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;`;
  if (oldDropzonePattern.test(content)) {
    content = content.replace(oldDropzonePattern, newDropzone);
    console.log(`Updated .photo-upload-dropzone width in ${file}`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Saved ${file}`);
});

console.log('Done fixing product detail blank space!');
