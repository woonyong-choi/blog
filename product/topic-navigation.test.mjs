import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTopicTrees } from './topic-navigation.mjs';
import { articlePage } from './publication-layout.mjs';

function page(slug, parent, changes = {}) {
  return { id: slug, slug, parent, topic: 'python', type: 'wiki', title: slug,
    route: `/articles/${slug}/`, tags: ['python'], description: '', html: '',
    headings: [], contentIcon: { name: 'python' }, ...changes };
}

// #57: 루트만 순회하면 순환 문서가 사라져도 정상 발행으로 처리된다.
test('createTopicTrees_rejects_self_mutual_and_disconnected_cycles', () => {
  for (const pages of [
    [page('a', 'a')],
    [page('a', 'b'), page('b', 'a')],
    [page('root'), page('a', 'b'), page('b', 'c'), page('c', 'a'), page('child', 'a')],
  ]) assert.throws(() => createTopicTrees(pages), /cyclic topic navigation: python \(a/);
  assert.throws(() => createTopicTrees([page('a'), page('a')]), /duplicate navigation slug/);
});

test('createTopicTrees_keeps_external_roots_order_and_blog_identity_once', () => {
  const pages = [page('a', 'unpublished'), page('b', 'a'),
    page('c', 'b', { type: 'blog' }), page('d', 'c'), page('e', 'b'),
    page('foreign', undefined, { topic: 'javascript' }), page('f', 'foreign')];
  const topicTrees = createTopicTrees(pages);
  const tree = topicTrees.get('python');
  assert.deepEqual(tree.map(node => node.page.slug), ['a', 'f']);
  assert.deepEqual(tree[0].children[0].children.map(node => node.page.slug), ['c', 'd', 'e']);
  assert.strictEqual(tree[0].children[0].children[0].page, pages[2]);
  const html = articlePage(pages[1], pages, { topicTrees, topics: { python: { label: 'Python' } } });
  const navigation = html.match(/<details class="app-document-nav"[\s\S]*?<\/nav><\/details>/)[0];
  assert.match(navigation, /^<details class="app-document-nav">/);
  assert.deepEqual([...navigation.matchAll(/href="\/articles\/([^/]+)\/"/g)].map(match => match[1]), ['a', 'b', 'c', 'd', 'e', 'f']);
  assert.equal((navigation.match(/aria-current="page"/g) ?? []).length, 1);
  assert.equal(pages[2].type, 'blog');
});

test('createTopicTrees_flattens_deep_input_without_losing_nodes_or_using_call_stack', () => {
  const pages = Array.from({ length: 10000 }, (_, i) => page(`p-${i}`, i ? `p-${i - 1}` : null));
  const roots = createTopicTrees(pages).get('python');
  assert.equal(roots.length, 1);
  assert.equal(roots[0].children.length, 1);
  const deepest = roots[0].children[0].children;
  assert.equal(deepest.length, pages.length - 2);
  assert.deepEqual(deepest.map(node => node.page.slug), pages.slice(2).map(page => page.slug));
  assert.ok(deepest.every(node => node.children.length === 0));
});
