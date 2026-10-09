// 공개 문서의 부모 관계와 주제 입구를 탐색 구성 요소에 연결한다.
import * as ui from './vendor/theme/assets/components.mjs';

function topicRoots(page, context) {
  const roots = context.topicTrees?.get(page.topic) ?? [];
  const entry = roots.find(node => node.page.slug === context.topics[page.topic]?.article);
  return entry ? [entry, ...roots.filter(node => node !== entry)] : roots;
}

export function documentNavigation(page, context) {
  function item(node) {
    const children = node.children.map(item);
    const current = node.page.id === page.id;
    return { title: node.page.title, href: node.page.route, current, children,
      open: current || children.some(child => child.open) };
  }
  const roots = topicRoots(page, context);
  if (!roots.length) return undefined;
  const topic = context.topics[page.topic];
  const entry = roots.find(node => node.page.slug === topic.article);
  const children = (entry ? [...entry.children, ...roots.filter(node => node !== entry)] : roots).map(item);
  const current = entry?.page.id === page.id;
  return ui.DocumentNavigation({ label: topic.label,
    nodes: [{ title: topic.label, href: entry?.page.route, current, children, open: true }] });
}

export function documentPager(page, context, renderIcon = () => undefined) {
  if (page.type !== 'wiki') return '';
  const ordered = [];
  const pending = topicRoots(page, context).toReversed();
  while (pending.length) {
    const node = pending.pop();
    ordered.push(node.page);
    for (let i = node.children.length - 1; i >= 0; i--) pending.push(node.children[i]);
  }
  const index = ordered.findIndex(candidate => candidate.id === page.id);
  if (index < 0) return '';
  const link = candidate => candidate && { title: candidate.title, href: candidate.route, icon: renderIcon(candidate) };
  return String(ui.DocumentPager({ label: context.topics[page.topic].label,
    before: link(ordered[index - 1]), after: link(ordered[index + 1]) }));
}

export function documentOutline(headings) {
  if (!headings.some(heading => heading.level <= 3)) return undefined;
  return ui.DocumentOutline({ sections: headings.filter(heading => heading.level <= 3)
    .map(heading => ({ ...heading, level: Math.max(2, heading.level) })) });
}
