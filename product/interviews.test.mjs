import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { publicInterviews, interviewSection } from './interviews.mjs';
import { clientEntrypoints } from './publication-assets.mjs';

const examples = JSON.parse(readFileSync(new URL('./interview-examples.json', import.meta.url)));

test('interview_examples_are_preview_only_and_empty_public_data_has_no_section', () => {
  assert.equal(publicInterviews(examples, true).length, 5);
  assert.deepEqual(publicInterviews(examples), []);
  assert.equal(interviewSection(publicInterviews(examples)), '');
  const preview = interviewSection(publicInterviews(examples, true));
  assert.doesNotMatch(preview, /실제 인터뷰 발언이 아닙니다|interviews-description/);
  assert.deepEqual(clientEntrypoints(preview), ['flows.js']);
});

test('real_interviews_require_a_source_and_text_is_escaped', () => {
  const entry = { id: 'published', question: '<질문>', quote: 'A & B', source: '공개 인터뷰', url: 'https://example.com/interview' };
  const html = interviewSection(publicInterviews([entry]));
  assert.match(html, /&lt;질문&gt;/);
  assert.match(html, /A &amp; B/);
  assert.match(html, /href="https:\/\/example.com\/interview"/);
  assert.throws(() => publicInterviews([{ ...entry, url: 'javascript:alert(1)' }]), /HTTPS source/);
  assert.throws(() => publicInterviews([entry, entry]), /duplicate/);
  assert.throws(() => publicInterviews([{ ...entry, quote: '' }]), /missing interview quote/);
});
