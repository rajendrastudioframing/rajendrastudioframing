const { execSync } = require('child_process');

try {
  console.log('--- GIT STATUS ---');
  const status = execSync('git status --short', { encoding: 'utf8' });
  console.log(status || 'Clean working tree');

  console.log('--- GIT ADD ---');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('--- GIT COMMIT ---');
  try {
    execSync('git commit -m "feat(admin): make metric cards compact, modern, and attractive 2-column grid for mobile screens"', { stdio: 'inherit' });
  } catch (err) {
    console.log('Nothing to commit or commit failed:', err.message);
  }

  console.log('--- GIT PUSH ---');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('=== PUSH SUCCESSFUL ===');
} catch (error) {
  console.error('Git error:', error.message);
}
