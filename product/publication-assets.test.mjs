import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientEntrypoints, publicationAssets } from './publication-assets.mjs';
import { documentShell } from './publication-layout.mjs';

test('publication_includes_nested_css_and_search_assets_without_shipping_authoring_files', () => {
  const source = new Map(Object.entries({
    '/theme/theme.css': '@import "colors.css"; @font-face { src: url("assets/font.woff2") }',
    '/theme/colors.css': '.row { background: url(../assets/arrow.svg?v=1) }',
    '/assets/arrow.svg': '<svg/>',
    '/theme/assets/font.woff2': 'font',
    '/theme/assets/icons/small/document.svg': '<svg/>',
    '/theme/assets/giscus.css': '',
    '/theme/tokens.json': 'authoring data',
    '/theme/styles.source.css': 'authoring source',
    '/media/unused.svg': '<svg/>',
  }));
  const pages = new Map([['/wiki/', '<link href="/theme/theme.css?v=hash"><a href="/articles/example/">문서</a><img src="https://cdn.example/image.png">']]);
  const assets = publicationAssets(pages, [{ iconUrl: '/theme/assets/icons/small/document.svg' }], path => {
    assert.ok(source.has(path), path); return source.get(path);
  });
  assert.deepEqual([...assets.keys()].sort(), [...source.keys()].filter(path => !['/theme/tokens.json', '/theme/styles.source.css', '/media/unused.svg'].includes(path)).sort());
});

test('missing_dependencies_and_encoded_path_escape_fail_before_publication', () => {
  const pages = new Map([['/', '<link href="/theme/styles.css">']]);
  assert.throws(() => publicationAssets(pages, [], path => {
    if (path === '/theme/styles.css') return '.a { background: url(../assets/missing.svg) }';
    throw new Error(`missing ${path}`);
  }), /missing \/assets\/missing.svg/);
  for (const url of ['../../private.txt', '/theme/%2e%2e%2fprivate.txt', '/theme/a%5cb.svg']) {
    assert.throws(() => publicationAssets(pages, [], () => `.a { background: url(${url}) }`), /outside publication roots|invalid publication asset/);
  }
});

test('static_pages_load_no_client_modules_and_document_controls_keep_their_own_entrypoint', () => {
  const context = { config: { name: '이름', description: '소개', github: 'https://github.com/example' }, themeHash: 'theme', scriptHash: 'client' };
  const home = documentShell({ route: '/', title: '홈' }, '<main id="main"><a href="/wiki/">Wiki</a></main>', context);
  assert.doesNotMatch(home, /<script/);
  assert.deepEqual(clientEntrypoints('<section data-public-search></section>'), ['publication.js']);
  const article = documentShell({ route: '/articles/example/', title: '글' }, '<section data-public-search></section><details class="app-document-nav"></details><div data-comments></div>', context);
  for (const file of ['publication.js', 'document.js', 'comments.js']) assert.ok(article.includes(`src="/${file}?v=client"`));
  for (const marker of ['data-gallery', 'data-tabs', 'data-copy', 'data-keyboard', 'data-tooltip-trigger']) assert.deepEqual(clientEntrypoints(`<div ${marker}></div>`), ['document.js']);
  assert.deepEqual(clientEntrypoints('<code>&lt;div data-copy&gt;</code>'), []);
});

test('video_state_icons_are_included_before_the_first_play', () => {
  const pages = new Map([['/', '<div data-player><video poster="/media/poster.png"><source src="/media/demo.mp4"></video></div>']]);
  const assets = publicationAssets(pages, [], () => Buffer.from(''));
  for (const path of ['/media/poster.png', '/media/demo.mp4', '/assets/remotecontrol-pause-gray.svg', '/assets/remotecontrol-replay.svg']) assert.ok(assets.has(path));
  assert.deepEqual(clientEntrypoints(pages.get('/')), ['video.js']);
});
