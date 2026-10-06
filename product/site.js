// 정적 문서의 독립적인 상호작용을 연결한다.
for (const gallery of document.querySelectorAll('[data-gallery]')) {
  const buttons = [...gallery.querySelectorAll('[data-slide-index]')];
  const slides = [...gallery.querySelectorAll('[data-slide]')];
  const select = (index, focus = false) => {
    slides.forEach((slide, at) => { slide.hidden = at !== index; });
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
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
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
for (const form of document.querySelectorAll('[data-demo-form]')) form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  form.querySelector('[data-form-status]').textContent = '입력 형식을 확인했습니다. 외부로 전송하지 않았습니다.';
});
const introButton = document.querySelector('[data-intro-play]');
if (introButton) {
  const container = document.querySelector('[data-intro-cinema]');
  const video = container.querySelector('video');
  introButton.addEventListener('click', async () => {
    container.hidden = false;
    if (video.paused) {
      try { await video.play(); container.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
      catch { container.querySelector('[role=status]').textContent = '아래 영상의 재생 버튼을 눌러 주세요.'; }
    } else video.pause();
  });
  for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, () => {
    introButton.querySelector('span').textContent = video.paused ? 'Watch Introduction Video' : 'Pause Introduction Video';
    introButton.querySelector('img').src = `/things/assets/${video.paused ? 'remotecontrol-play.svg' : 'remotecontrol-pause-gray.svg'}`;
  });
}
const reviewButton = document.querySelector('[data-review-next]');
if (reviewButton) reviewButton.addEventListener('click', () => {
  const pages = [...document.querySelectorAll('[data-review-page]')];
  const visible = pages.findIndex((page) => !page.hidden);
  pages[visible].hidden = true; pages[(visible + 1) % pages.length].hidden = false;
  document.querySelector('[data-review-status]').textContent = `${(visible + 1) % pages.length + 1} / ${pages.length}`;
});
for (const search of document.querySelectorAll('[data-search]')) {
  const input = search.querySelector('input');
  const results = search.querySelector('[data-results]');
  const clear = search.querySelector('[data-clear]');
  let indexPromise;
  let revision = 0;
  const update = async () => {
    const request = ++revision;
    const query = input.value.trim().toLocaleLowerCase();
    clear.hidden = !query;
    if (!query) { results.hidden = true; results.replaceChildren(); return; }
    results.hidden = false;
    results.textContent = 'Searching…';
    try {
      indexPromise ??= fetch('/things/search-index.json').then((response) => { if (!response.ok) throw new Error('search'); return response.json(); });
      const entries = await indexPromise;
      if (request !== revision) return;
      const matches = entries.filter((entry) => query.split(/\s+/).every((part) => `${entry.title} ${entry.keywords} ${entry.text}`.toLocaleLowerCase().includes(part))).slice(0, 12);
      results.replaceChildren();
      if (!matches.length) results.textContent = 'No matching articles. Try “Markdown”, “Cloud”, or “Siri”.';
      for (const entry of matches) { const a = document.createElement('a'); a.href = entry.route; a.textContent = entry.title; results.append(a); }
    } catch { indexPromise = undefined; results.textContent = '검색 색인을 불러오지 못했습니다. 다시 입력해 주세요.'; }
  };
  input.addEventListener('input', update);
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  search.querySelectorAll('[data-query]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.query; update(); input.focus(); }));
  input.addEventListener('keydown', (event) => { if (event.key === 'Escape') { input.value = ''; update(); } if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('a')?.focus(); } });
}
