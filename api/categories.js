/**
 * Vercel Serverless Function: Categories Endpoint
 * Resolves GET /api/categories and GET /api/categories/:id
 */

const db = require('../services/db');

module.exports = async (req, res) => {
  // CORS & Cache-Control
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const categories = await db.getCategories();

    // Check if query id is passed
    const id = req.query ? (req.query.id || req.query.category) : null;
    if (id) {
      const cat = categories.find(c => (c.id || '').toLowerCase() === String(id).toLowerCase());
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      return res.status(200).json({ success: true, category: cat });
    }

    return res.status(200).json({ success: true, categories });
  } catch (err) {
    console.error('Error in api/categories:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories: ' + err.message });
  }
};
