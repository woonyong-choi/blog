import { escape } from './markdown.mjs';

function socialIcon(name) {
  const path = name === 'github'
    ? '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.49c-2.23.48-2.7-.95-2.7-.95-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.22.82 1.22.82.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.85c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.21c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>'
    : '<circle cx="3" cy="13" r="2"/><path d="M1 6v3a6 6 0 0 1 6 6h3A9 9 0 0 0 1 6Zm0-5v3a11 11 0 0 1 11 11h3A14 14 0 0 0 1 1Z"/>';
  return `<svg class="app-social-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${path}</svg>`;
}

export function personalFooter(config) {
  return `<footer class="app-footer"><div class="app-shell"><div class="app-footer-grid"><section><h3>Notes</h3><ul><li><a href="/wiki/">기술과 학습 기록</a></li></ul></section><section><h3>Blog</h3><ul><li><a href="/blog/">최근 글</a></li><li><a href="/blog/all/">모든 글</a></li></ul></section><section><h3>Links</h3><ul><li class="app-footer-social"><a href="${escape(config.github)}" aria-label="GitHub">${socialIcon('github')}</a> <a href="/blog/feed.xml" aria-label="RSS">${socialIcon('rss')}</a></li></ul></section><section><h3>Contact</h3><ul>${config.contact?.email ? `<li><a href="mailto:${escape(config.contact.email)}">메일 보내기</a></li>` : ''}</ul></section></div><div class="app-footer-note"><a class="app-identity" href="/">${escape(config.handle ?? '@bywoonyong')}</a></div></div></footer>`;
}
