const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://rajendrastudioframing.vercel.app/api/products';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.success || !Array.isArray(parsed.products)) {
        console.error('Failed to get valid products array:', parsed);
        return;
      }

      const products = parsed.products;
      console.log(`Fetched ${products.length} products from live Admin/Database:`);
      products.forEach((p, i) => console.log(`  ${i+1}. ${p.name} (${p.id}) [${p.category}] - Rs.${p.price}`));

      // 1. Write data/products.json
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const productsJsonPath = path.join(dataDir, 'products.json');
      fs.writeFileSync(productsJsonPath, JSON.stringify(products, null, 2), 'utf8');
      console.log('✅ Updated data/products.json');

      // 2. Write public/data/products.json if public/data exists
      const pubDataDir = path.join(__dirname, '..', 'public', 'data');
      if (fs.existsSync(pubDataDir)) {
        fs.writeFileSync(path.join(pubDataDir, 'products.json'), JSON.stringify(products, null, 2), 'utf8');
        console.log('✅ Updated public/data/products.json');
      }

      // 3. Generate js/products-data.js
      const jsContent = `/**
 * RAJENDRA STUDIO & FRAMING - MASTER PRODUCTS CATALOG DATA
 * Total: ${products.length} products - Synchronized with Admin Panel & Database
 */

const PRODUCTS_DATA = ${JSON.stringify(products, null, 2)};

// Browser window global export
if (typeof window !== 'undefined') {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
}

// CommonJS export for Node.js / testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRODUCTS_DATA;
}
`;

      const jsPath = path.join(__dirname, '..', 'js', 'products-data.js');
      const pubJsPath = path.join(__dirname, '..', 'public', 'js', 'products-data.js');

      fs.writeFileSync(jsPath, jsContent, 'utf8');
      console.log('✅ Updated js/products-data.js');

      fs.writeFileSync(pubJsPath, jsContent, 'utf8');
      console.log('✅ Updated public/js/products-data.js');

    } catch (e) {
      console.error('Error parsing live products:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching live products:', err.message);
});
