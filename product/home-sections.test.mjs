import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { loadHomeConfig, parseHomeConfig } from './home-config.mjs';
import { personalHome } from './publication-layout.mjs';
import { clientEntrypoints, publicationAssets } from './publication-assets.mjs';

const TECHNOLOGIES = new Set(['python', 'git']);
const render = (yaml, preview = true) => personalHome({ config: { name: '이름' }, home: parseHomeConfig(yaml, { technologies: TECHNOLOGIES }), interviewExamples: [{ id: 'e', question: '질문', quote: '예시', source: '출처', example: true }], preview });
const positions = (html, marks) => marks.map(mark => html.indexOf(mark));
const ascending = values => values.every((value, index) => value >= 0 && (!index || value > values[index - 1]));

const ALL = {
  hero: '  - { id: hero, type: hero, description: 소개 }',
  projects: '  - id: projects\n    type: projects\n    items:\n      - { title: 첫째, description: 설명 }',
  technologies: '  - { id: technologies, type: technologies, items: [python] }',
  interviews: '  - { id: interviews, type: interviews, items: [] }',
  contact: '  - { id: contact, type: contact, email: hello@example.com }',
};
const MARKS = { hero: 'id="hero"', projects: 'id="projects"', technologies: 'id="technologies"', interviews: 'id="interviews"', contact: 'id="contact"' };
const compose = order => `sections:\n${order.map(name => ALL[name]).join('\n')}`;

test('list_order_is_render_order_and_disabled_sections_leave_no_trace', () => {
  const order = ['hero', 'projects', 'technologies', 'interviews', 'contact'];
  assert.ok(ascending(positions(render(compose(order)), order.map(name => MARKS[name]))));
  const reversed = [...order].reverse();
  assert.ok(ascending(positions(render(compose(reversed)), reversed.map(name => MARKS[name]))));
  const hidden = render(compose(order).replace('{ id: technologies,', '{ id: technologies, enabled: false,'));
  assert.doesNotMatch(hidden, /id="technologies"|data-flow-direction="right"|\/tags\/python\//);
  assert.match(hidden, /id="interviews"/);
});

test('disabled_hero_removes_player_remote_script_and_media_assets', () => {
  const yaml = id => `sections:\n  - id: hero\n    type: hero\n    enabled: ${id}\n    description: 소개\n    video: { src: /media/demo.mp4, poster: /media/poster.png, title: 영상 }`;
  const on = render(yaml(true));
  assert.match(on, /data-remote="hero-player"[^>]*>/);
  assert.match(on, /id="hero-player" data-player/);
  assert.deepEqual(clientEntrypoints(on), ['video.js']);
  const off = render(yaml(false));
  assert.doesNotMatch(off, /data-remote|data-player|video|demo\.mp4/);
  assert.deepEqual(clientEntrypoints(off), []);
  const read = path => Buffer.from(path);
  assert.ok(publicationAssets(new Map([['/', on]]), [], read).has('/media/demo.mp4'));
  assert.ok(![...publicationAssets(new Map([['/', off]]), [], read).keys()].some(path => path.startsWith('/media/')));
});

test('hero_bundle_changes_icon_image_video_poster_and_action_together', () => {
  const html = render('sections:\n  - id: intro\n    type: hero\n    description: 소개\n    icon: { src: https://example.com/a.png, alt: 로고 }\n    image: { src: https://example.com/b.jpg, alt: 그림 }\n    action: { label: 더 보기, href: /blog/ }');
  assert.match(html, /<img class="app-hero-logo" src="https:\/\/example.com\/a.png" alt="로고" loading="eager"/);
  assert.match(html, /<a class="app-hero-link" href="\/blog\/">더 보기 <span aria-hidden="true">→<\/span><\/a>/);
  assert.match(html, /id="intro-video"[^>]*><div class="app-hero-panorama-content"><img src="https:\/\/example.com\/b.jpg"/);
  assert.doesNotMatch(html, /data-player|data-remote/);
});

test('projects_render_zero_two_or_many_entries_and_skip_disabled_ones', () => {
  const projects = count => `sections:\n  - id: projects\n    type: projects\n    items:\n${Array.from({ length: count }, (_, index) => `      - { title: 제목${index}, description: 설명${index}, link: { label: 열기, href: 'https://example.com/${index}' }, image: { src: https://example.com/${index}.png, alt: 그림 } }`).join('\n')}`;
  const slices = html => html.match(/class="app-landing-section app-landing-features"/g)?.length ?? 0;
  assert.equal(slices(render('sections:\n  - { id: projects, type: projects, items: [] }')), 0);
  assert.equal(slices(render(projects(2))), 2);
  assert.equal(slices(render(projects(7))), 7);
  const one = render(`${projects(2)}\n      - { enabled: false, title: 숨김, description: 설명 }`);
  assert.equal(slices(one), 2);
  assert.doesNotMatch(one, /숨김/);
  assert.match(one, /<h2>제목0<\/h2><p>설명0<\/p><p><a class="app-landing-action" href="https:\/\/example.com\/0">열기<\/a><\/p><\/div><div class="app-landing-collage"><img src="https:\/\/example.com\/0.png"/);
});

test('interview_cards_link_their_source_and_examples_stay_preview_only', () => {
  const entry = '- { id: talk, question: 질문, quote: 답변, source: 공개 인터뷰, url: "https://example.com/talk" }';
  const real = render(`sections:\n  - id: interviews\n    type: interviews\n    items:\n      ${entry}`, false);
  assert.match(real, /<p class="app-interview-source"><a href="https:\/\/example.com\/talk">공개 인터뷰 →<\/a><\/p>/);
  const empty = 'sections:\n  - { id: interviews, type: interviews, items: [] }';
  assert.match(render(empty, true), /예시/);
  assert.doesNotMatch(render(empty, false), /interviews|예시/);
});

test('newsletter_without_endpoint_keeps_controls_disabled_and_never_posts', () => {
  const base = 'sections:\n  - id: contact\n    type: contact\n    mode: newsletter\n    email: hello@example.com';
  const idle = render(base);
  assert.doesNotMatch(idle, /action=|method=/);
  assert.match(idle, /<input[^>]*type="email"[^>]* disabled/);
  assert.match(idle, /<button type="submit" disabled>구독<\/button>/);
  assert.match(idle, /구독 서비스를 준비 중입니다/);
  assert.match(idle, /href="mailto:hello@example.com"/);
  assert.doesNotMatch(idle, /개인정보|구독했습니다|완료/);
  const live = render(`${base}\n    endpoint: https://subscribe.example.com/form\n    privacy: { label: 개인정보, href: "https://example.com/privacy" }`);
  assert.match(live, /<form class="app-newsletter" method="post" action="https:\/\/subscribe.example.com\/form">/);
  assert.doesNotMatch(live, /disabled|준비 중/);
  assert.match(live, /<a href="https:\/\/example.com\/privacy">개인정보<\/a>/);
  assert.throws(() => render(`${base}\n    endpoint: http://subscribe.example.com`), /sections\[0\]\.endpoint.*HTTPS/);
  assert.match(render('sections:\n  - { id: contact, type: contact, email: hello@example.com }'), /href="mailto:hello@example.com"/);
});

test('the_shipped_home_config_builds_two_dummy_projects_in_the_default_order', () => {
  const brands = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url))).icons.map(item => item.name);
  const home = loadHomeConfig(new Set(brands));
  assert.deepEqual(home.map(section => section.type), ['hero', 'projects', 'technologies', 'interviews', 'contact']);
  assert.equal(home[1].items.length, 2);
  assert.match(home[1].items[0].title, /프로젝트 예시 01/);
});
