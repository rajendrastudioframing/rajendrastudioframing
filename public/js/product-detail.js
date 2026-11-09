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
  const urlParams = new URLSearchParams(window.location.search);
  const productId = (urlParams.get('id') || '').trim();
  const finishIdParam = urlParams.get('finish') || urlParams.get('color');
  const cleanTarget = productId.toLowerCase();

  const allProds = (window.PRODUCTS_DATA && Array.isArray(window.PRODUCTS_DATA)) ? window.PRODUCTS_DATA : [];

  // 1. Instant check in memory if already cached (0ms)
  if (cleanTarget && allProds.length > 0) {
    currentProduct = allProds.find(p => {
      if (!p) return false;
      const pid = String(p.id || '').trim().toLowerCase();
      const pname = String(p.name || '').trim().toLowerCase();
      const pslug = String(p.slug || '').trim().toLowerCase();
      return pid === cleanTarget || pname === cleanTarget || pslug === cleanTarget;
    });
  }

  // 2. Fast single-product query if not in memory (only 1 row from DB)
  if (!currentProduct && productId) {
    try {
      const singleRes = await fetch(`/api/products/${encodeURIComponent(productId)}`);
      if (singleRes.ok) {
        const singleData = await singleRes.json();
        if (singleData && singleData.product) {
          currentProduct = singleData.product;
          if (Array.isArray(window.PRODUCTS_DATA)) {
            const exists = window.PRODUCTS_DATA.some(p => p.id === currentProduct.id);
            if (!exists) window.PRODUCTS_DATA.push(currentProduct);
          }
        }
      }
    } catch (_) {}
  }

  // 3. Fallback: query /api/products if still not found
  if (!currentProduct) {
    try {
      const allRes = await fetch('/api/products');
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData && allData.success && Array.isArray(allData.products)) {
          window.PRODUCTS_DATA = allData.products;
          if (cleanTarget) {
            currentProduct = allData.products.find(p => {
              if (!p) return false;
              const pid = String(p.id || '').trim().toLowerCase();
              const pname = String(p.name || '').trim().toLowerCase();
              const pslug = String(p.slug || '').trim().toLowerCase();
              return pid === cleanTarget || pname === cleanTarget || pslug === cleanTarget;
            });
          }
        }
      }
    } catch (_) {}
  }

  // 4. If product genuinely doesn't exist, display Not Found
  if (!currentProduct) {
    renderProductNotFound(productId);
    return;
  }

  // 5. In background: fetch full catalog for related products without blocking UI
  if (!window.PRODUCTS_DATA || window.PRODUCTS_DATA.length <= 1) {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.products)) {
          window.PRODUCTS_DATA = d.products;
          try { renderRelatedProducts(); } catch (_) {}
        }
      })
      .catch(() => {});
  }

  try {
    const bc = new BroadcastChannel('rf_catalog_sync');
    bc.onmessage = (ev) => {
      if (ev.data && (ev.data.type === 'PRODUCT_UPDATED' || ev.data.type === 'PRODUCT_ADDED')) {
        if (currentProduct && ev.data.product && ev.data.product.id === currentProduct.id) {
          currentProduct = ev.data.product;
          if (typeof renderProductDetails === 'function') renderProductDetails();
        }
      }
    };
  } catch (_) {}

  if (Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0) {
    const v0 = currentProduct.variants[0];
    const v0Name = typeof v0 === 'object' && v0 !== null ? (v0.name || v0.size || v0.color || v0.material || 'Standard') : String(v0);
    const v0Price = typeof v0 === 'object' && v0 !== null && v0.price !== undefined ? Number(v0.price) : Number(currentProduct.price || 0);
    const v0Hex = typeof v0 === 'object' && v0 !== null ? (v0.colorHex || (v0.color ? getVariantColorHex(v0.color) : '')) : '';
    selectedSize = { name: v0Name, price: v0Price, colorHex: v0Hex };
  } else if (currentProduct.sizes && currentProduct.sizes.length > 0) {
    const s0 = currentProduct.sizes[0];
    selectedSize = {
      name: typeof s0 === 'object' && s0 !== null ? (s0.name || 'Standard') : String(s0),
      price: typeof s0 === 'object' && s0 !== null && s0.price !== undefined ? Number(s0.price) : Number(currentProduct.price || 0),
      colorHex: ''
    };
  } else {
    selectedSize = { name: 'Standard', price: Number(currentProduct.price || 0), colorHex: '' };
  }

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

function renderProductNotFound(productId) {
  document.title = 'Product Not Found | Dahej Support';
  const mainEl = document.getElementById('mainContent');
  if (mainEl) {
    mainEl.innerHTML = `
      <div class="container" style="padding: 80px 20px; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; padding: 48px 28px; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          <div style="width: 56px; height: 56px; margin: 0 auto 18px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 style="font-family: var(--font-heading, sans-serif); font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 8px;">Product Not Found</h1>
          <p style="color: #6B7280; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px;">
            The requested product ${productId ? `(<strong>${escapeHtml(productId)}</strong>)` : ''} might have been removed, deleted, or is no longer available in the catalog.
          </p>
          <a href="products" class="btn btn-gold" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 999px;">
            Browse Available Products
          </a>
        </div>
      </div>
    `;
  }
  const stickyBar = document.getElementById('stickyBottomBar');
  if (stickyBar) stickyBar.style.display = 'none';
}

