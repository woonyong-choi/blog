import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blogCard, recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';

const TAGS = { os: { label: '운영체제' } };
function posts(count) {
  return Array.from({ length: count }, (_, id) => ({ id: `post-${id}`, route: `/articles/post-${id}/`, title: `글 ${id}`, description: '설명', publishedAt: '2026-10-01', type: 'blog', tags: ['os'], contentIcon: { name: 'operating-system' }, html: `<h2 id="post-${id}-section">절</h2><p>본문</p>` }));
}

// #110: 썸네일 목록은 최대 네 글을 보여 주고 나머지는 전체 목록에서 읽는다.
test('blog_preview_shows_four_thumbnail_cards_and_an_all_link_when_needed', () => {
  for (const count of [0, 1, 2, 3, 4, 5, 12, 13]) {
    const html = recentBlog(posts(count));
    assert.equal((html.match(/class="app-blog-card"/g) ?? []).length, Math.min(count, 4));
    assert.equal(html.includes('전체 보기'), count > 4);
    assert.doesNotMatch(html, /app-help-card|app-tags/);
    if (count) assert.match(html, /<p class="app-card-summary">설명<\/p>/);
  }
});

test('blog_archive_and_feed_have_static_navigation_and_no_duplicate_posts', () => {
  const entries = posts(13);
  const first = blogArchive(entries, TAGS, 1);
  const last = blogArchive(entries, TAGS, 2);
  assert.equal((first.match(/class="app-blog-card"/g) ?? []).length, 12);
  assert.equal((last.match(/class="app-blog-card"/g) ?? []).length, 1);
  assert.match(first, /href="\/blog\/all\/page\/2\/"/);
  assert.equal((first.match(/<h2\b/g) ?? []).length, 12);
  assert.doesNotMatch(first, /<h3\b/);
  assert.equal((recentBlog(entries).match(/<h3 class="app-blog-card-title"/g) ?? []).length, 4);
  assert.doesNotMatch(last, /rel="next"/);
  const feed = blogFeed(entries, TAGS, 1);
  assert.equal((feed.match(/class="app-blog-post"/g) ?? []).length, 4);
  assert.match(feed, /href="\/blog\/page\/2\/"/);
  assert.match(feed, /<h3[^>]* id="post-0-section">/);
  assert.doesNotMatch(feed, /app-search|app-list-toolbar/);
  assert.match(feed.slice(feed.lastIndexOf('</article>')), /href="\/blog\/all\/"/);
  assert.equal((feed.match(/<footer class="app-post-footer">/g) ?? []).length, 4);
});

// 썸네일 자르기 좌표와 제목 링크를 유지하고 설명을 보여 준다.
test('blog_cards_keep_the_primary_link_separate_from_comment_and_author_links', () => {
  const post = { ...posts(1)[0], comments: true, commentCount: 2, cardAuthor: { name: '작성자', href: '/author/' }, thumbnail: { src: '/media/cover.webp', alt: '상단의 "검색" 입력창', position: { x: 37.5, y: 0 } } };
  for (const html of [blogCard(post, TAGS), blogArchive([post], TAGS, 1)]) {
    assert.match(html, /object-position:37\.5% 0%/);
    assert.match(html, /alt="상단의 &quot;검색&quot; 입력창"/);
    assert.match(html, /<a class="app-blog-card-link"[^>]+><div class="app-blog-cover"><img[^>]+><\/div>/);
    const card = html.match(/<article class="app-blog-card">[\s\S]*?<\/article>/)[0];
    assert.equal((card.match(/<a /g) ?? []).length, 3);
    assert.equal((card.match(/<a class="app-blog-card-link"/g) ?? []).length, 1);
    assert.match(card, /<p class="app-card-summary">설명<\/p><\/div><\/a><div class="app-blog-card-meta"><time class="app-blog-card-date" datetime="2026-10-01">2026년 10월 1일<\/time>/);
    assert.match(card, /href="\/articles\/post-0\/#comments"[^>]*>댓글 2개<\/a>/);
    assert.match(card, /<footer class="app-blog-card-footer"><a class="app-blog-card-author" href="\/author\/"/);
    assert.match(html, /app-card-summary/);
    assert.doesNotMatch(html, /app-tags/);
  }
  const centered = blogCard({ ...post, thumbnail: { src: post.thumbnail.src, alt: '' } }, TAGS);
  assert.doesNotMatch(centered, /object-position/);
  const fallback = blogCard({ ...post, thumbnail: undefined }, TAGS);
  assert.doesNotMatch(fallback, /app-content-icon/);
  assert.doesNotMatch(fallback, /cover.webp|object-position/);
  assert.match(blogCard({ ...post, commentCount: undefined }), />댓글 보기<\/a>/);
  assert.match(blogCard({ ...post, commentCount: 0 }), />댓글 0개<\/a>/);
});
