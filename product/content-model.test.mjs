import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readDocument, publicDocuments, blogDocuments, paginate, PAGE_SIZES } from './content-model.mjs';

const TAGS = { javascript: { label: 'JavaScript', aliases: ['JS'] } };
function source(changes = {}) {
  const page = { id: 'a', slug: 'a', title: '글', description: '설명', type: 'blog', tags: ['javascript'], field: 'languages', topic: 'javascript', contentIcon: { name: 'document' }, comments: true, visibility: 'public', publishedAt: '2026-01-01', ...changes };
  return `---\n${JSON.stringify(page)}\n---\n## 본문\n내용`;
}

test('publication_contract_excludes_drafts_and_future_posts', () => {
  const now = new Date('2026-10-08');
  const documents = [{}, { id: 'b', slug: 'b', visibility: 'draft' }, { id: 'c', slug: 'c', publishedAt: '2027-01-01' }].map(change => readDocument(source(change), TAGS, now));
  assert.deepEqual(publicDocuments(documents).map(page => page.id), ['a']);
  assert.throws(() => publicDocuments([documents[0], documents[0]]), /duplicate/);
});

test('publication_contract_rejects_missing_comments_invalid_dates_and_tags', () => {
  for (const invalid of [{ comments: false }, { publishedAt: '2026-02-30' }, { tags: ['unknown'] }, { updatedAt: '2025-01-01' }, { thumbnail: { src: '/media/../secret.svg', alt: '' } }]) {
    assert.throws(() => readDocument(source(invalid), TAGS));
  }
});

test('blog_pagination_keeps_all_posts_at_approved_boundaries', () => {
  assert.deepEqual(PAGE_SIZES, { preview: 3, cards: 12, feed: 4, search: 12 });
  for (const count of [0, 1, 3, 4, 5, 8, 9, 12, 13]) {
    const items = Array.from({ length: count }, (_, id) => id);
    for (const size of [4, 12]) {
      const result = Array.from({ length: Math.max(1, Math.ceil(count / size)) }, (_, i) => paginate(items, i + 1, size).items).flat();
      assert.deepEqual(result, items);
    }
  }
});

test('blog_order_uses_publication_date_instead_of_update_date', () => {
  const documents = [{ id: 'b', publishedAt: '2026-01-01', updatedAt: '2026-10-01' }, { id: 'a', publishedAt: '2026-01-01' }, { id: 'c', publishedAt: '2026-02-01' }].map(page => ({ type: 'blog', ...page }));
  assert.deepEqual(blogDocuments(documents).map(page => page.id), ['c', 'a', 'b']);
});
