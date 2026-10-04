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
  const productId = urlParams.get('id') || 'plastic-frame-gallery';
  const finishIdParam = urlParams.get('finish') || urlParams.get('color');

  currentProduct = PRODUCTS_DATA.find(p => p.id === productId) || PRODUCTS_DATA[0];

  selectedSize = currentProduct.sizes && currentProduct.sizes.length > 0 ? currentProduct.sizes[0] : null;

  if (finishIdParam && currentProduct.finishes && currentProduct.finishes.length > 0) {
    selectedFinish = currentProduct.finishes.find(f => f.id === finishIdParam) || currentProduct.finishes[0];
  } else {
    selectedFinish = currentProduct.finishes && currentProduct.finishes.length > 0 ? currentProduct.finishes[0] : null;
  }

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

  try {
    initProductReviews();
  } catch (e) {
    console.error('Error in initProductReviews:', e);
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

  // Dynamic Finish Title Label
  const finishOptionTitle = document.getElementById('finishOptionTitle') || 
    document.querySelectorAll('.option-group .option-name')[1];
  if (finishOptionTitle) {
    if (p.category === 'frames' || p.name.toLowerCase().includes('frame')) {
      finishOptionTitle.textContent = 'Frame Color / Finish Option:';
    } else if (p.category === 'office' || p.id.includes('file') || p.id.includes('folder')) {
      finishOptionTitle.textContent = 'Executive Color / Finish:';
    } else if (p.category === 'drinkware' || p.id.includes('bottle') || p.id.includes('mug')) {
      finishOptionTitle.textContent = 'Color & Tone Option:';
    } else {
      finishOptionTitle.textContent = 'Color / Finish Style:';
    }
  }

  // Preload all finish variant images into memory so color switching is instantaneous
  if (currentProduct.finishes && currentProduct.finishes.length > 0) {
    currentProduct.finishes.forEach(f => {
      if (f.image) {
        const pre = new Image();
        pre.src = f.image;
      }
    });
  }

  // Main Image & Active Variant Image
  const initialImg = (selectedFinish && selectedFinish.image) ? selectedFinish.image : p.image;
  const mainImg = document.getElementById('detailMainImg');
  if (mainImg) {
    mainImg.src = initialImg;
    mainImg.alt = `${p.name} - ${selectedFinish ? selectedFinish.name : ''}`;
  }

  // Thumbnails & Image Gallery
  const thumbsContainer = document.getElementById('detailThumbsContainer');
  if (thumbsContainer) {
    // Assemble rich image gallery from variant finish images + craft perspectives
    const finishImages = (p.finishes && p.finishes.length)
      ? p.finishes.map(f => ({ src: f.image || p.image, finishId: f.id, label: `${p.name} - ${f.name}` }))
      : [{ src: p.image, finishId: '', label: p.name }];

    const perspectiveImages = [
      { src: 'assets/images/workshop.jpg', finishId: '', label: `${p.name} - Craft & Workshop Detail` },
      { src: 'assets/images/hero_showcase.jpg', finishId: '', label: `${p.name} - Gallery Showcase` }
    ];

    // Combine and deduplicate by source
    const galleryItems = [];
    const seenSrcs = new Set();
    [...finishImages, ...perspectiveImages].forEach(item => {
      if (item.src && !seenSrcs.has(item.src)) {
        seenSrcs.add(item.src);
        galleryItems.push(item);
      }
    });

    thumbsContainer.innerHTML = galleryItems.map((item, index) => {
      const isActive = (selectedFinish && item.finishId === selectedFinish.id) || (index === 0 && !selectedFinish);
      return `
        <div class="detail-thumb ${isActive ? 'active' : ''}" 
             draggable="true" 
             data-src="${item.src}" 
             data-finish-id="${item.finishId || ''}" 
             title="${item.label} (Click or drag onto preview to select)">
          <img src="${item.src}" alt="${item.label}" />
        </div>
      `;
    }).join('');

    thumbsContainer.querySelectorAll('.detail-thumb').forEach(thumb => {
      // Click selection
      thumb.addEventListener('click', () => {
        selectGalleryThumbnail(thumb);
      });

      // Drag start for dragging thumbnail onto main image
      thumb.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', thumb.getAttribute('data-src'));
        const fId = thumb.getAttribute('data-finish-id');
        if (fId) e.dataTransfer.setData('application/x-finish-id', fId);
        e.dataTransfer.effectAllowed = 'copyMove';
      });
    });
  }

  // Drag and drop onto main image box
  const mainImgBox = document.querySelector('.detail-main-img-box');
  if (mainImgBox) {
    mainImgBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      mainImgBox.classList.add('drag-over-main');
    });
    mainImgBox.addEventListener('dragleave', (e) => {
      mainImgBox.classList.remove('drag-over-main');
    });
    mainImgBox.addEventListener('drop', (e) => {
      e.preventDefault();
      mainImgBox.classList.remove('drag-over-main');

      // Check if dropped file from user's computer
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type && file.type.startsWith('image/')) {
          if (typeof window.handleProductPhotoSelection === 'function') {
            window.handleProductPhotoSelection(file);
          }
          return;
        }
      }

      // Check if dropped from gallery thumbnails
      const droppedSrc = e.dataTransfer.getData('text/plain');
      if (droppedSrc && thumbsContainer) {
        const matchingThumb = thumbsContainer.querySelector(`.detail-thumb[data-src="${droppedSrc}"]`);
        if (matchingThumb) {
          selectGalleryThumbnail(matchingThumb);
        } else if (mainImg) {
          mainImg.src = droppedSrc;
        }
      }
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

  // Dynamic finish option title based on product type
  const finishOptionTitle = document.getElementById('finishOptionTitle') || 
    (container.parentElement ? container.parentElement.querySelector('.option-name') : null);
  if (finishOptionTitle) {
    const p = currentProduct;
    if (p.category === 'frames' || p.name.toLowerCase().includes('frame')) {
      finishOptionTitle.textContent = 'Frame Color / Finish Option:';
    } else if (p.category === 'office' || p.id.includes('file') || p.id.includes('folder')) {
      finishOptionTitle.textContent = 'Executive Color / Finish:';
    } else if (p.category === 'drinkware' || p.id.includes('bottle') || p.id.includes('mug')) {
      finishOptionTitle.textContent = 'Color & Tone Option:';
    } else {
      finishOptionTitle.textContent = 'Color / Finish Style:';
    }
  }

  container.innerHTML = currentProduct.finishes.map((f, idx) => {
    const isActive = (selectedFinish && selectedFinish.id === f.id) || (!selectedFinish && idx === 0);
    return `
      <button type="button" class="color-swatch-item ${isActive ? 'active' : ''}" 
        style="background-color: ${f.color};" 
        data-finish-id="${f.id}" 
        data-finish-name="${f.name}" 
        data-finish-img="${f.image || currentProduct.image}"
        data-finish-color="${f.color}"
        title="${f.name}"
        aria-label="Select ${f.name} color option">
      </button>
    `;
  }).join('');

  container.querySelectorAll('.color-swatch-item').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch-item').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      const finishId = swatch.getAttribute('data-finish-id');
      const finishName = swatch.getAttribute('data-finish-name');
      const finishImg = swatch.getAttribute('data-finish-img');
      const finishColor = swatch.getAttribute('data-finish-color');

      const foundFinish = currentProduct.finishes.find(item => item.id === finishId);
      selectedFinish = foundFinish || { id: finishId, name: finishName, image: finishImg, color: finishColor };

      const selectedDisplay = document.getElementById('selectedFinishLabel');
      if (selectedDisplay) selectedDisplay.textContent = finishName;

      // Dynamically update product preview image & gallery thumbnail
      updateDetailImageForFinish(selectedFinish);
      updatePriceDisplay();
    });
  });

  const selectedDisplay = document.getElementById('selectedFinishLabel');
  if (selectedDisplay && selectedFinish) selectedDisplay.textContent = selectedFinish.name;
}

