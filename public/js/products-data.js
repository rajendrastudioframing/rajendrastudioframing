/**
 * RAJESH FRAMING - MASTER PRODUCTS CATALOG DATA
 * High-end framing and custom printing products
 */

const PRODUCTS_DATA = [
  {
    id: "glass-frame-classic",
    name: "Glass Photo Frame",
    category: "frames",
    categoryLabel: "Glass Frames",
    price: 650,
    priceDisplay: "Starting from ₹650",
    rating: 4.9,
    reviewsCount: 128,
    badge: "Bestseller",
    image: "assets/images/glass_frame.jpg",
    shortDescription: "Elegant glass frames designed to preserve your favorite memories with beveled edges and modern metallic standoffs.",
    description: "Our signature Glass Photo Frame is crafted from optically refined, ultra-clear float glass with diamond-polished beveled edges. Designed to elevate portraits, wedding milestones, and fine art, it features solid brass or gold-finished standoffs that create an elegant floating presence on any desk or wall.",
    material: "Optically Clear Float Glass (4mm / 6mm) with Diamond Beveled Edge",
    printingType: "12-Color Archival Pigment Print (Fade-resistant 50+ yrs)",
    sizes: [
      { name: "6\" × 8\"", price: 650 },
      { name: "8\" × 10\"", price: 950 },
      { name: "10\" × 12\"", price: 1350 },
      { name: "12\" × 18\"", price: 1850 },
      { name: "Custom Size", price: 2200 }
    ],
    finishes: [
      { id: "gold-standoffs", name: "Warm Gold Standoffs", color: "#C99A3D", image: "assets/images/glass_frame.jpg" },
      { id: "royal-blue-glass", name: "Royal Sapphire Blue Accent", color: "#1E3A8A", image: "assets/images/glass_frame_blue.jpg" },
      { id: "silver-standoffs", name: "Brushed Silver Standoffs", color: "#CBD5E1", image: "assets/images/glass_frame_silver.jpg" },
      { id: "black-standoffs", name: "Matte Black Standoffs", color: "#111111", image: "assets/images/glass_frame_black.jpg" }
    ],
    features: [
      "Diamond-polished beveled edges for safe, lustrous finish",
      "Scratch-resistant crystal float glass with zero optical distortion",
      "Sturdy table-stand or heavy-duty wall mount fixtures included",
      "UV-protective barrier prevents photo discoloration over time"
    ],
    leadTime: "24 - 48 Hours"
  },
  {
    id: "plastic-frame-gallery",
    name: "Plastic Photo Frame",
    category: "frames",
    categoryLabel: "Plastic Frames",
    price: 450,
    priceDisplay: "Starting from ₹450",
    rating: 4.8,
    reviewsCount: 94,
    badge: "Popular",
    image: "assets/images/plastic_frame_black.jpg",
    shortDescription: "Durable, lightweight customized polymer frames with archival museum mat board in timeless matte finishes.",
    description: "Manufactured from high-density, eco-friendly structural polymer, our Plastic Photo Frames deliver clean architectural lines without excessive weight. Paired with 1.5mm archival conservation mat board and crystal-clear glazing, these frames are ideal for expansive gallery walls, corridors, and family travel photos.",
    material: "High-density Engineered Polymer with Conservation Mat",
    printingType: "Ultra HD Fine Art Photographic Printing (300 DPI)",
    sizes: [
      { name: "8\" × 10\"", price: 450 },
      { name: "10\" × 12\"", price: 650 },
      { name: "12\" × 18\"", price: 950 },
      { name: "16\" × 24\"", price: 1500 },
      { name: "20\" × 30\"", price: 2100 }
    ],
    finishes: [
      { id: "matte-black", name: "Studio Matte Black", color: "#111111", image: "assets/images/plastic_frame_black.jpg" },
      { id: "royal-blue", name: "Royal Sapphire Blue", color: "#1E3A8A", image: "assets/images/plastic_frame_blue.jpg" },
      { id: "pure-white", name: "Gallery Pure White", color: "#F8FAFC", image: "assets/images/plastic_frame_white.jpg" },
      { id: "warm-walnut", name: "Warm Walnut Grain", color: "#5C3A21", image: "assets/images/plastic_frame_walnut.jpg" },
      { id: "champagne-gold", name: "Champagne Gold", color: "#C99A3D", image: "assets/images/plastic_frame_gold.jpg" }
    ],
    features: [
      "100% moisture-proof, termite-resistant, and impact safe",
      "Bevel-cut conservation mat board included at no extra charge",
      "Dual-direction wall hangers for horizontal or vertical orientation",
      "Quick flexi-tabs on rear for effortless photo swaps"
    ],
    leadTime: "Same Day / 24 Hours"
  },
  {
    id: "printed-water-bottle-steel",
    name: "Bottle Printing",
    category: "personalized",
    categoryLabel: "Personalized Printing",
    price: 499,
    priceDisplay: "Starting from ₹499",
    rating: 4.9,
    reviewsCount: 112,
    badge: "Trending",
    image: "assets/images/printed_bottle.jpg",
    shortDescription: "Personalized printing on insulated stainless steel bottles for corporate branding, personal gifts, and fitness events.",
    description: "Constructed from food-grade 304 stainless steel with double-wall vacuum insulation, our custom bottles are personalized using precision 360° rotary UV printing or fiber laser engraving. Vibrant colors and scratch-proof coatings keep drinks cold for 24 hours and hot for 12 hours.",
    material: "Food-Grade 304 Stainless Steel (Double-Wall Vacuum)",
    printingType: "Full 360° Rotary UV Color Print or Laser Engraving",
    sizes: [
      { name: "500 ml Classic", price: 499 },
      { name: "750 ml Active", price: 649 },
      { name: "1000 ml Hydrate", price: 799 }
    ],
    finishes: [
      { id: "matte-black-bottle", name: "Matte Stealth Black", color: "#111111", image: "assets/images/printed_bottle_black.jpg" },
      { id: "royal-blue-bottle", name: "Midnight Navy Blue", color: "#1E3A8A", image: "assets/images/printed_bottle_blue.jpg" },
      { id: "brushed-silver-bottle", name: "Brushed Metallic Silver", color: "#94A3B8", image: "assets/images/printed_bottle_silver.jpg" }
    ],
    features: [
      "Keeps beverages chilled for 24 hours, steaming hot for 12 hours",
      "BPA-free, condensation-free matte exterior coating",
      "Permanent laser engraving will never chip or peel",
      "Personalize with custom individual names or corporate logos"
    ],
    leadTime: "1 - 2 Business Days"
  },
  {
    id: "customized-coffee-mug",
    name: "Mug Printing",
    category: "personalized",
    categoryLabel: "Personalized Printing",
    price: 249,
    priceDisplay: "Starting from ₹249",
    rating: 4.9,
    reviewsCount: 230,
    badge: "Bestseller",
    image: "assets/images/custom_mug.jpg",
    shortDescription: "Customized ceramic mugs with photos, names, logos or designs. Microwave safe with brilliant high-gloss sublimation.",
    description: "Our custom mugs are crafted from premium grade-A ceramic with an ultra-glossy AAA coating that locks in photographic colors with brilliant saturation. Available in classic white, two-tone color handles, and temperature-sensitive magic mugs that reveal your photograph when hot coffee is poured.",
    material: "Grade AAA Coated Ceramic (Microwave & Dishwasher Safe)",
    printingType: "Full-Surface High-Definition Heat Sublimation Transfer",
    sizes: [
      { name: "Standard 325 ml (11 oz)", price: 249 },
      { name: "Jumbo 450 ml (15 oz)", price: 349 },
      { name: "Magic Color Changing (325 ml)", price: 399 }
    ],
    finishes: [
      { id: "classic-white-mug", name: "Glossy Alpine White", color: "#FFFFFF", image: "assets/images/custom_mug.jpg" },
      { id: "magic-black-mug", name: "Heat-Reactive Stealth Black", color: "#111111", image: "assets/images/custom_mug_black.jpg" },
      { id: "navy-gold-mug", name: "Deep Navy with Gold Trim", color: "#1E3A8A", image: "assets/images/custom_mug.jpg" }
    ],
    features: [
      "100% Dishwasher and microwave safe high-density ceramic",
      "Edge-to-edge panoramic photo printing with rich detail",
      "Fade-proof and scratch-proof archival sublimation glaze",
      "Complimentary padded gift box included"
    ],
    leadTime: "Same Day / 24 Hours"
  },
  {
    id: "custom-file-printing",
    name: "File Printing",
    category: "office",
    categoryLabel: "Office Printing",
    price: 150,
    priceDisplay: "Starting from ₹150",
    rating: 4.8,
    reviewsCount: 65,
    badge: "Office Essential",
    image: "assets/images/printed_file.jpg",
    shortDescription: "Custom printed office document files, clip files, and corporate tender files with branded graphics and metal bindings.",
    description: "Ensure your company, hospital, or institutional files project clean authority. We produce customized office files using reinforced thick board and premium lamination, tailored with custom logo printing, index clips, and multi-ring metal mechanisms.",
    material: "350-450 GSM Heavy Board / Polypropylene with Metal Clip",
    printingType: "High-Speed Offset & Screen Print with Matte Lamination",
    sizes: [
      { name: "A4 Standard Document File", price: 150 },
      { name: "Legal / Box File (2-Inch)", price: 240 },
      { name: "Hospital Case File (Multi-Flap)", price: 190 }
    ],
    finishes: [
      { id: "navy-file", name: "Corporate Navy Blue", color: "#1E3A8A", image: "assets/images/printed_file.jpg" },
      { id: "forest-file", name: "Forest Green", color: "#14532D", image: "assets/images/printed_file_green.jpg" },
      { id: "black-file", name: "Executive Charcoal Black", color: "#111111", image: "assets/images/printed_file_black.jpg" }
    ],
    features: [
      "Heavy-duty metal lever arch or spring clip mechanism",
      "Scuff-resistant thermal matte lamination",
      "Custom internal forms, index dividers, and spine label pockets",
      "Tiered bulk discounts for office and clinic orders"
    ],
    leadTime: "2 - 3 Business Days"
  },
  {
    id: "printed-office-folder-executive",
    name: "Folder Printing",
    category: "office",
    categoryLabel: "Office Printing",
    price: 180,
    priceDisplay: "Starting from ₹180",
    rating: 4.9,
    reviewsCount: 88,
    badge: "Corporate Choice",
    image: "assets/images/printed_folder_navy.jpg",
    shortDescription: "Executive presentation folders with metallic gold foil stamping, debossed logos, and precision die-cut card pockets.",
    description: "Make an unforgettable first impression at client presentations, proposal pitches, and conferences. Crafted from 400+ GSM art card or textured leatherette with metallic foil stamping and die-cut internal pockets for documents and business cards.",
    material: "400 GSM Imperial Art Card / Textured Leatherette",
    printingType: "Metallic Hot Foil Stamping, Debossing & Spot UV",
    sizes: [
      { name: "A4 Single Pocket Presentation Folder", price: 180 },
      { name: "A4 Dual Pocket with Card Slits", price: 260 },
      { name: "Luxury Padded Certificate Folio", price: 490 }
    ],
    finishes: [
      { id: "gold-foil-navy", name: "Navy Blue with Gold Foil", color: "#1E3A8A", image: "assets/images/printed_folder_navy.jpg" },
      { id: "forest-gold", name: "Forest Green with Gold Foil", color: "#14532D", image: "assets/images/printed_folder_green.jpg" },
      { id: "charcoal-gold", name: "Charcoal with Gold Foil", color: "#111111", image: "assets/images/printed_folder_black.jpg" }
    ],
    features: [
      "Precision die-cut pockets hold 25-50 sheets securely",
      "Integrated dual business card slits for effortless contact sharing",
      "Stunning metallic gold or silver hot-stamp foil debossing",
      "Velvet soft-touch lamination resists fingerprints"
    ],
    leadTime: "2 - 4 Business Days"
  },
  {
    id: "custom-fine-art-canvas",
    name: "Custom Printing",
    category: "custom",
    categoryLabel: "Custom Printing",
    price: 850,
    priceDisplay: "Starting from ₹850",
    rating: 5.0,
    reviewsCount: 145,
    badge: "Artisanal",
    image: "assets/images/custom_canvas.jpg",
    shortDescription: "Bespoke fine art canvas gallery wraps, floating acrylic prints, and customized personalized gifting sets.",
    description: "Transform your favorite photography or artwork into museum-grade statement pieces. Printed on 380 GSM 100% natural textured cotton canvas using 12-color archival pigment inks and hand-stretched over kiln-dried pine wood frames, or mounted onto optic cast acrylic blocks with polished edges.",
    material: "380 GSM Pure Cotton Canvas or 5mm Optical Cast Acrylic",
    printingType: "12-Color Giclée Fine Art Archival Printing (1440 DPI)",
    sizes: [
      { name: "12\" × 18\" Gallery Wrap", price: 850 },
      { name: "16\" × 24\" Gallery Wrap", price: 1450 },
      { name: "20\" × 30\" Statement Canvas", price: 2200 },
      { name: "24\" × 36\" Grand Canvas", price: 3400 }
    ],
    finishes: [
      { id: "gallery-wrap-1-5", name: "1.5\" Deep Gallery Wrap", color: "#78716C", image: "assets/images/custom_canvas.jpg" },
      { id: "floating-black", name: "Floating Black Shadowbox", color: "#111111", image: "assets/images/custom_canvas.jpg" },
      { id: "floating-gold", name: "Floating Warm Gold Shadowbox", color: "#C99A3D", image: "assets/images/custom_canvas.jpg" }
    ],
    features: [
      "100% pure cotton canvas sealed with UV protective archival varnish",
      "Hand-stretched by master framers with drum-tight tension",
      "Pre-installed heavy-duty hanging hardware included",
      "Color accuracy certified for professional photographers and artists"
    ],
    leadTime: "2 - 3 Business Days"
  }
];

// Business contact data
const BUSINESS_INFO = {
  name: "Rajesh Framing",
  tagline: "Frames, Printing & Personalized Products",
  phone: "+91 98765 43210",
  phoneRaw: "+919876543210",
  whatsapp: "+91 98765 43210",
  whatsappNumber: "919876543210",
  email: "rajeshframing0@gmail.com",
  address: "Station Road, Opp. Central Plaza, Dahej / Bharuch, Gujarat 392130",
  workingHours: "Mon - Sat: 9:30 AM - 8:30 PM | Sun: 10:00 AM - 2:00 PM",
  establishedYear: 2008,
  framesCrafted: "25,000+",
  satisfiedClients: "18,500+",
  ratingScore: "4.9 / 5.0"
};
