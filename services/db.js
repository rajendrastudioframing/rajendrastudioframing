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
const DELETED_ORDERS_FILE = path.join(DATA_DIR, 'deleted-orders.json');
const ORDER_SEQUENCE_FILE = path.join(DATA_DIR, 'order-sequence.json');

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

// High-performance query memory cache (reduces Supabase network latency to sub-millisecond)
let _productsCache = null;
let _productsCacheTime = 0;
let _categoriesCache = null;
let _categoriesCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s TTL

function invalidateProductsCache() {
  _productsCache = null;
  _productsCacheTime = 0;
}

function invalidateCategoriesCache() {
  _categoriesCache = null;
  _categoriesCacheTime = 0;
}

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
 * Permanently Suppressed / Deleted Orders Store
 * Guarantees deleted orders never resurrect on reload, restart, or Brevo email recovery
 */
function getDeletedOrderIdsSet() {
  const arr = readJson(DELETED_ORDERS_FILE, []);
  if (Array.isArray(arr)) {
    return new Set(arr.map(x => String(x).toLowerCase().trim().replace(/^#/, '')));
  }
  return new Set();
}

function recordDeletedOrderIds(ids) {
  if (!Array.isArray(ids) || !ids.length) return;
  const currentSet = getDeletedOrderIdsSet();
  ids.forEach(id => {
    if (!id) return;
    const clean = String(id).trim().replace(/^#/, '').toLowerCase();
    if (clean) currentSet.add(clean);
  });
  const updatedList = Array.from(currentSet);
  writeJson(DELETED_ORDERS_FILE, updatedList);
  try {
    const rawPath = path.join(DATA_DIR, 'deleted-orders.json');
    fs.writeFileSync(rawPath, JSON.stringify(updatedList, null, 2), 'utf8');
  } catch (_) {}
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

// Circuit breaker state for Supabase
const _supabaseHealth = {
  isOperational: true,
  lastChecked: 0,
  failureCount: 0,
  lastError: null
};

function isSupabaseOperational() {
  return Boolean(supabase);
}

function recordSupabaseSuccess() {
  _supabaseHealth.isOperational = true;
  _supabaseHealth.failureCount = 0;
  _supabaseHealth.lastError = null;
  _supabaseHealth.lastChecked = Date.now();
}

function recordSupabaseFailure(err) {
  _supabaseHealth.lastError = err ? err.message : 'Unknown error';
  _supabaseHealth.lastChecked = Date.now();
}

function withTimeout(promise, ms, operationName = 'Database operation') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${ms}ms. Check Supabase connection status.`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise])
    .then(res => {
      recordSupabaseSuccess();
      return res;
    })
    .catch(err => {
      recordSupabaseFailure(err);
      throw err;
    })
    .finally(() => {
      clearTimeout(timer);
    });
}

function isTableMissingError(err) {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = String(err.code || '');
  return code === 'PGRST204' || 
         code === '42P01' || 
         msg.includes('schema cache') || 
         msg.includes('not find the table') || 
         (msg.includes('relation') && msg.includes('does not exist'));
}

function safeIsoDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s + 'T00:00:00.000Z';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function resolveBestStatus(statusA, statusB) {
  const norm = (s) => String(s || '').toLowerCase().trim();
  const a = norm(statusA);
  const b = norm(statusB);

  const getWeight = (s) => {
    if (s === 'cancelled' || s === 'canceled') return 60;
    if (s === 'picked_up' || s === 'picked up' || s === 'completed') return 50;
    if (s === 'ready_for_pickup' || s === 'ready for pickup' || s === 'shipped' || s === 'dispatched' || s === 'pickup ready') return 40;
    if (s === 'confirmed' || s === 'accepted') return 30;
    if (s === 'in progress' || s === 'in production' || s === 'contacted') return 20;
    if (s === 'pending' || s === 'new' || !s) return 10;
    return 15;
  };

  const wA = getWeight(a);
  const wB = getWeight(b);
  if (wB > wA) return statusB;
  if (wA > wB) return statusA;
  return statusA || statusB || 'pending';
}

module.exports = {
  resolveBestStatus,
  safeIsoDate,
  isCloud: () => Boolean(supabase && isSupabaseOperational()),
  isSupabaseConfigured: () => Boolean(supabase),
  getSupabaseHealth: () => ({ ..._supabaseHealth, isCloud: Boolean(supabase && isSupabaseOperational()) }),
  supabase,
  syncProductsDataFiles,
  syncCategoriesDataFiles,
  withTimeout,

  // --- PERMANENT DELETED ORDERS REGISTRY (SUPABASE CLOUD + LOCAL) ---
  async getDeletedOrderIds() {
    // 1. Authoritative Supabase Cloud persistent registry
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('admin_config').select('smtp').eq('id', 'deleted_orders').maybeSingle();
        const { data, error } = await withTimeout(queryPromise, 6000, 'Supabase getDeletedOrderIds');
        if (!error && data && data.smtp && Array.isArray(data.smtp.ids)) {
          const freshSet = new Set();
          data.smtp.ids.forEach(id => {
            if (id) freshSet.add(String(id).toLowerCase().trim().replace(/^#/, ''));
          });
          global._rfMemoryStore = global._rfMemoryStore || {};
          global._rfMemoryStore['deleted_orders'] = Array.from(freshSet);
          return freshSet;
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Failed to read deleted_orders from Supabase, using cached fallback:', err.message);
      }
    }

    // 2. In-memory fast cache or local fallback
    const ids = new Set();
    if (global._rfMemoryStore && Array.isArray(global._rfMemoryStore['deleted_orders'])) {
      global._rfMemoryStore['deleted_orders'].forEach(id => {
        if (id) ids.add(String(id).toLowerCase().trim().replace(/^#/, ''));
      });
      return ids;
    }
    try {
      const localSet = getDeletedOrderIdsSet();
      localSet.forEach(id => ids.add(id));
    } catch (_) {}
    return ids;
  },

  async recordDeletedOrderIds(newIds) {
    if (!Array.isArray(newIds) || !newIds.length) return;
    const cleanList = newIds.map(x => String(x || '').toLowerCase().trim().replace(/^#/, '')).filter(Boolean);
    if (!cleanList.length) return;

    // 1. Local storage & in-memory cache
    try {
      recordDeletedOrderIds(cleanList);
    } catch (_) {}
    global._rfMemoryStore = global._rfMemoryStore || {};
    const memCurrent = new Set(global._rfMemoryStore['deleted_orders'] || []);
    cleanList.forEach(id => memCurrent.add(id));
    global._rfMemoryStore['deleted_orders'] = Array.from(memCurrent);

    // 2. Supabase Cloud persistent storage in admin_config
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('admin_config').select('smtp').eq('id', 'deleted_orders').maybeSingle();
        const { data } = await withTimeout(queryPromise, 3500, 'Supabase fetch deleted_orders');
        let existingIds = [];
        if (data && data.smtp && Array.isArray(data.smtp.ids)) {
          existingIds = data.smtp.ids;
        }
        const combined = Array.from(new Set([...existingIds, ...cleanList]));
        const upsertPromise = supabase.from('admin_config').upsert({
          id: 'deleted_orders',
          admin_name: 'Deleted Orders Registry',
          smtp: { ids: combined, updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString()
        });
        await withTimeout(upsertPromise, 4000, 'Supabase upsert deleted_orders');
        console.log(`🛡️ [DATABASE] Successfully registered ${cleanList.length} deleted order IDs in Supabase Cloud.`);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Failed to write deleted_orders to Supabase:', err.message);
      }
    }
  },

  async unrecordDeletedOrderIds(idsToUnrecord) {
    if (!Array.isArray(idsToUnrecord) || !idsToUnrecord.length) return;
    const toRemove = new Set(idsToUnrecord.map(x => String(x || '').toLowerCase().trim().replace(/^#/, '')).filter(Boolean));
    if (!toRemove.size) return;

    // 1. Remove from local memory
    if (global._rfMemoryStore && Array.isArray(global._rfMemoryStore['deleted_orders'])) {
      global._rfMemoryStore['deleted_orders'] = global._rfMemoryStore['deleted_orders'].filter(id => {
        const clean = String(id || '').toLowerCase().trim().replace(/^#/, '');
        return !toRemove.has(clean);
      });
    }

    // 2. Remove from local file
    try {
      let localArr = readJson(DELETED_ORDERS_FILE, []);
      if (Array.isArray(localArr)) {
        localArr = localArr.filter(id => {
          const clean = String(id || '').toLowerCase().trim().replace(/^#/, '');
          return !toRemove.has(clean);
        });
        writeJson(DELETED_ORDERS_FILE, localArr);
        const rawPath = path.join(DATA_DIR, 'deleted-orders.json');
        fs.writeFileSync(rawPath, JSON.stringify(localArr, null, 2), 'utf8');
      }
    } catch (_) {}

    // 3. Remove from Supabase Cloud persistent registry
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('admin_config').select('smtp').eq('id', 'deleted_orders').maybeSingle();
        const { data } = await withTimeout(queryPromise, 3500, 'Supabase fetch deleted_orders');
        if (data && data.smtp && Array.isArray(data.smtp.ids)) {
          const remaining = data.smtp.ids.filter(id => {
            const clean = String(id || '').toLowerCase().trim().replace(/^#/, '');
            return !toRemove.has(clean);
          });
          const upsertPromise = supabase.from('admin_config').upsert({
            id: 'deleted_orders',
            admin_name: 'Deleted Orders Registry',
            smtp: { ids: remaining, updatedAt: new Date().toISOString() },
            updated_at: new Date().toISOString()
          });
          await withTimeout(upsertPromise, 4000, 'Supabase upsert deleted_orders');
          console.log(`🛡️ [DATABASE] Successfully unblacklisted ${toRemove.size} order ID(s) from deleted registry in Supabase.`);
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Failed to unrecord deleted_orders in Supabase:', err.message);
      }
    }
  },

  // --- MONOTONIC PERSISTENT ORDER SEQUENCE GENERATOR ---
  // Guarantees order numbers ONLY INCREMENT and NEVER decrease, even if orders are deleted
  async reserveNextOrderId(forcedYear) {
    const currentYear = forcedYear || new Date().getFullYear();
    const ordPrefixRegex = new RegExp(`^RF-ORD-${currentYear}-(\\d+)$`, 'i');

    let highestKnown = 0;

    // 1. Check in-memory fast cache
    if (global._rfMemoryStore && global._rfMemoryStore['order_sequence']) {
      const mem = global._rfMemoryStore['order_sequence'];
      if (mem && (mem.currentYear === currentYear || mem.year === currentYear)) {
        if (typeof mem.lastSequence === 'number' && mem.lastSequence > highestKnown) {
          highestKnown = mem.lastSequence;
        }
      }
    }

    // 2. Check local file storage (serverless /tmp or local data)
    try {
      const localSeq = readJson(ORDER_SEQUENCE_FILE, { lastSequence: 0, currentYear });
      if (localSeq && (localSeq.currentYear === currentYear || localSeq.year === currentYear)) {
        if (typeof localSeq.lastSequence === 'number' && localSeq.lastSequence > highestKnown) {
          highestKnown = localSeq.lastSequence;
        }
      }
    } catch (_) {}

    // 3. Check Supabase Cloud persistent counter in admin_config table
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('admin_config').select('smtp').eq('id', 'order_sequence').maybeSingle();
        const { data } = await withTimeout(queryPromise, 3500, 'Supabase fetch order_sequence');
        if (data && data.smtp && typeof data.smtp.lastSequence === 'number') {
          if (data.smtp.currentYear === currentYear && data.smtp.lastSequence > highestKnown) {
            highestKnown = data.smtp.lastSequence;
          }
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Failed to read order_sequence from Supabase:', err.message);
      }
    }

    // 4. Scan existing orders in database
    try {
      const orders = await this.getOrders();
      if (Array.isArray(orders)) {
        orders.forEach(o => {
          if (o && o.orderId) {
            const m = o.orderId.match(ordPrefixRegex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > highestKnown) highestKnown = num;
            }
          }
        });
      }
    } catch (_) {}

    // 5. Scan inquiries in database
    try {
      const inqs = await this.getInquiries();
      if (Array.isArray(inqs)) {
        inqs.forEach(i => {
          if (i && i.id) {
            const m = i.id.match(ordPrefixRegex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > highestKnown) highestKnown = num;
            }
          }
        });
      }
    } catch (_) {}

    // 6. Scan ALL deleted order IDs (so even if an order was deleted, its number is permanently accounted for!)
    try {
      const deletedIds = await this.getDeletedOrderIds();
      deletedIds.forEach(id => {
        const m = id.match(ordPrefixRegex);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > highestKnown) highestKnown = num;
        }
      });
    } catch (_) {}

    // 7. Guarantee baseline sequence is at least 9 (since RF-ORD-2026-009 exists)
    if (highestKnown < 9) highestKnown = 9;

    // 8. Monotonic increment: next order number
    const nextNum = highestKnown + 1;
    const nextOrderId = `RF-ORD-${currentYear}-${String(nextNum).padStart(3, '0')}`;

    // 9. Persist the new sequence counter immediately to Memory, Local File & Supabase Cloud
    const updatedSeq = {
      lastSequence: nextNum,
      currentYear,
      lastOrderId: nextOrderId,
      updatedAt: new Date().toISOString()
    };

    global._rfMemoryStore = global._rfMemoryStore || {};
    global._rfMemoryStore['order_sequence'] = updatedSeq;

    try {
      writeJson(ORDER_SEQUENCE_FILE, updatedSeq);
      const rawPath = path.join(DATA_DIR, 'order-sequence.json');
      fs.writeFileSync(rawPath, JSON.stringify(updatedSeq, null, 2), 'utf8');
    } catch (_) {}

    if (supabase && isSupabaseOperational()) {
      try {
        const upsertPromise = supabase.from('admin_config').upsert({
          id: 'order_sequence',
          admin_name: 'Order Monotonic Sequence Counter',
          smtp: updatedSeq,
          updated_at: new Date().toISOString()
        });
        await withTimeout(upsertPromise, 4000, 'Supabase upsert order_sequence');
        console.log(`🔢 [ORDER SEQUENCE] Monotonic sequence counter advanced to ${nextNum} (${nextOrderId}) in Supabase.`);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Failed to write order_sequence to Supabase:', err.message);
      }
    }

    // 10. Automatically ensure nextOrderId is never in deleted registry
    await this.unrecordDeletedOrderIds([nextOrderId]);

    return nextOrderId;
  },

  async getOrderSequence() {
    const currentYear = new Date().getFullYear();
    const ordPrefixRegex = new RegExp(`^RF-ORD-${currentYear}-(\\d+)$`, 'i');
    let currentSeq = 9;
    if (global._rfMemoryStore && global._rfMemoryStore['order_sequence']) {
      currentSeq = Math.max(currentSeq, global._rfMemoryStore['order_sequence'].lastSequence || 0);
    }
    if (supabase && isSupabaseOperational()) {
      try {
        const { data } = await supabase.from('admin_config').select('smtp').eq('id', 'order_sequence').maybeSingle();
        if (data && data.smtp && typeof data.smtp.lastSequence === 'number') {
          currentSeq = Math.max(currentSeq, data.smtp.lastSequence);
        }
      } catch (_) {}
    }
    try {
      const orders = await this.getOrders();
      if (Array.isArray(orders)) {
        orders.forEach(o => {
          if (o && o.orderId) {
            const m = o.orderId.match(ordPrefixRegex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > currentSeq) currentSeq = num;
            }
          }
        });
      }
      try {
        const deletedIds = await this.getDeletedOrderIds();
        deletedIds.forEach(id => {
          const m = String(id).match(ordPrefixRegex);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > currentSeq) currentSeq = num;
          }
        });
      } catch (_) {}
    } catch (_) {}
    return { lastSequence: currentSeq, currentYear, nextOrderId: `RF-ORD-${currentYear}-${String(currentSeq + 1).padStart(3, '0')}` };
  },

  // --- PRODUCTS ---
  async hasProduct(slug) {
    if (!slug) return false;
    const cleanId = String(slug).trim().toLowerCase();
    if (supabase && isSupabaseOperational()) {
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
    const cleanLower = cleanId.toLowerCase();

    // Fast in-memory cache check (0ms)
    if (_productsCache && Array.isArray(_productsCache)) {
      const match = _productsCache.find(p => {
        if (!p) return false;
        const pid = String(p.id || '').trim().toLowerCase();
        const pname = String(p.name || '').trim().toLowerCase();
        const pslug = String(p.slug || '').trim().toLowerCase();
        return pid === cleanLower || pname === cleanLower || pslug === cleanLower;
      });
      if (match) return match;
    }

    if (supabase && isSupabaseOperational()) {
      try {
        let queryPromise = supabase.from('products').select('*').eq('id', cleanId).maybeSingle();
        let { data, error } = await withTimeout(queryPromise, 4000, 'Supabase getProductById query');

        // If not found by exact id, try case-insensitive ilike by id
        if (!data || error) {
          queryPromise = supabase.from('products').select('*').ilike('id', cleanId).maybeSingle();
          const ilikeRes = await withTimeout(queryPromise, 3000, 'Supabase getProductById ilike query').catch(() => null);
          if (ilikeRes && ilikeRes.data) {
            data = ilikeRes.data;
            error = null;
          }
        }

        // If still not found, try case-insensitive match by name
        if (!data || error) {
          queryPromise = supabase.from('products').select('*').ilike('name', cleanId).maybeSingle();
          const nameRes = await withTimeout(queryPromise, 3000, 'Supabase getProductById name query').catch(() => null);
          if (nameRes && nameRes.data) {
            data = nameRes.data;
            error = null;
          }
        }

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
            variantType: data.variant_type || data.variantType || (Array.isArray(data.variants) && data.variants[0]?.type) || 'size',
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
    return products.find(p => {
      if (!p) return false;
      const pid = String(p.id || '').trim().toLowerCase();
      const pname = String(p.name || '').trim().toLowerCase();
      const pslug = String(p.slug || '').trim().toLowerCase();
      return pid === cleanLower || pname === cleanLower || pslug === cleanLower;
    }) || null;
  },

  async getProducts() {
    if (_productsCache && (Date.now() - _productsCacheTime < CACHE_TTL_MS)) {
      return _productsCache;
    }
    const localProducts = readJson(PRODUCTS_FILE, []);
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('products').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 3500, 'Supabase getProducts');
        if (!error && Array.isArray(data)) {
          const mapped = data.map(remote => {
            let resolvedImages = [];
            if (Array.isArray(remote.images)) {
              resolvedImages = remote.images.filter(x => typeof x === 'string' && x.trim());
            } else if (typeof remote.images === 'string') {
              try {
                const parsed = JSON.parse(remote.images);
                if (Array.isArray(parsed)) resolvedImages = parsed.filter(x => typeof x === 'string' && x.trim());
              } catch (_) {}
            }
            if (!resolvedImages.length && remote.image && typeof remote.image === 'string' && remote.image.trim()) {
              resolvedImages = [remote.image.trim()];
            }
            const cleanImage = (remote.image && typeof remote.image === 'string' && remote.image.trim())
              ? remote.image.trim()
              : (resolvedImages[0] || 'assets/images/custom_canvas.jpg');

            return {
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
              image: cleanImage,
              images: resolvedImages.length > 0 ? resolvedImages : [cleanImage],
              shortDescription: remote.short_description || '',
              description: remote.description || remote.short_description || '',
              material: remote.material || '',
              printingType: remote.printing_type || '',
              status: remote.status || 'In Stock',
              inStock: remote.in_stock !== undefined ? Boolean(remote.in_stock) : (remote.status === 'In Stock'),
              stockQty: remote.stock_qty !== undefined ? Number(remote.stock_qty) : 100,
              leadTime: remote.lead_time || '24 - 48 Hours',
              sizes: Array.isArray(remote.sizes) ? remote.sizes : (typeof remote.sizes === 'string' ? (() => { try { return JSON.parse(remote.sizes); } catch (_) { return []; } })() : []),
              finishes: Array.isArray(remote.finishes) ? remote.finishes : (typeof remote.finishes === 'string' ? (() => { try { return JSON.parse(remote.finishes); } catch (_) { return []; } })() : []),
              variantType: remote.variant_type || remote.variantType || (Array.isArray(remote.variants) && remote.variants[0]?.type) || 'size',
              variants: Array.isArray(remote.variants) ? remote.variants : (typeof remote.variants === 'string' ? (() => { try { return JSON.parse(remote.variants); } catch (_) { return []; } })() : []),
              features: Array.isArray(remote.features) ? remote.features : (typeof remote.features === 'string' ? (() => { try { return JSON.parse(remote.features); } catch (_) { return []; } })() : []),
              requiresPhoto: Boolean(remote.requires_photo !== undefined ? remote.requires_photo : remote.requiresPhoto),
              requires_photo: Boolean(remote.requires_photo !== undefined ? remote.requires_photo : remote.requiresPhoto),
              createdAt: remote.created_at,
              updatedAt: remote.updated_at
            };
          });
          _productsCache = mapped;
          _productsCacheTime = Date.now();
          return mapped;
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getProducts error, using fallback:', err.message);
      }
    }
    return _productsCache || localProducts;
  },

  async saveProduct(product) {
    const cleanImage = (product.image && typeof product.image === 'string' && product.image.trim())
      ? product.image.trim()
      : (Array.isArray(product.images) && product.images[0] && typeof product.images[0] === 'string' && product.images[0].trim()
        ? product.images[0].trim()
        : 'assets/images/custom_canvas.jpg');

    const cleanImages = (Array.isArray(product.images) && product.images.length > 0)
      ? product.images.filter(img => typeof img === 'string' && img.trim()).map(s => s.trim())
      : [cleanImage];

    const cleanFinishes = Array.isArray(product.finishes)
      ? product.finishes.map(f => ({
          ...f,
          image: (f.image && typeof f.image === 'string' && f.image.trim()) ? f.image.trim() : cleanImage
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
      variantType: product.variantType || product.variant_type || (Array.isArray(product.variants) && product.variants[0]?.type) || 'size',
      variants: Array.isArray(product.variants) ? product.variants : [],
      features: Array.isArray(product.features) ? product.features : [],
      requiresPhoto: Boolean(product.requiresPhoto !== undefined ? product.requiresPhoto : product.requires_photo),
      requires_photo: Boolean(product.requiresPhoto !== undefined ? product.requiresPhoto : product.requires_photo),
      updatedAt: new Date().toISOString()
    };

    if (supabase && isSupabaseOperational()) {
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
          variant_type: sanitizedProduct.variantType,
          variants: sanitizedProduct.variants,
          features: sanitizedProduct.features,
          requires_photo: sanitizedProduct.requiresPhoto,
          created_at: sanitizedProduct.createdAt || new Date().toISOString(),
          updated_at: sanitizedProduct.updatedAt || new Date().toISOString()
        };
        let upsertPromise = supabase.from('products').upsert(supabaseRow, { onConflict: 'id' });
        let { error } = await withTimeout(upsertPromise, 8000, 'Supabase products table upsert');
        if (error && error.message && (error.message.toLowerCase().includes('requires_photo') || error.message.toLowerCase().includes('variant_type'))) {
          const fallbackRow = { ...supabaseRow };
          if (error.message.toLowerCase().includes('requires_photo')) delete fallbackRow.requires_photo;
          if (error.message.toLowerCase().includes('variant_type')) delete fallbackRow.variant_type;
          const retryRes = await supabase.from('products').upsert(fallbackRow, { onConflict: 'id' });
          error = retryRes.error;
        }
        if (error) {
          if (isTableMissingError(error)) {
            console.warn('⚠️ [DATABASE] Supabase products table missing or schema cache not updated. Updating local store.');
          } else {
            console.error('❌ [DATABASE] Supabase saveProduct error:', error.message);
            throw new Error('Supabase database error: ' + error.message);
          }
        }
      } catch (err) {
        if (isTableMissingError(err)) {
          console.warn('⚠️ [DATABASE] Supabase products table missing or schema cache not updated. Updating local store.');
        } else {
          console.error('❌ [DATABASE] Supabase saveProduct exception:', err.message);
          throw err;
        }
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
    invalidateProductsCache();
    setImmediate(() => {
      try { syncProductsDataFiles(products); } catch (_) {}
    });
    return sanitizedProduct;
  },

  async deleteProduct(id) {
    if (!id) return false;
    const cleanId = String(id).trim();
    if (supabase && isSupabaseOperational()) {
      try {
        const delPromise = supabase.from('products').delete().or(`id.eq.${cleanId},id.ilike.${cleanId}`);
        const { error } = await withTimeout(delPromise, 5000, 'Supabase deleteProduct');
        if (error) {
          if (isTableMissingError(error)) {
            console.warn('⚠️ [DATABASE] Supabase products table missing or schema cache not updated. Updating local store.');
          } else {
            console.error('❌ [DATABASE] Supabase deleteProduct error:', error.message);
            throw new Error('Supabase database error: ' + error.message);
          }
        }
      } catch (err) {
        if (isTableMissingError(err)) {
          console.warn('⚠️ [DATABASE] Supabase products table missing or schema cache not updated. Updating local store.');
        } else {
          console.error('❌ [DATABASE] Supabase deleteProduct exception:', err.message);
          throw err;
        }
      }
    }
    let products = readJson(PRODUCTS_FILE, []);
    products = products.filter(p => p && String(p.id).toLowerCase() !== cleanId.toLowerCase());
    writeJson(PRODUCTS_FILE, products);
    invalidateProductsCache();
    setImmediate(() => {
      try { syncProductsDataFiles(products); } catch (_) {}
    });
    return true;
  },

  // --- CATEGORIES ---
  async getCategories() {
    if (_categoriesCache && (Date.now() - _categoriesCacheTime < CACHE_TTL_MS)) {
      return _categoriesCache;
    }
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('categories').select('*').order('created_at', { ascending: true });
        const { data, error } = await withTimeout(queryPromise, 3500, 'Supabase getCategories');
        if (!error && Array.isArray(data)) {
          const mapped = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '🏷️',
            image: cat.image || null,
            desc: cat.desc || cat.description || '',
            badge: cat.badge || cat.name,
            color: cat.color || '#C99A3D',
            bg: cat.bg || 'rgba(201, 154, 61, 0.15)',
            isDefault: false,
            createdAt: cat.created_at || cat.createdAt
          }));
          _categoriesCache = mapped;
          _categoriesCacheTime = Date.now();
          setImmediate(() => { try { syncCategoriesDataFiles(mapped); } catch (_) {} });
          return mapped;
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getCategories exception:', err.message);
      }
    }

    let categories = readJson(CATEGORIES_FILE, []);
    _categoriesCache = categories;
    _categoriesCacheTime = Date.now();
    setImmediate(() => { try { syncCategoriesDataFiles(categories); } catch (_) {} });
    return categories;
  },

  async saveCategory(category) {
    let categories = readJson(CATEGORIES_FILE, []);
    const cleanId = (category.id || category.name || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
    const cleanName = (category.name || '').trim();
    const cleanIcon = (category.icon || '🏷️').trim();
    const cleanDesc = (category.desc || category.description || '').trim();
    const cleanBadge = (category.badge || cleanName).trim();
    const cleanColor = category.color || '#C99A3D';
    const cleanBg = category.bg || 'rgba(201, 154, 61, 0.15)';
    const cleanImage = (category.image && typeof category.image === 'string' && category.image.trim()) ? category.image.trim() : null;

    const newCategory = {
      id: cleanId,
      name: cleanName,
      icon: cleanIcon,
      image: cleanImage,
      desc: cleanDesc,
      badge: cleanBadge,
      color: cleanColor,
      bg: cleanBg,
      isDefault: false,
      createdAt: category.createdAt || new Date().toISOString()
    };

    if (supabase && isSupabaseOperational()) {
      try {
        const upsertPromise = supabase.from('categories').upsert({
          id: newCategory.id,
          name: newCategory.name,
          icon: newCategory.icon,
          image: newCategory.image,
          desc: newCategory.desc,
          badge: newCategory.badge,
          color: newCategory.color,
          bg: newCategory.bg,
          is_default: false,
          created_at: newCategory.createdAt
        }, { onConflict: 'id' });
        const { error } = await withTimeout(upsertPromise, 5000, 'Supabase saveCategory');
        if (error) {
          if (isTableMissingError(error)) {
            console.warn('⚠️ [DATABASE] Supabase categories table missing or schema cache not updated. Updating local store.');
          } else {
            console.error('❌ [DATABASE] Supabase saveCategory error:', error.message);
            throw new Error('Supabase database error: ' + error.message);
          }
        }
      } catch (err) {
        if (isTableMissingError(err)) {
          console.warn('⚠️ [DATABASE] Supabase categories table missing or schema cache not updated. Updating local store.');
        } else {
          console.error('❌ [DATABASE] Supabase saveCategory exception:', err.message);
          throw err;
        }
      }
    }

    const existingIndex = categories.findIndex(c => (c.id || '').toLowerCase() === cleanId.toLowerCase());
    if (existingIndex !== -1) {
      categories[existingIndex] = { ...categories[existingIndex], ...newCategory };
    } else {
      categories.push(newCategory);
    }

    writeJson(CATEGORIES_FILE, categories);
    invalidateCategoriesCache();
    syncCategoriesDataFiles(categories);
    return newCategory;
  },

  async deleteCategory(id) {
    const cleanId = (id || '').trim().toLowerCase();
    if (supabase && isSupabaseOperational()) {
      try {
        const delPromise = supabase.from('categories').delete().eq('id', cleanId);
        const { error } = await withTimeout(delPromise, 5000, 'Supabase deleteCategory');
        if (error) {
          if (isTableMissingError(error)) {
            console.warn('⚠️ [DATABASE] Supabase categories table missing or schema cache not updated. Updating local store.');
          } else {
            console.error('❌ [DATABASE] Supabase deleteCategory error:', error.message);
            throw new Error('Supabase database error: ' + error.message);
          }
        }
      } catch (err) {
        if (isTableMissingError(err)) {
          console.warn('⚠️ [DATABASE] Supabase categories table missing or schema cache not updated. Updating local store.');
        } else {
          console.error('❌ [DATABASE] Supabase deleteCategory exception:', err.message);
          throw err;
        }
      }
    }

    let categories = readJson(CATEGORIES_FILE, []);
    categories = categories.filter(c => (c.id || '').toLowerCase() !== cleanId);
    writeJson(CATEGORIES_FILE, categories);
    invalidateCategoriesCache();
    syncCategoriesDataFiles(categories);
    return true;
  },

  // --- ORDERS ---
  async getOrders() {
    const deletedIds = await this.getDeletedOrderIds();

    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('orders').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 8000, 'Supabase getOrders');
        if (!error && Array.isArray(data)) {
          recordSupabaseSuccess();
          const supabaseOrders = data
            .map(o => {
              let parsedCustomer = o.customer || {};
              if (typeof parsedCustomer === 'string' && parsedCustomer.trim().startsWith('{')) {
                try { parsedCustomer = JSON.parse(parsedCustomer); } catch (_) {}
              }
              let parsedItems = Array.isArray(o.items) ? o.items : [];
              if (!parsedItems.length && typeof o.items === 'string' && o.items.trim().startsWith('[')) {
                try { parsedItems = JSON.parse(o.items); } catch (_) {}
              }
              return {
                orderId: o.order_id,
                customer: parsedCustomer,
                items: parsedItems,
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
              };
            })
            .filter(o => {
              if (!o || !o.orderId) return false;
              const clean = o.orderId.toLowerCase().trim().replace(/^#/, '');
              return !deletedIds.has(clean) && (o.status || '').toLowerCase() !== 'deleted';
            });

          // Supabase is authoritative; mirror to local cache and return
          const finalOrders = supabaseOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          try { writeJson(ORDERS_FILE, finalOrders); } catch (_) {}
          return finalOrders;
        }
        if (error) console.warn('⚠️ [DATABASE] Supabase getOrders error, falling back to local:', error.message);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getOrders exception, using local:', err.message);
      }
    }

    // Offline / Local fallback ONLY
    const localOrders = readJson(ORDERS_FILE, []);
    return localOrders.filter(o => {
      if (!o || !o.orderId) return false;
      const clean = o.orderId.toLowerCase().trim().replace(/^#/, '');
      return !deletedIds.has(clean);
    });
  },

  async getOrderById(orderId) {
    const cleanId = (orderId || '').trim().replace(/^#/, '');
    if (!cleanId) return null;
    const idVariants = Array.from(new Set([
      cleanId,
      '#' + cleanId,
      cleanId.toLowerCase(),
      '#' + cleanId.toLowerCase(),
      cleanId.toUpperCase(),
      '#' + cleanId.toUpperCase()
    ]));
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase
          .from('orders')
          .select('*')
          .in('order_id', idVariants)
          .maybeSingle();
        const { data, error } = await withTimeout(queryPromise, 4000, 'Supabase getOrderById');
        if (!error && data) {
          let parsedCustomer = data.customer || {};
          if (typeof parsedCustomer === 'string' && parsedCustomer.trim().startsWith('{')) {
            try { parsedCustomer = JSON.parse(parsedCustomer); } catch (_) {}
          }
          let parsedItems = Array.isArray(data.items) ? data.items : [];
          if (!parsedItems.length && typeof data.items === 'string' && data.items.trim().startsWith('[')) {
            try { parsedItems = JSON.parse(data.items); } catch (_) {}
          }
          return {
            orderId: data.order_id,
            customer: parsedCustomer,
            items: parsedItems,
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
    const found = orders.find(o => o.orderId && o.orderId.toLowerCase() === cleanId.toLowerCase());
    if (found) return found;

    return null;
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
      confirmed_at: safeIsoDate(order.confirmedAt) || (order.confirmationDate ? safeIsoDate(order.confirmationDate) : null),
      confirmation_date: (order.confirmationDate && typeof order.confirmationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(order.confirmationDate.trim())) 
        ? order.confirmationDate.trim() 
        : (order.confirmationDate ? String(order.confirmationDate).slice(0, 10) : null),
      picked_up_at: safeIsoDate(order.pickedUpAt),
      pickup_date: (order.pickupDate && typeof order.pickupDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(order.pickupDate.trim())) 
        ? order.pickupDate.trim() 
        : (order.pickupDate ? String(order.pickupDate).slice(0, 10) : null),
      confirmed_email_sent: Boolean(order.confirmedEmailSent || order.confirmed_email_sent),
      ready_email_sent: Boolean(order.readyEmailSent || order.ready_email_sent),
      cancelled_email_sent: Boolean(order.cancelledEmailSent || order.cancelled_email_sent),
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase && isSupabaseOperational()) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const upsertPromise = supabase.from('orders').upsert(dbRow, { onConflict: 'order_id' });
          const { error } = await withTimeout(upsertPromise, 12000, `Supabase saveOrder attempt ${attempt}`);
          if (!error) break;
          console.warn(`⚠️ [DATABASE] Supabase saveOrder attempt ${attempt} warning:`, error.message);
          // Self-healing fallback: strip dynamic columns and retry with core schema
          try {
            const coreRow = {
              order_id: dbRow.order_id,
              customer: dbRow.customer,
              items: dbRow.items,
              subtotal: dbRow.subtotal,
              shipping: dbRow.shipping,
              total: dbRow.total,
              notes: dbRow.notes,
              status: dbRow.status,
              created_at: dbRow.created_at,
              updated_at: dbRow.updated_at
            };
            const fallbackPromise = supabase.from('orders').upsert(coreRow, { onConflict: 'order_id' });
            const fbRes = await withTimeout(fallbackPromise, 6000, 'Supabase core saveOrder');
            if (!fbRes.error) break;
          } catch (_) {}
        } catch (err) {
          console.warn(`⚠️ [DATABASE] Supabase saveOrder attempt ${attempt} notice:`, err.message);
          if (attempt < 2) await new Promise(r => setTimeout(r, 400));
        }
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
    if (!cleanId) return false;
    await this.recordDeletedOrderIds([cleanId]);

    if (supabase && isSupabaseOperational()) {
      try {
        const idVariants = [cleanId, cleanId.toLowerCase(), cleanId.toUpperCase(), '#' + cleanId];
        await supabase.from('orders').delete().in('order_id', idVariants);
        await supabase.from('inquiries').delete().in('id', idVariants);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase deleteOrder exception:', err.message);
      }
    }
    let orders = readJson(ORDERS_FILE, []);
    orders = orders.filter(o => o.orderId && o.orderId.toLowerCase().replace(/^#/, '') !== cleanId.toLowerCase());
    writeJson(ORDERS_FILE, orders);
    let inqs = readJson(INQUIRIES_FILE, []);
    inqs = inqs.filter(i => i.id && i.id.toLowerCase().replace(/^#/, '') !== cleanId.toLowerCase());
    writeJson(INQUIRIES_FILE, inqs);
    return true;
  },

  async deleteOrdersBulk(orderIds) {
    if (!Array.isArray(orderIds) || !orderIds.length) return { count: 0, ids: [] };
    const cleanIds = orderIds.map(id => (id || '').toString().trim().replace(/^#/, '')).filter(Boolean);
    if (!cleanIds.length) return { count: 0, ids: [] };
    const cleanIdsLower = new Set(cleanIds.map(x => x.toLowerCase()));

    // 1. Permanently record to Supabase Cloud & local registry
    await this.recordDeletedOrderIds(cleanIds);

    // 2. Supabase deletion (with all casing / prefix variants)
    if (supabase && isSupabaseOperational()) {
      try {
        const idVariants = Array.from(new Set([
          ...cleanIds,
          ...cleanIds.map(x => x.toLowerCase()),
          ...cleanIds.map(x => x.toUpperCase()),
          ...cleanIds.map(x => '#' + x)
        ]));
        await supabase.from('orders').delete().in('order_id', idVariants);
        await supabase.from('inquiries').delete().in('id', idVariants);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase deleteOrdersBulk exception:', err.message);
      }
    }

    // 3. Local JSON files deletion
    let orders = readJson(ORDERS_FILE, []);
    orders = orders.filter(o => !o.orderId || !cleanIdsLower.has(o.orderId.toLowerCase().trim().replace(/^#/, '')));
    writeJson(ORDERS_FILE, orders);

    let inqs = readJson(INQUIRIES_FILE, []);
    inqs = inqs.filter(i => !i.id || !cleanIdsLower.has(i.id.toLowerCase().trim().replace(/^#/, '')));
    writeJson(INQUIRIES_FILE, inqs);

    return { count: cleanIds.length, ids: cleanIds };
  },

  async clearAllOrders() {
    let orderIdsToRecord = [];
    try {
      const orders = await this.getOrders();
      if (Array.isArray(orders) && orders.length) {
        orderIdsToRecord = orders.map(o => o.orderId).filter(Boolean);
      }
      const inqs = await this.getInquiries();
      if (Array.isArray(inqs) && inqs.length) {
        inqs.forEach(i => {
          if (i.id && (i.id.startsWith('RF-ORD') || (i.product && i.product.includes('[ONLINE ORDER]')))) {
            orderIdsToRecord.push(i.id);
          }
        });
      }
    } catch (_) {}

    if (orderIdsToRecord.length) {
      await this.recordDeletedOrderIds(orderIdsToRecord);
    }

    if (supabase && isSupabaseOperational()) {
      try {
        await supabase.from('orders').delete().neq('order_id', '');
        await supabase.from('inquiries').delete().ilike('id', 'RF-ORD-%');
        await supabase.from('inquiries').delete().ilike('product', '%[ONLINE ORDER]%');
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase clearAllOrders exception:', err.message);
      }
    }
    writeJson(ORDERS_FILE, []);
    let inqs = readJson(INQUIRIES_FILE, []);
    inqs = inqs.filter(i => !i.id || (!i.id.startsWith('RF-ORD') && (!i.product || !i.product.includes('[ONLINE ORDER]'))));
    writeJson(INQUIRIES_FILE, inqs);
    return true;
  },

  // --- INQUIRIES ---
  async getInquiryById(id) {
    const cleanId = (id || '').trim().replace(/^#/, '');
    if (!cleanId) return null;
    const idVariants = Array.from(new Set([
      cleanId,
      '#' + cleanId,
      cleanId.toLowerCase(),
      '#' + cleanId.toLowerCase(),
      cleanId.toUpperCase(),
      '#' + cleanId.toUpperCase()
    ]));
    if (supabase) {
      try {
        const queryPromise = supabase
          .from('inquiries')
          .select('*')
          .in('id', idVariants)
          .maybeSingle();
        const { data, error } = await withTimeout(queryPromise, 4000, 'Supabase getInquiryById');
        if (!error && data) {
          let parsedItems = Array.isArray(data.items) ? data.items : [];
          if (!parsedItems.length && typeof data.items === 'string' && data.items.trim().startsWith('[')) {
            try { parsedItems = JSON.parse(data.items); } catch (_) {}
          }
          return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            email: data.email,
            product: data.product,
            specs: data.specs,
            quantity: Number(data.quantity) || 1,
            estimatedValue: Number(data.estimated_value) || 0,
            status: data.status || 'pending',
            notes: data.notes || '',
            hasUpload: Boolean(data.has_upload),
            uploadFileName: data.upload_file_name || null,
            uploadedFileUrl: data.uploaded_file_url || null,
            deliveryAddress: data.delivery_address || null,
            items: parsedItems,
            confirmedAt: data.confirmed_at || null,
            confirmationDate: data.confirmation_date || null,
            pickedUpAt: data.picked_up_at || null,
            pickupDate: data.pickup_date || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (_) {}
    }
    const inqs = readJson(INQUIRIES_FILE, []);
    return inqs.find(i => i.id && (i.id.toLowerCase() === cleanId.toLowerCase() || i.id.replace(/^#/, '').toLowerCase() === cleanId.toLowerCase())) || null;
  },

  async getInquiries() {
    let supabaseInqs = [];
    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 8000, 'Supabase getInquiries');
        if (!error && Array.isArray(data)) {
          supabaseInqs = data.map(i => {
            let parsedItems = Array.isArray(i.items) ? i.items : [];
            if (!parsedItems.length && typeof i.items === 'string' && i.items.trim().startsWith('[')) {
              try { parsedItems = JSON.parse(i.items); } catch (_) {}
            }
            return {
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
              items: parsedItems,
              confirmedAt: i.confirmed_at || i.confirmedAt || null,
              confirmationDate: i.confirmation_date || i.confirmationDate || null,
              pickedUpAt: i.picked_up_at || i.pickedUpAt || null,
              pickupDate: i.pickup_date || i.pickupDate || null,
              confirmedEmailSent: Boolean(i.confirmed_email_sent || i.confirmedEmailSent),
              readyEmailSent: Boolean(i.ready_email_sent || i.readyEmailSent),
              cancelledEmailSent: Boolean(i.cancelled_email_sent || i.cancelledEmailSent),
              createdAt: i.created_at,
              updatedAt: i.updated_at
            };
          });

          const deletedIds = await this.getDeletedOrderIds();
          const validSupabaseInqs = supabaseInqs.filter(i => {
            if (!i || !i.id) return false;
            const clean = i.id.toLowerCase().trim().replace(/^#/, '');
            return !deletedIds.has(clean) && (i.status || '').toLowerCase() !== 'deleted';
          });

          // Supabase is authoritative; mirror to local cache and return
          const finalInqs = validSupabaseInqs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          try { writeJson(INQUIRIES_FILE, finalInqs); } catch (_) {}
          return finalInqs;
        }
        if (error) console.warn('⚠️ [DATABASE] Supabase getInquiries error:', error.message);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getInquiries exception:', err.message);
      }
    }

    const deletedIds = await this.getDeletedOrderIds();
    const localInqs = readJson(INQUIRIES_FILE, []);
    return localInqs.filter(i => {
      if (!i || !i.id) return false;
      const clean = i.id.toLowerCase().trim().replace(/^#/, '');
      return !deletedIds.has(clean);
    });
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
      confirmed_at: safeIsoDate(inquiry.confirmedAt) || (inquiry.confirmationDate ? safeIsoDate(inquiry.confirmationDate) : null),
      confirmation_date: (inquiry.confirmationDate && typeof inquiry.confirmationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inquiry.confirmationDate.trim())) 
        ? inquiry.confirmationDate.trim() 
        : (inquiry.confirmationDate ? String(inquiry.confirmationDate).slice(0, 10) : null),
      picked_up_at: safeIsoDate(inquiry.pickedUpAt),
      pickup_date: (inquiry.pickupDate && typeof inquiry.pickupDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inquiry.pickupDate.trim())) 
        ? inquiry.pickupDate.trim() 
        : (inquiry.pickupDate ? String(inquiry.pickupDate).slice(0, 10) : null),
      confirmed_email_sent: Boolean(inquiry.confirmedEmailSent || inquiry.confirmed_email_sent),
      ready_email_sent: Boolean(inquiry.readyEmailSent || inquiry.ready_email_sent),
      cancelled_email_sent: Boolean(inquiry.cancelledEmailSent || inquiry.cancelled_email_sent),
      created_at: inquiry.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase && isSupabaseOperational()) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const upsertPromise = supabase.from('inquiries').upsert(dbRow, { onConflict: 'id' });
          const { error } = await withTimeout(upsertPromise, 12000, `Supabase saveInquiry attempt ${attempt}`);
          if (!error) break;
          console.warn(`⚠️ [DATABASE] Supabase saveInquiry attempt ${attempt} warning:`, error.message);
          // Self-healing fallback: strip dynamic columns and retry with core schema
          try {
            const coreInqRow = {
              id: dbRow.id,
              name: dbRow.name,
              phone: dbRow.phone,
              email: dbRow.email,
              product: dbRow.product,
              specs: dbRow.specs,
              quantity: dbRow.quantity,
              estimated_value: dbRow.estimated_value,
              notes: dbRow.notes,
              status: dbRow.status,
              created_at: dbRow.created_at,
              updated_at: dbRow.updated_at
            };
            const fallbackPromise = supabase.from('inquiries').upsert(coreInqRow, { onConflict: 'id' });
            const fbRes = await withTimeout(fallbackPromise, 6000, 'Supabase core saveInquiry');
            if (!fbRes.error) break;
          } catch (_) {}
        } catch (err) {
          console.warn(`⚠️ [DATABASE] Supabase saveInquiry attempt ${attempt} notice:`, err.message);
          if (attempt < 2) await new Promise(r => setTimeout(r, 400));
        }
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
    if (!cleanId) return false;
    await this.recordDeletedOrderIds([cleanId]);

    if (supabase && isSupabaseOperational()) {
      try {
        const idVariants = [cleanId, cleanId.toLowerCase(), cleanId.toUpperCase(), '#' + cleanId];
        await supabase.from('inquiries').delete().in('id', idVariants);
        await supabase.from('orders').delete().in('order_id', idVariants);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase deleteInquiry exception:', err.message);
      }
    }
    let inquiries = readJson(INQUIRIES_FILE, []);
    inquiries = inquiries.filter(i => i.id && i.id.toLowerCase().replace(/^#/, '') !== cleanId.toLowerCase());
    writeJson(INQUIRIES_FILE, inquiries);

    let orders = readJson(ORDERS_FILE, []);
    orders = orders.filter(o => o.orderId && o.orderId.toLowerCase().replace(/^#/, '') !== cleanId.toLowerCase());
    writeJson(ORDERS_FILE, orders);
    return true;
  },

  // --- CONTACT MESSAGES ---
  async getMessages() {
    let allMsgs = [];
    if (supabase && isSupabaseOperational()) {
      try {
        const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          allMsgs = data.map(m => ({
            id: m.id,
            name: m.name,
            phone: m.phone,
            email: m.email || '',
            service: m.service || 'General Inquiry',
            subject: m.service || 'General Inquiry',
            message: m.message || '',
            status: m.status || 'Unread',
            createdAt: m.created_at || new Date().toISOString(),
            created_at: m.created_at || new Date().toISOString()
          }));
        } else if (error) {
          console.warn('Supabase messages table query note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase messages table fetch exception:', err.message);
      }

      // Check redundant cloud backup in admin_config
      try {
        const cfgRes = await supabase.from('admin_config').select('smtp').eq('id', 'all_contact_messages').maybeSingle();
        if (cfgRes && cfgRes.data && cfgRes.data.smtp && Array.isArray(cfgRes.data.smtp.messages)) {
          const idSet = new Set(allMsgs.map(m => m.id));
          for (const cm of cfgRes.data.smtp.messages) {
            if (!idSet.has(cm.id)) {
              allMsgs.push(cm);
              idSet.add(cm.id);
            }
          }
        }
      } catch (_) {}
    }

    // Merge any local messages from MESSAGES_FILE
    try {
      const localMsgs = readJson(MESSAGES_FILE, []);
      const idSet = new Set(allMsgs.map(m => m.id));
      for (const lm of localMsgs) {
        if (!idSet.has(lm.id)) {
          allMsgs.push(lm);
          idSet.add(lm.id);
        }
      }
    } catch (_) {}

    // ALSO: Merge contact inquiries from inquiries table so any customer submission from contact form is never lost!
    try {
      const inqs = await this.getInquiries();
      const contactInqs = inqs.filter(i => 
        (i.specs && String(i.specs).toLowerCase().includes('contact')) ||
        (i.notes && String(i.notes).length > 0 && !i.items?.length && i.type !== 'order')
      );
      const idSet = new Set(allMsgs.map(m => m.id));
      for (const ci of contactInqs) {
        const mappedId = 'MSG-' + ci.id;
        if (!idSet.has(ci.id) && !idSet.has(mappedId)) {
          allMsgs.push({
            id: ci.id,
            name: ci.name,
            phone: ci.phone,
            email: ci.email || '',
            service: ci.product || 'Contact Inquiry',
            subject: ci.product || 'Contact Inquiry',
            message: ci.notes || ci.specs || '',
            status: ci.status === 'Completed' ? 'Read' : 'Unread',
            createdAt: ci.createdAt || new Date().toISOString(),
            created_at: ci.createdAt || new Date().toISOString()
          });
          idSet.add(ci.id);
        }
      }
    } catch (_) {}

    // Filter out all trial/test messages
    allMsgs = allMsgs.filter(m => {
      if (!m || !m.id) return false;
      const cleanId = String(m.id).toLowerCase();
      const isTrialId = cleanId === 'msg-2026-001' || cleanId === 'msg-2026-002' || cleanId.startsWith('msg-test-');
      const isTestSender = (m.name && m.name.toLowerCase().includes('test')) || (m.email && m.email.toLowerCase().includes('test'));
      return !isTrialId && !isTestSender;
    });

    // Sort newest first
    allMsgs.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

    return allMsgs;
  },

  async saveMessage(msg) {
    const cleanMsg = {
      id: msg.id || `MSG-${new Date().getFullYear()}-${Date.now()}`,
      name: (msg.name || 'Anonymous').trim(),
      phone: (msg.phone || '').trim(),
      email: (msg.email || '').trim(),
      service: (msg.service || msg.subject || 'General Inquiry').trim(),
      subject: (msg.subject || msg.service || 'General Inquiry').trim(),
      message: (msg.message || '').trim(),
      status: msg.status || 'Unread',
      createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
      created_at: msg.created_at || msg.createdAt || new Date().toISOString()
    };

    if (supabase && isSupabaseOperational()) {
      // 1. Upsert to Supabase messages table with strict schema matching
      try {
        const dbRow = {
          id: cleanMsg.id,
          name: cleanMsg.name,
          phone: cleanMsg.phone,
          email: cleanMsg.email,
          service: cleanMsg.service,
          message: cleanMsg.message,
          status: cleanMsg.status,
          created_at: cleanMsg.createdAt
        };
        const { error } = await supabase.from('messages').upsert(dbRow, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase messages table upsert error:', error.message);
        } else {
          console.log(`✅ Message ${cleanMsg.id} saved in Supabase`);
        }
      } catch (err) {
        console.warn('Supabase messages save exception:', err.message);
      }

      // 2. Redundant cloud backup in admin_config
      try {
        const cfgRes = await supabase.from('admin_config').select('smtp').eq('id', 'all_contact_messages').maybeSingle();
        let cloudList = (cfgRes && cfgRes.data && cfgRes.data.smtp && Array.isArray(cfgRes.data.smtp.messages))
          ? cfgRes.data.smtp.messages
          : [];
        const cIdx = cloudList.findIndex(m => m.id === cleanMsg.id);
        if (cIdx !== -1) {
          cloudList[cIdx] = cleanMsg;
        } else {
          cloudList.unshift(cleanMsg);
        }
        await supabase.from('admin_config').upsert({
          id: 'all_contact_messages',
          smtp: { messages: cloudList }
        });
      } catch (_) {}
    }

    // 3. Local JSON file backup
    try {
      const messages = readJson(MESSAGES_FILE, []);
      const idx = messages.findIndex(m => m.id === cleanMsg.id);
      if (idx !== -1) {
        messages[idx] = { ...messages[idx], ...cleanMsg };
      } else {
        messages.unshift(cleanMsg);
      }
      writeJson(MESSAGES_FILE, messages);
    } catch (_) {}

    return cleanMsg;
  },

  async deleteMessage(id) {
    if (!id) return true;
    if (supabase && isSupabaseOperational()) {
      try {
        await supabase.from('messages').delete().eq('id', id);
      } catch (_) {}
      try {
        const cfgRes = await supabase.from('admin_config').select('smtp').eq('id', 'all_contact_messages').maybeSingle();
        if (cfgRes && cfgRes.data && cfgRes.data.smtp && Array.isArray(cfgRes.data.smtp.messages)) {
          const updated = cfgRes.data.smtp.messages.filter(m => m.id !== id);
          await supabase.from('admin_config').upsert({
            id: 'all_contact_messages',
            smtp: { messages: updated }
          });
        }
      } catch (_) {}
    }
    let messages = readJson(MESSAGES_FILE, []);
    messages = messages.filter(m => m.id !== id);
    writeJson(MESSAGES_FILE, messages);
    return true;
  },

  async clearAllMessages() {
    if (supabase && isSupabaseOperational()) {
      try {
        const { data: supaMsgs } = await supabase.from('messages').select('id');
        if (Array.isArray(supaMsgs)) {
          for (const m of supaMsgs) {
            if (m.id) await supabase.from('messages').delete().eq('id', m.id);
          }
        }
        await supabase.from('messages').delete().neq('id', '___none___');
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase clearAllMessages exception:', err.message);
      }
      try {
        await supabase.from('admin_config').upsert({
          id: 'all_contact_messages',
          admin_name: 'All Contact Messages',
          smtp: { messages: [], updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (_) {}
    }
    writeJson(MESSAGES_FILE, []);
    global._rfMemoryStore['messages'] = [];
    return true;
  },

  // --- PHOTO UPLOAD HELPER ---
  async uploadPhoto(fileName, base64Data, mimeType = 'image/jpeg') {
    const rawExt = path.extname(fileName) || '.jpg';
    const cleanExt = rawExt.toLowerCase();
    const baseName = path.basename(fileName, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFileName = `frame_photo_${Date.now()}_${baseName.slice(0, 30)}${cleanExt}`;
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. If Supabase is connected, try uploading to 'photos' bucket
    if (supabase && isSupabaseOperational()) {
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
    if (supabase && isSupabaseOperational()) {
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
    if (supabase && isSupabaseOperational()) {
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
    if (supabase && isSupabaseOperational()) {
      const { data, error } = await supabase.from('customers').select('*').order('registered_at', { ascending: false });
      if (!error && data) return data;
    }
    return readJson(CUSTOMERS_FILE, []);
  },

  async deleteCustomer(emailOrId) {
    const clean = (emailOrId || '').trim().toLowerCase();
    if (supabase && isSupabaseOperational()) {
      try {
        await supabase.from('customers').delete().or(`email.ilike.${clean},id.ilike.${clean}`);
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase deleteCustomer exception:', err.message);
      }
    }
    let customers = readJson(CUSTOMERS_FILE, []);
    customers = customers.filter(c => (!c.email || c.email.toLowerCase() !== clean) && (!c.id || c.id.toLowerCase() !== clean));
    writeJson(CUSTOMERS_FILE, customers);
    return true;
  },

  async clearAllCustomers() {
    if (supabase && isSupabaseOperational()) {
      try {
        const { data: supaCusts } = await supabase.from('customers').select('email, id');
        if (Array.isArray(supaCusts) && supaCusts.length) {
          for (const c of supaCusts) {
            if (c.email) await supabase.from('customers').delete().eq('email', c.email);
            if (c.id) await supabase.from('customers').delete().eq('id', c.id);
          }
        }
        await supabase.from('customers').delete().neq('email', '');
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase clearAllCustomers exception:', err.message);
      }
    }
    writeJson(CUSTOMERS_FILE, []);
    return true;
  },

  async saveCustomer(customer) {
    if (supabase && isSupabaseOperational()) {
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

    if (supabase && isSupabaseOperational()) {
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

  async getCustomerByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    // In-memory cache fallback to avoid cold-start wipes
    global._rfCustomerCarts = global._rfCustomerCarts || {};
    global._rfCustomerWishlists = global._rfCustomerWishlists || {};
    const memCart = global._rfCustomerCarts[cleanEmail];
    const memWishlist = global._rfCustomerWishlists[cleanEmail];

    const customers = readJson(CUSTOMERS_FILE, []);
    const foundLocal = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);

    if (supabase && isSupabaseOperational()) {
      try {
        const queryPromise = supabase.from('customers').select('*').eq('email', cleanEmail).maybeSingle();
        const { data, error } = await withTimeout(queryPromise, 3500, 'Supabase getCustomerByEmail');
        if (!error && data) {
          // If in-memory store was explicitly updated (even to []), respect it as authoritative
          const cart = (memCart !== undefined && Array.isArray(memCart))
            ? memCart
            : (Array.isArray(data.cart) ? data.cart : ((foundLocal && Array.isArray(foundLocal.cart)) ? foundLocal.cart : []));

          const wishlist = (memWishlist !== undefined && Array.isArray(memWishlist))
            ? memWishlist
            : (Array.isArray(data.wishlist) ? data.wishlist : ((foundLocal && Array.isArray(foundLocal.wishlist)) ? foundLocal.wishlist : []));

          return {
            ...data,
            cart,
            wishlist
          };
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase getCustomerByEmail warning:', err.message);
      }
    }

    if (foundLocal) {
      const cart = (memCart !== undefined && Array.isArray(memCart))
        ? memCart
        : (Array.isArray(foundLocal.cart) ? foundLocal.cart : []);
      const wishlist = (memWishlist !== undefined && Array.isArray(memWishlist))
        ? memWishlist
        : (Array.isArray(foundLocal.wishlist) ? foundLocal.wishlist : []);
      return {
        ...foundLocal,
        cart,
        wishlist
      };
    }

    if (memCart || memWishlist) {
      return {
        email: cleanEmail,
        cart: Array.isArray(memCart) ? memCart : [],
        wishlist: Array.isArray(memWishlist) ? memWishlist : []
      };
    }

    return null;
  },

  async saveCustomerCart(email, cart) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();
    const sanitizedCart = Array.isArray(cart) ? cart : [];

    global._rfCustomerCarts = global._rfCustomerCarts || {};
    global._rfCustomerCarts[cleanEmail] = sanitizedCart;

    const customers = readJson(CUSTOMERS_FILE, []);
    const idx = customers.findIndex(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      customers[idx].cart = sanitizedCart;
      customers[idx].updatedAt = new Date().toISOString();
    } else {
      customers.unshift({
        id: 'CUST-' + String(customers.length + 1).padStart(4, '0'),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        cart: sanitizedCart,
        wishlist: [],
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Active'
      });
    }
    writeJson(CUSTOMERS_FILE, customers);

    if (supabase && isSupabaseOperational()) {
      try {
        const updatePromise = supabase
          .from('customers')
          .update({ cart: sanitizedCart, updated_at: new Date().toISOString() })
          .eq('email', cleanEmail);
        const { error } = await withTimeout(updatePromise, 4000, 'Supabase saveCustomerCart');
        if (error) {
          console.warn('⚠️ [DATABASE] Supabase saveCustomerCart note:', error.message);
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase saveCustomerCart warning:', err.message);
      }
    }

    return sanitizedCart;
  },

  async saveCustomerWishlist(email, wishlist) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();
    const sanitizedWishlist = Array.isArray(wishlist) ? wishlist : [];

    global._rfCustomerWishlists = global._rfCustomerWishlists || {};
    global._rfCustomerWishlists[cleanEmail] = sanitizedWishlist;

    const customers = readJson(CUSTOMERS_FILE, []);
    const idx = customers.findIndex(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      customers[idx].wishlist = sanitizedWishlist;
      customers[idx].updatedAt = new Date().toISOString();
    } else {
      customers.unshift({
        id: 'CUST-' + String(customers.length + 1).padStart(4, '0'),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        cart: [],
        wishlist: sanitizedWishlist,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Active'
      });
    }
    writeJson(CUSTOMERS_FILE, customers);

    if (supabase && isSupabaseOperational()) {
      try {
        const updatePromise = supabase
          .from('customers')
          .update({ wishlist: sanitizedWishlist, updated_at: new Date().toISOString() })
          .eq('email', cleanEmail);
        const { error } = await withTimeout(updatePromise, 4000, 'Supabase saveCustomerWishlist');
        if (error) {
          console.warn('⚠️ [DATABASE] Supabase saveCustomerWishlist note:', error.message);
        }
      } catch (err) {
        console.warn('⚠️ [DATABASE] Supabase saveCustomerWishlist warning:', err.message);
      }
    }

    return sanitizedWishlist;
  },

  // --- CUSTOMER REVIEWS (PUBLIC CLOUD PERSISTENCE) ---
  async getReviews(productId = null) {
    const targetProduct = productId ? String(productId).trim().toLowerCase() : null;
    let allFound = [];

    // 1. Fetch from Supabase reviews table (all reviews to allow alias mapping)
    if (supabase && isSupabaseOperational()) {
      try {
        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const remoteReviews = data.map(r => ({
            id: r.id,
            productId: r.product_id,
            productSlug: r.product_slug || '',
            productName: r.product_name || '',
            author: r.author,
            city: r.city || 'Dahej / Bharuch',
            rating: Number(r.rating) || 5,
            date: r.date || '',
            headline: r.headline || '',
            comment: r.comment || '',
            verified: Boolean(r.verified),
            helpful: Number(r.helpful) || 0
          }));
          allFound = remoteReviews;
        } else if (error) {
          console.warn('Supabase reviews table query note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase reviews table fetch exception:', err.message);
      }

      // 1b. Check redundant backup in admin_config
      try {
        const cfgRes = await supabase.from('admin_config').select('smtp').eq('id', 'all_customer_reviews').maybeSingle();
        if (cfgRes && cfgRes.data && cfgRes.data.smtp && Array.isArray(cfgRes.data.smtp.reviews)) {
          const idSet = new Set(allFound.map(r => r.id));
          for (const cr of cfgRes.data.smtp.reviews) {
            if (!idSet.has(cr.id)) {
              allFound.push(cr);
              idSet.add(cr.id);
            }
          }
        }
      } catch (_) {}
    }

    // 2. Merge any local reviews from REVIEWS_FILE
    try {
      const localReviews = readJson(REVIEWS_FILE, []);
      const idSet = new Set(allFound.map(r => r.id));
      for (const lr of localReviews) {
        if (!idSet.has(lr.id)) {
          allFound.push(lr);
          idSet.add(lr.id);
        }
      }
    } catch (_) {}

    // Exclude all trial, test, and hardcoded baseline mock reviews
    const TRIAL_REVIEW_IDS = new Set([
      'rev-custom-company-envelope-set-2',
      'rev-cust-live-1794226875795',
      'rev-1790625191990',
      'rev-gfc-1',
      'rev-gfc-2',
      'rev-pfg-1',
      'rev-pwb-1',
      'rev-ccm-1',
      'rev-test-live-1794225614036'
    ]);
    allFound = allFound.filter(r => {
      if (!r || !r.id) return false;
      const cleanId = String(r.id).trim().toLowerCase();
      if (TRIAL_REVIEW_IDS.has(r.id) || TRIAL_REVIEW_IDS.has(cleanId)) return false;
      if (cleanId.startsWith('test-') || cleanId.startsWith('rev-test-') || cleanId.startsWith('rev-cust-live-')) return false;
      return true;
    });

    // Strict product-wise isolation with alias awareness (matching ID, slug, and name)
    if (targetProduct) {
      const allowedIds = new Set([targetProduct]);
      try {
        const catalogProducts = await this.getProducts();
        const matchedProd = catalogProducts.find(p => {
          if (!p) return false;
          const pid = String(p.id || '').trim().toLowerCase();
          const pslug = String(p.slug || '').trim().toLowerCase();
          const pname = String(p.name || '').trim().toLowerCase();
          return pid === targetProduct || pslug === targetProduct || pname === targetProduct;
        });
        if (matchedProd) {
          if (matchedProd.id) allowedIds.add(String(matchedProd.id).trim().toLowerCase());
          if (matchedProd.slug) allowedIds.add(String(matchedProd.slug).trim().toLowerCase());
          if (matchedProd.name) allowedIds.add(String(matchedProd.name).trim().toLowerCase());
        }
      } catch (_) {}

      return allFound.filter(r => {
        const rp = String(r.productId || r.product_id || '').trim().toLowerCase();
        const rs = String(r.productSlug || '').trim().toLowerCase();
        const rn = String(r.productName || '').trim().toLowerCase();
        return allowedIds.has(rp) || (rs && allowedIds.has(rs)) || (rn && allowedIds.has(rn));
      });
    }

    return allFound;
  },

  async saveReview(review) {
    const cleanProductId = (review.productId || '').trim();
    const cleanReview = {
      ...review,
      id: review.id || `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: cleanProductId,
      productSlug: (review.productSlug || '').trim(),
      productName: (review.productName || '').trim(),
      rating: Number(review.rating) || 5,
      date: review.date || new Date().toISOString().split('T')[0],
      verified: review.verified !== false,
      helpful: Number(review.helpful) || 0
    };

    if (supabase && isSupabaseOperational()) {
      // 1a. Upsert to Supabase reviews table
      try {
        const dbRow = {
          id: cleanReview.id,
          product_id: cleanProductId,
          author: cleanReview.author,
          city: cleanReview.city || 'Dahej / Bharuch',
          rating: cleanReview.rating,
          date: cleanReview.date,
          headline: cleanReview.headline,
          comment: cleanReview.comment,
          verified: cleanReview.verified,
          helpful: cleanReview.helpful
        };
        const { error } = await supabase.from('reviews').upsert(dbRow, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase reviews table upsert note:', error.message);
        } else {
          console.log(`✅ Review ${cleanReview.id} saved in Supabase for ${cleanProductId}`);
        }
      } catch (err) {
        console.warn('Supabase reviews table save exception:', err.message);
      }

      // 1b. Redundant cloud backup in admin_config
      try {
        const cfgRes = await supabase.from('admin_config').select('smtp').eq('id', 'all_customer_reviews').maybeSingle();
        let cloudList = (cfgRes && cfgRes.data && cfgRes.data.smtp && Array.isArray(cfgRes.data.smtp.reviews))
          ? cfgRes.data.smtp.reviews
          : [];
        const cIdx = cloudList.findIndex(r => r.id === cleanReview.id);
        if (cIdx !== -1) {
          cloudList[cIdx] = cleanReview;
        } else {
          cloudList.unshift(cleanReview);
        }
        await supabase.from('admin_config').upsert({
          id: 'all_customer_reviews',
          smtp: { reviews: cloudList }
        });
      } catch (err) {
        console.warn('Supabase admin_config review backup note:', err.message);
      }
    }

    // 2. Local JSON file backup
    try {
      const reviews = readJson(REVIEWS_FILE, []);
      const idx = reviews.findIndex(r => r.id === cleanReview.id);
      if (idx !== -1) {
        reviews[idx] = { ...reviews[idx], ...cleanReview };
      } else {
        reviews.unshift(cleanReview);
      }
      writeJson(REVIEWS_FILE, reviews);
    } catch (_) {}

    return cleanReview;
  },

  async deleteReview(id) {
    if (!id) return;
    if (supabase && isSupabaseOperational()) {
      try {
        await supabase.from('reviews').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete review note:', err.message);
      }
      try {
        const cfgRes = await supabase.from('admin_config').select('smtp').eq('id', 'all_customer_reviews').maybeSingle();
        if (cfgRes && cfgRes.data && cfgRes.data.smtp && Array.isArray(cfgRes.data.smtp.reviews)) {
          const updated = cfgRes.data.smtp.reviews.filter(r => r.id !== id);
          await supabase.from('admin_config').upsert({
            id: 'all_customer_reviews',
            smtp: { reviews: updated }
          });
        }
      } catch (_) {}
    }

    try {
      const localReviews = readJson(REVIEWS_FILE, []);
      const filtered = localReviews.filter(r => r.id !== id);
      writeJson(REVIEWS_FILE, filtered);
    } catch (_) {}
  },

  // --- TRIAL DATA PURGE ROUTINE ---
  async cleanTrialData() {
    const trialReviewIds = [
      'rev-custom-company-envelope-set-2',
      'rev-cust-live-1794226875795',
      'rev-1790625191990',
      'rev-gfc-1',
      'rev-gfc-2',
      'rev-pfg-1',
      'rev-pwb-1',
      'rev-ccm-1',
      'rev-test-live-1794225614036'
    ];
    const trialMessageIds = [
      'MSG-2026-001',
      'MSG-2026-002'
    ];

    if (supabase && isSupabaseOperational()) {
      try {
        await supabase.from('reviews').delete().in('id', trialReviewIds);
        await supabase.from('reviews').delete().ilike('id', 'rev-test-%');
        await supabase.from('reviews').delete().ilike('id', 'rev-cust-live-%');
        await supabase.from('admin_config').upsert({
          id: 'all_customer_reviews',
          admin_name: 'All Customer Reviews',
          smtp: { reviews: [], updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        console.log('🧹 [PURGE] Purged trial reviews from Supabase');
      } catch (e) {
        console.warn('Supabase clean reviews error:', e.message);
      }

      try {
        await supabase.from('messages').delete().neq('id', '___keep_none___');
        await supabase.from('admin_config').upsert({
          id: 'all_contact_messages',
          admin_name: 'All Contact Messages',
          smtp: { messages: [], updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        console.log('🧹 [PURGE] Purged all messages from Supabase');
      } catch (e) {
        console.warn('Supabase clean messages error:', e.message);
      }

      try {
        await supabase.from('customers').delete().neq('email', '___keep_none___');
        console.log('🧹 [PURGE] Purged all customers from Supabase');
      } catch (e) {
        console.warn('Supabase clean customers error:', e.message);
      }

      try {
        await supabase.from('inquiries').delete().ilike('name', '%Test%');
        await supabase.from('inquiries').delete().ilike('email', '%test%');
        console.log('🧹 [PURGE] Purged test inquiries from Supabase');
      } catch (e) {
        console.warn('Supabase clean inquiries error:', e.message);
      }
    }

    writeJson(REVIEWS_FILE, []);
    writeJson(MESSAGES_FILE, []);
    writeJson(CUSTOMERS_FILE, []);
    writeJson(path.join(DATA_DIR, 'customer-sessions.json'), {});
    global._rfMemoryStore['reviews'] = [];
    global._rfMemoryStore['messages'] = [];
    global._rfMemoryStore['customers'] = [];
    global._rfMemoryStore['customerSessions'] = {};

    return { success: true, message: 'All messages, customers, reviews, and test data cleanly purged.' };
  },

  // Supabase client instance
  supabase,

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
