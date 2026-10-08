// 인터뷰 카드를 만든다. 예시 항목은 미리보기에서만 공개 대상이다.
import { escape } from './markdown.mjs';

export function publicInterviews(entries, preview = false) {
  return entries.filter(entry => preview || !entry.example);
}

// 출처는 플랫폼에 관계없이 같은 모양이며 주소가 있을 때만 링크가 된다.
function sourceLine({ source }) {
  if (!source) return '';
  const label = escape(source.label ?? source.platform);
  return source.url ? `<a href="${escape(source.url)}">${label} →</a>` : `<span>${label}</span>`;
}

export function interviewCards(entries) {
  if (!entries.length) return '';
  const examples = entries.every(entry => entry.example);
  return entries.map(entry => `<li class="app-interview-card"><p class="app-interview-summary">${escape(entry.summary)}</p><p class="app-interview-meta"><strong>${escape(entry.company)}</strong><span>${escape(entry.role)}</span>${sourceLine(entry)}${entry.example && !examples ? '<span>구성 예시</span>' : ''}</p></li>`).join('');
}