function populateProductData() {
  const p = currentProduct;

  // Title & Breadcrumb
  document.title = `${p.name} | Dahej Support`;
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
  const initialImg = (selectedFinish && selectedFinish.image) ? selectedFinish.image : (p.image || (Array.isArray(p.images) && p.images[0]) || 'assets/images/custom_canvas.jpg');
  const mainImg = document.getElementById('detailMainImg');
  if (mainImg) {
    mainImg.src = initialImg;
    mainImg.alt = `${p.name} - ${selectedFinish ? selectedFinish.name : ''}`;
    mainImg.onerror = function() {
      this.onerror = null;
      this.src = 'assets/images/custom_canvas.jpg';
    };
  }

  // Thumbnails & Image Gallery
  const thumbsContainer = document.getElementById('detailThumbsContainer');
  if (thumbsContainer) {
    // Assemble image gallery from product photos (up to 5) & finishes
    const rawPhotos = (Array.isArray(p.images) && p.images.length > 0)
      ? p.images.filter(x => typeof x === 'string' && x.trim())
      : (p.image ? [p.image.trim()] : ['assets/images/custom_canvas.jpg']);

    const productPhotos = rawPhotos.map((src, i) => ({
      src,
      finishId: '',
      label: `${p.name} - Photo ${i + 1}`
    }));

    const finishImages = (Array.isArray(p.finishes) && p.finishes.length)
      ? p.finishes
          .filter(f => f && f.image && typeof f.image === 'string' && f.image.trim())
          .map(f => ({ src: f.image.trim(), finishId: f.id, label: `${p.name} - ${f.name}` }))
      : [];

    // Combine and deduplicate by source
    const galleryItems = [];
    const seenSrcs = new Set();
    [...productPhotos, ...finishImages].forEach(item => {
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
             data-src="${escapeHtml(item.src)}" 
             data-finish-id="${escapeHtml(item.finishId || '')}" 
             title="${escapeHtml(item.label)} (Click or drag onto preview to select)">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label)}" onerror="this.onerror=null;this.src='assets/images/custom_canvas.jpg';" />
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
  if (descLead) {
    const text = (p.shortDescription || p.description || '').trim();
    if (text) {
      descLead.textContent = text;
      descLead.style.display = 'block';
    } else {
      descLead.style.display = 'none';
    }
  }

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
  if (typeof syncWishlistButtons === 'function') syncWishlistButtons();
  else if (typeof updateWishlistUI === 'function') updateWishlistUI();
}

let customSizeBuilderInitialized = false;

function initCustomSizeBuilder() {
  const csbBox = document.getElementById('customSizeBuilderBox');
  if (!csbBox) return;

  const widthInput = document.getElementById('customSizeWidth');
  const heightInput = document.getElementById('customSizeHeight');
  const unitSelect = document.getElementById('customSizeUnit');
  const presetChips = document.getElementById('customSizePresets');

  if (customSizeBuilderInitialized) return;
  customSizeBuilderInitialized = true;

  if (widthInput) {
    widthInput.addEventListener('input', () => {
      deactivatePresetButtons();
      updateCustomSizeValues();
    });
  }

  if (heightInput) {
    heightInput.addEventListener('input', () => {
      deactivatePresetButtons();
      updateCustomSizeValues();
    });
  }

  if (unitSelect) {
    unitSelect.addEventListener('change', () => {
      const u = unitSelect.value;
      const widthTag = document.getElementById('customWidthUnitTag');
      const heightTag = document.getElementById('customHeightUnitTag');
      if (widthTag) widthTag.textContent = u;
      if (heightTag) heightTag.textContent = u;
      deactivatePresetButtons();
      updateCustomSizeValues();
    });
  }

  if (presetChips) {
    presetChips.querySelectorAll('.csb-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        presetChips.querySelectorAll('.csb-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const w = parseFloat(btn.getAttribute('data-w'));
        const h = parseFloat(btn.getAttribute('data-h'));
        const u = btn.getAttribute('data-u') || 'in';

        if (widthInput) widthInput.value = w;
        if (heightInput) heightInput.value = h;
        if (unitSelect) {
          unitSelect.value = u;
          const widthTag = document.getElementById('customWidthUnitTag');
          const heightTag = document.getElementById('customHeightUnitTag');
          if (widthTag) widthTag.textContent = u;
          if (heightTag) heightTag.textContent = u;
        }

        updateCustomSizeValues();
      });
    });
  }
}

function deactivatePresetButtons() {
  const presetChips = document.getElementById('customSizePresets');
  if (presetChips) {
    presetChips.querySelectorAll('.csb-preset-btn').forEach(b => b.classList.remove('active'));
  }
}

