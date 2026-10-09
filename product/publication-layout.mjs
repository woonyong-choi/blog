// 개인 사이트의 탐색과 본문을 하나의 테마와 문서 식별자로 조합한다.
import { personalFooter } from './publication-footer.mjs';
import { controlImage } from './controls.mjs';
import { readFileSync } from 'node:fs';
import { escape } from './markdown.mjs';
import * as ui from './vendor/theme/assets/components.mjs';
import { contentIcon } from './content-icons.mjs';
import { FIELDS } from './content-model.mjs';
import { clientEntrypoints } from './publication-assets.mjs';
import { heroSection, projectsSection, technologySection, interviewsSection, contactSection } from './home-sections.mjs';
import { articleToc } from './article-toc.mjs';
import { postArticle, shiftHeadings, detailLevels } from './post-article.mjs';
import { publicationMetadata } from './publication-metadata.mjs';
import { usesMath, MATH_STYLESHEET } from './math-assets.mjs';

const BRANDS = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url))).icons;
const FIELD_NAMES = Object.freeze({ languages: 'Languages', cs: 'CS', frameworks: 'Frameworks', infrastructure: 'Infrastructure' });

export function iconUrl(spec, size = 'small') {
  const name = typeof spec === 'string' ? spec : spec.name;
  return `/theme/assets/icons/${BRANDS.some(item => item.file === `${name}.svg`) ? 'brands' : size === 'small' ? 'small' : 'detail'}/${name}.svg`;
}

export function subjectIcon(spec, size = 'card') {
  const name = typeof spec === 'string' ? spec : spec.name;
  const brand = BRANDS.find(item => item.file === `${name}.svg`);
  if (brand) return String(ui.ContentIconImage({ src: `/theme/assets/icons/brands/${brand.file}`, size }));
  return contentIcon(spec, size, 'detail');
}

export function documentShell(page, body, context) {
  const { config, themeHash, scriptHash, scriptHashes = {}, math } = context;
  const hashOf = file => scriptHashes[file] ?? scriptHash;
  const navigation = [['Notes', '/wiki/'], ['Blog', '/blog/']];
  const active = page.type === 'blog' ? '/blog/' : page.type === 'wiki' ? '/wiki/' : page.route;
  const footer = personalFooter(config);
  const entries = clientEntrypoints(body + footer);
  const searchScript = entries.includes('publication.js') ? `<script type="module" async src="/publication.js?v=${hashOf('publication.js')}"></script>` : '';
  const scripts = entries.filter(file => file !== 'publication.js').map(file => `<script type="module" src="/${file}?v=${hashOf(file)}"></script>`).join('');
  return `<!doctype html><html lang="ko" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light">${publicationMetadata(page, context)}<link rel="alternate" type="application/rss+xml" title="Blog" href="/blog/feed.xml"><link rel="stylesheet" href="/theme/theme.css?v=${themeHash}"><link rel="stylesheet" href="/theme/styles.css?v=${themeHash}">${usesMath(body) && math ? `<link rel="stylesheet" href="${MATH_STYLESHEET}?v=${math.hash}">` : ''}${scripts}</head><body class="app-publication${page.route === '/' ? ' app-canvas' : ''}"><a class="app-skip" href="#main">본문으로 이동</a><div class="app-shell"><header class="app-header"><a class="app-logo" href="/" aria-label="홈 · Things 임시 로고"><span class="app-sr">홈</span></a><nav class="app-nav" aria-label="주요 메뉴">${navigation.map(([name, route]) => `<span class="app-nav-item"><a href="${route}"${active.startsWith(route) ? ' aria-current="page"' : ''}>${name}</a></span>`).join('')}</nav></header></div>${body}${footer}${searchScript}</body></html>`;
}

