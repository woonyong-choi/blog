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
  assert.throws(()=>md.render('```ui:tabs\nitems: [\n```'));
});
test('specimen renders every declared document component', () => {
  const source=readFileSync(new URL('./content/syntax-specimen.md',import.meta.url),'utf8').split('\n---\n').slice(1).join('\n---\n');
  const html=createMarkdown().render(source,{});
  for(const marker of ['<table>','<blockquote>','task-list-item','language-javascript','app-callout','data-tabs','data-gallery','<video','<details','<dl','<kbd','<abbr','data-demo-form','footnote-ref']) assert.ok(html.includes(marker),marker);
});