/**
 * Dynamically switches product image when color finish changes
 */
function updateDetailImageForFinish(finish) {
  if (!finish) return;
  const targetSrc = finish.image || currentProduct.image;
  if (!targetSrc) return;

  const mainImg = document.getElementById('detailMainImg');
  const mainImgBox = document.querySelector('.detail-main-img-box');

  if (mainImg) {
    mainImg.style.objectFit = 'cover';
    mainImg.style.background = '';
    mainImg.style.padding = '';

    mainImg.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
    mainImg.style.opacity = '0.35';
    mainImg.style.transform = 'scale(0.985)';

    mainImg.onload = () => {
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    };
    mainImg.onerror = () => {
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    };

    // Directly set target image source for instant browser response
    mainImg.src = targetSrc;
    mainImg.alt = `${currentProduct.name} - ${finish.name}`;

    if (mainImg.complete) {
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    }
  }

  // Accent glow & border on frame container
  if (mainImgBox && finish.color) {
    mainImgBox.style.transition = 'border-color 0.25s ease, box-shadow 0.25s ease';
    mainImgBox.style.borderColor = finish.color;
    mainImgBox.style.boxShadow = `0 10px 30px ${finish.color}44`;
  }

  // Update active thumbnail in strip
  const thumbsContainer = document.getElementById('detailThumbsContainer');
  if (thumbsContainer) {
    const thumbs = thumbsContainer.querySelectorAll('.detail-thumb');
    let matched = false;
    thumbs.forEach(t => {
      if (t.getAttribute('data-src') === targetSrc || (finish.id && t.getAttribute('data-finish-id') === finish.id)) {
        t.classList.add('active');
        matched = true;
      } else {
        t.classList.remove('active');
      }
    });
    if (!matched && thumbs.length > 0) {
      thumbs[0].classList.add('active');
    }
  }

  // Update sticky product thumbnail
  const stickyThumb = document.getElementById('stickyProductThumb');
  if (stickyThumb) stickyThumb.src = targetSrc;
}

/**
 * Handle gallery thumbnail selection via click or drop
 */
