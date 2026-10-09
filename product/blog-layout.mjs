// 같은 발행 글을 두 편 미리보기, 카드 목록, 네 편 본문 피드로 보여준다.
import { escape } from './markdown.mjs';
import * as ui from './vendor/theme/assets/components.mjs';
import { subjectIcon, tagLinks, dateLine, searchBox, documentCard } from './publication-layout.mjs';
import { PAGE_SIZES, paginate } from './content-model.mjs';
import { postArticle } from './post-article.mjs';

export function blogCard(page, tags, level = 3) {
  // 검증된 이미지별 좌표는 테마 값이 아닌 콘텐츠의 자르기 데이터다.
  const position = page.thumbnail?.position;
  const crop = position ? ` style="object-position:${position.x}% ${position.y}%"` : '';
  const cover = page.thumbnail ? `<img src="${escape(page.thumbnail.src)}" alt="${escape(page.thumbnail.alt)}" width="960" height="540" loading="lazy" decoding="async"${crop}>` : subjectIcon(page.contentIcon);
  return String(ui.BlogCard({ href: page.route, title: page.title, level, cover: ui.trusted(cover), tags: ui.trusted(tagLinks(page, tags, 3)) }));
}

export function recentBlog(posts) {
  if (!posts.length) return '';
  const cards = posts.slice(0, PAGE_SIZES.preview).map(page => ui.trusted(documentCard(page)));
  return `<section class="app-knowledge-section app-support-group"><h2 class="app-page-heading">Blog</h2>${ui.CardGroup({ columns: 2, cards })}${posts.length > PAGE_SIZES.preview ? '<p><a href="/blog/all/">전체 보기</a></p>' : ''}</section>`;
}

export function blogArchive(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.cards);
  return `<main id="main" class="app-shell">${searchBox()}<h1 class="app-page-heading">모든 글</h1><div class="app-list-toolbar"><span>${posts.length}편 · 최신 발행순</span><a href="/blog/">본문 이어 읽기 →</a></div>${posts.length ? `<div class="app-blog-grid">${result.items.map(post => blogCard(post, tags, 2)).join('')}</div>` : emptyBlog()}${pagination(result, '/blog/all/')}</main>`;
}

export function blogFeed(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.feed);
  return `<main id="main" class="app-shell"><h1 class="app-sr">Blog</h1>${posts.length ? result.items.map(post => feedArticle(post, tags)).join('') : emptyBlog()}${pagination(result, '/blog/', true)}${posts.length ? ui.ListLink({ href: '/blog/all/', text: '전체 글 보기 →' }) : ''}</main>`;
}

export function pagination(result, route, feed = false) {
  if (result.totalPages <= 1) return '';
  const href = page => page === 1 ? route : `${route}page/${page}/`;
  const before = result.page > 1 ? { href: href(result.page - 1), text: `← ${feed ? '최신 글' : '이전'}` } : undefined;
  const after = result.page < result.totalPages ? { href: href(result.page + 1), text: `${feed ? '이전 글' : '다음'} →` } : undefined;
  const numbers = Array.from({ length: result.totalPages }, (_, i) => ({ page: i + 1, href: href(i + 1), current: i + 1 === result.page }));
  return String(ui.PageLinks({ label: '블로그 페이지', before, after, numbers, summary: feed ? `${result.page} / ${result.totalPages}` : undefined }));
}

function feedArticle(post, tags) {
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt ? dateLine({ updatedAt: post.updatedAt }) : '';
  return postArticle(post, { footer: `${tagLinks(post, tags)}${updated}<p class="app-caption"><a href="${post.route}">글 상세</a> · <a href="${post.route}#comments">댓글 보기·작성</a></p>` });
}

function emptyBlog() {
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/wiki/">위키에서 기록 읽기</a></p>';
}
