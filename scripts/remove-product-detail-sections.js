const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = [
  path.join(rootDir, 'product-detail.html'),
  path.join(rootDir, 'public', 'product-detail.html')
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove Safe Transit Guarantee Bar & Quality Badges (Image 1)
  // Targets transit-guarantee-pill and guarantee-list
  const transitRegex = /\s*<!--\s*Safe Transit Guarantee Bar[\s\S]*?<!--\s*Quality Badges[\s\S]*?<\/div>\s*<\/div>/;
  if (transitRegex.test(content)) {
    content = content.replace(transitRegex, '');
    console.log(`[1] Removed Safe Transit Guarantee and Quality Badges from ${filePath}`);
  } else {
    // Fallback targeted pattern
    const fallbackTransit = /\s*<div class="transit-guarantee-pill"[\s\S]*?<\/div>\s*<div class="guarantee-list"[\s\S]*?<\/div>\s*<\/div>/;
    if (fallbackTransit.test(content)) {
      content = content.replace(fallbackTransit, '');
      console.log(`[1 fallback] Removed Safe Transit Guarantee and Quality Badges from ${filePath}`);
    }
  }

  // 2. Remove Compact Key Specs Strip (Image 2)
  const specsStripRegex = /\s*<!--\s*Compact Key Specs Strip\s*-->\s*<div class="detail-key-specs-compact">[\s\S]*?<\/div>/;
  if (specsStripRegex.test(content)) {
    content = content.replace(specsStripRegex, '');
    console.log(`[2] Removed Compact Key Specs Strip from ${filePath}`);
  } else {
    const fallbackSpecsStrip = /\s*<div class="detail-key-specs-compact">[\s\S]*?<\/div>/;
    if (fallbackSpecsStrip.test(content)) {
      content = content.replace(fallbackSpecsStrip, '');
      console.log(`[2 fallback] Removed Compact Key Specs Strip from ${filePath}`);
    }
  }

  // 3. Remove Tabs Container (Product Details, Specifications & Materials, Craftsmanship Process) (Image 3)
  const tabsRegex = /\s*<!--\s*BELOW SECTION 1: Product Details \(In-depth Tabs\)\s*-->\s*<div class="tabs-container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  if (tabsRegex.test(content)) {
    content = content.replace(tabsRegex, '');
    console.log(`[3] Removed Tabs Container from ${filePath}`);
  } else {
    const fallbackTabs = /\s*<div class="tabs-container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?=\s*<!--\s*BELOW SECTION 2: Customer Reviews)/;
    if (fallbackTabs.test(content)) {
      content = content.replace(fallbackTabs, '');
      console.log(`[3 fallback] Removed Tabs Container from ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('All requested sections successfully removed from product-detail.html and public/product-detail.html!');
