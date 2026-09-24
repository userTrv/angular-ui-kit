// Generates the data the docs site and the API check are built from:
//
//   projects/docs/src/app/generated/api.json          public API of every entry point (TS type checker)
//   projects/docs/src/app/generated/registry.ts       component page registry (lazy-loaded pages)
//   projects/docs/src/app/generated/examples/<slug>.ts  example sources, highlighted at build time (Shiki)
//   projects/docs/src/app/generated/snippets.ts       highlighted snippets from projects/docs/snippets
//   projects/ui/public-api.golden.md                  human-readable API report, committed
//
// `--check` regenerates in memory and fails if public-api.golden.md changed: a public API change
// must be a deliberate, reviewed diff of that file.
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createHighlighter } from 'shiki';

const root = fileURLToPath(new URL('..', import.meta.url));
const uiRoot = join(root, 'projects/ui');
const docsApp = join(root, 'projects/docs/src/app');
const generated = join(docsApp, 'generated');
const goldenPath = join(uiRoot, 'public-api.golden.md');
const check = process.argv.includes('--check');

// ---------------------------------------------------------------------------------------------
// 1. Public API via the TypeScript type checker
// ---------------------------------------------------------------------------------------------
function entryPoints() {
  const entries = [{ name: '@usertrv/ui', file: join(uiRoot, 'src/public-api.ts') }];
  for (const dir of readdirSync(uiRoot).sort()) {
    if (existsSync(join(uiRoot, dir, 'ng-package.json')) && dir !== '.') {
      entries.push({ name: `@usertrv/ui/${dir}`, file: join(uiRoot, dir, 'index.ts') });
    }
  }
  return entries;
}

const tsconfig = ts.getParsedCommandLineOfConfigFile(join(uiRoot, 'tsconfig.lib.json'), {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => {
    throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  },
});
const entries = entryPoints();
const program = ts.createProgram(entries.map((e) => e.file), { ...tsconfig.options, noEmit: true });
const checker = program.getTypeChecker();

const doc = (symbol) => ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
const isInternal = (symbol) => symbol.getJsDocTags().some((t) => t.name === 'internal');

/** InputSignal<Foo | null> -> 'Foo | null' (first generic argument, bracket-aware). */
function firstTypeArg(text) {
  const start = text.indexOf('<');
  if (start < 0) return text;
  let depth = 0;
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i];
    if (c === '<' || c === '(' || c === '{' || c === '[') depth++;
    else if (c === '>' || c === ')' || c === '}' || c === ']') {
      if (depth === 0) return text.slice(start + 1, i).trim();
      depth--;
    } else if (c === ',' && depth === 0) return text.slice(start + 1, i).trim();
  }
  return text;
}

function decoratorInfo(node) {
  for (const dec of ts.getDecorators(node) ?? []) {
    const call = dec.expression;
    if (!ts.isCallExpression(call)) continue;
    const kind = call.expression.getText();
    const meta = {};
    const arg = call.arguments[0];
    if (arg && ts.isObjectLiteralExpression(arg)) {
      for (const prop of arg.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = prop.name.getText();
        const init = prop.initializer;
        if (ts.isStringLiteralLike(init)) meta[key] = init.text.replace(/\s+/g, ' ').trim();
      }
    }
    if (['Component', 'Directive', 'Injectable', 'Pipe'].includes(kind)) return { kind, ...meta };
  }
  return null;
}

