// 개인 사이트의 탐색과 본문을 하나의 테마와 문서 식별자로 조합한다.
import { readFileSync } from 'node:fs';
import { escape } from './markdown.mjs';
import { contentIcon } from './content-icons.mjs';
import { FIELDS } from './content-model.mjs';

const BRANDS = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url))).icons;
const FIELD_NAMES = Object.freeze({ languages: 'Languages', cs: 'CS', frameworks: 'Frameworks', infrastructure: 'Infrastructure' });

export function iconUrl(spec, size = 'small') {
  const name = typeof spec === 'string' ? spec : spec.name;
  return `/theme/assets/icons/${BRANDS.some(item => item.file === `${name}.svg`) ? 'brands' : size === 'small' ? 'small' : 'detail'}/${name}.svg`;
}

export function subjectIcon(spec, size = 'card') {
  const name = typeof spec === 'string' ? spec : spec.name;
  const brand = BRANDS.find(item => item.file === `${name}.svg`);
  if (brand) return `<span class="app-content-icon is-${size}"><img src="/theme/assets/icons/brands/${escape(brand.file)}" alt="" decoding="async"></span>`;
  return contentIcon(spec, size, 'detail');
}

export function documentShell(page, body, context) {
  const { config, themeHash, scriptHash, origin = '', preview } = context;
  const canonical = origin ? `<link rel="canonical" href="${escape(origin + page.route)}">` : '';
  const navigation = [['Projects', '/projects/'], ['Wiki', '/wiki/'], ['Blog', '/blog/']];
  const active = page.type === 'blog' ? '/blog/' : page.type === 'wiki' ? '/wiki/' : page.route;
  return `<!doctype html><html lang="ko" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escape(page.description ?? config.description)}"><meta name="color-scheme" content="light">${preview ? '<meta name="robots" content="noindex,nofollow">' : ''}${canonical}<title>${escape(page.title)} · ${escape(config.name)}</title><link rel="alternate" type="application/rss+xml" title="Blog" href="/blog/feed.xml"><link rel="stylesheet" href="/theme/theme.css?v=${themeHash}"><link rel="stylesheet" href="/theme/styles.css?v=${themeHash}"><script type="module" src="/publication.js?v=${scriptHash}"></script></head><body class="app-publication${page.route === '/' ? ' app-canvas' : ''}"><a class="app-skip" href="#main">본문으로 이동</a><div class="app-shell"><header class="app-header"><a class="app-identity" href="/">${escape(config.name)}</a><nav class="app-nav" aria-label="주요 메뉴">${navigation.map(([name, route]) => `<span class="app-nav-item"><a href="${route}"${active.startsWith(route) ? ' aria-current="page"' : ''}>${name}</a></span>`).join('')}</nav></header></div>${body}<footer class="app-personal-footer app-shell"><a class="app-identity" href="/">${escape(config.name)}</a><nav aria-label="관련 링크"><a href="${escape(config.github)}">GitHub</a><a href="/blog/feed.xml">RSS</a><a href="/search/">검색</a></nav></footer></body></html>`;
}

export function searchBox({ large = false, query = '' } = {}) {
  return `<section class="app-search app-public-search${large ? ' is-prominent' : ''}" data-public-search aria-label="통합 검색"><form action="/search/" role="search"><label class="app-sr" for="site-query">위키와 블로그 검색</label><div class="app-search-field"><img class="app-search-icon" src="/assets/quickfind-loupe.svg" alt=""><input class="app-search-input" id="site-query" name="q" type="text" value="${escape(query)}" placeholder="어떤 내용을 찾으세요?" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="search-suggestions"><button class="app-search-clear" type="button" data-clear-query aria-label="검색어 지우기" hidden><img src="/assets/quickfind-clear.svg" alt=""></button></div></form><div class="app-search-panel" id="search-suggestions" role="listbox" hidden></div><p class="app-sr" data-search-status role="status" aria-live="polite"></p><noscript><p class="app-caption">검색은 JavaScript가 필요합니다. <a href="/wiki/">위키 목록</a>과 <a href="/blog/all/">전체 글</a>은 바로 읽을 수 있습니다.</p></noscript></section>`;
}

