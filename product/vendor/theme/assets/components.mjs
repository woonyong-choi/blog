// simple 테마의 표현 구성 요소. HTML 모양과 변형은 이 파일에서만 정의하고 소비자는 가져다 쓴다.
// 순수 함수다: 파일·콘텐츠·네트워크를 읽지 않고 받은 속성만 출력한다. 스타일은 같은 테마의 styles/*.css가 소유한다.
//
// 속성 종류
//   글자(text)   : 받은 값을 이 파일이 이스케이프한다.
//   주소(url)    : 이 파일이 검사하고, 안 되는 값은 오류를 던진다.
//   슬롯(slot)   : `trusted(html)`로 감싼 값만 받는다. 소비자가 이미 안전하게 만든 HTML(이미지, 아이콘, Markdown 결과)이다.
//   식별자(id)   : 글자·숫자·`_`·`-`만. 소비자가 문서 안에서 유일하게 정한다.
// 순서가 있는 본문(탭 패널, 카드 묶음)은 `X.open(...)`/`X.close()`로 토큰 스트림에도 쓸 수 있다.

const ID = /^[\w-]+$/;
const CARD_VARIANTS = ['centered', 'grouped', 'inline', 'related'];

export const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function safeUrl(value) {
  if (typeof value !== 'string' || /[\u0000- \\]/u.test(value) || !/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/.test(value)) throw new Error(`Unsupported URL: ${value}`);
  return escape(value);
}

class Trusted {
  constructor(html) { this.html = String(html); }
  toString() { return this.html; }
}
/** 이미 안전하게 만든 HTML을 슬롯으로 넘긴다. 이스케이프하지 않는다. */
export const trusted = (html) => new Trusted(html);
export const isTrusted = (value) => value instanceof Trusted;

function slot(value, name) {
  if (!isTrusted(value)) throw new TypeError(`${name} must be trusted(html)`);
  return value.html;
}
function id(value) {
  if (typeof value !== 'string' || !ID.test(value)) throw new TypeError(`Invalid id: ${value}`);
  return value;
}
const out = (html) => trusted(html);

/** 본문 블록 폭: content(본문 폭), narrow(좁은 미디어 폭), wide(넓은 미디어 폭). 옛 표기 `wide: true`, `size: 'compact'`도 받는다. */
export const WIDTHS = ['content', 'narrow', 'wide'];
export function contentWidth({ width, wide, size } = {}) {
  if (width !== undefined && !WIDTHS.includes(width)) throw new Error(`Unknown width: ${width}`);
  const aliases = [wide === true ? 'wide' : undefined, size === 'compact' ? 'narrow' : undefined].filter(Boolean);
  if (size !== undefined && size !== 'compact') throw new Error(`Unknown size: ${size}`);
  if (aliases.length > 1 || (width !== undefined && aliases.length && aliases[0] !== width)) throw new Error(`Conflicting width: ${[width, ...aliases].filter(Boolean).join(', ')}`);
  return width ?? aliases[0] ?? 'content';
}
const widthClass = (props) => { const width = contentWidth(props); return width === 'content' ? '' : ` app-width-${width}`; };

export function CopyButton({ label = '코드 복사' } = {}) {
  return out(`<button type="button" data-copy aria-label="${escape(label)}" hidden>복사</button>`);
}

/** `code`는 이스케이프 또는 구문 강조를 마친 `<code>` 슬롯이다. */
export function CodeBlock({ code, label = '코드 복사', language = '', filename = '', width }) {
  const heading = [language, filename].filter(Boolean).map(escape).join(' · ');
  return out(`<div class="app-code${widthClass({ width })}"><div class="app-code-header"><span class="app-code-language">${heading}</span>${CopyButton({ label })}</div><pre>${slot(code, 'code')}</pre><span class="app-sr" data-copy-status role="status" aria-live="polite" aria-atomic="true"></span></div>`);
}

