const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update HTML files
const htmlFiles = [
  path.join(rootDir, 'product-detail.html'),
  path.join(rootDir, 'public', 'product-detail.html')
];

const oldHtmlSnippet = `<div class="tab-nav-wrap">
          <div class="tab-nav">
            <button type="button" class="tab-trigger active" data-tab="tabOverview">Product Details</button>
            <button type="button" class="tab-trigger" data-tab="tabSpecs">Specifications &amp; Materials</button>
            <button type="button" class="tab-trigger" data-tab="tabCraft">Craftsmanship Process</button>
          </div>
        </div>`;

const newHtmlSnippet = `<div class="tab-nav-wrap">
          <div class="tab-nav">
            <button type="button" class="tab-trigger active" data-tab="tabOverview">
              <span class="tab-text-full">Product Details</span>
              <span class="tab-text-compact">Details</span>
            </button>
            <button type="button" class="tab-trigger" data-tab="tabSpecs">
              <span class="tab-text-full">Specifications &amp; Materials</span>
              <span class="tab-text-compact">Specifications</span>
            </button>
            <button type="button" class="tab-trigger" data-tab="tabCraft">
              <span class="tab-text-full">Craftsmanship Process</span>
              <span class="tab-text-compact">Craftsmanship</span>
            </button>
          </div>
        </div>`;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  // Match using regex to handle potential indentation/CRLF differences
  const tabRegex = /<div class="tab-nav-wrap">[\s\S]*?<div class="tab-nav">[\s\S]*?Product Details<\/button>[\s\S]*?Specifications &amp; Materials<\/button>[\s\S]*?Craftsmanship Process<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
  if (tabRegex.test(content)) {
    content = content.replace(tabRegex, newHtmlSnippet);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated HTML tab triggers in ${file}`);
  } else {
    console.log(`Failed to match HTML tabs in ${file}`);
  }
});

// 2. Update CSS files
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

const oldCssPattern = /\.tab-nav-wrap\s*\{[\s\S]*?\.tab-trigger\.active\s*\{[\s\S]*?\}/;

const newCssRules = `.tab-nav-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
}

.tab-nav {
  display: flex;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  background: #F1ECE1;
  padding: 6px;
  border-radius: 9999px;
  gap: 6px;
  border: 1px solid var(--cream-border);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.tab-trigger {
  padding: 12px 24px;
  font-family: var(--font-heading);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-trigger:hover {
  color: var(--primary-black);
}

.tab-trigger.active {
  background: #111111;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.tab-text-compact {
  display: none;
}

.tab-text-full {
  display: inline;
}

/* Responsive Segmented Tabs (Eliminates horizontal scrolling, clipping, and black arc on mobile) */
@media (max-width: 680px) {
  .tabs-container {
    margin-top: 36px;
  }

  .tab-nav-wrap {
    width: 100%;
    margin-bottom: 18px;
  }

  .tab-nav {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 4px;
    gap: 4px;
    border-radius: 9999px;
    background: #F1ECE1;
    overflow: visible;
  }

  .tab-trigger {
    width: 100%;
    padding: 9px 4px;
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: center;
    border-radius: 9999px;
    white-space: nowrap;
    justify-content: center;
  }

  .tab-text-full {
    display: none;
  }

  .tab-text-compact {
    display: inline;
  }
}

@media (max-width: 380px) {
  .tab-trigger {
    font-size: 0.75rem;
    padding: 8px 2px;
  }
}`;

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (oldCssPattern.test(content)) {
    content = content.replace(oldCssPattern, newCssRules);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated CSS tabs in ${file}`);
  } else {
    console.log(`Failed to match CSS tabs in ${file}`);
  }
});

console.log('Tab fix script executed successfully!');
