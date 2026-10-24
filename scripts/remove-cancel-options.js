const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Remove Cancelled tab from orders.html and public/orders.html
const ordersFiles = [
  path.join(rootDir, 'orders.html'),
  path.join(rootDir, 'public', 'orders.html')
];

ordersFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  const cancelledBtnRegex = /\s*<button type="button" class="orders-tab-btn" data-tab="cancelled" onclick="switchOrdersTab\('cancelled'\)">[\s\S]*?<\/button>/;
  if (cancelledBtnRegex.test(content)) {
    content = content.replace(cancelledBtnRegex, '');
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Removed Cancelled tab from ${f}`);
  } else {
    console.log(`Cancelled tab not found in ${f}`);
  }
});

// 2. Remove Cancelled pill tab from admin.html and public/admin.html
const adminFiles = [
  path.join(rootDir, 'admin.html'),
  path.join(rootDir, 'public', 'admin.html')
];

adminFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  const cancelledPillRegex = /\s*<button type="button" class="pill-tab-btn" data-filter="Cancelled">Cancelled<\/button>/;
  if (cancelledPillRegex.test(content)) {
    content = content.replace(cancelledPillRegex, '');
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Removed Cancelled pill tab from ${f}`);
  } else {
    console.log(`Cancelled pill tab not found in ${f}`);
  }
});

console.log('Finished removing cancel options!');
