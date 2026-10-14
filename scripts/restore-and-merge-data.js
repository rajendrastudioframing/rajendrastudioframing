const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJsonSafe(file, defaultValue = []) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8').trim();
      if (content) return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`Error reading ${file}:`, err.message);
  }
  return defaultValue;
}

function writeJsonPretty(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

console.log('--- RESTORING & MERGING DATA FILES ---');

// 1. ORDERS
const currentOrders = readJsonSafe(path.join(DATA_DIR, 'orders.json'), []);
const backupOrders = readJsonSafe(path.join(DATA_DIR, 'orders.backup.json'), []);
const orderMap = new Map();

[...backupOrders, ...currentOrders].forEach(o => {
  const id = o.orderId || o.id;
  if (id) {
    orderMap.set(id, o);
  }
});
const mergedOrders = Array.from(orderMap.values());
writeJsonPretty(path.join(DATA_DIR, 'orders.json'), mergedOrders);
console.log(`✅ Orders restored: ${mergedOrders.length} orders in data/orders.json`);

// 2. INQUIRIES / LEADS
const currentInquiries = readJsonSafe(path.join(DATA_DIR, 'inquiries.json'), []);
const backupInquiries = readJsonSafe(path.join(DATA_DIR, 'inquiries.backup.json'), []);
const inqMap = new Map();

[...backupInquiries, ...currentInquiries].forEach(i => {
  const id = i.id || (i.name + '_' + i.phone);
  if (id) {
    inqMap.set(id, i);
  }
});
const mergedInquiries = Array.from(inqMap.values());
writeJsonPretty(path.join(DATA_DIR, 'inquiries.json'), mergedInquiries);
console.log(`✅ Inquiries restored: ${mergedInquiries.length} leads in data/inquiries.json`);

// 3. MESSAGES
const currentMessages = readJsonSafe(path.join(DATA_DIR, 'messages.json'), []);
const backupMessages = readJsonSafe(path.join(DATA_DIR, 'messages.backup.json'), []);
const msgMap = new Map();

[...backupMessages, ...currentMessages].forEach(m => {
  const id = m.id || (m.name + '_' + m.createdAt);
  if (id) {
    msgMap.set(id, m);
  }
});
const mergedMessages = Array.from(msgMap.values());
writeJsonPretty(path.join(DATA_DIR, 'messages.json'), mergedMessages);
console.log(`✅ Messages restored: ${mergedMessages.length} messages in data/messages.json`);

// 4. REVIEWS
const currentReviews = readJsonSafe(path.join(DATA_DIR, 'reviews.json'), []);
const backupReviews = readJsonSafe(path.join(DATA_DIR, 'reviews.backup.json'), []);
const revMap = new Map();

[...backupReviews, ...currentReviews].forEach(r => {
  const id = r.id;
  if (id) {
    revMap.set(id, r);
  }
});
const mergedReviews = Array.from(revMap.values());
writeJsonPretty(path.join(DATA_DIR, 'reviews.json'), mergedReviews);
console.log(`✅ Reviews restored: ${mergedReviews.length} reviews in data/reviews.json`);

// 5. CUSTOMERS
const currentCustomers = readJsonSafe(path.join(DATA_DIR, 'customers.json'), []);
const backupCustomers = readJsonSafe(path.join(DATA_DIR, 'customers.backup.json'), []);
const custSessions = readJsonSafe(path.join(DATA_DIR, 'customer-sessions.json'), {});
const custMap = new Map();

// Seed from backup customers
backupCustomers.forEach(c => {
  if (c && c.email) {
    custMap.set(c.email.toLowerCase().trim(), { ...c });
  }
});

// Seed from current customers
currentCustomers.forEach(c => {
  if (c && c.email) {
    const email = c.email.toLowerCase().trim();
    const existing = custMap.get(email) || {};
    custMap.set(email, { ...existing, ...c });
  }
});

// Aggregate from customer sessions
for (const [token, sess] of Object.entries(custSessions)) {
  if (sess && sess.email) {
    const email = sess.email.toLowerCase().trim();
    if (custMap.has(email)) {
      const c = custMap.get(email);
      c.status = 'Active';
      c.lastLoginAt = new Date(sess.createdAt || Date.now()).toISOString();
    } else {
      custMap.set(email, {
        id: `CUST-${String(custMap.size + 1).padStart(4, '0')}`,
        name: sess.name || email.split('@')[0],
        email: email,
        phone: sess.phone || '',
        registeredAt: new Date(sess.createdAt || Date.now()).toISOString(),
        lastLoginAt: new Date(sess.createdAt || Date.now()).toISOString(),
        loginCount: 1,
        totalOrders: 0,
        totalSpent: 0,
        status: 'Active'
      });
    }
  }
}

// Cross-reference with Orders to update totalOrders and totalSpent
mergedOrders.forEach(o => {
  const email = ((o.customer && o.customer.email) || o.email || '').toLowerCase().trim();
  if (email) {
    if (!custMap.has(email)) {
      const oName = (o.customer && o.customer.name) || o.name || email.split('@')[0];
      const oPhone = (o.customer && o.customer.phone) || o.phone || '';
      custMap.set(email, {
        id: `CUST-${String(custMap.size + 1).padStart(4, '0')}`,
        name: oName,
        email: email,
        phone: oPhone,
        registeredAt: o.createdAt || new Date().toISOString(),
        lastLoginAt: o.createdAt || null,
        loginCount: 1,
        totalOrders: 0,
        totalSpent: 0,
        status: 'Active'
      });
    }
    const c = custMap.get(email);
    c.totalOrders = (c.totalOrders || 0) + 1;
    c.totalSpent = (c.totalSpent || 0) + (Number(o.total) || 0);
    c.lastOrderAt = o.createdAt;
  }
});

// Cross-reference with Inquiries
mergedInquiries.forEach(inq => {
  const email = (inq.email || '').toLowerCase().trim();
  if (email && !custMap.has(email)) {
    custMap.set(email, {
      id: `CUST-${String(custMap.size + 1).padStart(4, '0')}`,
      name: inq.name || email.split('@')[0],
      email: email,
      phone: inq.phone || '',
      registeredAt: inq.createdAt || new Date().toISOString(),
      lastLoginAt: null,
      loginCount: 0,
      totalOrders: 0,
      totalSpent: 0,
      status: 'Lead'
    });
  }
});

const mergedCustomers = Array.from(custMap.values());
writeJsonPretty(path.join(DATA_DIR, 'customers.json'), mergedCustomers);
console.log(`✅ Customers restored & unified: ${mergedCustomers.length} accounts in data/customers.json`);
console.log('--- ALL DATA RESTORED SUCCESSFULLY ---');
