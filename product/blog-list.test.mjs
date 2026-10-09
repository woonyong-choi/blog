import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { initBlogList } from './blog-list.js';
import { blogArchive } from './blog-layout.mjs';

const posts = Array.from({ length: 25 }, (_, id) => ({ route: `/articles/p${id}/`, title: `글 ${id}`, description: '요약', thumbnail: { src: 'https://picsum.photos/960/540', alt: '' } }));
const page = number => blogArchive(posts, {}, number);
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(fetchPage, observe = true) {
  const dom = new JSDOM(page(1), { url: 'https://example.com/blog/all/' });
  const root = dom.window.document.querySelector('[data-blog-list]');
  let trigger;
  class Observer {
    constructor(fn) { trigger = () => fn([{ isIntersecting: true }]); }
    observe() {} unobserve() {} disconnect() {}
  }
  initBlogList(root, { fetchPage, Observer: observe ? Observer : null });
  return { root, trigger, dom, titles: () => [...root.querySelectorAll('.app-blog-card-title')].map(node => node.textContent) };
}
const response = html => ({ ok: true, text: async () => html });

test('scroll_appends_in_order_once_while_pending_and_stops_at_the_last_page', async () => {
  let resolve;
  const calls = [];
  const state = setup(url => { calls.push(url); return new Promise(done => { resolve = done; }); });
  state.trigger(); state.trigger();
  state.root.querySelector('[rel=next]').click();
  assert.equal(calls.length, 1);
  assert.equal(state.root.getAttribute('aria-busy'), 'true');
  resolve(response(page(2))); await tick();
  assert.equal(state.titles().length, 24);
  assert.equal(state.root.hasAttribute('aria-busy'), false);
  state.trigger(); resolve(response(page(3))); await tick();
  assert.deepEqual(state.titles(), posts.map(post => post.title));
  assert.equal(state.root.querySelector('nav').hidden, true);
  assert.equal(state.root.querySelector('[role=status]').textContent, '모든 글을 불러왔습니다.');
  state.trigger(); await tick();
  assert.equal(calls.length, 2);
  state.dom.window.close();
});

test('failed_load_waits_for_manual_retry_and_keyboard_focus_moves_to_new_content', async () => {
  let calls = 0;
  const state = setup(async () => { if (++calls === 1) throw new Error('offline'); return response(page(2)); }, false);
  const link = state.root.querySelector('[rel=next]');
  link.click(); await tick();
  assert.equal(state.titles().length, 12);
  assert.equal(link.textContent, '다시 불러오기');
  link.focus(); link.click(); await tick();
  assert.equal(calls, 2);
  assert.equal(state.dom.window.document.activeElement.textContent, '글 12');
  assert.equal(link.href, 'https://example.com/blog/all/page/3/');
  state.dom.window.close();
});

test('duplicate_cards_are_skipped_and_invalid_next_pages_do_not_mutate_the_list', async () => {
  for (const href of ['https://other.example/blog/all/page/3/', '/blog/all/', '/blog/all/page/2/']) {
    const state = setup(async () => response(page(2).replaceAll('/blog/all/page/3/', href)));
    state.trigger(); await tick();
    assert.equal(state.titles().length, 12);
    assert.match(state.root.querySelector('[role=status]').textContent, /불러오지 못했습니다/);
    state.trigger(); await tick();
    assert.equal(state.titles().length, 12);
    state.dom.window.close();
  }
  const state = setup(async () => response(page(2).replaceAll('/articles/p12/', '/articles/p0/')));
  state.trigger(); await tick();
  assert.equal(state.titles().length, 23);
  assert.equal(state.titles().filter(title => title === '글 0').length, 1);
  state.dom.window.close();
});
