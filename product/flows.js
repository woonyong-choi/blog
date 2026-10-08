// 읽기와 직접 탐색을 우선하고 화면 안에서만 카드 흐름을 진행한다.
for (const rail of document.querySelectorAll('[data-flow-rail]')) {
  const viewport = rail.querySelector('[data-flow-viewport]');
  const group = rail.querySelector('[data-flow-group]');
  const controls = rail.querySelector('[data-flow-controls]');
  const toggle = rail.querySelector('[data-flow-toggle]');
  const direction = rail.dataset.flowDirection === 'right' ? -1 : 1;
  const label = rail.dataset.flowLabel;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let clone; let distance = 0; let position = 0; let frame; let last;
  let paused = false; let hovering = false; let focused = false; let visible = false;
  const durationValue = getComputedStyle(rail).getPropertyValue('--site-motion-rail').trim();
  const duration = parseFloat(durationValue) * (durationValue.endsWith('ms') ? 1 : 1000) * 2;

  function update() {
    cancelAnimationFrame(frame); last = undefined;
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-label', `${label} ${reduced.matches ? '자동 흐름 꺼짐' : paused ? '흐름 다시 시작' : '흐름 멈추기'}`);
    toggle.textContent = reduced.matches ? '자동 흐름 꺼짐' : paused ? '흐름 다시 시작' : '흐름 멈추기';
    if (distance && !paused && !hovering && !focused && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (last !== undefined) {
      position = ((position + direction * (now - last) * distance / duration) % distance + distance) % distance;
      viewport.scrollLeft = position;
    }
    last = now; frame = requestAnimationFrame(tick);
  }
  function measure() {
    const progress = distance ? viewport.scrollLeft / distance : 0;
    clone?.remove(); clone = undefined;
    const gap = parseFloat(getComputedStyle(viewport).columnGap) || 0;
    distance = group.scrollWidth > viewport.clientWidth ? group.getBoundingClientRect().width + gap : 0;
    controls.hidden = !distance;
    if (distance) {
      clone = group.cloneNode(true); clone.removeAttribute('data-flow-group');
      clone.setAttribute('aria-hidden', 'true'); clone.inert = true;
      viewport.append(clone);
      position = paused || reduced.matches ? Math.floor(progress * group.children.length) * distance / group.children.length : progress * distance;
      viewport.scrollLeft = position;
    }
    update();
  }
  function stop() { paused = true; position = viewport.scrollLeft; update(); }
  function step(direction) {
    if (!distance) return;
    stop();
    const cards = group.children;
    const width = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : group.clientWidth;
    const current = viewport.scrollLeft / width;
    const index = direction > 0 ? Math.floor(current) + 1 : Math.ceil(current) - 1;
    position = ((index + cards.length) % cards.length) * width;
    viewport.scrollTo({ left: position, behavior: 'instant' });
  }
  toggle.addEventListener('click', () => { paused = !paused; position = viewport.scrollLeft % distance; update(); });
  rail.querySelector('[data-flow-prev]').addEventListener('click', () => step(-1));
  rail.querySelector('[data-flow-next]').addEventListener('click', () => step(1));
  viewport.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; update(); } });
  viewport.addEventListener('pointerleave', () => { hovering = false; update(); });
  viewport.addEventListener('pointerdown', stop);
  viewport.addEventListener('wheel', stop, { passive: true });
  viewport.addEventListener('focusin', () => { focused = true; update(); });
  viewport.addEventListener('focusout', () => { focused = false; position = distance ? viewport.scrollLeft % distance : 0; update(); });
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); }
  });
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); last = undefined; });
  window.addEventListener('pageshow', update);
  new ResizeObserver(measure).observe(viewport);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(viewport);
}