export function searchBox({ large = false, query = '' } = {}) {
  return `<section class="app-search app-public-search${large ? ' is-prominent' : ''}" data-public-search aria-label="통합 검색"><form action="/search/" role="search"><label class="app-sr" for="site-query">글 검색</label><div class="app-search-field">${controlImage('search', 'app-search-icon', '')}<input class="app-search-input" id="site-query" name="q" type="text" value="${escape(query)}" placeholder="어떤 내용을 찾으세요?" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="search-suggestions"><button class="app-search-clear" type="button" data-clear-query aria-label="검색어 지우기" hidden>${controlImage('clear', '', '')}</button></div></form><div class="app-search-panel" id="search-suggestions" role="listbox" hidden></div><p class="app-sr" data-search-status role="status" aria-live="polite"></p>${large ? `<p class="app-search-frequent">추천 검색어: ${['Python', 'Kubernetes', '운영체제', 'LLM'].map(query => `<button type="button" data-query="${escape(query)}">${escape(query)}</button>`).join(' ')}</p>` : ''}<noscript><p class="app-caption">검색은 JavaScript가 필요합니다. <a href="/wiki/">주제별 목록</a>과 <a href="/blog/all/">전체 글</a>은 바로 읽을 수 있습니다.</p></noscript></section>`;
}

export function tagLinks(page, tags, limit = Infinity) {
  return String(ui.TagList({ tags: page.tags.map(id => ({ href: `/tags/${id}/`, label: tags[id].label })), limit }));
}

export function wikiCard(page, title = page.title, level = 3) {
  return String(ui.Card({ href: page.route, title, description: page.description, icon: ui.trusted(subjectIcon(page.contentIcon)), headingLevel: level }));
}

export function knowledgeFields(documents, topics, field) {
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  return FIELDS.filter(value => !field || value === field).map(value => {
    const entries = Object.entries(topics).filter(([, topic]) => topic.field === value).map(([id, topic]) => {
      const article = bySlug.get(topic.article) ?? documents.filter(page => page.topic === id && page.type === 'wiki').sort((a, b) => a.id.localeCompare(b.id))[0];
      return article ? { ...topic, page: { ...article, description: topic.description ?? article.description, contentIcon: { name: topic.icon } } } : null;
    }).filter(Boolean);
    if (!entries.length) return '';
    const shown = field ? entries : entries.slice(0, 6);
    const level = field ? 2 : 3;
    return `<section class="app-support-group"><h${level}>${FIELD_NAMES[value]}</h${level}>${ui.CardGroup({ columns: shown.length === 2 || shown.length === 4 ? 2 : 1, cards: shown.map(topic => ui.trusted(wikiCard(topic.page, topic.label, level + 1))) })}${!field && entries.length > 6 ? `<p><a href="/wiki/${value}/">전체 보기</a></p>` : ''}</section>`;
  }).join('');
}

// 설정 목록의 순서가 곧 홈의 섹션 순서다.
const HOME_SECTIONS = {
  hero: heroSection,
  projects: projectsSection,
  technologies: section => technologySection(section, BRANDS),
  interviews: (section, context) => interviewsSection(section, { examples: context.interviewExamples, preview: context.preview }),
  contact: contactSection,
};

export function personalHome(context) {
  const title = context.home.find(section => section.type === 'hero')?.title ?? context.config.name;
  return `<main id="main" class="app-landing"><h1 class="app-sr">${escape(title)}</h1>${context.home.map(section => HOME_SECTIONS[section.type](section, context)).join('')}</main>`;
}

export function wikiLanding(documents, context, field, recent = '') {
  const fields = knowledgeFields(documents, context.topics, field);
  if (field) return `<main id="main" class="app-shell">${searchBox({ large: true })}<h1 class="app-page-heading">${FIELD_NAMES[field]}</h1><a class="app-back-link" href="/wiki/">← Notes</a>${fields}</main>`;
  return `<main id="main" class="app-shell">${searchBox({ large: true })}<h1 class="app-sr">Notes</h1>${recent}<section aria-labelledby="wiki-heading"><h2 class="app-page-heading" id="wiki-heading">Wiki</h2>${fields}</section></main>`;
}

