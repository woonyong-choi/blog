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

// 날짜는 시간대 변환 없이 문자열 그대로 읽어 하루가 밀리지 않는다.
function dateLine({ date }) {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return `<time datetime="${escape(date)}">${year}년 ${month}월 ${day}일</time>`;
}

// 프로필 주소는 글 주소와 별개이며 이름, 없으면 아이디를 링크로 만든다. 아이콘만 있으면 아이콘이 링크다.
function profile({ author }) {
  if (!author) return { avatar: '', line: '' };
  const { name, handle, url, avatar } = author;
  const labelled = name ?? handle;
  const open = url ? `<a href="${escape(url)}">` : '';
  const close = url ? '</a>' : '';
  const image = avatar && `<img src="${escape(avatar.src)}" alt="${escape(avatar.alt)}" loading="lazy" decoding="async">`;
  const parts = [name && `<strong>${open}${escape(name)}${close}</strong>`, handle && (name ? `<span>${escape(handle)}</span>` : `<strong>${open}${escape(handle)}${close}</strong>`)].filter(Boolean);
  const iconLink = avatar && url && !labelled ? `<a href="${escape(url)}">${image}</a>` : image;
  return { avatar: avatar ? `<span class="app-interview-avatar">${iconLink}</span>` : '', line: parts.length ? `<span>${parts.join(' ')}</span>` : '' };
}

function metaLine(entry, examples) {
  const { avatar, line } = profile(entry);
  const lines = [
    line, dateLine(entry),
    entry.company && `<strong>${escape(entry.company)}</strong>`,
    entry.role && `<span>${escape(entry.role)}</span>`,
    sourceLine(entry),
    entry.example && !examples && '<span>구성 예시</span>',
  ].filter(Boolean).join('');
  return avatar || lines ? `<div class="app-interview-meta">${avatar}<div class="app-interview-lines">${lines}</div></div>` : '';
}

export function interviewCards(entries) {
  if (!entries.length) return '';
  const examples = entries.every(entry => entry.example);
  return entries.map(entry => `<li class="app-interview-card"><p class="app-interview-summary">${escape(entry.summary)}</p>${metaLine(entry, examples)}</li>`).join('');
}
