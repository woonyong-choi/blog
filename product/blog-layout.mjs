// 같은 발행 글을 네 편 미리보기, 카드 목록, 네 편 본문 피드로 보여준다.
import * as ui from './vendor/theme/assets/components.mjs';
import { tagLinks, dateLine, searchBox } from './publication-layout.mjs';
import { PAGE_SIZES, paginate } from './content-model.mjs';
import { postArticle, thumbnailImage } from './post-article.mjs';

export function blogCard(page, tags, level = 3) {
  const cover = thumbnailImage(page);
  const dateLabel = page.publishedAt ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(page.publishedAt)) : undefined;
  return String(ui.BlogCard({ href: page.route, title: page.title, level, cover: ui.trusted(cover), description: page.description, publishedAt: page.publishedAt, dateLabel, commentsHref: page.comments ? `${page.route}#comments` : undefined, commentCount: page.commentCount, author: page.cardAuthor }));
}

export function recentBlog(posts) {
  if (!posts.length) return '';
  const cards = posts.slice(0, PAGE_SIZES.preview).map(page => ui.trusted(blogCard(page)));
  return `<section class="app-knowledge-section app-support-group"><h2 class="app-page-heading">Blog</h2>${ui.CardGroup({ columns: 2, cards })}${posts.length > PAGE_SIZES.preview ? '<p><a href="/blog/all/">전체 보기</a></p>' : ''}</section>`;
}

export function blogArchive(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.cards);
  return `<main id="main" class="app-shell">${searchBox()}<h1 class="app-page-heading">모든 글</h1><div class="app-list-toolbar"><span>${posts.length}편 · 최신 발행순</span><a href="/blog/">본문 이어 읽기 →</a></div>${posts.length ? `<div data-blog-list>${ui.CardGroup({ cards: result.items.map(post => ui.trusted(blogCard(post, tags, 2))) })}${pagination(result, '/blog/all/')}<p class="app-caption" data-blog-status role="status"></p></div>` : emptyBlog()}</main>`;
}

export function blogFeed(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.feed);
  return `<main id="main" class="app-shell"><h1 class="app-sr">Blog</h1>${posts.length ? `<div data-blog-list="feed"><div class="app-blog-feed-items">${result.items.map(post => feedArticle(post, tags)).join('')}</div>${pagination(result, '/blog/', true)}<p class="app-caption" data-blog-status role="status"></p></div>` : emptyBlog()}${posts.length ? ui.ListLink({ href: '/blog/all/', text: '전체 글 보기 →' }) : ''}</main>`;
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
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/docs/">문서에서 기록 읽기</a></p>';
}
