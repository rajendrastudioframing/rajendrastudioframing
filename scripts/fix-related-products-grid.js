const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const relatedGridCss = `
/* Related Products Grid (Fixed 4 Columns on Desktop to eliminate empty 5th column space) */
#relatedProductsGrid {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px !important;
  width: 100% !important;
}

@media (max-width: 1200px) {
  #relatedProductsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 16px !important;
  }
}

@media (max-width: 640px) {
  #relatedProductsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }
}
`;

// 1. Update css/ecom-ui.css and public/css/ecom-ui.css
['css/ecom-ui.css', 'public/css/ecom-ui.css'].forEach(relPath => {
  const file = path.join(rootDir, relPath);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  if (!content.includes('#relatedProductsGrid')) {
    // Add right after .products-grid definitions
    content = content.replace(
      '/* Category See More / Show Less controls',
      `${relatedGridCss}\n/* Category See More / Show Less controls`
    );
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Added #relatedProductsGrid to ${relPath}`);
  } else {
    console.log(`${relPath} already has #relatedProductsGrid`);
  }
});

// 2. Update css/components.css and public/css/components.css
['css/components.css', 'public/css/components.css'].forEach(relPath => {
  const file = path.join(rootDir, relPath);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  if (!content.includes('#relatedProductsGrid')) {
    content += `\n${relatedGridCss}\n`;
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Added #relatedProductsGrid to ${relPath}`);
  } else {
    console.log(`${relPath} already has #relatedProductsGrid`);
  }
});

console.log('Related products grid fix applied successfully!');
