const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = [
  path.join(rootDir, 'products.html'),
  path.join(rootDir, 'public', 'products.html')
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove the page header banner section for products
  const regex = /<!--\s*Page Header Banner with Cinematic Background\s*-->[\s\S]*?<section class="page-header-banner banner-products">[\s\S]*?<\/section>/;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Successfully removed hero banner from ${filePath}`);
  } else {
    console.log(`Hero banner regex did not match in ${filePath}`);
  }
});
