// Size of each entry point's own code in the built package (dist-lib/ui/fesm2022):
// minified with esbuild, then gzipped. Angular, CDK, RxJS and other @usertrv/ui entry points are
// treated as external, so the number is what importing that entry point adds on top of what an
// Angular app already ships. Run after `pnpm build:lib`.
import { readdirSync, readFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('..', import.meta.url));
const fesm = join(root, 'dist-lib/ui/fesm2022');
if (!existsSync(fesm)) {
  console.error('dist-lib/ui not found — run `pnpm build:lib` first.');
  process.exit(1);
}
// esbuild is a transitive dependency of @angular/build.
const require = createRequire(realpathSync(join(root, 'node_modules/@angular/build/package.json')));
const { transform } = require('esbuild');

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const rows = [];
for (const file of readdirSync(fesm).filter((f) => f.endsWith('.mjs')).sort()) {
  const source = readFileSync(join(fesm, file), 'utf8');
  const { code } = await transform(source, { minify: true, format: 'esm', target: 'es2022', legalComments: 'none' });
  const entry = file === 'usertrv-ui.mjs' ? '@usertrv/ui' : `@usertrv/ui/${file.replace(/^usertrv-ui-/, '').replace(/\.mjs$/, '')}`;
  rows.push({ entry, raw: source.length, min: code.length, gzip: gzipSync(code, { level: 9 }).length });
}
const width = Math.max(...rows.map((r) => r.entry.length));
console.log(`${'Entry point'.padEnd(width)}  ${'fesm'.padStart(9)}  ${'min'.padStart(9)}  ${'min+gz'.padStart(9)}`);
for (const r of rows) {
  console.log(`${r.entry.padEnd(width)}  ${kb(r.raw).padStart(9)}  ${kb(r.min).padStart(9)}  ${kb(r.gzip).padStart(9)}`);
}
if (process.argv.includes('--markdown')) {
  console.log('\n| Entry point | min | min + gzip |\n| --- | ---: | ---: |');
  for (const r of rows) console.log(`| \`${r.entry}\` | ${kb(r.min)} | ${kb(r.gzip)} |`);
}
