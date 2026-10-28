/**
 * RAJESH FRAMING - DATABASE ADAPTER
 * Seamless dual-mode database:
 * 1. Cloud Mode: Powered by Supabase (PostgreSQL) when SUPABASE_URL is configured
 * 2. Local Mode: Falls back gracefully to data/*.json for local offline development
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Ensure local data dir exists when running in local development
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (_) {}
}

// Global in-memory cache to guarantee instant persistence across all lambda invocations in the instance
global._rfMemoryStore = global._rfMemoryStore || {};

function getWritableFilePath(filePath) {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join(os.tmpdir(), 'rajesh_framing_data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch (_) {}
    return path.join(tmpDir, path.basename(filePath));
  }
  return filePath;
}

// Helper: Local JSON Read / Write with Serverless /tmp and Memory Persistence
function readJson(filePath, defaultValue = []) {
  const key = path.basename(filePath, '.json');

  // 1. Return in-memory cached copy if already updated in current process
  if (global._rfMemoryStore[key] !== undefined && global._rfMemoryStore[key] !== null) {
    return global._rfMemoryStore[key];
  }

  try {
    const writablePath = getWritableFilePath(filePath);

    // 2. Check writable storage location (e.g. /tmp on Vercel)
    if (writablePath !== filePath && fs.existsSync(writablePath)) {
      const data = fs.readFileSync(writablePath, 'utf8');
      const parsed = JSON.parse(data);
      global._rfMemoryStore[key] = parsed;
      return parsed;
    }

    // 3. Check bundled read-only repository location
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      global._rfMemoryStore[key] = parsed;
      return parsed;
    }

    global._rfMemoryStore[key] = defaultValue;
    return defaultValue;
  } catch (err) {
    console.warn(`[readJson Warning] Could not parse ${filePath}:`, err.message);
    global._rfMemoryStore[key] = defaultValue;
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  const key = path.basename(filePath, '.json');
  global._rfMemoryStore[key] = data;

  try {
    const writablePath = getWritableFilePath(filePath);
    fs.writeFileSync(writablePath, JSON.stringify(data, null, 2), 'utf8');

    // Also persist to original data directory if running in local environment
    if (writablePath !== filePath && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error(`[writeJson Error] Could not write to ${filePath}:`, err.message);
    return false;
  }
}

/**
 * Automatically sync static JS catalog files whenever products are created, modified, or deleted
 */
function syncProductsDataFiles(products) {
  try {
    const businessInfo = {
      name: "Rajendra Studio & Framing",
      tagline: "Frames, Printing & Personalized Products",
      phone: process.env.STUDIO_PHONE || "+91 95107 57513",
      phoneRaw: "+919510757513",
      whatsapp: process.env.STUDIO_PHONE || "+91 95107 57513",
      whatsappNumber: process.env.STUDIO_WHATSAPP || "919510757513",
      email: "info@rajendrastudioandgifts.in",
      address: "Dahej GIDC, Bharuch, Gujarat 392130",
      workingHours: "Mon - Sat: 9:30 AM - 8:30 PM | Sun: 10:00 AM - 2:00 PM",
      establishedYear: 2008,
      framesCrafted: "25,000+",
      satisfiedClients: "18,500+",
      ratingScore: "4.9 / 5.0"
    };

    const fileContent = `/**
 * RAJENDRA STUDIO & FRAMING - MASTER PRODUCTS CATALOG DATA
 * Total: ${products.length} products - Auto-synced from Admin Panel
 */

var PRODUCTS_DATA = ${JSON.stringify(products, null, 2)};

if (typeof window !== 'undefined') {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
}

// Business contact data
const BUSINESS_INFO = ${JSON.stringify(businessInfo, null, 2)};

// Export for module environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS_DATA, BUSINESS_INFO };
}
`;

    const publicPath = path.join(__dirname, '..', 'public', 'js', 'products-data.js');
    const rootPath = path.join(__dirname, '..', 'js', 'products-data.js');

    if (!process.env.VERCEL) {
      if (fs.existsSync(path.dirname(publicPath))) {
        fs.writeFileSync(publicPath, fileContent, 'utf8');
      }
      if (fs.existsSync(path.dirname(rootPath))) {
        fs.writeFileSync(rootPath, fileContent, 'utf8');
      }
    }
  } catch (err) {
    console.warn('⚠️ [DATABASE] Failed to sync products-data.js:', err.message);
  }
}

/**
 * Automatically sync static JS categories files whenever categories are created, modified, or deleted
 */
function syncCategoriesDataFiles(categories) {
  try {
    const fileContent = `/**
 * RAJENDRA STUDIO & FRAMING - MASTER CATEGORIES DATA
 * Total: ${categories.length} categories - Auto-synced from Admin Panel
 */

var CATEGORIES_DATA = ${JSON.stringify(categories, null, 2)};

// Browser window global export
if (typeof window !== 'undefined') {
  window.CATEGORIES_DATA = CATEGORIES_DATA;
}

// Export for module environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATEGORIES_DATA };
}
`;

    const publicPath = path.join(__dirname, '..', 'public', 'js', 'categories-data.js');
    const rootPath = path.join(__dirname, '..', 'js', 'categories-data.js');

    if (!process.env.VERCEL) {
      if (fs.existsSync(path.dirname(publicPath))) {
        fs.writeFileSync(publicPath, fileContent, 'utf8');
      }
      if (fs.existsSync(path.dirname(rootPath))) {
        fs.writeFileSync(rootPath, fileContent, 'utf8');
      }
    }
  } catch (err) {
    console.warn('⚠️ [DATABASE] Failed to sync categories-data.js:', err.message);
  }
}

