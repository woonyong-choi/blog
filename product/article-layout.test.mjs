import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createMarkdown } from './markdown.mjs';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { blogFeed } from './blog-layout.mjs';
import { token, px, box } from './theme-measure.mjs';

const near = (value, expected) => assert.equal(Math.round(value * 10000) / 10000, expected);
const topics = { python: { label: 'Python' } };
function post(type, body = '리드 문장\n\n# 큰 제목\n\n## 절 하나\n\n내용\n\n### 하위\n\n## 절 둘\n\n끝') {
  const page = { id: 'sample', slug: 'sample', route: '/articles/sample/', title: '샘플 글', description: '리드 문장', body, type, topic: 'python', tags: ['python'],
    contentIcon: { name: 'python' }, comments: true, publishedAt: '2026-01-02', updatedAt: '2026-02-03' };
  return Object.assign(page, renderArticle(createMarkdown(), page));
}
const order = (html, markers) => markers.map(marker => { const at = html.indexOf(marker); assert.ok(at >= 0, marker); return at; });

test('blog_detail_follows_the_single_post_structure_without_search_or_title_icon', () => {
  const page = post('blog');
  const other = { ...page, id: 'other', route: '/articles/other/' };
  const html = articlePage(page, [page, other], { topics, repositoryUrl: 'https://github.com/example/repo' }, '<section class="app-comments" id="comments"></section>');
  assert.doesNotMatch(html, /data-public-search|app-search|app-article-title|app-document-layout|app-toc/);
  assert.doesNotMatch(html.slice(0, html.indexOf('app-article-lead')), /app-content-icon/);
  assert.match(html, /<h1 class="app-post-title" id="post-sample">샘플 글<\/h1>/);
  assert.match(html, /<time class="app-post-date" datetime="2026-01-02">2026-01-02<\/time>/);
  const positions = order(html, ['app-post-header', 'app-post-date', 'app-post-title', 'app-article-lead', '<h2 id="sample-절-하나"', 'app-post-footer', 'class="app-tags"', 'app-document-dates', 'class="app-comments"', 'class="app-related"']);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h2 id="sample-큰-제목" class="app-heading-1">큰 제목<\/h2>/);
  assert.ok(html.indexOf('</article>') > html.indexOf('class="app-related"'));
});

test('feed_and_blog_detail_share_header_body_and_footer_markup', () => {
  const page = post('blog');
  const detail = articlePage(page, [page], { topics });
  const feed = blogFeed([page], topics, 1);
  const shared = html => html.match(/<header class="app-post-header">[\s\S]*?<\/header><div class="app-prose app-feed-body">/)[0].replace(/<h[12][^>]*>[\s\S]*?<\/h[12]>/, '');
  assert.equal(shared(detail), shared(feed));
  assert.match(feed, /<h2 class="app-post-title" id="post-sample"><a href="\/articles\/sample\/">/);
  assert.match(feed, /<h3 id="sample-절-하나" class="app-heading-2">/);
  assert.match(detail, /<h2 id="sample-절-하나" class="app-heading-2">/);
});