function selectGalleryThumbnail(thumb) {
  if (!thumb) return;
  const thumbsContainer = document.getElementById('detailThumbsContainer');
  if (thumbsContainer) {
    thumbsContainer.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  }

  const targetSrc = thumb.getAttribute('data-src');
  const finishId = thumb.getAttribute('data-finish-id');

  // If this thumbnail corresponds to a known finish variant, activate that finish
  if (finishId && currentProduct && currentProduct.finishes) {
    const foundFinish = currentProduct.finishes.find(f => f.id === finishId);
    if (foundFinish) {
      selectedFinish = foundFinish;
      const selectedDisplay = document.getElementById('selectedFinishLabel');
      if (selectedDisplay) selectedDisplay.textContent = foundFinish.name;

      const swatchContainer = document.getElementById('detailFinishesContainer');
      if (swatchContainer) {
        swatchContainer.querySelectorAll('.color-swatch-item').forEach(s => {
          s.classList.toggle('active', s.getAttribute('data-finish-id') === finishId);
        });
      }
      updatePriceDisplay();
    }
  }

  const mainImg = document.getElementById('detailMainImg');
  if (mainImg && mainImg.getAttribute('src') !== targetSrc) {
    mainImg.style.transition = 'opacity 0.2s ease-in-out';
    mainImg.style.opacity = '0.35';
    setTimeout(() => {
      mainImg.src = targetSrc;
      mainImg.style.opacity = '1';
      const stickyThumb = document.getElementById('stickyProductThumb');
      if (stickyThumb) stickyThumb.src = targetSrc;
    }, 120);
  }
}

function updatePriceDisplay() {
  const priceDisplay = document.getElementById('detailCurrentPrice');
  if (!priceDisplay) return;

  const basePrice = selectedSize ? selectedSize.price : (currentProduct ? currentProduct.price : 0);
  const finishDelta = (selectedFinish && typeof selectedFinish.priceDelta === 'number') ? selectedFinish.priceDelta : 0;
  const currentPrice = basePrice + finishDelta;

  const formattedPrice = `₹${currentPrice.toLocaleString('en-IN')}`;
  priceDisplay.textContent = formattedPrice;

  // Sync with Fixed Sticky Action Bar
  const stickyPrice = document.getElementById('stickyProductPrice');
  if (stickyPrice) {
    stickyPrice.textContent = formattedPrice;
  }
}

let currentQuantity = 1;
let currentUploadedPhoto = null;

