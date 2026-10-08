// 홈 설정의 섹션 종류마다 독립된 HTML 구성 요소를 만든다.
import { controlImage } from './controls.mjs';
import { escape } from './markdown.mjs';
import { interviewSection, publicInterviews } from './interviews.mjs';

const paragraphs = value => value.split(/\n\s*\n/).map(part => `<p>${escape(part.replace(/\s*\n\s*/g, ' ').trim())}</p>`).join('');
const picture = (image, className = '', loading = 'lazy') => `<img${className ? ` class="${className}"` : ''} src="${escape(image.src)}" alt="${escape(image.alt)}" loading="${loading}" decoding="async">`;

function heroAction(hero) {
  const label = hero.action?.label ?? '프로젝트 영상 보기';
  if (hero.action?.href) return `<a class="app-hero-link" href="${escape(hero.action.href)}">${escape(label)} <span aria-hidden="true">${hero.action.href.startsWith('#') ? '↓' : '→'}</span></a>`;
  if (!hero.video) return '';
  return `<a class="app-remote" href="#${escape(hero.id)}-video" data-remote="${escape(hero.id)}-player" data-scroll="down" data-language="ko" data-label="${escape(label)}" aria-label="${escape(label)}">${controlImage('play', '', '')}<span>${escape(label)}</span></a>`;
}

function heroShowcase({ id, video, image }) {
  if (video) {
    const title = escape(video.title);
    return `<section id="${escape(id)}-video" class="app-project-showcase" aria-label="${title}"><div class="app-player app-cinema has-controls is-hidden-until-played" id="${escape(id)}-player" data-player><video controls playsinline preload="none" data-native-controls aria-label="${title}"${video.poster ? ` poster="${escape(video.poster)}"` : ''}><source src="${escape(video.src)}">${title} · <a href="${escape(video.src)}">영상 파일 열기</a></video><button class="app-player-button" type="button" data-player-play aria-label="${title} 영상 재생" hidden></button><span class="app-sr" role="status"></span></div></section>`;
  }
  return image ? `<section id="${escape(id)}-video" class="app-hero-panorama" aria-label="${escape(image.alt || '히어로 이미지')}"><div class="app-hero-panorama-content">${picture(image)}</div></section>` : '';
}

export function heroSection(hero) {
  const action = heroAction(hero);
  return `<section id="${escape(hero.id)}" class="app-landing-hero"><div class="app-shell"><div class="app-hero-copy">${hero.icon ? picture(hero.icon, 'app-hero-logo', 'eager') : ''}<p class="app-hero-description">${escape(hero.description)}</p>${action ? `<p class="app-hero-description">${action}</p>` : ''}</div></div></section>${heroShowcase(hero)}`;
}

export function projectsSection({ id, items }) {
  if (!items.length) return '';
  const slices = items.map(project => `<section class="app-landing-section app-landing-features"><div class="app-shell"><div class="app-landing-heading"><h2>${project.icon ? `${picture(project.icon)} ` : ''}${escape(project.title)}</h2>${paragraphs(project.description)}${project.link ? `<p><a class="app-landing-action" href="${escape(project.link.href)}">${escape(project.link.label)}</a></p>` : ''}</div>${project.image ? `<div class="app-landing-collage">${picture(project.image)}</div>` : ''}</div></section>`).join('');
  return `<div id="${escape(id)}">${slices}</div>`;
}

export function technologySection({ id, items }, brands) {
  if (!items.length) return '';
  const list = items.map(name => {
    const brand = brands.find(item => item.name === name);
    if (!brand) throw new Error(`unknown technology: ${name}`);
    return `<li class="app-technology"><a href="/tags/${encodeURIComponent(name)}/" aria-label="${escape(brand.label)} 태그 글 보기"><img src="/theme/assets/icons/brands/${escape(brand.file)}" alt="" decoding="async"><span class="app-sr">${escape(brand.label)}</span></a></li>`;
  }).join('');
  return `<div class="app-home-stories"><section class="app-technologies" id="${escape(id)}" aria-label="사용하는 기술" data-flow-rail data-flow-direction="right" data-flow-label="기술"><div class="app-home-rail"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="기술 아이콘"><ul class="app-flow-group" data-flow-group>${list}</ul></div></div></section></div>`;
}

export function interviewsSection({ id, items }, { examples = [], preview = false } = {}) {
  const cards = interviewSection(publicInterviews(items.length ? items : examples, preview), id);
  return cards && `<div class="app-home-stories">${cards}</div>`;
}

function newsletter(contact, id) {
  const ready = !!contact.endpoint;
  const heading = `<h2 id="${id}-title">${contact.icon ? `${picture(contact.icon)} ` : ''}${escape(contact.title)}</h2>`;
  const privacy = contact.privacy ? ` <a href="${escape(contact.privacy.href)}">${escape(contact.privacy.label)}</a>` : '';
  const state = ready
    ? (contact.note || privacy ? `<p class="app-newsletter-note" id="${id}-state">${escape(contact.note ?? '')}${privacy}</p>` : '')
    : `<p class="app-newsletter-note" id="${id}-state" role="status">구독 서비스를 준비 중입니다. 지금은 이메일 주소를 받지 않습니다.${privacy}</p>`;
  const disabled = ready ? '' : ' disabled';
  const form = `<form class="app-newsletter"${ready ? ` method="post" action="${escape(contact.endpoint)}"` : ''}><label class="app-sr" for="${id}-email">이메일 주소</label><input class="app-newsletter-email" type="email" id="${id}-email" name="${escape(contact.field)}" placeholder="me@example.com" autocomplete="email"${ready ? ' required' : ''}${disabled}${state ? ` aria-describedby="${id}-state"` : ''}>${state}<button type="submit"${disabled}>${escape(contact.button)}</button></form>`;
  const direct = contact.email ? `<p class="app-caption">메일로 직접 문의하려면 <a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a></p>` : '';
  return `<section id="${id}" class="app-landing-section app-landing-newsletter" aria-labelledby="${id}-title"><div class="app-shell"><div class="app-landing-heading">${heading}<p>${escape(contact.description)}</p></div>${form}${direct}</div></section>`;
}

export function contactSection(contact) {
  const id = escape(contact.id);
  if (contact.mode === 'newsletter') return newsletter(contact, id);
  return `<section id="${id}" class="app-home-contact" aria-labelledby="${id}-title"><h2 id="${id}-title">${escape(contact.title)}</h2><p>${escape(contact.description)}</p><a class="app-primary-action" href="mailto:${escape(contact.email)}">${escape(contact.button)} <span aria-hidden="true">→</span></a></section>`;
}
