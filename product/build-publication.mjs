// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { readDocument, publicDocuments, searchEntry, FIELDS, blogDocuments, PAGE_SIZES } from './content-model.mjs';
import { createMarkdown, escape } from './markdown.mjs';
import { renderArticle } from './article-renderer.mjs';
import { documentShell, personalHome, wikiLanding, articlePage, projectSection, searchBox, resultRow, iconUrl } from './publication-layout.mjs';
import { recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';
import { commentsSection } from './comments.mjs';
import { iconAuditPages } from './icon-audit.mjs';
import { publicationAssets } from './publication-assets.mjs';
import { publicInterviews } from './interviews.mjs';
import { createTopicTrees } from './topic-navigation.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../dist/site/', import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'publication.config.json')));
const TOPICS = JSON.parse(readFileSync(join(ROOT, 'topics.json')));
const THEME = join(ROOT, 'vendor/theme');
const MANIFEST = JSON.parse(readFileSync(join(THEME, 'theme.json')));
const digest = value => createHash('sha256').update(value).digest('hex');
const CLIENT_FILES = ['publication.js', 'document.js', 'search-model.mjs', 'search-view.mjs', 'search-client.mjs', 'search-worker.mjs', 'search-index-loader.mjs', 'comments.js', 'flows.js', 'video.js'];

export function buildPublication({ origin = '', preview = true } = {}) {
  if (origin && !/^https?:\/\/[^/?#]+$/.test(origin)) throw new Error('invalid site origin');
  if (!preview && !origin.startsWith('https://')) throw new Error('production build requires SITE_ORIGIN');
  verifyTheme();
  const folders = ['publication', ...(preview && existsSync(join(ROOT, 'examples')) ? ['examples'] : [])];
  const documents = publicDocuments(folders.flatMap(folder => readdirSync(join(ROOT, folder)).filter(name => name.endsWith('.md')).map(name => readDocument(readFileSync(join(ROOT, folder, name), 'utf8'), TOPICS))), { includeExamples: preview });
  const posts = blogDocuments(documents);
  const topicTrees = createTopicTrees(documents);
  renderDocuments(documents);
  const context = { config: CONFIG, topics: TOPICS, topicTrees, origin, preview, themeHash: MANIFEST.contentHash, scriptHash: digest(CLIENT_FILES.map(file => readFileSync(join(ROOT, file), 'utf8')).join('\n')) };
  context.interviews = publicInterviews(CONFIG.interviews?.length ? CONFIG.interviews : preview ? JSON.parse(readFileSync(join(ROOT, 'interview-examples.json'))) : [], preview);
  const output = new Map();
  const add = (route, title, body, metadata = {}) => output.set(route, documentShell({ route, title, ...metadata }, body, context));
  add('/', CONFIG.name, personalHome(context));
  add('/wiki/', 'Wiki', wikiLanding(documents, context, undefined, recentBlog(posts, TOPICS)));
  for (const field of FIELDS) add(`/wiki/${field}/`, field, wikiLanding(documents, context, field));
  add('/projects/', 'Projects', `<main class="app-shell" id="main"><h1 class="app-page-heading">Projects</h1>${projectSection(CONFIG.projects)}</main>`);
  if (preview) for (const page of iconAuditPages()) add(page.route, '아이콘 검증', page.body);
  const commentTheme = CONFIG.comments.themeUrl || `${origin || 'http://127.0.0.1:8796'}/theme/assets/giscus.css?v=${MANIFEST.contentHash}`;
  for (const page of documents) add(page.route, page.title, articlePage(page, documents, context, commentsSection(page, CONFIG.comments, commentTheme)), page);
  for (const [tag, topic] of Object.entries(TOPICS)) {
    const entries = documents.filter(page => page.tags.includes(tag));
    add(`/tags/${tag}/`, topic.label, `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-page-heading">${escape(topic.label)}</h1><div data-search-page data-tag="${tag}"><nav class="app-type-filters" aria-label="문서 유형"></nav><div data-full-results>${entries.map(page => resultRow(page, TOPICS)).join('')}</div></div></main>`);
  }
  add('/search/', '검색', `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-sr">검색</h1><div data-search-page><nav class="app-type-filters" aria-label="문서 유형"></nav><div class="app-filter-summary" data-filter-summary></div><div data-full-results><p class="app-empty">검색어를 입력하거나 위키에서 주제를 선택해 주세요.</p></div><nav class="app-page-links" data-result-pages aria-label="검색 페이지"></nav></div></main>`);
  for (const [base, size, render] of [['/blog/', PAGE_SIZES.feed, blogFeed], ['/blog/all/', PAGE_SIZES.cards, blogArchive]]) {
    for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / size)); page++) add(page === 1 ? base : `${base}page/${page}/`, 'Blog', render(posts, TOPICS, page), { type: 'blog' });
  }
  writeSite(output, documents, context);
  return { pages: output.size, documents: documents.length, themeHash: MANIFEST.contentHash };
}

