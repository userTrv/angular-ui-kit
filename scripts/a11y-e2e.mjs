// axe-core against the BUILT docs site in real Chromium, which the jsdom unit tests cannot do:
// colour contrast, focus-visible styles, layout-dependent rules. Every page is checked in the light,
// dark and high-contrast themes. The site is served from a sub-path to also prove the static
// deployment works without a SPA fallback.
//
// Usage: pnpm build && pnpm test:a11y      (CHROME_PATH=/path/to/chrome to use a local browser)
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const base = '/projects/angular-ui-kit/';
const themes = ['light', 'dark', 'high-contrast'];

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `pnpm build` first.');
  process.exit(1);
}

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  if (!url.startsWith(base)) return res.writeHead(404).end();
  let file = normalize(join(dist, url.slice(base.length)));
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end(); // no SPA fallback, like the real host
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}${base}`;

// Page list from the generated registry (every component page) plus the guide pages.
const registry = readFileSync(join(root, 'projects/docs/src/app/generated/registry.ts'), 'utf8');
const slugs = [...registry.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
const routes = ['#/', '#/theming', ...slugs.map((s) => `#/components/${s}`)];

const axeSource = readFileSync(join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
const results = [];
let failed = 0;

for (const theme of themes) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript((t) => localStorage.setItem('usertrv-ui-docs', JSON.stringify({ theme: t, density: 'comfortable' })), theme);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  for (const route of routes) {
    await page.goto(origin + route);
    await page.waitForSelector('main h1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(150);
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(async () => {
      // @ts-expect-error injected global
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
      return {
        passes: r.passes.length,
        violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) })),
      };
    });
    results.push({ theme, route, ...result });
    const errors = consoleErrors.splice(0);
    if (result.violations.length || errors.length) failed++;
    const status = result.violations.length ? `✗ ${result.violations.length} violation(s)` : '✓';
    console.log(`${status.padEnd(18)} ${theme.padEnd(14)} ${route}${errors.length ? `  console errors: ${errors.join(' | ')}` : ''}`);
    for (const v of result.violations) console.log(`    ${v.id} (${v.impact}) ${v.help}\n      ${v.nodes.join('\n      ')}`);
  }
  await context.close();
}

await browser.close();
server.close();
mkdirSync(join(root, 'test-results'), { recursive: true });
writeFileSync(join(root, 'test-results/a11y-e2e.json'), JSON.stringify(results, null, 2));
console.log(`\n${results.length} page/theme combinations checked, ${failed} with problems.`);
process.exit(failed ? 1 : 0);
