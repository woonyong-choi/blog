const reviews = [
  ['복잡한 상황에서도 핵심을 정리하고, 실행할 수 있는 다음 단계를 제안해 주었습니다.', '동료 A', '함께 문제를 푸는 방식'],
  ['기술적인 구현을 넘어, 왜 필요한지부터 함께 고민하는 모습이 인상적이었습니다.', '동료 B', '문제를 바라보는 시선'],
  ['혼자 해결하기 어려운 문제도 편하게 이야기할 수 있었습니다. 열린 태도로 소통해 주었습니다.', '동료 C', '함께 일하는 경험'],
  ['끝까지 확인하고 작은 부분까지 개선하는 태도가 팀에 좋은 기준이 되어 주었습니다.', '동료 D', '결과를 만드는 태도'],
];
const films = [
  ['아이디어가 실제가 되기까지', '발표 · 예시 영상', 'FROM IDEA\nTO SOMETHING REAL'],
  ['복잡한 문제를 함께 풀어가는 방법', '인터뷰 · 예시 영상', 'THINK CLEAR.\nBUILD TOGETHER.'],
  ['만들고, 배우고, 다시 만들고', '데모 · 예시 영상', 'MAKE. LEARN.\nMAKE IT BETTER.'],
];
const quoteGroup = document.querySelector('#quotes');
const filmGroup = document.querySelector('#film-cards');
quoteGroup.innerHTML = reviews.map(([quote, name, role], index) => `<button type="button" class="docs-landing-quote" data-quote="${index}"><span class="docs-landing-example">예시 평가</span><blockquote>“${quote}”</blockquote><span class="docs-landing-person"><span class="docs-landing-avatar">${name.slice(-1)}</span><span><strong>${name} · 시안</strong><small>${role}</small></span><span aria-hidden="true">↗</span></span></button>`).join('');
filmGroup.innerHTML = films.map(([title, kind, poster], index) => `<button type="button" class="docs-landing-film" data-film="${index}"><span class="docs-landing-film-frame"><video muted loop playsinline preload="metadata" poster="/landing/assets/film-${index}.jpg" src="/landing/assets/film-${index}.mp4"></video><span class="docs-landing-poster-title">${poster.replace('\n', '<br>')}</span><span class="docs-landing-play" aria-hidden="true">▶</span><span class="docs-landing-film-corner">6초 모션 샘플</span></span><strong>${title}</strong><span>${kind}</span></button>`).join('');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const globalToggle = document.querySelector('#motion-toggle');
const filmDialog = document.querySelector('#film-dialog');
const quoteDialog = document.querySelector('#quote-dialog');
const fullFilm = document.querySelector('#full-film');
let userPaused = false;
let lastOpener;
const rails = [...document.querySelectorAll('[data-rail]')].map(rail => {
  const group = rail.querySelector('.docs-landing-group');
  const duplicate = group.cloneNode(true);
  duplicate.removeAttribute('id');
  for (const button of duplicate.querySelectorAll("button")) button.tabIndex = -1;
  duplicate.setAttribute('aria-hidden', 'true');
  rail.querySelector('.docs-landing-track').append(duplicate);
  const state = { rail, visible: false, paused: false, hovered: false, focused: false };
  rail.addEventListener('mouseenter', () => { state.hovered = true; syncMotion(); });
  rail.addEventListener('mouseleave', () => { state.hovered = false; syncMotion(); });
  rail.addEventListener('focusin', () => { state.focused = true; syncMotion(); });
  rail.addEventListener('focusout', event => { state.focused = rail.contains(event.relatedTarget); syncMotion(); });
  return state;
});
const previews = [...document.querySelectorAll('video:not(#full-film)')];
const visibleVideos = new Set();
function syncMotion() {
  const stopped = userPaused || reducedMotion.matches || document.hidden || filmDialog.open || quoteDialog.open;
  globalToggle.setAttribute('aria-pressed', String(userPaused));
  globalToggle.textContent = userPaused ? '▶ 전체 움직임 재개' : reducedMotion.matches ? '움직임 감소 설정 적용 중' : 'Ⅱ 전체 움직임 멈추기';
  for (const state of rails) {
    state.rail.classList.toggle('is-paused', stopped || state.paused || state.hovered || state.focused || !state.visible);
    state.rail.classList.toggle('is-static', reducedMotion.matches);
  }
  for (const video of previews) {
    if (stopped || !visibleVideos.has(video)) video.pause();
    else video.play().catch(() => video.closest('button')?.classList.add('has-playback-fallback'));
  }
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const state = rails.find(item => item.rail === entry.target);
    if (state) state.visible = entry.isIntersecting;
    else if (entry.isIntersecting) visibleVideos.add(entry.target);
    else visibleVideos.delete(entry.target);
  }
  syncMotion();
});
for (const target of [...previews, ...rails.map(item => item.rail)]) observer.observe(target);
globalToggle.addEventListener('click', () => { userPaused = !userPaused; syncMotion(); });
document.addEventListener('visibilitychange', syncMotion);
reducedMotion.addEventListener('change', syncMotion);
for (const controls of document.querySelectorAll('[data-controls]')) {
  const state = rails.find(item => item.rail.dataset.rail === controls.dataset.controls);
  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const pause = controls.querySelector('[data-pause]');
    state.paused = button.hasAttribute('data-step') || !state.paused;
    pause.textContent = state.paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-pressed', String(state.paused));
    pause.setAttribute('aria-label', `${state.rail.dataset.rail === 'quotes' ? '평가' : '영상'} 띠 ${state.paused ? '재개' : '일시정지'}`);
    if (button.dataset.step) {
      const group = state.rail.querySelector('.docs-landing-group');
      const animation = state.rail.querySelector('.docs-landing-track').getAnimations()[0];
      if (animation) {
        const duration = animation.effect.getTiming().duration;
        const count = group.children.length;
        animation.currentTime = (Number(animation.currentTime) + Number(button.dataset.step) * duration / count + duration) % duration;
      } else state.rail.scrollBy({ left: Number(button.dataset.step) * group.firstElementChild.getBoundingClientRect().width, behavior: 'instant' });
    }
    syncMotion();
  });
}
document.addEventListener('click', event => {
  const film = event.target.closest('[data-film]');
  const quote = event.target.closest('[data-quote]');
  if (!film && !quote) return;
  lastOpener = film || quote;
  if (film) {
    const index = Number(film.dataset.film);
    document.querySelector('#film-title').textContent = films[index][0];
    fullFilm.src = `/landing/assets/film-${index}.mp4`;
    fullFilm.poster = `/landing/assets/film-${index}.jpg`;
    filmDialog.showModal();
    fullFilm.play().catch(() => {});
  } else {
    document.querySelector('#quote-text').textContent = reviews[Number(quote.dataset.quote)][0];
    quoteDialog.showModal();
  }
  syncMotion();
});
for (const [dialog, closer] of [[filmDialog, '#close-film'], [quoteDialog, '#close-quote']]) {
  document.querySelector(closer).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { fullFilm.pause(); lastOpener?.focus(); syncMotion(); });
}
for (const video of previews) video.addEventListener('error', () => video.closest('button')?.classList.add('has-playback-fallback'));
syncMotion();
