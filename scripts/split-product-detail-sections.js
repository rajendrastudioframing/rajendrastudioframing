const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update HTML files
const htmlFiles = [
  path.join(rootDir, 'product-detail.html'),
  path.join(rootDir, 'public', 'product-detail.html')
];

const newHtmlCards = `          <!-- SECTION 1: Product Customization Card (Size & Finish) -->
          <div class="detail-card detail-customization-card">
            <!-- Available Sizes / Options -->
            <div class="option-group">
              <div class="option-header">
                <span class="option-name">Available Size:</span>
                <span class="option-value-selected" id="selectedSizeLabel">6" × 8"</span>
              </div>
              <div class="size-chips" id="detailSizesContainer"></div>

              <!-- Custom Size Builder Container (Shows when "Custom Size" is active) -->
              <div class="custom-size-builder-box" id="customSizeBuilderBox" style="display: none;">
                <div class="csb-header">
                  <div class="csb-title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color: var(--accent-gold);">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <span>Customize Your Exact Dimensions</span>
                  </div>
                  <span class="csb-badge">Custom Cut &amp; Fit</span>
                </div>

                <!-- Input Row: Width, "×", Height, and Unit -->
                <div class="csb-inputs-grid">
                  <div class="csb-input-group">
                    <label for="customSizeWidth" class="csb-label">Width</label>
                    <div class="csb-input-wrap">
                      <input type="number" id="customSizeWidth" class="csb-input" min="3" max="100" step="0.5" value="14" placeholder="14" />
                      <span class="csb-unit-tag" id="customWidthUnitTag">in</span>
                    </div>
                  </div>

                  <div class="csb-multiplier-sign">×</div>

                  <div class="csb-input-group">
                    <label for="customSizeHeight" class="csb-label">Height</label>
                    <div class="csb-input-wrap">
                      <input type="number" id="customSizeHeight" class="csb-input" min="3" max="100" step="0.5" value="20" placeholder="20" />
                      <span class="csb-unit-tag" id="customHeightUnitTag">in</span>
                    </div>
                  </div>

                  <div class="csb-input-group csb-unit-group">
                    <label for="customSizeUnit" class="csb-label">Unit</label>
                    <select id="customSizeUnit" class="csb-select">
                      <option value="in" selected>Inches (in)</option>
                      <option value="cm">Centimeters (cm)</option>
                      <option value="mm">Millimeters (mm)</option>
                      <option value="ft">Feet (ft)</option>
                    </select>
                  </div>
                </div>

                <!-- Quick Preset Dimension Buttons -->
                <div class="csb-presets-row">
                  <span class="csb-presets-label">Popular Custom Dimensions:</span>
                  <div class="csb-preset-chips" id="customSizePresets">
                    <button type="button" class="csb-preset-btn" data-w="8" data-h="12" data-u="in">8" × 12"</button>
                    <button type="button" class="csb-preset-btn active" data-w="14" data-h="20" data-u="in">14" × 20"</button>
                    <button type="button" class="csb-preset-btn" data-w="16" data-h="24" data-u="in">16" × 24"</button>
                    <button type="button" class="csb-preset-btn" data-w="18" data-h="24" data-u="in">18" × 24"</button>
                    <button type="button" class="csb-preset-btn" data-w="20" data-h="30" data-u="in">20" × 30"</button>
                    <button type="button" class="csb-preset-btn" data-w="24" data-h="36" data-u="in">24" × 36"</button>
                  </div>
                </div>

                <!-- Live Summary Pill & Note -->
                <div class="csb-summary-row">
                  <div class="csb-summary-pill">
                    <span class="csb-summary-dot"></span>
                    <span class="csb-summary-text" id="customSizeSummaryText">Custom Dimensions: 14" × 20" (280 sq. in.)</span>
                  </div>
                  <div class="csb-note-text">
                    Precision diamond-cut &amp; archival mounting to your exact custom specifications.
                  </div>
                </div>
              </div>
            </div>

            <!-- Finish / Color Swatches -->
            <div class="option-group" style="margin-top: 14px;">
              <div class="option-header">
                <span class="option-name" id="finishOptionTitle">Available Color / Finish:</span>
                <span class="option-value-selected" id="selectedFinishLabel">Warm Gold Standoffs</span>
              </div>
              <div class="swatch-group" id="detailFinishesContainer"></div>
            </div>
          </div>

          <!-- SECTION 2: Order & Action Card (Qty, Wishlist, Cart, Buy Now, Enquiries) -->
          <div class="detail-card detail-actions-card">
            <!-- Primary Action Row: Stepper + Wishlist + Add to Cart + Buy Now -->
            <div class="detail-primary-actions-row">
              <div class="detail-qty-stepper">
                <button type="button" class="qty-btn" id="detailQtyMinus" aria-label="Decrease quantity">−</button>
                <span class="qty-display" id="detailQtyValue">1</span>
                <button type="button" class="qty-btn" id="detailQtyPlus" aria-label="Increase quantity">+</button>
              </div>

              <button type="button" class="btn-detail-wishlist" id="detailWishlistBtn" onclick="toggleWishlist(typeof currentProduct !== 'undefined' &amp;&amp; currentProduct ? currentProduct.id : 'glass-frame-classic', event);" title="Add to Wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>

              <button type="button" class="btn btn-gold shimmer-effect btn-add-to-cart" id="detailAddToCartBtn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>Add to Cart</span>
              </button>

              <button type="button" class="btn btn-dark shimmer-effect btn-buy-now" id="detailBuyNowBtn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>Buy Now</span>
              </button>
            </div>

            <!-- Secondary Actions: WhatsApp + Quick Enquiry -->
            <div class="detail-secondary-actions-row">
              <button type="button" class="btn btn-whatsapp" id="detailWhatsAppBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.18-.553-1.638-.673-2.684-2.336-2.766-2.445-.082-.109-.661-.88-.661-1.678 0-.798.419-1.189.569-1.353.15-.164.33-.205.441-.205.111 0 .222.001.32.006.103.004.24-.039.375.285.144.344.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.087.186-.173.287-.087.1-.183.224-.262.301-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087.159.058 1.009.477 1.182.564.173.087.289.13.332.204.043.074.043.431-.101.836z"></path>
                </svg>
                <span>WhatsApp Enquiry</span>
              </button>

              <button type="button" class="btn btn-outline" id="detailQuoteBtn" data-open-quote>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>Quick Enquiry</span>
              </button>
            </div>
          </div>

          <!-- SECTION 3: Product Overview & Key Specs Card -->
          <div class="detail-card detail-overview-card">
            <!-- Short Description -->
            <p class="detail-desc-lead" id="detailDescLead">
              Premium handcrafted photo frames designed to give your memories an elegant and timeless look.
            </p>

            <!-- Compact Key Specs Strip -->
            <div class="detail-key-specs-compact">
              <span><strong>Material:</strong> <span id="detailMaterialLabel">Float Glass</span></span>
              <span>•</span>
              <span><strong>Print:</strong> <span id="detailPrintingLabel">12-Color HD</span></span>
              <span>•</span>
              <span><strong>Customization:</strong> <span id="detailCustomizationLabel">Custom Sizes &amp; Text</span></span>
              <span>•</span>
              <span><strong>Turnaround:</strong> <span id="detailLeadTimeLabel" style="color: var(--accent-gold); font-weight: 700;">24-48h</span></span>
            </div>
          </div>`;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // Regex to match the existing options box from start to end of .detail-options-box
  const boxRegex = /<!--\s*Customization & Purchase Options Box\s*-->\s*<div class="detail-options-box">[\s\S]*?<\/div>\s*<\/div>\s*<!--\s*Safe Transit Guarantee Bar/;
  
  if (boxRegex.test(content)) {
    content = content.replace(boxRegex, `${newHtmlCards}\n\n          <!-- Safe Transit Guarantee Bar`);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Replaced options box in ${file}`);
  } else {
    // Alternative match using class
    const altRegex = /<div class="detail-options-box">[\s\S]*?<!--\s*Safe Transit Guarantee Bar/;
    if (altRegex.test(content)) {
      content = content.replace(altRegex, `${newHtmlCards}\n\n          <!-- Safe Transit Guarantee Bar`);
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Replaced options box (alt regex) in ${file}`);
    } else {
      console.log(`Failed to match options box in ${file}`);
    }
  }
});

