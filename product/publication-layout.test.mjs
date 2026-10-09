import assert from 'node:assert/strict';
import { test } from 'node:test';
import { knowledgeFields, wikiLanding, tagPage } from './publication-layout.mjs';

test('a_published_topic_stays_reachable_when_its_overview_is_unpublished', () => {
  const topics = { javascript: { label: 'JavaScript', field: 'languages', icon: 'javascript', article: 'javascript' } };
  const documents = [{ id: 'b', slug: 'promises', route: '/articles/promises/', topic: 'javascript', type: 'wiki', title: 'Promise', description: '비동기 작업', contentIcon: { name: 'runtime' } }];
  const html = knowledgeFields(documents, topics);
  assert.match(html, /href="\/articles\/promises\/"/);
  assert.match(html, /role="heading" aria-level="3">JavaScript<\/strong>/);
  assert.doesNotMatch(html, /href="\/articles\/javascript\/"/);
});

// #67: 전체 태그 목록은 아직 조건을 계산하지 않은 검색 결과와 분리한다.
test('tag_page_keeps_static_reading_separate_from_filtered_results', () => {
  const tags = { javascript: { label: 'JavaScript' } };
  const entry = { route: '/articles/promises/', title: 'Promise', description: '비동기 작업', type: 'wiki', tags: ['javascript'], contentIcon: { name: 'runtime' } };
  const html = tagPage('javascript', [entry], tags);
  assert.match(html, /<div data-full-results><\/div>/);
  assert.match(html, /<details class="app-details" data-search-fallback><summary>이 태그의 모든 글 보기<\/summary>/);
  const fallback = html.slice(html.indexOf('<details class="app-details" data-search-fallback>'));
  assert.match(fallback, /href="\/articles\/promises\/"/);
  assert.doesNotMatch(html.slice(0, html.indexOf('<details class="app-details" data-search-fallback>')), /href="\/articles\/promises\/"/);
  assert.match(tagPage('javascript', [], tags), /이 태그로 발행한 글이 없습니다/);
});

test('topic_preview_uses_three_columns_and_six_items_without_a_wiki_heading', () => {
  for (const count of [0, 1, 6, 7]) {
    const documents = Array.from({ length: count }, (_, i) => ({ id: `p${i}`, slug: `p${i}`, route: `/articles/p${i}/`, topic: `t${i}`, type: 'wiki', title: `주제 ${i}`, description: '내용', contentIcon: { name: 'processor' } }));
    const topics = Object.fromEntries(documents.map((p, i) => [`t${i}`, { field: 'cs', icon: 'processor', label: p.title, article: p.slug }]));
    const preview = wikiLanding(documents, { topics });
    assert.equal((preview.match(/class="app-help-card"/g) ?? []).length, Math.min(count, 6));
    assert.equal(preview.includes('href="/wiki/cs/"'), count > 6);
    assert.doesNotMatch(preview, /wiki-heading|>Wiki<|is-pair/);
    const all = wikiLanding(documents, { topics }, 'cs');
    assert.equal((all.match(/class="app-help-card"/g) ?? []).length, count);
    assert.doesNotMatch(all, /<h2>CS<\/h2>/);
  }
});
