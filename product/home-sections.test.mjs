import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { loadHomeConfig, parseHomeConfig } from './home-config.mjs';
import { personalHome } from './publication-layout.mjs';
import { clientEntrypoints, publicationAssets } from './publication-assets.mjs';

const TECHNOLOGIES = new Set(['python', 'git']);
const render = (yaml, preview = true) => personalHome({ config: { name: '이름' }, home: parseHomeConfig(yaml, { technologies: TECHNOLOGIES }), interviewExamples: [{ id: 'e', summary: '예시 요약', company: '예시 회사', role: '예시 직무', example: true }], preview });
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

test('interview_cards_need_only_summary_company_and_role_and_link_an_optional_source', () => {
  const item = extra => `sections:\n  - id: interviews\n    type: interviews\n    items:\n      - { id: talk, summary: 요약, company: 회사, role: 직무${extra} }`;
  const plain = render(item(''), false);
  assert.match(plain, /<p class="app-interview-summary">요약<\/p><p class="app-interview-meta"><strong>회사<\/strong><span>직무<\/span><\/p>/);
  assert.doesNotMatch(plain, /<a href/);
  const linked = render(item(', source: { platform: GitHub, label: 댓글 보기, url: "https://example.com/talk" }'), false);
  assert.match(linked, /<a href="https:\/\/example.com\/talk">댓글 보기 →<\/a>/);
  assert.match(render(item(', source: { platform: 오프라인 }'), false), /<span>오프라인<\/span>/);
  const empty = 'sections:\n  - { id: interviews, type: interviews, items: [] }';
  assert.match(render(empty, true), /예시 회사/);
  assert.doesNotMatch(render(empty, false), /interviews|예시/);
});

test('technologies_and_interviews_share_the_section_intro_with_projects', () => {
  const intro = html => html.match(/<div class="app-landing-heading">.*?<\/div>/)[0];
  const tech = render('sections:\n  - { id: tech, type: technologies, items: [python] }');
  assert.match(intro(tech), /<h2 id="tech-title">사용하는 기술<\/h2><p>[^<]+<\/p>/);
  const rich = render('sections:\n  - id: talk\n    type: interviews\n    icon: { src: https://example.com/i.png }\n    title: 이야기\n    description: 설명\n    links: [{ label: GitHub, href: "https://github.com/x", icon: github }, { label: 글, href: /blog/ }]\n    items: []');
  assert.match(intro(rich), /<h2 id="talk-title"><img src="https:\/\/example.com\/i.png" alt="" loading="lazy" decoding="async"> 이야기<\/h2><p>설명<\/p><p class="app-landing-social"><a href="https:\/\/github.com\/x" aria-label="GitHub"><svg class="app-landing-symbol"/);
  assert.match(intro(rich), /<a href="\/blog\/">글<\/a>/);
  assert.doesNotMatch(rich, /data-flow-controls|data-flow-(?:toggle|prev|next)|<button/);
  assert.match(rich, /class="app-landing-section app-landing-interviews"/);
  assert.deepEqual(clientEntrypoints(rich), ['flows.js']);
});

test('hero_title_names_the_page_and_icon_and_missing_files_of_disabled_items_are_ignored', () => {
  const hero = render('sections:\n  - id: hero\n    type: hero\n    title: 내 이름\n    description: 소개\n    icon: { src: https://example.com/a.png }');
  assert.match(hero, /<h1 class="app-sr">내 이름<\/h1>/);
  assert.match(hero, /alt="내 이름"/);
  assert.match(render(compose(['contact'])), /<h1 class="app-sr">이름<\/h1>/);
  assert.doesNotMatch(hero, /app-hero-title/);
  const noIcon = render('sections:\n  - { id: hero, type: hero, title: 내 이름, description: 소개 }');
  assert.match(noIcon, /<p class="app-hero-title" aria-hidden="true">내 이름<\/p>/);
  assert.doesNotMatch(render('sections:\n  - { id: hero, type: hero, description: 소개 }'), /app-hero-title/);
  const yaml = 'sections:\n  - id: projects\n    type: projects\n    items:\n      - { enabled: false, title: 숨김, description: 설명, image: { src: /assets/gone.png } }\n      - { title: 보임, description: 설명 }';
  const html = personalHome({ config: { name: '이름' }, home: parseHomeConfig(yaml, { exists: () => false }), interviewExamples: [], preview: true });
  assert.doesNotMatch(html, /gone\.png|숨김/);
  assert.throws(() => parseHomeConfig(yaml.replace('enabled: false, ', ''), { exists: () => false }), /items\[0\]\.image\.src: 파일이 없습니다/);
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

test('the_shipped_interviews_section_shows_its_description_by_default', () => {
  const brands = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url))).icons.map(item => item.name);
  const interviews = loadHomeConfig(new Set(brands)).find(section => section.type === 'interviews');
  assert.equal(interviews.description, '프로젝트와 개발에 관한 이야기를 모읍니다.');
  assert.match(personalHome({ config: { name: '이름' }, home: [interviews], interviewExamples: [], preview: true }) || '', /^<main/);
});

test('the_shipped_home_config_builds_two_dummy_projects_in_the_default_order', () => {
  const brands = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url))).icons.map(item => item.name);
  const home = loadHomeConfig(new Set(brands));
  assert.deepEqual(home.map(section => section.type), ['hero', 'projects', 'technologies', 'interviews', 'contact']);
  assert.equal(home[1].items.length, 2);
  assert.match(home[1].items[0].title, /프로젝트 예시 01/);
});
