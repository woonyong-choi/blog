// 本문 조작은 정적 HTML 위에서 필요한 기능만 점진적으로 활성화한다.
import './document.js';

for (const form of document.querySelectorAll('[data-public-search] form')) {
  const input = form.querySelector('input');
  const clear = form.querySelector('[data-clear-query]');
  input.addEventListener('input', () => { clear.hidden = !input.value; });
  clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; input.focus(); });
}
