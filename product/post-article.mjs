// 블로그 피드와 상세가 같은 글 구조(날짜, 제목, 도입문, 본문, 꼬리말)를 쓰도록 문자열 조각만 조립한다.
import { escape } from './markdown.mjs';

// 본문 제목의 태그 단계를 문서 안의 위치에 맞춰 옮긴다. 원래 단계는 app-heading-N 클래스로 남는다.
export const feedLevels = level => Math.min(6, level + 1);
export const detailLevels = level => Math.max(2, level);

export function shiftHeadings(html, levels) {
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/g, (_, end, level, attrs) => {
    const next = levels(Number(level));
    const marker = end || /\sclass="/.test(attrs) ? '' : ` class="app-heading-${level}"`;
    return `<${end}h${next}${marker}${attrs}>`;
  });
}

export function postArticle(post, { detail = false, footer = '', after = '' } = {}) {
  const id = `post-${post.id}`;
  const label = escape(post.title);
  const title = detail
    ? `<h1 class="app-post-title" id="${id}">${label}</h1>`
    : `<h2 class="app-post-title" id="${id}"><a href="${post.route}">${label}</a></h2>`;
  const body = shiftHeadings(post.html, detail ? detailLevels : feedLevels);
  return `<article class="app-blog-post${detail ? ' is-detail' : ''}" aria-labelledby="${id}"><header class="app-post-header"><time class="app-post-date" datetime="${post.publishedAt}">${post.publishedAt}${post.example ? ' · 예시 글' : ''}</time>${title}</header><div class="app-prose app-feed-body"><p class="app-article-lead">${post.leadHtml ?? escape(post.description)}</p>${body}</div><footer class="app-post-footer">${footer}</footer>${after}</article>`;
}
