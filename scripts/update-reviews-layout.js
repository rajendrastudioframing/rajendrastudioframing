const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update CSS in css/components.css and public/css/components.css
const cssFiles = [
  path.join(rootDir, 'css', 'components.css'),
  path.join(rootDir, 'public', 'css', 'components.css')
];

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // Replace base .reviews-list grid
  const oldGridRegex = /\/\* Reviews List & Cards \(4 Cards Per Row Grid\) \*\/\s*\.reviews-list\s*\{[^}]*\}/;
  const newGridCss = `/* Reviews List & Cards (4 Cards Per Row Grid with Adaptive Balance) */
.reviews-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: stretch;
}

.reviews-list[data-count="4"],
.reviews-list:not([data-count]) {
  grid-template-columns: repeat(4, 1fr);
}

.reviews-list[data-count="3"] {
  grid-template-columns: repeat(3, 1fr);
}

.reviews-list[data-count="2"] {
  grid-template-columns: repeat(2, 1fr);
}

.reviews-list[data-count="1"] {
  grid-template-columns: 1fr;
}`;

  if (oldGridRegex.test(content)) {
    content = content.replace(oldGridRegex, newGridCss);
  }

  // Replace media queries
  const oldMqRegex = /@media\s*\(max-width:\s*1200px\)\s*\{\s*\.reviews-list\s*\{[\s\S]*?\}\s*\}/;
  const newMqCss = `@media (max-width: 1200px) {
  .reviews-list,
  .reviews-list[data-count="4"],
  .reviews-list[data-count="3"] {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
}`;
  if (oldMqRegex.test(content)) {
    content = content.replace(oldMqRegex, newMqCss);
  }

  const oldMqMobileRegex = /@media\s*\(max-width:\s*640px\)\s*\{\s*\.reviews-list\s*\{[\s\S]*?\}\s*\.review-card\s*\{[\s\S]*?\}\s*\}/;
  const newMqMobileCss = `@media (max-width: 640px) {
  .reviews-list,
  .reviews-list[data-count="4"],
  .reviews-list[data-count="3"],
  .reviews-list[data-count="2"],
  .reviews-list[data-count="1"] {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .review-card {
    padding: 18px 16px;
  }
}`;
  if (oldMqMobileRegex.test(content)) {
    content = content.replace(oldMqMobileRegex, newMqMobileCss);
  }

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated CSS in ${file}`);
});

// 2. Update JS in js/product-detail.js and public/js/product-detail.js
const jsFiles = [
  path.join(rootDir, 'js', 'product-detail.js'),
  path.join(rootDir, 'public', 'js', 'product-detail.js')
];

const newSeedData = `const SEED_PRODUCT_REVIEWS = {
  'glass-frame-classic': [
    {
      id: 'rev-gfc-1',
      productId: 'glass-frame-classic',
      author: 'Dr. Pratik Desai',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-24',
      headline: 'Museum quality float glass and impeccable brass standoffs!',
      comment: 'Ordered an 18x24 glass frame for our family portrait. The diamond-beveled float glass clarity is stunning, and the metallic standoffs make it float off the wall like in an art gallery. Delivered to Bharuch in heavy protective wooden casing.',
      verified: true,
      helpful: 18
    },
    {
      id: 'rev-gfc-2',
      productId: 'glass-frame-classic',
      author: 'Anjali Mehta',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-20',
      headline: 'Fast 24-hr turnaround for our corporate executive awards',
      comment: 'We needed 10 glass award frames customized with company logos on short notice. Dahej Support delivered all 10 within 24 hours. The archival print vibrant colors didn\\'t smudge or bleed. Exceptional studio service!',
      verified: true,
      helpful: 12
    },
    {
      id: 'rev-gfc-3',
      productId: 'glass-frame-classic',
      author: 'Kavita Solanki',
      city: 'Ankleshwar',
      rating: 4,
      date: '2026-09-15',
      headline: 'Very elegant glass finish, highly recommended',
      comment: 'The finish is super premium and looks much more expensive than the price paid. Sturdy hardware and easy to hang with provided wall anchors. Will definitely order again for my living room gallery.',
      verified: true,
      helpful: 7
    },
    {
      id: 'rev-gfc-4',
      productId: 'glass-frame-classic',
      author: 'Rajesh Patel',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-10',
      headline: 'Flawless framing precision and ultra-secure packaging',
      comment: 'Ordered two 12×16 frames with certificate mats. The beveled float glass has crystal-clear transparency with zero distortion. Delivered safely cushioned in heavy corner shields and bubble wrap.',
      verified: true,
      helpful: 15
    }
  ],
  'plastic-frame-gallery': [
    {
      id: 'rev-pfg-1',
      productId: 'plastic-frame-gallery',
      author: 'Sanjay Patel',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-22',
      headline: 'Lightweight yet sturdy with authentic conservation matting',
      comment: 'Used these frames to build a 9-photo memory wall in my home. The polymer build is ultra-clean with zero corner gaps, and the 1.5mm museum matting gives every picture a royal appearance.',
      verified: true,
      helpful: 15
    },
    {
      id: 'rev-pfg-2',
      productId: 'plastic-frame-gallery',
      author: 'Roshni Shah',
      city: 'Dahej',
      rating: 5,
      date: '2026-09-17',
      headline: 'Great value and crisp photo print included',
      comment: 'I sent my digital photo via WhatsApp and the studio color-matched it perfectly before framing. Crystal clear glazing and zero dust inside. Very impressed.',
      verified: true,
      helpful: 9
    },
    {
      id: 'rev-pfg-3',
      productId: 'plastic-frame-gallery',
      author: 'Vikram Rathod',
      city: 'Surat',
      rating: 4,
      date: '2026-09-10',
      headline: 'Clean matte finish, ideal for office corridors',
      comment: 'Ordered 15 frames for our regional branch office. All arrived in spotless condition with reinforced corner guards. Excellent quality polymer.',
      verified: true,
      helpful: 6
    },
    {
      id: 'rev-pfg-4',
      productId: 'plastic-frame-gallery',
      author: 'Alkesh Joshi',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-06',
      headline: 'Perfect alignment and robust polymer wall brackets',
      comment: 'Installed 6 gallery frames in our executive boardroom. The clean black border looks dignified and the matte finish resists fingerprints completely.',
      verified: true,
      helpful: 11
    }
  ],
  'printed-water-bottle-steel': [
    {
      id: 'rev-pwb-1',
      productId: 'printed-water-bottle-steel',
      author: 'Hardik Chauhan',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-21',
      headline: 'Laser engraved finish doesn\\'t scratch even after daily factory use',
      comment: 'Ordered insulated steel bottles with laser-etched names for our plant engineering team. Keeps water ice-cold throughout the humid afternoon shifts. Outstanding industrial quality.',
      verified: true,
      helpful: 21
    },
    {
      id: 'rev-pwb-2',
      productId: 'printed-water-bottle-steel',
      author: 'Pooja Varma',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-16',
      headline: 'Stunning 360-degree color print gift for my brother',
      comment: 'The wrap-around color printing is vivid and sharp. No peeling or discoloration after multiple dishwasher runs. Great personalized gift!',
      verified: true,
      helpful: 11
    },
    {
      id: 'rev-pwb-3',
      productId: 'printed-water-bottle-steel',
      author: 'Manish Doshi',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-12',
      headline: 'Laser etching is sharp and temperature retention is solid',
      comment: 'Keeps cold drinks chilled all day during our plant inspections. The metallic silver finish and custom logo engraving are top notch.',
      verified: true,
      helpful: 14
    },
    {
      id: 'rev-pwb-4',
      productId: 'printed-water-bottle-steel',
      author: 'Bhavin Vyas',
      city: 'Dahej',
      rating: 4,
      date: '2026-09-08',
      headline: 'Great corporate welcome kit merchandise',
      comment: 'Ordered 30 customized units for new plant joiners. High grade stainless steel, leak-proof cap, and arrived ahead of schedule.',
      verified: true,
      helpful: 8
    }
  ],
  'customized-coffee-mug': [
    {
      id: 'rev-cmc-1',
      productId: 'customized-coffee-mug',
      author: 'Mona Joshi',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-23',
      headline: 'High-gloss sublimation and brilliant colors!',
      comment: 'Created custom magic mugs for our anniversary. The color transition when pouring hot tea is completely seamless and amazed everyone. Grade-A ceramic with rich weight.',
      verified: true,
      helpful: 24
    },
    {
      id: 'rev-cmc-2',
      productId: 'customized-coffee-mug',
      author: 'Tushar Rana',
      city: 'Dahej',
      rating: 5,
      date: '2026-09-19',
      headline: 'Bulk corporate mugs delivered on time',
      comment: '50 custom branded mugs ordered for our Dahej logistics facility. Every single logo print is centered and color-accurate to our brand hex codes. Thank you Dahej Support!',
      verified: true,
      helpful: 14
    },
    {
      id: 'rev-cmc-3',
      productId: 'customized-coffee-mug',
      author: 'Neha Trivedi',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-14',
      headline: 'Vibrant glossy ceramic with ergonomic handle',
      comment: 'Printed our family reunion picture on 8 mugs. Colors are deep, edges are sharp, and microwave safe without fading.',
      verified: true,
      helpful: 10
    },
    {
      id: 'rev-cmc-4',
      productId: 'customized-coffee-mug',
      author: 'Krunal Shah',
      city: 'Ankleshwar',
      rating: 4,
      date: '2026-09-07',
      headline: 'Fast delivery and very secure gift packaging',
      comment: 'Each mug came safely boxed in individual bubble casing. The print finish is completely smooth with no blemishes.',
      verified: true,
      helpful: 7
    }
  ],
  'custom-file-printing': [
    {
      id: 'rev-cfp-1',
      productId: 'custom-file-printing',
      author: 'Gaurav Bhatt',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-18',
      headline: 'Durable 450 GSM board files with heavy metal clips',
      comment: 'We order all our legal files and audit binders from Dahej Support. Heavy duty clips don\\'t bend and the matte lamination prevents edge tearing.',
      verified: true,
      helpful: 13
    },
    {
      id: 'rev-cfp-2',
      productId: 'custom-file-printing',
      author: 'Rakesh Shah',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-15',
      headline: 'Durable binding and crystal clear corporate logo printing',
      comment: 'We use these custom printed ring files for all our ISO audit documentation. The laminated board withstands frequent office handling.',
      verified: true,
      helpful: 9
    },
    {
      id: 'rev-cfp-3',
      productId: 'custom-file-printing',
      author: 'Divya Parmar',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-11',
      headline: 'High precision indexing and vibrant spine printing',
      comment: 'Organized our annual project proposals in these branded executive binders. Excellent paper stock and rigid build.',
      verified: true,
      helpful: 8
    },
    {
      id: 'rev-cfp-4',
      productId: 'custom-file-printing',
      author: 'Amit Chauhan',
      city: 'Surat',
      rating: 4,
      date: '2026-09-06',
      headline: 'Heavy duty clips that never slip or tear pages',
      comment: 'Reliable supplier for office printing supplies. The matte lamination gives a very professional presentation touch.',
      verified: true,
      helpful: 6
    }
  ],
  'printed-office-folder-executive': [
    {
      id: 'rev-pof-1',
      productId: 'printed-office-folder-executive',
      author: 'Kinjal Parekh',
      city: 'Dahej / Bharuch',
      rating: 5,
      date: '2026-09-22',
      headline: 'Gold foil stamping looks extremely prestigious',
      comment: 'Our presentation folders with metallic gold foil stamping turned out fantastic. Clients at our Dahej industrial expo specifically remarked on how luxurious our folders felt.',
      verified: true,
      helpful: 16
    },
    {
      id: 'rev-pof-2',
      productId: 'printed-office-folder-executive',
      author: 'Jignesh Patel',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-18',
      headline: 'Stunning metallic gold foil stamping on heavy stock',
      comment: 'Our client proposal folders made an outstanding first impression during our supplier negotiations. Luxury texture.',
      verified: true,
      helpful: 12
    },
    {
      id: 'rev-pof-3',
      productId: 'printed-office-folder-executive',
      author: 'Pradeep Nair',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-13',
      headline: 'Crisp inside pockets with business card slits',
      comment: 'Everything fits neatly without tearing. Premium 400 GSM cardstock with clean die-cutting and rich matte coating.',
      verified: true,
      helpful: 8
    },
    {
      id: 'rev-pof-4',
      productId: 'printed-office-folder-executive',
      author: 'Shailesh Dave',
      city: 'Ankleshwar',
      rating: 4,
      date: '2026-09-07',
      headline: 'Prompt delivery and immaculate batch printing quality',
      comment: 'Ordered 200 folders for our corporate conference. Colors matched our branding guidelines down to the exact Pantone shade.',
      verified: true,
      helpful: 6
    }
  ],
  'custom-fine-art-canvas': [
    {
      id: 'rev-fac-1',
      productId: 'custom-fine-art-canvas',
      author: 'Rohan Merchant',
      city: 'Surat',
      rating: 5,
      date: '2026-09-25',
      headline: 'Breathtaking 12-color archival giclée canvas',
      comment: 'Printed a 30x40 landscape photography canvas. The texture of the 380 GSM natural cotton and depth of black tones are extraordinary. Gallery wrapping around the pine frame is taut and flawless.',
      verified: true,
      helpful: 28
    },
    {
      id: 'rev-fac-2',
      productId: 'custom-fine-art-canvas',
      author: 'Smita Kothari',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-20',
      headline: 'Gallery grade texture with vibrant pigment saturation',
      comment: 'Transformed our wedding portrait into an art gallery canvas. The natural cotton grain and wood stretching are museum class.',
      verified: true,
      helpful: 14
    },
    {
      id: 'rev-fac-3',
      productId: 'custom-fine-art-canvas',
      author: 'Vijay Makwana',
      city: 'Dahej',
      rating: 5,
      date: '2026-09-15',
      headline: 'Zero sag pine frame and UV protective lacquer coating',
      comment: 'Hung in our lobby reception under direct spot lighting. Zero glare, high contrast blacks, and rich vibrant hues.',
      verified: true,
      helpful: 11
    },
    {
      id: 'rev-fac-4',
      productId: 'custom-fine-art-canvas',
      author: 'Aarti Panchal',
      city: 'Surat',
      rating: 4,
      date: '2026-09-09',
      headline: 'Exceeded expectations in turnaround and color accuracy',
      comment: 'Dahej Support shared a WhatsApp color proof before final print. The canvas arrived flawless and ready to hang.',
      verified: true,
      helpful: 7
    }
  ]
};`;

const newInitFallback = `  const seedList = SEED_PRODUCT_REVIEWS[pId] || [
    {
      id: \`rev-\${pId}-1\`,
      productId: pId,
      author: 'Verified Studio Patron',
      city: 'Bharuch',
      rating: 5,
      date: '2026-09-20',
      headline: 'Exceptional craftsmanship and swift turnaround',
      comment: 'The materials, print fidelity, and bespoke finishing from Dahej Support were top notch. Seamless process from ordering to doorstep delivery.',
      verified: true,
      helpful: 14
    },
    {
      id: \`rev-\${pId}-2\`,
      productId: pId,
      author: 'Rajesh P.',
      city: 'Dahej GIDC',
      rating: 5,
      date: '2026-09-16',
      headline: 'Superb quality and rapid turnaround',
      comment: 'Very professional team in Bharuch. The prints arrived safely packed and flawless in every corner.',
      verified: true,
      helpful: 10
    },
    {
      id: \`rev-\${pId}-3\`,
      productId: pId,
      author: 'Deepak Shah',
      city: 'Ankleshwar',
      rating: 5,
      date: '2026-09-12',
      headline: 'Highly recommend for custom bespoke work',
      comment: 'Ordered for our office presentation. The material feel and finish exceeded all expectations.',
      verified: true,
      helpful: 8
    },
    {
      id: \`rev-\${pId}-4\`,
      productId: pId,
      author: 'Sneha Patel',
      city: 'Bharuch',
      rating: 4,
      date: '2026-09-05',
      headline: 'Stunning archival finish and sturdy craftsmanship',
      comment: 'Will definitely order again for future framing needs. Top tier studio in the region!',
      verified: true,
      helpful: 6
    }
  ];

  if (!productReviews || productReviews.length === 0) {
    const local = localStorage.getItem(storageKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          // If cached local reviews have fewer items than seed, sync with seed so all 4 columns are filled
          if (parsed.length < seedList.length) {
            productReviews = seedList;
            localStorage.setItem(storageKey, JSON.stringify(seedList));
          } else {
            productReviews = parsed;
          }
        }
      } catch (_) {}
    }
    if (!productReviews || productReviews.length === 0) {
      productReviews = seedList;
      try {
        localStorage.setItem(storageKey, JSON.stringify(productReviews));
      } catch (_) {}
    }
  }`;

jsFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // Replace SEED_PRODUCT_REVIEWS
  const seedRegex = /const SEED_PRODUCT_REVIEWS = \{[\s\S]*?\n\};/;
  if (seedRegex.test(content)) {
    content = content.replace(seedRegex, newSeedData);
  }

  // Replace fallback in initProductReviews
  const fallbackRegex = /\/\/\s*2\.\s*Fallback to localStorage or seed[\s\S]*?localStorage\.setItem\(storageKey,\s*JSON\.stringify\(productReviews\)\);\s*\}\s*catch\s*\(_\)\s*\{\}\s*\}\s*\}/;
  if (fallbackRegex.test(content)) {
    content = content.replace(fallbackRegex, `// 2. Fallback to localStorage or seed\n${newInitFallback}`);
  }

  // Add data-count attribute in renderReviewsListOnly
  const listContainerRegex = /function renderReviewsListOnly\(\)\s*\{\s*const listContainer = document\.getElementById\('reviewsListContainer'\);\s*if \(!listContainer\) return;/;
  const listContainerReplacement = `function renderReviewsListOnly() {
  const listContainer = document.getElementById('reviewsListContainer');
  if (!listContainer) return;`;
  
  // Make sure listContainer sets data-count right before innerHTML
  if (!content.includes("listContainer.setAttribute('data-count'")) {
    content = content.replace(
      'listContainer.innerHTML = filtered.map(rev => {',
      `listContainer.setAttribute('data-count', Math.min(filtered.length, 4));\n  listContainer.innerHTML = filtered.map(rev => {`
    );
  }

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated JS in ${file}`);
});

console.log('Reviews layout and data successfully updated across all files!');