function updateCustomSizeValues() {
  const widthInput = document.getElementById('customSizeWidth');
  const heightInput = document.getElementById('customSizeHeight');
  const unitSelect = document.getElementById('customSizeUnit');
  const summaryText = document.getElementById('customSizeSummaryText');
  const selectedDisplay = document.getElementById('selectedSizeLabel');

  let w = widthInput ? parseFloat(widthInput.value) : 14;
  let h = heightInput ? parseFloat(heightInput.value) : 20;
  let unit = unitSelect ? unitSelect.value : 'in';

  if (isNaN(w) || w <= 0) w = 14;
  if (isNaN(h) || h <= 0) h = 20;

  // Convert dimensions to square inches for fair proportional pricing
  let sqInches = 0;
  if (unit === 'in') {
    sqInches = w * h;
  } else if (unit === 'cm') {
    sqInches = (w / 2.54) * (h / 2.54);
  } else if (unit === 'mm') {
    sqInches = (w / 25.4) * (h / 25.4);
  } else if (unit === 'ft') {
    sqInches = (w * 12) * (h * 12);
  }

  // Base custom price from product sizes catalog or starting price
  const customSizeObj = (currentProduct && currentProduct.sizes) 
    ? currentProduct.sizes.find(s => s.name.toLowerCase().includes('custom'))
    : null;
  const customBasePrice = customSizeObj ? customSizeObj.price : (currentProduct ? currentProduct.price * 1.5 : 2000);
  const minPrice = currentProduct ? currentProduct.price : 450;

  // Realistic dynamic pricing formula based on area (benchmark: 14x20 = 280 sq. in.)
  const areaRatio = sqInches / 280;
  const calculatedCustomPrice = Math.max(minPrice, Math.round(customBasePrice * (0.35 + 0.65 * areaRatio)));

  // Formatted size strings
  let unitSymbol = unit === 'in' ? '"' : unit;
  let sizeLabelFormatted = `${w}${unitSymbol} × ${h}${unitSymbol}`;
  if (unit !== 'in') {
    const wIn = (w / (unit === 'cm' ? 2.54 : (unit === 'mm' ? 25.4 : 1/12))).toFixed(1);
    const hIn = (h / (unit === 'cm' ? 2.54 : (unit === 'mm' ? 25.4 : 1/12))).toFixed(1);
    sizeLabelFormatted = `${w}${unit} × ${h}${unit} (${wIn}" × ${hIn}")`;
  }

  const customSizeName = `Custom: ${sizeLabelFormatted}`;
  
  if (summaryText) {
    summaryText.textContent = `Custom Dimensions: ${sizeLabelFormatted} (~${Math.round(sqInches)} sq. in.)`;
  }

  if (selectedDisplay) {
    selectedDisplay.textContent = customSizeName;
  }

  // Update selectedSize object
  selectedSize = {
    name: customSizeName,
    price: calculatedCustomPrice,
    width: w,
    height: h,
    unit: unit,
    sqInches: Math.round(sqInches)
  };

  updatePriceDisplay();
}

function getVariantColorHex(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return '#C99A3D';
  const cleanStr = colorStr.trim();
  if (!cleanStr) return '#C99A3D';

  if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleanStr)) {
    let hex = cleanStr.startsWith('#') ? cleanStr : `#${cleanStr}`;
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return hex.toUpperCase();
  }

  const lower = cleanStr.toLowerCase();
  const commonColors = {
    'warm gold': '#C99A3D',
    'gold': '#FFD700',
    'golden': '#FFD700',
    'matte black': '#111111',
    'black': '#000000',
    'pure white': '#FFFFFF',
    'white': '#FFFFFF',
    'royal navy': '#1E3A8A',
    'navy': '#000080',
    'navy blue': '#000080',
    'blue': '#2563EB',
    'sky blue': '#38BDF8',
    'light blue': '#93C5FD',
    'dark blue': '#1E3A8A',
    'red': '#DC2626',
    'dark red': '#991B1B',
    'crimson': '#DC143C',
    'maroon': '#800000',
    'green': '#16A34A',
    'dark green': '#15803D',
    'light green': '#86EFAC',
    'emerald': '#10B981',
    'yellow': '#EAB308',
    'lemon': '#FEF08A',
    'orange': '#F97316',
    'dark orange': '#C2410C',
    'purple': '#9333EA',
    'violet': '#8B5CF6',
    'pink': '#EC4899',
    'light pink': '#FBCFE8',
    'rose': '#F43F5E',
    'rose gold': '#B76E79',
    'silver': '#C0C0C0',
    'grey': '#6B7280',
    'gray': '#6B7280',
    'brown': '#8B4513',
    'teal': '#14B8A6',
    'cyan': '#06B6D4',
    'turquoise': '#40E0D0',
    'olive': '#808000',
    'beige': '#F5F5DC'
  };
  if (commonColors[lower]) return commonColors[lower];

  if (typeof document !== 'undefined') {
    try {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = cleanStr;
      const comp = ctx.fillStyle;
      if (comp && comp.startsWith('#')) return comp.toUpperCase();
      if (comp && comp.startsWith('rgb')) {
        const parts = comp.match(/\d+/g);
        if (parts && parts.length >= 3) {
          const r = Number(parts[0]).toString(16).padStart(2, '0');
          const g = Number(parts[1]).toString(16).padStart(2, '0');
          const b = Number(parts[2]).toString(16).padStart(2, '0');
          return `#${r}${g}${b}`.toUpperCase();
        }
      }
    } catch (_) {}
  }
  return '#C99A3D';
}