export function Callout({ title, tone, fineprint = false, body }) {
  return out(`${Callout.open({ title, tone, fineprint })}${slot(body, 'body')}${Callout.close()}`);
}
Callout.open = ({ title, tone, fineprint = false }) => `<aside class="app-callout${tone === 'warning' ? ' is-warning' : ''}${fineprint ? ' is-fineprint' : ''}"><strong>${escape(title)}</strong>`;
Callout.close = () => '</aside>';

export function TooltipTrigger({ id: target, label }) {
  return out(`<button class="app-tooltip" type="button" popovertarget="${id(target)}" data-tooltip-trigger>${escape(label)}</button>`);
}
/** 글자만 있으면 문장 안에 들어가는 `span`, 슬롯 본문이면 블록 `div`다. */
export function TooltipBubble({ id: target, text, body }) {
  return out(body === undefined
    ? `<span class="app-tooltip-bubble" id="${id(target)}" role="tooltip" popover>${escape(text)}</span>`
    : `<div class="app-tooltip-bubble" id="${id(target)}" popover>${slot(body, 'body')}</div>`);
}
/** 문장 안 설명: 눌러 여는 글 + 말풍선. */
export const Tooltip = ({ id: target, label, text }) => out(`${TooltipTrigger({ id: target, label })}${TooltipBubble({ id: target, text })}`);
/** 블록 설명: 단락 하나의 단추 + 슬롯 본문 말풍선. */
export const TooltipBlock = ({ id: target, label, body }) => out(`<p>${TooltipTrigger({ id: target, label })}</p>${TooltipBubble({ id: target, body })}`);

/** 탭 묶음. `tabs`는 `{ label, body }`이고 body는 슬롯이다. */
export function Tabs({ id: group, label, platform = false, tabs }) {
  if (!Array.isArray(tabs) || !tabs.length) throw new Error('Tabs require tabs');
  return out(`${Tabs.open({ id: group, label, platform, labels: tabs.map((tab) => tab.label) })}${tabs.map((tab, index) => `${Tabs.panelOpen({ id: group, index })}${slot(tab.body, 'tab body')}${Tabs.panelClose()}`).join('')}${Tabs.close()}`);
}
Tabs.open = ({ id: group, label = '기기별 안내', platform = false, labels }) => `<section class="app-tabs${platform ? ' is-platform' : ''}" data-tabs${platform ? ' data-platform' : ''}><div class="app-tablist" role="tablist" aria-label="${escape(label)}">${labels.map((text, index) => `<button type="button" id="${id(group)}-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="${group}-panel-${index}" tabindex="${index ? '-1' : '0'}">${escape(text)}</button>`).join('')}</div>`;
Tabs.panelOpen = ({ id: group, index }) => `<div class="app-tabpanel" id="${id(group)}-panel-${index}" role="tabpanel" aria-labelledby="${group}-tab-${index}" tabindex="0"${index ? ' hidden' : ''}>`;
Tabs.panelClose = () => '</div>';
Tabs.close = () => '</section>';

/** 도움말 카드. `icon`은 슬롯이고 없으면 아이콘 자리가 없다. `related`는 함께 읽기 카드다. `headingLevel`을 주면 제목이 해당 단계의 제목 역할이 된다. */
export function Card({ href, title, description = '', icon, variant, compact = false, horizontal = false, headingLevel }) {
  if (variant !== undefined && !CARD_VARIANTS.includes(variant)) throw new Error(`Unknown card variant: ${variant}`);
  const link = safeUrl(href);
  const heading = headingLevel === undefined ? '<strong>' : `<strong role="heading" aria-level="${Number(headingLevel)}">`;
  const mark = icon === undefined || icon === false ? '' : slot(icon, 'icon');
  if (variant === 'related') return out(`<a class="app-help-card app-related-link${mark ? '' : ' has-no-icon'}" href="${link}">${mark}${heading}${escape(title)}</strong>${description ? `<span>${escape(description)}</span>` : ''}</a>`);
  const classes = variant ? ` is-${variant}` : compact ? ' is-compact' : horizontal ? ' is-horizontal' : '';
  const bare = !mark || (compact && !variant);
  return out(`<a class="app-help-card${classes}${bare ? ' has-no-icon' : ''}" href="${link}">${bare ? '' : mark}${heading}${escape(title)}</strong>${description ? `<p>${escape(description)}</p>` : ''}</a>`);
}

