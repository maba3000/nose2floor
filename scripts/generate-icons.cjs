const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = process.cwd();
const sourceSvg = path.resolve(projectRoot, 'assets', 'icon.svg');
const outDir = path.resolve(projectRoot, 'assets');

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
  await fs.promises.mkdir(outDir, { recursive: true });

  renderPng({ width: 1024, height: 1024, output: path.join(outDir, 'icon.png') });
  renderPng({ width: 48, height: 48, output: path.join(outDir, 'favicon.png') });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
