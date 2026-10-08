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

export function renderResults(root, result, state, tags) {
  const filters = root.querySelector('.app-type-filters');
  filters.replaceChildren(...Object.entries({ all: '전체', wiki: '위키', blog: '블로그' }).map(([type, label]) => {
    const node = link(`${label} ${result.counts[type]}`, searchUrl({ ...state, type, page: 1 }));
    if (state.type === type) node.setAttribute('aria-current', 'page');
    return node;
  }));
  let summary = root.querySelector('[data-filter-summary]');
  if (!summary) { summary = element('div', undefined, 'app-filter-summary'); summary.dataset.filterSummary = ''; filters.after(summary); }
  summary.replaceChildren(...state.tags.map(tag => link(`${tags[tag]?.label ?? tag} ×`, searchUrl({ ...state, tags: state.tags.filter(value => value !== tag), page: 1 }), 'app-tag')));
  if (state.query || state.tags.length || state.type !== 'all') summary.append(link('조건 초기화', '/search/'));
  const output = root.querySelector('[data-full-results]');
  output.replaceChildren(...result.entries.map(entry => resultRow(entry, tags)));
  if (!result.entries.length) {
    output.append(element('p', '조건에 맞는 글이 없습니다. 검색어나 태그를 줄여 보세요.', 'app-empty'));
    if (result.counts.all) output.append(link(`다른 유형의 글 ${result.counts.all}개 보기`, searchUrl({ ...state, type: 'all', page: 1 })));
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
}

function resultRow(entry, tags) {
  const row = element('article', undefined, 'app-result-row');
  const icon = element('span', undefined, 'app-content-icon is-small');
  const image = element('img'); image.src = entry.iconUrl; image.alt = ''; image.loading = 'lazy'; image.width = 24; image.height = 24; icon.append(image);
  const body = element('div');
  body.append(link(entry.title, entry.route, 'app-result-title'), element('span', `${entry.type === 'wiki' ? 'Wiki' : 'Blog'}${entry.example ? ' · 예시' : ''}`, 'app-result-type'), element('p', entry.description));
  const labels = element('div', undefined, 'app-tags');
  labels.append(...entry.tags.map(tag => link(tags[tag].label, `/tags/${tag}/?type=${entry.type}`, 'app-tag')));
  body.append(labels); row.append(icon, body); return row;
}

export function renderSuggestions(output, result, state) {
  output.replaceChildren();
  const groups = [
    ['연관 검색어', result.queries.map(query => [query, searchUrl({ ...state, query, page: 1 })])],
    ['태그', result.tags.map(([id, tag]) => [tag.label, searchUrl({ ...state, tags: [...state.tags, id], page: 1 })])],
    ['글', result.entries.map(entry => [`${entry.title} · ${entry.type === 'wiki' ? 'Wiki' : 'Blog'}`, entry.route])],
  ];
  let index = 0;
  for (const [label, links] of groups) {
    if (!links.length) continue;
    const group = element('div'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
    group.append(element('p', label, 'app-suggestion-label'));
    for (const [title, href] of links) { const node = link(title, href); node.setAttribute('role', 'option'); node.id = `suggestion-${index++}`; node.tabIndex = -1; group.append(node); }
    output.append(group);
  }
  const all = link(`전체 검색 결과 ${result.count}개 보기`, searchUrl({ ...state, page: 1 }));
  all.setAttribute('role', 'option'); all.id = `suggestion-${index}`; all.tabIndex = -1; output.append(all);
}

export function showSearchError(output, retry) {
  const button = element('button', '다시 시도', 'app-inline-button'); button.type = 'button'; button.addEventListener('click', retry);
  output.replaceChildren(element('p', '검색 자료를 불러오지 못했습니다. 연결을 확인해 주세요.'), button);
}