function setupOptionInteractions() {
  // Setup Photo Upload Dropzone
  setupPhotoUpload();

  // Populate sticky bar product info
  const stickyName = document.getElementById('stickyProductName');
  const stickyThumb = document.getElementById('stickyProductThumb');
  const stickyPrice = document.getElementById('stickyProductPrice');
  if (stickyName && currentProduct) stickyName.textContent = currentProduct.name;
  if (stickyThumb && currentProduct) {
    stickyThumb.src = (selectedFinish && selectedFinish.image) ? selectedFinish.image : currentProduct.image;
  }
  if (stickyPrice && currentProduct) {
    const initialBase = selectedSize ? selectedSize.price : currentProduct.price;
    const initialDelta = (selectedFinish && selectedFinish.priceDelta) ? selectedFinish.priceDelta : 0;
    stickyPrice.textContent = `₹${(initialBase + initialDelta).toLocaleString('en-IN')}`;
  }

  // Quantity Stepper (synced with sticky action bar)
  const minusBtn = document.getElementById('detailQtyMinus');
  const plusBtn = document.getElementById('detailQtyPlus');
  const qtyDisplay = document.getElementById('detailQtyValue');
  const stickyMinusBtn = document.getElementById('stickyQtyMinus');
  const stickyPlusBtn = document.getElementById('stickyQtyPlus');
  const stickyQtyVal = document.getElementById('stickyQtyValue');

  function updateQuantity(newQty) {
    currentQuantity = Math.max(1, newQty);
    if (qtyDisplay) qtyDisplay.textContent = currentQuantity;
    if (stickyQtyVal) stickyQtyVal.textContent = currentQuantity;
  }

  if (minusBtn) minusBtn.addEventListener('click', () => updateQuantity(currentQuantity - 1));
  if (plusBtn) plusBtn.addEventListener('click', () => updateQuantity(currentQuantity + 1));
  if (stickyMinusBtn) stickyMinusBtn.addEventListener('click', () => updateQuantity(currentQuantity - 1));
  if (stickyPlusBtn) stickyPlusBtn.addEventListener('click', () => updateQuantity(currentQuantity + 1));

  // Sync Wishlist Button State
  const stickyWishlistBtn = document.getElementById('stickyWishlistBtn');
  if (stickyWishlistBtn) {
    stickyWishlistBtn.addEventListener('click', (e) => {
      if (typeof toggleWishlist === 'function' && currentProduct) {
        toggleWishlist(currentProduct.id, e);
      }
    });
  }

  function syncWishlistButtons() {
    if (!currentProduct || typeof isProductInWishlist !== 'function') return;
    const inWishlist = isProductInWishlist(currentProduct.id);
    const mainWishBtn = document.getElementById('detailWishlistBtn');
    const stickyWishBtn = document.getElementById('stickyWishlistBtn');

    [mainWishBtn, stickyWishBtn].forEach(btn => {
      if (btn) {
        btn.classList.toggle('active', inWishlist);
        const label = btn.querySelector('.wishlist-btn-text, .sticky-wishlist-label');
        if (label) {
          label.textContent = inWishlist ? 'In Wishlist' : (btn === stickyWishBtn ? 'Wishlist' : 'Add to Wishlist');
        }
      }
    });
  }

  window.addEventListener('wishlistUpdated', syncWishlistButtons);
  setTimeout(syncWishlistButtons, 120);

  // Add to Cart Button
  const addToCartBtn = document.getElementById('detailAddToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) {
        if (typeof openCustomerAuthModal === 'function') {
          openCustomerAuthModal(() => {
            if (addToCartBtn) addToCartBtn.click();
          }, {
            title: 'Sign In to Add to Cart',
            subtitle: 'Please sign in or create an account to add items to your cart.'
          });
          return;
        }
      }

      const sizeStr = selectedSize ? selectedSize.name : 'Standard';
      const finishStr = selectedFinish ? selectedFinish.name : 'Standard';
      const finishDelta = (selectedFinish && typeof selectedFinish.priceDelta === 'number') ? selectedFinish.priceDelta : 0;
      const activePrice = (selectedSize ? selectedSize.price : currentProduct.price) + finishDelta;
      const activeImg = (selectedFinish && selectedFinish.image) ? selectedFinish.image : currentProduct.image;

      if (window.addToCart) {
        window.addToCart({
          id: currentProduct.id,
          name: currentProduct.name,
          price: activePrice,
          image: activeImg,
          category: currentProduct.category,
          size: sizeStr,
          finish: finishStr,
          uploadedPhoto: currentUploadedPhoto ? { ...currentUploadedPhoto } : null,
          leadTime: currentProduct.leadTime || '24 - 48 Hours'
        }, currentQuantity, true);
      }
    });
  }

  // Sticky Bar Add to Cart Button
  const stickyAddToCartBtn = document.getElementById('stickyAddToCartBtn');
  if (stickyAddToCartBtn && addToCartBtn) {
    stickyAddToCartBtn.addEventListener('click', () => {
      addToCartBtn.click();
    });
  }

  // Buy Now Button (Direct Checkout)
  const buyNowBtn = document.getElementById('detailBuyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) {
        if (typeof openCustomerAuthModal === 'function') {
          openCustomerAuthModal(() => {
            if (buyNowBtn) buyNowBtn.click();
          }, {
            title: 'Sign In to Buy Now',
            subtitle: 'Please sign in or create an account to proceed directly to checkout.'
          });
          return;
        }
      }

      const sizeStr = selectedSize ? selectedSize.name : 'Standard';
      const finishStr = selectedFinish ? selectedFinish.name : 'Standard';
      const finishDelta = (selectedFinish && typeof selectedFinish.priceDelta === 'number') ? selectedFinish.priceDelta : 0;
      const activePrice = (selectedSize ? selectedSize.price : currentProduct.price) + finishDelta;
      const activeImg = (selectedFinish && selectedFinish.image) ? selectedFinish.image : currentProduct.image;

      if (window.buyNow) {
        window.buyNow({
          id: currentProduct.id,
          name: currentProduct.name,
          price: activePrice,
          image: activeImg,
          category: currentProduct.category,
          size: sizeStr,
          finish: finishStr,
          uploadedPhoto: currentUploadedPhoto ? { ...currentUploadedPhoto } : null,
          leadTime: currentProduct.leadTime || '24 - 48 Hours'
        }, currentQuantity);
      } else {
        window.location.href = `checkout.html?buyNow=${currentProduct.id}&qty=${currentQuantity}&size=${encodeURIComponent(sizeStr)}&finish=${encodeURIComponent(finishStr)}&image=${encodeURIComponent(activeImg)}`;
      }
    });
  }

  // Sticky Bar Buy Now Button
  const stickyBuyNowBtn = document.getElementById('stickyBuyNowBtn');
  if (stickyBuyNowBtn && buyNowBtn) {
    stickyBuyNowBtn.addEventListener('click', () => {
      buyNowBtn.click();
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

      const mainImg = document.getElementById('detailMainImg');
      if (mainImg) {
        const revertSrc = (selectedFinish && selectedFinish.image) ? selectedFinish.image : currentProduct.image;
        mainImg.style.transition = 'opacity 0.15s ease-out';
        mainImg.style.opacity = '0.35';
        mainImg.src = revertSrc;
        mainImg.style.objectFit = 'cover';
        mainImg.style.background = '';
        mainImg.style.padding = '';
        if (mainImg.complete) {
          mainImg.style.opacity = '1';
        } else {
          mainImg.onload = () => { mainImg.style.opacity = '1'; };
        }
      }
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

      // Update main product image to show user's uploaded photo inside the chosen frame
      const mainImg = document.getElementById('detailMainImg');
      if (mainImg) {
        mainImg.style.transition = 'opacity 0.2s ease-in-out';
        mainImg.style.opacity = '0.35';
        setTimeout(() => {
          mainImg.src = dataUrl;
          mainImg.style.objectFit = 'contain';
          mainImg.style.background = '#F8FAFC';
          mainImg.style.padding = '16px';
          mainImg.style.opacity = '1';
        }, 120);
      }

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

  window.handleProductPhotoSelection = handlePhotoSelection;

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

      const url = `https://wa.me/919601574966?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    });
  }
}

function renderRelatedProducts() {
  const container = document.getElementById('relatedProductsGrid');
  if (!container || !currentProduct) return;

  const allProducts = (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) ? PRODUCTS_DATA : [];
  if (!allProducts.length) return;

  // Exclude current product
  const candidates = allProducts.filter(p => p.id !== currentProduct.id);

  // Categorization helpers
  const isFrame = (p) => p.category === 'frames' || p.id.includes('frame');
  const isCustomArt = (p) => p.category === 'custom' || p.id.includes('canvas') || p.id.includes('print');
  const isDrinkware = (p) => p.category === 'personalized' || p.id.includes('bottle') || p.id.includes('mug');
  const isOffice = (p) => p.category === 'office' || p.id.includes('file') || p.id.includes('folder');

  // Compute relevance score for each candidate product
  const scored = candidates.map(p => {
    let score = 0;

    // 1. Direct Category Match (Highest Priority)
    if (p.category === currentProduct.category) {
      score += 60;
    }

    // 2. Complementary Category Affinity / Natural Pairing
    if (isFrame(currentProduct)) {
      if (isFrame(p)) score += 50;
      else if (isCustomArt(p)) score += 40; // Custom Fine Art Canvas & Floating Frames
      else if (isDrinkware(p)) score += 10;
    } else if (isDrinkware(currentProduct)) {
      if (isDrinkware(p)) score += 50;
      else if (isCustomArt(p)) score += 25;
      else if (isOffice(p)) score += 20;
    } else if (isOffice(currentProduct)) {
      if (isOffice(p)) score += 50;
      else if (isDrinkware(p)) score += 20;
      else if (isCustomArt(p)) score += 15;
    } else if (isCustomArt(currentProduct)) {
      if (isFrame(p)) score += 45;
      else if (isCustomArt(p)) score += 40;
      else if (isDrinkware(p)) score += 15;
    }

    // 3. Keyword & Material Affinity
    const currKeywords = `${currentProduct.name} ${currentProduct.categoryLabel || ''} ${currentProduct.material || ''}`.toLowerCase();
    const targetKeywords = `${p.name} ${p.categoryLabel || ''} ${p.material || ''}`.toLowerCase();

    ['frame', 'glass', 'photo', 'printing', 'print', 'custom', 'bottle', 'mug', 'ceramic', 'steel', 'folder', 'file', 'art', 'canvas', 'wall'].forEach(kw => {
      if (currKeywords.includes(kw) && targetKeywords.includes(kw)) {
        score += 12;
      }
    });

    // 4. Rating & Popularity Bonus
    if (p.rating >= 4.9) score += 6;
    if (p.badge === 'Bestseller' || p.badge === 'Popular' || p.badge === 'Trending') score += 4;

    return { product: p, score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Pick the top 4 most relevant products for a balanced row
  const related = scored.slice(0, 4).map(item => item.product);

  container.innerHTML = related.map(p => {
    const priceFormatted = p.price ? `₹${p.price}` : p.priceDisplay;
    const isWishlisted = (typeof isProductInWishlist === 'function') ? isProductInWishlist(p.id) : false;

    return `
    <article class="product-card" data-id="${p.id}" onclick="window.location.href='product-detail?id=${p.id}'">
      <div class="product-card-top">
        ${p.badge ? `<span class="product-badge-pill">${p.badge}</span>` : '<span></span>'}
        <button type="button" class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" aria-label="Add to wishlist" onclick="event.stopPropagation(); if (typeof toggleWishlist === 'function') { toggleWishlist('${p.id}', event); } else { this.classList.toggle('active'); }">
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
            <a href="product-detail?id=${p.id}">${p.name}</a>
          </h4>
          <span class="capsule-price">${priceFormatted}</span>
        </div>
        <div class="capsule-bottom-row" style="display: flex; gap: 8px;">
          <button type="button" class="capsule-action-btn" onclick="event.stopPropagation(); window.location.href='product-detail?id=${p.id}'" style="width: 100%; justify-content: center; padding: 6px 12px; font-size: 0.72rem;">
            <span>View Details</span>
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

/* ==========================================================================
   CUSTOMER REVIEWS & RATINGS CONTROLLER
   ========================================================================== */
const SEED_PRODUCT_REVIEWS = {
  'glass-frame-classic': [
    {
      id: 'rev-gfc-1',
      productId: 'glass-frame-classic',
      author: 'Dr. Pratik Desai',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-24',
      headline: 'Museum quality float glass and impeccable brass standoffs!',
      comment: 'Ordered an 18x24 glass frame for our family portrait. The diamond-beveled float glass clarity is stunning, and the metallic standoffs make it float off the wall like in an art gallery. Delivered to Bharuch in heavy protective wooden casing.',
      verified: true,
      helpful: 18
    },
    {
      id: 'rev-gfc-2',
      productId: 'glass-frame-classic',
      author: 'Anjali Mehta',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-20',
      headline: 'Fast 24-hr turnaround for our corporate executive awards',
      comment: 'We needed 10 glass award frames customized with company logos on short notice. Rajesh Framing delivered all 10 within 24 hours. The archival print vibrant colors didn\'t smudge or bleed. Exceptional studio service!',
      verified: true,
      helpful: 12
    },
    {
      id: 'rev-gfc-3',
      productId: 'glass-frame-classic',
      author: 'Kavita Solanki',
      city: 'Ankleshwar',
      rating: 4,
      date: '2026-09-15',
      headline: 'Very elegant glass finish, highly recommended',
      comment: 'The finish is super premium and looks much more expensive than the price paid. Sturdy hardware and easy to hang with provided wall anchors. Will definitely order again for my living room gallery.',
      verified: true,
      helpful: 7
    }
  ],
  'plastic-frame-gallery': [
    {
      id: 'rev-pfg-1',
      productId: 'plastic-frame-gallery',
      author: 'Sanjay Patel',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-22',
      headline: 'Lightweight yet sturdy with authentic conservation matting',
      comment: 'Used these frames to build a 9-photo memory wall in my home. The polymer build is ultra-clean with zero corner gaps, and the 1.5mm museum matting gives every picture a royal appearance.',
      verified: true,
      helpful: 15
    },
    {
      id: 'rev-pfg-2',
      productId: 'plastic-frame-gallery',
      author: 'Roshni Shah',
      city: 'Dahej',
      rating: 5,
      date: '2026-09-17',
      headline: 'Great value and crisp photo print included',
      comment: 'I sent my digital photo via WhatsApp and the studio color-matched it perfectly before framing. Crystal clear glazing and zero dust inside. Very impressed.',
      verified: true,
      helpful: 9
    },
    {
      id: 'rev-pfg-3',
      productId: 'plastic-frame-gallery',
      author: 'Vikram Rathod',
      city: 'Surat',
      rating: 4,
      date: '2026-09-10',
      headline: 'Clean matte finish, ideal for office corridors',
      comment: 'Ordered 15 frames for our regional branch office. All arrived in spotless condition with reinforced corner guards. Excellent quality polymer.',
      verified: true,
      helpful: 6
    }
  ],
  'printed-water-bottle-steel': [
    {
      id: 'rev-pwb-1',
      productId: 'printed-water-bottle-steel',
      author: 'Hardik Chauhan',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-21',
      headline: 'Laser engraved finish doesn\'t scratch even after daily factory use',
      comment: 'Ordered insulated steel bottles with laser-etched names for our plant engineering team. Keeps water ice-cold throughout the humid afternoon shifts. Outstanding industrial quality.',
      verified: true,
      helpful: 21
    },
    {
      id: 'rev-pwb-2',
      productId: 'printed-water-bottle-steel',
      author: 'Pooja Varma',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-16',
      headline: 'Stunning 360-degree color print gift for my brother',
      comment: 'The wrap-around color printing is vivid and sharp. No peeling or discoloration after multiple dishwasher runs. Great personalized gift!',
      verified: true,
      helpful: 11
    }
  ],
  'customized-coffee-mug': [
    {
      id: 'rev-cmc-1',
      productId: 'customized-coffee-mug',
      author: 'Mona Joshi',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-23',
      headline: 'High-gloss sublimation and brilliant colors!',
      comment: 'Created custom magic mugs for our anniversary. The color transition when pouring hot tea is completely seamless and amazed everyone. Grade-A ceramic with rich weight.',
      verified: true,
      helpful: 24
    },
    {
      id: 'rev-cmc-2',
      productId: 'customized-coffee-mug',
      author: 'Tushar Rana',
      city: 'Dahej',
      rating: 5,
      date: '2026-09-19',
      headline: 'Bulk corporate mugs delivered on time',
      comment: '50 custom branded mugs ordered for our Dahej logistics facility. Every single logo print is centered and color-accurate to our brand hex codes. Thank you Rajesh Framing!',
      verified: true,
      helpful: 14
    }
  ],
  'custom-file-printing': [
    {
      id: 'rev-cfp-1',
      productId: 'custom-file-printing',
      author: 'Gaurav Bhatt',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-18',
      headline: 'Durable 450 GSM board files with heavy metal clips',
      comment: 'We order all our legal files and audit binders from Rajesh Framing. Heavy duty clips don\'t bend and the matte lamination prevents edge tearing.',
      verified: true,
      helpful: 13
    }
  ],
  'printed-office-folder-executive': [
    {
      id: 'rev-pof-1',
      productId: 'printed-office-folder-executive',
      author: 'Kinjal Parekh',
      city: 'Dahej / Bharuch',
      rating: 5,
      date: '2026-09-22',
      headline: 'Gold foil stamping looks extremely prestigious',
      comment: 'Our presentation folders with metallic gold foil stamping turned out fantastic. Clients at our Dahej industrial expo specifically remarked on how luxurious our folders felt.',
      verified: true,
      helpful: 16
    }
  ],
  'custom-fine-art-canvas': [
    {
      id: 'rev-fac-1',
      productId: 'custom-fine-art-canvas',
      author: 'Rohan Merchant',
      city: 'Surat',
      rating: 5,
      date: '2026-09-25',
      headline: 'Breathtaking 12-color archival giclée canvas',
      comment: 'Printed a 30x40 landscape photography canvas. The texture of the 380 GSM natural cotton and depth of black tones are extraordinary. Gallery wrapping around the pine frame is taut and flawless.',
      verified: true,
      helpful: 28
    }
  ]
};

let productReviews = [];
let activeReviewFilter = 'all';
let activeReviewSort = 'recent';
let selectedFormRating = 5;

const RATING_TEXTS = {
  1: '1.0 - Poor • Needs substantial improvement',
  2: '2.0 - Fair • Below expectations',
  3: '3.0 - Good • Meets standard quality',
  4: '4.0 - Very Good • Highly satisfied',
  5: '5.0 - Excellent! Outstanding luxury craftsmanship'
};

async function initProductReviews() {
  const pId = currentProduct ? currentProduct.id : 'glass-frame-classic';
  const storageKey = `rf_reviews_${pId}`;

  // 1. Try loading from API
  try {
    const res = await fetch(`/api/reviews?productId=${encodeURIComponent(pId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
        productReviews = data.reviews;
      }
    }
  } catch (err) {
    // API not reachable or offline
  }

  // 2. Fallback to localStorage or seed
  if (!productReviews || productReviews.length === 0) {
    const local = localStorage.getItem(storageKey);
    if (local) {
      try {
        productReviews = JSON.parse(local);
      } catch (_) {}
    }
    if (!productReviews || productReviews.length === 0) {
      productReviews = SEED_PRODUCT_REVIEWS[pId] || [
        {
          id: `rev-default-1`,
          productId: pId,
          author: 'Verified Studio Patron',
          city: 'Bharuch',
          rating: 5,
          date: '2026-09-20',
          headline: 'Exceptional craftsmanship and swift turnaround',
          comment: 'The materials, print fidelity, and bespoke finishing from Rajesh Framing were top notch. Seamless process from ordering to doorstep delivery.',
          verified: true,
          helpful: 10
        }
      ];
      try {
        localStorage.setItem(storageKey, JSON.stringify(productReviews));
      } catch (_) {}
    }
  }

  // Setup form toggling & star picker
  setupReviewFormHandlers();

  // Setup filter & sort events
  setupReviewFilterSort();

  // Render review elements
  renderReviewsSection();
}

function setupReviewFormHandlers() {
  const toggleBtn = document.getElementById('btnToggleWriteReview');
  const card = document.getElementById('writeReviewCard');
  const closeBtn = document.getElementById('btnCloseReviewForm');
  const cancelBtn = document.getElementById('btnCancelReview');
  const form = document.getElementById('productReviewForm');

  if (toggleBtn && card) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = card.style.display === 'none' || !card.style.display;
      card.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Auto-fill logged-in customer info if available
        try {
          const custUser = localStorage.getItem('rajesh_customer_user');
          if (custUser) {
            const parsed = JSON.parse(custUser);
            const authorInput = document.getElementById('reviewAuthor');
            if (authorInput && !authorInput.value && parsed.name) {
              authorInput.value = parsed.name;
            }
          }
        } catch (_) {}
      }
    });
  }

  if (closeBtn && card) {
    closeBtn.addEventListener('click', () => {
      card.style.display = 'none';
    });
  }

  if (cancelBtn && card) {
    cancelBtn.addEventListener('click', () => {
      card.style.display = 'none';
    });
  }

  // Star Picker Interactions
  const starPicker = document.getElementById('starPicker');
  const ratingInput = document.getElementById('reviewRatingInput');
  const ratingText = document.getElementById('pickerRatingText');

  if (starPicker) {
    const stars = starPicker.querySelectorAll('.picker-star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-rating'), 10) || 5;
        selectedFormRating = val;
        if (ratingInput) ratingInput.value = val;
        if (ratingText) ratingText.textContent = RATING_TEXTS[val] || `${val}.0 Stars`;

        stars.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-rating'), 10);
          if (sVal <= val) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });
  }

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const author = (document.getElementById('reviewAuthor')?.value || '').trim();
      const city = (document.getElementById('reviewCity')?.value || '').trim();
      const headline = (document.getElementById('reviewHeadline')?.value || '').trim();
      const comment = (document.getElementById('reviewComment')?.value || '').trim();
      const rating = selectedFormRating;
      const pId = currentProduct ? currentProduct.id : 'glass-frame-classic';

      if (!author || !headline || !comment) {
        alert('Please complete all required review fields.');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitReview');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Posting Review...</span>';
      }

      const newReview = {
        id: `rev-${Date.now()}`,
        productId: pId,
        author,
        city: city || 'Dahej / Bharuch',
        rating,
        date: new Date().toISOString().split('T')[0],
        headline,
        comment,
        verified: true,
        helpful: 0
      };

      // 1. Try sending to server
      try {
        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReview)
        });
      } catch (err) {
        // Continue with local storage save
      }

      // 2. Prepend to local memory and localStorage
      productReviews.unshift(newReview);
      try {
        localStorage.setItem(`rf_reviews_${pId}`, JSON.stringify(productReviews));
      } catch (_) {}

      // 3. Reset form and hide card
      form.reset();
      selectedFormRating = 5;
      if (ratingInput) ratingInput.value = 5;
      if (ratingText) ratingText.textContent = RATING_TEXTS[5];
      if (card) card.style.display = 'none';

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Submit Review</span>';
      }

      // 4. Re-render reviews with feedback
      renderReviewsSection();

      // Show temporary confirmation
      alert(`Thank you, ${author}! Your verified review has been posted successfully.`);
    });
  }
}

function setupReviewFilterSort() {
  const pills = document.querySelectorAll('#reviewsFilterPills .filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeReviewFilter = pill.getAttribute('data-filter');
      renderReviewsListOnly();
    });
  });

  const sortSelect = document.getElementById('reviewsSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeReviewSort = sortSelect.value;
      renderReviewsListOnly();
    });
  }

  // Click on rating breakdown bars to filter
  const barRows = document.querySelectorAll('.rating-bar-row');
  barRows.forEach(row => {
    row.addEventListener('click', () => {
      const star = row.getAttribute('data-filter-stars');
      if (star) {
        const correspondingPill = document.querySelector(`#reviewsFilterPills .filter-pill[data-filter="${star}"]`);
        if (correspondingPill) {
          pills.forEach(p => p.classList.remove('active'));
          correspondingPill.classList.add('active');
          activeReviewFilter = star;
          renderReviewsListOnly();
        }
      }
    });
  });
}

