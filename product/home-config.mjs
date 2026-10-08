// 홈 설정 파일을 읽고 섹션별 계약을 검증한다. 오류에는 틀린 경로를 포함한다.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from 'yaml';

export const HOME_CONFIG = 'home.config.yaml';
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const RESERVED_IDS = ['main'];
const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'];
const VIDEO_TYPES = ['.mp4', '.webm'];
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const fail = (path, message) => { throw new Error(`${HOME_CONFIG} ${path}: ${message}`); };

function record(value, path, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, '키와 값을 가진 항목이어야 합니다');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`, `알 수 없는 설정입니다. 사용할 수 있는 설정: ${keys.join(', ')}`);
  return value;
}

function list(value, path) {
  if (!Array.isArray(value)) fail(path, '목록이어야 합니다');
  return value;
}

function text(value, path, required = true) {
  if (value === undefined || value === null) return required ? fail(path, '값이 필요합니다') : undefined;
  if (typeof value !== 'string') fail(path, '문자열이어야 합니다. 숫자나 날짜처럼 읽히면 따옴표로 감싸세요');
  const trimmed = value.trim();
  if (!trimmed) return required ? fail(path, '비어 있을 수 없습니다') : undefined;
  return trimmed;
}

function flag(value, path) {
  if (value === undefined) return true;
  if (typeof value !== 'boolean') fail(path, 'true 또는 false여야 합니다');
  return value;
}

function secure(value, path) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch {
    fail(path, `HTTPS 주소여야 합니다: ${value}`);
  }
  return value;
}

export function href(value, path) {
  const link = text(value, path);
  if (/[\u0000- \\]/u.test(link)) fail(path, '공백, 제어 문자, 역슬래시를 쓸 수 없습니다');
  if (link.startsWith('#')) return /^#[A-Za-z][\w-]*$/.test(link) ? link : fail(path, `잘못된 페이지 안 연결입니다: ${link}`);
  if (link.startsWith('/')) return link.startsWith('//') ? fail(path, '//로 시작하는 주소는 쓸 수 없습니다') : link;
  return secure(link, path);
}

// 로컬 파일은 /assets/ 또는 /media/ 아래만 허용하고 빌드 전에 존재를 확인한다.
function media(value, path, types, context) {
  const source = text(value, path);
  if (!source.startsWith('/')) return secure(source, path);
  if (!/^\/(?:assets|media)\/[A-Za-z0-9_][\w./-]*$/.test(source) || source.includes('//') || source.split('/').some(part => part === '..' || part === '.')) {
    fail(path, `/assets/ 또는 /media/ 아래의 안전한 경로여야 합니다: ${source}`);
  }
  if (!types.some(type => source.toLowerCase().endsWith(type))) fail(path, `${types.join(', ')} 파일이어야 합니다: ${source}`);
  if (context.check && !context.exists(source)) fail(path, `파일이 없습니다: product${source}`);
  return source;
}

function picture(value, path, context) {
  if (value === undefined) return undefined;
  const item = record(value, path, ['src', 'alt']);
  return { src: media(item.src, `${path}.src`, IMAGE_TYPES, context), alt: text(item.alt, `${path}.alt`, false) ?? '' };
}

function link(value, path, hrefRequired = true) {
  if (value === undefined) return undefined;
  const item = record(value, path, ['label', 'href']);
  return { label: text(item.label, `${path}.label`), href: hrefRequired || item.href !== undefined ? href(item.href, `${path}.href`) : undefined };
}

const SECTIONS = {
  hero(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'description', 'icon', 'image', 'video', 'action']);
    const video = item.video === undefined ? undefined : record(item.video, `${path}.video`, ['src', 'poster', 'title']);
    return {
      description: text(item.description, `${path}.description`),
      icon: picture(item.icon, `${path}.icon`, context),
      image: picture(item.image, `${path}.image`, context),
      video: video && {
        src: media(video.src, `${path}.video.src`, VIDEO_TYPES, context),
        poster: video.poster === undefined ? undefined : media(video.poster, `${path}.video.poster`, IMAGE_TYPES, context),
        title: text(video.title, `${path}.video.title`),
      },
      action: link(item.action, `${path}.action`, false),
    };
  },
  projects(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'items']);
    const items = list(item.items ?? [], `${path}.items`).map((entry, index) => {
      const where = `${path}.items[${index}]`;
      const project = record(entry, where, ['enabled', 'title', 'description', 'link', 'icon', 'image']);
      return {
        enabled: flag(project.enabled, `${where}.enabled`),
        title: text(project.title, `${where}.title`),
        description: text(project.description, `${where}.description`),
        link: link(project.link, `${where}.link`),
        icon: picture(project.icon, `${where}.icon`, context),
        image: picture(project.image, `${where}.image`, context),
      };
    });
    return { items: items.filter(project => project.enabled) };
  },
  technologies(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'items']);
    const seen = new Set();
    const items = list(item.items ?? [], `${path}.items`).map((entry, index) => {
      const id = text(entry, `${path}.items[${index}]`);
      if (!context.technologies.has(id)) fail(`${path}.items[${index}]`, `알 수 없는 기술입니다: ${id}`);
      if (seen.has(id)) fail(`${path}.items[${index}]`, `중복된 기술입니다: ${id}`);
      seen.add(id);
      return id;
    });
    return { items };
  },
  interviews(section, path) {
    const item = record(section, path, ['id', 'type', 'enabled', 'items']);
    const seen = new Set();
    const items = list(item.items ?? [], `${path}.items`).map((entry, index) => {
      const where = `${path}.items[${index}]`;
      const interview = record(entry, where, ['id', 'question', 'quote', 'source', 'url', 'example']);
      const id = text(interview.id, `${where}.id`);
      if (!/^[a-z0-9-]+$/.test(id)) fail(`${where}.id`, '영문 소문자, 숫자, -만 쓸 수 있습니다');
      if (seen.has(id)) fail(`${where}.id`, `중복된 인터뷰 id입니다: ${id}`);
      seen.add(id);
      if (interview.example !== undefined && typeof interview.example !== 'boolean') fail(`${where}.example`, 'true 또는 false여야 합니다');
      const example = interview.example === true;
      if (!example && interview.url === undefined) fail(`${where}.url`, '실제 인터뷰에는 HTTPS 원문 주소가 필요합니다');
      return {
        id, example,
        question: text(interview.question, `${where}.question`),
        quote: text(interview.quote, `${where}.quote`),
        source: text(interview.source, `${where}.source`),
        url: interview.url === undefined ? undefined : secure(text(interview.url, `${where}.url`), `${where}.url`),
      };
    });
    return { items };
  },
  contact(section, path, context) {
    const mode = section?.mode ?? 'email';
    if (!['email', 'newsletter'].includes(mode)) fail(`${path}.mode`, 'email 또는 newsletter여야 합니다');
    const common = ['id', 'type', 'enabled', 'mode', 'title', 'description', 'button', 'email'];
    const item = record(section, path, mode === 'email' ? common : [...common, 'icon', 'endpoint', 'field', 'note', 'privacy']);
    const email = text(item.email, `${path}.email`, mode === 'email');
    if (email && !EMAIL.test(email)) fail(`${path}.email`, `올바른 이메일 주소가 아닙니다: ${email}`);
    const contact = { mode, email };
    if (mode === 'email') {
      return { ...contact,
        title: text(item.title, `${path}.title`, false) ?? '함께 만들어 볼까요?',
        description: text(item.description, `${path}.description`, false) ?? '프로젝트와 협업에 관한 이야기를 기다립니다.',
        button: text(item.button, `${path}.button`, false) ?? '메일 보내기' };
    }
    const field = text(item.field, `${path}.field`, false) ?? 'email';
    if (!/^[A-Za-z][\w-]*$/.test(field)) fail(`${path}.field`, '영문자로 시작하는 입력 이름이어야 합니다');
    const privacy = item.privacy === undefined ? undefined : record(item.privacy, `${path}.privacy`, ['label', 'href']);
    return { ...contact, field,
      title: text(item.title, `${path}.title`, false) ?? '소식 받아보기',
      description: text(item.description, `${path}.description`, false) ?? '새 글과 프로젝트 소식을 이메일로 보내 드립니다.',
      button: text(item.button, `${path}.button`, false) ?? '구독',
      icon: picture(item.icon, `${path}.icon`, context),
      endpoint: item.endpoint === undefined ? undefined : secure(text(item.endpoint, `${path}.endpoint`), `${path}.endpoint`),
      note: text(item.note, `${path}.note`, false),
      privacy: privacy && { label: text(privacy.label, `${path}.privacy.label`), href: href(privacy.href, `${path}.privacy.href`) } };
  },
};

// 섹션 id에서 파생되는 DOM id까지 포함해 한 페이지 안의 중복을 막는다.
export const DERIVED_IDS = {
  hero: id => [id, `${id}-video`, `${id}-player`],
  contact: id => [id, `${id}-title`, `${id}-email`, `${id}-state`],
};
const domIds = section => (DERIVED_IDS[section.type] ?? (id => [id]))(section.id);

export function parseHomeConfig(source, { technologies = new Set(), exists = () => true } = {}) {
  let data;
  try { data = parse(source); } catch (error) { throw new Error(`${HOME_CONFIG}: YAML을 읽을 수 없습니다. ${error.message}`); }
  const root = record(data ?? {}, '(최상위)', ['sections']);
  const used = new Map(RESERVED_IDS.map(id => [id, '예약된 id']));
  return list(root.sections ?? [], 'sections').flatMap((entry, index) => {
    const path = `sections[${index}]`;
    const base = record(entry, path, Object.keys(entry ?? {}));
    const type = text(base.type, `${path}.type`);
    if (!SECTIONS[type]) fail(`${path}.type`, `알 수 없는 섹션 종류입니다: ${type}. 사용할 수 있는 종류: ${Object.keys(SECTIONS).join(', ')}`);
    const id = text(base.id, `${path}.id`);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(`${path}.id`, '영문 소문자로 시작하고 소문자, 숫자, -만 쓸 수 있습니다');
    const enabled = flag(base.enabled, `${path}.enabled`);
    const section = { id, type };
    for (const domId of domIds(section)) {
      if (used.has(domId)) fail(`${path}.id`, `DOM id "${domId}"가 ${used.get(domId)}와 겹칩니다`);
      used.set(domId, `${index}번째 섹션`);
    }
    const content = SECTIONS[type](base, path, { technologies, exists, check: enabled });
    return enabled ? [{ ...section, ...content }] : [];
  });
}

export function loadHomeConfig(technologies, root = ROOT) {
  return parseHomeConfig(readFileSync(join(root, HOME_CONFIG), 'utf8'), { technologies, exists: path => existsSync(join(root, path)) });
}