function renderSizeOptions() {
  const container = document.getElementById('detailSizesContainer');
  if (!container || !currentProduct) return;

  const variantType = currentProduct.variantType || currentProduct.variant_type || 'size';
  const titleEl = document.getElementById('variantOptionTitle') || document.querySelector('#sizeOptionGroup .option-name');
  if (titleEl) {
    if (variantType === 'color') {
      titleEl.textContent = 'Available Colour:';
    } else if (variantType === 'material') {
      titleEl.textContent = 'Available Material:';
    } else {
      titleEl.textContent = 'Available Size:';
    }
  }

  // Determine items list: prefer currentProduct.variants if available, else currentProduct.sizes
  let items = [];
  if (Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0) {
    items = currentProduct.variants.map((v, idx) => {
      if (typeof v === 'object' && v !== null) {
        const name = v.name || v.size || v.color || v.material || `Option ${idx + 1}`;
        const price = v.price !== undefined ? Number(v.price) : Number(currentProduct.price || 0);
        const hex = v.colorHex || (v.color ? getVariantColorHex(v.color) : (variantType === 'color' ? getVariantColorHex(name) : ''));
        return { name, price, colorHex: hex, type: v.type || variantType };
      }
      const strVal = String(v);
      return { name: strVal, price: Number(currentProduct.price || 0), colorHex: variantType === 'color' ? getVariantColorHex(strVal) : '', type: variantType };
    });
  } else if (Array.isArray(currentProduct.sizes) && currentProduct.sizes.length > 0) {
    items = currentProduct.sizes.map((s, idx) => {
      const sName = typeof s === 'object' && s !== null ? (s.name || `Option ${idx + 1}`) : String(s);
      const sPrice = typeof s === 'object' && s !== null && s.price !== undefined ? Number(s.price) : Number(currentProduct.price || 0);
      return { name: sName, price: sPrice, colorHex: '', type: variantType };
    });
  }

  if (items.length === 0) {
    const group = document.getElementById('sizeOptionGroup');
    if (group) group.style.display = 'none';
    return;
  } else {
    const group = document.getElementById('sizeOptionGroup');
    if (group) group.style.display = 'block';
  }

  if (!selectedSize || !items.some(it => it.name === selectedSize.name)) {
    selectedSize = { ...items[0] };
  }

  container.innerHTML = items.map((it) => {
    const isAct = selectedSize && selectedSize.name === it.name;
    const colorDotHtml = (variantType === 'color' && it.colorHex)
      ? `<span class="chip-color-dot" style="background-color: ${it.colorHex};"></span>`
      : '';

    return `
      <button type="button" class="size-chip ${isAct ? 'active' : ''}" data-size-name="${escapeHtml(it.name)}" data-size-price="${it.price}" data-color-hex="${it.colorHex || ''}">
        ${colorDotHtml}<span>${escapeHtml(it.name)}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.size-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.size-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const sizeName = chip.getAttribute('data-size-name');
      const sizePrice = parseFloat(chip.getAttribute('data-size-price'));
      const colorHex = chip.getAttribute('data-color-hex') || '';
      selectedSize = { name: sizeName, price: sizePrice, colorHex };

      const csbBox = document.getElementById('customSizeBuilderBox');
      if (variantType === 'size' && sizeName.toLowerCase().includes('custom')) {
        if (csbBox) {
          csbBox.style.display = 'block';
          updateCustomSizeValues();
        }
      } else {
        if (csbBox) csbBox.style.display = 'none';
        const selectedDisplay = document.getElementById('selectedSizeLabel');
        if (selectedDisplay) selectedDisplay.textContent = sizeName;
        updatePriceDisplay();
      }
    });
  });

  const csbBox = document.getElementById('customSizeBuilderBox');
  if (variantType === 'size') {
    initCustomSizeBuilder();
    if (selectedSize && selectedSize.name.toLowerCase().includes('custom')) {
      if (csbBox) csbBox.style.display = 'block';
      updateCustomSizeValues();
    } else {
      if (csbBox) csbBox.style.display = 'none';
      const selectedDisplay = document.getElementById('selectedSizeLabel');
      if (selectedDisplay && selectedSize) selectedDisplay.textContent = selectedSize.name;
    }
  } else {
    if (csbBox) csbBox.style.display = 'none';
    const selectedDisplay = document.getElementById('selectedSizeLabel');
    if (selectedDisplay && selectedSize) selectedDisplay.textContent = selectedSize.name;
  }
}

function renderFinishOptions() {
  selectedFinish = null;
  const container = document.getElementById('detailFinishesContainer');
  if (container) {
    const parentGroup = container.closest('.option-group') || document.getElementById('finishOptionGroup');
    if (parentGroup) parentGroup.style.display = 'none';
  }
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
    if (typeof updateWishlistUI === 'function') {
      updateWishlistUI();
      return;
    }
    if (!currentProduct) return;
    const checkFn = (typeof isInWishlist === 'function') ? isInWishlist : (typeof isProductInWishlist === 'function' ? isProductInWishlist : null);
    if (!checkFn) return;
    const inWishlist = checkFn(currentProduct.id);
    const mainWishBtn = document.getElementById('detailWishlistBtn');
    const stickyWishBtn = document.getElementById('stickyWishlistBtn');
    const badgeEl = document.getElementById('productInWishlistBadge');
    const bannerEl = document.getElementById('wishlistStatusBanner');

    if (mainWishBtn) {
      mainWishBtn.classList.toggle('active', inWishlist);
      mainWishBtn.title = inWishlist ? 'Added in Wishlist (Click to remove)' : 'Add to Wishlist';
      mainWishBtn.setAttribute('aria-label', inWishlist ? 'Added in Wishlist' : 'Add to Wishlist');
      const label = mainWishBtn.querySelector('.wishlist-btn-text');
      if (label) {
        label.textContent = inWishlist ? 'In Wishlist' : 'Add to Wishlist';
      }
    }

    if (stickyWishBtn) {
      stickyWishBtn.classList.toggle('active', inWishlist);
      stickyWishBtn.title = inWishlist ? 'Added in Wishlist (Click to remove)' : 'Add to Wishlist';
      stickyWishBtn.setAttribute('aria-label', inWishlist ? 'Added in Wishlist' : 'Add to Wishlist');
      const stickyLabel = stickyWishBtn.querySelector('.sticky-wishlist-label');
      if (stickyLabel) {
        stickyLabel.textContent = inWishlist ? 'Added in Wishlist' : 'Wishlist';
      }
    }

    if (badgeEl) badgeEl.style.display = inWishlist ? 'inline-flex' : 'none';
    if (bannerEl) bannerEl.style.display = inWishlist ? 'flex' : 'none';
  }

  window.syncWishlistButtons = syncWishlistButtons;
  window.addEventListener('wishlistUpdated', syncWishlistButtons);
  setTimeout(syncWishlistButtons, 120);

  // Add to Cart Button
  const addToCartBtn = document.getElementById('detailAddToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const vType = currentProduct.variantType || currentProduct.variant_type || 'size';
      let optLabel = 'Size';
      if (vType === 'color') optLabel = 'Colour';
      else if (vType === 'material') optLabel = 'Material';

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
          variantType: vType,
          variantLabel: optLabel,
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
      const loggedIn = typeof isCustomerLoggedIn === 'function' 
        ? isCustomerLoggedIn() 
        : (window.CustomerAuth ? window.CustomerAuth.isCustomerLoggedIn() : !!localStorage.getItem('rf_customer_token'));

      if (!loggedIn) {
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

      const vType = currentProduct.variantType || currentProduct.variant_type || 'size';
      let optLabel = 'Size';
      if (vType === 'color') optLabel = 'Colour';
      else if (vType === 'material') optLabel = 'Material';

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
          variantType: vType,
          variantLabel: optLabel,
          uploadedPhoto: currentUploadedPhoto ? { ...currentUploadedPhoto } : null,
          leadTime: currentProduct.leadTime || '24 - 48 Hours'
        }, currentQuantity);
      } else {
        window.location.href = `checkout.html?buyNow=${currentProduct.id}&qty=${currentQuantity}&size=${encodeURIComponent(sizeStr)}&finish=${encodeURIComponent(finishStr)}&image=${encodeURIComponent(activeImg)}&variantType=${encodeURIComponent(vType)}`;
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

    // Check size <= 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large. Please select an image under 2MB.');
      if (fileInput) fileInput.value = '';
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

        const resData = await response.json().catch(() => ({}));
        if (response.ok && resData.success) {
          currentUploadedPhoto.fileUrl = resData.fileUrl;
          currentUploadedPhoto.fileName = resData.fileName;
          console.log('✅ Photo uploaded to server:', resData.fileUrl);
        } else if (!response.ok && resData.message) {
          alert(resData.message);
          const removeBtn = document.getElementById('btnRemoveUploadedPhoto');
          if (removeBtn) removeBtn.click();
          return;
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
      const vType = currentProduct.variantType || currentProduct.variant_type || 'size';
      let optLabel = 'Size';
      if (vType === 'color') optLabel = 'Colour';
      else if (vType === 'material') optLabel = 'Material';

      const optStr = selectedSize ? selectedSize.name : '';
      const finishStr = selectedFinish ? selectedFinish.name : '';
      const specs = `${optLabel}: ${optStr}${finishStr && finishStr !== 'Standard' && vType !== 'color' ? `, Finish: ${finishStr}` : ''}`;
      if (window.openQuoteModal) {
        window.openQuoteModal(currentProduct.name, specs);
      }
    });
  }

  // WhatsApp Button
  const whatsappBtn = document.getElementById('detailWhatsAppBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const vType = currentProduct.variantType || currentProduct.variant_type || 'size';
      let optLabel = 'Size';
      if (vType === 'color') optLabel = 'Colour';
      else if (vType === 'material') optLabel = 'Material';

      const optStr = selectedSize ? selectedSize.name : 'Standard';
      const finishStr = selectedFinish ? selectedFinish.name : '';
      const currentPrice = selectedSize ? selectedSize.price : currentProduct.price;

      let message = `Hello Dahej Support!\n\nI am interested in ordering:\n• Product: ${currentProduct.name}\n• Category: ${currentProduct.categoryLabel || currentProduct.category}\n• ${optLabel}: ${optStr}`;
      if (finishStr && finishStr !== 'Standard' && vType !== 'color') {
        message += `\n• Finish: ${finishStr}`;
      }
      message += `\n• Quantity: ${currentQuantity}\n• Price: ₹${currentPrice * currentQuantity}\n\nPlease share order details and design upload guidance.`;

      const url = `https://wa.me/919510757513?text=${encodeURIComponent(message)}`;
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
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="product-image-box">
        <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" />
      </div>

      <div class="product-capsule product-card-body">
        <div class="product-card-meta">
          <span class="product-card-category">${p.categoryLabel || 'Studio Craft'}</span>
          <div class="product-card-rating">
            <span class="rating-star">★</span>
            <span class="rating-val">${p.rating || 4.9}</span>
          </div>
        </div>
        <h4 class="capsule-title product-card-title">
          <a href="product-detail?id=${p.id}">${p.name}</a>
        </h4>
        <div class="product-card-price-row capsule-price-row">
          <span class="capsule-price product-card-price">${priceFormatted}</span>
        </div>
        <div class="capsule-bottom-row product-card-actions">
          <button type="button" class="capsule-action-btn product-add-cart-btn" onclick="event.stopPropagation(); window.location.href='product-detail?id=${p.id}'" style="width: 100%; justify-content: center;">
            <span>View Details</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
/* ==========================================================================
   CUSTOMER REVIEWS & RATINGS CONTROLLER (REAL VERIFIED REVIEWS ONLY)
   ========================================================================== */
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

function applyLoggedInUserToReviewForm() {
  const authorInput = document.getElementById('reviewAuthor');
  const cityInput = document.getElementById('reviewCity');
  const lockIcon = document.getElementById('reviewAuthorLockIcon');
  const lockNotice = document.getElementById('reviewAuthorLockNotice');
  const guestNotice = document.getElementById('reviewAuthorGuestNotice');
  if (!authorInput) return null;

  let user = null;
  if (window.CustomerAuth && typeof window.CustomerAuth.getCustomerUser === 'function') {
    user = window.CustomerAuth.getCustomerUser();
  }
  if (!user) {
    try {
      const raw = localStorage.getItem('rf_customer_user') || localStorage.getItem('rajesh_customer_user');
      if (raw) user = JSON.parse(raw);
    } catch (_) {}
  }

  const token = localStorage.getItem('rf_customer_token');
  const isLoggedIn = (window.CustomerAuth && typeof window.CustomerAuth.isCustomerLoggedIn === 'function')
    ? window.CustomerAuth.isCustomerLoggedIn()
    : Boolean(token || (user && (user.name || user.email)));

  if (isLoggedIn && user && (user.name || user.email)) {
    const verifiedName = (user.name && user.name.trim() !== 'Valued Customer')
      ? user.name.trim()
      : (user.email ? user.email.split('@')[0] : 'Customer');

    authorInput.value = verifiedName;
    authorInput.readOnly = true;
    authorInput.setAttribute('readonly', 'readonly');
    authorInput.style.backgroundColor = '#F3F4F6';
    authorInput.style.color = '#111827';
    authorInput.style.fontWeight = '600';
    authorInput.style.cursor = 'not-allowed';
    authorInput.style.borderColor = '#D1D5DB';

    if (lockIcon) lockIcon.style.display = 'inline-block';
    if (lockNotice) {
      lockNotice.style.display = 'flex';
      lockNotice.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> <span>✓ Verified Account Name: <strong>${escapeHtml(verifiedName)}</strong> (Auto-locked)</span>`;
    }
    if (guestNotice) guestNotice.style.display = 'none';

    // Auto-fill city if empty and available in user profile
    if (cityInput && !cityInput.value.trim()) {
      if (user.city) {
        cityInput.value = user.city;
      } else if (user.address && (user.address.toLowerCase().includes('dahej') || user.address.toLowerCase().includes('bharuch') || user.address.toLowerCase().includes('surat'))) {
        cityInput.value = 'Dahej / Bharuch';
      }
    }
    return user;
  } else {
    // Guest or not signed in
    authorInput.value = '';
    authorInput.readOnly = true;
    authorInput.setAttribute('readonly', 'readonly');
    authorInput.placeholder = 'Please sign in to write a review with your verified name';
    authorInput.style.backgroundColor = '#F9FAFB';
    authorInput.style.color = '#6B7280';
    authorInput.style.fontWeight = '500';
    authorInput.style.cursor = 'pointer';
    authorInput.onclick = () => {
      if (window.CustomerAuth && typeof window.CustomerAuth.openAuthModal === 'function') {
        window.CustomerAuth.openAuthModal(() => {
          applyLoggedInUserToReviewForm();
        }, 'review');
      }
    };

    if (lockIcon) lockIcon.style.display = 'none';
    if (lockNotice) lockNotice.style.display = 'none';
    if (guestNotice) guestNotice.style.display = 'flex';
    return null;
  }
}

window.toggleReviewForm = function(open) {
  const card = document.getElementById('writeReviewCard');
  if (!card) return;

  const isHidden = card.style.display === 'none' || !card.style.display;
  const shouldOpen = (open !== undefined) ? Boolean(open) : isHidden;

  if (shouldOpen) {
    const isLoggedIn = (window.CustomerAuth && typeof window.CustomerAuth.isCustomerLoggedIn === 'function')
      ? window.CustomerAuth.isCustomerLoggedIn()
      : Boolean(localStorage.getItem('rf_customer_token') || localStorage.getItem('rf_customer_user'));

    if (!isLoggedIn) {
      if (window.CustomerAuth && typeof window.CustomerAuth.openAuthModal === 'function') {
        window.CustomerAuth.openAuthModal(() => {
          applyLoggedInUserToReviewForm();
          card.style.display = 'block';
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 'review');
        return;
      }
    }

    applyLoggedInUserToReviewForm();
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    card.style.display = 'none';
  }
};

function getEffectiveProductId() {
  if (currentProduct && currentProduct.id) {
    return String(currentProduct.id).trim();
  }
  const urlParam = new URLSearchParams(window.location.search).get('id');
  if (urlParam) {
    return urlParam.trim();
  }
  return '';
}

function getProductReviewsStorageKey(productId) {
  const norm = String(productId || '').trim().toLowerCase();
  return 'rf_prod_reviews_' + norm;
}

async function initProductReviews() {
  const pId = getEffectiveProductId();
  if (!pId) return;
  const normPId = pId.toLowerCase();
  const storageKey = getProductReviewsStorageKey(normPId);

  // 1. Immediately retrieve product-specific reviews from localStorage (Zero data loss on reload / hard refresh)
  try {
    const cachedRaw = localStorage.getItem(storageKey);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (Array.isArray(cached) && cached.length > 0) {
        // STRICT Isolation: Ensure every single review in memory belongs strictly to this product ID
        productReviews = cached.filter(r => (r.productId || '').trim().toLowerCase() === normPId);
        renderReviewsSection();
      }
    }
  } catch (_) {}

  // 2. Fetch verified reviews from API with cache-busting so hard refresh always gets latest live data
  try {
    const res = await fetch(`/api/reviews?productId=${encodeURIComponent(pId)}&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.reviews)) {
        // Strict product-wise isolation
        const serverFiltered = data.reviews.filter(r => (r.productId || '').trim().toLowerCase() === normPId);

        // Merge server reviews with any recently submitted local reviews
        const mergedMap = new Map();
        serverFiltered.forEach(r => mergedMap.set(r.id, r));

        if (Array.isArray(productReviews)) {
          productReviews.forEach(r => {
            if ((r.productId || '').trim().toLowerCase() === normPId && !mergedMap.has(r.id)) {
              mergedMap.set(r.id, r);
            }
          });
        }

        productReviews = Array.from(mergedMap.values());
        // Sort newest first
        productReviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        localStorage.setItem(storageKey, JSON.stringify(productReviews));
      }
    }
  } catch (err) {
    console.warn('API review fetch notice:', err);
  }

  // 3. Setup form toggling & star picker
  setupReviewFormHandlers();

  // 4. Auto-fill logged-in customer info if available
  applyLoggedInUserToReviewForm();

  // 5. Listen for login/logout events to keep review form synchronized
  window.addEventListener('customerAuthStateChanged', () => {
    applyLoggedInUserToReviewForm();
  });

  // 6. Setup filter & sort events
  setupReviewFilterSort();

  // 7. Render review elements (real reviews or clean empty state)
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
      window.toggleReviewForm(isHidden);
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

      let currentUser = null;
      if (window.CustomerAuth && typeof window.CustomerAuth.getCustomerUser === 'function') {
        currentUser = window.CustomerAuth.getCustomerUser();
      }
      if (!currentUser) {
        try {
          const raw = localStorage.getItem('rf_customer_user') || localStorage.getItem('rajesh_customer_user');
          if (raw) currentUser = JSON.parse(raw);
        } catch (_) {}
      }

      const isLoggedIn = (window.CustomerAuth && typeof window.CustomerAuth.isCustomerLoggedIn === 'function')
        ? window.CustomerAuth.isCustomerLoggedIn()
        : Boolean(localStorage.getItem('rf_customer_token') || (currentUser && (currentUser.name || currentUser.email)));

      if (!isLoggedIn || !currentUser) {
        if (window.CustomerAuth && typeof window.CustomerAuth.openAuthModal === 'function') {
          window.CustomerAuth.openAuthModal(() => {
            applyLoggedInUserToReviewForm();
          }, 'review');
        } else {
          alert('Please sign in to your verified customer account to post a review.');
        }
        return;
      }

      const verifiedAuthor = (currentUser.name && currentUser.name.trim() !== 'Valued Customer')
        ? currentUser.name.trim()
        : (currentUser.email ? currentUser.email.split('@')[0] : 'Customer');

      // Strictly enforce the authenticated account name directly
      const author = verifiedAuthor;
      const city = (document.getElementById('reviewCity')?.value || '').trim() || (currentUser.city || 'Dahej / Bharuch');
      const headline = (document.getElementById('reviewHeadline')?.value || '').trim();
      const comment = (document.getElementById('reviewComment')?.value || '').trim();
      const rating = selectedFormRating;
      const pId = getEffectiveProductId();
      if (!pId) return;
      const normPId = pId.toLowerCase();
      const storageKey = getProductReviewsStorageKey(normPId);

      if (!headline || !comment) {
        alert('Please complete all required review fields.');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitReview');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Posting Review...</span>';
      }

      const newReview = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        productId: pId,
        author,
        city: city || 'Dahej / Bharuch',
        rating,
        date: new Date().toISOString().split('T')[0],
        headline,
        comment,
        verified: true,
        helpful: 0,
        customerEmail: currentUser.email || ''
      };

      // 1. Immediately store in local memory and product-specific localStorage
      const existingReviews = (productReviews || []).filter(r => (r.productId || '').trim().toLowerCase() === normPId);
      productReviews = [newReview, ...existingReviews];
      try {
        localStorage.setItem(storageKey, JSON.stringify(productReviews));
      } catch (_) {}

      // 2. Immediately render with feedback so user sees review instantly
      renderReviewsSection();

      // 3. Post to backend server (saves to Supabase & data/reviews.json)
      try {
        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReview)
        });
      } catch (err) {
        console.warn('Review server save background warning:', err);
      }

      // 4. Reset form, hide card and reapply locked identity
      form.reset();
      selectedFormRating = 5;
      if (ratingInput) ratingInput.value = 5;
      if (ratingText) ratingText.textContent = RATING_TEXTS[5];
      applyLoggedInUserToReviewForm();
      if (card) card.style.display = 'none';

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Submit Review</span>';
      }

      // 5. Confirmation message
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
  const pId = getEffectiveProductId();
  const normPId = pId.toLowerCase();
  // Ensure productReviews strictly isolates to only this specific product ID
  if (Array.isArray(productReviews)) {
    productReviews = productReviews.filter(r => (r.productId || '').trim().toLowerCase() === normPId);
  } else {
    productReviews = [];
  }
  const total = productReviews.length;

  const overallScoreEl = document.getElementById('reviewOverallScore');
  const subtextEl = document.getElementById('reviewSummarySubtext');
  const topScore = document.getElementById('detailRatingScore');
  const topCount = document.getElementById('detailReviewCount');
  const listContainer = document.getElementById('reviewsListContainer');

  if (total === 0) {
    if (overallScoreEl) overallScoreEl.textContent = '5.0';
    if (subtextEl) subtextEl.textContent = 'Be the first to review';
    if (topScore) topScore.textContent = '★ 5.0';
    if (topCount) topCount.textContent = '(No reviews yet)';

    for (let s = 1; s <= 5; s++) {
      const barEl = document.getElementById(`bar${s}Stars`);
      const countEl = document.getElementById(`count${s}Stars`);
      if (barEl) barEl.style.width = '0%';
      if (countEl) countEl.textContent = '0% (0)';
    }

    if (listContainer) {
      listContainer.setAttribute('data-count', '0');
      listContainer.innerHTML = `
        <div class="empty-reviews-state" style="text-align: center; padding: 48px 20px; background: #FAF9F6; border-radius: 14px; border: 1px dashed #E5E7EB; margin-top: 10px;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">✨</div>
          <p style="font-weight: 700; margin-bottom: 6px; color: var(--primary-black, #111827); font-size: 1.05rem;">No customer reviews yet</p>
          <p style="font-size: 0.9rem; color: #6B7280; margin-bottom: 18px; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.5;">Have you purchased or customized this piece? Be the first to share your experience!</p>
          <button type="button" class="btn btn-gold btn-sm" onclick="toggleReviewForm(true)" style="padding: 9px 22px; font-size: 0.88rem;">Write the First Review</button>
        </div>
      `;
    }
    return;
  }

  const sumRating = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = (sumRating / total).toFixed(1);

  // Update Score Elements

  if (overallScoreEl) overallScoreEl.textContent = avg;


  if (subtextEl) subtextEl.textContent = `Based on ${total} verified ratings`;

  // Update Top Bar Rating

  if (topScore) topScore.textContent = `${avg} / 5.0`;


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

  listContainer.setAttribute('data-count', Math.min(filtered.length, 4));
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

  setupMobileReviewsSlider();
}

