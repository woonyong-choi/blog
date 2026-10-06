// Markdown과 명시적인 문서 구성 요소를 정적 HTML로 변환한다.
import { readFileSync } from 'node:fs';
import MarkdownIt from '../assets/vendor/markdown-it.mjs';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import { parse } from 'yaml';

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
export const icon = (name = 'question') => `<span class="app-article-icon app-icon-${escape(name)}" aria-hidden="true"></span>`;
export function image(name, alt = '', className = '') {
  const size = IMAGE_SIZES[name];
  return `<img${size ? ` width="${size[0]}" height="${size[1]}"` : ''} class="${className}" src="${asset(name)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
}

export function createMarkdown() {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true }).use(footnote).use(taskLists);
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    tokens[index].attrSet('loading', 'lazy');
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
      return `<section class="app-feature${data.split ? ' is-split' : ''}"><div class="app-shell"><h2 class="app-section-title app-feature-title">${image(data.icon, '', 'app-section-icon')}<span>${escape(data.title)}</span></h2><p class="app-intro">${escape(data.description)}</p><div class="app-feature-workspace"><div class="app-feature-media">${render(data.body)}</div><div class="app-feature-description"><div><h3>${escape(data.leftTitle ?? 'A clear beginning')}</h3><p>${escape(data.left)}</p></div><div><h3>${escape(data.rightTitle ?? 'Room for the details')}</h3><p>${escape(data.right)}</p></div></div></div></div></section>`;
    case 'device':
      return `<figure class="app-device" aria-label="${escape(data.title ?? 'iPhone 화면')}"><div class="app-device-screen">${data.video ? `<video controls playsinline preload="none" poster="${asset(data.poster)}" aria-label="${escape(data.title ?? '기기 동작 영상')}"><source src="${asset(data.src)}" type="video/mp4"></video>` : image(data.src, data.title ?? '기기 화면')}</div>${image('bezel-iphone6-overlay.svg', '', 'app-device-overlay')}</figure>`;
    case 'callout':
      return `<aside class="app-callout${data.tone === 'warning' ? ' is-warning' : ''}"><strong>${escape(data.title ?? 'Note')}</strong>${render(data.body)}</aside>`;
    case 'details':
      return `<details class="app-details"${data.open ? ' open' : ''}><summary>${escape(data.title)}</summary>${render(data.body)}</details>`;
    case 'figure':
      return `<figure class="app-figure${data.wide ? ' app-breakout' : ''}">${image(data.src, data.alt)}<figcaption>${escape(data.caption)}</figcaption></figure>`;
    case 'video':
      return `<figure class="app-figure"><video class="app-video" controls playsinline preload="none" poster="${asset(data.poster)}" aria-label="${escape(data.title ?? '영상')}"><source src="${asset(data.src)}" type="video/mp4"><a href="${asset(data.src)}">영상 다운로드</a></video><figcaption>${escape(data.caption ?? '화면 동작을 보여주는 참고 영상')}</figcaption></figure>`;
    case 'gallery': {
      if (!Array.isArray(data.slides) || !data.slides.length) throw new Error('Gallery requires slides');
      return `<section class="app-gallery${data.wide ? ' app-breakout' : ''}" data-gallery aria-label="${escape(data.title ?? '이미지 슬라이드')}">${data.slides.map((slide, index) => `<div id="${id}-${index}" data-slide${index ? ' hidden' : ''}>${image(slide.src, slide.alt ?? slide.label)}</div>`).join('')}<div class="app-gallery-controls">${data.slides.map((slide, index) => `<button type="button" data-slide-index="${index}" aria-controls="${id}-${index}" aria-pressed="${index === 0}" aria-label="${escape(slide.label ?? `슬라이드 ${index + 1}`)}">${escape(slide.label ?? index + 1)}</button>`).join('')}</div></section>`;
    }
    case 'tabs': {
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('Tabs require items');
      return `<section class="app-tabs" data-tabs><div class="app-tablist" role="tablist" aria-label="${escape(data.title ?? '기기별 안내')}">${data.items.map((item, index) => `<button type="button" id="${id}-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="${id}-panel-${index}" tabindex="${index ? '-1' : '0'}">${escape(item.label)}</button>`).join('')}</div>${data.items.map((item, index) => `<div class="app-tabpanel" id="${id}-panel-${index}" role="tabpanel" aria-labelledby="${id}-tab-${index}" tabindex="0"${index ? ' hidden' : ''}>${render(item.body)}</div>`).join('')}</section>`;
    }
    case 'cards': {
      const card = (item) => `<a class="app-help-card${item.compact ? ' is-compact' : ''}" href="${safeUrl(item.href)}">${item.compact ? '' : icon(item.icon)}<strong>${escape(item.title)}</strong>${item.description ? `<p>${escape(item.description)}</p>` : ''}</a>`;
      if (data.split) return `<div class="app-support-split">${card(data.items[0])}<div class="app-support-links">${data.items.slice(1).map(card).join('')}</div></div>`;
      return `<div class="app-support-grid${data.columns === 2 ? ' is-pair' : ''}">${data.items.map(card).join('')}</div>`;
    }
    case 'definitions':
      return `<dl class="app-definitions">${data.items.map((item) => `<dt>${escape(item.term)}</dt><dd>${render(item.body)}</dd>`).join('')}</dl>`;
    case 'speech': return `<p class="app-speech">${escape(data.body)}</p>`;
    case 'keys': return `<p>${escape(data.label ?? '')} ${data.keys.map((key) => `<kbd>${escape(key)}</kbd>`).join(' + ')}</p>`;
    case 'tooltip': return `<p><abbr class="app-tooltip" title="${escape(data.description)}" tabindex="0">${escape(data.label)}</abbr></p>`;
    case 'form': return `<form class="app-form" data-demo-form><p class="app-caption">입력 동작 예시입니다. 내용은 전송·저장되지 않습니다.</p><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>${data.message ? `<label for="${id}-message">Message</label><textarea id="${id}-message" name="message" rows="6" required></textarea>` : ''}<button type="submit">${escape(data.label ?? 'Subscribe')}</button><p role="status" data-form-status></p></form>`;
    default: throw new Error(`Unknown document component: ${kind}`);
  }
}
