import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { publicInterviews, interviewCards } from './interviews.mjs';

const examples = JSON.parse(readFileSync(new URL('./interview-examples.json', import.meta.url)));

test('interview_examples_are_five_static_company_placeholders_shown_only_in_preview', () => {
  assert.equal(publicInterviews(examples, true).length, 5);
  assert.deepEqual(publicInterviews(examples), []);
  for (const entry of examples) {
    assert.equal(entry.example, true);
    assert.deepEqual([entry.profile.title, entry.profile.subtitle], ['회사명', '직무']);
  }
  assert.ok(examples.some(entry => entry.profile.image) && examples.some(entry => !entry.profile.image));
});

test('profile_title_subtitle_and_image_are_escaped_and_the_url_links_only_the_title', () => {
  const html = interviewCards([{ id: 'a', summary: '<요약> & 내용', url: 'https://example.com/a?x=1&y=2', profile: { image: { src: '/assets/a.png', alt: '"로고"' }, title: '<회사>', subtitle: '직무 & 팀' } }]);
  assert.match(html, /&lt;요약&gt; &amp; 내용/);
  assert.match(html, /<a href="https:\/\/example\.com\/a\?x=1&amp;y=2">&lt;회사&gt;<\/a>/);
  assert.match(html, /alt="&quot;로고&quot;"/);
  assert.match(html, /<span>직무 &amp; 팀<\/span>/);
  assert.equal((html.match(/<a /g) ?? []).length, 1);
});

test('cards_without_image_or_profile_leave_no_empty_slot', () => {
  const [titleOnly, summaryOnly] = interviewCards([{ id: 'a', summary: 's', profile: { title: '제목' } }, { id: 'b', summary: 's' }]).split('</li>');
  assert.match(titleOnly, /<div class="app-interview-meta"><div class="app-interview-lines"><strong>제목<\/strong><\/div><\/div>/);
  assert.doesNotMatch(titleOnly, /app-interview-avatar|<span>|undefined/);
  assert.doesNotMatch(summaryOnly, /app-interview-meta|undefined/);
});
