import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { initDocumentNavigation } from './document-navigation.js';
import * as ui from './vendor/theme/assets/components.mjs';

test('document_navigation_tracks_subheadings_and_preserves_mobile_disclosure_choices', () => {
  const html = ui.DocumentLayout({
    navigation: ui.DocumentNavigation({ label: 'Python',
      nodes: [{ title: 'Python', href: '/docs/python/', current: true }] }),
    outline: ui.DocumentOutline({ sections: [
      { id: 'one', title: '첫 절', level: 2 }, { id: 'child', title: '하위 절', level: 3 },
      { id: 'two', title: '다음 절', level: 2 },
    ] }),
    content: ui.trusted('<h2 id="one">첫 절</h2><h3 id="child">하위 절</h3><h2 id="two">다음 절</h2>'),
  });
  const dom = new JSDOM(String(html), { url: 'https://example.com/docs/python/' });
  const doc = dom.window.document;
  const layout = doc.querySelector('[data-document-layout]');
  const panes = [...layout.querySelectorAll('aside')];
  panes.forEach(pane => { pane.style.position = 'sticky'; });
  const panels = [...layout.querySelectorAll('[data-document-panel]')];
  assert.equal(panels.length, 1);
  assert.equal(layout.querySelector('.app-document-outline > nav').getAttribute('aria-label'), '본문 목차');
  assert.equal(layout.querySelector('.app-document-outline summary'), null);
  let scheduled;
  dom.window.requestAnimationFrame = callback => { scheduled = callback; return 1; };
  const tops = [0, 100, 200];
  ['one', 'child', 'two'].forEach((id, index) => {
    doc.getElementById(id).getBoundingClientRect = () => ({ top: tops[index] });
  });
  initDocumentNavigation(layout);
  assert.ok(panels.every(panel => panel.open));
  assert.equal(layout.querySelector('.app-document-outline [aria-current]').hash, '#one');
  tops.splice(0, 3, -100, -1, 200);
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  scheduled();
  assert.equal(layout.querySelector('.app-document-outline [aria-current]').hash, '#child');
  assert.equal(layout.querySelector('.app-document-outline .is-parent').hash, '#one');
  Object.defineProperty(doc.documentElement, 'scrollHeight', { value: 1200 });
  dom.window.scrollY = 200;
  dom.window.innerHeight = 1000;
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  scheduled();
  assert.equal(layout.querySelector('.app-document-outline [aria-current]').hash, '#two');
  panes.forEach(pane => { pane.style.position = 'static'; });
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.ok(panels.every(panel => !panel.open));
  panels[0].open = true;
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(panels[0].open, true);
  assert.equal(panels[0].querySelector('summary').tabIndex, 0);
  dom.window.close();
});
