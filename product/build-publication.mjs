// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readDocument, publicDocuments, searchEntry, FIELDS, blogDocuments, PAGE_SIZES } from './content-model.mjs';
import { createMarkdown, escape } from './markdown.mjs';
import { documentShell, personalHome, wikiLanding, articlePage, projectSection, searchBox, resultRow, iconUrl } from './publication-layout.mjs';
import { recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../dist/site/', import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'publication.config.json')));
const TOPICS = JSON.parse(readFileSync(join(ROOT, 'topics.json')));
const THEME = join(ROOT, 'vendor/theme');
const MANIFEST = JSON.parse(readFileSync(join(THEME, 'theme.json')));
const digest = value => createHash('sha256').update(value).digest('hex');

export function buildPublication({ origin = '', preview = true } = {}) {
  if (origin && !/^https?:\/\/[^/?#]+$/.test(origin)) throw new Error('invalid site origin');
  if (!preview && !origin.startsWith('https://')) throw new Error('production build requires SITE_ORIGIN');
  verifyTheme();
  const folders = ['publication', ...(preview && existsSync(join(ROOT, 'examples')) ? ['examples'] : [])];
  const documents = publicDocuments(folders.flatMap(folder => readdirSync(join(ROOT, folder)).filter(name => name.endsWith('.md')).map(name => readDocument(readFileSync(join(ROOT, folder, name), 'utf8'), TOPICS))));
  const posts = blogDocuments(documents);
  renderDocuments(documents);
  const context = { config: CONFIG, topics: TOPICS, origin, preview, themeHash: MANIFEST.contentHash, scriptHash: digest(readFileSync(join(ROOT, 'publication.js'))) };
  const output = new Map();
  const add = (route, title, body, metadata = {}) => output.set(route, documentShell({ route, title, ...metadata }, body, context));
  add('/', CONFIG.name, personalHome(documents, context, recentBlog(posts, TOPICS)));
  add('/wiki/', 'Wiki', wikiLanding(documents, context, undefined, recentBlog(posts, TOPICS)));
  for (const field of FIELDS) add(`/wiki/${field}/`, field, wikiLanding(documents, context, field));
  add('/projects/', 'Projects', `<main class="app-shell" id="main"><h1 class="app-page-heading">Projects</h1>${projectSection(CONFIG.projects)}</main>`);
  for (const page of documents) add(page.route, page.title, articlePage(page, documents, context, page.comments ? '<section class="app-comments" id="comments"><h2>댓글</h2><p class="app-comments-status">댓글을 불러옵니다.</p></section>' : ''), page);
  for (const [tag, topic] of Object.entries(TOPICS)) {
    const entries = documents.filter(page => page.tags.includes(tag));
    add(`/tags/${tag}/`, topic.label, `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-page-heading">${escape(topic.label)}</h1><div data-search-page data-tag="${tag}"><nav class="app-type-filters" aria-label="문서 유형"></nav><div data-full-results>${entries.map(page => resultRow(page, TOPICS)).join('')}</div></div></main>`);
  }
  add('/search/', '검색', `<main class="app-shell app-body" id="main">${searchBox({ large: true })}<h1 class="app-page-heading">검색</h1><div data-search-page><nav class="app-type-filters" aria-label="문서 유형"></nav><div class="app-filter-summary" data-filter-summary></div><div data-full-results><p class="app-empty">검색어를 입력하거나 위키에서 주제를 선택해 주세요.</p></div><nav class="app-page-links" data-result-pages aria-label="검색 페이지"></nav></div></main>`);
  for (const [base, size, render] of [['/blog/', PAGE_SIZES.feed, blogFeed], ['/blog/all/', PAGE_SIZES.cards, blogArchive]]) {
    for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / size)); page++) add(page === 1 ? base : `${base}page/${page}/`, 'Blog', render(posts, TOPICS, page), { type: 'blog' });
  }
  writeSite(output, documents, context);
  return { pages: output.size, documents: documents.length, themeHash: MANIFEST.contentHash };
}

function renderDocuments(documents) {
  const md = createMarkdown();
  for (const page of documents) {
    const env = { pageId: page.id, docId: page.id };
    page.html = md.render(page.body, env);
    page.headings = env.headings ?? [];
  }
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  for (const page of documents) {
    page.html = page.html.replace(/href="\/wiki\/([^/]+)\/(?:#([^"?]+))?"/g, (original, slug, fragment) => {
      const target = bySlug.get(slug);
      if (!target) return `href="https://docs.woonyong.com/wiki/${slug}/${fragment ? '#' + fragment : ''}"`;
      if (!fragment) return `href="${target.route}"`;
      const id = `${target.id}-${decodeURIComponent(fragment)}`;
      return target.html.includes(`id="${id}"`) ? `href="${target.route}#${id}"` : `href="https://docs.woonyong.com/wiki/${slug}/#${fragment}"`;
    }).replace(/href="#([^" ]+)"/g, (original, fragment) => {
      if (page.html.includes(`id="${fragment}"`)) return original;
      const prefixed = `${page.id}-${decodeURIComponent(fragment)}`;
      return page.html.includes(`id="${prefixed}"`) ? `href="#${prefixed}"` : original;
    }).replaceAll('/things/assets/', '/assets/');
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
  cpSync(THEME, join(OUTPUT, 'theme'), { recursive: true });
  cpSync(join(ROOT, 'publication.js'), join(OUTPUT, 'publication.js'));
  for (const file of ['search-model.mjs', 'search-view.mjs']) cpSync(join(ROOT, file), join(OUTPUT, file));
  cpSync(join(ROOT, 'site.js'), join(OUTPUT, 'document.js'));
  const assets = new Set();
  const css = readFileSync(join(THEME, 'styles.css'), 'utf8');
  for (const [, name] of css.matchAll(/\.\.\/assets\/([\w.-]+)/g)) assets.add(name);
  for (const html of output.values()) for (const [, name] of html.matchAll(/(?:src|poster)="\/assets\/([\w.-]+)/g)) assets.add(name);
  for (const name of assets) {
    if (!existsSync(join(ROOT, 'assets', name))) throw new Error(`missing asset: ${name}`);
    mkdirSync(join(OUTPUT, 'assets'), { recursive: true });
    cpSync(join(ROOT, 'assets', name), join(OUTPUT, 'assets', name));
  }
  for (const [route, html] of output) {
    const destination = join(OUTPUT, route, 'index.html');
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, html);
  }
  writeFileSync(join(OUTPUT, 'search-index.json'), JSON.stringify({ entries: documents.map(page => ({ ...searchEntry(page, TOPICS), iconUrl: iconUrl(page.contentIcon), example: !!page.example })), tags: TOPICS }));
  mkdirSync(join(OUTPUT, 'blog'), { recursive: true });
  const posts = blogDocuments(documents).filter(page => !page.example);
  writeFileSync(join(OUTPUT, 'blog/feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(CONFIG.name)}</title><link>${escape(context.origin + '/blog/')}</link><description>${escape(CONFIG.description)}</description>${posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(context.origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('')}</channel></rss>`);
  writeFileSync(join(OUTPUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => route !== '/search/').map(route => `<url><loc>${escape(context.origin + route)}</loc></url>`).join('')}</urlset>`);
  validateOutput(output);
  writeFileSync(join(OUTPUT, 'build-report.json'), JSON.stringify({ pages: output.size, documents: documents.length, examples: documents.filter(page => page.example).length, preview: context.preview, themeHash: context.themeHash, routes: [...output.keys()] }, null, 2));
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