// 2. Update CSS files
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

const newCardCss = `
/* ==========================================================================
   PRODUCT DETAIL DISTINCT SECTION CARDS (Size/Finish, Actions, Overview)
   ========================================================================== */
.detail-card {
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
  transition: all 0.2s ease;
}

/* Card 1: Customization Card (Size & Color Options) */
.detail-customization-card {
  background: #FAFAF8;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.detail-customization-card:hover {
  border-color: rgba(201, 154, 61, 0.35);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

/* Card 2: Order & Actions Card (Interactive Purchase Center) */
.detail-actions-card {
  background: #FFFFFF;
  border: 1.5px solid rgba(201, 154, 61, 0.3);
  box-shadow: 0 4px 18px rgba(201, 154, 61, 0.08);
}

.detail-actions-card:hover {
  border-color: var(--accent-gold);
  box-shadow: 0 6px 24px rgba(201, 154, 61, 0.14);
}

.detail-actions-card .detail-primary-actions-row {
  margin-top: 0;
}

.detail-actions-card .detail-secondary-actions-row {
  margin-top: 10px;
}

/* Card 3: Overview & Specs Card */
.detail-overview-card {
  background: #FAFAF8;
  border: 1px solid rgba(0, 0, 0, 0.07);
}

.detail-overview-card:hover {
  border-color: rgba(201, 154, 61, 0.25);
}

.detail-overview-card .detail-desc-lead {
  margin: 0 0 10px 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #4B5563;
}

.detail-overview-card .detail-key-specs-compact {
  margin-top: 0;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}
`;

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('.detail-customization-card')) {
    content += `\n${newCardCss}\n`;
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Added distinct card CSS to ${file}`);
  }
});

console.log('All updates completed successfully!');
