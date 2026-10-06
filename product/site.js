// 정적 문서의 독립적인 상호작용을 연결한다.
for (const gallery of document.querySelectorAll('[data-gallery]')) {
  const buttons = [...gallery.querySelectorAll('[data-slide-index]')];
  const slides = [...gallery.querySelectorAll('[data-slide]')];
  const select = (index, focus = false) => {
    slides.forEach((slide, at) => { slide.classList.toggle('is-selected', at === index); slide.setAttribute('aria-hidden', String(at !== index)); });
    buttons.forEach((button, at) => button.setAttribute('aria-pressed', String(at === index)));
    if (focus) buttons[index].focus();
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      select(next, true);
    });
  });
}
for (const tabs of document.querySelectorAll('[data-tabs]')) {
  const buttons = [...tabs.querySelectorAll(':scope > [role=tablist] > button')];
  const panels = [...tabs.querySelectorAll(':scope > [role=tabpanel]')];
  const select = (index) => {
    buttons.forEach((button, at) => { button.setAttribute('aria-selected', String(at === index)); button.tabIndex = at === index ? 0 : -1; });
    panels.forEach((panel, at) => { panel.hidden = at !== index; if (panel.hidden) panel.querySelectorAll('video').forEach((video) => video.pause()); });
  };
  if (tabs.hasAttribute('data-platform')) {
    function selectPlatform(label) {
      const at = buttons.findIndex(button => button.textContent.toLowerCase().includes(label.toLowerCase()));
      if (at >= 0) select(at);
    }
    tabs.addEventListener('platform-select', event => selectPlatform(event.detail));
    const platform = new URLSearchParams(location.search).get('platform');
    if (platform) selectPlatform(platform);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      select(index);
      if (tabs.hasAttribute('data-platform')) {
        const later = [...document.querySelectorAll('[data-platform]')];
        later.slice(later.indexOf(tabs) + 1).forEach(next => next.dispatchEvent(new CustomEvent('platform-select', { detail: button.textContent })));
      }
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      select(next); buttons[next].focus();
    });
  });
}
for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent); button.textContent = 'Copied'; }
  catch { button.textContent = '복사 실패 — 코드를 선택하세요'; }
});
for (const check of document.querySelectorAll('[data-demo-verify]')) check.addEventListener('change', () => { check.form.querySelector('[data-verified-submit]').disabled = !check.checked; });
for (const form of document.querySelectorAll('[data-demo-form]')) form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  form.querySelector('[data-form-status]').textContent = '입력 형식을 확인했습니다. 외부로 전송하지 않았습니다.';
});
// 원본의 거리 비례 스크롤과 swing 곡선을 사용한다.
let scrollFrame;
function revealVideo(element, downward = false) {
  const rect = element.getBoundingClientRect();
  const viewport = window.innerHeight;
  if ((rect.top >= 0 && rect.bottom <= viewport) || (rect.top < 0 && rect.bottom > viewport)) return;
  const partial = (rect.top < 0 && rect.bottom > 0) || (rect.top < viewport && rect.bottom > viewport);
  if (partial && !downward) return;
  const style = getComputedStyle(document.body);
  const margin = parseFloat(style.getPropertyValue('--site-scroll-margin'));
  const speed = parseFloat(style.getPropertyValue('--site-scroll-speed'));
  const maximumMs = parseFloat(style.getPropertyValue('--site-scroll-duration'));
  const start = window.scrollY;
  const end = Math.max(0, Math.min(start + (partial ? rect.bottom - viewport + margin : rect.top - margin), document.documentElement.scrollHeight - viewport));
  const distance = end - start;
  const durationMs = Math.min(Math.abs(distance / speed * 1000), maximumMs);
  cancelAnimationFrame(scrollFrame);
  if (!durationMs || matchMedia('(prefers-reduced-motion: reduce)').matches) { window.scrollTo({ top: end, behavior: 'instant' }); return; }
  const started = performance.now();
  function frame(now) {
    const progress = Math.min((now - started) / durationMs, 1);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    window.scrollTo({ top: start + distance * eased, behavior: 'instant' });
    if (progress < 1) scrollFrame = requestAnimationFrame(frame);
  }
  scrollFrame = requestAnimationFrame(frame);
}
for (const event of ['wheel', 'touchstart', 'pointerdown']) window.addEventListener(event, () => cancelAnimationFrame(scrollFrame), { passive: true });

