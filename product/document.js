// 정적 문서의 독립적인 상호작용을 연결한다.
for (const navigation of document.querySelectorAll('.app-document-nav')) {
  const breakpoint = getComputedStyle(document.body).getPropertyValue('--breakpoint-review-wide').trim();
  const desktop = matchMedia(`(min-width: ${breakpoint})`);
  const update = () => { navigation.open = desktop.matches; };
  desktop.addEventListener('change', update); update();
}
for (const gallery of document.querySelectorAll('[data-gallery]')) {
  const buttons = [...gallery.querySelectorAll('[data-slide-index]')];
  const slides = [...gallery.querySelectorAll('[data-slide]')];
  const select = (index, focus = false) => {
    slides.forEach((slide, at) => { slide.classList.toggle('is-selected', at === index); slide.setAttribute('aria-hidden', String(at !== index)); });
    buttons.forEach((button, at) => button.setAttribute('aria-pressed', String(at === index)));
    if (focus) buttons[index].focus();
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      select(next, true);
    });
  });
}
for (const tabs of document.querySelectorAll('[data-tabs]')) {
  const buttons = [...tabs.querySelectorAll(':scope > [role=tablist] > button')];
  const panels = [...tabs.querySelectorAll(':scope > [role=tabpanel]')];
  const select = (index) => {
    buttons.forEach((button, at) => { button.setAttribute('aria-selected', String(at === index)); button.tabIndex = at === index ? 0 : -1; });
    panels.forEach((panel, at) => { panel.hidden = at !== index; if (panel.hidden) panel.querySelectorAll('video').forEach((video) => video.pause()); });
  };
  if (tabs.hasAttribute('data-platform')) {
    function selectPlatform(label) {
      const at = buttons.findIndex(button => button.textContent.toLowerCase().includes(label.toLowerCase()));
      if (at >= 0) select(at);
    }
    tabs.addEventListener('platform-select', event => selectPlatform(event.detail));
    const platform = new URLSearchParams(location.search).get('platform');
    if (platform) selectPlatform(platform);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      select(index);
      if (tabs.hasAttribute('data-platform')) {
        const later = [...document.querySelectorAll('[data-platform]')];
        later.slice(later.indexOf(tabs) + 1).forEach(next => next.dispatchEvent(new CustomEvent('platform-select', { detail: button.textContent })));
      }
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].click(); buttons[next].focus();
    });
  });
}
for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent); button.textContent = 'Copied'; }
  catch { button.textContent = '복사 실패 — 코드를 선택하세요'; }
});
for (const section of document.querySelectorAll('[data-keyboard]')) {
  const select = section.querySelector('[data-keyboard-language]');
  select.addEventListener('change', () => {
    section.querySelectorAll('[data-keyboard-keys]').forEach(element => {
      const variants = JSON.parse(element.dataset.keyboardMap);
      const keys = variants[select.value] ?? variants['en-us'];
      element.replaceChildren(...keys.flatMap((key,index) => {
        const kbd = document.createElement('kbd');
        kbd.textContent = key;
        return index ? [document.createTextNode(' '), kbd] : [kbd];
      }));
    });
  });
}

for (const button of document.querySelectorAll('[data-tooltip-trigger]')) {
  const bubble = document.getElementById(button.getAttribute('popovertarget'));
  const position = () => {
    const rect = button.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(bubble).getPropertyValue('--site-gap-xs'));
    const width = parseFloat(getComputedStyle(bubble).width);
    bubble.style.setProperty('--anchor-x', `${rect.left + rect.width / 2 - width / 2}px`);
    const height = bubble.getBoundingClientRect().height;
    const top = rect.bottom + gap + height > window.innerHeight ? rect.top - gap - height : rect.bottom + gap;
    bubble.style.setProperty('--anchor-y', `${Math.max(gap, top)}px`);
  };
  button.addEventListener('click', position);
  bubble.addEventListener('toggle', event => { if (event.newState === 'open') position(); });
  window.addEventListener('resize', () => { if (bubble.matches(':popover-open')) position(); });
  window.addEventListener('scroll', () => { if (bubble.matches(':popover-open')) bubble.hidePopover(); }, { passive: true });
}
