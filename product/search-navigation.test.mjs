// 검색 조건 해제 동작은 docs/design/publication.md의 검색 계약을 따른다.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { JSDOM } from 'jsdom';

import { readSearchState, searchUrl } from './search-model.mjs';
import { renderResults } from './search-view.mjs';

test('search_filter_links_keep_remaining_conditions_or_return_to_entry', () => {
  const cases = [
    { query: '', tags: ['python'], expected: ['/docs/'] },
    { query: 'copy', tags: ['python'], expected: ['/search/?q=copy'] },
    { query: '', tags: ['python', 'os'], expected: ['/search/?tag=os', '/search/?tag=python'] },
  ];
  for (const item of cases) {
    const dom = new JSDOM('<div data-filter-summary></div><div data-full-results></div>');
    globalThis.document = dom.window.document;
    try {
      renderResults(document.body, { entries: [], totalPages: 1, page: 1 }, { ...item, page: 3, type: 'all' }, { python: { label: 'Python' }, os: { label: 'OS' } });
      const links = [...document.querySelectorAll('[data-filter-summary] a')];
      assert.deepEqual(links.map(link => link.getAttribute('href')), [...item.expected, '/docs/']);
    } finally {
      delete globalThis.document;
      dom.window.close();
    }
  }
});

test('empty_search_entry_replaces_location_without_querying_index', () => {
  for (const query of ['', '?page=2', '?q=%20%20&page=2', '?type=wiki&page=2']) {
    const browser = searchBrowser(`/search/${query}`);
    try {
      assert.deepEqual(browser.visits, [{ method: 'replace', href: '/docs/' }]);
      assert.equal(browser.requests.length, 0);
    } finally { browser.dom.window.close(); }
  }
});

test('clear_query_respects_entry_and_remaining_tag', () => {
  const cases = [
    { route: '/docs/', page: false, query: 'copy', expectedVisits: [], expectedTags: undefined },
    { route: '/search/?q=copy&page=2', page: true, query: 'copy', expectedVisits: [{ method: 'assign', href: '/docs/' }], expectedTags: undefined },
    { route: '/search/?q=copy&tag=python&page=2', page: true, query: 'copy', expectedVisits: [], expectedTags: ['python'] },
  ];
  for (const item of cases) {
    const browser = searchBrowser(item.route, item.page);
    try {
      browser.input.value = item.query;
      browser.requests.length = 0;
      browser.clear.click();
      assert.equal(browser.input.value, '');
      assert.deepEqual(browser.visits, item.expectedVisits);
      if (item.expectedTags) {
        assert.equal(browser.requests.length, 1);
        assert.equal(browser.requests[0].state.query, '');
        assert.deepEqual(browser.requests[0].state.tags, item.expectedTags);
        assert.equal(browser.requests[0].state.page, 1);
      } else assert.equal(browser.requests.length, 0);
    } finally { browser.dom.window.close(); }
  }
});

function searchBrowser(route, page = true) {
  const dom = new JSDOM(`<section data-public-search><form><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section>${page ? '<div data-search-page></div>' : ''}`);
  const visits = [];
  const requests = [];
  const url = new URL(route, 'https://example.com');
  const location = {
    href: url.href, origin: url.origin, search: url.search,
    assign: href => visits.push({ method: 'assign', href }),
    replace: href => visits.push({ method: 'replace', href }),
  };
  const history = { state: null, replaceState(state, _title, value) {
    this.state = state;
    if (!value) return;
    const next = new URL(value, location.href);
    location.href = next.href; location.search = next.search;
  } };
  const source = readFileSync(new URL('./publication.js', import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
  runInNewContext(source, {
    document: dom.window.document, window: dom.window, location, history, URL,
    readSearchState, searchUrl,
    queryIndex(action, state) { requests.push({ action, state }); return new Promise(() => {}); },
    showResultsLoading() {}, renderResults() {}, renderSuggestions() {}, showSearchError() {},
  });
  return { dom, visits, requests, input: dom.window.document.querySelector('input'), clear: dom.window.document.querySelector('button') };
}
