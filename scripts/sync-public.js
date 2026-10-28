/**
 * SYNC PUBLIC DIRECTORY SCRIPT
 * Keeps Root Frontend files (HTML, JS, CSS, Assets) and `public/` directory in 100% parity.
 *
 * Usage:
 *   node scripts/sync-public.js
 *   npm run sync
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const TARGET_DIRECTORIES = ['css', 'js', 'assets'];
const TARGET_FILES = [
  'about.html',
  'admin-login.html',
  'admin.html',
  'categories.html',
  'checkout.html',
  'contact.html',
  'index.html',
  'orders.html',
  'product-detail.html',
  'products.html',
  'track-order.html',
  'favicon.ico',
  'favicon.png'
];

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFileIfDifferent(src, dest) {
  if (!fs.existsSync(src)) return false;

  ensureDirSync(path.dirname(dest));

  if (fs.existsSync(dest)) {
    const srcStat = fs.statSync(src);
    const destStat = fs.statSync(dest);
    if (srcStat.size === destStat.size && Math.abs(srcStat.mtimeMs - destStat.mtimeMs) < 1000) {
      return false; // Already identical
    }
  }

  fs.copyFileSync(src, dest);
  return true;
}

function syncDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  ensureDirSync(destDir);

  let updatedCount = 0;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      updatedCount += syncDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      if (copyFileIfDifferent(srcPath, destPath)) {
        updatedCount++;
      }
    }
  }

  return updatedCount;
}

function runSync() {
  console.log('🔄 Synchronizing Root frontend files with public/ folder...');
  let totalUpdated = 0;

  // 1. Sync standalone HTML & Favicon files
  for (const file of TARGET_FILES) {
    const rootPath = path.join(ROOT_DIR, file);
    const publicPath = path.join(PUBLIC_DIR, file);

    if (fs.existsSync(rootPath) && fs.existsSync(publicPath)) {
      const rootStat = fs.statSync(rootPath);
      const publicStat = fs.statSync(publicPath);

      // Copy whichever is newer
      if (rootStat.mtimeMs >= publicStat.mtimeMs) {
        if (copyFileIfDifferent(rootPath, publicPath)) {
          console.log(`  ✓ Root -> public: ${file}`);
          totalUpdated++;
        }
      } else {
        if (copyFileIfDifferent(publicPath, rootPath)) {
          console.log(`  ✓ public -> Root: ${file}`);
          totalUpdated++;
        }
      }
    } else if (fs.existsSync(rootPath)) {
      if (copyFileIfDifferent(rootPath, publicPath)) {
        console.log(`  + Created in public: ${file}`);
        totalUpdated++;
      }
    } else if (fs.existsSync(publicPath)) {
      if (copyFileIfDifferent(publicPath, rootPath)) {
        console.log(`  + Created in root: ${file}`);
        totalUpdated++;
      }
    }
  }

  // 2. Sync folders (css, js, assets)
  for (const dirName of TARGET_DIRECTORIES) {
    const rootSubDir = path.join(ROOT_DIR, dirName);
    const publicSubDir = path.join(PUBLIC_DIR, dirName);

    totalUpdated += syncDirectoryRecursive(rootSubDir, publicSubDir);
  }

  console.log(`✅ Synchronization complete. ${totalUpdated} file(s) updated.\n`);
}

if (require.main === module) {
  runSync();
}

module.exports = runSync;
