// 홈 설정의 섹션 종류마다 독립된 HTML 구성 요소를 만든다.
import { controlImage } from './controls.mjs';
import { escape } from './markdown.mjs';
import { interviewCards, publicInterviews } from './interviews.mjs';
import { socialIcon } from './publication-footer.mjs';

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
  return `<section id="${escape(hero.id)}" class="app-landing-hero"><div class="app-shell"><div class="app-hero-copy">${hero.icon ? picture({ ...hero.icon, alt: hero.icon.alt || hero.title || '' }, 'app-hero-logo', 'eager') : hero.title ? `<p class="app-hero-title" aria-hidden="true">${escape(hero.title)}</p>` : ''}<p class="app-hero-description">${escape(hero.description)}</p>${action ? `<p class="app-hero-description">${action}</p>` : ''}</div></div></section>${heroShowcase(hero)}`;
}

// 프로젝트, 기술, 인터뷰, 구독이 함께 쓰는 섹션 머리: 아이콘, 제목, 설명, 링크 행, 동작 링크.
function sectionIntro({ icon, title, titleId, description, links = [], action }) {
  const row = links.length ? `<p class="app-landing-social">${links.map(item => `<a href="${escape(item.href)}"${item.icon ? ` aria-label="${escape(item.label)}"` : ''}>${linkIcon(item) || escape(item.label)}</a>`).join('')}</p>` : '';
  const more = action ? `<p><a class="app-landing-action" href="${escape(action.href)}">${escape(action.label)}</a></p>` : '';
  return `<div class="app-landing-heading"><h2${titleId ? ` id="${escape(titleId)}"` : ''}>${icon ? `${picture(icon)} ` : ''}${escape(title)}</h2>${description ? paragraphs(description) : ''}${row}${more}</div>`;
}

function linkIcon({ icon }) {
  if (!icon) return '';
  return icon.startsWith('/') ? picture({ src: icon, alt: '' }) : socialIcon(icon, 'app-landing-symbol');
}

export function projectsSection({ id, items }) {
  if (!items.length) return '';
  const slices = items.map(project => `<section class="app-landing-section app-landing-features"><div class="app-shell">${sectionIntro({ ...project, action: project.link })}${project.image ? `<div class="app-landing-collage">${picture(project.image)}</div>` : ''}</div></section>`).join('');
  return `<div id="${escape(id)}">${slices}</div>`;
}

function flowRail(attributes, label, items) {
  return `<div ${attributes}><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="${label}"><ul class="app-flow-group" data-flow-group>${items}</ul></div></div>`;
}

export function technologySection(section, brands) {
  if (!section.items.length) return '';
  const list = section.items.map(name => {
    const brand = brands.find(item => item.name === name);
    if (!brand) throw new Error(`unknown technology: ${name}`);
    return `<li class="app-technology"><a href="/tags/${encodeURIComponent(name)}/" aria-label="${escape(brand.label)} 태그 글 보기"><img src="/theme/assets/icons/brands/${escape(brand.file)}" alt="" decoding="async"><span class="app-sr">${escape(brand.label)}</span></a></li>`;
  }).join('');
  const id = escape(section.id);
  return `<section id="${id}" class="app-landing-section app-landing-technologies" aria-labelledby="${id}-title"><div class="app-shell">${sectionIntro({ ...section, titleId: `${section.id}-title` })}${flowRail('class="app-technologies" data-flow-rail data-flow-direction="right" data-flow-label="기술"', '기술 아이콘', list)}</div></section>`;
}

export function interviewsSection(section, { examples = [], preview = false } = {}) {
  const entries = publicInterviews(section.items.length ? section.items : examples, preview);
  const cards = interviewCards(entries);
  if (!cards) return '';
  const id = escape(section.id);
  return `<section id="${id}" class="app-landing-section app-landing-interviews" aria-labelledby="${id}-title"><div class="app-shell">${sectionIntro({ ...section, titleId: `${section.id}-title` })}${flowRail('class="app-interviews" data-flow-rail data-flow-label="인터뷰"', '인터뷰 카드', cards)}</div></section>`;
}

function newsletter(contact, id) {
  const ready = !!contact.endpoint;
  const heading = sectionIntro({ icon: contact.icon, title: contact.title, titleId: `${id}-title`, description: contact.description });
  const privacy = contact.privacy ? ` <a href="${escape(contact.privacy.href)}">${escape(contact.privacy.label)}</a>` : '';
  const state = ready
    ? (contact.note || privacy ? `<p class="app-newsletter-note" id="${id}-state">${escape(contact.note ?? '')}${privacy}</p>` : '')
    : `<p class="app-newsletter-note" id="${id}-state" role="status">구독 서비스를 준비 중입니다. 지금은 이메일 주소를 받지 않습니다.${privacy}</p>`;
  const disabled = ready ? '' : ' disabled';
  const form = `<form class="app-newsletter"${ready ? ` method="post" action="${escape(contact.endpoint)}"` : ''}><label class="app-sr" for="${id}-email">이메일 주소</label><input class="app-newsletter-email" type="email" id="${id}-email" name="${escape(contact.field)}" placeholder="me@example.com" autocomplete="email"${ready ? ' required' : ''}${disabled}${state ? ` aria-describedby="${id}-state"` : ''}>${state}<button type="submit"${disabled}>${escape(contact.button)}</button></form>`;
  const direct = contact.email ? `<p class="app-caption">메일로 직접 문의하려면 <a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a></p>` : '';
  return `<section id="${id}" class="app-landing-section app-landing-newsletter" aria-labelledby="${id}-title"><div class="app-shell">${heading}${form}${direct}</div></section>`;
}

export function contactSection(contact) {
  const id = escape(contact.id);
  if (contact.mode === 'newsletter') return newsletter(contact, id);
  return `<section id="${id}" class="app-home-contact" aria-labelledby="${id}-title"><h2 id="${id}-title">${escape(contact.title)}</h2><p>${escape(contact.description)}</p><a class="app-primary-action" href="mailto:${escape(contact.email)}">${escape(contact.button)} <span aria-hidden="true">→</span></a></section>`;
}
