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
  return `<section class="app-interviews" id="interviews" aria-label="인터뷰" data-flow-rail data-flow-label="인터뷰"><div class="app-home-rail"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="인터뷰 카드"><ul class="app-flow-group" data-flow-group>${entries.map(entry => `<li class="app-interview-card"><p class="app-interview-question">${escape(entry.question)}</p><blockquote>${escape(entry.quote)}</blockquote><p class="app-interview-source">${escape(entry.source)}${entry.example && !examples ? ' · 구성 예시' : ''}</p></li>`).join('')}</ul></div></div>${sources ? `<nav class="app-supporting-links" aria-label="인터뷰 원문">${sources}</nav>` : ''}</section>`;
}
