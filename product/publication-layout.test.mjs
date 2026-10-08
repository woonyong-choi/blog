import assert from 'node:assert/strict';
import { test } from 'node:test';
import { knowledgeFields } from './publication-layout.mjs';

test('a_published_topic_stays_reachable_when_its_overview_is_unpublished', () => {
  const topics = { javascript: { label: 'JavaScript', field: 'languages', icon: 'javascript', article: 'javascript' } };
  const documents = [{ id: 'b', slug: 'promises', route: '/articles/promises/', topic: 'javascript', type: 'wiki', title: 'Promise', description: '비동기 작업', contentIcon: { name: 'runtime' } }];
  const html = knowledgeFields(documents, topics);
  assert.match(html, /href="\/articles\/promises\/"/);
  assert.match(html, /<h3>JavaScript<\/h3>/);
  assert.doesNotMatch(html, /href="\/articles\/javascript\/"/);
});
