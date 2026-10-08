// 같은 공개 색인의 압축 전송을 우선하고 읽을 수 없으면 JSON으로 복구한다.

// cost: time O(n), heap O(n), stack O(1), io 최대 2회
// vars: n = 압축 해제된 색인의 바이트 수
// basis: estimate
export async function loadSearchIndex(signal = AbortSignal.timeout(15_000)) {
  if (typeof DecompressionStream === 'function') {
    try {
      return await readIndex('/search-index.json.gz', signal);
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  return readIndex('/search-index.json', signal);
}

// cost: time O(n), heap O(n), stack O(1), io 1회
// vars: n = 압축 해제된 색인의 바이트 수
// basis: estimate
async function readIndex(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`search index unavailable: ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  // 호스트가 Content-Encoding으로 이미 압축을 풀었다면 다시 풀지 않는다.
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const body = isGzip ? new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'), { signal }) : bytes;
  const data = await new Response(body).json();
  signal.throwIfAborted();
  if (!Array.isArray(data?.entries) || !data.tags || typeof data.tags !== 'object') {
    throw new Error(`invalid search index: ${url}`);
  }
  return data;
}
