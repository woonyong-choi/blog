import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blogCard, recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';

const TAGS = { os: { label: '운영체제' } };
function posts(count) {
  return Array.from({ length: count }, (_, id) => ({ id: `post-${id}`, route: `/articles/post-${id}/`, title: `글 ${id}`, description: '설명', publishedAt: '2026-10-01', type: 'blog', tags: ['os'], contentIcon: { name: 'operating-system' }, html: `<h2 id="post-${id}-section">절</h2><p>본문</p>` }));
}

test('blog_preview_shows_all_link_only_when_more_than_three_posts_exist', () => {
  for (const count of [0, 1, 3, 4, 12, 13]) {
    const html = recentBlog(posts(count), TAGS);
    assert.equal((html.match(/class="app-blog-card"/g) ?? []).length, Math.min(count, 3));
    assert.equal(html.includes('전체 보기'), count > 3);
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
  assert.equal((recentBlog(entries, TAGS).match(/<h3\b/g) ?? []).length, 3);
  assert.doesNotMatch(last, /rel="next"/);
  const feed = blogFeed(entries, TAGS, 1);
  assert.equal((feed.match(/class="app-blog-post"/g) ?? []).length, 4);
  assert.match(feed, /href="\/blog\/page\/2\/"/);
  assert.match(feed, /<h3[^>]* id="post-0-section">/);
});

// #65: 최근 글과 전체 목록은 이미지 위치와 제목·태그의 독립 링크를 공유한다.
test('blog_cards_preserve_thumbnail_position_and_separate_links', () => {
  const post = { ...posts(1)[0], thumbnail: { src: '/media/cover.webp', alt: '상단의 "검색" 입력창', position: { x: 37.5, y: 0 } } };
  for (const html of [recentBlog([post], TAGS), blogArchive([post], TAGS, 1)]) {
    assert.match(html, /object-position:37\.5% 0%/);
    assert.match(html, /alt="상단의 &quot;검색&quot; 입력창"/);
    assert.match(html, /<a class="app-blog-cover"[^>]+><img[^>]+><\/a>/);
    assert.match(html, /href="\/tags\/os\/"/);
  }
  const centered = blogCard({ ...post, thumbnail: { src: post.thumbnail.src, alt: '' } }, TAGS);
  assert.doesNotMatch(centered, /object-position/);
  const fallback = blogCard({ ...post, thumbnail: undefined }, TAGS);
  assert.match(fallback, /app-content-icon/);
  assert.doesNotMatch(fallback, /cover.webp|object-position/);
});