function updateRemote(button, video, selected = true) {
  const playing = selected && !video.paused;
  const ended = selected && video.ended;
  button.classList.toggle('is-playing', playing);
  button.setAttribute('aria-label', playing ? 'Pause video' : ended ? 'Replay video' : 'Play video');
  button.querySelector('img').src = `/things/assets/remotecontrol-${playing ? 'pause-gray' : ended ? 'replay' : 'play'}.svg`;
}
for (const root of document.querySelectorAll('[data-player]')) {
  const video = root.querySelector('video');
  const controls = [...document.querySelectorAll('[data-remote]')].filter(button => button.dataset.remote === root.id);
  const status = root.querySelector('[role=status]');
  async function toggle(button) {
    const next = button?.dataset.videoSrc;
    const changed = next && new URL(next, location.href).href !== video.currentSrc;
    if (changed) { video.src = next; video.load(); }
    if (!changed && !video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    try { await video.play(); status.textContent = ''; revealVideo(root); }
    catch { status.textContent = '영상을 재생하지 못했습니다. 다시 눌러 주세요.'; }
  }
  root.querySelector('[data-player-play]')?.addEventListener('click', () => toggle());
  controls.forEach(button => button.addEventListener('click', () => toggle(button)));
  for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, () => {
    root.classList.toggle('is-playing', !video.paused);
    if (!video.paused) { root.classList.add('has-played'); if (video.hasAttribute('data-native-controls')) video.controls = true; }
    controls.forEach(button => updateRemote(button, video, !button.dataset.videoSrc || new URL(button.dataset.videoSrc, location.href).href === video.currentSrc));
  });
}
const introButton = document.querySelector('[data-intro-play]');
if (introButton) {
  const container = document.querySelector('[data-intro-cinema]');
  const video = container.querySelector('video');
  introButton.addEventListener('click', async () => {
    container.hidden = false;
    revealVideo(container, true);
    if (!video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    try { await video.play(); }
    catch { container.querySelector('[role=status]').textContent = '아래 영상의 재생 버튼을 눌러 주세요.'; }
  });
  for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, () => updateRemote(introButton, video));
}
const reviewNext = document.querySelector('[data-review-next]');
if (reviewNext) {
  const pages = [...document.querySelectorAll('[data-review-page]')];
  const previous = document.querySelector('[data-review-previous]');
  let selected = 0;
  let append = false;
  function updateReviews() {
    pages.forEach((page, index) => { page.hidden = append ? index > selected : index !== selected; });
    previous.hidden = append;
    previous.disabled = selected === 0;
    reviewNext.disabled = selected === pages.length - 1;
    reviewNext.textContent = append ? 'Show More Posts' : 'Next Posts →';
    reviewNext.setAttribute('aria-label', append ? 'Show More Posts' : 'Next Posts');
    document.querySelector('[data-review-status]').textContent = `${selected + 1} / ${pages.length}`;
  }
  function resizeReviews() {
    const nextAppend = window.innerWidth < parseFloat(getComputedStyle(document.body).getPropertyValue('--breakpoint-review-append'));
    if (append !== nextAppend) selected = 0;
    append = nextAppend;
    updateReviews();
  }
  reviewNext.addEventListener('click', () => { selected = Math.min(selected + 1, pages.length - 1); updateReviews(); });
  previous.addEventListener('click', () => { selected = Math.max(0, selected - 1); updateReviews(); });
  window.addEventListener('resize', resizeReviews);
  resizeReviews();
}
for (const search of document.querySelectorAll('[data-search]')) {
  const input = search.querySelector('input');
  const results = search.querySelector('[data-results]');
  const clear = search.querySelector('[data-clear]');
  let indexPromise;
  let revision = 0;
  let searchTimer;
  const update = async () => {
    const request = ++revision;
    const query = input.value.trim().toLocaleLowerCase();
    clear.hidden = !query;
    if (!query) { results.hidden = true; results.replaceChildren(); return; }
    results.hidden = false;
    if (query.length < 2) { results.textContent = 'Keep typing…'; return; }
    results.textContent = 'Searching…';
    try {
      indexPromise ??= fetch('/things/search-index.json').then((response) => { if (!response.ok) throw new Error('search'); return response.json(); });
      const entries = await indexPromise;
      if (request !== revision) return;
      const matches = entries.filter((entry) => query.split(/\s+/).every((part) => `${entry.title} ${entry.keywords} ${entry.text}`.toLocaleLowerCase().includes(part))).slice(0, 12);
      results.replaceChildren();
      if (!matches.length) results.textContent = 'No matching articles. Try “Markdown”, “Cloud”, or “Siri”.';
      for (const entry of matches) {
        const link = document.createElement('a');
        link.href = entry.route;
        const icon = document.createElement('span');
        icon.className = `app-article-icon app-icon-${entry.icon}`;
        icon.setAttribute('aria-hidden', 'true');
        const title = document.createElement('strong');
        title.textContent = entry.title;
        const description = document.createElement('span');
        description.textContent = entry.description;
        link.append(icon, title, description);
        results.append(link);
      }
    } catch { indexPromise = undefined; results.textContent = '검색 색인을 불러오지 못했습니다. 다시 입력해 주세요.'; }
  };
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    revision += 1;
    searchTimer = setTimeout(update, parseFloat(getComputedStyle(search).getPropertyValue('--site-search-delay')));
  });
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  search.querySelectorAll('[data-query]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.query; update(); input.focus(); }));
  input.addEventListener('keydown', (event) => { if (event.key === 'Escape') { input.value = ''; update(); } if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('a')?.focus(); } });
}
