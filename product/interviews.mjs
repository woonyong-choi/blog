import { escape } from './markdown.mjs';

export function publicInterviews(entries, preview = false) {
  const ids = new Set();
  return entries.filter(entry => preview || !entry.example).map(entry => {
    if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) throw new Error('invalid or duplicate interview id');
    ids.add(entry.id);
    for (const key of ['question', 'quote', 'source']) if (typeof entry[key] !== 'string' || !entry[key].trim()) throw new Error(`missing interview ${key}`);
    if (!entry.example && (!entry.url || new URL(entry.url).protocol !== 'https:')) throw new Error('public interview requires an HTTPS source');
    return entry;
  });
}

export function interviewSection(entries = []) {
  if (!entries.length) return '';
  const examples = entries.every(entry => entry.example);
  const sources = entries.filter(entry => !entry.example).map(entry => `<a href="${escape(entry.url)}">${escape(entry.source)} →</a>`).join('');
  return `<section class="app-interviews app-knowledge-section" aria-labelledby="interviews-title" data-interview-rail><div class="app-section-heading"><h2 id="interviews-title">인터뷰</h2><div class="app-interview-controls" data-interview-controls hidden><button type="button" data-interview-prev aria-label="이전 인터뷰">←</button><button type="button" data-interview-toggle>흐름 멈추기</button><button type="button" data-interview-next aria-label="다음 인터뷰">→</button></div></div><p class="app-caption" id="interviews-description">${examples ? '구성 예시 · 실제 인터뷰 발언이 아닙니다.' : '문제를 바라보고, 해결하는 방식에 관해.'}</p><div class="app-interview-viewport" data-interview-viewport tabindex="0" role="region" aria-label="인터뷰 카드" aria-describedby="interviews-description"><ul class="app-interview-group" data-interview-group>${entries.map(entry => `<li class="app-interview-card"><p class="app-interview-question">${escape(entry.question)}</p><blockquote>${escape(entry.quote)}</blockquote><p class="app-interview-source">${escape(entry.source)}${entry.example ? ' · 구성 예시' : ''}</p></li>`).join('')}</ul></div>${sources ? `<nav class="app-supporting-links" aria-label="인터뷰 원문">${sources}</nav>` : ''}</section>`;
}
