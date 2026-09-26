/**
 * RAJESH FRAMING - DYNAMIC PRODUCT DETAILS CONTROLLER
 * Gallery switcher, interactive size & finish options, dynamic price calculation, and WhatsApp order generator
 */

function startProductDetail() {
  initProductDetailPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startProductDetail);
} else {
  startProductDetail();
}

let currentProduct = null;
let selectedSize = null;
let selectedFinish = null;

async function initProductDetailPage() {
  // Sync fresh products from server if available
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        window.PRODUCTS_DATA = data.products.map(p => {
          const existing = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []).find(e => e.id === p.id);
          return { ...existing, ...p };
        });
      }
    }
  } catch (e) {
    // Fallback to static PRODUCTS_DATA
  }

  if (typeof PRODUCTS_DATA === 'undefined') {
    console.warn('PRODUCTS_DATA is undefined');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || 'glass-frame-classic';

  currentProduct = PRODUCTS_DATA.find(p => p.id === productId) || PRODUCTS_DATA[0];

  selectedSize = currentProduct.sizes && currentProduct.sizes.length > 0 ? currentProduct.sizes[0] : null;
  selectedFinish = currentProduct.finishes && currentProduct.finishes.length > 0 ? currentProduct.finishes[0] : null;

  try {
    populateProductData();
  } catch (e) {
    console.error('Error in populateProductData:', e);
  }

  try {
    setupOptionInteractions();
  } catch (e) {
    console.error('Error in setupOptionInteractions:', e);
  }

  try {
    setupTabs();
  } catch (e) {
    console.error('Error in setupTabs:', e);
  }

  try {
    renderRelatedProducts();
  } catch (e) {
    console.error('Error in renderRelatedProducts:', e);
  }
}