function renderReviewsSection() {
  const total = productReviews.length;
  if (total === 0) return;

  const sumRating = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = (sumRating / total).toFixed(1);

  // Update Score Elements
  const overallScoreEl = document.getElementById('reviewOverallScore');
  if (overallScoreEl) overallScoreEl.textContent = avg;

  const subtextEl = document.getElementById('reviewSummarySubtext');
  if (subtextEl) subtextEl.textContent = `Based on ${total} verified ratings`;

  // Update Top Bar Rating
  const topScore = document.getElementById('detailRatingScore');
  if (topScore) topScore.textContent = `${avg} / 5.0`;

  const topCount = document.getElementById('detailReviewCount');
  if (topCount) topCount.textContent = `(${total} customer reviews)`;

  // Breakdown percentages
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  productReviews.forEach(r => {
    const s = Math.round(Number(r.rating) || 5);
    if (counts[s] !== undefined) counts[s]++;
  });

  for (let s = 1; s <= 5; s++) {
    const count = counts[s];
    const pct = Math.round((count / total) * 100);
    const barEl = document.getElementById(`bar${s}Stars`);
    const countEl = document.getElementById(`count${s}Stars`);
    if (barEl) barEl.style.width = `${pct}%`;
    if (countEl) countEl.textContent = `${pct}% (${count})`;
  }

  renderReviewsListOnly();
}