function describeClass(symbol, node) {
  const info = decoratorInfo(node) ?? { kind: 'Class' };
  const result = {
    name: symbol.name,
    kind: info.kind,
    selector: info.selector,
    exportAs: info.exportAs,
    description: doc(symbol),
    inputs: [],
    outputs: [],
    methods: [],
    properties: [],
  };
  for (const member of node.members) {
    const mods = ts.getCombinedModifierFlags(member);
    if (mods & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) continue;
    if (!member.name || ts.isPrivateIdentifier(member.name)) continue;
    const memberSymbol = checker.getSymbolAtLocation(member.name);
    if (!memberSymbol || isInternal(memberSymbol)) continue;
    const name = member.name.getText();
    const description = doc(memberSymbol);

    if (ts.isPropertyDeclaration(member) && member.initializer && ts.isCallExpression(member.initializer)) {
      const callee = member.initializer.expression.getText();
      const typeText = checker.typeToString(checker.getTypeAtLocation(member), node, ts.TypeFormatFlags.NoTruncation);
      const args = member.initializer.arguments;
      const options = args.find((a) => ts.isObjectLiteralExpression(a));
      const alias = options?.properties
        .find((p) => ts.isPropertyAssignment(p) && p.name.getText() === 'alias')
        ?.initializer.getText()
        .replace(/['"]/g, '');
      const required = callee.endsWith('.required');
      if (/^(input|model)(\.required)?$/.test(callee)) {
        const first = args[0];
        result.inputs.push({
          name: alias ?? name,
          type: firstTypeArg(typeText),
          default: required || !first || first === options ? undefined : first.getText(),
          required,
          twoWay: callee.startsWith('model'),
          description,
        });
        continue;
      }
      if (callee === 'output' || callee === 'outputFromObservable') {
        result.outputs.push({ name: alias ?? name, type: firstTypeArg(typeText), description });
        continue;
      }
    }
    if (ts.isMethodDeclaration(member) && description) {
      const sig = checker.getSignatureFromDeclaration(member);
      result.methods.push({ name, signature: `${name}${checker.signatureToString(sig, node)}`, description });
      continue;
    }
    if ((ts.isPropertyDeclaration(member) || ts.isGetAccessorDeclaration(member)) && description) {
      const typeText = checker.typeToString(checker.getTypeAtLocation(member), node, ts.TypeFormatFlags.NoTruncation);
      result.properties.push({ name, type: typeText, description });
    }
  }
  return result;
}

function describeSymbol(symbol) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const decl = target.declarations?.[0];
  if (!decl) return { name: symbol.name, kind: 'unknown', description: '' };
  if (ts.isClassDeclaration(decl)) return describeClass(target, decl);
  const base = { name: symbol.name, description: doc(target) };
  if (ts.isInterfaceDeclaration(decl)) return { ...base, kind: 'Interface', signature: printNode(decl) };
  if (ts.isTypeAliasDeclaration(decl)) return { ...base, kind: 'Type', signature: printNode(decl) };
  if (ts.isFunctionDeclaration(decl)) {
    const sig = checker.getSignatureFromDeclaration(decl);
    return { ...base, kind: 'Function', signature: `function ${symbol.name}${checker.signatureToString(sig)}` };
  }
  if (ts.isVariableDeclaration(decl)) {
    const type = checker.typeToString(checker.getTypeAtLocation(decl), decl, ts.TypeFormatFlags.NoTruncation);
    return { ...base, kind: 'Const', signature: `const ${symbol.name}: ${type}` };
  }
  return { ...base, kind: ts.SyntaxKind[decl.kind] };
}

const printer = ts.createPrinter({ removeComments: true });
function printNode(node) {
  return printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()).replace(/^export /, '');
}

