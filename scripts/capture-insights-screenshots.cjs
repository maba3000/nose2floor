#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.INSIGHTS_SCREENSHOT_PORT || 19009);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.join(ROOT, 'assets', 'readme');

const VARIANTS = [
  { key: 'preview', out: 'insights-preview.png', width: 1200, height: 540 },
  { key: 'activity', out: 'insights-activity.png', width: 1200, height: 300 },
  { key: 'stats', out: 'insights-stats.png', width: 1200, height: 500 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: opts.stdio ?? 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

function findChromeBinary() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const whichNames = ['google-chrome', 'chromium', 'chromium-browser', 'chrome'];
  for (const name of whichNames) {
    const result = spawnSync('command', ['-v', name], { shell: true, encoding: 'utf8' });
    const resolved = result.stdout.trim();
    if (resolved) return resolved;
  }

  throw new Error('Chrome binary not found. Set CHROME_BIN to a Chromium/Chrome executable path.');
}

function writeSeedFiles() {
  const demoPath = path.join(ROOT, 'demo', 'demo-import.json');
  const raw = fs.readFileSync(demoPath, 'utf8');

  const seedHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Seeding screenshots</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        color: #333;
        background: #f6f6f6;
      }
    </style>
  </head>
  <body>
    <div>Preparing Insights screenshot...</div>
    <script>
      (async () => {
        const params = new URLSearchParams(window.location.search);
        const variant = params.get('variant') || 'preview';

        const variants = {
          preview: {
            insightsShowPreview: true,
            insightsShowActivity: false,
            insightsShowStats: false,
          },
          activity: {
            insightsShowPreview: false,
            insightsShowActivity: true,
            insightsShowStats: false,
          },
          stats: {
            insightsShowPreview: false,
            insightsShowActivity: false,
            insightsShowStats: true,
          },
        };

        const toDateString = (ms) => {
          const d = new Date(ms);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return y + '-' + m + '-' + day;
        };

        try {
          const res = await fetch('/__screenshot_data.json?t=' + Date.now());
          const payload = await res.json();
          const patch = variants[variant] || variants.preview;
          const times = payload.history.map((s) => s.startedAt);
          const minMs = Math.min(...times);
          const maxMs = Math.max(...times);
          const dayMs = 24 * 3600 * 1000;
          const from = toDateString(minMs);
          const to = toDateString(maxMs);
          const activityFrom = toDateString(Math.max(minMs, maxMs - 119 * dayMs));
          const statsFrom = toDateString(Math.max(minMs, maxMs - 89 * dayMs));

          const nextSettings = {
            ...payload.settings,
            ...patch,
            themeMode: 'light',
            heatmapShowGoalStar: true,
            heatmapShowHitCount: false,
          };

          localStorage.setItem('settings', JSON.stringify(nextSettings));
          localStorage.setItem('history', JSON.stringify(payload.history));
          localStorage.removeItem('autoSession');

          // Allow storage writes to settle before route render.
          setTimeout(() => {
            if (variant === 'preview') {
              window.location.replace(
                '/insights?capture=preview&range=custom&from=' + from + '&to=' + to,
              );
              return;
            }
            if (variant === 'activity') {
              window.location.replace(
                '/insights?capture=activity&range=custom&from=' + activityFrom + '&to=' + to,
              );
              return;
            }
            window.location.replace(
              '/insights?capture=stats&range=custom&from=' + statsFrom + '&to=' + to,
            );
          }, 120);
        } catch (error) {
          document.body.innerHTML = '<pre style="padding:16px">Seeding failed: ' + String(error) + '</pre>';
        }
      })();
    </script>
  </body>
</html>`;

  const seedPath = path.join(ROOT, 'public', '__screenshot_seed.html');
  const dataPath = path.join(ROOT, 'public', '__screenshot_data.json');
  fs.mkdirSync(path.dirname(seedPath), { recursive: true });
  fs.writeFileSync(seedPath, seedHtml);
  fs.writeFileSync(dataPath, raw);

  return { seedPath, dataPath };
}

async function waitForServer(url, timeoutMs, serverProcess) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Expo web server exited early with code ${serverProcess.exitCode}`);
    }

    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve((res.statusCode || 500) < 500);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1200, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (ok) return;
    await sleep(1000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) return;

  serverProcess.kill('SIGINT');
  for (let i = 0; i < 20; i += 1) {
    if (serverProcess.exitCode !== null) return;
    await sleep(250);
  }

  serverProcess.kill('SIGTERM');
  for (let i = 0; i < 20; i += 1) {
    if (serverProcess.exitCode !== null) return;
    await sleep(250);
  }

  serverProcess.kill('SIGKILL');
}

async function captureWithChrome(chromeBin, url, outPath, budgetMs, width, height) {
  await run(
    chromeBin,
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--run-all-compositor-stages-before-draw',
      `--window-size=${width},${height}`,
      `--virtual-time-budget=${budgetMs}`,
      `--screenshot=${outPath}`,
      url,
    ],
    { stdio: 'pipe' },
  );
}

async function main() {
  const chromeBin = findChromeBinary();

  await run('npm', ['run', 'generate:demo-data']);
  const { seedPath, dataPath } = writeSeedFiles();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const webServer = spawn(
    'npm',
    ['run', 'web', '--', '--port', String(PORT), '--non-interactive'],
    {
      cwd: ROOT,
      env: { ...process.env, EXPO_WEB_USE_HERMES: 'false', CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  webServer.stdout.on('data', (chunk) => {
    if (process.env.SCREENSHOT_VERBOSE === '1') process.stdout.write(chunk);
  });

  webServer.stderr.on('data', (chunk) => {
    if (process.env.SCREENSHOT_VERBOSE === '1') process.stderr.write(chunk);
  });

  try {
    await waitForServer(`${BASE_URL}/insights`, 240000, webServer);

    await captureWithChrome(
      chromeBin,
      `${BASE_URL}/insights`,
      path.join(ROOT, 'tmp-warmup.png'),
      45000,
      1200,
      760,
    );
    if (fs.existsSync(path.join(ROOT, 'tmp-warmup.png'))) {
      fs.unlinkSync(path.join(ROOT, 'tmp-warmup.png'));
    }

    for (const variant of VARIANTS) {
      const outPath = path.join(OUTPUT_DIR, variant.out);
      const url = `${BASE_URL}/__screenshot_seed.html?variant=${variant.key}&t=${Date.now()}`;
      await captureWithChrome(chromeBin, url, outPath, 30000, variant.width, variant.height);
      console.log(`wrote ${path.relative(ROOT, outPath)}`);
    }

    console.log('Insights screenshots generated.');
  } finally {
    await stopServer(webServer);

    if (fs.existsSync(seedPath)) fs.unlinkSync(seedPath);
    if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
