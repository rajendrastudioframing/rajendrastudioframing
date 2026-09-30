/**
 * Vercel Serverless Function Handler
 * Automatically routes incoming serverless requests to Express app
 */
const app = require('../server');

module.exports = (req, res) => {
  // Normalize URL to preserve /api prefix for Express routing on Vercel
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/favicon')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
