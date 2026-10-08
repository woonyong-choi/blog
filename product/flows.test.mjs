import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

// 레이아웃 없이 진행기 계산만 확인하는 최소 DOM이다.
function run(cards, directions = []) {
  const frames = []; const listeners = {};
  const element = (props = {}) => ({ children: [], classList: { toggle() {} }, addEventListener() {}, hasAttribute: () => false, ...props });
  const rows = cards.map((count, index) => {
    const group = element({ children: Array(count).fill(0), getBoundingClientRect: () => ({ width: count * 100 }), cloneNode: () => element({ removeAttribute() {}, setAttribute() {}, querySelectorAll: () => [], remove() {} }) });
    const viewport = element({ clientWidth: 450, scrollLeft: 0, append() {} });
    const rail = element({ dataset: directions[index] ? { flowDirection: directions[index] } : {}, closest: () => scope, querySelector: selector => selector === '[data-flow-viewport]' ? viewport : group });
    return { rail, viewport };
  });
  const scope = element({ hasAttribute: () => true, addEventListener: (type, fn) => { listeners[type] = fn; } });
  const observers = [];
  const context = {
    document: { querySelectorAll: () => rows.map(row => row.rail), addEventListener() {}, hidden: false },
    matchMedia: () => ({ matches: false, addEventListener() {} }), window: { addEventListener() {} },
    getComputedStyle: () => ({ getPropertyValue: () => String(1000) + 'ms', columnGap: '0' }),
    requestAnimationFrame: fn => frames.push(fn), cancelAnimationFrame: () => { frames.length = 0; },
    ResizeObserver: class { constructor(fn) { this.fn = fn; } observe() { observers.push(this.fn); } },
    IntersectionObserver: class { constructor(fn) { this.fn = fn; } observe() { observers.push(() => this.fn([{ isIntersecting: true }])); } },
    Math, parseFloat, Array,
  };
  runInNewContext(readFileSync(new URL('./flows.js', import.meta.url), 'utf8'), context);
  observers.forEach(fn => fn());
  return { rows, frames, listeners };
}

test('multi_row_flows_move_every_row_at_the_same_pixel_speed_even_with_one_card', () => {
  for (const cards of [[1, 1], [2, 1], [3, 2]]) {
    const { rows, frames } = run(cards);
    assert.ok(frames.length, `${cards}: 진행 예약`);
    frames.shift()(0); frames.shift()(100);
    const moved = rows.map(row => row.viewport.scrollLeft);
    assert.ok(moved.every(value => value > 0 && Number.isFinite(value)), `${cards}: ${moved}`);
    assert.ok(moved.every(value => Math.abs(value - moved[0]) < 1e-9), `${cards}: ${moved}`);
  }
});

test('hover_pauses_every_row', () => {
  const { frames, listeners, rows } = run([2, 2]);
  listeners.pointerenter({ pointerType: 'mouse' });
  frames.splice(0).forEach(fn => fn(0));
  assert.equal(frames.length, 0);
  assert.deepEqual(rows.map(row => row.viewport.scrollLeft), [0, 0]);
});

test('right_direction_row_moves_opposite_with_wrapped_first_frame_and_same_pixel_speed', () => {
  const widths = [300, 200];
  const { rows, frames } = run([3, 2], [undefined, 'right']);
  frames.shift()(0); frames.shift()(100);
  const step = 300 * 100 / 2000;
  const signed = rows.map((row, index) => {
    const position = row.viewport.scrollLeft;
    assert.ok(position >= 0 && position < widths[index], `${index}: ${position}`);
    const delta = ((position + widths[index] / 2) % widths[index] + widths[index]) % widths[index] - widths[index] / 2;
    return delta;
  });
  assert.ok(Math.abs(signed[0] - step) < 1e-9, `${signed}`);
  assert.ok(Math.abs(signed[1] + step) < 1e-9, `${signed}`);
  assert.ok(rows[1].viewport.scrollLeft > widths[1] / 2, '0에서 뒤로 감기면 끝 쪽으로 이어진다');
});