function renderDocuments(documents) {
  const md = createMarkdown();
  for (const page of documents) {
    Object.assign(page, renderArticle(md, page));
  }
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  for (const page of documents) {
    const rewrite = html => html.replace(/href="\/wiki\/([^/]+)\/(?:#([^"?]+))?"/g, (original, slug, fragment) => {
      const target = bySlug.get(slug);
      if (!target) return `href="https://docs.woonyong.com/wiki/${slug}/${fragment ? '#' + fragment : ''}"`;
      if (!fragment) return `href="${target.route}"`;
      const id = `${target.id}-${decodeURIComponent(fragment)}`;
      return (target.leadHtml + target.html).includes(`id="${id}"`) ? `href="${target.route}#${id}"` : `href="https://docs.woonyong.com/wiki/${slug}/#${fragment}"`;
    }).replace(/href="#([^" ]+)"/g, (original, fragment) => {
      if ((page.leadHtml + page.html).includes(`id="${fragment}"`)) return original;
      const prefixed = `${page.id}-${decodeURIComponent(fragment)}`;
      return (page.leadHtml + page.html).includes(`id="${prefixed}"`) ? `href="#${prefixed}"` : original;
    }).replaceAll('/things/assets/', '/assets/');
    page.leadHtml = rewrite(page.leadHtml);
    page.html = rewrite(page.html);
  }
}

function verifyTheme() {
  for (const [name, hash] of Object.entries(MANIFEST.files)) {
    if (name.includes('..') || name.startsWith('/')) throw new Error('invalid theme path');
    if (digest(readFileSync(join(THEME, name))) !== hash) throw new Error(`modified theme: ${name}`);
  }
  const css = readFileSync(join(THEME, 'styles.css'), 'utf8');
  const tokens = readFileSync(join(THEME, 'theme.css'), 'utf8');
  const definitions = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  for (const [, name] of css.matchAll(/var\((--(?:site|icon)-[\w-]+)/g)) if (!definitions.has(name)) throw new Error(`undefined theme token: ${name}`);
}

function writeSite(output, documents, context) {
  rmSync(OUTPUT, { recursive: true, force: true });
  mkdirSync(OUTPUT, { recursive: true });
  for (const file of CLIENT_FILES) {
    let source = readFileSync(join(ROOT, file), 'utf8');
    for (const dependency of CLIENT_FILES) source = source.replaceAll(`'./${dependency}'`, `'./${dependency}?v=${context.scriptHash}'`);
    writeFileSync(join(OUTPUT, file), source);
  }
  const index = { entries: documents.map(page => ({ ...searchEntry(page, TOPICS), iconUrl: iconUrl(page.contentIcon), example: !!page.example })), tags: TOPICS };
  const assets = publicationAssets(output, index.entries, path => readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(ROOT, path)));
  for (const [path, content] of assets) {
    const destination = join(OUTPUT, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  for (const [route, html] of output) {
    const destination = join(OUTPUT, route, 'index.html');
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, html);
  }
  const indexJson = JSON.stringify(index);
  writeFileSync(join(OUTPUT, 'search-index.json'), indexJson);
  writeFileSync(join(OUTPUT, 'search-index.json.gz'), gzipSync(indexJson, { level: 9 }));
  mkdirSync(join(OUTPUT, 'blog'), { recursive: true });
  const posts = blogDocuments(documents).filter(page => !page.example);
  writeFileSync(join(OUTPUT, 'blog/feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(CONFIG.name)}</title><link>${escape(context.origin + '/blog/')}</link><description>${escape(CONFIG.description)}</description>${posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(context.origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('')}</channel></rss>`);
  writeFileSync(join(OUTPUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => route !== '/search/').map(route => `<url><loc>${escape(context.origin + route)}</loc></url>`).join('')}</urlset>`);
  validateOutput(output);
  writeFileSync(join(OUTPUT, 'build-report.json'), JSON.stringify({ pages: output.size, documents: documents.length, examples: documents.filter(page => page.example).length, preview: context.preview, themeHash: context.themeHash, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  writeFileSync(join(OUTPUT, 'robots.txt'), context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
}

function validateOutput(output) {
  for (const [route, html] of output) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) throw new Error(`duplicate HTML id: ${route}`);
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!url.startsWith('/') && !url.startsWith('#')) continue;
      const [path, fragment] = url.split('#');
      const target = path.split('?')[0] || route;
      if (!output.has(target) && !existsSync(join(OUTPUT, target))) throw new Error(`broken link: ${route} -> ${url}`);
      if (fragment && output.has(target) && !output.get(target).includes(`id="${decodeURIComponent(fragment)}"`)) throw new Error(`broken anchor: ${route} -> ${url}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(buildPublication({ origin: process.env.SITE_ORIGIN ?? '', preview: !process.argv.includes('--production') }));
