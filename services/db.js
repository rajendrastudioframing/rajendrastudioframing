/**
 * RAJESH FRAMING - DATABASE ADAPTER
 * Seamless dual-mode database:
 * 1. Cloud Mode: Powered by Supabase (PostgreSQL) when SUPABASE_URL is configured
 * 2. Local Mode: Falls back gracefully to data/*.json for local offline development
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure local data dir exists (skip on Vercel serverless read-only filesystem)
if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (_) {}
}

// Helper: Local JSON Read / Write
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      if (!process.env.VERCEL) {
        try { fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2)); } catch (_) {}
      }
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    if (process.env.VERCEL) return true;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

// Initialize Supabase Client if env variables are present
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
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

module.exports = {
  isCloud: () => Boolean(supabase),
  supabase,

  // --- PRODUCTS ---
  async getProducts() {
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (!error && data) return data;
      console.warn('Supabase getProducts error, falling back to local:', error?.message);
    }
    return readJson(PRODUCTS_FILE, []);
  },

  async saveProduct(product) {
    if (supabase) {
      const { data, error } = await supabase.from('products').upsert(product).select().single();
      if (!error) return data;
      console.warn('Supabase saveProduct error, writing local:', error?.message);
    }
    const products = readJson(PRODUCTS_FILE, []);
    const idx = products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...product };
    } else {
      products.push(product);
    }
    writeJson(PRODUCTS_FILE, products);
    return product;
  },

  async deleteProduct(id) {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) return true;
      console.warn('Supabase deleteProduct error:', error?.message);
    }
    let products = readJson(PRODUCTS_FILE, []);
    products = products.filter(p => p.id !== id);
    return writeJson(PRODUCTS_FILE, products);
  },

  // --- ORDERS ---
  async getOrders() {
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        // Map database columns to app schema
        return data.map(o => ({
          orderId: o.order_id,
          customer: o.customer,
          items: o.items,
          subtotal: o.subtotal,
          shipping: o.shipping,
          total: o.total,
          notes: o.notes,
          paymentMethod: o.payment_method,
          paymentStatus: o.payment_status,
          upiUtr: o.upi_utr,
          status: o.status,
          createdAt: o.created_at,
          updatedAt: o.updated_at
        }));
      }
      console.warn('Supabase getOrders error, falling back to local:', error?.message);
    }
    return readJson(ORDERS_FILE, []);
  },

  async getOrderById(orderId) {
    const cleanId = (orderId || '').trim().replace(/^#/, '');
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('order_id', cleanId)
        .maybeSingle();
      if (!error && data) {
        return {
          orderId: data.order_id,
          customer: data.customer,
          items: data.items,
          subtotal: data.subtotal,
          shipping: data.shipping,
          total: data.total,
          notes: data.notes,
          paymentMethod: data.payment_method,
          paymentStatus: data.payment_status,
          upiUtr: data.upi_utr,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    }
    const orders = readJson(ORDERS_FILE, []);
    return orders.find(o => o.orderId && o.orderId.toLowerCase() === cleanId.toLowerCase()) || null;
  },

  async saveOrder(order) {
    if (supabase) {
      const dbRow = {
        order_id: order.orderId,
        customer: order.customer,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        notes: order.notes,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus || 'Pending',
        upi_utr: order.upiUtr,
        status: order.status || 'Confirmed',
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('orders').upsert(dbRow).select().single();
      if (!error) return order;
      console.warn('Supabase saveOrder error, writing local:', error?.message);
    }
    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.orderId === order.orderId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...order, updatedAt: new Date().toISOString() };
    } else {
      orders.unshift(order);
    }
    writeJson(ORDERS_FILE, orders);
    return order;
  },

  // --- INQUIRIES ---
  async getInquiries() {
    if (supabase) {
      const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(i => ({
          id: i.id,
          name: i.name,
          phone: i.phone,
          email: i.email,
          product: i.product,
          specs: i.specs,
          quantity: i.quantity,
          estimatedValue: i.estimated_value,
          notes: i.notes,
          status: i.status,
          hasUpload: i.has_upload,
          uploadFileName: i.upload_file_name,
          createdAt: i.created_at,
          updatedAt: i.updated_at
        }));
      }
    }
    return readJson(INQUIRIES_FILE, []);
  },

  async saveInquiry(inquiry) {
    if (supabase) {
      const dbRow = {
        id: inquiry.id,
        name: inquiry.name,
        phone: inquiry.phone,
        email: inquiry.email,
        product: inquiry.product,
        specs: inquiry.specs,
        quantity: inquiry.quantity || 1,
        estimated_value: inquiry.estimatedValue || 0,
        notes: inquiry.notes || '',
        status: inquiry.status || 'New',
        has_upload: inquiry.hasUpload || false,
        upload_file_name: inquiry.uploadFileName || null,
        created_at: inquiry.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('inquiries').upsert(dbRow);
      if (!error) return inquiry;
    }
    const inquiries = readJson(INQUIRIES_FILE, []);
    const idx = inquiries.findIndex(i => i.id === inquiry.id);
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
      await supabase.from('inquiries').delete().ilike('id', cleanId);
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

  // Local file references for legacy imports
  readJson,
  writeJson,
  CONFIG_FILE,
  INQUIRIES_FILE,
  PRODUCTS_FILE,
  MESSAGES_FILE,
  ORDERS_FILE,
  SESSIONS_FILE
};
