// 인터뷰 카드를 만든다. 예시 항목은 미리보기에서만 공개 대상이다.
import { escape } from './markdown.mjs';

export function publicInterviews(entries, preview = false) {
  return entries.filter(entry => preview || !entry.example);
}

export function interviewSection(entries = [], id = 'interviews') {
  if (!entries.length) return '';
  const examples = entries.every(entry => entry.example);
  const source = entry => entry.url ? `<a href="${escape(entry.url)}">${escape(entry.source)} →</a>` : escape(entry.source);
  return `<section class="app-interviews" id="${escape(id)}" aria-label="인터뷰" data-flow-rail data-flow-label="인터뷰"><div class="app-home-rail"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="인터뷰 카드"><ul class="app-flow-group" data-flow-group>${entries.map(entry => `<li class="app-interview-card"><p class="app-interview-question">${escape(entry.question)}</p><blockquote>${escape(entry.quote)}</blockquote><p class="app-interview-source">${source(entry)}${entry.example && !examples ? ' · 구성 예시' : ''}</p></li>`).join('')}</ul></div></div></section>`;
}
