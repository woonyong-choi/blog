// 본문 조작은 정적 HTML 위에서 필요한 기능만 점진적으로 활성화한다.
import './document.js';
import './comments.js';
import { prepareIndex, readSearchState, searchDocuments, searchUrl, suggestions } from './search-model.mjs';
import { renderResults, renderSuggestions, showSearchError } from './search-view.mjs';

let indexPromise;
function loadIndex() {
  return indexPromise ??= fetch('/search-index.json').then(response => {
    if (!response.ok) throw new Error('search index unavailable');
    return response.json();
  }).then(data => ({ ...data, entries: prepareIndex(data.entries) })).catch(error => { indexPromise = undefined; throw error; });
}

for (const box of document.querySelectorAll('[data-public-search]')) {
  const form = box.querySelector('form');
  const input = form.querySelector('input');
  const clear = form.querySelector('[data-clear-query]');
  const output = box.querySelector('[role="listbox"]');
  const status = box.querySelector('[data-search-status]');
  const page = document.querySelector('[data-search-page]');
  const state = () => readSearchState(location.search, page?.dataset.tag);
  let revision = 0; let composing = false; let active = -1;
  function close() { output.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
  async function propose() {
    const request = ++revision;
    clear.hidden = !input.value;
    if (!input.value.trim()) { close(); return; }
    try {
      const data = await loadIndex();
      if (request !== revision || composing) return;
      const result = suggestions(data.entries, data.tags, { ...state(), query: input.value, page: 1 });
      renderSuggestions(output, result, { ...state(), query: input.value });
      output.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
      status.textContent = `검색 결과 ${result.count}개`;
    } catch { if (request === revision) { showSearchError(output, propose); output.hidden = false; input.setAttribute('aria-expanded', 'true'); } }
  }
  async function results() {
    if (!page) return;
    const selected = state(); input.value = selected.query; clear.hidden = !input.value;
    try {
      const data = await loadIndex(); const result = searchDocuments(data.entries, selected);
      renderResults(page, result, selected, data.tags);
      status.textContent = `검색 결과 ${result.counts[selected.type]}개`;
    } catch { showSearchError(page.querySelector('[data-full-results]'), results); }
  }
  input.addEventListener('compositionstart', () => { composing = true; revision++; close(); });
  input.addEventListener('compositionend', () => { composing = false; propose(); });
  input.addEventListener('input', event => { if (!composing && !event.isComposing) propose(); });
  input.addEventListener('focus', () => { if (input.value) propose(); });
  clear.addEventListener('click', () => { revision++; input.value = ''; clear.hidden = true; close(); input.focus(); });
  input.addEventListener('keydown', event => {
    if (composing || event.isComposing) return;
    if (event.key === 'Escape') { revision++; close(); return; }
    const options = [...output.querySelectorAll('[role="option"]')];
    if (!output.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); active = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      for (const [index, option] of options.entries()) option.setAttribute('aria-selected', String(index === active));
      input.setAttribute('aria-activedescendant', options[active].id); options[active].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && !output.hidden && active >= 0) { event.preventDefault(); options[active].click(); }
  });
  form.addEventListener('submit', event => { event.preventDefault(); if (!composing) location.assign(searchUrl({ ...state(), query: input.value, page: 1 })); });
  document.addEventListener('click', event => { if (!box.contains(event.target)) { revision++; close(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) { close(); results(); } });
  results();
}
