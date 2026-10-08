// 개인 문서와 복각 검토가 같은 정적 목차 구조를 사용한다.
import { escape } from './markdown.mjs';

export function articleToc(headings, { title = '이 글에서', label = '이 글의 목차', minimum = 2 } = {}) {
  const sections = headings.filter(heading => heading.level === 2);
  if (sections.length < minimum) return '';
  return `<nav class="app-toc" aria-label="${escape(label)}"><h2 class="app-toc-heading">${escape(title)}</h2><ol class="app-toc-list">${sections.map(heading => `<li><a href="#${escape(heading.id)}">${escape(heading.title)}</a></li>`).join('')}</ol></nav>`;
}
