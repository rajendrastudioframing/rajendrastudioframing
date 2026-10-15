const fs = require('fs');
const path = require('path');

const NEW_EDIT_MODAL = `  <!-- ==========================================================================
       MODAL: EDIT PRODUCT & DETAILS
       ========================================================================== -->
  <div class="admin-modal-overlay" id="editProductModal">
    <div class="admin-modal" style="max-width: 680px; width: 95%;">
      <div class="admin-modal-header">
        <div>
          <h4 class="admin-modal-title">Edit Product Details &amp; Pricing</h4>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Update product image, pricing, categories, stock, descriptions, and specifications.</div>
        </div>
        <button type="button" class="admin-modal-close" onclick="closeEditProductModal()">&times;</button>
      </div>
      <form id="editProductForm">
        <div class="admin-modal-body">
          <input type="hidden" id="editProductId" />
          <input type="hidden" id="editProductCurrentImage" />

          <!-- Row 1: Product Name & Category -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Product Name *</label>
              <input type="text" class="setting-input" id="editProductName" placeholder="e.g. Glass Photo Frame" required />
            </div>
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Category *</label>
              <select class="setting-select" id="editProductCategory" required>
                <option value="frames">Studio &amp; Framing</option>
                <option value="personalized">Personalized Printing</option>
                <option value="office">Office Printing</option>
                <option value="custom">Custom Printing</option>
                <option value="gifts">Photo Gifts &amp; Keepsakes</option>
              </select>
            </div>
          </div>

          <!-- Row 2: Price, Original Price / MRP & Badge -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Selling Price (₹) *</label>
              <input type="number" class="setting-input" id="editProductPrice" min="0" required />
            </div>
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">MRP / Original Price (₹)</label>
              <input type="number" class="setting-input" id="editProductOriginalPrice" min="0" placeholder="Optional (e.g. 999)" />
            </div>
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Marketing Badge</label>
              <select class="setting-select" id="editProductBadge">
                <option value="">None</option>
                <option value="Bestseller">Bestseller</option>
                <option value="Trending">Trending</option>
                <option value="Hot Deal">Hot Deal</option>
                <option value="New Arrival">New Arrival</option>
                <option value="Premium Choice">Premium Choice</option>
                <option value="Eco-Friendly">Eco-Friendly</option>
              </select>
            </div>
          </div>

          <!-- Row 3: Stock Status, Stock Quantity & Lead Time -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Stock Status *</label>
              <select class="setting-select" id="editProductStatus">
                <option value="In Stock">In Stock (Available)</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Limited Stock">Limited Stock</option>
                <option value="Made to Order">Made to Order</option>
              </select>
            </div>
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Stock Available (Units)</label>
              <input type="number" class="setting-input" id="editProductStockQty" min="0" placeholder="100" />
            </div>
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Lead / Delivery Time</label>
              <input type="text" class="setting-input" id="editProductLeadTime" placeholder="24 - 48 Hours" />
            </div>
          </div>

          <!-- Row 4: Product Image (Upload, Change, or Catalog Presets) -->
          <div class="setting-row" style="margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label class="setting-label" style="margin-bottom: 0;">Product Image</label>
              <div class="admin-image-mode-tabs">
                <button type="button" class="admin-tab-btn active" id="tabEditUploadImage" onclick="switchEditImageMode('upload')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Upload / Change
                </button>
                <button type="button" class="admin-tab-btn" id="tabEditPresetImage" onclick="switchEditImageMode('preset')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Catalog Presets
                </button>
              </div>
            </div>

            <!-- Upload Option for Edit -->
            <div id="editImageUploadBox">
              <input type="file" id="editProductImageFile" accept="image/png,image/jpeg,image/webp,image/jpg" style="display: none;" onchange="handleEditAdminImageUpload(event)" />
              <div class="admin-image-dropzone" id="editImageDropzone" onclick="document.getElementById('editProductImageFile').click()">
                <div class="dropzone-preview" id="editDropzonePreview" style="display: flex;">
                  <img id="editDropzonePreviewImg" src="assets/images/custom_canvas.jpg" alt="Preview" />
                  <div class="dropzone-preview-info">
                    <div class="preview-filename" id="editDropzoneFileName">Current Image</div>
                    <div class="preview-filesize" id="editDropzoneFileSize">Click or drop new photo to replace</div>
                    <button type="button" class="btn-remove-preview" onclick="event.stopPropagation(); document.getElementById('editProductImageFile').click();">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      Choose New Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preset Dropdown Option for Edit -->
            <div id="editImagePresetBox" style="display: none;">
              <select class="setting-select" id="editProductImagePreset" onchange="handleEditPresetChange(this.value)">
                <option value="assets/images/glass_frame.jpg">Classic Glass Photo Frame</option>
                <option value="assets/images/plastic_frame.jpg">Matte Black Plastic Frame</option>
                <option value="assets/images/printed_bottle.jpg">Insulated Steel Bottle (Black)</option>
                <option value="assets/images/printed_bottle_blue.jpg">Insulated Steel Bottle (Navy Blue)</option>
                <option value="assets/images/printed_bottle_silver.jpg">Insulated Steel Bottle (Silver)</option>
                <option value="assets/images/custom_mug.jpg">Ceramic Coffee Mug (White)</option>
                <option value="assets/images/custom_mug_black.jpg">Magic Coffee Mug (Black)</option>
                <option value="assets/images/printed_file.jpg">Office File Binder (Navy Blue)</option>
                <option value="assets/images/printed_file_green.jpg">Office File Binder (Forest Green)</option>
                <option value="assets/images/printed_file_black.jpg">Office File Binder (Charcoal Black)</option>
                <option value="assets/images/printed_folder_navy.jpg">Executive Presentation Folder (Navy)</option>
                <option value="assets/images/printed_folder_green.jpg">Executive Presentation Folder (Green)</option>
                <option value="assets/images/printed_folder_black.jpg">Executive Presentation Folder (Black)</option>
                <option value="assets/images/custom_canvas.jpg">Fine Art Canvas Gallery Wrap</option>
              </select>
            </div>
          </div>

          <!-- Row 5: Specifications: Material & Printing Type -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Primary Material</label>
              <input type="text" class="setting-input" id="editProductMaterial" placeholder="Optically Clear Float Glass, Archival Canvas, etc." />
            </div>
            <div class="setting-row" style="margin-bottom: 0;">
              <label class="setting-label">Printing Type / Technique</label>
              <input type="text" class="setting-input" id="editProductPrintingType" placeholder="12-Color Archival Pigment, Dye Sublimation, etc." />
            </div>
          </div>

          <!-- Row 6: Short Description & Detailed Full Description -->
          <div class="setting-row" style="margin-bottom: 12px;">
            <label class="setting-label">Short Description (Catalog Summary)</label>
            <textarea class="setting-input" id="editProductDesc" rows="2" placeholder="Brief summary displayed on catalog card..."></textarea>
          </div>

          <div class="setting-row" style="margin-bottom: 14px;">
            <label class="setting-label">Full Detailed Description (Product Details Page)</label>
            <textarea class="setting-input" id="editProductFullDesc" rows="3" placeholder="Comprehensive description, product features, and craft notes..."></textarea>
          </div>

          <!-- Row 7: Size Options -->
          <div class="setting-row" style="margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label class="setting-label" style="margin-bottom: 0;">Available Sizes</label>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Toggle standard sizes or type custom comma-separated</span>
            </div>
            <div class="admin-pill-group" id="editSizePills">
              <button type="button" class="admin-choice-pill" data-size='6" × 8"' onclick="toggleAdminPill(this)">6" × 8"</button>
              <button type="button" class="admin-choice-pill" data-size='8" × 10"' onclick="toggleAdminPill(this)">8" × 10"</button>
              <button type="button" class="admin-choice-pill" data-size='10" × 12"' onclick="toggleAdminPill(this)">10" × 12"</button>
              <button type="button" class="admin-choice-pill" data-size='12" × 18"' onclick="toggleAdminPill(this)">12" × 18"</button>
              <button type="button" class="admin-choice-pill" data-size='16" × 24"' onclick="toggleAdminPill(this)">16" × 24"</button>
              <button type="button" class="admin-choice-pill" data-size='20" × 30"' onclick="toggleAdminPill(this)">20" × 30"</button>
              <button type="button" class="admin-choice-pill" data-size='A4 (8.3" × 11.7")' onclick="toggleAdminPill(this)">A4</button>
              <button type="button" class="admin-choice-pill" data-size='A3 (11.7" × 16.5")' onclick="toggleAdminPill(this)">A3</button>
            </div>
            <input type="text" class="setting-input" id="editProductCustomSizes" style="margin-top: 8px; font-size: 0.8rem;" placeholder="Custom sizes (comma separated, e.g. 14&quot; × 20&quot;, 24&quot; × 36&quot;)" />
          </div>

          <!-- Row 8: Color / Finish Options -->
          <div class="setting-row" style="margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label class="setting-label" style="margin-bottom: 0;">Color &amp; Finish Options</label>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Choose available product colors / frame finishes</span>
            </div>
            <div class="admin-color-swatches" id="editColorSwatches">
              <button type="button" class="admin-color-chip" data-name="Warm Gold" data-color="#C99A3D" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #C99A3D;"></span>
                <span>Warm Gold</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="admin-color-chip" data-name="Matte Black" data-color="#111111" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #111111;"></span>
                <span>Matte Black</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="admin-color-chip" data-name="Brushed Silver" data-color="#C0C0C0" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #C0C0C0; border: 1px solid #ddd;"></span>
                <span>Silver</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="admin-color-chip" data-name="Rose Gold" data-color="#B76E79" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #B76E79;"></span>
                <span>Rose Gold</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="admin-color-chip" data-name="Walnut Wood" data-color="#6A432D" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #6A432D;"></span>
                <span>Walnut</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="admin-color-chip" data-name="Pure White" data-color="#FFFFFF" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #FFFFFF; border: 1px solid #ccc;"></span>
                <span>White</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="admin-color-chip" data-name="Royal Navy" data-color="#1E3A8A" onclick="toggleAdminColor(this)">
                <span class="color-dot" style="background-color: #1E3A8A;"></span>
                <span>Navy Blue</span>
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
            </div>
            <!-- Custom color adder for Edit -->
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <input type="color" id="editProductCustomColorPicker" value="#8B5CF6" style="width: 32px; height: 32px; padding: 2px; border-radius: 6px; border: 1px solid var(--border-medium); cursor: pointer; background: transparent;" title="Pick custom color" />
              <input type="text" class="setting-input" id="editProductCustomColorName" style="flex: 1; font-size: 0.8rem;" placeholder="Custom color name (e.g. Emerald Green)" />
              <button type="button" class="btn-sub-action outline" style="padding: 6px 12px; font-size: 0.78rem; white-space: nowrap;" onclick="addCustomEditColor()">+ Add Color</button>
            </div>
          </div>

          <!-- Row 9: Variant / Style Options -->
          <div class="setting-row" style="margin-bottom: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label class="setting-label" style="margin-bottom: 0;">Variant / Finish Styles</label>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Finish styles &amp; mounting types</span>
            </div>
            <div class="admin-pill-group" id="editVariantPills">
              <button type="button" class="admin-choice-pill" data-variant="Matte Finish" onclick="toggleAdminPill(this)">Matte Finish</button>
              <button type="button" class="admin-choice-pill" data-variant="Glossy Finish" onclick="toggleAdminPill(this)">Glossy Finish</button>
              <button type="button" class="admin-choice-pill" data-variant="Textured Canvas" onclick="toggleAdminPill(this)">Textured Canvas</button>
              <button type="button" class="admin-choice-pill" data-variant="Floating Frame" onclick="toggleAdminPill(this)">Floating Frame</button>
              <button type="button" class="admin-choice-pill" data-variant="Metallic Finish" onclick="toggleAdminPill(this)">Metallic Finish</button>
            </div>
            <input type="text" class="setting-input" id="editProductCustomVariants" style="margin-top: 8px; font-size: 0.8rem;" placeholder="Custom variant styles (comma separated, e.g. Beveled Edge, Acrylic Stand-off)" />
          </div>

        </div>
        <div class="admin-modal-footer">
          <button type="button" class="btn-sub-action outline" onclick="closeEditProductModal()">
            Cancel
          </button>
          <button type="submit" class="btn-sub-action primary" id="btnSaveEditProduct">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Save &amp; Update Product</span>
          </button>
        </div>
      </form>
    </div>
  </div>`;

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old editProductModal block
  const startPattern = /<!-- =+[\r\n\s]+MODAL:\s*EDIT PRODUCT[\s\S]*?id="editProductModal"[\s\S]*?<\/div>[\r\n\s]+<\/div>/i;
  
  if (startPattern.test(content)) {
    content = content.replace(startPattern, NEW_EDIT_MODAL);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated editProductModal in:', filePath);
  } else {
    // Try matching just the div
    const divPattern = /<div class="admin-modal-overlay" id="editProductModal">[\s\S]*?<\/div>[\r\n\s]+<\/div>/i;
    if (divPattern.test(content)) {
      content = content.replace(divPattern, NEW_EDIT_MODAL);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully updated editProductModal (div match) in:', filePath);
    } else {
      console.error('Could not find editProductModal pattern in:', filePath);
    }
  }
}

const pubAdmin = path.join(__dirname, '..', 'public', 'admin.html');
const rootAdmin = path.join(__dirname, '..', 'admin.html');

updateFile(pubAdmin);
updateFile(rootAdmin);