export function projectSection(projects, hasMore = false) {
  return `<section class="app-knowledge-section"><div class="app-section-heading"><h2>개발 프로젝트</h2>${hasMore ? '<a href="/projects/">전체 보기 →</a>' : ''}</div><div class="app-project-grid">${projects.map(project => `<article class="app-project-entry"><a class="app-knowledge-card" href="${escape(project.href)}">${subjectIcon(project.icon)}<h3>${escape(project.title)}</h3><p>${escape(project.description)}</p></a><div class="app-project-links">${project.links.map(link => `<a href="${escape(link.href)}">${escape(link.title)} →</a>`).join('')}</div></article>`).join('')}</div></section>`;
}

export function articlePage(page, documents, context, comments = '') {
  const tail = `${page.sourceUrl ? `<p class="app-source-link"><a href="${escape(page.sourceUrl)}">공개 원문</a></p>` : ''}${comments}`;
  const example = page.example ? '<p class="app-example-notice">화면 검증을 위한 예시 글입니다. 실제 운영 성과를 나타내지 않습니다.</p>' : '';
  if (page.type === 'blog') {
    const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? dateLine({ updatedAt: page.updatedAt }) : '';
    return `<main id="main" class="app-shell">${postArticle(page, { detail: true, footer: `${tagLinks(page, context.topics)}${updated}${example}`, after: tail })}</main>`;
  }
  return `<main id="main" class="app-shell app-document-shell">${searchBox()}<article class="app-document"><header class="app-document-header"><h1 class="app-article-title">${subjectIcon(page.contentIcon, 'medium')}${escape(page.title)}</h1></header><p class="app-article-lead app-document-lead">${page.leadHtml ?? escape(page.description)}</p><div class="app-document-metadata">${dateLine(page)}${tagLinks(page, context.topics)}${example}</div>${topicNavigation(page, context)}${articleToc(page.headings)}<div class="app-prose app-document-body">${shiftHeadings(page.html, detailLevels)}</div>${tail}</article></main>`;
}

export function resultRow(page, tags) {
  return String(ui.SearchResult({ href: page.route, icon: ui.trusted(subjectIcon(page.contentIcon, 'small')), title: page.title, example: page.example, description: page.description, tags: page.tags.map(id => ({ href: `/tags/${id}/`, label: tags[id].label })) }));
}

export function tagPage(tag, entries, tags) {
  const fallback = entries.length ? entries.map(page => resultRow(page, tags)).join('') : '<p>이 태그로 발행한 글이 없습니다.</p>';
  return `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-page-heading">${escape(tags[tag].label)}</h1><div data-search-page data-tag="${tag}"><div class="app-filter-summary" data-filter-summary></div><div data-full-results></div><details class="app-details" data-search-fallback><summary>이 태그의 모든 글 보기</summary><p class="app-caption">검색어를 적용하지 않은 이 태그의 전체 목록입니다.</p>${fallback}</details></div></main>`;
}

export function dateLine(page) {
  const published = page.publishedAt ? `<time datetime="${page.publishedAt}">${page.publishedAt}</time>` : '';
  const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? `<span>수정 <time datetime="${page.updatedAt}">${page.updatedAt}</time></span>` : '';
  return published || updated ? `<p class="app-document-dates">${published}${updated}</p>` : '';
}

function topicNavigation(page, context) {
  if (page.type !== 'wiki') return '';
  const roots = context.topicTrees?.get(page.topic);
  if (!roots) return '';
  function children(node) {
    const parent = node.page;
    const link = `<a href="${parent.route}"${parent.id === page.id ? ' aria-current="page"' : ''}>${escape(parent.title)}</a>`;
    if (!node.children.length) return `<li>${link}</li>`;
    return `<li><details open><summary>${escape(parent.title)}</summary><ul><li>${link}</li>${node.children.map(children).join('')}</ul></details></li>`;
  }
  return `<details class="app-document-nav"><summary>문서 목록 · ${escape(context.topics[page.topic].label)}</summary><nav aria-label="${escape(context.topics[page.topic].label)} 문서"><a class="app-sidebar-back" href="/wiki/">← Wiki</a><ul>${roots.map(children).join('')}</ul></nav></details>`;
}