/** 카드 묶음. `cards`는 Card 결과(슬롯)의 배열이다. `split`은 첫 카드를 크게 두는 배치다. */
export function CardGroup({ variant, columns, split = false, cards }) {
  const items = cards.map((card) => slot(card, 'card'));
  if (split && variant !== 'inline' && variant !== 'related') return out(`<div class="app-support-split">${items[0]}<div class="app-support-links">${items.slice(1).join('')}</div></div>`);
  return out(`${CardGroup.open({ variant, columns })}${items.join(CardGroup.gap(variant))}${CardGroup.close()}`);
}
CardGroup.open = ({ variant, columns }) => variant === 'related' ? '<div class="app-related-grid">' : variant === 'inline' ? '<div class="app-inline-links">' : `<div class="app-support-grid${Number(columns) === 2 ? ' is-pair' : ''}">`;
CardGroup.close = () => '</div>';
CardGroup.gap = (variant) => variant === 'inline' ? ' ' : '';

/** 번호 단추로 한 장씩 보는 갤러리. `slides`는 `{ image(슬롯), caption, label }`이다. */
export function Gallery({ id: group, title = '이미지 슬라이드', wide, width, selected = 0, slides }) {
  if (!Array.isArray(slides) || !slides.length) throw new Error('Gallery requires slides');
  if (!Number.isInteger(selected) || selected < 0 || selected >= slides.length) throw new Error('Gallery selected index is out of range');
  const labeled = slides.every((slide) => typeof slide.label === 'string');
  return out(`<section class="app-gallery${labeled ? ' is-labeled' : ''}${widthClass({ width, wide })}" data-gallery aria-label="${escape(title)}"><div class="app-gallery-frame">${slides.map((slide, index) => `<figure id="${id(group)}-${index}" class="app-gallery-slide${index === selected ? ' is-selected' : ''}" data-slide aria-hidden="${index !== selected}">${slot(slide.image, 'slide image')}${slide.caption ? `<figcaption>${escape(slide.caption)}</figcaption>` : ''}</figure>`).join('')}</div><div class="app-gallery-controls">${slides.map((slide, index) => `<button type="button" data-slide-index="${index}" aria-controls="${group}-${index}" aria-pressed="${index === selected}" aria-label="${escape(slide.label ?? `슬라이드 ${index + 1}`)}">${escape(slide.label ?? index + 1)}</button>`).join('')}</div></section>`);
}

/** 그림과 영상 같은 미디어 한 장. `media`는 슬롯, `href`를 주면 링크로 감싼다. `controls` 슬롯은 캡션 줄에 붙는다. */
export function Figure({ media, href, caption = '', controls, width, wide, size }) {
  const body = href === undefined ? slot(media, 'media') : `<a href="${safeUrl(href)}">${slot(media, 'media')}</a>`;
  return out(`<figure class="${FIGURE_CLASS}${widthClass({ width, wide, size })}">${body}${caption || controls ? `<figcaption>${escape(caption)}${controls === undefined ? '' : slot(controls, 'controls')}</figcaption>` : ''}</figure>`);
}

const GRID_COLUMNS = { 1: 'one-column', 2: 'two-columns', 3: 'three-columns', 4: 'four-columns', 5: 'five-columns', 6: 'six-columns' };
/** 그림 격자. `figures`는 Figure 결과의 배열이다. */
export function FigureGrid({ columns, size, figures }) {
  if (!Array.isArray(figures) || !figures.length) throw new Error('FigureGrid needs figures');
  if (columns !== undefined && !(['number', 'string'].includes(typeof columns) && Object.hasOwn(GRID_COLUMNS, columns))) throw new Error(`Invalid columns: ${columns}`);
  if (size !== undefined && !['small', 'large'].includes(size)) throw new Error(`Invalid size: ${size}`);
  return out(`<div class="app-figure-grid${size ? ` is-${size}` : ''}${columns === undefined ? '' : ` has-${GRID_COLUMNS[columns]}`}">${figures.map((figure) => `<div class="app-figure-grid-item">${slot(figure, 'figure')}</div>`).join('')}</div>`);
}

