// 인터뷰 카드를 만든다. 예시 항목은 미리보기에서만 공개 대상이다.
import { escape } from './markdown.mjs';

export function publicInterviews(entries, preview = false) {
  return entries.filter(entry => preview || !entry.example);
}

// 카드 아래는 이미지, 제목, 부제목 세 자리뿐이다. url은 제목에 연결하고 별도 줄을 만들지 않는다.
function profileLine({ profile, url }) {
  if (!profile) return '';
  const { image, title, subtitle } = profile;
  const heading = url ? `<a href="${escape(url)}">${escape(title)}</a>` : escape(title);
  const picture = image ? `<span class="app-interview-avatar"><img src="${escape(image.src)}" alt="${escape(image.alt)}" loading="lazy" decoding="async"></span>` : '';
  return `<div class="app-interview-meta">${picture}<div class="app-interview-lines"><strong>${heading}</strong>${subtitle ? `<span>${escape(subtitle)}</span>` : ''}</div></div>`;
}

export function interviewCards(entries) {
  return entries.map(entry => `<li class="app-interview-card"><p class="app-interview-summary">${escape(entry.summary)}</p>${profileLine(entry)}</li>`).join('');
}
