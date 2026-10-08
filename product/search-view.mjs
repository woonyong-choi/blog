// 검색 결과는 텍스트 노드로 구성해 입력과 본문을 HTML로 해석하지 않는다.
import { searchUrl } from './search-model.mjs';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, href, className) {
  const node = element('a', text, className);
  node.href = href;
  return node;
}

export function showResultsLoading(root, message = '검색 결과를 불러오는 중입니다.') {
  root.setAttribute('aria-busy', 'true');
  for (const node of root.querySelectorAll('[data-filter-summary], [data-result-pages]')) node.replaceChildren();
  const output = root.querySelector('[data-full-results]');
  output.classList.add('app-search-panel');
  output.replaceChildren(element('p', message, 'app-search-message'));
}

export function renderResults(root, result, state, tags) {
  const summary = root.querySelector('[data-filter-summary]');
  summary.replaceChildren(...state.tags.map(tag => link(`${tags[tag]?.label ?? tag} ×`, searchUrl({ ...state, tags: state.tags.filter(value => value !== tag), page: 1 }), 'app-tag')));
  if (state.query || state.tags.length) summary.append(link('조건 초기화', '/search/'));
  const output = root.querySelector('[data-full-results]');
  output.classList.add('app-search-panel');
  output.replaceChildren(...result.entries.map(entry => resultRow(entry, tags, state.query)));
  if (!result.entries.length) {
    output.append(element('p', '조건에 맞는 글이 없습니다. 검색어나 태그를 줄여 보세요.', 'app-search-message'));
  }
  let pages = root.querySelector('[data-result-pages]');
  if (!pages) { pages = element('nav', undefined, 'app-page-links'); pages.dataset.resultPages = ''; pages.setAttribute('aria-label', '검색 페이지'); output.after(pages); }
  pages.replaceChildren();
  if (result.totalPages > 1) {
    if (result.page > 1) pages.append(link('이전', searchUrl({ ...state, page: result.page - 1 })));
    for (let page = 1; page <= result.totalPages; page++) {
      const node = link(String(page), searchUrl({ ...state, page }));
      if (page === result.page) node.setAttribute('aria-current', 'page');
      pages.append(node);
    }
    if (result.page < result.totalPages) pages.append(link('다음', searchUrl({ ...state, page: result.page + 1 })));
  }
  root.setAttribute('aria-busy', 'false');
  const fallback = root.querySelector('[data-search-fallback]');
  if (fallback) fallback.hidden = !fallback.open && !fallback.contains(document.activeElement);
}

function markedText(node, text, query) {
  const value = String(text).normalize('NFC');
  const terms = query.normalize('NFC').trim().split(/\s+/).filter(Boolean).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) { node.textContent = value; return; }
  let end = 0;
  for (const match of value.matchAll(new RegExp(terms.join('|'), 'giu'))) {
    node.append(document.createTextNode(value.slice(end, match.index)), element('mark', match[0]));
    end = match.index + match[0].length;
  }
  node.append(document.createTextNode(value.slice(end)));
}

function resultLink(entry, query) {
  const item = link(undefined, entry.route, 'app-search-result-link');
  const icon = element('span', undefined, 'app-content-icon is-small');
  const image = element('img'); image.src = entry.iconUrl; image.alt = ''; image.width = 24; image.height = 24; icon.append(image);
  const title = element('strong'); markedText(title, entry.title, query);
  const description = element('p'); markedText(description, entry.excerpt ?? entry.description, query);
  item.append(icon, title);
  if (entry.example) item.append(element('span', ' 예시', 'app-search-result-note'));
  item.append(description);
  return item;
}

function resultRow(entry, tags, query) {
  const row = element('article', undefined, 'app-search-entry');
  const labels = element('div', undefined, 'app-search-result-tags');
  labels.append(...entry.tags.map(tag => link(tags[tag].label, `/tags/${tag}/`)));
  row.append(resultLink(entry, query), labels); return row;
}

export function renderSuggestions(output, result, state) {
  output.replaceChildren();
  const groups = [
    ['연관 검색어', result.queries.map(query => [query, searchUrl({ ...state, query, page: 1 })])],
    ['태그', result.tags.map(([id, tag]) => [tag.label, searchUrl({ ...state, tags: [...state.tags, id], page: 1 })])],
  ];
  let index = 0;
  for (const [label, links] of groups) {
    if (!links.length) continue;
    const group = element('div'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
    group.append(element('p', label, 'app-suggestion-label'));
    for (const [title, href] of links) { const node = link(title, href, 'app-search-choice'); if (label === '연관 검색어') node.dataset.query = title; node.setAttribute('role', 'option'); node.id = `suggestion-${index++}`; node.tabIndex = -1; group.append(node); }
    output.append(group);
  }
  const entries = element('div'); entries.setAttribute('role', 'group'); entries.setAttribute('aria-label', '글');
  for (const entry of result.entries) { const node = resultLink(entry, state.query); node.setAttribute('role', 'option'); node.id = `suggestion-${index++}`; node.tabIndex = -1; entries.append(node); }
  if (!result.count) entries.append(element('p', '일치하는 글이 없습니다. 다른 검색어를 입력해 보세요.', 'app-search-message'));
  output.append(entries);
  const all = link(`전체 검색 결과 ${result.count}개 보기`, searchUrl({ ...state, page: 1 }), 'app-search-choice');
  all.setAttribute('role', 'option'); all.id = `suggestion-${index}`; all.tabIndex = -1; output.append(all);
}

export function showSearchError(output, retry) {
  output.classList.add('app-search-panel');
  const button = element('button', '다시 시도', 'app-inline-button'); button.type = 'button'; button.addEventListener('click', retry);
  if (output.getAttribute('role') === 'listbox') { button.setAttribute('role', 'option'); button.id = `${output.id}-retry`; button.tabIndex = -1; }
  output.replaceChildren(element('p', '검색 자료를 불러오지 못했습니다. 연결을 확인해 주세요.', 'app-search-message'), button);
}