/** 영상 자리. `src`, `poster`는 소비자가 확인한 주소다. */
export function Player({ id: target, src, poster, title = '기능 소개 영상', width, height, controls = false, overlay = false, wide = false }) {
  return out(`<div class="app-player${wide ? ' is-wide' : ''}${controls ? ' has-controls' : ''}" data-player id="${id(target)}"><video${width ? ` width="${Number(width)}"` : ''}${height ? ` height="${Number(height)}"` : ''} playsinline${controls ? '' : ' muted'} preload="none" poster="${safeUrl(poster)}" aria-label="${escape(title)}"${controls ? ' data-native-controls' : ''}><source src="${safeUrl(src)}" type="video/mp4"></video>${overlay || controls ? '<button class="app-player-button" type="button" data-player-play aria-label="Play video"></button>' : ''}<span class="app-sr" role="status"></span></div>`);
}
export function RemoteButton({ id: target, src, icon }) {
  return out(`<button class="app-remote" type="button" data-remote="${id(target)}"${src ? ` data-video-src="${safeUrl(src)}"` : ''} aria-label="Play video">${slot(icon, 'icon')}<span>Play</span></button>`);
}
/** 기기 틀. `label`을 주면 이름이 있는 `figure`, `figure: true`면 이름 없는 `figure`, 아니면 `div`다. */
export function Device({ screen, overlay, label, figure = false }) {
  const inner = `<div class="app-device-screen">${slot(screen, 'screen')}</div>${slot(overlay, 'overlay')}`;
  if (label !== undefined) return out(`<figure class="app-device" aria-label="${escape(label)}">${inner}</figure>`);
  return out(figure ? `<figure class="app-device">${inner}</figure>` : `<div class="app-device">${inner}</div>`);
}
export const MediaControls = ({ remote }) => out(`<div class="app-media-controls">${slot(remote, 'remote')}</div>`);
/** 영상 한 장: 플레이어(선택: 기기 틀) + 캡션 + 재생 단추. */
export function Video({ id: target, src, poster, title, caption, playerWidth, playerHeight, controls = false, playerWide = false, frame, remoteIcon, deviceOverlay, width, wide, size }) {
  const view = Player({ id: target, src, poster, title, width: playerWidth, height: playerHeight, controls, wide: playerWide });
  const media = frame === 'iphone' ? Device({ screen: view, overlay: deviceOverlay }) : view;
  return Figure({ media, caption, controls: MediaControls({ remote: RemoteButton({ id: target, icon: remoteIcon }) }), width, wide, size });
}

export const FIGURE_CLASS = 'app-figure';
/** 작은 글씨 단락. 토큰 스트림에서는 문단에 이 클래스를 붙인다. */
export const FINEPRINT_CLASS = 'app-fineprint';
export const Fineprint = ({ text }) => out(`<p class="${FINEPRINT_CLASS}">${slot(text, 'text')}</p>`);
/** 넓은 간격의 목록(단계). */
export const Steps = ({ body }) => out(`${Steps.open()}${slot(body, 'body')}${Steps.close()}`);
Steps.open = () => '<div class="app-steps">';
Steps.close = () => '</div>';
/** 질문과 답 표. 토큰 스트림에서는 정의 목록에 이 클래스를 붙인다. */
export const DEFINITIONS_CLASS = 'app-definitions';
export const Definitions = ({ items }) => out(`<dl class="${DEFINITIONS_CLASS}">${items.map((item) => `<dt>${escape(item.term)}</dt><dd>${slot(item.body, 'body')}</dd>`).join('')}</dl>`);

