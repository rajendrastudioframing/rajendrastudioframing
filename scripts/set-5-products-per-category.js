const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const productsJsonPath = path.join(rootDir, 'data', 'products.json');
const jsDataPath = path.join(rootDir, 'js', 'products-data.js');
const publicJsDataPath = path.join(rootDir, 'public', 'js', 'products-data.js');
const generateCatalogPath = path.join(rootDir, 'scripts', 'generate-catalog.js');

// 1. Read existing products.json
const rawProducts = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

const categories = ['frames', 'personalized', 'office', 'custom', 'gifts'];
const selectedProducts = [];

categories.forEach(cat => {
  const catItems = rawProducts.filter(p => p.category === cat).slice(0, 5);
  console.log(`Category: ${cat} -> selected ${catItems.length} products`);
  selectedProducts.push(...catItems);
});

console.log(`Total filtered products: ${selectedProducts.length}`);

// 2. Write data/products.json
fs.writeFileSync(productsJsonPath, JSON.stringify(selectedProducts, null, 2), 'utf8');
console.log('Updated data/products.json');

// 3. Extract BUSINESS_INFO from js/products-data.js
let jsContent = fs.readFileSync(jsDataPath, 'utf8');
const businessInfoMatch = jsContent.match(/\/\/ Business contact data[\s\S]*$/);
const businessInfoStr = businessInfoMatch ? businessInfoMatch[0] : `const BUSINESS_INFO = {
  name: "Rajendra Studio & Framing",
  tagline: "Frames, Printing & Personalized Products",
  phone: "+91 95107 57513",
  phoneRaw: "+919510757513",
  whatsapp: "+91 95107 57513",
  whatsappNumber: "919510757513",
  email: "info@rajendrastudioandgifts.in",
  address: "Dahej GIDC, Bharuch, Gujarat 392130",
  workingHours: "Mon - Sat: 9:30 AM - 8:30 PM | Sun: 10:00 AM - 2:00 PM",
  establishedYear: 2008,
  framesCrafted: "25,000+",
  satisfiedClients: "18,500+",
  ratingScore: "4.9 / 5.0"
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS_DATA, BUSINESS_INFO };
}`;

const newJsContent = `/**
 * RAJENDRA STUDIO & FRAMING - MASTER PRODUCTS CATALOG DATA
 * 5 Categories (5 products each, Total: 25 products)
 */

const PRODUCTS_DATA = ${JSON.stringify(selectedProducts, null, 2)};

${businessInfoStr}
`;

fs.writeFileSync(jsDataPath, newJsContent, 'utf8');
fs.writeFileSync(publicJsDataPath, newJsContent, 'utf8');
console.log('Updated js/products-data.js & public/js/products-data.js');

// 4. Update scripts/generate-catalog.js lines
if (fs.existsSync(generateCatalogPath)) {
  let genContent = fs.readFileSync(generateCatalogPath, 'utf8');
  genContent = genContent.replace(
    /const allProducts = \[\s*\.\.\.category1_frames,\s*\.\.\.category2_personalized,\s*\.\.\.category3_office,\s*\.\.\.category4_custom,\s*\.\.\.category5_gifts\s*\];/,
    `const allProducts = [
  ...category1_frames.slice(0, 5),
  ...category2_personalized.slice(0, 5),
  ...category3_office.slice(0, 5),
  ...category4_custom.slice(0, 5),
  ...category5_gifts.slice(0, 5)
];`
  );
  genContent = genContent.replace(
    /\* 5 Categories \(25 products each, Total: 125 products\)/,
    '* 5 Categories (5 products each, Total: 25 products)'
  );
  fs.writeFileSync(generateCatalogPath, genContent, 'utf8');
  console.log('Updated scripts/generate-catalog.js');
}

// 5. Update categories.html and public/categories.html "25 Items" -> "5 Items"
['categories.html', 'public/categories.html'].forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<span class="category-card-count">25 Items<\/span>/g, '<span class="category-card-count">5 Items</span>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated category card counts in ${file}`);
  }
});

// 6. Update admin.html and public/admin.html "Showing 125 products" -> "Showing 25 products"
['admin.html', 'public/admin.html'].forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/Showing 125 products/g, 'Showing 25 products');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated product count in ${file}`);
  }
});

// 7. Update scripts/verify-ui-requirements.js assertions to 5 & 25
const verifyPath = path.join(rootDir, 'scripts', 'verify-ui-requirements.js');
if (fs.existsSync(verifyPath)) {
  let vContent = fs.readFileSync(verifyPath, 'utf8');
  vContent = vContent.replace(/products\.length === 125/g, 'products.length === 25');
  vContent = vContent.replace(/Total products must be 125/g, 'Total products must be 25');
  vContent = vContent.replace(/cat1\.length === 25/g, 'cat1.length === 5');
  vContent = vContent.replace(/cat2\.length === 25/g, 'cat2.length === 5');
  vContent = vContent.replace(/cat3\.length === 25/g, 'cat3.length === 5');
  vContent = vContent.replace(/cat4\.length === 25/g, 'cat4.length === 5');
  vContent = vContent.replace(/cat5\.length === 25/g, 'cat5.length === 5');
  vContent = vContent.replace(/has 25 products/g, 'has 5 products');
  vContent = vContent.replace(/All 125 products/g, 'All 25 products');
  fs.writeFileSync(verifyPath, vContent, 'utf8');
  console.log('Updated scripts/verify-ui-requirements.js');
}

console.log('=== Successfully updated catalog to 5 products per category! ===');
