// 검증된 공개 투영만 가져오고 원문과 공개 출처의 해시를 함께 보존한다.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const TOPICS = [
  ['python', 'languages', 'python', ['파이썬']], ['javascript', 'languages', 'javascript', ['JS']],
  ['nodejs', 'languages', 'nodejs', ['Node.js']], ['programming-languages-runtime', 'languages', 'terminal', ['프로그래밍', '런타임']],
  ['os', 'cs', 'operating-system', ['운영체제', 'OS']], ['network', 'cs', 'network', ['네트워크']],
  ['algorithm', 'cs', 'algorithm', ['알고리즘']], ['data-structure', 'cs', 'data-structures', ['자료구조']],
  ['software-design', 'cs', 'architecture', ['설계', '시스템 설계']], ['ml', 'cs', 'model', ['머신러닝', 'ML']],
  ['llm', 'cs', 'model', ['LLM', '언어 모델']], ['computer-science', 'cs', 'processor', ['CS', '컴퓨터 과학']],
  ['spring-boot', 'frameworks', 'spring', ['Spring']], ['frontend', 'frameworks', 'components', ['프론트엔드']],
  ['backend-services', 'frameworks', 'api', ['백엔드']], ['database', 'infrastructure', 'database', ['DB', '데이터베이스']],
  ['redis', 'infrastructure', 'redis', ['캐시']], ['kubernetes', 'infrastructure', 'kubernetes', ['K8s']],
  ['linux', 'infrastructure', 'linux', ['리눅스']], ['security', 'infrastructure', 'security', ['보안']],
  ['platform-delivery-operations', 'infrastructure', 'deploy', ['DevOps', '인프라']],
  ['data', 'infrastructure', 'database', ['데이터']], ['projects', 'cs', 'project', ['프로젝트']],
];

export function importPublication(sourceRoot) {
  const input = join(sourceRoot, 'generated/public-content');
  const output = join(ROOT, 'publication');
  const documents = readdirSync(input).filter(name => name.endsWith('.md') && name !== 'README.md').map(name => {
    const source = readFileSync(join(input, name), 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error(`missing projection metadata: ${name}`);
    const metadata = parse(match[1], { maxAliasCount: 0 });
    if (metadata.publication_state !== 'publish' || !/^[a-f0-9]{64}$/.test(metadata.projection_sha256)) throw new Error(`unapproved projection: ${name}`);
    if (/(?:file:\/\/|\/Users\/|source_session_ids?\s*:)/.test(source)) throw new Error(`private data in projection: ${name}`);
    return { ...metadata, name, source, body: match[2], slug: metadata.permalink.split('/').filter(Boolean).at(-1) };
  });
  const byId = new Map(documents.map(page => [page.projection_id, page]));
  const available = new Map(documents.map(page => [page.slug, page]));
  const topics = Object.fromEntries(TOPICS.filter(([slug]) => available.has(slug)).map(([slug, field, icon, aliases]) => [slug, { label: available.get(slug).title, field, icon, aliases, article: slug }]));
  const manifest = { source: 'https://docs.woonyong.com', documents: [] };
  mkdirSync(output, { recursive: true });
  for (const page of documents) {
    if (page.content_status === 'planned') continue;
    const topic = findTopic(page, byId, topics);
    const body = page.body.replace(/^\s*# [^\n]+\n/, '').replace(/^\{: [^\n]+\}\s*$/gm, '').trim();
    const paragraph = body.split(/\n\s*\n/).find(part => !/^(?:#|\||`|>|-|\{)/.test(part.trim())) ?? page.title;
    const metadata = { id: createHash('sha256').update(page.projection_id).digest('hex').slice(0, 20), slug: page.slug,
      type: 'wiki', title: page.title, description: plainText(paragraph).slice(0, 180), tags: [topic],
      field: topics[topic].field, topic, contentIcon: { name: topics[topic].icon }, visibility: 'public', comments: false,
      sourceUrl: `https://docs.woonyong.com${page.permalink}`, sourceHash: createHash('sha256').update(page.source).digest('hex'),
      parent: byId.get(page.public_parent_id)?.slug ?? null };
    writeFileSync(join(output, page.name), `---\n${JSON.stringify(metadata, null, 2)}\n---\n\n${body}\n`);
    manifest.documents.push({ id: metadata.id, slug: page.slug, sourceUrl: metadata.sourceUrl, sourceHash: metadata.sourceHash });
  }
  writeFileSync(join(ROOT, 'topics.json'), JSON.stringify(topics, null, 2) + '\n');
  writeFileSync(join(ROOT, 'publication-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest.documents.length;
}

function findTopic(page, byId, topics) {
  const visited = new Set();
  let cursor = page;
  while (cursor && !visited.has(cursor.projection_id)) {
    if (topics[cursor.slug]) return cursor.slug;
    visited.add(cursor.projection_id);
    cursor = byId.get(cursor.public_parent_id);
  }
  const prefix = Object.keys(topics).find(key => page.slug.startsWith(`${key}-`));
  return prefix ?? 'computer-science';
}

function plainText(value) {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`#]/g, '').replace(/\s+/g, ' ').trim();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('usage: import-publication.mjs <approved-public-site-root>');
  console.log(`Imported ${importPublication(resolve(process.argv[2]))} approved public documents`);
}