export const Kbd = ({ text }) => out(`<kbd>${escape(text)}</kbd>`);
export const Menu = ({ text }) => out(`<b class="app-menu-label">${escape(text)}</b>`);
export const InlineIcon = ({ icon }) => out(`<span class="app-inline-icon">${slot(icon, 'icon')}</span>`);
export const CancelledTask = () => out('<span class="app-cancelled-task" role="img" aria-label="취소된 작업"></span>');


// ---- 소개·목록·홈 구성 요소 ----

export const SocialRow = ({ links }) => out(`<p class="app-landing-social">${slot(links, 'links')}</p>`);
/** 섹션 머리: 아이콘, 제목(글자 또는 슬롯), 설명 단락 슬롯, 링크 행 슬롯, 동작 링크. 홈 섹션과 기능 소개가 같이 쓴다. */
export function SectionIntro({ level = 2, id: heading, icon, title, description, links, action }) {
  if (!Number.isInteger(level) || level < 1 || level > 6) throw new Error(`Invalid heading level: ${level}`);
  return out(`<div class="app-landing-heading"><h${level}${heading ? ` id="${id(heading)}"` : ''}>${icon === undefined ? '' : `${slot(icon, 'icon')} `}${isTrusted(title) ? title.html : escape(title)}</h${level}>${description === undefined ? '' : slot(description, 'description')}${links === undefined ? '' : SocialRow({ links })}${action ? `<p><a class="app-landing-action" href="${safeUrl(action.href)}">${escape(action.label)}</a></p>` : ''}</div>`);
}
/** 링크 행의 항목. 주소가 없으면 아이콘만 보이는 자리표시이며 링크로 읽히지 않는다. */
export function SocialLink({ href, label, icon }) {
  if (href === undefined) return out(`<span role="img" aria-label="${escape(label)} · 주소 준비 중">${icon === undefined ? '' : slot(icon, 'icon')}</span>`);
  return out(`<a href="${safeUrl(href)}"${icon === undefined ? '' : ` aria-label="${escape(label)}"`}>${icon === undefined ? escape(label) : slot(icon, 'icon')}</a>`);
}

const RAILS = { technologies: 'app-technologies', interviews: 'app-interviews' };
/** 가로로 흐르는 목록. `items`는 `li` 슬롯이고 `kind`는 technologies 또는 interviews다. */
export function FlowRail({ kind, direction, label, ariaLabel, items }) {
  if (!Object.hasOwn(RAILS, kind)) throw new Error(`Unknown rail: ${kind}`);
  if (direction !== undefined && direction !== 'right') throw new Error(`Unknown direction: ${direction}`);
  return out(`<div class="${RAILS[kind]}" data-flow-rail${direction ? ` data-flow-direction="${direction}"` : ''} data-flow-label="${escape(label)}"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="${escape(ariaLabel)}"><ul class="app-flow-group" data-flow-group>${slot(items, 'items')}</ul></div></div>`);
}
export const FlowRows = ({ rails }) => out(`<div class="app-interview-rows" data-flow-rows>${slot(rails, 'rails')}</div>`);

/** 동작 링크 모양의 재생 단추. 같은 쪽의 영상 자리(`id`)를 가리킨다. */
export function RemoteLink({ id: target, href, label, icon }) {
  return out(`<a class="app-remote" href="${safeUrl(href)}" data-remote="${id(target)}" data-scroll="down" data-label="${escape(label)}" aria-label="${escape(label)}">${slot(icon, 'icon')}<span>${escape(label)}</span></a>`);
}
/** 홈의 프로젝트 영상: 컨트롤이 있는 영상, 재생 전 숨김 단추, 파일 링크. */
export function ProjectShowcase({ id: section, title, src, poster }) {
  const name = escape(title);
  const file = safeUrl(src);
  return out(`<section id="${id(section)}-video" class="app-project-showcase" aria-label="${name}"><div class="app-player app-cinema has-controls is-hidden-until-played" id="${section}-player" data-player><video controls playsinline preload="none" data-native-controls aria-label="${name}"${poster ? ` poster="${safeUrl(poster)}"` : ''}><source src="${file}">${name} · <a href="${file}">영상 파일 열기</a></video><button class="app-player-button" type="button" data-player-play aria-label="${name} 영상 재생" hidden></button><span class="app-sr" role="status"></span></div></section>`);
}
export const Panorama = ({ id: section, label, image }) => out(`<section id="${id(section)}-video" class="app-hero-panorama" aria-label="${escape(label)}"><div class="app-hero-panorama-content">${slot(image, 'image')}</div></section>`);

