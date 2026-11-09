/**
 * RAJENDRA STUDIO & FRAMING - MASTER PRODUCTS CATALOG DATA
 * Total: 0 products - Auto-synced from Admin Panel
 */

var PRODUCTS_DATA = [];

if (typeof window !== 'undefined') {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
}

// Business contact data
const BUSINESS_INFO = {
  "name": "Rajendra Studio & Framing",
  "tagline": "Frames, Printing & Personalized Products",
  "phone": "+91 95107 57513",
  "phoneRaw": "+919510757513",
  "whatsapp": "+91 95107 57513",
  "whatsappNumber": "919510757513",
  "email": "info@rajendrastudioandgifts.in",
  "address": "Dahej GIDC, Bharuch, Gujarat 392130",
  "workingHours": "Mon - Sat: 9:30 AM - 8:30 PM | Sun: 10:00 AM - 2:00 PM",
  "establishedYear": 2008,
  "framesCrafted": "25,000+",
  "satisfiedClients": "18,500+",
  "ratingScore": "4.9 / 5.0"
};

// Export for module environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS_DATA, BUSINESS_INFO };
}
