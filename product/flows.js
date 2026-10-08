// 읽기와 직접 탐색을 우선하고 화면 안에서만 카드 흐름을 진행한다.
for (const rail of document.querySelectorAll('[data-flow-rail]')) {
  const viewport = rail.querySelector('[data-flow-viewport]');
  const group = rail.querySelector('[data-flow-group]');
  const direction = rail.dataset.flowDirection === 'right' ? -1 : 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let clones = []; let distance = 0; let position = 0; let frame; let last;
  let hovering = false; let focused = false; let visible = false;
  const durationValue = getComputedStyle(rail).getPropertyValue('--site-motion-rail').trim();
  const duration = parseFloat(durationValue) * (durationValue.endsWith('ms') ? 1 : 1000) * 2;

  function update() {
    cancelAnimationFrame(frame); last = undefined;
    if (distance && !hovering && !focused && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
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
    clones.forEach(clone => clone.remove()); clones = [];
    const gap = parseFloat(getComputedStyle(viewport).columnGap) || 0;
    distance = group.children.length > 1 ? group.getBoundingClientRect().width + gap : 0;
    viewport.classList.toggle('has-flow', !!distance);
    if (distance) {
      const count = Math.ceil(viewport.clientWidth / distance);
      for (let index = 0; index < count; index++) {
        const clone = group.cloneNode(true); clone.removeAttribute('data-flow-group');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
        viewport.append(clone); clones.push(clone);
      }
      position = reduced.matches ? Math.floor(progress * group.children.length) * distance / group.children.length : progress * distance;
      viewport.scrollLeft = position;
    }
    update();
  }
  viewport.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; update(); } });
  viewport.addEventListener('pointerleave', () => { hovering = false; update(); });
  viewport.addEventListener('focusin', () => { focused = !!viewport.querySelector(':focus-visible') || viewport.matches(':focus-visible'); update(); });
  viewport.addEventListener('focusout', () => { focused = false; position = distance ? viewport.scrollLeft % distance : 0; update(); });
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); last = undefined; });
  window.addEventListener('pageshow', update);
  new ResizeObserver(measure).observe(viewport);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(viewport);
}
