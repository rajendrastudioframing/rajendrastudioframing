const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const htmlFiles = [
  'index.html',
  'products.html',
  'product-detail.html',
  'checkout.html',
  'track-order.html',
  'about.html',
  'contact.html',
  'public/index.html',
  'public/products.html',
  'public/product-detail.html',
  'public/checkout.html',
  'public/track-order.html',
  'public/about.html',
  'public/contact.html'
];

htmlFiles.forEach(relPath => {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Look for .navbar-actions containing the duplicate buttons:
  // <button type="button" class="navbar-wishlist-btn" ... </button>
  // <button type="button" class="navbar-cart-btn" ... </button>
  // <div class="nav-customer-slot" id="navCustomerSlot"> ... </div>
  // up until <button type="button" class="btn btn-gold ... navbar-quote-btn">

  const duplicatePattern = /<div class="navbar-actions">[\s\S]*?(<button[^>]*class="[^"]*navbar-quote-btn[^"]*"[^>]*>)/i;

  if (duplicatePattern.test(content)) {
    content = content.replace(
      duplicatePattern,
      `<div class="navbar-actions">\n          $1`
    );
    console.log(`Cleaned duplicate header actions in ${relPath}`);
  } else {
    console.log(`Pattern not matched in ${relPath}, checking manual replace`);
  }

  // Also clean up any trailing duplicate ID if any
  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('--- Verification ---');
htmlFiles.forEach(relPath => {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');

  const slotCount = (content.match(/class="nav-customer-slot"/g) || []).length;
  const cartBadgeCount = (content.match(/id="navbarCartBadge"/g) || []).length;
  const wishlistBadgeCount = (content.match(/id="navbarWishlistBadge"/g) || []).length;

  console.log(`${relPath} => nav-customer-slot: ${slotCount}, navbarCartBadge: ${cartBadgeCount}, navbarWishlistBadge: ${wishlistBadgeCount}`);
});