function setupMobileReviewsSlider() {
  const container = document.getElementById('reviewsListContainer');
  const dotsContainer = document.getElementById('reviewsSlideDots');
  const prevBtn = document.getElementById('reviewsSlidePrev');
  const nextBtn = document.getElementById('reviewsSlideNext');
  const controls = document.getElementById('reviewsMobileControls');
  const hint = document.getElementById('reviewsSlideHint');
  if (!container || !dotsContainer) return;

  const cards = container.querySelectorAll('.review-card');
  if (!cards.length) {
    if (controls) controls.style.display = 'none';
    if (hint) hint.style.display = 'none';
    return;
  }
  if (controls) controls.style.display = '';
  if (hint) hint.style.display = '';

  // Generate dots
  dotsContainer.innerHTML = Array.from(cards).map((_, i) => 
    `<span class="review-slide-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
  ).join('');

  const dots = dotsContainer.querySelectorAll('.review-slide-dot');

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.getAttribute('data-index'));
      const targetCard = cards[idx];
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  });

  if (prevBtn) {
    prevBtn.onclick = () => {
      const cardW = cards[0] ? cards[0].offsetWidth + 14 : container.clientWidth * 0.86;
      container.scrollBy({ left: -cardW, behavior: 'smooth' });
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const cardW = cards[0] ? cards[0].offsetWidth + 14 : container.clientWidth * 0.86;
      container.scrollBy({ left: cardW, behavior: 'smooth' });
    };
  }

  // Active dot update on scroll
  let scrollTimeout;
  container.onscroll = () => {
    if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    scrollTimeout = requestAnimationFrame(() => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = cards[0] ? cards[0].offsetWidth : 300;
      const activeIdx = Math.min(cards.length - 1, Math.max(0, Math.round(scrollLeft / (cardWidth + 14))));
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
    });
  };
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
      const pId = getEffectiveProductId();
      if (pId) {
        localStorage.setItem(getProductReviewsStorageKey(pId), JSON.stringify(productReviews));
      }
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

