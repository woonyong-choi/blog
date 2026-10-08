import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projectVideo, technologySection, contactSection } from './home-sections.mjs';
import { personalHome } from './publication-layout.mjs';
import { clientEntrypoints } from './publication-assets.mjs';

test('project_media_is_optional_and_rejects_active_or_traversing_urls', () => {
  const project = { title: '프로젝트', description: '실제 영상으로 교체' };
  assert.doesNotMatch(projectVideo(project), /<video/);
  assert.match(projectVideo({ ...project, src: '/media/demo.mp4' }), /controls playsinline preload="none"/);
  assert.throws(() => projectVideo({ ...project, src: 'javascript:alert(1)' }), /HTTPS/);
  assert.throws(() => projectVideo({ ...project, src: '/media/../secrets.mp4' }));
  assert.throws(() => projectVideo({ ...project, src: '/media/demo.mp4', poster: 'data:text/html,x' }), /HTTPS/);
});

test('home_flow_preserves_order_and_uses_one_optional_client', () => {
  const config = { description: '소개', introduction: '설명', projectVideo: { title: '작업', description: '' }, technologies: ['python'], contact: { email: 'hello@example.com' } };
  const html = personalHome({ config, interviews: [{ question: '질문', quote: '내용', source: '예시', example: true }] });
  const positions = ['app-personal-hero', 'id="project-video"', 'class="app-technologies"', 'class="app-interviews"', 'class="app-home-contact"'].map(text => html.indexOf(text));
  assert.ok(positions.every((value, index) => value >= 0 && (!index || value > positions[index - 1])));
  assert.doesNotMatch(html, /<h2[^>]*>인터뷰/);
  assert.match(html, /data-flow-direction="right"/);
  assert.match(html, /href="\/tags\/python\/" aria-label="Python 태그 글 보기"/);
  assert.doesNotMatch(html, /data-flow-(?:controls|toggle|prev|next)/);
  assert.deepEqual(clientEntrypoints(html), ['flows.js']);
  assert.throws(() => technologySection(['missing'], []), /unknown technology/);
  assert.throws(() => technologySection(['python', 'python'], []), /duplicate/);
  assert.throws(() => contactSection({ email: 'hello@example.com?bcc=other@example.com' }), /invalid contact/);
});
