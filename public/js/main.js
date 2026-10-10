/**
 * RAJESH FRAMING - MAIN JAVASCRIPT
 * Global Navigation, Mobile Drawer, Sticky Navbar & Product Showcase Slider
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyNavbar();
  initMobileDrawer();
  initBackToTop();
  highlightActiveNavLink();
  initCategoryJumpBar();
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
  const rawPath = window.location.pathname.split('/').pop().replace(/\.html$/, '');
  const currentPath = (!rawPath || rawPath === 'index') ? 'index' : rawPath;
  const navLinks = document.querySelectorAll('.nav-menu .nav-link, .drawer-nav .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const rawLink = href.split('/').pop().replace(/\.html$/, '');
    const linkPath = (!rawLink || rawLink === 'index' || href === '/') ? 'index' : rawLink;

    if (linkPath === currentPath) {
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
  const autoSlideInterval = 4500; // 4.5 seconds comfortable loop interval
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
    const isMobile = window.innerWidth <= 680;
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
        if (isMobile) {
          // On mobile: Move cleanly to the left without overlapping the active card
          transform = 'translate3d(-112%, 0, -30px) scale(0.86) rotateY(6deg)';
          opacity = 0;
          pointerEvents = 'none';
          zIndex = 10;
        } else {
          // Immediate Left (-1): Scaled down to 0.82, angled inwards
          const xOffset = '-66%';
          const rotY = '26deg';
          const rotZ = '-3.5deg';
          transform = `translate3d(${xOffset}, 0, -40px) scale(0.82) rotateY(${rotY}) rotateZ(${rotZ})`;
          opacity = 0.85;
          zIndex = 20;
        }
      } else if (offset === 1) {
        if (isMobile) {
          // On mobile: Move cleanly to the right without overlapping the active card
          transform = 'translate3d(112%, 0, -30px) scale(0.86) rotateY(-6deg)';
          opacity = 0;
          pointerEvents = 'none';
          zIndex = 10;
        } else {
          // Immediate Right (+1): Scaled down to 0.82, angled inwards
          const xOffset = '66%';
          const rotY = '-26deg';
          const rotZ = '3.5deg';
          transform = `translate3d(${xOffset}, 0, -40px) scale(0.82) rotateY(${rotY}) rotateZ(${rotZ})`;
          opacity = 0.85;
          zIndex = 20;
        }
      } else if (offset === -2) {
        if (isMobile) {
          transform = `translate3d(-180%, 0, -80px) scale(0.6)`;
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
        if (isMobile) {
          transform = `translate3d(180%, 0, -80px) scale(0.6)`;
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
        if (isMobile) {
          transform = `translate3d(-240%, 0, -120px) scale(0.5)`;
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
        if (isMobile) {
          transform = `translate3d(240%, 0, -120px) scale(0.5)`;
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
        const sign = offset < 0 ? -1 : 1;
        transform = `translate3d(${sign * 260}%, 0, -160px) scale(0.4)`;
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

  // Pause auto-sliding on mouse hover over product cards or slider
  const sliderViewport = slider.querySelector('.slider-viewport') || track;
  if (sliderViewport) {
    sliderViewport.addEventListener('mouseenter', stopAutoSlide);
    sliderViewport.addEventListener('mouseleave', startAutoSlide);
  }

  slides.forEach(slide => {
    slide.addEventListener('mouseenter', stopAutoSlide);
    slide.addEventListener('mouseleave', startAutoSlide);
  });

  // Touch & Swipe Support for Mobile / Tablet
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    currentX = startX;
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

    const name = document.getElementById('homeContactName').value.trim();
    const phone = document.getElementById('homeContactPhone').value.trim();
    const email = document.getElementById('homeContactEmail') ? document.getElementById('homeContactEmail').value.trim() : '';
    const interest = document.getElementById('homeContactInterest') ? document.getElementById('homeContactInterest').value : 'General Inquiry';
    const message = document.getElementById('homeContactMessage').value.trim();

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          service: interest,
          message
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (resData && resData.success) {
        console.log('✓ Homepage contact enquiry submitted to studio:', resData);
      }
    } catch (err) {
      console.warn('Could not sync homepage enquiry with admin server:', err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }

    // Visual feedback
    if (successBox) {
      form.style.display = 'none';
      successBox.style.display = 'block';
    }
  });
}

// Global Swatch Switcher for product cards on Homepage & Catalog
window.changeCatalogCardImage = function(productId, newImgSrc, swatchEl, event, finishId, finishName) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }
  const cards = document.querySelectorAll(`.product-card[data-id="${productId}"], .product-card[data-product-id="${productId}"]`);
  let parentCard = swatchEl ? swatchEl.closest('.product-card') : null;
  const targetCards = parentCard ? [parentCard] : cards;

  targetCards.forEach(card => {
    if (finishId) card.setAttribute('data-selected-finish-id', finishId);
    if (finishName) card.setAttribute('data-selected-finish-name', finishName);
    if (newImgSrc) card.setAttribute('data-selected-finish-img', newImgSrc);

    // Update navigation destination
    const targetUrl = `product-detail?id=${productId}${finishId ? `&finish=${finishId}` : ''}`;
    card.setAttribute('onclick', `window.location.href='${targetUrl}'`);
    const cardTitleLink = card.querySelector('.capsule-title a, .bento-title a');
    if (cardTitleLink) {
      cardTitleLink.setAttribute('href', targetUrl);
    }

    // Dynamic price update on card when finish/color is changed
    const products = (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
    const product = products.find(p => p.id === productId);
    if (product) {
      const finish = product.finishes ? product.finishes.find(f => f.id === finishId) : null;
      const finishDelta = (finish && typeof finish.priceDelta === 'number') ? finish.priceDelta : 0;
      const cardPrice = product.price + finishDelta;
      const priceEl = card.querySelector('.capsule-price, .bento-price-val');
      if (priceEl) {
        priceEl.textContent = `₹${cardPrice}`;
      }
    }

    const img = card.querySelector('.product-image, .bento-product-img');
    if (img && newImgSrc) {
      img.style.transition = 'opacity 0.15s ease-out';
      img.style.opacity = '0.35';
      img.src = newImgSrc;
      if (img.complete) {
        img.style.opacity = '1';
      } else {
        img.onload = () => { img.style.opacity = '1'; };
        img.onerror = () => { img.style.opacity = '1'; };
      }
    }

    const dots = card.querySelectorAll('.card-swatch-dot');
    dots.forEach(d => d.classList.remove('active'));
  });

  if (swatchEl) swatchEl.classList.add('active');
};

/* --- Category Jump Bar Controller --- */
function initCategoryJumpBar() {
  const jumpButtons = document.querySelectorAll('.category-jump-btn');
  if (!jumpButtons.length) return;

  jumpButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('data-cat-target');
      if (targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          e.preventDefault();
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          jumpButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (history.pushState) {
            history.pushState(null, null, '#' + targetId);
          }
        }
      }
    });
  });

  // Highlight category jump button on scroll
  const categorySections = [
    document.getElementById('cat-frames'),
    document.getElementById('cat-personalized'),
    document.getElementById('cat-office'),
    document.getElementById('cat-custom'),
    document.getElementById('cat-gifts')
  ].filter(Boolean);

  if ('IntersectionObserver' in window && categorySections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          jumpButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-cat-target') === id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    categorySections.forEach(sec => observer.observe(sec));
  }
}

// Toggle Category See More / Show Less (5 items initially, rest on See More)
function toggleCategoryMore(sectionId, btn) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const isExpanded = section.classList.toggle('is-expanded');
  const targetBtn = btn || section.querySelector('.category-see-more-btn');
  const textEl = targetBtn ? targetBtn.querySelector('.see-more-text') : null;
  if (textEl) {
    textEl.textContent = isExpanded ? 'Show Less' : 'See More';
  }
  if (targetBtn) {
    targetBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  }
  if (!isExpanded) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
window.toggleCategoryMore = toggleCategoryMore;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.category-see-more-btn');
  if (btn && btn.dataset.target && !e.defaultPrevented) {
    toggleCategoryMore(btn.dataset.target, btn);
  }
});

