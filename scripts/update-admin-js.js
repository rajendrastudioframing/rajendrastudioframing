const fs = require('fs');
const path = require('path');

const NEW_EDIT_LOGIC = `  const editModal = document.getElementById('editProductModal');
  const editForm = document.getElementById('editProductForm');

  let uploadedEditProductImageBase64 = null;
  let editAdminImageMode = 'upload'; // 'upload' or 'preset'

  window.switchEditImageMode = (mode) => {
    editAdminImageMode = mode;
    const tabUpload = document.getElementById('tabEditUploadImage');
    const tabPreset = document.getElementById('tabEditPresetImage');
    const boxUpload = document.getElementById('editImageUploadBox');
    const boxPreset = document.getElementById('editImagePresetBox');

    if (mode === 'upload') {
      if (tabUpload) tabUpload.classList.add('active');
      if (tabPreset) tabPreset.classList.remove('active');
      if (boxUpload) boxUpload.style.display = 'block';
      if (boxPreset) boxPreset.style.display = 'none';
    } else {
      if (tabPreset) tabPreset.classList.add('active');
      if (tabUpload) tabUpload.classList.remove('active');
      if (boxPreset) boxPreset.style.display = 'block';
      if (boxUpload) boxUpload.style.display = 'none';
    }
  };

  window.handleEditAdminImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      uploadedEditProductImageBase64 = loadEvt.target.result;
      const previewImg = document.getElementById('editDropzonePreviewImg');
      const fileNameEl = document.getElementById('editDropzoneFileName');
      const fileSizeEl = document.getElementById('editDropzoneFileSize');

      if (previewImg) previewImg.src = uploadedEditProductImageBase64;
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (fileSizeEl) fileSizeEl.textContent = (file.size / 1024 < 1024) ? \`\${Math.round(file.size / 1024)} KB (Ready to save)\` : \`\${(file.size / (1024 * 1024)).toFixed(1)} MB (Ready to save)\`;
    };
    reader.readAsDataURL(file);
  };

  window.handleEditPresetChange = (presetUrl) => {
    uploadedEditProductImageBase64 = null;
    const previewImg = document.getElementById('editDropzonePreviewImg');
    const fileNameEl = document.getElementById('editDropzoneFileName');
    const fileSizeEl = document.getElementById('editDropzoneFileSize');
    if (previewImg) previewImg.src = presetUrl;
    if (fileNameEl) fileNameEl.textContent = presetUrl.split('/').pop();
    if (fileSizeEl) fileSizeEl.textContent = 'Catalog Preset Selected';
  };

  window.addCustomEditColor = () => {
    const picker = document.getElementById('editProductCustomColorPicker');
    const nameInput = document.getElementById('editProductCustomColorName');
    const swatches = document.getElementById('editColorSwatches');
    if (!swatches) return;

    const hex = picker ? picker.value : '#8B5CF6';
    let name = nameInput ? nameInput.value.trim() : '';
    if (!name) name = hex.toUpperCase();

    const existing = Array.from(swatches.querySelectorAll('.admin-color-chip')).find(
      el => el.getAttribute('data-name').toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      existing.classList.add('active');
      if (nameInput) nameInput.value = '';
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-color-chip active';
    btn.setAttribute('data-name', name);
    btn.setAttribute('data-color', hex);
    btn.onclick = function() { window.toggleAdminColor(this); };
    btn.innerHTML = \`
      <span class="color-dot" style="background-color: \${hex};"></span>
      <span>\${name}</span>
      <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
    \`;
    swatches.appendChild(btn);
    if (nameInput) nameInput.value = '';
  };

  // Drag and drop for edit dropzone
  const editDropzone = document.getElementById('editImageDropzone');
  if (editDropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      editDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        editDropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      editDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        editDropzone.classList.remove('dragover');
      });
    });
    editDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt ? dt.files : null;
      if (files && files.length > 0) {
        const fileInput = document.getElementById('editProductImageFile');
        if (fileInput) {
          fileInput.files = files;
          window.handleEditAdminImageUpload({ target: { files } });
        }
      }
    });
  }

  window.openEditProductModal = (id) => {
    const prod = allProducts.find(p => p.id === id);
    if (!prod || !editModal) return;

    uploadedEditProductImageBase64 = null;
    window.switchEditImageMode('upload');

    document.getElementById('editProductId').value = prod.id;
    document.getElementById('editProductCurrentImage').value = prod.image || '';
    document.getElementById('editProductName').value = prod.name || prod.title || '';
    
    const catEl = document.getElementById('editProductCategory');
    if (catEl) catEl.value = (prod.category || 'frames').toLowerCase();

    document.getElementById('editProductPrice').value = prod.price || '';
    const origPriceEl = document.getElementById('editProductOriginalPrice');
    if (origPriceEl) origPriceEl.value = prod.originalPrice || '';

    const badgeEl = document.getElementById('editProductBadge');
    if (badgeEl) badgeEl.value = prod.badge || '';

    const statusEl = document.getElementById('editProductStatus');
    if (statusEl) statusEl.value = prod.status || (prod.inStock ? 'In Stock' : 'Out of Stock');

    const stockQtyEl = document.getElementById('editProductStockQty');
    if (stockQtyEl) stockQtyEl.value = prod.stockQty !== undefined ? prod.stockQty : 100;

    const leadTimeEl = document.getElementById('editProductLeadTime');
    if (leadTimeEl) leadTimeEl.value = prod.leadTime || '24 - 48 Hours';

    const materialEl = document.getElementById('editProductMaterial');
    if (materialEl) materialEl.value = prod.material || prod.primaryMaterial || '';

    const printingTypeEl = document.getElementById('editProductPrintingType');
    if (printingTypeEl) printingTypeEl.value = prod.printingType || '';

    const descEl = document.getElementById('editProductDesc');
    if (descEl) descEl.value = prod.shortDescription || '';

    const fullDescEl = document.getElementById('editProductFullDesc');
    if (fullDescEl) fullDescEl.value = prod.description || prod.shortDescription || '';

    // Image preview
    const previewImg = document.getElementById('editDropzonePreviewImg');
    const fileNameEl = document.getElementById('editDropzoneFileName');
    const fileSizeEl = document.getElementById('editDropzoneFileSize');
    const fileInput = document.getElementById('editProductImageFile');
    if (fileInput) fileInput.value = '';

    const currentImgSrc = prod.image || 'assets/images/custom_canvas.jpg';
    if (previewImg) previewImg.src = currentImgSrc;
    if (fileNameEl) fileNameEl.textContent = prod.name || 'Current Image';
    if (fileSizeEl) fileSizeEl.textContent = currentImgSrc;

    // Preset selector sync
    const presetSelect = document.getElementById('editProductImagePreset');
    if (presetSelect) {
      if (Array.from(presetSelect.options).some(o => o.value === prod.image)) {
        presetSelect.value = prod.image;
      }
    }

    // Sizes
    const prodSizes = Array.isArray(prod.sizes) ? prod.sizes.map(s => typeof s === 'object' ? s.name : s) : [];
    const sizePills = document.querySelectorAll('#editSizePills .admin-choice-pill');
    const customSizes = [];
    sizePills.forEach(pill => {
      const pillSize = pill.getAttribute('data-size');
      if (prodSizes.some(s => s === pillSize)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    prodSizes.forEach(s => {
      if (!Array.from(sizePills).some(p => p.getAttribute('data-size') === s)) {
        customSizes.push(s);
      }
    });
    const customSizesEl = document.getElementById('editProductCustomSizes');
    if (customSizesEl) customSizesEl.value = customSizes.join(', ');

    // Color swatches
    const prodFinishes = Array.isArray(prod.finishes) ? prod.finishes : [];
    const colorChips = document.querySelectorAll('#editColorSwatches .admin-color-chip');
    colorChips.forEach(chip => {
      const chipName = chip.getAttribute('data-name');
      const match = prodFinishes.find(f => (f.name && f.name.toLowerCase().includes(chipName.toLowerCase())) || (f.id && f.id.toLowerCase().includes(chipName.toLowerCase())));
      if (match) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Variant pills
    const variantPills = document.querySelectorAll('#editVariantPills .admin-choice-pill');
    variantPills.forEach(pill => {
      const vName = pill.getAttribute('data-variant');
      const match = prodFinishes.some(f => f.name && f.name.toLowerCase().includes(vName.toLowerCase()));
      if (match) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    editModal.classList.add('open');
  };

  window.closeEditProductModal = () => {
    if (editModal) editModal.classList.remove('open');
  };

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editProductId').value;
      const prod = allProducts.find(p => p.id === id);
      const name = document.getElementById('editProductName').value.trim();
      const category = document.getElementById('editProductCategory') ? document.getElementById('editProductCategory').value : (prod ? prod.category : 'frames');
      const price = document.getElementById('editProductPrice').value;
      const origPriceVal = document.getElementById('editProductOriginalPrice') ? document.getElementById('editProductOriginalPrice').value.trim() : '';
      const originalPrice = origPriceVal ? Number(origPriceVal) : null;
      const badge = document.getElementById('editProductBadge') ? document.getElementById('editProductBadge').value.trim() : '';
      const status = document.getElementById('editProductStatus') ? document.getElementById('editProductStatus').value : 'In Stock';
      const stockQtyVal = document.getElementById('editProductStockQty') ? document.getElementById('editProductStockQty').value : 100;
      const leadTime = document.getElementById('editProductLeadTime') ? document.getElementById('editProductLeadTime').value.trim() : '24 - 48 Hours';
      const material = document.getElementById('editProductMaterial') ? document.getElementById('editProductMaterial').value.trim() : '';
      const printingType = document.getElementById('editProductPrintingType') ? document.getElementById('editProductPrintingType').value.trim() : '';
      const desc = document.getElementById('editProductDesc') ? document.getElementById('editProductDesc').value.trim() : '';
      const fullDesc = document.getElementById('editProductFullDesc') ? document.getElementById('editProductFullDesc').value.trim() : desc;

      // Sizes
      const activeSizePills = Array.from(document.querySelectorAll('#editSizePills .admin-choice-pill.active')).map(p => p.getAttribute('data-size')).filter(Boolean);
      const customSizesVal = document.getElementById('editProductCustomSizes') ? document.getElementById('editProductCustomSizes').value.trim() : '';
      if (customSizesVal) {
        customSizesVal.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
          if (!activeSizePills.includes(s)) activeSizePills.push(s);
        });
      }
      const resolvedSizes = (activeSizePills.length > 0 ? activeSizePills : ['8" × 10"', '10" × 12"', '12" × 18"']).map((s, idx) => ({
        name: s,
        price: Math.round(Number(price) * (1 + (idx * 0.25)))
      }));

      // Colors / Finishes
      const activeColorChips = Array.from(document.querySelectorAll('#editColorSwatches .admin-color-chip.active')).map((c, idx) => ({
        id: \`finish-\${idx + 1}\`,
        name: c.getAttribute('data-name'),
        color: c.getAttribute('data-color'),
        image: prod ? prod.image : 'assets/images/custom_canvas.jpg',
        priceDelta: 0
      }));

      // Final image resolution
      let finalImage = document.getElementById('editProductCurrentImage').value;
      if (editAdminImageMode === 'upload' && uploadedEditProductImageBase64) {
        finalImage = uploadedEditProductImageBase64;
      } else if (editAdminImageMode === 'preset') {
        const presetEl = document.getElementById('editProductImagePreset');
        if (presetEl && presetEl.value) finalImage = presetEl.value;
      }

      const saveBtn = document.getElementById('btnSaveEditProduct');
      const originalBtnHtml = saveBtn ? saveBtn.innerHTML : 'Save Changes';
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>Saving...</span>';
      }

      try {
        const res = await fetch(\`\${API_BASE}/api/admin/products/\${encodeURIComponent(id)}\`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({
            name,
            category,
            categoryLabel: getCategoryLabel(category),
            price: Number(price),
            originalPrice,
            badge,
            status,
            stockQty: Number(stockQtyVal),
            leadTime,
            material,
            printingType,
            shortDescription: desc,
            description: fullDesc,
            image: finalImage,
            sizes: resolvedSizes,
            finishes: activeColorChips.length > 0 ? activeColorChips : (prod && prod.finishes ? prod.finishes : [])
          })
        });

        const data = await res.json();
        if (data.success) {
          closeEditProductModal();
          await loadProducts();
          showToast('Product Updated', \`"\${name}" updated successfully. Changes are now live on website!\`, 'success');
        } else {
          showToast('Update Failed', data.message || 'Update failed.', 'danger');
        }
      } catch (err) {
        console.error('Error updating product:', err);
        showToast('Error', 'Network error updating product.', 'danger');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }`;

function updateAdminJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  const oldPattern = /const editModal = document\.getElementById\('editProductModal'\);[\s\S]*?if \(editForm\) \{[\s\S]*?\}\s*\}\s*\}\s*window\.deleteProduct/i;
  
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, `${NEW_EDIT_LOGIC}\n}\n\nwindow.deleteProduct`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated edit product logic in:', filePath);
  } else {
    // Try alternate regex
    const altPattern = /const editModal = document\.getElementById\('editProductModal'\);[\s\S]*?editForm\.addEventListener\('submit'[\s\S]*?\}\);\s*\}\s*\}/i;
    if (altPattern.test(content)) {
      content = content.replace(altPattern, `${NEW_EDIT_LOGIC}\n}`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully updated edit product logic (alt pattern) in:', filePath);
    } else {
      console.error('Could not match edit logic in:', filePath);
    }
  }
}

const pubAdminJs = path.join(__dirname, '..', 'public', 'js', 'admin.js');
const rootAdminJs = path.join(__dirname, '..', 'js', 'admin.js');

updateAdminJs(pubAdminJs);
updateAdminJs(rootAdminJs);