export function tagLinks(page, tags, limit = Infinity) {
  const link = id => `<a class="app-tag" href="/tags/${id}/?type=${page.type}">${escape(tags[id].label)}</a>`;
  const visible = page.tags.slice(0, limit).map(link).join('');
  const remaining = page.tags.slice(limit);
  return `<div class="app-tags" aria-label="태그">${visible}${remaining.length ? `<details class="app-tags-more"><summary>+${remaining.length}</summary><div class="app-tags">${remaining.map(link).join('')}</div></details>` : ''}</div>`;
}

export function wikiCard(page, title = page.title) {
  return `<a class="app-knowledge-card" href="${page.route}">${subjectIcon(page.contentIcon)}<h3>${escape(title)}</h3><p>${escape(page.description)}</p></a>`;
}

export function knowledgeFields(documents, topics, field) {
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  return FIELDS.filter(value => !field || value === field).map(value => {
    const entries = Object.entries(topics).filter(([, topic]) => topic.field === value).map(([id, topic]) => {
      const article = bySlug.get(topic.article) ?? documents.filter(page => page.topic === id && page.type === 'wiki').sort((a, b) => a.id.localeCompare(b.id))[0];
      return article ? { ...topic, page: { ...article, contentIcon: { name: topic.icon } } } : null;
    }).filter(Boolean);
    if (!entries.length) return '';
    const shown = field ? entries : entries.slice(0, 6);
    return `<section class="app-knowledge-section"><div class="app-section-heading"><h2>${FIELD_NAMES[value]}</h2>${!field && entries.length > 6 ? `<a href="/wiki/${value}/">전체 보기 <span aria-hidden="true">→</span></a>` : ''}</div><div class="app-knowledge-grid">${shown.map(topic => wikiCard(topic.page, topic.label)).join('')}</div></section>`;
  }).join('');
}

export function personalHome(documents, context, recent = '') {
  const { config, topics } = context;
  const portfolio = config.portfolio.map(slug => documents.find(page => page.slug === slug)).filter(Boolean);
  return `<main id="main"><section class="app-personal-hero app-shell"><p class="app-eyebrow">Backend Engineer · Knowledge Workflow Systems</p><h1>${escape(config.description)}</h1><p class="app-personal-intro">${escape(config.introduction)}</p><a class="app-hero-link" href="#portfolio">대표 작업 보기 <span aria-hidden="true">→</span></a></section><div class="app-shell"><section class="app-knowledge-section" id="portfolio"><div class="app-section-heading"><h2>대표 작업</h2><a href="/projects/">프로젝트 보기 <span aria-hidden="true">→</span></a></div><div class="app-portfolio-grid">${portfolio.slice(0, 2).map(page => wikiCard(page)).join('')}</div><div class="app-supporting-links">${portfolio.slice(2).map(page => `<a href="${page.route}">${escape(page.title)} <span aria-hidden="true">→</span></a>`).join('')}</div></section>${knowledgeFields(documents, topics)}${recent}${projectSection(config.projects.slice(0, 1), config.projects.length > 1)}</div></main>`;
}

export function wikiLanding(documents, context, field, recent = '') {
  return `<main id="main" class="app-shell">${searchBox({ large: true })}<h1 class="app-page-heading">${field ? FIELD_NAMES[field] : 'Wiki'}</h1>${field ? '<a class="app-back-link" href="/wiki/">← 위키</a>' : '<p class="app-page-description">개념을 연결하고, 구현에서 확인한 내용을 기록합니다.</p>'}${knowledgeFields(documents, context.topics, field)}${recent}</main>`;
}

export function projectSection(projects, hasMore = false) {
  return `<section class="app-knowledge-section"><div class="app-section-heading"><h2>개발 프로젝트</h2>${hasMore ? '<a href="/projects/">전체 보기 →</a>' : ''}</div><div class="app-project-grid">${projects.map(project => `<article class="app-project-entry"><a class="app-knowledge-card" href="${escape(project.href)}">${subjectIcon(project.icon)}<h3>${escape(project.title)}</h3><p>${escape(project.description)}</p></a><div class="app-project-links">${project.links.map(link => `<a href="${escape(link.href)}">${escape(link.title)} →</a>`).join('')}</div></article>`).join('')}</div></section>`;
}

