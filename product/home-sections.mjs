// 홈의 영상, 기술 목록과 연락을 발행 설정에서 조합한다.
import { escape } from './markdown.mjs';

export function flowControls(label) {
  return `<div class="app-flow-controls" data-flow-controls hidden><button type="button" data-flow-prev aria-label="이전 ${label}"><span aria-hidden="true">‹</span></button><button type="button" data-flow-toggle aria-label="${label} 흐름 멈추기"><span data-flow-symbol aria-hidden="true">Ⅱ</span><span class="app-sr" data-flow-state>흐름 멈추기</span></button><button type="button" data-flow-next aria-label="다음 ${label}"><span aria-hidden="true">›</span></button></div>`;
}

function mediaUrl(value) {
  if (/^\/media\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
  if (new URL(value).protocol !== 'https:') throw new Error('project media requires HTTPS or a local media path');
  return value;
}

export function projectVideo(project) {
  if (!project) return '';
  const title = escape(project.title);
  const media = project.src
    ? `<div class="app-player has-controls" id="project-demo" data-player><video controls playsinline preload="none" data-native-controls aria-label="${title}"${project.poster ? ` poster="${escape(mediaUrl(project.poster))}"` : ''}><source src="${escape(mediaUrl(project.src))}">${title} · <a href="${escape(mediaUrl(project.src))}">영상 파일 열기</a></video><button class="app-player-button" type="button" data-player-play aria-label="${title} 영상 재생" hidden></button><span class="app-sr" role="status"></span></div>`
    : `<div class="app-project-video-placeholder"><p class="app-eyebrow">${title}</p><p>프로젝트 영상이 들어갈 공간</p><span class="app-caption">${escape(project.description)}</span></div>`;
  return `<section id="project-video" class="app-project-showcase" aria-label="${title}"><div class="app-project-video">${media}</div>${project.src ? `<div class="app-project-caption"><p><strong>${title}</strong><span>${escape(project.description)}</span></p>${project.href ? `<a href="${escape(mediaUrl(project.href))}">프로젝트 자세히 보기 <span aria-hidden="true">→</span></a>` : ''}</div>` : ''}</section>`;
}

export function technologySection(ids = [], brands = []) {
  if (!ids.length) return '';
  if (new Set(ids).size !== ids.length) throw new Error('duplicate technology');
  const items = ids.map(id => {
    const brand = brands.find(item => item.name === id);
    if (!brand) throw new Error(`unknown technology: ${id}`);
    return `<li class="app-technology"><img src="/theme/assets/icons/brands/${escape(brand.file)}" alt="" decoding="async"><span>${escape(brand.label)}</span></li>`;
  }).join('');
  return `<section class="app-technologies" aria-label="사용하는 기술" data-flow-rail data-flow-direction="right" data-flow-label="기술"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="기술 아이콘"><ul class="app-flow-group" data-flow-group>${items}</ul></div>${flowControls('기술')}</section>`;
}

export function contactSection(contact) {
  if (!contact?.email) return '';
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contact.email)) throw new Error('invalid contact email');
  return `<section class="app-home-contact" aria-labelledby="contact-title"><h2 id="contact-title">함께 만들고 싶은 것이 있나요?</h2><p>프로젝트와 협업에 관한 이야기를 기다립니다.</p><a class="app-primary-action" href="mailto:${escape(contact.email)}">메일 보내기 <span aria-hidden="true">→</span></a><p class="app-caption">${escape(contact.email)}</p></section>`;
}
