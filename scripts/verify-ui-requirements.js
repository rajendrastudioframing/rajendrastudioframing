const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Verify data/products.json
const products = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'products.json'), 'utf-8'));
assert(Array.isArray(products) && products.length === 125, `Total products must be 125 (Found: ${products.length})`);

const cat1 = products.filter(p => p.category === 'frames');
const cat2 = products.filter(p => p.category === 'personalized');
const cat3 = products.filter(p => p.category === 'office');
const cat4 = products.filter(p => p.category === 'custom');
const cat5 = products.filter(p => p.category === 'gifts');

assert(cat1.length === 25, `Category 1 (Studio & Framing) has 25 products (Found: ${cat1.length})`);
assert(cat2.length === 25, `Category 2 (Personalized Printing) has 25 products (Found: ${cat2.length})`);
assert(cat3.length === 25, `Category 3 (Office Printing) has 25 products (Found: ${cat3.length})`);
assert(cat4.length === 25, `Category 4 (Custom Printing) has 25 products (Found: ${cat4.length})`);
assert(cat5.length === 25, `Category 5 (Photo Gifts & Keepsakes) has 25 products (Found: ${cat5.length})`);

// Verify first category in dataset is frames
assert(products[0].category === 'frames', `First category in dataset must be Studio & Framing / frames (Found: ${products[0].category})`);

// Verify all products have valid images, prices, ids
const invalidProds = products.filter(p => !p.id || !p.name || typeof p.price !== 'number' || !p.image);
assert(invalidProds.length === 0, `All 125 products have valid id, name, numeric price, and image (Invalid: ${invalidProds.length})`);

// 2. Verify index.html & public/index.html
['index.html', 'public/index.html'].forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');

  // 5 Categories present
  assert(content.includes('id="cat-frames"'), `${file} contains Category 1 (cat-frames)`);
  assert(content.includes('id="cat-personalized"'), `${file} contains Category 2 (cat-personalized)`);
  assert(content.includes('id="cat-office"'), `${file} contains Category 3 (cat-office)`);
  assert(content.includes('id="cat-custom"'), `${file} contains Category 4 (cat-custom)`);
  assert(content.includes('id="cat-gifts"'), `${file} contains Category 5 (cat-gifts)`);

  // Category navigation jump section
  assert(content.includes('id="categoriesSection"'), `${file} contains Category Navigation section (#categoriesSection)`);
  assert(content.includes('data-cat-target="cat-frames"'), `${file} has jump pill to Studio & Framing`);
  assert(content.includes('data-cat-target="cat-gifts"'), `${file} has jump pill to Gifts`);

  // 125 product cards
  const cardMatches = content.match(/class="product-card"/g) || [];
  assert(cardMatches.length >= 125, `${file} renders at least 125 product cards (Found: ${cardMatches.length})`);

  // Desktop nav menu: Categories, Products, Cart, Wishlist, Profile
  assert(content.includes('title="Categories"') && content.includes('Categories</span>'), `${file} desktop nav has Categories`);
  assert(content.includes('title="Products"') && content.includes('Products</span>'), `${file} desktop nav has Products`);
  assert(content.includes('title="Cart"') && content.includes('Cart</span>'), `${file} desktop nav has Cart`);
  assert(content.includes('title="Wishlist"') && content.includes('Wishlist</span>'), `${file} desktop nav has Wishlist`);
  assert(content.includes('title="Profile"') && content.includes('Profile</span>'), `${file} desktop nav has Profile`);

  // Mobile bottom nav bar: 5 items
  assert(content.includes('id="mobileBottomNav"'), `${file} has mobile bottom nav (#mobileBottomNav)`);
  assert(content.includes('id="mobileNavCategories"'), `${file} mobile bottom nav has Categories`);
  assert(content.includes('id="mobileNavProducts"'), `${file} mobile bottom nav has Products`);
  assert(content.includes('id="mobileNavCart"'), `${file} mobile bottom nav has Cart`);
  assert(content.includes('id="mobileNavWishlist"'), `${file} mobile bottom nav has Wishlist`);
  assert(content.includes('id="mobileNavProfile"'), `${file} mobile bottom nav has Profile`);

  // Cart and wishlist live count badges
  assert(content.includes('id="navbarCartBadge"'), `${file} desktop cart badge exists`);
  assert(content.includes('id="mobileNavCartBadge"'), `${file} mobile cart badge exists`);
  assert(content.includes('id="navbarWishlistBadge"'), `${file} desktop wishlist badge exists`);
  assert(content.includes('id="mobileNavWishlistBadge"'), `${file} mobile wishlist badge exists`);

  // Stylesheet
  assert(content.includes('css/ecom-ui.css'), `${file} links to css/ecom-ui.css`);
});

// 3. Verify products.html & public/products.html
['products.html', 'public/products.html'].forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
  assert(content.includes('data-filter="gifts"'), `${file} contains data-filter="gifts"`);
  assert(content.includes('data-filter="frames"'), `${file} contains data-filter="frames"`);
  assert(content.includes('id="mobileBottomNav"'), `${file} contains mobile bottom nav`);
});

// 4. Verify CSS responsive layout & rules
['css/ecom-ui.css', 'public/css/ecom-ui.css'].forEach(file => {
  const css = fs.readFileSync(path.join(rootDir, file), 'utf-8');

  // Desktop: 4-5 cards per row
  assert(css.includes('repeat(5, minmax(0, 1fr))'), `${file} has 5 columns on wide desktop`);
  assert(css.includes('repeat(4, minmax(0, 1fr))'), `${file} has 4 columns on laptop`);

  // Tablet: 2-3 cards per row
  assert(css.includes('repeat(3, minmax(0, 1fr))'), `${file} has 3 columns on tablet`);

  // Mobile: 2 cards per row
  assert(css.includes('repeat(2, minmax(0, 1fr))'), `${file} has 2 columns on mobile`);

  // Fixed bottom nav on mobile
  assert(css.includes('position: fixed;'), `${file} mobile nav is position: fixed`);
  assert(css.includes('bottom: 0;'), `${file} mobile nav is bottom: 0`);
  assert(css.includes('safe-area-inset-bottom'), `${file} mobile nav respects safe-area-inset-bottom`);
  assert(css.includes('padding-bottom: calc(75px'), `${file} has page bottom clearance`);
});

console.log(`\n========================================`);
console.log(`VERIFICATION SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
}