export function articlePage(page, documents, context, comments = '') {
  const related = documents.filter(other => other.id !== page.id && other.tags.some(tag => page.tags.includes(tag))).slice(0, 3);
  return `<main id="main" class="app-shell app-document-shell">${searchBox()}<div class="app-document-layout">${topicNavigation(page, documents, context.topics)}<article class="app-document app-prose"><header class="app-document-header"><p class="app-eyebrow">${page.type === 'wiki' ? 'Wiki' : 'Blog'}${page.example ? ' · 예시 글' : ''}</p><h1 class="app-article-title">${subjectIcon(page.contentIcon, 'medium')}${escape(page.title)}</h1><p class="app-article-lead">${escape(page.description)}</p>${dateLine(page)}${tagLinks(page, context.topics)}${page.example ? '<p class="app-example-notice">화면 검증을 위한 예시 글입니다. 실제 운영 성과를 나타내지 않습니다.</p>' : ''}</header>${tableOfContents(page)}${page.html}${page.sourceUrl ? `<p class="app-source-link"><a href="${escape(page.sourceUrl)}">공개 원문</a></p>` : ''}${comments}${!page.comments ? `<p class="app-caption"><a href="https://github.com/woonyong-choi/blog/issues/new?title=${encodeURIComponent(`문서 수정 제안: ${page.title}`)}">이 문서의 수정 제안</a></p>` : ''}<section class="app-related"><h2>함께 읽기</h2>${related.map(other => resultRow(other, context.topics)).join('')}</section></article></div></main>`;
}

export function resultRow(page, tags) {
  return `<article class="app-search-entry"><a class="app-search-result-link" href="${page.route}">${subjectIcon(page.contentIcon, 'small')}<strong>${escape(page.title)}</strong><span class="app-search-result-type">${page.type === 'wiki' ? 'Wiki' : 'Blog'}${page.example ? ' · 예시' : ''}</span><p>${escape(page.description)}</p></a><div class="app-search-result-tags">${page.tags.map(id => `<a href="/tags/${id}/?type=${page.type}">${escape(tags[id].label)}</a>`).join('')}</div></article>`;
}

export function dateLine(page) {
  const published = page.publishedAt ? `<time datetime="${page.publishedAt}">${page.publishedAt}</time>` : '';
  const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? `<span>수정 <time datetime="${page.updatedAt}">${page.updatedAt}</time></span>` : '';
  return published || updated ? `<p class="app-document-dates">${published}${updated}</p>` : '';
}

function tableOfContents(page) {
  const headings = page.headings.filter(heading => heading.level === 2);
  if (headings.length < 2) return '';
  return `<nav class="app-toc" aria-label="이 글의 목차"><strong>이 글에서</strong><ul>${headings.map(heading => `<li><a href="#${heading.id}">${escape(heading.title)}</a></li>`).join('')}</ul></nav>`;
}

function topicNavigation(page, documents, topics) {
  if (page.type !== 'wiki') return '';
  const entries = documents.filter(other => other.topic === page.topic);
  const bySlug = new Map(entries.map(other => [other.slug, other]));
  const roots = entries.filter(other => !bySlug.has(other.parent) || other.parent === other.slug);
  function children(parent, depth, visited = new Set()) {
    if (visited.has(parent.slug)) return '';
    const path = new Set([...visited, parent.slug]);
    const nested = entries.filter(other => other.parent === parent.slug && !path.has(other.slug));
    const link = `<a href="${parent.route}"${parent.id === page.id ? ' aria-current="page"' : ''}>${escape(parent.title)}</a>`;
    if (!nested.length) return `<li>${link}</li>`;
    if (depth >= 2) return `<li>${link}</li>${nested.map(other => children(other, depth, path)).join('')}`;
    return `<li><details open><summary>${escape(parent.title)}</summary><ul><li>${link}</li>${nested.map(other => children(other, depth + 1, path)).join('')}</ul></details></li>`;
  }
  return `<details class="app-document-nav" open><summary>문서 목록 · ${escape(topics[page.topic].label)}</summary><nav aria-label="${escape(topics[page.topic].label)} 문서"><a class="app-sidebar-back" href="/wiki/">← Wiki</a><ul>${roots.map(root => children(root, 0)).join('')}</ul></nav></details>`;
}
