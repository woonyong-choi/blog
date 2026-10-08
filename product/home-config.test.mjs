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

test('interview_items_require_unique_ids_and_summary_while_company_role_are_optional', () => {
  const item = extra => `sections:\n  - { id: a, type: interviews, items: [{ id: talk, summary: s, company: c, role: r${extra} }] }`;
  assert.equal(parse(item(''))[0].items[0].source, undefined);
  assert.equal(parse(item('').replace(', company: c, role: r', ''))[0].items[0].company, undefined);
  rejects(item('').replace('summary: s, ', ''), /items\[0\]\.summary: 값이 필요/);
  rejects(item(', question: q'), /items\[0\]\.question: 알 수 없는 설정/);
  rejects(item(', source: { platform: GitHub, url: "javascript:alert(1)" }'), /items\[0\]\.source\.url/);
  rejects(item(', source: { url: "https://example.com" }'), /items\[0\]\.source\.platform/);
  rejects(item(', source: { platform: GitHub, url: "http://example.com" }'), /items\[0\]\.source\.url.*HTTPS/);
  rejects('sections:\n  - { id: a, type: interviews, items: [{ id: t, summary: s, company: c, role: r }, { id: t, summary: s, company: c, role: r }] }', /items\[1\]\.id: 중복/);
});

test('prototype_properties_are_not_section_types_and_link_icons_are_checked', () => {
  for (const type of ['toString', '__proto__', 'constructor', 'hasOwnProperty']) rejects(`sections:\n  - { id: a, type: ${type} }`, /sections\[0\]\.type/);
  rejects('sections:\n  - { id: a, type: interviews, links: [{ label: x, href: /a/, icon: twitter }] }', /links\[0\]\.icon/);
  rejects('sections:\n  - { id: a, type: interviews, links: [{ label: x, href: "javascript:alert(1)" }] }', /links\[0\]\.href/);
});

test('interview_author_and_date_are_optional_validated_and_keep_profile_apart_from_source', () => {
  const item = extra => `sections:\n  - { id: a, type: interviews, items: [{ id: talk, summary: s${extra} }] }`;
  const [first] = parse(item(', date: "2026-02-28", author: { handle: "@id", url: "https://example.com/id", avatar: { src: /assets/a.png, alt: "" } }, source: { platform: GitHub, url: "https://example.com/post" }')).at(0).items;
  assert.equal(first.date, '2026-02-28');
  assert.equal(first.author.url, 'https://example.com/id');
  assert.equal(first.source.url, 'https://example.com/post');
  assert.equal(parse(item(', date: "2028-02-29"'))[0].items[0].date, '2028-02-29');
  for (const date of ['2026-02-30', '2026-13-01', '2026-2-3', 'tomorrow']) rejects(item(`, date: "${date}"`), /items\[0\]\.date/);
  rejects(item(', author: {}'), /items\[0\]\.author: name, handle, avatar/);
  rejects(item(', author: { name: n, url: "http://example.com" }'), /author\.url.*HTTPS/);
  rejects(item(', author: { name: n, bio: b }'), /author\.bio: 알 수 없는 설정/);
  rejects(item(', author: { handle: "a b" }'), /author\.handle/);
  rejects(item(', author: { name: n, avatar: { src: /elsewhere/a.png } }'), /author\.avatar\.src/);
  rejects(item(', author: { name: n, avatar: { src: "http://example.com/a.png" } }'), /author\.avatar\.src.*HTTPS/);
  rejects(item(', author: { avatar: { src: /assets/a.png } }'), /author\.avatar\.alt/);
  rejects(item(', author: { name: n, avatar: { src: /assets/missing.png } }'), /author\.avatar\.src: 파일이 없습니다/, { exists: () => false });
});
