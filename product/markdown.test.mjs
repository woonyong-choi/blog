import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMarkdown, safeUrl, asset } from './markdown.mjs';

const fence = (name, data) => '```ui:' + name + '\n' + JSON.stringify(data) + '\n```';
test('HTML and script URLs cannot execute in document content', () => {
  const md = createMarkdown();
  const html = md.render('<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  for (const url of ['javascript:alert(1)', '//evil.test', '/things/\nfoo', 'data:text/html,hi']) assert.throws(() => safeUrl(url));
  assert.throws(() => asset('../outside.svg'));
});
test('nested components preserve unique IDs and do not duplicate footnotes', () => {
  const md = createMarkdown();
  const source = '## Repeated\n\nNote[^1]\n\n[^1]: Explanation\n\n' + fence('tabs',{items:[{label:'Mac',body:'## Repeated\n'+fence('callout',{title:'Note',body:'Body'})},{label:'iOS',body:'## Repeated'}]});
  const html = md.render(source,{});
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m)=>m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((html.match(/id="fn1"/g) ?? []).length, 1);
  assert.ok(html.includes('role="tab"'));
  assert.ok(html.includes('id="repeated-3"'));
});
test('unknown component and malformed data fail the build', () => {
  const md = createMarkdown();
  assert.throws(()=>md.render(fence('unknown',{body:'text'})));
  assert.throws(()=>md.render(fence('gallery',{slides:[]})));
  assert.throws(()=>md.render(fence('cards',{variant:'unknown',items:[]})));
  assert.throws(()=>md.render(fence('cards',{items:[{variant:'unknown',title:'Invalid',href:'/things/'}]})));
  assert.throws(()=>md.render('```ui:tabs\nitems: [\n```'));
});
test('specimen renders every declared document component', () => {
  const source=readFileSync(new URL('./content/syntax-specimen.md',import.meta.url),'utf8').split('\n---\n').slice(1).join('\n---\n');
  const html=createMarkdown().render(source,{});
  for (const kind of ['group','feature','syntax-examples','feature-list','device','demos','feature-pair','callout','details','figure','video','gallery','platform','tabs','cards','definitions','speech','keys','tooltip','keyboard','status-board','contact-form','form']) assert.ok(source.includes('ui:' + kind), 'missing specimen: ' + kind);
  for(const marker of ['<table>','<blockquote>','task-list-item','language-javascript','app-callout','app-help-card is-centered','app-help-card is-grouped','app-inline-links','data-tabs','data-gallery','<video','<details','<dl','<kbd','popover','data-demo-form','footnote-ref']) assert.ok(html.includes(marker),marker);
});

test('highlight and cancelled tasks preserve escaping, code and nested formatting', () => {
  const md = createMarkdown();
  const html = md.render('::**focus**:: and `::literal::`\n\n- [~] **cancelled**\n- [x] complete\n\n::unsafe <script>alert(1)</script>::');
  assert.ok(html.includes('<mark><strong>focus</strong></mark>'));
  assert.ok(html.includes('<code>::literal::</code>'));
  assert.ok(html.includes('aria-label="취소된 작업"'));
  assert.ok(html.includes('<strong>cancelled</strong>'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!md.render('\\::escaped::').includes('<mark>'));
});

test('gallery preserves selected slide, captions and validates its initial index', () => {
  const md = createMarkdown();
  const slides = [{src:'repeating-comparison-1-io80.png',label:'Before',caption:'<before>'},{src:'repeating-comparison-2-io80.png',label:'Now',caption:'after'}];
  const html = md.render(fence('gallery',{selected:1,slides}));
  assert.match(html, /is-labeled/);
  assert.match(html, /class="app-gallery-slide is-selected" data-slide aria-hidden="false"><img[^>]*repeating-comparison-2/);
  assert.ok(html.includes('<figcaption>&lt;before&gt;</figcaption>'));
  assert.throws(() => md.render(fence('gallery',{selected:2,slides})));
  assert.throws(() => md.render(fence('gallery',{selected:-1,slides})));
});

test('inline interface labels escape HTML and preserve code and literal syntax', () => {
  const md = createMarkdown();
  const html = md.render('Press :kbd[⌘ Cmd] :kbd[I] in :menu[Edit]. :kbd[<script>] `:kbd[literal]`');
  assert.ok(html.includes('<kbd>⌘ Cmd</kbd> <kbd>I</kbd>'));
  assert.ok(html.includes('<b class="app-menu-label">Edit</b>'));
  assert.ok(html.includes('<kbd>&lt;script&gt;</kbd>'));
  assert.ok(html.includes('<code>:kbd[literal]</code>'));
  assert.ok(!md.render(String.raw`\:kbd[literal]`).includes('<kbd>'));
});

test('code_and_syntax_copy_controls_start_hidden_with_independent_status_regions', () => {
  const source = '```javascript\nconst value = "한글 < >";\n```\n\n' + fence('keys', { keys: ['⌘', 'C'] });
  const html = createMarkdown().render(source, { showSyntax: true });
  assert.equal((html.match(/data-copy aria-label="[^"]+" hidden/g) ?? []).length, 2);
  assert.equal((html.match(/data-copy-status role="status" aria-live="polite" aria-atomic="true"/g) ?? []).length, 2);
  assert.match(html, /aria-label="코드 복사"/);
  assert.match(html, /aria-label="작성 문법 복사"/);
  assert.match(html, /한글 &lt; &gt;/);
});
