// Markdown과 명시적인 문서 구성 요소를 정적 HTML로 변환한다.
import { readFileSync } from 'node:fs';
import MarkdownIt from '../assets/vendor/markdown-it.mjs';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import { parse } from 'yaml';
import { contentIcon, iconLab } from './content-icons.mjs';

const IMAGE_SIZES = JSON.parse(readFileSync(new URL('./image-sizes.json', import.meta.url)));
export const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function safeUrl(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/u.test(value) || !/^(?:https?:\/\/|mailto:|\/things\/|#)/.test(value)) throw new Error(`Unsupported URL: ${value}`);
  return escape(value);
}
export function asset(name) {
  if (typeof name !== 'string' || !/^[\w.-]+$/.test(name)) throw new Error(`Invalid asset: ${name}`);
  return `/things/assets/${name}`;
}
const referenceIcon = (name = 'question') => `<span class="app-article-icon app-icon-${escape(name)}" aria-hidden="true"></span>`;
export function icon(name = 'question') {
  if (typeof name === 'object' && name !== null) return contentIcon(name);
  if (typeof name === 'string' && name.startsWith('content:')) return contentIcon(name.slice(8));
  return referenceIcon(name);
}
export function image(name, alt = '', className = '') {
  const size = IMAGE_SIZES[name];
  return `<img${size ? ` width="${size[0]}" height="${size[1]}"` : ''} class="${className}" src="${asset(name)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
}

export function player(data, id, controls = false) {
  return `<div class="app-player${data.wide ? ' is-wide' : ''}${controls ? ' has-controls' : ''}" data-player id="${id}"><video${data.width ? ` width="${Number(data.width)}"` : ''}${data.height ? ` height="${Number(data.height)}"` : ''} playsinline${controls ? '' : ' muted'} preload="none" poster="${asset(data.poster)}" aria-label="${escape(data.title ?? '기능 소개 영상')}"${controls ? ' data-native-controls' : ''}><source src="${asset(data.src)}" type="video/mp4"></video>${data.overlay || controls ? '<button class="app-player-button" type="button" data-player-play aria-label="Play video"></button>' : ''}<span class="app-sr" role="status"></span></div>`;
}
function remote(id, src = '') {
  return `<button class="app-remote" type="button" data-remote="${id}"${src ? ` data-video-src="${asset(src)}"` : ''} aria-label="Play video">${image('remotecontrol-play.svg')}<span>Play</span></button>`;
}

export function createMarkdown() {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true }).use(footnote).use(taskLists);
  md.inline.ruler.before('emphasis', 'interface-label', (state, silent) => {
    const match = /^:(kbd|menu)\[([^\]\n]+)\]/.exec(state.src.slice(state.pos));
    if (!match) return false;
    if (!silent) {
      const token = state.push('html_inline', '', 0);
      token.content = match[1] === 'kbd'
        ? `<kbd>${escape(match[2])}</kbd>`
        : `<b class="app-menu-label">${escape(match[2])}</b>`;
    }
    state.pos += match[0].length;
    return true;
  });
  md.inline.ruler.before('emphasis', 'highlight', (state, silent) => {
    const start = state.pos;
    if (state.src.slice(start, start + 2) !== '::' || /\s/.test(state.src[start + 2] ?? ' ')) return false;
    let end = start + 2;
    while ((end = state.src.indexOf('::', end)) !== -1) {
      let escapes = 0;
      for (let at = end - 1; at >= 0 && state.src[at] === String.fromCharCode(92); at -= 1) escapes += 1;
      if (escapes % 2 === 0) break;
      end += 2;
    }
    if (end < 0 || /\s/.test(state.src[end - 1]) || state.src.slice(start + 2, end).includes('\n')) return false;
    if (!silent) {
      state.push('mark_open', 'mark', 1);
      const children = [];
      state.md.inline.parse(state.src.slice(start + 2, end), state.md, state.env, children);
      state.tokens.push(...children);
      state.push('mark_close', 'mark', -1);
    }
    state.pos = end + 2;
    return true;
  });
  md.core.ruler.after('github-task-lists', 'cancelled-task-lists', state => {
    for (let index = 2; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== 'inline' || state.tokens[index - 1].type !== 'paragraph_open' || state.tokens[index - 2].type !== 'list_item_open' || !token.content.startsWith('[~] ')) continue;
      state.tokens[index - 2].attrJoin('class', 'task-list-item is-cancelled');
      token.content = token.content.slice(4);
      token.children[0].content = token.children[0].content.slice(4);
      const marker = new state.Token('html_inline', '', 0);
      marker.content = '<span class="app-cancelled-task" role="img" aria-label="취소된 작업">×</span> ';
      token.children.unshift(marker);
    }
  });
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index];
    token.attrSet('loading', 'lazy');
    token.attrSet('decoding', 'async');
    const src = token.attrGet('src');
    const size = src?.startsWith('/things/assets/') ? IMAGE_SIZES[src.split('/').at(-1)] : undefined;
    if (size) { token.attrSet('width', size[0]); token.attrSet('height', size[1]); }
    return defaultImage(tokens, index, options, env, self);
  };
  md.renderer.rules.table_open = () => '<div class="app-table-scroll"><table>';
  md.renderer.rules.table_close = () => '</table></div>';
  for (const tag of ['th_open', 'td_open']) md.renderer.rules[tag] = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const alignment = token.attrGet('style');
    if (alignment) { token.attrs = token.attrs.filter(([key]) => key !== 'style'); token.attrSet('class', `is-${alignment.split(':')[1]}`); }
    return self.renderToken(tokens, index, options);
  };
  md.renderer.rules.fence = (tokens, index, options, env) => {
    const token = tokens[index];
    const kind = token.info.trim();
    if (kind.startsWith('ui:')) {
      const data = parse(token.content, { maxAliasCount: 0 });
      if (!data || typeof data !== 'object') throw new Error(`Invalid ${kind} data`);
      const html = component(kind.slice(3), data, md, env);
      if (!env.showSyntax) return html;
      return html + `<details class="app-source-example"><summary>작성 문법 보기: ${escape(kind)}</summary><div class="app-code"><button type="button" data-copy aria-label="작성 문법 복사">Copy</button><pre><code>${escape('```' + kind + '\n' + token.content + '```')}</code></pre></div></details>`;
    }
    const language = kind.split(' ')[0];
    const value = hljs.getLanguage(language) ? hljs.highlight(token.content, { language }).value : escape(token.content);
    return `<div class="app-code"><button type="button" data-copy aria-label="코드 복사">Copy</button><pre><code class="language-${escape(language)}">${value}</code></pre></div>`;
  };
  md.core.ruler.push('heading-ids', (state) => {
    state.env.headings ??= [];
    state.env.headingIds ??= new Map();
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== 'heading_open') continue;
      const title = state.tokens[index + 1].content;
      const slug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
      const count = (state.env.headingIds.get(slug) ?? 0) + 1;
      state.env.headingIds.set(slug, count);
      const localId = count === 1 ? slug : `${slug}-${count}`;
      const id = state.env.pageId ? `${state.env.pageId}-${localId}` : localId;
      token.attrSet('id', id);
      state.env.headings.push({ id, title, level: Number(token.tag.slice(1)) });
    }
  });
  return md;
}

function component(kind, data, md, env) {
  env.componentCount = (env.componentCount ?? 0) + 1;
  const id = `component-${env.pageId ?? 'page'}-${env.componentCount}`;
  let nestedIndex = 0;
  const render = (text = '') => {
    const nested = { ...env, docId: `${id}-${++nestedIndex}` };
    delete nested.footnotes;
    const html = md.render(String(text), nested);
    env.componentCount = nested.componentCount;
    return html;
  };
  switch (kind) {
    case 'group':
      return `<section class="app-support-group"><h2>${escape(data.title)}</h2>${render(data.body)}</section>`;
    case 'feature':
      return `<section class="app-feature app-feature-${['canvas','lightest','light','medium'].includes(data.tone) ? data.tone : 'canvas'}${data.split ? ' is-split' : ''}"><div class="app-shell"><div class="app-landing-heading"><h2>${data.icon ? image(data.icon, '') : ''} ${escape(data.title)}</h2><p>${escape(data.description)}</p>${data.href ? `<p><a class="app-landing-action" href="${safeUrl(data.href)}">${escape(data.link)}</a></p>` : ''}</div><div class="app-feature-workspace"><div class="app-feature-media">${render(data.body)}</div>${data.left || data.right ? `<div class="app-feature-description"><div><h3>${escape(data.leftTitle ?? 'A clear beginning')}</h3><p>${escape(data.left)}</p></div><div><h3>${escape(data.rightTitle ?? 'Room for the details')}</h3><p>${escape(data.right)}</p></div></div>` : ''}</div></div></section>`;
    case 'syntax-examples':
      return `<div class="app-syntax-examples">${data.items.map(item => `<section class="app-syntax-row"><pre aria-label="${escape(item.title)}">${escape(item.source)}</pre><div>${render(item.body)}</div></section>`).join('')}</div>`;
    case 'feature-list':
      return `<div class="app-feature-list">${[data.items.slice(0,Math.ceil(data.items.length/2)),data.items.slice(Math.ceil(data.items.length/2))].map(items => `<ul>${items.map(item => `<li><h3>${escape(item.title)}</h3>${render(item.body)}</li>`).join('')}</ul>`).join('')}</div>`;
    case 'device':
      return `<figure class="app-device" aria-label="${escape(data.title ?? 'iPhone 화면')}"><div class="app-device-screen">${data.video ? player(data, id) : image(data.src, data.title ?? '기기 화면')}</div>${image('bezel-iphone6-overlay.svg', '', 'app-device-overlay')}</figure>${data.video ? `<div class="app-media-controls">${remote(id)}</div>` : ''}`;
    case 'demos':
      return `<div class="app-feature-demos"><div>${data.items.map(item => `<section class="app-feature-demo-description"><h3>${escape(item.title)}${data.singleControl ? '' : ' ' + remote(id,item.src)}</h3>${render(item.body)}</section>`).join('')}</div><div><figure class="app-device"><div class="app-device-screen">${player({ ...data, src: data.src ?? data.items[0].src }, id)}</div>${image('bezel-iphone6-overlay.svg', '', 'app-device-overlay')}</figure>${data.singleControl ? `<div class="app-media-controls">${remote(id)}</div>` : ''}</div></div>${data.after ? `<div class="app-feature-demo-description">${render(data.after)}</div>` : ''}`;
    case 'feature-pair': {
      const descriptions = `<div>${data.items.map(item => `<section class="app-feature-demo-description">${item.title ? `<h3>${escape(item.title)}</h3>` : ''}${render(item.body)}</section>`).join('')}</div>`;
      const media = `<div>${render(data.media)}</div>`;
      return `<div class="app-feature-demos">${data.mediaFirst ? media + descriptions : descriptions + media}</div>`;
    }
    case 'callout':
      return `<aside class="app-callout${data.tone === 'warning' ? ' is-warning' : ''}${data.fineprint ? ' is-fineprint' : ''}"><strong>${escape(data.title ?? 'Note')}</strong>${render(data.body)}</aside>`;
    case 'details':
      return `<details class="app-details"${data.open ? ' open' : ''}><summary>${escape(data.title)}</summary>${render(data.body)}</details>`;
    case 'figure':
      return `<figure class="app-figure${data.size === 'compact' ? ' is-compact' : ''}${data.wide ? ' app-breakout' : ''}">${image(data.src, data.alt)}<figcaption>${escape(data.caption)}</figcaption></figure>`;
    case 'video':
      return `<figure class="app-figure">${player(data, id, data.controls === true)}<figcaption>${escape(data.caption ?? '')}<div class="app-media-controls">${remote(id)}</div></figcaption></figure>`;
    case 'gallery': {
      if (!Array.isArray(data.slides) || !data.slides.length) throw new Error('Gallery requires slides');
      const selected = data.selected ?? 0;
      if (!Number.isInteger(selected) || selected < 0 || selected >= data.slides.length) throw new Error('Gallery selected index is out of range');
      const labeled = data.slides.every(slide => typeof slide.label === 'string');
      return `<section class="app-gallery${labeled ? ' is-labeled' : ''}${data.wide ? ' app-breakout' : ''}" data-gallery aria-label="${escape(data.title ?? '이미지 슬라이드')}"><div class="app-gallery-frame">${data.slides.map((slide, index) => `<figure id="${id}-${index}" class="app-gallery-slide${index === selected ? ' is-selected' : ''}" data-slide aria-hidden="${index !== selected}">${image(slide.src, slide.alt ?? slide.label)}${slide.caption ? `<figcaption>${escape(slide.caption)}</figcaption>` : ''}</figure>`).join('')}</div><div class="app-gallery-controls">${data.slides.map((slide, index) => `<button type="button" data-slide-index="${index}" aria-controls="${id}-${index}" aria-pressed="${index === selected}" aria-label="${escape(slide.label ?? `슬라이드 ${index + 1}`)}">${escape(slide.label ?? index + 1)}</button>`).join('')}</div></section>`;
    }
    case 'platform':
    case 'tabs': {
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('Tabs require items');
      return `<section class="app-tabs${kind === 'platform' ? ' is-platform' : ''}" data-tabs${kind === 'platform' ? ' data-platform' : ''}><div class="app-tablist" role="tablist" aria-label="${escape(data.title ?? '기기별 안내')}">${data.items.map((item, index) => `<button type="button" id="${id}-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="${id}-panel-${index}" tabindex="${index ? '-1' : '0'}">${escape(item.label)}</button>`).join('')}</div>${data.items.map((item, index) => `<div class="app-tabpanel" id="${id}-panel-${index}" role="tabpanel" aria-labelledby="${id}-tab-${index}" tabindex="0"${index ? ' hidden' : ''}>${render(item.body)}</div>`).join('')}</section>`;
    }
    case 'icon-lab': return iconLab();
    case 'cards': {
      const variants = ['centered', 'grouped', 'inline'];
      if (data.variant && !variants.includes(data.variant)) throw new Error(`Unknown card variant: ${data.variant}`);
      const card = (item) => {
        const variant = item.variant ?? data.variant;
        if (variant && !variants.includes(variant)) throw new Error(`Unknown card variant: ${variant}`);
        const classes = variant ? ` is-${variant}` : item.compact ? ' is-compact' : data.horizontal ? ' is-horizontal' : '';
        const noIcon = item.icon === false || (item.compact && !variant);
        return `<a class="app-help-card${classes}${noIcon ? ' has-no-icon' : ''}" href="${safeUrl(item.href)}">${noIcon ? '' : icon(item.icon)}<strong>${escape(item.title)}</strong>${item.description ? `<p>${escape(item.description)}</p>` : ''}</a>`;
      };
      if (data.variant === 'inline') return `<div class="app-inline-links">${data.items.map(card).join(' ')}</div>`;
      if (data.split) return `<div class="app-support-split">${card(data.items[0])}<div class="app-support-links">${data.items.slice(1).map(card).join('')}</div></div>`;
      return `<div class="app-support-grid${data.columns === 2 ? ' is-pair' : ''}">${data.items.map(card).join('')}</div>`;
    }
    case 'definitions':
      return `<dl class="app-definitions">${data.items.map((item) => `<dt>${escape(item.term)}</dt><dd>${render(item.body)}</dd>`).join('')}</dl>`;
    case 'speech': return `<p class="app-speech">${escape(data.body)}</p>`;
    case 'keys': return `<p>${escape(data.label ?? '')} ${data.keys.map((key) => `<kbd>${escape(key)}</kbd>`).join(' + ')}</p>`;
    case 'tooltip': return `<p><button class="app-tooltip" type="button" popovertarget="${id}-tip" data-tooltip-trigger>${escape(data.label)}</button></p><div class="app-tooltip-bubble" id="${id}-tip" popover>${render(data.description)}</div>`;
    case 'keyboard':
      return `<section class="app-keyboard" data-keyboard><div class="app-keyboard-selector">${image('keycommand-keyboard-io40.png','Keyboard')}<label class="app-sr" for="${id}-locale">Keyboard language</label><select id="${id}-locale" data-keyboard-language>${data.languages.map(item => `<option value="${escape(item.value)}">${escape(item.label)}</option>`).join('')}</select><button class="app-tooltip" type="button" popovertarget="${id}-help" data-tooltip-trigger>Help</button><div class="app-tooltip-bubble" id="${id}-help" popover>${render(data.help)}</div></div>${data.groups.map(group => `<h3>${escape(group.title)}</h3><div class="app-table-scroll"><table><tbody>${group.rows.map(row => `<tr><td>${render(row.label)}</td><td><span data-keyboard-keys data-keyboard-map="${escape(JSON.stringify(row.keys))}">${(row.keys['en-us'] ?? []).map(key=>`<kbd>${escape(key)}</kbd>`).join(' ')}</span>${row.note ? render(row.note) : ''}</td></tr>`).join('')}</tbody></table></div>`).join('')}</section>`;
    case 'status-board':
      return `<div class="app-status-weather"><div class="app-status-current"><p class="app-status-message">${escape(data.message)}</p><div class="app-status-actions"><button type="button" data-status-toggle aria-expanded="false" aria-controls="${id}-history">Show Past Week</button><a href="/things/contact/form/">Report Issue</a></div></div><div class="app-status-history" id="${id}-history" inert><div><p>${escape(data.history)}</p></div></div></div><section class="app-arrivals"><h1>Arrivals</h1>${data.items.map(item => `<article><div><h2>${escape(item.title)}</h2><div class="app-arrival-caption">${render(item.body)}</div></div><div class="app-arrival-state"><p>${escape(item.status)}</p><small>${escape(item.date)}</small></div></article>`).join('')}</section>`;
    case 'contact-form':
      return `<form class="app-contact-form" data-demo-form><div class="app-contact-field"><label for="${id}-subject">Subject</label><input id="${id}-subject" name="subject" required></div><div class="app-contact-field"><label for="${id}-message">Your message</label><textarea id="${id}-message" name="message" required></textarea><fieldset class="app-contact-choices"><legend class="app-sr">Message type</legend>${['I need help','I have a feature request','Other'].map((label,index) => `<label><input type="radio" name="kind" value="${index}"${index ? '' : ' checked'}> ${label}</label>`).join('')}</fieldset></div><div class="app-contact-field"><label for="${id}-email">Your email address</label><input id="${id}-email" name="email" type="email" autocomplete="email" required></div><fieldset class="app-contact-field app-contact-choices"><legend>What is your question about?</legend>${['Things for Mac','Things for iPad','Things for iPhone','Things for Apple Watch','Things for Apple Vision Pro','Other'].map(label => `<label><input type="checkbox" name="product" value="${escape(label)}"> ${escape(label)}</label>`).join('')}</fieldset><section class="app-contact-field"><h2>Privacy</h2><p>${escape(data.privacy)} <a href="/things/privacy/">Privacy Policy</a>.</p></section><p class="app-contact-field">${escape(data.availability)}</p><div class="app-contact-field"><strong>Input Verification</strong><label class="app-demo-verification"><input type="checkbox" data-demo-verify required> 검토용 입력 확인</label></div><button class="app-primary-action" type="submit" data-verified-submit disabled>Send Message</button><p role="status" data-form-status></p></form>`;
    case 'form': return `<form class="app-form" data-demo-form><p class="app-caption">입력 동작 예시입니다. 내용은 전송·저장되지 않습니다.</p><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>${data.message ? `<label for="${id}-message">Message</label><textarea id="${id}-message" name="message" rows="6" required></textarea>` : ''}<button type="submit">${escape(data.label ?? 'Subscribe')}</button><p role="status" data-form-status></p></form>`;
    default: throw new Error(`Unknown document component: ${kind}`);
  }
}
