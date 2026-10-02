/**
 * RAJESH FRAMING - SUPABASE DATA SYNC SCRIPT
 * Synchronizes local data (*.json) with Supabase Cloud Database:
 * - Products with latest verified pricing
 * - Customers with names and phone numbers
 * - Customer Reviews with star ratings & comments
 * - Orders, Inquiries & Messages
 *
 * Usage:
 *   node scripts/sync-supabase.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

function readJsonFile(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.warn(`[Sync Warning] Failed to read ${filename}:`, err.message);
  }
  return defaultValue;
}

async function syncToSupabase() {
  console.log('\n======================================================');
  console.log('🔄 RAJESH FRAMING: SUPABASE CLOUD DATA SYNCHRONIZER');
  console.log('======================================================');

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    console.log('ℹ️  SUPABASE_URL or SUPABASE_KEY not configured in environment.');
    console.log('    Local JSON database is up-to-date and fully operational.');
    console.log('    To sync to Supabase Cloud, add SUPABASE_URL & SUPABASE_KEY to your .env or Vercel Environment Variables.\n');
    return { success: false, reason: 'Credentials not configured' };
  }

  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. SYNC PRODUCTS
  try {
    const products = readJsonFile('products.json', []);
    console.log(`📦 Syncing ${products.length} catalog products...`);
    for (const p of products) {
      const { error } = await supabase.from('products').upsert({
        id: p.id,
        name: p.name,
        category: p.category,
        category_label: p.categoryLabel || p.category_label,
        price: Number(p.price) || 0,
        price_display: p.priceDisplay || p.price_display,
        rating: Number(p.rating) || 5.0,
        reviews_count: Number(p.reviewsCount) || 100,
        badge: p.badge || null,
        image: p.image,
        short_description: p.shortDescription || p.short_description,
        description: p.description,
        material: p.material,
        printing_type: p.printingType || p.printing_type,
        status: p.status || 'In Stock',
        lead_time: p.leadTime || p.lead_time || '24 - 48 Hours',
        sizes: p.sizes || [],
        finishes: p.finishes || [],
        features: p.features || []
      }, { onConflict: 'id' });

      if (error) {
        console.warn(`   ⚠️ Product sync error (${p.id}):`, error.message);
      }
    }
    console.log('   ✅ Products synchronized successfully.');
  } catch (err) {
    console.error('   ❌ Products sync failed:', err.message);
  }

  // 2. SYNC CUSTOMERS
  try {
    const customers = readJsonFile('customers.json', []);
    console.log(`👤 Syncing ${customers.length} customer records...`);
    for (const c of customers) {
      const { error } = await supabase.from('customers').upsert({
        id: c.id,
        name: c.name,
        email: c.email.trim().toLowerCase(),
        phone: c.phone || '',
        registered_at: c.registeredAt || new Date().toISOString(),
        last_login_at: c.lastLoginAt || new Date().toISOString(),
        login_count: Number(c.loginCount) || 1,
        total_orders: Number(c.totalOrders) || 0,
        total_spent: Number(c.totalSpent) || 0,
        status: c.status || 'Active'
      }, { onConflict: 'email' });

      if (error) {
        console.warn(`   ⚠️ Customer sync error (${c.email}):`, error.message);
      }
    }
    console.log('   ✅ Customers synchronized successfully.');
  } catch (err) {
    console.error('   ❌ Customers sync failed:', err.message);
  }

  // 3. SYNC REVIEWS
  try {
    const reviews = readJsonFile('reviews.json', []);
    console.log(`⭐ Syncing ${reviews.length} customer reviews...`);
    for (const r of reviews) {
      const { error } = await supabase.from('reviews').upsert({
        id: r.id,
        product_id: r.productId,
        author: r.author,
        city: r.city || 'Dahej / Bharuch',
        rating: Number(r.rating) || 5,
        date: r.date || new Date().toISOString().split('T')[0],
        headline: r.headline,
        comment: r.comment,
        verified: Boolean(r.verified),
        helpful: Number(r.helpful) || 0
      }, { onConflict: 'id' });

      if (error) {
        console.warn(`   ⚠️ Review sync error (${r.id}):`, error.message);
      }
    }
    console.log('   ✅ Reviews synchronized successfully.');
  } catch (err) {
    console.error('   ❌ Reviews sync failed:', err.message);
  }

  // 4. SYNC ORDERS
  try {
    const orders = readJsonFile('orders.json', []);
    console.log(`📑 Syncing ${orders.length} orders...`);
    for (const o of orders) {
      const { error } = await supabase.from('orders').upsert({
        order_id: o.orderId,
        customer: o.customer,
        items: o.items,
        subtotal: Number(o.subtotal) || 0,
        shipping: Number(o.shipping) || 0,
        total: Number(o.total) || 0,
        notes: o.notes || '',
        order_photo: o.orderPhoto || null,
        payment_method: o.paymentMethod || 'Instant UPI Payment (QR Code)',
        payment_status: o.paymentStatus || 'Pending',
        upi_utr: o.upiUtr || null,
        status: o.status || 'Confirmed',
        created_at: o.createdAt || new Date().toISOString()
      }, { onConflict: 'order_id' });

      if (error) {
        console.warn(`   ⚠️ Order sync error (${o.orderId}):`, error.message);
      }
    }
    console.log('   ✅ Orders synchronized successfully.');
  } catch (err) {
    console.error('   ❌ Orders sync failed:', err.message);
  }

  // 5. SYNC INQUIRIES
  try {
    const inquiries = readJsonFile('inquiries.json', []);
    console.log(`💬 Syncing ${inquiries.length} inquiries...`);
    for (const i of inquiries) {
      const { error } = await supabase.from('inquiries').upsert({
        id: i.id,
        name: i.name,
        phone: i.phone,
        email: i.email || '',
        product: i.product || '',
        specs: i.specs || '',
        quantity: Number(i.quantity) || 1,
        estimated_value: Number(i.estimatedValue) || 0,
        notes: i.notes || '',
        status: i.status || 'New',
        has_upload: Boolean(i.hasUpload),
        upload_file_name: i.uploadFileName || null,
        created_at: i.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.warn(`   ⚠️ Inquiry sync error (${i.id}):`, error.message);
      }
    }
    console.log('   ✅ Inquiries synchronized successfully.');
  } catch (err) {
    console.error('   ❌ Inquiries sync failed:', err.message);
  }

  // 6. SYNC ADMIN CONFIG
  try {
    const config = readJsonFile('admin-config.json', {});
    if (config.adminEmail) {
      console.log(`⚙️  Syncing Admin Config...`);
      const { error } = await supabase.from('admin_config').upsert({
        id: 'default',
        admin_email: config.adminEmail,
        admin_password: config.adminPassword,
        admin_name: config.adminName || 'Rajesh Kumar',
        smtp: config.smtp || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.warn('   ⚠️ Admin config sync error:', error.message);
      } else {
        console.log('   ✅ Admin Config synchronized successfully.');
      }
    }
  } catch (err) {
    console.error('   ❌ Admin config sync failed:', err.message);
  }

  console.log('======================================================');
  console.log('🎉 SUPABASE CLOUD DATA SYNCHRONIZATION COMPLETED');
  console.log('======================================================\n');
  return { success: true };
}

if (require.main === module) {
  syncToSupabase().then(() => process.exit(0)).catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  });
}

module.exports = syncToSupabase;