/** 블로그 카드: 덮개(이미지·아이콘 슬롯), 제목 링크, 태그 슬롯. 피드 본문과는 다른 목록용 카드다. */
export function BlogCard({ href, title, level = 3, cover, tags }) {
  const heading = level === 2 ? 'h2' : 'h3';
  const link = safeUrl(href);
  return out(`<article class="app-blog-card"><a class="app-blog-cover" href="${link}" aria-label="${escape(title)}">${slot(cover, 'cover')}</a><div class="app-blog-card-body"><${heading} class="app-blog-card-title"><a href="${link}">${escape(title)}</a></${heading}>${slot(tags, 'tags')}</div></article>`);
}
/** 쪽 이동. `before`·`after`는 `{ href, text }`, `numbers`는 `{ page, href, current }`, `summary`는 번호 대신 쓰는 글자다. */
export function PageLinks({ label, before, after, numbers = [], summary, resultPages = false }) {
  const edge = (item, rel) => item ? `<a rel="${rel}" href="${safeUrl(item.href)}">${escape(item.text)}</a>` : '';
  const middle = summary === undefined ? numbers.map((item) => item.current ? `<span aria-current="page">${Number(item.page)}</span>` : `<a href="${safeUrl(item.href)}" aria-label="${Number(item.page)}페이지">${Number(item.page)}</a>`).join('') : `<span>${escape(summary)}</span>`;
  return out(`<nav class="app-page-links"${resultPages ? ' data-result-pages' : ''} aria-label="${escape(label)}">${edge(before, 'prev')}${middle}${edge(after, 'next')}</nav>`);
}
export const ListLink = ({ href, text }) => out(`<p class="app-page-links"><a href="${safeUrl(href)}">${escape(text)}</a></p>`);

/** 태그 목록. `limit`을 넘는 태그는 `+N` 접기 안에 둔다. */
export const Tag = ({ href, label }) => out(`<a class="app-tag" href="${safeUrl(href)}">${escape(label)}</a>`);
export function TagList({ tags, limit = Infinity }) {
  const link = (tag) => String(Tag(tag));
  const remaining = tags.slice(limit);
  return out(`<div class="app-tags" role="group" aria-label="태그">${tags.slice(0, limit).map(link).join('')}${remaining.length ? `<details class="app-tags-more"><summary>+${remaining.length}</summary><div class="app-tags">${remaining.map(link).join('')}</div></details>` : ''}</div>`);
}

/** 이 글의 목차. `sections`는 `{ id, title }`이다. */
export const Toc = ({ title, label, sections }) => out(`<nav class="app-toc" aria-label="${escape(label)}"><h2 class="app-toc-heading">${escape(title)}</h2><ol class="app-toc-list">${sections.map((section) => `<li><a href="#${escape(section.id)}">${escape(section.title)}</a></li>`).join('')}</ol></nav>`);

