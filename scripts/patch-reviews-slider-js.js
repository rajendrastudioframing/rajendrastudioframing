const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const jsFiles = [
  path.join(rootDir, 'js', 'product-detail.js'),
  path.join(rootDir, 'public', 'js', 'product-detail.js')
];

const exactUniqueTarget = `            <span id="helpfulCount_\${rev.id}">Helpful (\${rev.helpful || 0})</span>
          </button>
        </div>
      </div>
    \`;
  }).join('');
}

window.voteReviewHelpful = function(reviewId) {`;

const exactReplacement = `            <span id="helpfulCount_\${rev.id}">Helpful (\${rev.helpful || 0})</span>
          </button>
        </div>
      </div>
    \`;
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
}

window.voteReviewHelpful = function(reviewId) {`;

jsFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  // Normalize CRLF to LF for reliable matching
  const hasCRLF = content.includes('\r\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedTarget = exactUniqueTarget.replace(/\r\n/g, '\n');
  const normalizedReplacement = exactReplacement.replace(/\r\n/g, '\n');

  if (normalizedContent.includes(normalizedTarget)) {
    let replaced = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    if (hasCRLF) {
      replaced = replaced.replace(/\n/g, '\r\n');
    }
    fs.writeFileSync(file, replaced, 'utf-8');
    console.log(`Successfully patched ${file}`);
  } else {
    console.log(`Target not found in ${file}`);
  }
});
