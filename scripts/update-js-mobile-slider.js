const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const jsFiles = [
  path.join(rootDir, 'js', 'product-detail.js'),
  path.join(rootDir, 'public', 'js', 'product-detail.js')
];

const jsSearchRegex = /(\s*\}\)\.join\(''\);)(\s*\})([\s\S]*?)(window\.voteReviewHelpful)/;

const newSliderCode = `$1
  setupMobileReviewsSlider();
$2

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
}

$4`;

jsFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('setupMobileReviewsSlider')) {
    console.log(`Already contains setupMobileReviewsSlider in ${file}`);
    return;
  }
  if (jsSearchRegex.test(content)) {
    content = content.replace(jsSearchRegex, newSliderCode);
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated JS setupMobileReviewsSlider in ${file}`);
  } else {
    console.log(`Could not regex match in ${file}`);
  }
});
