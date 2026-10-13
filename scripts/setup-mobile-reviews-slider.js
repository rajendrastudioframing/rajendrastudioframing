const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update HTML files
const htmlFiles = [
  path.join(rootDir, 'product-detail.html'),
  path.join(rootDir, 'public', 'product-detail.html')
];

const htmlSearchRegex = /<div class="reviews-list" id="reviewsListContainer">\s*<!-- Dynamically populated by JS -->\s*<\/div>/;

const htmlReplacement = `<div class="reviews-list" id="reviewsListContainer">
          <!-- Dynamically populated by JS -->
        </div>

        <!-- Mobile Slide Pagination / Controls -->
        <div class="reviews-mobile-slide-controls" id="reviewsMobileControls">
          <button type="button" class="btn-slide-nav" id="reviewsSlidePrev" aria-label="Previous review">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="reviews-slide-dots" id="reviewsSlideDots"></div>
          <button type="button" class="btn-slide-nav" id="reviewsSlideNext" aria-label="Next review">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div class="reviews-slide-hint" id="reviewsSlideHint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold);">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Swipe to browse customer reviews</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold);">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>`;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (htmlSearchRegex.test(content)) {
    content = content.replace(htmlSearchRegex, htmlReplacement);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated HTML reviews controls in ${file}`);
  } else {
    console.log(`Could not match HTML reviews container in ${file}`);
  }
});

// 2. Update CSS files
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

const cssSearchRegex = /@media\s*\(\s*max-width:\s*640px\s*\)\s*\{\s*\.reviews-list[\s\S]*?\.review-card\s*\{[\s\S]*?\}\s*\}/;

const cssReplacement = `@media (max-width: 680px) {
  .reviews-list,
  .reviews-list[data-count="4"],
  .reviews-list[data-count="3"],
  .reviews-list[data-count="2"],
  .reviews-list[data-count="1"] {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    -webkit-overflow-scrolling: touch !important;
    gap: 14px !important;
    padding: 6px 16px 14px 16px !important;
    margin: 0 -16px !important;
    scrollbar-width: none !important;
  }

  .reviews-list::-webkit-scrollbar {
    display: none !important;
  }

  .review-card {
    flex: 0 0 86% !important;
    min-width: 86% !important;
    max-width: 86% !important;
    scroll-snap-align: center !important;
    scroll-snap-stop: always !important;
    padding: 20px 18px !important;
    border-radius: 16px !important;
    background: #FFFFFF !important;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05) !important;
    height: auto !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
  }

  /* Mobile Reviews Slide Controls */
  .reviews-mobile-slide-controls {
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 10px;
    margin-bottom: 6px;
  }

  .btn-slide-nav {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 1px solid var(--border-light, #E8E2D5);
    color: var(--primary-black, #111111);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
  }

  .btn-slide-nav:hover,
  .btn-slide-nav:active {
    background: #FAF8F5;
    border-color: var(--accent-gold);
    color: var(--accent-gold);
    transform: scale(0.95);
  }

  .reviews-slide-dots {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .review-slide-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.16);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
  }

  .review-slide-dot.active {
    width: 22px;
    background: var(--accent-gold, #C99A3D);
  }

  .reviews-slide-hint {
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted, #71716D);
    margin-bottom: 24px;
    text-align: center;
  }
}

.reviews-mobile-slide-controls,
.reviews-slide-hint {
  display: none;
}`;

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (cssSearchRegex.test(content)) {
    content = content.replace(cssSearchRegex, cssReplacement);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated CSS mobile reviews slider in ${file}`);
  } else {
    console.log(`Could not match CSS mobile reviews media query in ${file}`);
  }
});

// 3. Update JS files
const jsFiles = [
  path.join(rootDir, 'js', 'product-detail.js'),
  path.join(rootDir, 'public', 'js', 'product-detail.js')
];

const jsSearchTarget = `    \`;
  }).join('');
}`;

const jsReplacement = `    \`;
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
    \`<span class="review-slide-dot \${i === 0 ? 'active' : ''}" data-index="\${i}"></span>\`
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
}`;

jsFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes(jsSearchTarget)) {
    content = content.replace(jsSearchTarget, jsReplacement);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated JS setupMobileReviewsSlider in ${file}`);
  } else {
    console.log(`Could not find jsSearchTarget in ${file}`);
  }
});

console.log('Mobile reviews slider setup script completed!');
