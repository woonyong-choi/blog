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
    assert.deepEqual(Object.keys(entry).sort(), ['company', 'example', 'id', 'role', 'summary']);
    assert.equal(entry.company, '예시 회사');
    assert.equal(entry.example, true);
  }
});

test('interview_text_is_escaped_and_mixed_lists_mark_examples', () => {
  const entry = { id: 'a', summary: '<요약> & 내용', company: '<회사>', role: '직무' };
  const html = interviewCards(publicInterviews([entry, { ...examples[0] }], true));
  assert.match(html, /&lt;요약&gt; &amp; 내용/);
  assert.match(html, /&lt;회사&gt;/);
  assert.match(html, /<span>구성 예시<\/span>/);
  assert.doesNotMatch(interviewCards([entry]), /구성 예시/);
});
