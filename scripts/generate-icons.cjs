const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = process.cwd();
const sourceSvg = path.resolve(projectRoot, 'assets', 'icon.svg');
const assetsDir = path.resolve(projectRoot, 'assets');
const publicDir = path.resolve(projectRoot, 'public');

function ensureFile(pathname) {
  if (!fs.existsSync(pathname)) {
    throw new Error(`Missing source file: ${pathname}`);
  }
}

function ensureTool(name) {
  try {
    execFileSync(name, ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error(`Required tool not found: ${name}`);
  }
}

function renderPng({ width, height, output }) {
  execFileSync('rsvg-convert', [
    '--width',
    String(width),
    '--height',
    String(height),
    sourceSvg,
    '--output',
    output,
  ]);
}

async function main() {
  ensureFile(sourceSvg);
  ensureTool('rsvg-convert');
  await fs.promises.mkdir(assetsDir, { recursive: true });
  await fs.promises.mkdir(publicDir, { recursive: true });

  renderPng({ width: 1024, height: 1024, output: path.join(assetsDir, 'icon.png') });
  renderPng({ width: 512, height: 512, output: path.join(assetsDir, 'icon-512.png') });
  renderPng({ width: 192, height: 192, output: path.join(assetsDir, 'icon-192.png') });
  renderPng({ width: 48, height: 48, output: path.join(assetsDir, 'favicon.png') });
  renderPng({ width: 32, height: 32, output: path.join(assetsDir, 'favicon-32.png') });
  renderPng({ width: 180, height: 180, output: path.join(publicDir, 'apple-touch-icon.png') });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
