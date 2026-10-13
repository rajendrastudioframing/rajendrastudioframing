const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update HTML files
const htmlFiles = [
  path.join(rootDir, 'product-detail.html'),
  path.join(rootDir, 'public', 'product-detail.html')
];

const targetHtml = /<div style="margin-top: 80px; padding-bottom: 90px;">\s*<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;">/;

const replacementHtml = `<div class="detail-related-section">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">`;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (targetHtml.test(content)) {
    content = content.replace(targetHtml, replacementHtml);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated HTML related section in ${file}`);
  } else {
    console.log(`Could not match HTML target in ${file}`);
  }
});

// 2. Update components.css files
const componentsCssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

const targetBodyPadding = /body\.product-page-active\s*\{\s*padding-bottom:\s*84px;\s*\}/;

const replacementBodyPadding = `body.product-page-active {
  padding-bottom: 0 !important;
}

.product-page-active .site-footer {
  padding-bottom: 96px;
}

.detail-related-section {
  margin-top: 56px;
  padding-bottom: 24px;
}

@media (max-width: 768px) {
  .detail-related-section {
    margin-top: 36px;
    padding-bottom: 16px;
  }
}`;

componentsCssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (targetBodyPadding.test(content)) {
    content = content.replace(targetBodyPadding, replacementBodyPadding);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated components.css body padding in ${file}`);
  } else {
    console.log(`Could not match body padding in ${file}`);
  }
});

// 3. Update style.css files
const styleCssFiles = [
  path.join(rootDir, 'css', 'style.css'),
  path.join(rootDir, 'public', 'css', 'style.css')
];

const targetMainPadding = /\.product-page-active\s*#mainContent\s*\{\s*padding-bottom:\s*100px\s*!important;\s*\}/;

const replacementMainPadding = `.product-page-active #mainContent {
    padding-bottom: 16px !important;
  }`;

styleCssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (targetMainPadding.test(content)) {
    content = content.replace(targetMainPadding, replacementMainPadding);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated style.css main padding in ${file}`);
  } else {
    console.log(`Could not match main padding in ${file}`);
  }
});

console.log('Finished updating files to remove blank spaces!');
