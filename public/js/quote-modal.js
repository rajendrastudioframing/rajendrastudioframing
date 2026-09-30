/**
 * RAJESH FRAMING - UNIVERSAL QUOTE & ENQUIRY MODAL CONTROLLER
 * Supports photo drag-and-drop preview, validation, and direct WhatsApp sync
 */

let selectedFileObject = null;

document.addEventListener('DOMContentLoaded', () => {
  injectQuoteModalMarkup();
  bindQuoteModalTriggers();
  initFileUploadDropzone();
  bindQuoteFormSubmit();
});

/* --- Inject Modal HTML into page if not present --- */
function injectQuoteModalMarkup() {
  if (document.getElementById('quoteModal')) return;

  const modalHtml = `
    <div class="modal-overlay" id="quoteModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-header-title" id="modalTitle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Request a Custom Quote</span>
          </div>
          <button class="modal-close-btn" id="closeModalBtn" aria-label="Close modal">&times;</button>
        </div>

        <!-- Form Body -->
        <div class="modal-body" id="quoteModalBody">
          <form id="quoteEnquiryForm">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="quoteName">Your Full Name <span class="required">*</span></label>
                <input type="text" id="quoteName" class="form-input" placeholder="e.g. Rahul Sharma" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="quotePhone">Mobile / WhatsApp Number <span class="required">*</span></label>
                <input type="tel" id="quotePhone" class="form-input" placeholder="e.g. +91 98765 43210" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="quoteEmail">Email Address (Optional)</label>
              <input type="email" id="quoteEmail" class="form-input" placeholder="e.g. rahul@example.com" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="quoteProduct">Product or Service <span class="required">*</span></label>
                <select id="quoteProduct" class="form-select" required>
                  <option value="">Select an option...</option>
                  <optgroup label="Custom Frames">
                    <option value="Glass Photo Frame">Glass Photo Frame</option>
                    <option value="Plastic Polymer Frame">Plastic Photo Frame</option>
                    <option value="Floating Dual Glass Frame">Floating Dual Glass Frame</option>
                    <option value="Multi-Photo Collage Frame">Collage Photo Frame</option>
                  </optgroup>
                  <optgroup label="Personalized Printing">
                    <option value="Custom Insulated Bottle">Printed Stainless Bottle</option>
                    <option value="Personalized Coffee Mug">Personalized Ceramic Mug</option>
                    <option value="Magic Color Changing Mug">Magic Coffee Mug</option>
                  </optgroup>
                  <optgroup label="Business & Office Printing">
                    <option value="Custom Printed Office Files">Printed Document Files</option>
                    <option value="Executive Presentation Folders">Presentation Folders</option>
                    <option value="Certificate Folios">Certificate Holders</option>
                  </optgroup>
                  <optgroup label="Custom & Fine Art">
                    <option value="Fine Art Canvas Print">Fine Art Canvas Print</option>
                    <option value="HD Floating Acrylic Print">Acrylic Glass Print</option>
                    <option value="Other Custom Printing">Other Custom Printing</option>
                  </optgroup>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="quoteQuantity">Quantity</label>
                <input type="number" id="quoteQuantity" class="form-input" value="1" min="1" max="10000" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="quoteDimensions">Preferred Size or Dimensions</label>
              <input type="text" id="quoteDimensions" class="form-input" placeholder="e.g. 12x18 inches, 500ml bottle, A4 size..." />
            </div>

            <div class="form-group">
              <label class="form-label">Upload Design or Photo (Optional)</label>
              <div class="file-dropzone" id="quoteDropzone">
                <input type="file" id="quoteFileInput" class="file-hidden-input" accept="image/*,.pdf" />
                <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p class="dropzone-title">Click to upload or drag & drop photo</p>
                <p class="dropzone-desc">JPG, PNG, PDF up to 25MB (Preview provided)</p>
              </div>
              
              <div class="upload-preview-card" id="uploadPreviewCard">
                <img src="" id="previewThumbImg" class="preview-thumb" alt="Upload preview" />
                <div class="preview-meta">
                  <p class="preview-filename" id="previewFilename">image.jpg</p>
                  <p class="preview-size" id="previewSize">1.2 MB</p>
                </div>
                <button type="button" class="preview-remove-btn" id="previewRemoveBtn" title="Remove file">&times;</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="quoteRequirements">Customization Requirements & Notes</label>
              <textarea id="quoteRequirements" class="form-textarea" placeholder="Describe frame border color, text to print, delivery timeline, or any special specifications..."></textarea>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px;">
              <button type="submit" class="btn btn-gold shimmer-effect" style="flex: 1; min-width: 200px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <span>Request a Quote</span>
              </button>

              <button type="button" class="btn btn-whatsapp" id="quoteWhatsAppBtn" style="flex: 1; min-width: 200px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.18-.553-1.638-.673-2.684-2.336-2.766-2.445-.082-.109-.661-.88-.661-1.678 0-.798.419-1.189.569-1.353.15-.164.33-.205.441-.205.111 0 .222.001.32.006.103.004.24-.039.375.285.144.344.49 1.196.533 1.284.043.088.072.19.014.305-.058.115-.087.186-.173.287-.087.1-.183.224-.262.301-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087.159.058 1.009.477 1.182.564.173.087.289.13.332.204.043.074.043.431-.101.836z"></path>
                </svg>
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Success State inside Modal -->
        <div class="modal-body" id="quoteModalSuccess" style="display: none;">
          <div class="success-card">
            <div class="success-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 class="success-title">Quote Request Received!</h3>
            <p class="success-desc">
              Thank you, <strong id="successCustomerName">Customer</strong>. Our framing and printing specialists at <strong>Rajesh Framing</strong> will review your specifications and contact you shortly with accurate pricing and a digital mock-up.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary" id="successDoneBtn">Done</button>
              <a href="https://wa.me/919876543210" target="_blank" class="btn btn-whatsapp">
                <span>Direct WhatsApp Follow-up</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Close bindings
  const modal = document.getElementById('quoteModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const doneBtn = document.getElementById('successDoneBtn');

  const hide = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', hide);
  if (doneBtn) doneBtn.addEventListener('click', hide);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) hide();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      hide();
    }
  });
}

/* --- Trigger modal anywhere on click --- */
function bindQuoteModalTriggers() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-quote]');
    if (!trigger) return;

    e.preventDefault();
    const defaultProduct = trigger.getAttribute('data-product-name') || '';
    const defaultRequirement = trigger.getAttribute('data-product-spec') || '';
    openQuoteModal(defaultProduct, defaultRequirement);
  });
}

function openQuoteModal(productName = '', requirements = '') {
  const modal = document.getElementById('quoteModal');
  const formBody = document.getElementById('quoteModalBody');
  const successBody = document.getElementById('quoteModalSuccess');
  const productSelect = document.getElementById('quoteProduct');
  const reqInput = document.getElementById('quoteRequirements');

  if (!modal) return;

  // Reset view to form
  if (formBody) formBody.style.display = 'block';
  if (successBody) successBody.style.display = 'none';

  // Pre-fill fields if passed
  if (productSelect && productName) {
    let matched = false;
    for (let i = 0; i < productSelect.options.length; i++) {
      if (productSelect.options[i].text.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(productSelect.options[i].value.toLowerCase())) {
        productSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      productSelect.value = "Other Custom Printing";
    }
  }

  if (reqInput && requirements) {
    reqInput.value = requirements;
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* --- Drag & Drop Image Uploader with Preview --- */
function initFileUploadDropzone() {
  const dropzone = document.getElementById('quoteDropzone');
  const fileInput = document.getElementById('quoteFileInput');
  const previewCard = document.getElementById('uploadPreviewCard');
  const previewThumb = document.getElementById('previewThumbImg');
  const previewName = document.getElementById('previewFilename');
  const previewSize = document.getElementById('previewSize');
  const removeBtn = document.getElementById('previewRemoveBtn');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      selectedFileObject = null;
      fileInput.value = '';
      previewCard.classList.remove('show');
    });
  }

  function handleSelectedFile(file) {
    selectedFileObject = file;
    previewName.textContent = file.name;
    previewSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewThumb.src = e.target.result;
        previewCard.classList.add('show');
      };
      reader.readAsDataURL(file);
    } else {
      previewThumb.src = 'assets/images/hero_showcase.jpg';
      previewCard.classList.add('show');
    }
  }
}

/* --- Submit and WhatsApp Sync --- */
function bindQuoteFormSubmit() {
  const form = document.getElementById('quoteEnquiryForm');
  const whatsAppBtn = document.getElementById('quoteWhatsAppBtn');
  if (!form) return;

  const API_BASE = window.location.origin.includes(':5500') 
    ? 'http://localhost:5000' 
    : window.location.origin;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Submitting Enquiry...</span>`;
    }

    const name = document.getElementById('quoteName').value.trim();
    const phone = document.getElementById('quotePhone').value.trim();
    const email = document.getElementById('quoteEmail') ? document.getElementById('quoteEmail').value.trim() : '';
    const product = document.getElementById('quoteProduct').value || 'Custom Framing/Printing';
    const qty = document.getElementById('quoteQuantity').value || '1';
    const dimensions = document.getElementById('quoteDimensions').value.trim() || 'Standard';
    const req = document.getElementById('quoteRequirements').value.trim() || '';

    const customerNameHolder = document.getElementById('successCustomerName');
    if (customerNameHolder && name) {
      customerNameHolder.textContent = name;
    }

    // Post to Admin API
    try {
      const response = await fetch(`${API_BASE}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          product,
          specs: dimensions,
          quantity: qty,
          notes: req,
          uploadFileName: selectedFileObject ? selectedFileObject.name : null
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (resData && resData.success) {
        console.log('✓ Quote inquiry successfully saved to admin panel:', resData.inquiryId);
      }
    } catch (e) {
      console.warn('API sync warning:', e);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }

    // Switch to success view
    document.getElementById('quoteModalBody').style.display = 'none';
    document.getElementById('quoteModalSuccess').style.display = 'block';

    form.reset();
    selectedFileObject = null;
    const previewCard = document.getElementById('uploadPreviewCard');
    if (previewCard) previewCard.classList.remove('show');
  });

  if (whatsAppBtn) {
    whatsAppBtn.addEventListener('click', () => {
      const name = document.getElementById('quoteName').value.trim() || 'Valued Customer';
      const phone = document.getElementById('quotePhone').value.trim() || 'Not specified';
      const email = document.getElementById('quoteEmail') ? document.getElementById('quoteEmail').value.trim() : '';
      const product = document.getElementById('quoteProduct').value || 'Custom Framing/Printing';
      const qty = document.getElementById('quoteQuantity').value || '1';
      const dimensions = document.getElementById('quoteDimensions').value.trim() || 'Standard';
      const req = document.getElementById('quoteRequirements').value.trim() || 'Please share pricing details.';

      const msg = `Hello Rajesh Framing!\n\nI would like to request a quote:\n• Name: ${name}\n• Phone: ${phone}${email ? `\n• Email: ${email}` : ''}\n• Product/Service: ${product}\n• Quantity: ${qty}\n• Preferred Size: ${dimensions}\n• Requirements: ${req}\n\nLooking forward to hearing from you!`;

      const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, '_blank');
    });
  }
}

// Global helper to open quote modal
window.openQuoteModal = openQuoteModal;
