// 본문 조작은 정적 HTML 위에서 필요한 기능만 점진적으로 활성화한다.
import './document.js';
import './comments.js';
import { readSearchState, searchUrl } from './search-model.mjs';
import { queryIndex } from './search-client.mjs';
import { renderResults, renderSuggestions, showSearchError } from './search-view.mjs';

for (const box of document.querySelectorAll('[data-public-search]')) {
  const form = box.querySelector('form');
  const input = form.querySelector('input');
  const clear = form.querySelector('[data-clear-query]');
  const output = box.querySelector('[role="listbox"]');
  const status = box.querySelector('[data-search-status]');
  const page = document.querySelector('[data-search-page]');
  const state = () => readSearchState(location.search, page?.dataset.tag);
  let revision = 0; let composing = false; let active = -1; let resultStatus = '';
  const failureStatus = '검색 자료를 불러오지 못했습니다. 다시 시도해 주세요.';
  function close() { output.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; status.textContent = resultStatus; }
  function restorePosition() {
    const position = history.state?.searchPosition;
    if (page && position) requestAnimationFrame(() => window.scrollTo(position.x, position.y));
  }
  async function propose() {
    const request = ++revision;
    clear.hidden = !input.value;
    close();
    if (!input.value.trim()) return;
    status.textContent = '검색 중입니다.';
    try {
      const { result } = await queryIndex('suggest', { ...state(), query: input.value, page: 1 });
      if (request !== revision || composing) return;
      renderSuggestions(output, result, { ...state(), query: input.value });
      output.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
      status.textContent = `검색 결과 ${result.count}개`;
    } catch { if (request === revision) { showSearchError(output, propose); output.hidden = false; input.setAttribute('aria-expanded', 'true'); status.textContent = failureStatus; } }
  }
  async function results() {
    if (!page) return;
    const selected = state(); input.value = selected.query; clear.hidden = !input.value;
    status.textContent = '검색 결과를 불러오는 중입니다.';
    try {
      const { result, tags } = await queryIndex('results', selected);
      renderResults(page, result, selected, tags);
      resultStatus = `검색 결과 ${result.counts[selected.type]}개`;
      status.textContent = resultStatus;
      restorePosition();
    } catch { showSearchError(page.querySelector('[data-full-results]'), results); resultStatus = failureStatus; status.textContent = resultStatus; }
  }
  input.addEventListener('compositionstart', () => { composing = true; revision++; close(); });
  input.addEventListener('compositionend', () => { composing = false; propose(); });
  input.addEventListener('input', event => { if (!composing && !event.isComposing) propose(); });
  input.addEventListener('focus', () => { if (input.value) propose(); });
  clear.addEventListener('click', () => {
    revision++; input.value = ''; clear.hidden = true; close();
    if (page) location.assign(searchUrl({ ...state(), query: '', page: 1 }));
    else input.focus();
  });
  input.addEventListener('keydown', event => {
    if (composing || event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); revision++; close(); return; }
    const options = [...output.querySelectorAll('[role="option"]')];
    if (!output.hidden && options.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      active = active < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      for (const [index, option] of options.entries()) option.setAttribute('aria-selected', String(index === active));
      input.setAttribute('aria-activedescendant', options[active].id); options[active].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && !output.hidden && active >= 0) { event.preventDefault(); options[active].click(); }
  });
  form.addEventListener('submit', event => { event.preventDefault(); if (!composing) location.assign(searchUrl({ ...state(), query: input.value, page: 1 })); });
  document.addEventListener('click', event => { if (!box.contains(event.target)) { revision++; close(); } });
  window.addEventListener('pagehide', () => {
    if (page) history.replaceState({ ...history.state, searchPosition: { x: window.scrollX, y: window.scrollY } }, '');
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    revision++; close();
    if (page) { input.value = state().query; clear.hidden = !input.value; restorePosition(); }
  });
  results();
}
