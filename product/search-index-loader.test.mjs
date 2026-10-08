import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';

import { loadSearchIndex } from './search-index-loader.mjs';

// #63: 압축 전송의 성패와 관계없이 본문이 포함된 같은 색인을 반환한다.
const INDEX = { entries: [{ id: 'a', title: '검색', text: '본문만의 키워드', tags: ['search'] }], tags: { search: { label: '검색' } } };

test('loadSearchIndex_gzip_or_host_decoded_returns_complete_index', async context => {
  for (const body of [gzipSync(JSON.stringify(INDEX)), JSON.stringify(INDEX)]) {
    const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response(body));
    assert.deepEqual(await loadSearchIndex(), INDEX);
    assert.equal(fetchMock.mock.calls.length, 1);
    assert.equal(fetchMock.mock.calls[0].arguments[0], '/search-index.json.gz');
    fetchMock.mock.restore();
  }
});

test('loadSearchIndex_failed_compressed_response_falls_back_with_same_deadline', async context => {
  for (const response of [new Response('', { status: 404 }), new Response(new Uint8Array([0x1f, 0x8b, 0])), new Response('{}')]) {
    const fetchMock = context.mock.method(globalThis, 'fetch', async url => url.endsWith('.gz') ? response : new Response(JSON.stringify(INDEX)));
    assert.deepEqual(await loadSearchIndex(), INDEX);
    const calls = fetchMock.mock.calls;
    assert.deepEqual(calls.map(call => call.arguments[0]), ['/search-index.json.gz', '/search-index.json']);
    assert.equal(calls[0].arguments[1].signal, calls[1].arguments[1].signal);
    fetchMock.mock.restore();
  }
});

test('loadSearchIndex_unsupported_browser_requests_json_directly', async context => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'DecompressionStream');
  Object.defineProperty(globalThis, 'DecompressionStream', { configurable: true, value: undefined });
  try {
    const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(INDEX)));
    assert.deepEqual(await loadSearchIndex(), INDEX);
    assert.deepEqual(fetchMock.mock.calls.map(call => call.arguments[0]), ['/search-index.json']);
  } finally {
    Object.defineProperty(globalThis, 'DecompressionStream', descriptor);
  }
});

test('loadSearchIndex_total_failure_rejects_and_next_attempt_can_succeed', async context => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => { throw new TypeError('network failed'); });
  await assert.rejects(loadSearchIndex(), /network failed/);
  assert.equal(fetchMock.mock.calls.length, 2);
  fetchMock.mock.restore();
  context.mock.method(globalThis, 'fetch', async () => new Response(gzipSync(JSON.stringify(INDEX))));
  assert.deepEqual(await loadSearchIndex(), INDEX);
});

test('loadSearchIndex_abort_during_body_does_not_start_fallback', async context => {
  const controller = new AbortController();
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    async arrayBuffer() { controller.abort(); throw controller.signal.reason; },
  }));
  await assert.rejects(loadSearchIndex(controller.signal), { name: 'AbortError' });
  assert.equal(fetchMock.mock.calls.length, 1);
});
