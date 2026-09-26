/**
 * RAJESH FRAMING - MAIN JAVASCRIPT
 * Global Navigation, Mobile Drawer, Sticky Navbar & Product Showcase Slider
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyNavbar();
  initMobileDrawer();
  initBackToTop();
  highlightActiveNavLink();
  initProductSlider();
  initHomeContactForm();
  initScrollReveal();
});

/* --- Content Visibility & Scroll Reveal Assurance --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => el.classList.add('active'));
}

/* --- Sticky Header with Clean Background & Elevation on Scroll --- */
function initStickyNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --- Mobile Navigation Drawer --- */
function initMobileDrawer() {
  const menuToggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.drawer-backdrop');
  const closeBtn = document.querySelector('.drawer-close');

  if (!menuToggle || !drawer || !backdrop) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  menuToggle.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  drawer.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* --- Highlight Active Nav Link based on URL --- */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu .nav-link, .drawer-nav .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPath = href.split('/').pop();

    if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* --- Back to Top Button --- */
function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   PRODUCT SHOWCASE SLIDER / CAROUSEL CONTROLLER
   Smooth transitions, 3 desktop / 2 tablet / 1 mobile, touch swipe, auto-slide
   ========================================================================== */
function initProductSlider() {
  const slider = document.querySelector('.product-slider-section');
  if (!slider) return;

  const track = slider.querySelector('.slider-track');
  const slides = slider.querySelectorAll('.slider-slide');
  const prevBtn = slider.querySelector('.slider-prev');
  const nextBtn = slider.querySelector('.slider-next');
  const dotsContainer = slider.querySelector('.slider-dots');

  if (!track || !slides.length) return;

  let currentIndex = 0;
  let autoSlideTimer = null;
  const autoSlideInterval = 2000; // 2 seconds auto-swap to the right
  const totalSlides = slides.length;

  function getItemsPerView() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 992) return 2;
    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, totalSlides - getItemsPerView());
  }

  // Create pagination dots
  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const maxIdx = getMaxIndex();

    for (let i = 0; i <= maxIdx; i++) {
      const dot = document.createElement('button');
      dot.className = `slider-dot ${i === currentIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        restartAutoSlide();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateSliderPosition() {
    const itemsPerView = getItemsPerView();
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = maxIdx;

    const firstSlide = slides[0];
    if (!firstSlide) return;

    // Calculate gap dynamically (24px)
    const slideWidth = firstSlide.offsetWidth;
    const gap = 24;
    const offset = currentIndex * (slideWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    // Update button states (always enabled for continuous wrap navigation)
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  }

  function goToSlide(index) {
    const maxIdx = getMaxIndex();
    currentIndex = Math.max(0, Math.min(index, maxIdx));
    updateSliderPosition();
  }

  function nextSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex < maxIdx) {
      currentIndex++;
    } else {
      currentIndex = 0; // Seamless loop back to start
    }
    updateSliderPosition();
  }

  function prevSlide() {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = getMaxIndex(); // Loop to end
    }
    updateSliderPosition();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      restartAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      restartAutoSlide();
    });
  }

  // Auto slide management - strict 2-second continuous interval
  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  function restartAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  // Do NOT stop on mouseenter so it keeps auto-sliding reliably every 2 seconds
  // Only pause briefly on active drag/interaction

  // Touch and Swipe Support for Mobile
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    stopAutoSlide();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    currentX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (!isSwiping) return;
    isSwiping = false;
    const diffX = startX - currentX;
    const threshold = 40;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    startAutoSlide();
  });

  // Handle screen resize
  window.addEventListener('resize', () => {
    renderDots();
    updateSliderPosition();
  });

  renderDots();
  updateSliderPosition();
  startAutoSlide();
}

/* --- Homepage Contact Form Handler --- */
function initHomeContactForm() {
  const form = document.getElementById('homeContactForm');
  const successBox = document.getElementById('homeFormSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('homeContactName').value.trim();
    const phone = document.getElementById('homeContactPhone').value.trim();
    const interest = document.getElementById('homeContactInterest').value;
    const message = document.getElementById('homeContactMessage').value.trim();

    // Visual feedback
    if (successBox) {
      form.style.display = 'none';
      successBox.style.display = 'block';
    }

    // Optional direct sync or notification
    console.log('Homepage Enquiry Submitted:', { name, phone, interest, message });
  });
}