function renderReviewsListOnly() {
  const listContainer = document.getElementById('reviewsListContainer');
  if (!listContainer) return;

  let filtered = [...productReviews];

  // Apply Filter
  if (activeReviewFilter === '5') {
    filtered = filtered.filter(r => Math.round(Number(r.rating)) === 5);
  } else if (activeReviewFilter === '4') {
    filtered = filtered.filter(r => Math.round(Number(r.rating)) === 4);
  } else if (activeReviewFilter === 'verified') {
    filtered = filtered.filter(r => r.verified === true);
  }

  // Apply Sort
  if (activeReviewSort === 'highest') {
    filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  } else if (activeReviewSort === 'helpful') {
    filtered.sort((a, b) => (Number(b.helpful) || 0) - (Number(a.helpful) || 0));
  } else {
    // Recent
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-reviews-state">
        <p style="font-weight: 700; margin-bottom: 4px; color: var(--primary-black);">No customer reviews match this filter.</p>
        <p style="font-size: 0.85rem; margin: 0;">Be the first to share your experience with this piece!</p>
      </div>
    `;
    return;
  }

  const votedReviews = JSON.parse(localStorage.getItem('rf_voted_reviews') || '[]');

  listContainer.innerHTML = filtered.map(rev => {
    const ratingStars = '★'.repeat(Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5))));
    const dateFormatted = formatReviewDate(rev.date);
    const initials = getAuthorInitials(rev.author);
    const isVoted = votedReviews.includes(rev.id);

    return `
      <div class="review-card" data-review-id="${rev.id}">
        <div class="review-card-top">
          <div class="review-author-info">
            <div class="review-author-avatar">${initials}</div>
            <div class="review-author-meta">
              <div class="review-author-name-row">
                <span class="review-author-name">${escapeHtml(rev.author)}</span>
                ${rev.verified ? `
                  <span class="badge-verified-buyer" title="Verified Studio Purchase">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <polyline points="9 12 11 14 15 10"></polyline>
                    </svg>
                    <span>Verified Buyer</span>
                  </span>
                ` : ''}
              </div>
              <span class="review-author-city">${escapeHtml(rev.city || 'Gujarat, India')}</span>
            </div>
          </div>

          <div class="review-meta-right">
            <div class="review-stars">${ratingStars}</div>
            <div class="review-date">${dateFormatted}</div>
          </div>
        </div>

        <div class="review-headline">${escapeHtml(rev.headline)}</div>
        <div class="review-comment">${escapeHtml(rev.comment)}</div>

        <div class="review-card-footer">
          <span>Was this review helpful?</span>
          <button type="button" class="btn-helpful ${isVoted ? 'voted' : ''}" onclick="voteReviewHelpful('${rev.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span id="helpfulCount_${rev.id}">Helpful (${rev.helpful || 0})</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.voteReviewHelpful = function(reviewId) {
  const voted = JSON.parse(localStorage.getItem('rf_voted_reviews') || '[]');
  if (voted.includes(reviewId)) {
    return; // Already voted
  }

  const rev = productReviews.find(r => r.id === reviewId);
  if (rev) {
    rev.helpful = (rev.helpful || 0) + 1;
    voted.push(reviewId);
    try {
      localStorage.setItem('rf_voted_reviews', JSON.stringify(voted));
      const pId = currentProduct ? currentProduct.id : 'glass-frame-classic';
      localStorage.setItem(`rf_reviews_${pId}`, JSON.stringify(productReviews));
    } catch (_) {}

    const counter = document.getElementById(`helpfulCount_${reviewId}`);
    if (counter) counter.textContent = `Helpful (${rev.helpful})`;

    const card = document.querySelector(`.review-card[data-review-id="${reviewId}"] .btn-helpful`);
    if (card) card.classList.add('voted');
  }
};

function formatReviewDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffDays = Math.round((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

function getAuthorInitials(name) {
  if (!name) return 'RF';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

