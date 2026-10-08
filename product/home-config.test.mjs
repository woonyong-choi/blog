import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHomeConfig } from './home-config.mjs';

const parse = (yaml, options = {}) => parseHomeConfig(yaml, { technologies: new Set(['python']), ...options });
const rejects = (yaml, pattern, options) => assert.throws(() => parse(yaml, options), pattern);

test('errors_name_the_file_and_the_exact_path', () => {
  rejects('sections:\n  - { id: a, type: banner }', /home\.config\.yaml sections\[0\]\.type: .*banner/);
  rejects('sections:\n  - { id: a, type: hero, description: x, colour: red }', /sections\[0\]\.colour: 알 수 없는 설정/);
  rejects('sections:\n  - { id: a, type: hero }', /sections\[0\]\.description: 값이 필요/);
  rejects('sections:\n  - { id: a, type: technologies, items: [python, rust] }', /sections\[0\]\.items\[1\]: 알 수 없는 기술/);
  rejects('sections:\n  - { id: a, type: technologies, items: [python, python] }', /sections\[0\]\.items\[1\]: 중복/);
  rejects('sections:\n  - { id: a, type: projects, items: [{ title: 가, description: 나 }, { title: 다 }] }', /sections\[0\]\.items\[1\]\.description/);
  rejects('sections: [', /YAML/);
});

test('links_and_media_reject_active_protocols_traversal_and_missing_files', () => {
  const link = href => `sections:\n  - { id: a, type: projects, items: [{ title: 가, description: 나, link: { label: 열기, href: "${href}" } }] }`;
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'http://example.com', 'https://user:pw@example.com', '/a b']) {
    rejects(link(bad), /sections\[0\]\.items\[0\]\.link\.href/);
  }
  assert.equal(parse(link('/wiki/'))[0].items[0].link.href, '/wiki/');
  const hero = src => `sections:\n  - { id: a, type: hero, description: x, video: { src: "${src}", title: t } }`;
  rejects(hero('/media/../secret.mp4'), /video\.src.*안전한 경로/);
  rejects(hero('javascript:alert(1)'), /video\.src.*HTTPS/);
  rejects(hero('/media/clip.png'), /video\.src.*\.mp4/);
  rejects(hero('/media/missing.mp4'), /video\.src: 파일이 없습니다: product\/media\/missing\.mp4/, { exists: () => false });
  rejects('sections:\n  - { id: a, type: hero, description: x, video: { src: /media/a.mp4, poster: "data:text/html,x", title: t } }', /video\.poster/);
});

test('disabled_sections_are_checked_for_shape_but_not_for_missing_files', () => {
  const yaml = 'sections:\n  - { id: a, type: hero, enabled: false, description: x, video: { src: /media/gone.mp4, title: t } }';
  assert.deepEqual(parse(yaml, { exists: () => false }), []);
  rejects(yaml.replace('description: x, ', ''), /description/, { exists: () => false });
});

test('section_ids_must_be_unique_and_not_collide_with_derived_dom_ids', () => {
  rejects('sections:\n  - { id: a, type: hero, description: x }\n  - { id: a, type: technologies }', /sections\[1\]\.id: DOM id "a"/);
  rejects('sections:\n  - { id: hero, type: hero, description: x }\n  - { id: hero-video, type: technologies }', /sections\[1\]\.id: DOM id "hero-video"/);
  rejects('sections:\n  - { id: main, type: technologies }', /DOM id "main"/);
  rejects('sections:\n  - { id: Bad_Id, type: technologies }', /sections\[0\]\.id/);
});

test('interview_items_require_unique_ids_and_https_sources_unless_example', () => {
  const item = extra => `sections:\n  - { id: a, type: interviews, items: [{ id: talk, question: q, quote: r, source: s${extra} }] }`;
  rejects(item(''), /items\[0\]\.url: 실제 인터뷰에는 HTTPS/);
  rejects(item(', url: "javascript:alert(1)"'), /items\[0\]\.url/);
  assert.equal(parse(item(', example: true'))[0].items.length, 1);
});
