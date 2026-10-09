// `:::이름[라벨]{속성}` 블록 문법의 줄 분류와 속성 읽기. markdown-it에 의존하지 않는다.
export const MAX_DEPTH = 3;

export class DirectiveError extends Error {
  constructor(message, { page, line, name } = {}) {
    const where = [page, line ? `본문 ${line}줄` : '', name ? `:${name}` : ''].filter(Boolean).join(' ');
    super(where ? `${where}: ${message}` : message);
    this.name = 'DirectiveError';
    Object.assign(this, { page, line, directive: name, detail: message });
  }
}

const NAME = '[a-z][a-z0-9-]{0,23}';
const OPEN = new RegExp(`^(:{3,})(${NAME})(?:\\[([^\\]\\n]*)\\])?(?:\\{(.*)\\})?\\s*$`);
const LEAF = new RegExp(`^::(${NAME})(?:\\[([^\\]\\n]*)\\])?\\{(.*)\\}\\s*$`);
const CLOSE = /^(:{3,})\s*$/;
const END = /^:::end\s*$/;
// `:::tabs frame-none position-bottom`처럼 이름 뒤에 공백으로 옵션을 적는 탭 묶음의 여는 줄. 대괄호·중괄호로 시작하면 옛 형식이다.
const TABS_FORM = /^:::tabs[ \t]+(?![\[{])(\S.*?)\s*$/;
const TAB_LINE = /^@tab(?:[ \t]+(.*?))?\s*$/;
const KEY = /^[a-z][a-z0-9-]{0,23}/;
const BARE = /^[^\s"'{}=\\]+/;
const CONTROL = /[\u0000-\u001f\u007f]/u;
const LIMITS = { attributes: 12, value: 300, label: 80 };

// 한 줄을 여는 줄, 닫는 줄, 리프 줄로 나눈다. 블록 줄처럼 보이지만 형식이 틀리면 'invalid'다.
export function classifyLine(text) {
  if (!text.startsWith('::')) return { kind: 'text' };
  if (END.test(text)) return { kind: 'end' };
  let match = TABS_FORM.exec(text);
  if (match) return { kind: 'tabs-form', colons: 3, name: 'tabs', options: match[1] };
  match = OPEN.exec(text);
  if (match) return { kind: 'open', colons: match[1].length, name: match[2], label: match[3], source: match[4] };
  match = CLOSE.exec(text);
  if (match) return { kind: 'close', colons: match[1].length };
  match = LEAF.exec(text);
  if (match) return { kind: 'leaf', name: match[1], label: match[2], source: match[3] };
  return text.startsWith(':::') ? { kind: 'invalid' } : { kind: 'text' };
}

export function parseLabel(label, fail) {
  if (label === undefined) return undefined;
  const value = label.trim();
  if (!value || value.length > LIMITS.label || CONTROL.test(value)) fail(`라벨은 1~${LIMITS.label}자의 한 줄이어야 합니다`);
  return value;
}

// `key=값 key="공백 있는 값" flag` 형식. 값은 따옴표 안에서만 `\"`와 `\\`를 쓴다. 중복 키와 제어 문자는 거부한다.
export function parseAttributes(source = '', fail) {
  const attrs = Object.create(null);
  let at = 0;
  while (true) {
    while (source[at] === ' ' || source[at] === '\t') at += 1;
    if (at >= source.length) break;
    const key = KEY.exec(source.slice(at))?.[0];
    if (!key) fail(`속성 이름이 잘못되었습니다: ${JSON.stringify(source.slice(at, at + 12))}`);
    if (attrs[key] !== undefined) fail(`속성이 겹칩니다: ${key}`);
    if (Object.keys(attrs).length >= LIMITS.attributes) fail(`속성은 ${LIMITS.attributes}개까지 쓸 수 있습니다`);
    at += key.length;
    if (source[at] !== '=') { attrs[key] = true; continue; }
    at += 1;
    let value = '';
    if (source[at] === '"') {
      at += 1;
      for (; ; at += 1) {
        if (at >= source.length) fail(`따옴표가 닫히지 않았습니다: ${key}`);
        const char = source[at];
        if (char === '"') { at += 1; break; }
        if (char === '\\') {
          at += 1;
          if (source[at] !== '"' && source[at] !== '\\') fail(`따옴표 안에서는 \\" 와 \\\\ 만 이스케이프할 수 있습니다: ${key}`);
          value += source[at];
        } else value += char;
      }
    } else {
      value = BARE.exec(source.slice(at))?.[0] ?? '';
      if (!value) fail(`값이 비었습니다: ${key}`);
      at += value.length;
    }
    if (source[at] !== undefined && source[at] !== ' ' && source[at] !== '\t') fail(`속성 사이에는 공백이 필요합니다: ${key}`);
    if (CONTROL.test(value) || value.length > LIMITS.value) fail(`값이 너무 길거나 제어 문자가 있습니다: ${key}`);
    attrs[key] = value;
  }
  return attrs;
}

// 인라인 `{...}`의 끝을 따옴표를 고려해 찾는다. 닫는 위치(`}`의 다음 인덱스)를 돌려준다.
export function attributeEnd(text, start) {
  let quoted = false;
  for (let at = start + 1; at < text.length && text[at] !== '\n'; at += 1) {
    if (quoted && text[at] === '\\') at += 1;
    else if (text[at] === '"') quoted = !quoted;
    else if (text[at] === '}' && !quoted) return at + 1;
  }
  return -1;
}

// 속성 명세({ 이름: { type, required, values, min, max } })로 값을 검사해 새 객체를 만든다. 명세에 없는 속성은 거부한다.
export function validateAttributes(raw, spec, fail, checks) {
  const result = Object.create(null);
  for (const key of Object.keys(raw)) {
    if (!Object.hasOwn(spec, key)) fail(`허용하지 않는 속성입니다: ${key} (허용: ${Object.keys(spec).join(', ') || '없음'})`);
  }
  for (const [key, rule] of Object.entries(spec)) {
    const value = raw[key];
    if (value === undefined) {
      if (rule.required) fail(`필수 속성이 없습니다: ${key}`);
      continue;
    }
    if (rule.type === 'bool') {
      if (value !== true && value !== 'true' && value !== 'false') fail(`${key}는 true 또는 false여야 합니다`);
      result[key] = value === true || value === 'true';
      continue;
    }
    if (value === true) fail(`값이 필요한 속성입니다: ${key}`);
    if (rule.type === 'enum') {
      if (!rule.values.includes(value)) fail(`${key}는 ${rule.values.join(', ')} 중 하나여야 합니다`);
    } else if (rule.type === 'int') {
      if (!/^\d{1,4}$/.test(value) || Number(value) < rule.min || Number(value) > rule.max) fail(`${key}는 ${rule.min}~${rule.max}의 정수여야 합니다`);
    } else if (rule.type === 'asset' || rule.type === 'url' || rule.type === 'icon') {
      const problem = checks[rule.type](value);
      if (problem) fail(`${key}: ${problem}`);
    }
    result[key] = value;
  }
  return result;
}

// `@tab 라벨` 줄. 라벨이 없으면 `{ label: undefined }`, 탭 줄이 아니면 null이다.
export function parseTabLine(text) {
  const match = TAB_LINE.exec(text);
  return match ? { label: match[1] || undefined } : null;
}

export const TAB_OPTIONS = Object.freeze({
  frame: ['none', 'panel'],
  position: ['bottom', 'top'],
  selector: ['buttons', 'segmented', 'numbers'],
  width: ['content', 'wide'],
});

// 탭 옵션 등록부. 짧은 이름(권장), 긴 이름(`frame-panel`), `이름=값` 형식이 모두 같은 (묶음, 값)으로 풀린다.
// 짧은 이름은 이 Markdown 문법의 유틸리티이고 Tailwind CSS 클래스가 아니다. 기본값에는 짧은 이름이 없다(생략하면 기본).
const SHORT_TAB_OPTIONS = Object.freeze({ box: ['frame', 'panel'], top: ['position', 'top'], segmented: ['selector', 'segmented'], numbers: ['selector', 'numbers'], 'w-wide': ['width', 'wide'] });

function resolveTabOption(token) {
  if (Object.hasOwn(SHORT_TAB_OPTIONS, token)) return SHORT_TAB_OPTIONS[token];
  const match = /^(frame|position|selector|width)(?:-|=)([a-z]+)$/.exec(token);
  return match && TAB_OPTIONS[match[1]].includes(match[2]) ? [match[1], match[2]] : null;
}

// 탭 옵션: `segmented top w-wide`(권장), `selector-segmented`(긴 이름), `selector=segmented`를 받는다. 같은 묶음은 한 번만, 모르는 옵션은 오류다.
// 기본값(frame-none, position-bottom, selector-buttons, width-content)은 긴 이름으로만 받고 쓰지 않은 것과 같다. 쓰지 않은 묶음은 결과에 없다.
export function parseTabOptions(source = '', fail) {
  const options = {};
  const given = {};
  const allowed = [...Object.keys(SHORT_TAB_OPTIONS), ...Object.entries(TAB_OPTIONS).flatMap(([group, values]) => values.map(value => `${group}-${value}`))];
  for (const token of source.split(/\s+/).filter(Boolean)) {
    const resolved = resolveTabOption(token);
    if (!resolved) fail(`알 수 없는 탭 옵션입니다: ${token} (사용할 수 있는 옵션: ${allowed.join(', ')})`);
    const [group, value] = resolved;
    if (given[group]) fail(options[group] === value ? `탭 옵션이 겹칩니다: ${given[group]}, ${token}` : `탭 옵션이 충돌합니다: ${given[group]}, ${token}`);
    given[group] = token;
    options[group] = value;
  }
  return options;
}
