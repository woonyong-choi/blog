// 공개 시안에는 명시한 정적 자산만 복사한다. 저장소 전체를 제공하지 않는다.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const output = process.argv[2];
if (!output) throw new Error('usage: node scripts/build-preview.mjs <output-directory>');
const target = resolve(output);
const files = [
  'theme.css', 'styles.css', 'preview/preview.js',
  'assets/fonts/pretendard-variable.woff2', 'assets/fonts/pretendard-license.txt',
  'assets/fonts/jetbrains-mono-regular.woff2', 'assets/fonts/jetbrains-mono-license.txt',
  'assets/img/icons/python-icon.svg', 'assets/img/icons/kotlin-icon.svg',
  'assets/img/icons/react-icon.svg', 'assets/img/icons/spring-boot-icon.svg',
  'assets/img/icons/postgres-icon.svg', 'assets/ui/github.svg',
];
for (const file of files) {
  const destination = resolve(target, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(new URL(file, root), destination);
}
let html = readFileSync(new URL('preview/index.html', root), 'utf8');
for (const file of ['theme.css', 'styles.css', 'preview/preview.js']) {
  const hash = createHash('sha256').update(readFileSync(new URL(file, root))).digest('hex').slice(0, 12);
  html = html.replace(`/${file}"`, `/${file}?v=${hash}"`);
}
writeFileSync(resolve(target, 'index.html'), html);
writeFileSync(resolve(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`Preview exported: ${files.length + 2} files`);
