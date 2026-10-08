// 같은 발행 글을 세 편 미리보기, 카드 목록, 네 편 본문 피드로 보여준다.
import { escape } from './markdown.mjs';
import { subjectIcon, tagLinks, dateLine, searchBox } from './publication-layout.mjs';
import { PAGE_SIZES, paginate } from './content-model.mjs';

export function blogCard(page, tags) {
  // 검증된 이미지별 좌표는 테마 값이 아닌 콘텐츠의 자르기 데이터다.
  const position = page.thumbnail?.position;
  const crop = position ? ` style="object-position:${position.x}% ${position.y}%"` : '';
  const cover = page.thumbnail ? `<img src="${escape(page.thumbnail.src)}" alt="${escape(page.thumbnail.alt)}" width="960" height="540" loading="lazy" decoding="async"${crop}>` : subjectIcon(page.contentIcon);
  return `<article class="app-blog-card"><a class="app-blog-cover" href="${page.route}" aria-label="${escape(page.title)}">${cover}</a><div class="app-blog-card-body">${page.example ? '<p class="app-eyebrow">예시 글</p>' : ''}<h3><a href="${page.route}">${escape(page.title)}</a></h3>${tagLinks(page, tags, 3)}<time datetime="${page.publishedAt}">${page.publishedAt}</time></div></article>`;
}

export function recentBlog(posts, tags) {
  if (!posts.length) return '';
  return `<section class="app-knowledge-section"><div class="app-section-heading"><h2>최근 블로그</h2>${posts.length > PAGE_SIZES.preview ? '<a href="/blog/all/">전체 보기 →</a>' : ''}</div><div class="app-blog-grid">${posts.slice(0, PAGE_SIZES.preview).map(page => blogCard(page, tags)).join('')}</div></section>`;
}

export function blogArchive(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.cards);
  return `<main id="main" class="app-shell">${searchBox()}<h1 class="app-page-heading">모든 글</h1><div class="app-list-toolbar"><span>${posts.length}편 · 최신 발행순</span><a href="/blog/">본문 이어 읽기 →</a></div>${posts.length ? `<div class="app-blog-grid">${result.items.map(post => blogCard(post, tags)).join('')}</div>` : emptyBlog()}${pagination(result, '/blog/all/')}</main>`;
}

export function blogFeed(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.feed);
  return `<main id="main" class="app-shell">${searchBox()}<h1 class="app-sr">Blog</h1><div class="app-list-toolbar"><span>Blog</span><a href="/blog/all/">전체 글 보기 →</a></div>${posts.length ? result.items.map(post => feedArticle(post, tags)).join('') : emptyBlog()}${pagination(result, '/blog/', true)}</main>`;
}

export function pagination(result, route, feed = false) {
  if (result.totalPages <= 1) return '';
  const href = page => page === 1 ? route : `${route}page/${page}/`;
  const before = result.page > 1 ? `<a rel="prev" href="${href(result.page - 1)}">← ${feed ? '최신 글' : '이전'}</a>` : '';
  const after = result.page < result.totalPages ? `<a rel="next" href="${href(result.page + 1)}">${feed ? '이전 글' : '다음'} →</a>` : '';
  const numbers = feed ? `<span>${result.page} / ${result.totalPages}</span>` : Array.from({ length: result.totalPages }, (_, i) => i + 1).map(page => page === result.page ? `<span aria-current="page">${page}</span>` : `<a href="${href(page)}" aria-label="${page}페이지">${page}</a>`).join('');
  return `<nav class="app-page-links" aria-label="블로그 페이지">${before}${numbers}${after}</nav>`;
}

function feedArticle(post, tags) {
  const body = post.html.replace(/<(\/?)h([1-5])([^>]*)>/g, (_, end, level, attrs) => `<${end}h${Number(level) + 1}${!end ? ` class="app-heading-${level}"` : ''}${attrs}>`);
  return `<article class="app-blog-post" aria-labelledby="post-${post.id}"><header class="app-post-header"><time class="app-post-date" datetime="${post.publishedAt}">${post.publishedAt}${post.example ? ' · 예시 글' : ''}</time><h2 class="app-post-title" id="post-${post.id}"><a href="${post.route}">${escape(post.title)}</a></h2></header><div class="app-prose app-feed-body"><p class="app-article-lead">${post.leadHtml ?? escape(post.description)}</p>${body}</div>${tagLinks(post, tags)}${post.updatedAt && post.updatedAt !== post.publishedAt ? dateLine({ updatedAt: post.updatedAt }) : ''}<p class="app-caption"><a href="${post.route}">글 상세</a> · <a href="${post.route}#comments">댓글 보기·작성</a></p></article>`;
}

function emptyBlog() {
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/wiki/">위키에서 기록 읽기</a></p>';
}
