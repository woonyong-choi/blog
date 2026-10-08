// 댓글 서비스는 본문을 가로막지 않고 영역에 가까워졌을 때만 연결한다.
const section = document.querySelector('[data-comments]');
if (section) {
  const status = section.querySelector('[data-comments-status]');
  const retry = section.querySelector('[data-comments-retry]');
  const container = section.querySelector('.giscus');
  let loaded = false; let failed = false; let timeout; let commentCount;
  function fail() { failed = true; clearTimeout(timeout); status.textContent = '댓글을 불러오지 못했습니다. 다시 시도하거나 GitHub에서 열어 주세요.'; retry.hidden = false; }
  function load() {
    if (loaded) return;
    loaded = true; failed = false; retry.hidden = true; status.textContent = '댓글을 불러오고 있습니다.';
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js'; script.async = true; script.crossOrigin = 'anonymous';
    for (const [name, value] of Object.entries(section.dataset)) if (name !== 'comments') script.dataset[name] = value;
    script.addEventListener('error', fail);
    // 네트워크 응답이 끝나지 않는 경우 재시도 경로를 남긴다.
    timeout = setTimeout(fail, 15000);
    container.append(script);
  }
  retry.addEventListener('click', () => {
    failed = false;
    const frame = container.querySelector('iframe');
    if (frame) { retry.hidden = true; status.textContent = '댓글을 다시 불러오고 있습니다.'; frame.src = frame.src; timeout = setTimeout(fail, 15000); }
    else { container.replaceChildren(); loaded = false; load(); }
  });
  window.addEventListener('message', event => {
    const frame = container.querySelector('iframe');
    if (event.origin !== 'https://giscus.app' || event.source !== frame?.contentWindow || !event.data?.giscus) return;
    const data = event.data.giscus;
    if (data.error) {
      if (data.error.includes('Discussion not found')) { commentCount = 0; clearTimeout(timeout); status.textContent = '첫 댓글을 남겨 주세요. 작성하면 이 글의 토론이 생성됩니다.'; retry.hidden = true; }
      else fail();
      return;
    }
    if ('discussion' in data || data.resizeHeight && !failed) {
      clearTimeout(timeout); retry.hidden = true;
      if ('discussion' in data) { failed = false; commentCount = data.discussion?.totalCommentCount ?? 0; }
      status.textContent = commentCount === 0 ? '첫 댓글을 남겨 주세요. GitHub 계정으로 로그인할 수 있습니다.' : 'GitHub 계정으로 댓글과 답글을 작성할 수 있습니다.';
      if (data.discussion?.url?.startsWith(`https://github.com/${section.dataset.repo}/discussions/`)) section.querySelector('[data-discussion-link]').href = data.discussion.url;
    }
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); } }, { rootMargin: '100% 0px' });
    observer.observe(section);
  } else load();
}
