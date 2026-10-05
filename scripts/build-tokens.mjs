// 토큰 정본에서 브라우저용 참조와 스타일을 생성한다.
import { readFile, writeFile, readdir } from 'node:fs/promises';

import { verifyTheme } from './theme-snapshot.mjs';

const theme = verifyTheme();
for (const name of Object.keys(theme.files).filter((name) => name.startsWith('assets/'))) {
  const installed = await readFile(new URL(`../${name}`, import.meta.url));
  const importedAsset = await readFile(new URL(`../vendor/design-theme/${name}`, import.meta.url));
  if (!installed.equals(importedAsset)) throw new Error(`theme asset differs: ${name}`);
}
const imported = await readFile(new URL('../vendor/design-theme/tokens.json', import.meta.url), 'utf8');
if (await readFile(new URL('../tokens.json', import.meta.url), 'utf8') !== imported) throw new Error('tokens.json differs from imported base theme');
const original = JSON.parse(await readFile(new URL('../tokens.json', import.meta.url), 'utf8'));
const table = new Map();
function flatten(node, prefix = '') {
  for (const [name, child] of Object.entries(node)) {
    if (name.startsWith('$') || !child || typeof child !== 'object') continue;
    const path = prefix ? `${prefix}.${name}` : name;
    if ('$value' in child) {
      if (child.$type === 'typography') {
        for (const [part, value] of Object.entries(child.$value)) table.set(`${path}.${part}`, { $value: value });
      } else table.set(path, child);
    }
    else flatten(child, path);
  }
}
flatten(original);

function resolve(path, seen = new Set()) {
  if (seen.has(path)) throw new Error(`circular token: ${path}`);
  const token = table.get(path);
  if (!token) throw new Error(`unknown token: ${path}`);
  const match = String(token.$value).match(/^\{([\w.-]+)\}$/);
  return match ? resolve(match[1], new Set([...seen, path])) : typeof token.$value === 'string' ? token.$value.replace(/\{([\w.-]+)\}/g, (_, reference) => resolve(reference, new Set([...seen, path]))) : token.$value;
}
const outputs = new Map([
  ['theme.css', await readFile(new URL('../vendor/design-theme/theme.css', import.meta.url), 'utf8')],
  ['styles.css', await readFile(new URL('../vendor/design-theme/styles.css', import.meta.url), 'utf8')],
]);
const sourceStyles = await readFile(new URL('../styles.source.css', import.meta.url), 'utf8');
if (sourceStyles !== await readFile(new URL('../vendor/design-theme/styles.source.css', import.meta.url), 'utf8')) throw new Error('styles.source.css differs from imported base theme');
for (const [name, content] of outputs) {
  const path = new URL(`../${name}`, import.meta.url);
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8') !== content) throw new Error(`stale token output: ${name}`);
  } else await writeFile(path, content);
}

async function embedAssetTokens(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) { await embedAssetTokens(path); continue; }
    if (!entry.name.endsWith('.svg')) continue;
    const source = await readFile(path, 'utf8');
    const body = source.replace(/<style data-site-tokens(?:="")?>[\s\S]*?<\/style>/g, '');
    const references = [...new Set([...body.matchAll(/var\((--[\w-]+)\)/g)].map(match => match[1]))];
    const byName = new Map([...table.keys()].map(key => ['--' + key.replaceAll('.', '-'), key]));
    const declarations = references.map(name => {
      if (!byName.has(name)) throw new Error(`unknown asset token: ${name}`);
      return `${name}:${resolve(byName.get(name))}`;
    });
    const content = declarations.length ? body.replace(/<svg\b[^>]*>/, match => `${match}<style data-site-tokens="">:root{${declarations.join(';')}}</style>`) : body;
    if (process.argv.includes('--check')) {
      if (source !== content) throw new Error(`stale asset tokens: ${path.pathname}`);
    } else await writeFile(path, content);
  }
}
await embedAssetTokens(new URL('../assets/', import.meta.url));