// Initialize Supabase Client if env variables are present
// Supports both standard names and Vercel Next.js integration names
const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_KEY || 
                       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                       '';
const supabaseUrl = rawSupabaseUrl.trim().replace(/^["']|["']$/g, '');
const supabaseKey = rawSupabaseKey.trim().replace(/^["']|["']$/g, '');
let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ [DATABASE] Connected to Supabase Cloud Database:', supabaseUrl);
  } catch (e) {
    console.warn('⚠️ [DATABASE] Failed to initialize Supabase client:', e.message);
    supabase = null;
  }
} else {
  console.log('ℹ️ [DATABASE] Supabase credentials not set in environment. Running in Local JSON mode.');
}

function withTimeout(promise, ms, operationName = 'Database operation') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${ms}ms. Check Supabase connection status.`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

module.exports = {
  isCloud: () => Boolean(supabase),
  supabase,
  syncProductsDataFiles,
  syncCategoriesDataFiles,
  withTimeout,

  // --- PRODUCTS ---
  async hasProduct(slug) {
    if (!slug) return false;
    const cleanId = String(slug).trim().toLowerCase();
    if (supabase) {
      try {
        const queryPromise = supabase.from('products').select('id').eq('id', cleanId).maybeSingle();
        const { data } = await withTimeout(queryPromise, 3000, 'Supabase hasProduct query');
        if (data && data.id) return true;
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase hasProduct check timed out or failed, using local check:', err.message);
      }
    }
    const local = readJson(PRODUCTS_FILE, []);
    return local.some(p => p.id && p.id.toLowerCase() === cleanId);
  },

  async getProductById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    if (supabase) {
      try {
        const queryPromise = supabase.from('products').select('*').eq('id', cleanId).maybeSingle();
        const { data, error } = await withTimeout(queryPromise, 4000, 'Supabase getProductById query');
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            title: data.name,
            category: data.category,
            categoryLabel: data.category_label || data.category,
            price: Number(data.price),
            originalPrice: data.original_price ? Number(data.original_price) : null,
            priceDisplay: data.price_display || `Starting from ₹${data.price}`,
            rating: Number(data.rating) || 5.0,
            reviewsCount: Number(data.reviews_count) || 1,
            badge: data.badge || '',
            image: data.image,
            images: (Array.isArray(data.images) && data.images.length > 0) ? data.images : (data.image ? [data.image] : []),
            shortDescription: data.short_description || '',
            description: data.description || data.short_description || '',
            material: data.material || '',
            printingType: data.printing_type || '',
            status: data.status || 'In Stock',
            inStock: data.in_stock !== undefined ? Boolean(data.in_stock) : (data.status === 'In Stock'),
            stockQty: data.stock_qty !== undefined ? Number(data.stock_qty) : 100,
            leadTime: data.lead_time || '24 - 48 Hours',
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            finishes: Array.isArray(data.finishes) ? data.finishes : [],
            variants: Array.isArray(data.variants) ? data.variants : [],
            features: Array.isArray(data.features) ? data.features : [],
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getProductById error:', err.message);
      }
    }
    const products = readJson(PRODUCTS_FILE, []);
    return products.find(p => p.id === cleanId) || null;
  },

  async getProducts() {
    const localProducts = readJson(PRODUCTS_FILE, []);
    if (supabase) {
      try {
        const queryPromise = supabase.from('products').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 3500, 'Supabase getProducts');
        if (!error && data && data.length > 0) {
          return data.map(remote => ({
            id: remote.id,
            name: remote.name,
            title: remote.name,
            category: remote.category,
            categoryLabel: remote.category_label || remote.categoryLabel || remote.category,
            price: Number(remote.price) || 0,
            originalPrice: remote.original_price ? Number(remote.original_price) : null,
            priceDisplay: remote.price_display || `Starting from ₹${remote.price}`,
            rating: Number(remote.rating) || 5.0,
            reviewsCount: Number(remote.reviews_count) || 1,
            badge: remote.badge || '',
            image: remote.image,
            images: (Array.isArray(remote.images) && remote.images.length > 0) ? remote.images : (remote.image ? [remote.image] : []),
            shortDescription: remote.short_description || '',
            description: remote.description || remote.short_description || '',
            material: remote.material || '',
            printingType: remote.printing_type || '',
            status: remote.status || 'In Stock',
            inStock: remote.in_stock !== undefined ? Boolean(remote.in_stock) : (remote.status === 'In Stock'),
            stockQty: remote.stock_qty !== undefined ? Number(remote.stock_qty) : 100,
            leadTime: remote.lead_time || '24 - 48 Hours',
            sizes: Array.isArray(remote.sizes) ? remote.sizes : [],
            finishes: Array.isArray(remote.finishes) ? remote.finishes : [],
            variants: Array.isArray(remote.variants) ? remote.variants : [],
            features: Array.isArray(remote.features) ? remote.features : [],
            createdAt: remote.created_at,
            updatedAt: remote.updated_at
          }));
        }

        // If Supabase has 0 products and local products exist, seed in a single batch upsert
        if (!error && (!data || data.length === 0) && localProducts.length > 0) {
          const seedRows = localProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            category_label: p.categoryLabel || p.category,
            price: Number(p.price) || 0,
            original_price: p.originalPrice ? Number(p.originalPrice) : null,
            price_display: p.priceDisplay || `Starting from ₹${p.price}`,
            rating: Number(p.rating) || 5.0,
            reviews_count: Number(p.reviewsCount) || 1,
            badge: p.badge || '',
            image: p.image,
            images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
            short_description: p.shortDescription || '',
            description: p.description || '',
            material: p.material || '',
            printing_type: p.printingType || '',
            status: p.status || 'In Stock',
            in_stock: p.inStock !== undefined ? Boolean(p.inStock) : true,
            stock_qty: p.stockQty !== undefined ? Number(p.stockQty) : 100,
            lead_time: p.leadTime || '24 - 48 Hours',
            sizes: p.sizes || [],
            finishes: p.finishes || []
          }));
          await withTimeout(supabase.from('products').upsert(seedRows, { onConflict: 'id' }), 5000, 'Supabase seedProducts');
          return localProducts;
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getProducts error, using fallback:', err.message);
      }
    }
    return localProducts;
  },

  async saveProduct(product) {
    const cleanImage = (product.image && typeof product.image === 'string' && !product.image.startsWith('data:image/'))
      ? product.image.trim()
      : (Array.isArray(product.images) && product.images[0] && !product.images[0].startsWith('data:image/')
        ? product.images[0].trim()
        : 'assets/images/custom_canvas.jpg');

    const cleanImages = (Array.isArray(product.images) && product.images.length > 0)
      ? product.images.filter(img => typeof img === 'string' && !img.startsWith('data:image/')).map(s => s.trim())
      : [cleanImage];

    const cleanFinishes = Array.isArray(product.finishes)
      ? product.finishes.map(f => ({
          ...f,
          image: (f.image && typeof f.image === 'string' && !f.image.startsWith('data:image/')) ? f.image.trim() : cleanImage
        }))
      : [];

    const sanitizedProduct = {
      ...product,
      image: cleanImage,
      images: cleanImages,
      finishes: cleanFinishes,
      categoryLabel: product.categoryLabel || product.category_label || product.category,
      price: Number(product.price) || 0,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      priceDisplay: product.priceDisplay || `Starting from ₹${Number(product.price) || 0}`,
      rating: product.rating !== undefined ? Number(product.rating) : 5.0,
      reviewsCount: product.reviewsCount ? Number(product.reviewsCount) : 1,
      badge: (product.badge || '').trim(),
      shortDescription: (product.shortDescription || product.short_description || '').trim(),
      description: (product.description || product.shortDescription || '').trim(),
      material: (product.material || '').trim(),
      printingType: (product.printingType || product.printing_type || '').trim(),
      status: product.status || 'In Stock',
      inStock: product.inStock !== undefined ? Boolean(product.inStock) : (product.status === 'In Stock'),
      stockQty: product.stockQty !== undefined ? Number(product.stockQty) : 100,
      leadTime: product.leadTime || product.lead_time || '24 - 48 Hours',
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
      features: Array.isArray(product.features) ? product.features : [],
      updatedAt: new Date().toISOString()
    };

    if (supabase) {
      try {
        const supabaseRow = {
          id: sanitizedProduct.id,
          name: sanitizedProduct.name,
          category: sanitizedProduct.category,
          category_label: sanitizedProduct.categoryLabel,
          price: sanitizedProduct.price,
          original_price: sanitizedProduct.originalPrice,
          price_display: sanitizedProduct.priceDisplay,
          rating: sanitizedProduct.rating,
          reviews_count: sanitizedProduct.reviewsCount,
          badge: sanitizedProduct.badge,
          image: sanitizedProduct.image,
          images: sanitizedProduct.images,
          short_description: sanitizedProduct.shortDescription,
          description: sanitizedProduct.description,
          material: sanitizedProduct.material,
          printing_type: sanitizedProduct.printingType,
          status: sanitizedProduct.status,
          in_stock: sanitizedProduct.inStock,
          stock_qty: sanitizedProduct.stockQty,
          lead_time: sanitizedProduct.leadTime,
          sizes: sanitizedProduct.sizes,
          finishes: sanitizedProduct.finishes,
          variants: sanitizedProduct.variants,
          features: sanitizedProduct.features,
          created_at: sanitizedProduct.createdAt || new Date().toISOString(),
          updated_at: sanitizedProduct.updatedAt || new Date().toISOString()
        };
        const upsertPromise = supabase.from('products').upsert(supabaseRow, { onConflict: 'id' });
        const { error } = await withTimeout(upsertPromise, 8000, 'Supabase products table upsert');
        if (error) {
          console.error('❌ [DATABASE] Supabase saveProduct error:', error.message);
          throw new Error('Supabase database error: ' + error.message);
        }
      } catch (err) {
        console.error('❌ [DATABASE] Supabase saveProduct exception:', err.message);
        throw err;
      }
    }

    const products = readJson(PRODUCTS_FILE, []);
    const idx = products.findIndex(p => p.id === sanitizedProduct.id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...sanitizedProduct };
    } else {
      products.unshift(sanitizedProduct);
    }
    writeJson(PRODUCTS_FILE, products);
    setImmediate(() => {
      try { syncProductsDataFiles(products); } catch (_) {}
    });
    return sanitizedProduct;
  },

  async deleteProduct(id) {
    if (supabase) {
      try {
        const delPromise = supabase.from('products').delete().eq('id', id);
        const { error } = await withTimeout(delPromise, 5000, 'Supabase deleteProduct');
        if (error) {
          console.error('❌ [DATABASE] Supabase deleteProduct error:', error.message);
          throw new Error('Supabase database error: ' + error.message);
        }
      } catch (err) {
        console.error('❌ [DATABASE] Supabase deleteProduct exception:', err.message);
        throw err;
      }
    }
    let products = readJson(PRODUCTS_FILE, []);
    products = products.filter(p => p.id !== id);
    writeJson(PRODUCTS_FILE, products);
    setImmediate(() => {
      try { syncProductsDataFiles(products); } catch (_) {}
    });
    return true;
  },

  // --- CATEGORIES ---
  async getCategories() {
    const defaultCategories = [
      { id: 'frames', name: 'Studio & Framing', icon: '🖼️', desc: 'Classic wood and acrylic glass frames, certificate frames, collage memory boxes, and gallery wall displays.', color: '#854d0e', bg: 'rgba(234, 179, 8, 0.15)', badge: 'Studio & Framing', isDefault: true },
      { id: 'personalized', name: 'Personalized Printing', icon: '☕', desc: 'Custom printed ceramic mugs, insulated bottles, custom apparel, and personalized daily keepsakes.', color: '#1e40af', bg: 'rgba(59, 130, 246, 0.15)', badge: 'Personalized Printing', isDefault: true },
      { id: 'office', name: 'Office Printing', icon: '📁', desc: 'Corporate presentation folders, customized file binders, business cards, letterheads, and executive desk accessories.', color: '#166534', bg: 'rgba(34, 197, 94, 0.15)', badge: 'Office Printing', isDefault: true },
      { id: 'custom', name: 'Custom Printing', icon: '🎨', desc: 'Museum-grade canvas gallery wraps, edge-to-edge acrylic prints, metallic prints, and bespoke art installations.', color: '#6b21a8', bg: 'rgba(168, 85, 247, 0.15)', badge: 'Custom Printing', isDefault: true },
      { id: 'gifts', name: 'Photo Gifts & Keepsakes', icon: '🎁', desc: 'Personalized 3D photo crystals, acrylic desktop plaques, customized keychains, and commemorative photo clocks.', color: '#9d174d', bg: 'rgba(236, 72, 153, 0.15)', badge: 'Photo Gifts & Keepsakes', isDefault: true },
      { id: 'canvas-gallery', name: 'Canvas Gallery', icon: '🖼️', desc: 'Museum-quality wrapped canvas prints and framed canvas arts.', badge: 'Premium Canvas', color: '#c99a3d', bg: 'rgba(201, 154, 61, 0.15)', isDefault: false, createdAt: '2026-10-25T19:23:35.568Z' },
      { id: 'luxury-art', name: 'Luxury Art Collection', icon: '🎨', desc: 'Exclusive handcrafted museum gallery art frames and master prints.', badge: 'Luxury Art', color: '#d97706', bg: 'rgba(201, 154, 61, 0.15)', isDefault: false, createdAt: '2026-10-26T04:07:08.823Z' }
    ];

    if (supabase) {
      try {
        const queryPromise = supabase.from('categories').select('*').order('created_at', { ascending: true });
        const { data, error } = await withTimeout(queryPromise, 3500, 'Supabase getCategories');
        if (!error && data && data.length > 0) {
          const mapped = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '🏷️',
            desc: cat.desc || cat.description || '',
            badge: cat.badge || cat.name,
            color: cat.color || '#C99A3D',
            bg: cat.bg || 'rgba(201, 154, 61, 0.15)',
            isDefault: cat.is_default !== undefined ? Boolean(cat.is_default) : Boolean(cat.isDefault),
            createdAt: cat.created_at || cat.createdAt
          }));
          setImmediate(() => { try { syncCategoriesDataFiles(mapped); } catch (_) {} });
          return mapped;
        }

        // If Supabase has 0 categories, seed default categories in a single batch
        if (!error && (!data || data.length === 0)) {
          const seedCategories = defaultCategories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            desc: c.desc,
            badge: c.badge,
            color: c.color,
            bg: c.bg,
            is_default: c.isDefault,
            created_at: new Date().toISOString()
          }));
          await withTimeout(supabase.from('categories').upsert(seedCategories, { onConflict: 'id' }), 5000, 'Supabase seedCategories');
          return defaultCategories;
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getCategories exception:', err.message);
      }
    }

    let categories = readJson(CATEGORIES_FILE, null);
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      categories = defaultCategories;
      writeJson(CATEGORIES_FILE, categories);
    }
    setImmediate(() => { try { syncCategoriesDataFiles(categories); } catch (_) {} });
    return categories;
  },

  async saveCategory(category) {
    let categories = await this.getCategories();
    const cleanId = (category.id || category.name || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
    const cleanName = (category.name || '').trim();
    const cleanIcon = (category.icon || '🏷️').trim();
    const cleanDesc = (category.desc || category.description || '').trim();
    const cleanBadge = (category.badge || cleanName).trim();
    const cleanColor = category.color || '#C99A3D';
    const cleanBg = category.bg || 'rgba(201, 154, 61, 0.15)';

    const newCategory = {
      id: cleanId,
      name: cleanName,
      icon: cleanIcon,
      desc: cleanDesc,
      badge: cleanBadge,
      color: cleanColor,
      bg: cleanBg,
      isDefault: Boolean(category.isDefault),
      createdAt: category.createdAt || new Date().toISOString()
    };

    if (supabase) {
      try {
        const upsertPromise = supabase.from('categories').upsert({
          id: newCategory.id,
          name: newCategory.name,
          icon: newCategory.icon,
          desc: newCategory.desc,
          badge: newCategory.badge,
          color: newCategory.color,
          bg: newCategory.bg,
          is_default: newCategory.isDefault,
          created_at: newCategory.createdAt
        }, { onConflict: 'id' });
        const { error } = await withTimeout(upsertPromise, 5000, 'Supabase saveCategory');
        if (error) {
          console.error('❌ [DATABASE] Supabase saveCategory error:', error.message);
          throw new Error('Supabase database error: ' + error.message);
        }
      } catch (err) {
        console.error('❌ [DATABASE] Supabase saveCategory exception:', err.message);
        throw err;
      }
    }

    const existingIndex = categories.findIndex(c => c.id.toLowerCase() === cleanId.toLowerCase());
    if (existingIndex !== -1) {
      categories[existingIndex] = { ...categories[existingIndex], ...newCategory };
    } else {
      categories.push(newCategory);
    }

    writeJson(CATEGORIES_FILE, categories);
    syncCategoriesDataFiles(categories);
    return newCategory;
  },

  async deleteCategory(id) {
    const cleanId = (id || '').trim().toLowerCase();
    if (supabase) {
      try {
        const delPromise = supabase.from('categories').delete().eq('id', cleanId);
        const { error } = await withTimeout(delPromise, 5000, 'Supabase deleteCategory');
        if (error) {
          console.error('❌ [DATABASE] Supabase deleteCategory error:', error.message);
          throw new Error('Supabase database error: ' + error.message);
        }
      } catch (err) {
        console.error('❌ [DATABASE] Supabase deleteCategory exception:', err.message);
        throw err;
      }
    }

    let categories = await this.getCategories();
    categories = categories.filter(c => c.id.toLowerCase() !== cleanId);
    writeJson(CATEGORIES_FILE, categories);
    syncCategoriesDataFiles(categories);
    return true;
  },

  // --- ORDERS ---
  async getOrders() {
    if (supabase) {
      try {
        const queryPromise = supabase.from('orders').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 5000, 'Supabase getOrders');
        if (!error && Array.isArray(data)) {
          // Map database columns to app schema
          return data.map(o => ({
            orderId: o.order_id,
            customer: o.customer,
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: Number(o.subtotal) || 0,
            shipping: Number(o.shipping) || 0,
            total: Number(o.total) || 0,
            notes: o.notes || '',
            orderPhoto: o.order_photo || null,
            paymentMethod: o.payment_method || 'Pick up from shop',
            paymentStatus: o.payment_status || 'Pending',
            upiUtr: o.upi_utr || null,
            status: o.status || 'pending',
            confirmedAt: o.confirmed_at || o.confirmedAt || null,
            confirmationDate: o.confirmation_date || o.confirmationDate || null,
            pickedUpAt: o.picked_up_at || o.pickedUpAt || null,
            pickupDate: o.pickup_date || o.pickupDate || null,
            confirmedEmailSent: Boolean(o.confirmed_email_sent || o.confirmedEmailSent),
            readyEmailSent: Boolean(o.ready_email_sent || o.readyEmailSent),
            cancelledEmailSent: Boolean(o.cancelled_email_sent || o.cancelledEmailSent),
            createdAt: o.created_at,
            updatedAt: o.updated_at
          }));
        }
        if (error) console.warn('⚠️ [DATABASE] Supabase getOrders error, falling back to local:', error.message);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getOrders exception, using local:', err.message);
      }
    }
    return readJson(ORDERS_FILE, []);
  },

  async getOrderById(orderId) {
    const cleanId = (orderId || '').trim().replace(/^#/, '');
    if (!cleanId) return null;
    if (supabase) {
      try {
        const queryPromise = supabase
          .from('orders')
          .select('*')
          .ilike('order_id', cleanId)
          .maybeSingle();
        const { data, error } = await withTimeout(queryPromise, 4000, 'Supabase getOrderById');
        if (!error && data) {
          return {
            orderId: data.order_id,
            customer: data.customer,
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: Number(data.subtotal) || 0,
            shipping: Number(data.shipping) || 0,
            total: Number(data.total) || 0,
            notes: data.notes || '',
            orderPhoto: data.order_photo || null,
            paymentMethod: data.payment_method || 'Pick up from shop',
            paymentStatus: data.payment_status || 'Pending',
            upiUtr: data.upi_utr || null,
            status: data.status || 'pending',
            confirmedAt: data.confirmed_at || data.confirmedAt || null,
            confirmationDate: data.confirmation_date || data.confirmationDate || null,
            pickedUpAt: data.picked_up_at || data.pickedUpAt || null,
            pickupDate: data.pickup_date || data.pickupDate || null,
            confirmedEmailSent: Boolean(data.confirmed_email_sent || data.confirmedEmailSent),
            readyEmailSent: Boolean(data.ready_email_sent || data.readyEmailSent),
            cancelledEmailSent: Boolean(data.cancelled_email_sent || data.cancelledEmailSent),
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getOrderById exception:', err.message);
      }
    }
    const orders = readJson(ORDERS_FILE, []);
    return orders.find(o => o.orderId && o.orderId.toLowerCase() === cleanId.toLowerCase()) || null;
  },

  async saveOrder(order) {
    if (!order) return null;
    order.status = order.status || 'pending';
    const dbRow = {
      order_id: order.orderId,
      customer: order.customer || {},
      items: Array.isArray(order.items) ? order.items : [],
      subtotal: Number(order.subtotal) || 0,
      shipping: Number(order.shipping) || 0,
      total: Number(order.total) || 0,
      notes: order.notes || '',
      order_photo: order.orderPhoto || null,
      payment_method: order.paymentMethod || 'Pick up from shop',
      payment_status: order.paymentStatus || 'Pending',
      upi_utr: order.upiUtr || null,
      status: order.status || 'pending',
      confirmed_at: order.confirmedAt || (order.confirmationDate ? new Date(`${order.confirmationDate}T00:00:00Z`).toISOString() : null),
      confirmation_date: order.confirmationDate || null,
      picked_up_at: order.pickedUpAt || (order.pickupDate ? new Date(`${order.pickupDate}T00:00:00Z`).toISOString() : null),
      pickup_date: order.pickupDate || null,
      confirmed_email_sent: Boolean(order.confirmedEmailSent || order.confirmed_email_sent),
      ready_email_sent: Boolean(order.readyEmailSent || order.ready_email_sent),
      cancelled_email_sent: Boolean(order.cancelledEmailSent || order.cancelled_email_sent),
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const upsertPromise = supabase.from('orders').upsert(dbRow, { onConflict: 'order_id' });
        const { error } = await withTimeout(upsertPromise, 6000, 'Supabase saveOrder');
        if (error) {
          console.warn('⚠️ [DATABASE] Supabase saveOrder warning:', error.message);
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase saveOrder exception, syncing locally:', err.message);
      }
    }

    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.orderId && o.orderId.toLowerCase() === order.orderId.toLowerCase());
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...order, updatedAt: new Date().toISOString() };
    } else {
      orders.unshift(order);
    }
    writeJson(ORDERS_FILE, orders);
    return order;
  },

  async deleteOrder(orderId) {
    const cleanId = (orderId || '').trim().replace(/^#/, '');
    if (supabase) {
      try {
        await supabase.from('orders').delete().ilike('order_id', cleanId);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase deleteOrder exception:', err.message);
      }
    }
    let orders = readJson(ORDERS_FILE, []);
    orders = orders.filter(o => o.orderId && o.orderId.toLowerCase() !== cleanId.toLowerCase());
    writeJson(ORDERS_FILE, orders);
    return true;
  },

  async clearAllOrders() {
    if (supabase) {
      try {
        await supabase.from('orders').delete().neq('order_id', '');
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase clearAllOrders exception:', err.message);
      }
    }
    writeJson(ORDERS_FILE, []);
    return true;
  },

  // --- INQUIRIES ---
  async getInquiries() {
    if (supabase) {
      try {
        const queryPromise = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 5000, 'Supabase getInquiries');
        if (!error && Array.isArray(data)) {
          return data.map(i => ({
            id: i.id,
            name: i.name,
            phone: i.phone,
            email: i.email,
            product: i.product,
            specs: i.specs,
            quantity: Number(i.quantity) || 1,
            estimatedValue: Number(i.estimated_value) || 0,
            status: i.status || 'pending',
            hasUpload: Boolean(i.has_upload),
            uploadFileName: i.upload_file_name || null,
            uploadedFileUrl: i.uploaded_file_url || null,
            deliveryAddress: i.delivery_address || null,
            customerPhotoUrl: i.uploaded_file_url || null,
            customerPhotoName: i.upload_file_name || null,
            confirmedAt: i.confirmed_at || i.confirmedAt || null,
            confirmationDate: i.confirmation_date || i.confirmationDate || null,
            pickedUpAt: i.picked_up_at || i.pickedUpAt || null,
            pickupDate: i.pickup_date || i.pickupDate || null,
            confirmedEmailSent: Boolean(i.confirmed_email_sent || i.confirmedEmailSent),
            readyEmailSent: Boolean(i.ready_email_sent || i.readyEmailSent),
            cancelledEmailSent: Boolean(i.cancelled_email_sent || i.cancelledEmailSent),
            createdAt: i.created_at,
            updatedAt: i.updated_at
          }));
        }
        if (error) console.warn('⚠️ [DATABASE] Supabase getInquiries error:', error.message);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getInquiries exception:', err.message);
      }
    }
    return readJson(INQUIRIES_FILE, []);
  },

  async saveInquiry(inquiry) {
    const photoUrl = inquiry.uploadedFileUrl || inquiry.customerPhotoUrl || null;
    const photoName = inquiry.uploadFileName || inquiry.customerPhotoName || null;
    const dbRow = {
      id: inquiry.id,
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email || null,
      product: inquiry.product || 'Photo Frame',
      specs: inquiry.specs || '',
      quantity: Number(inquiry.quantity) || 1,
      estimated_value: Number(inquiry.estimatedValue) || 0,
      notes: inquiry.notes || '',
      status: inquiry.status || 'pending',
      has_upload: Boolean(inquiry.hasUpload || photoUrl),
      upload_file_name: photoName,
      uploaded_file_url: photoUrl,
      delivery_address: inquiry.deliveryAddress || null,
      confirmed_at: inquiry.confirmedAt || (inquiry.confirmationDate ? new Date(`${inquiry.confirmationDate}T00:00:00Z`).toISOString() : null),
      confirmation_date: inquiry.confirmationDate || null,
      picked_up_at: inquiry.pickedUpAt || (inquiry.pickupDate ? new Date(`${inquiry.pickupDate}T00:00:00Z`).toISOString() : null),
      pickup_date: inquiry.pickupDate || null,
      confirmed_email_sent: Boolean(inquiry.confirmedEmailSent || inquiry.confirmed_email_sent),
      ready_email_sent: Boolean(inquiry.readyEmailSent || inquiry.ready_email_sent),
      cancelled_email_sent: Boolean(inquiry.cancelledEmailSent || inquiry.cancelled_email_sent),
      created_at: inquiry.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const upsertPromise = supabase.from('inquiries').upsert(dbRow, { onConflict: 'id' });
        const { error } = await withTimeout(upsertPromise, 6000, 'Supabase saveInquiry');
        if (error) {
          console.warn('⚠️ [DATABASE] Supabase saveInquiry warning:', error.message);
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase saveInquiry exception, syncing locally:', err.message);
      }
    }

    const inquiries = readJson(INQUIRIES_FILE, []);
    const idx = inquiries.findIndex(i => i.id && i.id.toLowerCase() === inquiry.id.toLowerCase());
    if (idx !== -1) {
      inquiries[idx] = { ...inquiries[idx], ...inquiry, updatedAt: new Date().toISOString() };
    } else {
      inquiries.unshift(inquiry);
    }
    writeJson(INQUIRIES_FILE, inquiries);
    return inquiry;
  },

  async deleteInquiry(id) {
    const cleanId = (id || '').trim().replace(/^#/, '');
    if (supabase) {
      try {
        await supabase.from('inquiries').delete().ilike('id', cleanId);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase deleteInquiry exception:', err.message);
      }
    }
    let inquiries = readJson(INQUIRIES_FILE, []);
    inquiries = inquiries.filter(i => i.id && i.id.toLowerCase() !== cleanId.toLowerCase());
    return writeJson(INQUIRIES_FILE, inquiries);
  },

  // --- CONTACT MESSAGES ---
  async getMessages() {
    if (supabase) {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return readJson(MESSAGES_FILE, []);
  },

  async saveMessage(msg) {
    if (supabase) {
      const { error } = await supabase.from('messages').upsert(msg);
      if (!error) return msg;
    }
    const messages = readJson(MESSAGES_FILE, []);
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx !== -1) {
      messages[idx] = { ...messages[idx], ...msg };
    } else {
      messages.unshift(msg);
    }
    writeJson(MESSAGES_FILE, messages);
    return msg;
  },

  async deleteMessage(id) {
    if (supabase) {
      await supabase.from('messages').delete().eq('id', id);
    }
    let messages = readJson(MESSAGES_FILE, []);
    messages = messages.filter(m => m.id !== id);
    return writeJson(MESSAGES_FILE, messages);
  },

  // --- PHOTO UPLOAD HELPER ---
  async uploadPhoto(fileName, base64Data, mimeType = 'image/jpeg') {
    const rawExt = path.extname(fileName) || '.jpg';
    const cleanExt = rawExt.toLowerCase();
    const baseName = path.basename(fileName, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFileName = `frame_photo_${Date.now()}_${baseName.slice(0, 30)}${cleanExt}`;
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. If Supabase is connected, try uploading to 'photos' bucket
    if (supabase) {
      try {
        const { data, error } = await supabase.storage.from('photos').upload(finalFileName, buffer, {
          contentType: mimeType,
          upsert: true
        });
        if (!error && data) {
          const { data: pubData } = supabase.storage.from('photos').getPublicUrl(finalFileName);
          if (pubData && pubData.publicUrl) {
            return {
              fileUrl: pubData.publicUrl,
              fileName: finalFileName,
              fileSize: buffer.length
            };
          }
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload note:', storageErr.message);
      }
    }

    // 2. Try writing to local or /tmp directory
    try {
      const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, finalFileName);
      fs.writeFileSync(filePath, buffer);
      return {
        fileUrl: `/uploads/${finalFileName}`,
        fileName: finalFileName,
        fileSize: buffer.length
      };
    } catch (fsErr) {
      // 3. Fallback: data URL
      console.warn('Local file write fallback to data URL:', fsErr.message);
      return {
        fileUrl: `data:${mimeType};base64,${base64Data}`,
        fileName: finalFileName,
        fileSize: buffer.length
      };
    }
  },

  // --- CONFIG & SESSIONS ---
  async getAdminConfig() {
    if (supabase) {
      const { data, error } = await supabase.from('admin_config').select('*').eq('id', 'default').maybeSingle();
      if (!error && data) {
        return {
          adminEmail: data.admin_email,
          adminPassword: data.admin_password,
          adminName: data.admin_name,
          smtp: data.smtp
        };
      }
    }
    return readJson(CONFIG_FILE, {});
  },

  async saveAdminConfig(cfg) {
    if (supabase) {
      const dbRow = {
        id: 'default',
        admin_email: cfg.adminEmail,
        admin_password: cfg.adminPassword,
        admin_name: cfg.adminName,
        smtp: cfg.smtp,
        updated_at: new Date().toISOString()
      };
      await supabase.from('admin_config').upsert(dbRow);
    }
    return writeJson(CONFIG_FILE, cfg);
  },

  // --- CUSTOMER ACCOUNTS ---
  async getCustomers() {
    if (supabase) {
      const { data, error } = await supabase.from('customers').select('*').order('registered_at', { ascending: false });
      if (!error && data) return data;
    }
    return readJson(CUSTOMERS_FILE, []);
  },

  async saveCustomer(customer) {
    if (supabase) {
      const { error } = await supabase.from('customers').upsert(customer);
      if (!error) return customer;
    }
    const customers = readJson(CUSTOMERS_FILE, []);
    const idx = customers.findIndex(c => c.email && c.email.toLowerCase() === customer.email.toLowerCase());
    if (idx !== -1) {
      customers[idx] = { ...customers[idx], ...customer, updatedAt: new Date().toISOString() };
    } else {
      customers.unshift(customer);
    }
    writeJson(CUSTOMERS_FILE, customers);
    return customer;
  },

  async recordCustomerLogin(email, name = '', phone = '', isVerifiedLogin = true) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const customers = readJson(CUSTOMERS_FILE, []);
    const nowIso = new Date().toISOString();
    
    let cust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (cust) {
      cust.lastLoginAt = nowIso;
      cust.loginCount = (cust.loginCount || 0) + (isVerifiedLogin ? 1 : 0);
      if (isVerifiedLogin) {
        cust.status = 'Active';
      }
      if (name && name.trim() && name.trim() !== 'Valued Customer') cust.name = name.trim();
      if (phone && phone.trim()) cust.phone = phone.trim();
    } else {
      const defaultName = (name && name.trim() && name.trim() !== 'Valued Customer') 
        ? name.trim() 
        : (cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1) : 'Customer');
      
      cust = {
        id: 'CUST-' + String(customers.length + 1).padStart(4, '0'),
        name: defaultName,
        email: cleanEmail,
        phone: (phone && phone.trim()) || '',
        registeredAt: nowIso,
        lastLoginAt: nowIso,
        loginCount: isVerifiedLogin ? 1 : 1,
        totalOrders: 0,
        totalSpent: 0,
        status: isVerifiedLogin ? 'Active' : 'Registered'
      };
      customers.unshift(cust);
    }
    writeJson(CUSTOMERS_FILE, customers);

    if (supabase) {
      try {
        await supabase.from('customers').upsert({
          id: cust.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          registered_at: cust.registeredAt,
          last_login_at: cust.lastLoginAt,
          login_count: cust.loginCount,
          total_orders: cust.totalOrders,
          total_spent: cust.totalSpent,
          status: cust.status,
          updated_at: nowIso
        }, { onConflict: 'email' });
      } catch (err) {
        console.warn('Could not sync customer to Supabase:', err.message);
      }
    }

    return cust;
  },

  async updateCustomerOrderStats(email, orderTotal = 0) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const customers = readJson(CUSTOMERS_FILE, []);
    const cust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (cust) {
      cust.totalOrders = (cust.totalOrders || 0) + 1;
      cust.totalSpent = (cust.totalSpent || 0) + (Number(orderTotal) || 0);
      cust.lastOrderAt = new Date().toISOString();
      writeJson(CUSTOMERS_FILE, customers);
    }
  },

  // --- CUSTOMER REVIEWS ---
  async getReviews(productId = null) {
    if (supabase) {
      try {
        let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (productId) {
          query = query.eq('product_id', productId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(r => ({
            id: r.id,
            productId: r.product_id,
            author: r.author,
            city: r.city || 'Dahej / Bharuch',
            rating: Number(r.rating) || 5,
            date: r.date || '',
            headline: r.headline || '',
            comment: r.comment || '',
            verified: Boolean(r.verified),
            helpful: Number(r.helpful) || 0
          }));
        }
      } catch (err) {
        console.warn('Supabase getReviews error, falling back to local:', err.message);
      }
    }
    const allReviews = readJson(REVIEWS_FILE, []);
    if (productId) {
      return allReviews.filter(r => r.productId === productId);
    }
    return allReviews;
  },

  async saveReview(review) {
    if (supabase) {
      try {
        const dbRow = {
          id: review.id,
          product_id: review.productId,
          author: review.author,
          city: review.city || 'Dahej / Bharuch',
          rating: Number(review.rating) || 5,
          date: review.date || new Date().toISOString().split('T')[0],
          headline: review.headline,
          comment: review.comment,
          verified: review.verified !== false,
          helpful: Number(review.helpful) || 0
        };
        await supabase.from('reviews').upsert(dbRow, { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase saveReview error, writing local:', err.message);
      }
    }
    const reviews = readJson(REVIEWS_FILE, []);
    const idx = reviews.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      reviews[idx] = { ...reviews[idx], ...review };
    } else {
      reviews.unshift(review);
    }
    writeJson(REVIEWS_FILE, reviews);
    return review;
  },

  // Local file references for legacy imports
  readJson,
  writeJson,
  CONFIG_FILE,
  INQUIRIES_FILE,
  PRODUCTS_FILE,
  MESSAGES_FILE,
  ORDERS_FILE,
  SESSIONS_FILE,
  CUSTOMERS_FILE,
  REVIEWS_FILE
};