test('wiki_detail_keeps_search_title_icon_toc_and_a_collapsed_document_menu_in_the_reading_column', () => {
  const page = post('wiki');
  const tree = { page, children: [{ page: { ...page, id: 'child', title: '하위 문서', route: '/articles/child/' }, children: [] }] };
  const html = articlePage(page, [page], { topics, topicTrees: new Map([['python', [tree]]]) });
  assert.match(html, /^<main id="main" class="app-shell app-document-shell"><section class="app-search/);
  assert.doesNotMatch(html, /app-document-layout/);
  assert.match(html, /<h1 class="app-article-title"><span class="app-content-icon is-medium">/);
  const positions = order(html, ['data-public-search', 'app-article-title', 'app-document-lead', 'app-document-metadata', '<details class="app-document-nav">', 'class="app-toc"', 'app-document-body']);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.doesNotMatch(html.match(/<details class="app-document-nav"[^>]*>/)[0], /\sopen/);
  assert.match(html, /<h2 id="sample-큰-제목" class="app-heading-1">/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
});

const css = readFileSync(new URL('./vendor/theme/styles.css', import.meta.url), 'utf8');
const rule = selector => { const match = css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`)); assert.ok(match, selector); return match[1]; };

test('document_column_has_no_sidebar_and_code_blocks_scroll_under_a_fixed_header', () => {
  assert.doesNotMatch(css, /app-document-layout|\.app-document-nav\[open\]|app-document-shell \{ max-width/);
  assert.match(rule('.app-document'), /max-width: var\(--site-body-width\);[^}]*margin: var\(--site-article-search-bottom\) auto 0/);
  assert.match(rule('.app-code pre'), /overflow-x: auto;[^}]*white-space: pre;/);
  assert.match(rule('.app-code'), /grid-template-columns: minmax\(0, 1fr\);[^}]*overflow: hidden/);
  assert.match(rule('.app-code-header'), /justify-content: space-between/);
  assert.match(rule('.app-code-header button[hidden]'), /display: none/);
  assert.doesNotMatch(css, /\.app-code button \{/);
});

// 실측: https://culturedcode.com/things/blog/2025/05/a-swift-cloud/ 와 /things/support/articles/4651820/ (1710, 768, 390 폭에서 동일)
test('theme_tokens_resolve_to_the_measured_reference_dimensions', () => {
  const body = px(token('--site-body-text'));
  assert.equal(body, 18);
  assert.equal(px(token('--site-body-width')), 680);
  near(body * Number(token('--site-feature-body-line')), 25.2);
  assert.deepEqual(box(token('--site-post-padding')), [72, 0, 144]);
  assert.equal(px(token('--site-post-header-margin')), 36);
  assert.equal(px(token('--site-post-date-size')), 16.02);
  assert.equal(px(token('--site-post-title-size')), 37.8);
  near(px(token('--site-post-title-size')) * Number(token('--site-post-title-line')), 43.47);
  assert.equal(token('--site-post-title-width'), '84%');
  assert.equal(px(token('--site-post-title-margin')), 18.9);
  assert.equal(px(token('--site-post-lead-size')), 22.5);
  near(px(token('--site-post-lead-size')) * Number(token('--site-line-intro')), 28.125);
  assert.equal(px(token('--site-post-lead-margin')), 31.5);
  assert.equal(px(token('--site-post-paragraph-margin')), 25.2);
  assert.equal(px(token('--site-subtitle')), 27);
  near(px(token('--site-subtitle')) * Number(token('--site-line-intro')), 33.75);
  assert.deepEqual(box(token('--site-post-h2-margin')), [69.1875, 0, 23.0625]);
  assert.equal(px(token('--site-section-title')), 36);
  near(px(token('--site-section-title')) * Number(token('--site-line-compact')), 43.2);
  assert.equal(px(token('--site-article-title-padding')), 14.4);
  assert.equal(px(token('--site-article-title-gap')), 27);
  const code = body * px(token('--site-prose-code-size'), 1);
  near(code, 15.3);
  near(code * 1.4, 21.42);
  near(px(token('--site-prose-code-padding').split(' ')[1], code), 3.825);
  assert.equal(px(token('--site-article-search-bottom')), 53);
});

test('heading_levels_one_to_six_have_one_rule_each_for_their_written_level', () => {
  assert.match(css, /\.app-prose h2\.app-heading-1 \{ font-size: var\(--site-section-title\); line-height: var\(--site-prose-heading-line\); margin: var\(--site-prose-h1-margin\)/);
  for (const level of [4, 5, 6]) assert.match(css, new RegExp(`\\.app-prose \\.app-heading-${level} \\{`));
  assert.match(css, /\.app-blog-post \.app-feed-body \.app-heading-2 \{/);
  assert.match(css, /\.app-blog-post \.app-feed-body \.app-heading-3 \{/);
  near(px(token('--site-prose-h1-margin').split(' ')[0], 36), 74.4372);
  near(px(token('--site-prose-h1-margin').split(' ')[2], 36), 37.1628);
});

test('support_body_headings_have_no_rule_or_padding_and_containers_share_the_body_line_height', () => {
  assert.doesNotMatch(css, /\.app-document-body h2, \.app-related/);
  assert.match(css, /\n\.app-related > h2 \{[^}]*padding-bottom/);
  assert.doesNotMatch(css.match(/\.app-document-body h2 \{[^}]*\}/g)?.join('') ?? '', /border|padding/);
  for (const selector of ['.app-blog-post', '.app-document-shell']) assert.match([...css.matchAll(new RegExp(`\\n${selector.replace('.', '\\.')} \\{[^}]*\\}`, 'g'))].join(''), /line-height: var\(--site-feature-body-line\)/, selector);
  const header = css.match(/\n\.app-post-header \{[^}]*\}/)[0];
  assert.doesNotMatch(header, /line-height/);
});

test('post_title_fills_the_column_between_percentage_margins_like_the_reference', () => {
  const title = css.match(/\n\.app-post-title \{ margin: var\(--site-post-title-margin\) calc[^}]*\}/)[0];
  assert.match(title, /margin: var\(--site-post-title-margin\) calc\(\(100% - var\(--site-post-title-width\)\) \/ 2\)/);
  assert.doesNotMatch(title, /(^|[\s;])width:/);
  assert.equal(token('--site-post-title-width'), '84%');
});

test('post_author_renders_only_when_the_page_has_one_and_before_the_footer_content', async () => {
  const { postArticle } = await import('./post-article.mjs');
  const base = { id: 'a', title: 'T', route: '/a/', publishedAt: '2026-01-01', description: 'd', html: '<p>x</p>' };
  assert.doesNotMatch(postArticle(base, { detail: true, footer: '<i>f</i>' }), /app-post-author/);
  assert.match(postArticle({ ...base, author: 'A & B' }, { detail: true, footer: '<i>f</i>' }), /<footer class="app-post-footer"><p class="app-post-author">A &amp; B<\/p><i>f<\/i><\/footer>/);
});
