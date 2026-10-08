import test from 'node:test';
import assert from 'node:assert/strict';
import { commentsSection } from './comments.mjs';

const config = { repo: 'owner/blog', repoId: 'repo-id', category: 'Comments', categoryId: 'category-id' };
test('댓글은 글 제목과 URL이 바뀌어도 고정 문서 ID로 연결한다', () => {
  const original = commentsSection({ id: 'stable-id', title: '제목', comments: true }, config, 'https://example.com/theme.css');
  const moved = commentsSection({ id: 'stable-id', title: '바뀐 제목', route: '/new/', comments: true }, config, 'https://example.com/theme.css');
  assert.equal(original, moved);
  assert.match(original, /data-mapping="specific" data-term="stable-id" data-strict="1"/);
  assert.match(original, /data-reactions-enabled="0"/);
  assert.equal(commentsSection({ comments: false }, config, ''), '');
  assert.throws(() => commentsSection({ comments: true }, {}, ''), /missing comments/);
});