/** 블로그 글 한 편의 틀(피드와 상세 공통). 본문·도입문·꼬리말은 슬롯이다. */
export function PostArticle({ id: post, detail = false, href, title, date, dateNote = '', lead, body, author, footer, after }) {
  const heading = detail ? `<h1 class="app-post-title" id="${id(post)}">${escape(title)}</h1>` : `<h2 class="app-post-title" id="${id(post)}"><a href="${safeUrl(href)}">${escape(title)}</a></h2>`;
  return out(`<article class="app-blog-post${detail ? ' is-detail' : ''}" aria-labelledby="${post}"><header class="app-post-header"><time class="app-post-date" datetime="${escape(date)}">${escape(date)}${escape(dateNote)}</time>${heading}</header><div class="app-prose app-feed-body"><p class="app-article-lead">${slot(lead, 'lead')}</p>${slot(body, 'body')}</div><footer class="app-post-footer">${author ? `<p class="app-post-author">${escape(author)}</p>` : ''}${footer === undefined ? '' : slot(footer, 'footer')}</footer>${after === undefined ? '' : slot(after, 'after')}</article>`);
}

const text = (value) => isTrusted(value) ? value.html : escape(value);
const ICON_SIZES = ['small', 'medium', 'card', 'proof'];
/** 이미지 파일로 된 콘텐츠 아이콘(브랜드 로고, 검색 결과 아이콘). */
export function ContentIconImage({ src, size = 'small' }) {
  if (!ICON_SIZES.includes(size)) throw new Error(`Unknown icon size: ${size}`);
  return out(`<span class="app-content-icon is-${size}"><img src="${safeUrl(src)}" alt="" decoding="async"></span>`);
}
/** 검색어와 겹치는 글자를 `mark`로 감싼 글. 나머지는 모두 이스케이프한다. 결과는 슬롯으로 쓴다. */
export function Highlight({ text: source, query = '' }) {
  const value = String(source).normalize('NFC');
  const terms = String(query).normalize('NFC').trim().split(/\s+/).filter(Boolean).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return out(escape(value));
  let end = 0;
  let html = '';
  for (const match of value.matchAll(new RegExp(terms.join('|'), 'giu'))) {
    html += `${escape(value.slice(end, match.index))}<mark>${escape(match[0])}</mark>`;
    end = match.index + match[0].length;
  }
  return out(html + escape(value.slice(end)));
}
/** 검색 결과의 링크 부분. 제목과 설명은 글자 또는 슬롯(`Highlight`)이다. */
export function SearchResultLink({ href, icon, title, example = false, description }) {
  return out(`<a class="app-search-result-link" href="${safeUrl(href)}">${slot(icon, 'icon')}<strong>${text(title)}</strong>${example ? '<span class="app-search-result-note"> 예시</span>' : ''}<p>${text(description)}</p></a>`);
}
/** 검색 결과 한 줄. 서버 렌더와 브라우저 렌더가 같은 함수를 쓴다. */
export function SearchResult({ href, icon, title, example = false, description, tags }) {
  return out(`<article class="app-search-entry">${SearchResultLink({ href, icon, title, example, description })}<div class="app-search-result-tags">${tags.map((tag) => `<a href="${safeUrl(tag.href)}">${escape(tag.label)}</a>`).join('')}</div></article>`);
}

/** 소비자가 같은 모양을 직접 만들지 못하도록 검사하는 이 파일 소유 최상위 클래스 */
export const OWNED_CLASSES = ['app-code', 'app-callout', 'app-tabs', 'app-tablist', 'app-tabpanel', 'app-tooltip', 'app-tooltip-bubble', 'app-help-card', 'app-related-grid', 'app-inline-links', 'app-support-grid', 'app-support-split', 'app-gallery', 'app-figure', 'app-figure-grid', 'app-player', 'app-remote', 'app-device', 'app-media-controls', 'app-fineprint', 'app-steps', 'app-definitions', 'app-inline-icon', 'app-menu-label', 'app-cancelled-task', 'app-landing-heading', 'app-landing-social', 'app-flow-viewport', 'app-technologies', 'app-interviews', 'app-interview-rows', 'app-remote', 'app-project-showcase', 'app-hero-panorama', 'app-blog-card', 'app-page-links', 'app-tags', 'app-tag', 'app-toc', 'app-blog-post', 'app-search-entry', 'app-search-result-link', 'app-search-result-tags', 'app-search-result-note', 'app-tags-more'];
