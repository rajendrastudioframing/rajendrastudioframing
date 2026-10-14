const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const fixedCssSnippet = `
    /* Permanent Fixed Sidebar: Never scroll when page scrolls */
    @media (min-width: 769px) {
      .admin-sidebar,
      #adminSidebar {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        height: 100vh !important;
        width: 250px !important;
        z-index: 100 !important;
        overflow-y: auto !important;
      }
      .admin-main {
        margin-left: 250px !important;
        width: calc(100% - 250px) !important;
      }
    }
`;

function updateHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Update cache buster
  html = html.replace(/css\/admin\.css\?v=[^"']+/g, 'css/admin.css?v=sidebar_fixed_v3');

  // Insert fixed style snippet if not already there
  if (!html.includes('Permanent Fixed Sidebar')) {
    html = html.replace('</style>', fixedCssSnippet + '  </style>');
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Updated ${filePath}`);
}

updateHtml(path.join(rootDir, 'admin.html'));
updateHtml(path.join(rootDir, 'public', 'admin.html'));
