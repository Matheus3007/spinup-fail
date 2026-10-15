// Screenshots for checking posts and islands against the design rules.
//   node scripts/shoot.mjs <url> <out.png> [--mobile] [--full]
// Prints console errors/warnings (or "no console errors"). Exit 1 on page errors.
// WSL without sudo: chromium's missing libs live in ~/.local/lib/chromium-deps
// (same workaround as pcb-review); harmless elsewhere.
import { chromium } from 'playwright-core';
import os from 'node:os';

const args = process.argv.slice(2);
const [url, out] = args.filter((a) => !a.startsWith('--'));
const mobile = args.includes('--mobile');
const full = args.includes('--full');
if (!url || !out) {
  console.error('usage: node scripts/shoot.mjs <url> <out.png> [--mobile] [--full]');
  process.exit(2);
}

const LIBS = `${os.homedir()}/.local/lib/chromium-deps`;
const browser = await chromium.launch({
  env: { ...process.env, LD_LIBRARY_PATH: [LIBS, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
});
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
});
const logs = [];
let fatal = false;
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => { fatal = true; logs.push(`pageerror: ${e.message}`); });
await page.goto(url, { waitUntil: 'networkidle' });
// client:visible islands hydrate on scroll: walk the page so they all mount.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(800);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (overflow > 1) logs.push(`layout: horizontal overflow of ${overflow}px`);
await page.screenshot({ path: out, fullPage: full });
console.log(logs.join('\n') || 'no console errors');
await browser.close();
process.exit(fatal ? 1 : 0);
