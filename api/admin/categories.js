/**
 * Vercel Serverless Function Handler: Admin Categories Endpoint
 * Delegates to Express app to ensure unified routing and memory persistence
 */
const app = require('../../server');

module.exports = (req, res) => {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/favicon')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
