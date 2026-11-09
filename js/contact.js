/**
 * RAJESH FRAMING - CONTACT PAGE CONTROLLER
 * Contact form handling, WhatsApp quick query, and interactive FAQ accordion
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initFaqAccordion();
});

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initContactForm() {
  const form = document.getElementById('contactEnquiryForm');
  const successBox = document.getElementById('contactFormSuccess');
  if (!form) return;

  // Dynamically sync Product Interested In dropdown with live database categories
  const serviceSelect = document.getElementById('contactService');
  if (serviceSelect) {
    const syncContactCategories = (cats) => {
      if (!serviceSelect || !Array.isArray(cats) || !cats.length) return;
      const currentVal = serviceSelect.value;
      const validCats = cats.filter(c => c && (c.name || c.id));
      if (!validCats.length) return;
      let optsHtml = `<option value="">Select a category or product...</option>`;
      validCats.forEach(cat => {
        const catName = (cat.name || cat.id).trim();
        optsHtml += `<option value="${escapeHtml(catName)}">${escapeHtml(catName)}</option>`;
      });
      optsHtml += `<option value="Bulk Corporate Order">Bulk Corporate Gifting Order</option>`;
      optsHtml += `<option value="Other Requirements">Other Requirements</option>`;
      serviceSelect.innerHTML = optsHtml;
      if (currentVal && Array.from(serviceSelect.options).some(o => o.value === currentVal)) {
        serviceSelect.value = currentVal;
      }
    };

    if (typeof window.CATEGORIES_DATA !== 'undefined' && Array.isArray(window.CATEGORIES_DATA) && window.CATEGORIES_DATA.length) {
      syncContactCategories(window.CATEGORIES_DATA);
    }

    fetch(`/api/categories?_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.categories) && data.categories.length) {
          window.CATEGORIES_DATA = data.categories;
          syncContactCategories(data.categories);
        }
      })
      .catch(() => {});

    try {
      const bc = new BroadcastChannel('rf_catalog_sync');
      bc.addEventListener('message', () => {
        fetch(`/api/categories?_t=${Date.now()}`)
          .then(r => r.json())
          .then(d => {
            if (d && d.success && Array.isArray(d.categories)) {
              window.CATEGORIES_DATA = d.categories;
              syncContactCategories(d.categories);
            }
          })
          .catch(() => {});
      });
    } catch (_) {}
  }

  const API_BASE = window.location.origin.includes(':5500') 
    ? 'http://localhost:5000' 
    : window.location.origin;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending Enquiry...</span>`;
    }

    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const email = document.getElementById('contactEmail') ? document.getElementById('contactEmail').value.trim() : '';
    const service = document.getElementById('contactService') ? document.getElementById('contactService').value : 'General Inquiry';
    const message = document.getElementById('contactMessage').value.trim();

    // Sync with backend API
    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, service, message })
      });
      const resData = await response.json().catch(() => ({}));
      if (resData && resData.success) {
        console.log('✓ Contact enquiry submitted to studio:', resData);
      }
    } catch (e) {
      console.warn('API sync warning:', e);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }

    // Show visual confirmation
    if (successBox) {
      form.style.display = 'none';
      successBox.style.display = 'block';
      const nameHolder = document.getElementById('contactSuccessName');
      if (nameHolder) nameHolder.textContent = name || 'Customer';
    } else {
      alert(`Thank you, ${name}! Your inquiry regarding ${service || 'our products'} has been sent. We will call you at ${phone} soon.`);
      form.reset();
    }
  });

  const resetBtn = document.getElementById('contactResetBtn');
  if (resetBtn && successBox) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = 'block';
      successBox.style.display = 'none';
    });
  }

  // Direct WhatsApp Button on Contact page
  const whatsAppDirectBtn = document.getElementById('contactWhatsAppDirectBtn');
  if (whatsAppDirectBtn) {
    whatsAppDirectBtn.addEventListener('click', () => {
      const name = document.getElementById('contactName') ? document.getElementById('contactName').value.trim() : '';
      const service = document.getElementById('contactService') ? document.getElementById('contactService').value : 'Framing & Printing';
      const msgText = document.getElementById('contactMessage') ? document.getElementById('contactMessage').value.trim() : '';

      const query = `Hello Dahej Support!\n\nMy name is ${name || 'Customer'}.\nI am contacting you regarding: ${service}.\n\nMessage: ${msgText || 'I would like more information on your custom frames and personalized printing.'}`;
      const url = `https://wa.me/919510757513?text=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    });
  }
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close other accordions
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const chevron = otherItem.querySelector('.faq-chevron');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      });

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
        const chevron = item.querySelector('.faq-chevron');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      }
    });
  });
}
