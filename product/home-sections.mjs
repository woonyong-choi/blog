// 홈의 영상, 기술 목록과 연락을 발행 설정에서 조합한다.
import { escape } from './markdown.mjs';

function mediaUrl(value) {
  if (/^\/media\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
  if (new URL(value).protocol !== 'https:') throw new Error('project media requires HTTPS or a local media path');
  return value;
}

export function projectVideo(project) {
  if (!project) return '';
  const title = escape(project.title);
  const media = project.src
    ? `<div class="app-player has-controls" id="project-demo" data-player><video controls playsinline preload="none" data-native-controls aria-label="${title}"${project.poster ? ` poster="${escape(mediaUrl(project.poster))}"` : ''}><source src="${escape(mediaUrl(project.src))}">${title} · <a href="${escape(mediaUrl(project.src))}">영상 파일 열기</a></video><button class="app-player-button is-compact" type="button" data-player-play aria-label="${title} 영상 재생" hidden></button><span class="app-sr" role="status"></span></div>`
    : `<div class="app-project-video-placeholder"><p class="app-eyebrow">${title}</p><p>프로젝트 영상이 들어갈 공간</p><span class="app-caption">${escape(project.description)}</span></div>`;
  return `<section id="project-video" class="app-project-showcase" aria-label="${title}"><div class="app-project-video">${media}</div>${project.src ? `<div class="app-project-caption"><p><strong>${title}</strong><span>${escape(project.description)}</span></p>${project.href ? `<a href="${escape(mediaUrl(project.href))}">프로젝트 자세히 보기 <span aria-hidden="true">→</span></a>` : ''}</div>` : ''}</section>`;
}

export function technologySection(ids = [], brands = []) {
  if (!ids.length) return '';
  if (new Set(ids).size !== ids.length) throw new Error('duplicate technology');
  const items = ids.map(id => {
    const brand = brands.find(item => item.name === id);
    if (!brand) throw new Error(`unknown technology: ${id}`);
    return `<li class="app-technology"><a href="/tags/${encodeURIComponent(id)}/" aria-label="${escape(brand.label)} 태그 글 보기"><img src="/theme/assets/icons/brands/${escape(brand.file)}" alt="" decoding="async"><span class="app-sr">${escape(brand.label)}</span></a></li>`;
  }).join('');
  return `<section class="app-technologies" aria-label="사용하는 기술" data-flow-rail data-flow-direction="right" data-flow-label="기술"><div class="app-home-rail"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="기술 아이콘"><ul class="app-flow-group" data-flow-group>${items}</ul></div></div></section>`;
}

export function contactSection(contact) {
  if (!contact?.email) return '';
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contact.email)) throw new Error('invalid contact email');
  return `<section class="app-home-contact" aria-labelledby="contact-title"><h2 id="contact-title">함께 만들어 볼까요?</h2><p>프로젝트와 협업에 관한 이야기를 기다립니다.</p><a class="app-primary-action" href="mailto:${escape(contact.email)}">메일 보내기 <span aria-hidden="true">→</span></a></section>`;
}