function populateProductData() {
  const p = currentProduct;

  // Title & Breadcrumb
  document.title = `${p.name} | Rajesh Framing`;
  const breadcrumbEl = document.getElementById('productBreadcrumbCurrent');
  if (breadcrumbEl) breadcrumbEl.textContent = p.name;

  const categoryBreadcrumb = document.getElementById('productBreadcrumbCategory');
  if (categoryBreadcrumb) {
    categoryBreadcrumb.textContent = p.categoryLabel;
    categoryBreadcrumb.href = `products.html?category=${p.category}`;
  }

  // Badges & Category
  const badgeEl = document.getElementById('detailBadge');
  if (badgeEl) {
    if (p.badge) {
      badgeEl.textContent = p.badge;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  const categoryTag = document.getElementById('detailCategoryTag');
  if (categoryTag) categoryTag.textContent = p.categoryLabel;

  // Heading & Ratings
  const titleEl = document.getElementById('detailProductTitle');
  if (titleEl) titleEl.textContent = p.name;

  const ratingScore = document.getElementById('detailRatingScore');
  if (ratingScore) ratingScore.textContent = `${p.rating} / 5.0`;

  const reviewCount = document.getElementById('detailReviewCount');
  if (reviewCount) reviewCount.textContent = `(${p.reviewsCount} customer ratings)`;

  // Main Image
  const mainImg = document.getElementById('detailMainImg');
  if (mainImg) {
    mainImg.src = p.image;
    mainImg.alt = p.name;
  }

  // Thumbnails
  const thumbsContainer = document.getElementById('detailThumbsContainer');
  if (thumbsContainer) {
    const thumbs = [
      p.image,
      'assets/images/workshop.jpg',
      'assets/images/hero_showcase.jpg'
    ];

    thumbsContainer.innerHTML = thumbs.map((src, index) => `
      <div class="detail-thumb ${index === 0 ? 'active' : ''}" data-src="${src}">
        <img src="${src}" alt="${p.name} perspective ${index + 1}" />
      </div>
    `).join('');

    thumbsContainer.querySelectorAll('.detail-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbsContainer.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (mainImg) mainImg.src = thumb.getAttribute('data-src');
      });
    });
  }

  // Descriptions
  const descLead = document.getElementById('detailDescLead');
  if (descLead) descLead.textContent = p.description;

  // Features list in "Product Details"
  const featuresList = document.getElementById('detailFeaturesList');
  if (featuresList && p.features) {
    featuresList.innerHTML = p.features.map(f => `
      <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 0.9375rem; color: var(--text-secondary);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent-gold); margin-top: 3px; flex-shrink: 0;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // Specifications & Quick Attributes
  const specMaterial = document.getElementById('specMaterial');
  if (specMaterial) specMaterial.textContent = p.material;

  const detailMaterialLabel = document.getElementById('detailMaterialLabel');
  if (detailMaterialLabel) detailMaterialLabel.textContent = p.material;

  const specPrinting = document.getElementById('specPrinting');
  if (specPrinting) specPrinting.textContent = p.printingType;

  const detailPrintingLabel = document.getElementById('detailPrintingLabel');
  if (detailPrintingLabel) detailPrintingLabel.textContent = p.printingType;

  const specTurnaround = document.getElementById('specTurnaround');
  if (specTurnaround) specTurnaround.textContent = p.leadTime || '24 - 48 Hours';

  const detailLeadTimeLabel = document.getElementById('detailLeadTimeLabel');
  if (detailLeadTimeLabel) detailLeadTimeLabel.textContent = p.leadTime || '24 - 48 Hours';

  renderSizeOptions();
  renderFinishOptions();
  updatePriceDisplay();
}

function renderSizeOptions() {
  const container = document.getElementById('detailSizesContainer');
  if (!container || !currentProduct.sizes) return;

  container.innerHTML = currentProduct.sizes.map((s, idx) => `
    <button type="button" class="size-chip ${idx === 0 ? 'active' : ''}" data-size-name="${s.name}" data-size-price="${s.price}">
      ${s.name}
    </button>
  `).join('');

  container.querySelectorAll('.size-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.size-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const sizeName = chip.getAttribute('data-size-name');
      const sizePrice = parseFloat(chip.getAttribute('data-size-price'));
      selectedSize = { name: sizeName, price: sizePrice };

      const selectedDisplay = document.getElementById('selectedSizeLabel');
      if (selectedDisplay) selectedDisplay.textContent = sizeName;

      updatePriceDisplay();
    });
  });

  const selectedDisplay = document.getElementById('selectedSizeLabel');
  if (selectedDisplay && selectedSize) selectedDisplay.textContent = selectedSize.name;
}

function renderFinishOptions() {
  const container = document.getElementById('detailFinishesContainer');
  if (!container || !currentProduct.finishes) return;

  container.innerHTML = currentProduct.finishes.map((f, idx) => `
    <button type="button" class="color-swatch-item ${idx === 0 ? 'active' : ''}" 
      style="background-color: ${f.color};" 
      data-finish-id="${f.id}" 
      data-finish-name="${f.name}" 
      title="${f.name}">
    </button>
  `).join('');

  container.querySelectorAll('.color-swatch-item').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch-item').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      const finishName = swatch.getAttribute('data-finish-name');
      selectedFinish = { id: swatch.getAttribute('data-finish-id'), name: finishName };

      const selectedDisplay = document.getElementById('selectedFinishLabel');
      if (selectedDisplay) selectedDisplay.textContent = finishName;
    });
  });

  const selectedDisplay = document.getElementById('selectedFinishLabel');
  if (selectedDisplay && selectedFinish) selectedDisplay.textContent = selectedFinish.name;
}

function updatePriceDisplay() {
  const priceDisplay = document.getElementById('detailCurrentPrice');
  if (!priceDisplay) return;

  const currentPrice = selectedSize ? selectedSize.price : currentProduct.price;
  priceDisplay.textContent = `₹${currentPrice.toLocaleString('en-IN')}`;
}

let currentQuantity = 1;
let currentUploadedPhoto = null;

function setupOptionInteractions() {
  // Setup Photo Upload Dropzone
  setupPhotoUpload();

  // Quantity Stepper
  const minusBtn = document.getElementById('detailQtyMinus');
  const plusBtn = document.getElementById('detailQtyPlus');
  const qtyDisplay = document.getElementById('detailQtyValue');

  if (minusBtn && plusBtn && qtyDisplay) {
    minusBtn.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity -= 1;
        qtyDisplay.textContent = currentQuantity;
      }
    });

    plusBtn.addEventListener('click', () => {
      currentQuantity += 1;
      qtyDisplay.textContent = currentQuantity;
    });
  }

  // Add to Cart Button
  const addToCartBtn = document.getElementById('detailAddToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const sizeStr = selectedSize ? selectedSize.name : 'Standard';
      const finishStr = selectedFinish ? selectedFinish.name : 'Standard';
      const activePrice = selectedSize ? selectedSize.price : currentProduct.price;

      if (window.addToCart) {
        window.addToCart({
          id: currentProduct.id,
          name: currentProduct.name,
          price: activePrice,
          image: currentProduct.image,
          category: currentProduct.category,
          size: sizeStr,
          finish: finishStr,
          uploadedPhoto: currentUploadedPhoto ? { ...currentUploadedPhoto } : null,
          leadTime: currentProduct.leadTime || '24 - 48 Hours'
        }, currentQuantity, true);
      }
    });
  }

  // Buy Now Button (Direct Checkout)
  const buyNowBtn = document.getElementById('detailBuyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const sizeStr = selectedSize ? selectedSize.name : 'Standard';
      const finishStr = selectedFinish ? selectedFinish.name : 'Standard';
      const activePrice = selectedSize ? selectedSize.price : currentProduct.price;

      if (window.buyNow) {
        window.buyNow({
          id: currentProduct.id,
          name: currentProduct.name,
          price: activePrice,
          image: currentProduct.image,
          category: currentProduct.category,
          size: sizeStr,
          finish: finishStr,
          uploadedPhoto: currentUploadedPhoto ? { ...currentUploadedPhoto } : null,
          leadTime: currentProduct.leadTime || '24 - 48 Hours'
        }, currentQuantity);
      } else {
        window.location.href = `checkout.html?buyNow=${currentProduct.id}&qty=${currentQuantity}&size=${encodeURIComponent(sizeStr)}&finish=${encodeURIComponent(finishStr)}`;
      }
    });
  }
}

/**
 * Handle Photo Attachment & Drag/Drop Upload
 */
function setupPhotoUpload() {
  const dropzone = document.getElementById('photoDropzone');
  const fileInput = document.getElementById('photoFileInput');
  const emptyState = document.getElementById('dropzoneEmptyState');
  const previewState = document.getElementById('dropzonePreviewState');
  const thumbImg = document.getElementById('uploadedPhotoThumb');
  const nameEl = document.getElementById('uploadedPhotoName');
  const sizeEl = document.getElementById('uploadedPhotoSize');
  const removeBtn = document.getElementById('btnRemoveUploadedPhoto');

  if (!dropzone || !fileInput) return;

  // Open file dialog when clicking dropzone (unless clicking remove)
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#btnRemoveUploadedPhoto')) return;
    fileInput.click();
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      handlePhotoSelection(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePhotoSelection(e.target.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentUploadedPhoto = null;
      fileInput.value = '';
      if (emptyState) emptyState.style.display = 'block';
      if (previewState) previewState.style.display = 'none';
      if (thumbImg) thumbImg.src = '';
    });
  }

  function handlePhotoSelection(file) {
    if (!file) return;

    // Check size <= 25MB
    if (file.size > 25 * 1024 * 1024) {
      alert('Photo is too large. Please select an image under 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;

      // Format size label
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      // Update UI Immediately
      if (thumbImg) thumbImg.src = dataUrl;
      if (nameEl) nameEl.textContent = file.name;
      if (sizeEl) sizeEl.textContent = formattedSize;
      if (emptyState) emptyState.style.display = 'none';
      if (previewState) previewState.style.display = 'block';

      // Set temporary state while uploading
      currentUploadedPhoto = {
        originalName: file.name,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: dataUrl // fallback to dataUrl
      };

      // Upload to server asynchronously
      try {
        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: dataUrl
          })
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
          currentUploadedPhoto.fileUrl = resData.fileUrl;
          currentUploadedPhoto.fileName = resData.fileName;
          console.log('✅ Photo uploaded to server:', resData.fileUrl);
        }
      } catch (uploadErr) {
        console.warn('Upload saved locally in memory:', uploadErr);
      }
    };

    reader.readAsDataURL(file);
  }

  // Custom Quote Button
  const quoteBtn = document.getElementById('detailQuoteBtn');
  if (quoteBtn) {
    quoteBtn.addEventListener('click', () => {
      const sizeStr = selectedSize ? selectedSize.name : '';
      const finishStr = selectedFinish ? selectedFinish.name : '';
      const specs = `Selected size: ${sizeStr}, Selected finish: ${finishStr}`;
      if (window.openQuoteModal) {
        window.openQuoteModal(currentProduct.name, specs);
      }
    });
  }

  // WhatsApp Button
  const whatsappBtn = document.getElementById('detailWhatsAppBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const sizeStr = selectedSize ? selectedSize.name : 'Standard';
      const finishStr = selectedFinish ? selectedFinish.name : 'Standard';
      const currentPrice = selectedSize ? selectedSize.price : currentProduct.price;

      const message = `Hello Rajesh Framing!\n\nI am interested in ordering:\n• Product: ${currentProduct.name}\n• Category: ${currentProduct.categoryLabel}\n• Chosen Option: ${sizeStr}\n• Finish: ${finishStr}\n• Quantity: ${currentQuantity}\n• Price: ₹${currentPrice * currentQuantity}\n\nPlease share order details and design upload guidance.`;

      const url = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    });
  }
}

function renderRelatedProducts() {
  const container = document.getElementById('relatedProductsGrid');
  if (!container) return;

  const related = PRODUCTS_DATA
    .filter(p => p.id !== currentProduct.id)
    .slice(0, 3);

  container.innerHTML = related.map(p => {
    const priceFormatted = p.price ? `₹${p.price}` : p.priceDisplay;
    return `
    <article class="product-card" data-id="${p.id}" onclick="window.location.href='product-detail.html?id=${p.id}'">
      <div class="product-card-top">
        ${p.badge ? `<span class="product-badge-pill">${p.badge}</span>` : '<span></span>'}
        <button type="button" class="product-wishlist-btn" aria-label="Add to wishlist" onclick="event.stopPropagation(); this.classList.toggle('active');">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="product-image-box">
        <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" />
        <div class="product-image-overlay"></div>
      </div>

      <div class="product-capsule">
        <div class="capsule-top-row">
          <h4 class="capsule-title">
            <a href="product-detail.html?id=${p.id}">${p.name}</a>
          </h4>
          <span class="capsule-price">${priceFormatted}</span>
        </div>
        <div class="capsule-bottom-row">
          <div class="capsule-store-info">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>Rajesh Framing</span>
          </div>
          <button type="button" class="capsule-action-btn" onclick="event.stopPropagation(); window.location.href='product-detail.html?id=${p.id}'">
            <span>View</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `}).join('');
}

function setupTabs() {
  const triggers = document.querySelectorAll('.tab-trigger');
  const panels = document.querySelectorAll('.tab-panel');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-tab');
      triggers.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      trigger.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}
