// 같은 발행 글을 세 편 미리보기, 카드 목록, 네 편 본문 피드로 보여준다.
import { escape } from './markdown.mjs';
import { subjectIcon, tagLinks, dateLine, searchBox } from './publication-layout.mjs';
import { PAGE_SIZES, paginate } from './content-model.mjs';
import { postArticle } from './post-article.mjs';

export function blogCard(page, tags, level = 3) {
  const heading = level === 2 ? 'h2' : 'h3';
  // 검증된 이미지별 좌표는 테마 값이 아닌 콘텐츠의 자르기 데이터다.
  const position = page.thumbnail?.position;
  const crop = position ? ` style="object-position:${position.x}% ${position.y}%"` : '';
  const cover = page.thumbnail ? `<img src="${escape(page.thumbnail.src)}" alt="${escape(page.thumbnail.alt)}" width="960" height="540" loading="lazy" decoding="async"${crop}>` : subjectIcon(page.contentIcon);
  return `<article class="app-blog-card"><a class="app-blog-cover" href="${page.route}" aria-label="${escape(page.title)}">${cover}</a><div class="app-blog-card-body"><${heading} class="app-blog-card-title"><a href="${page.route}">${escape(page.title)}</a></${heading}>${tagLinks(page, tags, 3)}</div></article>`;
}

export function recentBlog(posts, tags) {
  if (!posts.length) return '';
  return `<section class="app-knowledge-section app-support-group"><h2 class="app-page-heading">Blog</h2><div class="app-blog-grid">${posts.slice(0, PAGE_SIZES.preview).map(page => blogCard(page, tags)).join('')}</div>${posts.length > PAGE_SIZES.preview ? '<p><a href="/blog/all/">전체 보기</a></p>' : ''}</section>`;
}

export function blogArchive(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.cards);
  return `<main id="main" class="app-shell">${searchBox()}<h1 class="app-page-heading">모든 글</h1><div class="app-list-toolbar"><span>${posts.length}편 · 최신 발행순</span><a href="/blog/">본문 이어 읽기 →</a></div>${posts.length ? `<div class="app-blog-grid">${result.items.map(post => blogCard(post, tags, 2)).join('')}</div>` : emptyBlog()}${pagination(result, '/blog/all/')}</main>`;
}

export function blogFeed(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.feed);
  return `<main id="main" class="app-shell"><h1 class="app-sr">Blog</h1>${posts.length ? result.items.map(post => feedArticle(post, tags)).join('') : emptyBlog()}${pagination(result, '/blog/', true)}${posts.length ? '<p class="app-page-links"><a href="/blog/all/">전체 글 보기 →</a></p>' : ''}</main>`;
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
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt ? dateLine({ updatedAt: post.updatedAt }) : '';
  return postArticle(post, { footer: `${tagLinks(post, tags)}${updated}<p class="app-caption"><a href="${post.route}">글 상세</a> · <a href="${post.route}#comments">댓글 보기·작성</a></p>` });
}

function emptyBlog() {
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/wiki/">위키에서 기록 읽기</a></p>';
}
