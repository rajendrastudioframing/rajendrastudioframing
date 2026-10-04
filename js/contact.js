/**
 * RAJESH FRAMING - CONTACT PAGE CONTROLLER
 * Contact form handling, WhatsApp quick query, and interactive FAQ accordion
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initFaqAccordion();
});

function initContactForm() {
  const form = document.getElementById('contactEnquiryForm');
  const successBox = document.getElementById('contactFormSuccess');
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

      const query = `Hello Rajesh Framing!\n\nMy name is ${name || 'Customer'}.\nI am contacting you regarding: ${service}.\n\nMessage: ${msgText || 'I would like more information on your custom frames and personalized printing.'}`;
      const url = `https://wa.me/919601574966?text=${encodeURIComponent(query)}`;
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