const api = {};
for (const entry of entries) {
  const source = program.getSourceFile(entry.file);
  if (!source) throw new Error(`Missing entry file ${entry.file}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
  api[entry.name] = exports.map(describeSymbol).sort((a, b) => a.name.localeCompare(b.name));
}

function golden() {
  const lines = [
    '# @usertrv/ui public API report',
    '',
    '<!-- Generated by scripts/gen-docs.mjs. `pnpm lint` fails when this file is stale: update it with',
    '     `pnpm gen` and review the diff — every change here is a change to the published contract. -->',
    '',
  ];
  for (const [entry, items] of Object.entries(api)) {
    lines.push(`## ${entry}`, '');
    for (const item of items) {
      const head = [item.kind, item.name, item.selector && `selector: \`${item.selector}\``, item.exportAs && `exportAs: ${item.exportAs}`]
        .filter(Boolean)
        .join(' · ');
      lines.push(`- ${head}`);
      if (item.signature) lines.push(`  - \`${item.signature.replace(/\s+/g, ' ')}\``);
      for (const i of item.inputs ?? []) {
        lines.push(`  - ${i.twoWay ? 'model' : 'input'} \`${i.name}${i.required ? '' : '?'}: ${i.type}\`${i.default ? ` = \`${i.default}\`` : ''}`);
      }
      for (const o of item.outputs ?? []) lines.push(`  - output \`${o.name}: ${o.type}\``);
      for (const m of item.methods ?? []) lines.push(`  - method \`${m.signature}\``);
      for (const p of item.properties ?? []) lines.push(`  - property \`${p.name}: ${p.type}\``);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const report = golden();
if (check) {
  const current = existsSync(goldenPath) ? readFileSync(goldenPath, 'utf8') : '';
  if (current !== report) {
    console.error('public-api.golden.md is out of date: the public API changed. Run `pnpm gen` and review the diff.');
    process.exit(1);
  }
  console.log('Public API matches public-api.golden.md.');
  process.exit(0);
}
writeFileSync(goldenPath, report);

// ---------------------------------------------------------------------------------------------
// 2. Docs registry + highlighted example sources
// ---------------------------------------------------------------------------------------------
const highlighter = await createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: ['angular-ts', 'typescript', 'html', 'css', 'scss', 'shellscript', 'json'],
});
const highlight = (code, lang) =>
  highlighter.codeToHtml(code, { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false });

// Files are only rewritten when their content changes (and stale ones removed at the end) instead of
// wiping the folder, so a running `ng serve` / parallel build never sees a half-empty directory.
mkdirSync(join(generated, 'examples'), { recursive: true });
const written = new Set();
function emit(path, content) {
  written.add(path);
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return;
  writeFileSync(path, content);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const componentsDir = join(docsApp, 'pages/components');
const docFiles = existsSync(componentsDir) ? walk(componentsDir).filter((f) => f.endsWith('.doc.ts')) : [];
const registry = [];
for (const file of docFiles.sort()) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const meta = {};
  source.forEachChild(function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteralLike(node.initializer)) {
      const key = node.name.getText();
      if (['slug', 'name', 'category', 'summary'].includes(key) && !(key in meta)) meta[key] = node.initializer.text;
    }
    node.forEachChild(visit);
  });
  for (const key of ['slug', 'name', 'category', 'summary']) {
    if (!meta[key]) throw new Error(`${relative(root, file)}: missing string literal "${key}"`);
  }
  const dir = dirname(file);
  const sources = {};
  for (const exampleFile of walk(dir).filter((f) => f.endsWith('.example.ts')).sort()) {
    const code = readFileSync(exampleFile, 'utf8').trimEnd();
    sources[basename(exampleFile)] = { code, html: highlight(code, 'angular-ts') };
  }
  emit(
    join(generated, 'examples', `${meta.slug}.ts`),
    `// Generated by scripts/gen-docs.mjs\nexport const SOURCES: Record<string, { code: string; html: string }> = ${JSON.stringify(sources)};\n`,
  );
  const importPath = relative(generated, file).replace(/\\/g, '/').replace(/\.ts$/, '');
  registry.push({ ...meta, importPath });
}

const categories = ['Actions', 'Forms', 'Overlays', 'Navigation', 'Data display', 'Feedback'];
registry.sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category) || a.name.localeCompare(b.name));
emit(
  join(generated, 'registry.ts'),
  `// Generated by scripts/gen-docs.mjs from pages/components/**/*.doc.ts
import type { DocEntry } from '../core/doc-model';

export const COMPONENT_DOCS: DocEntry[] = [
${registry
  .map(
    (r) => `  {
    slug: ${JSON.stringify(r.slug)},
    name: ${JSON.stringify(r.name)},
    category: ${JSON.stringify(r.category)},
    summary: ${JSON.stringify(r.summary)},
    loadDoc: () => import('./${r.importPath}').then((m) => m.doc),
    loadSources: () => import('./examples/${r.slug}').then((m) => m.SOURCES),
  },`,
  )
  .join('\n')}
];
`,
);

emit(join(generated, 'api.json'), JSON.stringify(api, null, 1));

// Snippets used on guide pages and per-entry-point import lines.
const snippetDir = join(root, 'projects/docs/snippets');
const langOf = { ts: 'typescript', html: 'html', css: 'css', scss: 'scss', sh: 'shellscript', json: 'json' };
const snippets = {};
if (existsSync(snippetDir)) {
  for (const file of readdirSync(snippetDir).sort()) {
    const code = readFileSync(join(snippetDir, file), 'utf8').trimEnd();
    const lang = langOf[file.split('.').pop()] ?? 'typescript';
    snippets[file] = { code, html: highlight(code, lang) };
  }
}
for (const [entry, items] of Object.entries(api)) {
  const names = items.filter((i) => ['Component', 'Directive', 'Injectable', 'Function'].includes(i.kind)).map((i) => i.name);
  if (!names.length) continue;
  const code = `import { ${names.join(', ')} } from '${entry}';`;
  snippets[`import:${entry}`] = { code, html: highlight(code, 'typescript') };
}
emit(
  join(generated, 'snippets.ts'),
  `// Generated by scripts/gen-docs.mjs\nexport const SNIPPETS: Record<string, { code: string; html: string }> = ${JSON.stringify(snippets)};\n`,
);

for (const file of walk(generated)) if (!written.has(file)) rmSync(file);

console.log(
  `Docs data: ${Object.keys(api).length} entry points, ${registry.length} component pages, ${Object.keys(snippets).length} snippets.`,
);
