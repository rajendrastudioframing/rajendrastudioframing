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
   3D COVERFLOW & FAN-OUT PRODUCT SHOWCASE CONTROLLER
   Curved 3D perspective fan formation, continuous 3s infinite loop, touch swipe
   ========================================================================== */
function initProductSlider() {
  const slider = document.querySelector('.product-slider-section');
  if (!slider) return;

  const track = slider.querySelector('.slider-track');
  const slides = Array.from(slider.querySelectorAll('.slider-slide'));
  const prevBtn = slider.querySelector('.slider-prev');
  const nextBtn = slider.querySelector('.slider-next');
  const dotsContainer = slider.querySelector('.slider-dots');

  if (!track || !slides.length) return;

  // Start with index 3 (Mug Printing - ₹249) in center, matching user design
  let currentIndex = 3;
  let autoSlideTimer = null;
  const autoSlideInterval = 2000; // 2 seconds loop interval
  const totalSlides = slides.length;

  // Create pagination dots
  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';

    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = `slider-dot ${i === currentIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to product ${i + 1}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(i);
        restartAutoSlide();
      });
      dotsContainer.appendChild(dot);
    }
  }

  // Calculate 3D Coverflow transforms for all slides
  function update3DCoverflow() {
    const isMobile = window.innerWidth <= 640;
    const isTablet = window.innerWidth <= 992;

    slides.forEach((slide, i) => {
      // Shortest circular offset from current active slide
      let offset = (i - currentIndex) % totalSlides;
      if (offset > totalSlides / 2) offset -= totalSlides;
      if (offset < -totalSlides / 2) offset += totalSlides;

      slide.classList.toggle('is-active', offset === 0);

      // Card click handling: click side card to center it
      slide.onclick = (e) => {
        // If clicking inside cart buttons or buynow, let them handle it
        if (e.target.closest('[data-add-to-cart]') || e.target.closest('.bento-add-btn') || e.target.closest('.bento-buynow-btn') || e.target.closest('.product-wishlist-btn')) {
          return;
        }
        if (offset !== 0) {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(i);
          restartAutoSlide();
        }
      };

      let transform = '';
      let opacity = 1;
      let zIndex = 1;
      let pointerEvents = 'auto';

      if (offset === 0) {
        // Active Center Card: 100% Crisp Native 1:1 Scale, Zero Blur, Perfectly Sharp
        transform = 'translate3d(0, 0, 0px) scale(1) rotateY(0deg) rotateZ(0deg)';
        opacity = 1;
        zIndex = 50;
      } else if (offset === -1) {
        // Immediate Left (-1): Scaled down to 0.82, angled inwards
        const xOffset = isMobile ? '-52%' : '-66%';
        const rotY = isMobile ? '18deg' : '26deg';
        const rotZ = isMobile ? '-2deg' : '-3.5deg';
        transform = `translate3d(${xOffset}, 0, -40px) scale(0.82) rotateY(${rotY}) rotateZ(${rotZ})`;
        opacity = 0.85;
        zIndex = 20;
      } else if (offset === 1) {
        // Immediate Right (+1): Scaled down to 0.82, angled inwards
        const xOffset = isMobile ? '52%' : '66%';
        const rotY = isMobile ? '-18deg' : '-26deg';
        const rotZ = isMobile ? '2deg' : '3.5deg';
        transform = `translate3d(${xOffset}, 0, -40px) scale(0.82) rotateY(${rotY}) rotateZ(${rotZ})`;
        opacity = 0.85;
        zIndex = 20;
      } else if (offset === -2) {
        // Far Left (-2): Scaled down to 0.68
        if (isMobile) {
          transform = `translate3d(-90%, 0, -80px) scale(0.6) rotateY(30deg)`;
          opacity = 0;
          pointerEvents = 'none';
          zIndex = 5;
        } else {
          const xOffset = isTablet ? '-105%' : '-125%';
          transform = `translate3d(${xOffset}, 0, -80px) scale(0.68) rotateY(42deg) rotateZ(-6deg)`;
          opacity = 0.55;
          zIndex = 10;
        }
      } else if (offset === 2) {
        // Far Right (+2): Scaled down to 0.68
        if (isMobile) {
          transform = `translate3d(90%, 0, -80px) scale(0.6) rotateY(-30deg)`;
          opacity = 0;
          pointerEvents = 'none';
          zIndex = 5;
        } else {
          const xOffset = isTablet ? '105%' : '125%';
          transform = `translate3d(${xOffset}, 0, -80px) scale(0.68) rotateY(-42deg) rotateZ(6deg)`;
          opacity = 0.55;
          zIndex = 10;
        }
      } else if (offset === -3) {
        // Outer Left (-3): Visible at the edge
        if (isMobile) {
          transform = `translate3d(-120%, 0, -120px) scale(0.5) rotateY(35deg)`;
          opacity = 0;
          pointerEvents = 'none';
          zIndex = 2;
        } else {
          const xOffset = isTablet ? '-140%' : '-172%';
          transform = `translate3d(${xOffset}, 0, -120px) scale(0.56) rotateY(48deg) rotateZ(-8deg)`;
          opacity = 0.35;
          zIndex = 5;
        }
      } else if (offset === 3) {
        // Outer Right (+3): Visible at the edge
        if (isMobile) {
          transform = `translate3d(120%, 0, -120px) scale(0.5) rotateY(-35deg)`;
          opacity = 0;
          pointerEvents = 'none';
          zIndex = 2;
        } else {
          const xOffset = isTablet ? '140%' : '172%';
          transform = `translate3d(${xOffset}, 0, -120px) scale(0.56) rotateY(-48deg) rotateZ(8deg)`;
          opacity = 0.35;
          zIndex = 5;
        }
      } else {
        // Extra hidden cards (behind)
        const sign = offset < 0 ? -1 : 1;
        transform = `translate3d(${sign * 180}%, 0, -160px) scale(0.4)`;
        opacity = 0;
        pointerEvents = 'none';
        zIndex = 1;
      }

      slide.style.transform = transform;
      slide.style.webkitTransform = transform;
      slide.style.opacity = opacity;
      slide.style.zIndex = zIndex;
      slide.style.pointerEvents = pointerEvents;
      slide.style.filter = 'none';
    });

    // Update Dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }
  }

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    update3DCoverflow();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    update3DCoverflow();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    update3DCoverflow();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
      restartAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
      restartAutoSlide();
    });
  }

  // Auto-slide management
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

  // Keep rotating every 2s continuously without mouse hover interruption

  // Touch & Swipe Support for Mobile / Tablet
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

  // Window Resize
  window.addEventListener('resize', () => {
    update3DCoverflow();
  });

  renderDots();
  update3DCoverflow();
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

