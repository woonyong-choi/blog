// 읽기와 직접 탐색을 우선하고 화면 안에서만 카드 흐름을 진행한다.
// 여러 줄(data-flow-rows)은 하나의 진행기로 함께 움직이고 함께 멈춘다.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const scopes = new Map();
for (const rail of document.querySelectorAll('[data-flow-rail]')) {
  const scope = rail.closest('[data-flow-rows]') ?? rail;
  scopes.set(scope, [...(scopes.get(scope) ?? []), rail]);
}

for (const [scope, rails] of scopes) {
  const shared = scope.hasAttribute('data-flow-rows');
  const durationValue = getComputedStyle(rails[0]).getPropertyValue('--site-motion-rail').trim();
  const duration = parseFloat(durationValue) * (durationValue.endsWith('ms') ? 1 : 1000) * 2;
  let hovering = false; let focused = false; let frame; let last;
  const rows = rails.map(rail => ({
    viewport: rail.querySelector('[data-flow-viewport]'), group: rail.querySelector('[data-flow-group]'),
    direction: rail.dataset.flowDirection === 'right' ? -1 : 1, clones: [], distance: 0, position: 0, visible: false,
  }));

  function update() {
    cancelAnimationFrame(frame); last = undefined;
    if (rows.some(row => row.distance && row.visible) && !hovering && !focused && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  // 줄마다 길이가 달라도 같은 픽셀 속도가 되도록 가장 긴 줄의 한 바퀴를 기준으로 삼는다.
  function tick(now) {
    if (last !== undefined) {
      const speed = Math.max(...rows.map(row => row.distance)) / duration;
      for (const row of rows) {
        if (!row.distance) continue;
        row.position = ((row.position + row.direction * (now - last) * speed) % row.distance + row.distance) % row.distance;
        row.viewport.scrollLeft = row.position;
      }
    }
    last = now; frame = requestAnimationFrame(tick);
  }
  function measure(row) {
    const { viewport, group } = row;
    const progress = row.distance ? viewport.scrollLeft / row.distance : 0;
    row.clones.forEach(clone => clone.remove()); row.clones = [];
    const gap = parseFloat(getComputedStyle(viewport).columnGap) || 0;
    // 여러 줄일 때는 한 장뿐인 줄도 복제해 함께 흐른다.
    row.distance = group.children.length > (shared ? 0 : 1) ? group.getBoundingClientRect().width + gap : 0;
    viewport.classList.toggle('has-flow', !!row.distance);
    if (row.distance) {
      const count = Math.ceil(viewport.clientWidth / row.distance);
      for (let index = 0; index < count; index++) {
        const clone = group.cloneNode(true); clone.removeAttribute('data-flow-group');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
        viewport.append(clone); row.clones.push(clone);
      }
      row.position = reduced.matches ? Math.floor(progress * group.children.length) * row.distance / group.children.length : progress * row.distance;
      viewport.scrollLeft = row.position;
    }
    update();
  }

  const area = shared ? scope : rows[0].viewport;
  area.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; update(); } });
  area.addEventListener('pointerleave', () => { hovering = false; update(); });
  area.addEventListener('focusin', () => { focused = !!area.querySelector(':focus-visible') || area.matches(':focus-visible'); update(); });
  area.addEventListener('focusout', () => {
    focused = false;
    for (const row of rows) row.position = row.distance ? row.viewport.scrollLeft % row.distance : 0;
    update();
  });
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); last = undefined; });
  window.addEventListener('pageshow', update);
  for (const row of rows) {
    new ResizeObserver(() => measure(row)).observe(row.viewport);
    new IntersectionObserver(entries => { row.visible = entries[0].isIntersecting; update(); }).observe(row.viewport);
  }
}
