import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { publicInterviews, interviewCards } from './interviews.mjs';

const examples = JSON.parse(readFileSync(new URL('./interview-examples.json', import.meta.url)));

test('interview_examples_use_the_new_schema_are_dummy_and_preview_only', () => {
  assert.equal(publicInterviews(examples, true).length, 5);
  assert.deepEqual(publicInterviews(examples), []);
  assert.equal(interviewCards(publicInterviews(examples)), '');
  for (const entry of examples) {
    assert.equal(entry.example, true);
    assert.ok(entry.company === '예시 회사' || entry.author);
  }
  assert.equal(examples.filter(entry => entry.author).length, 2);
});

test('interview_text_is_escaped_and_mixed_lists_mark_examples', () => {
  const entry = { id: 'a', summary: '<요약> & 내용', company: '<회사>', role: '직무' };
  const html = interviewCards(publicInterviews([entry, { ...examples[0] }], true));
  assert.match(html, /&lt;요약&gt; &amp; 내용/);
  assert.match(html, /&lt;회사&gt;/);
  assert.match(html, /<span>구성 예시<\/span>/);
  assert.doesNotMatch(interviewCards([entry]), /구성 예시/);
});

test('profile_cards_show_avatar_author_handle_and_date_while_source_and_profile_links_stay_apart', () => {
  const html = interviewCards([{ id: 'a', summary: 's', date: '2026-02-03', author: { name: '이름', handle: '@id', url: 'https://example.com/id', avatar: { src: '/assets/a.png', alt: '' } }, source: { platform: 'GitHub', url: 'https://example.com/post' } }]);
  assert.match(html, /<span class="app-interview-avatar"><img src="\/assets\/a\.png" alt=""[^>]*><\/span>/);
  assert.match(html, /<strong><a href="https:\/\/example\.com\/id">이름<\/a><\/strong> <span>@id<\/span>/);
  assert.match(html, /<time datetime="2026-02-03">2026년 2월 3일<\/time>/);
  assert.match(html, /<a href="https:\/\/example\.com\/post">GitHub →<\/a>/);
  assert.ok(html.indexOf('이름') < html.indexOf('<time') && html.indexOf('<time') < html.indexOf('GitHub'));
});

test('handle_only_company_only_and_summary_only_cards_leave_no_empty_parts', () => {
  const html = interviewCards([
    { id: 'a', summary: 's', author: { handle: '@id' } },
    { id: 'b', summary: 's', company: '회사', role: '직무' },
    { id: 'c', summary: 's' },
    { id: 'd', summary: 's', author: { url: 'https://example.com/id', avatar: { src: '/assets/a.png', alt: '프로필' } } },
  ]).split('</li>');
  assert.match(html[0], /<strong>@id<\/strong>/);
  assert.doesNotMatch(html[0], /app-interview-avatar|<time|undefined/);
  assert.match(html[1], /<strong>회사<\/strong><span>직무<\/span>/);
  assert.doesNotMatch(html[2], /app-interview-meta|undefined/);
  assert.match(html[3], /<a href="https:\/\/example\.com\/id"><img [^>]*alt="프로필"/);
});
