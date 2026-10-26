/**
 * Vercel Serverless Function: Admin Categories Endpoint
 * Handles GET, POST, DELETE /api/admin/categories
 */

const db = require('../../services/db');

module.exports = async (req, res) => {
  // CORS & Cache-Control
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/admin/categories
  if (req.method === 'GET') {
    try {
      const categories = await db.getCategories();
      const products = await db.getProducts();
      const categoriesWithCount = categories.map(cat => {
        const count = products.filter(p => (p.category || '').toLowerCase() === (cat.id || '').toLowerCase()).length;
        return { ...cat, productCount: count };
      });
      return res.status(200).json({ success: true, categories: categoriesWithCount });
    } catch (err) {
      console.error('Error fetching admin categories:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch categories: ' + err.message });
    }
  }

  // POST /api/admin/categories
  if (req.method === 'POST') {
    try {
      const { id, name, icon, desc, badge, color, bg } = req.body || {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Category name is required.' });
      }

      const cleanId = (id || name).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
      const cleanName = name.trim();
      const cleanIcon = (icon && typeof icon === 'string' && icon.trim()) ? icon.trim() : '🏷️';
      const cleanDesc = (desc && typeof desc === 'string') ? desc.trim() : `Browse handcrafted ${cleanName} collection.`;
      const cleanBadge = (badge && typeof badge === 'string' && badge.trim()) ? badge.trim() : cleanName;
      const cleanColor = color || '#C99A3D';
      const cleanBg = bg || 'rgba(201, 154, 61, 0.15)';

      const newCategory = await db.saveCategory({
        id: cleanId,
        name: cleanName,
        icon: cleanIcon,
        desc: cleanDesc,
        badge: cleanBadge,
        color: cleanColor,
        bg: cleanBg
      });

      const allCategories = await db.getCategories();
      return res.status(200).json({
        success: true,
        message: `Category "${cleanName}" saved successfully.`,
        category: newCategory,
        categories: allCategories
      });
    } catch (err) {
      console.error('Error saving category in api/admin/categories:', err);
      return res.status(500).json({ success: false, message: 'Failed to save category: ' + err.message });
    }
  }

  // DELETE /api/admin/categories/:id
  if (req.method === 'DELETE') {
    try {
      const id = req.query ? req.query.id : (req.body ? req.body.id : null);
      if (!id) return res.status(400).json({ success: false, message: 'Category ID is required.' });

      const categories = await db.getCategories();
      const cat = categories.find(c => (c.id || '').toLowerCase() === String(id).toLowerCase());
      if (cat && cat.isDefault) {
        return res.status(400).json({ success: false, message: 'Default studio categories cannot be removed.' });
      }

      await db.deleteCategory(id);
      const updated = await db.getCategories();
      return res.status(200).json({ success: true, message: 'Category removed successfully.', categories: updated });
    } catch (err) {
      console.error('Error deleting category:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete category: ' + err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
