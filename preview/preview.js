// 시안의 예시 콘텐츠만 사용하며 개인 위키 원문은 읽지 않는다.
const topics = [
  ['cs', 'CS 기초', '자료구조 · 알고리즘 · OS · 네트워크', '<path d="M5 5h14v14H5zM9 9h6v6H9zM9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>'],
  ['programming', 'Programming', '언어 · 런타임 · 설계 · 테스트', '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>'],
  ['data', 'Data', '데이터베이스 · SQL · 데이터 흐름', '<path d="M4 5c0-4 16-4 16 0S4 9 4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>'],
  ['frontend', 'Frontend', '브라우저 · 인터페이스 · React', '<path d="M2 4h20v16H2zM2 9h20m-14 0v11"/>'],
  ['backend', 'Backend', 'API · Spring · 인증과 데이터 처리', '<path d="M3 3h18v7H3zM3 14h18v7H3zM7 6h1m-1 11h1m4-11h5m-5 11h5"/>'],
  ['devops', 'DevOps', 'Kubernetes · 배포 · 관측과 운영', '<path d="M12 3v6M5 15v-3h14v3"/><rect x="8" y="1" width="8" height="5" rx="1"/><rect x="1" y="15" width="8" height="6" rx="1"/><rect x="15" y="15" width="8" height="6" rx="1"/>'],
  ['ai', 'AI', '모델 · 검색 · 추론과 평가', '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10"/><path d="m7 5 10 14m0-14L7 19"/>'],
];
const pages = {
  resume: ['Woonyong', '백엔드와 개발 도구를 만드는 개발자', '<p>문제를 작은 단위로 나누고, 구현과 검증을 기록하며, 다음 작업에서 다시 사용할 수 있는 지식과 도구로 연결하는 데 관심이 있습니다.</p><h3>대표 작업</h3><ul class="docs-profile-detail-list"><li>K8s Clue — Kubernetes 장애 증거와 수정 제안을 연결하는 팀 프로젝트.</li><li>Daphnis — 텍스트를 문서용 다이어그램으로 만드는 도구.</li></ul><h3>이력서 구성</h3><p>소개 → 대표 프로젝트 → 재직 경력 → 교육과 기술 경험 순서로 구성합니다. 이 화면은 소개와 이동 구조의 예시이며, 경력·기간·성과 수치는 최종 이력서에 확인된 내용만 연결합니다.</p>'],
  portfolio: ['포트폴리오', '직접 만든 것과 선택의 이유', '<p>프로젝트마다 문제, 본인 역할, 설계 판단, 구현, 검증과 한계를 보여줍니다.</p><ul class="docs-profile-detail-list"><li><a href="#clue" data-page="clue">K8s Clue</a> — 팀 프로젝트</li><li><a href="#daphnis" data-page="daphnis">Daphnis</a> — 개발 도구</li></ul>'],
  clue: ['K8s Clue', 'Kubernetes 장애 진단·복구 제안', '<p>장애의 증거를 읽기 전용으로 수집하고, 규칙으로 원인을 판정하며, 사람이 검토할 수 있는 수정안으로 연결하는 팀 프로젝트입니다.</p><h3>상세 페이지에서는</h3><p>팀의 결과와 본인이 맡은 구현을 구분하고, 증거 수집 → 진단 → Draft PR → 복구 확인의 흐름과 실제 검증 범위를 설명합니다.</p><h3>함께 읽기</h3><p><a href="#kubernetes" data-page="kubernetes">위키 · Kubernetes</a></p><p><a href="https://github.com/woonyong-choi/clue" target="_blank" rel="noopener noreferrer">프로젝트 저장소 ↗</a></p>'],
  daphnis: ['Daphnis', '텍스트에서 문서용 다이어그램으로', '<p>하나의 텍스트 소스로 흐름, 시퀀스, 상태, 데이터 관계와 차트를 표현하는 도구입니다.</p><h3>같은 디자인 언어</h3><p>웹 문서와 다이어그램이 역할 기반 디자인 토큰을 공유합니다. 계산과 배치는 도구가 맡고, 색상과 글꼴은 공통 테마에서 받습니다.</p><p><a href="https://github.com/woonyong-choi/daphnis" target="_blank" rel="noopener noreferrer">도구 저장소 ↗</a></p>'],
  'theme-story': ['웹과 다이어그램이 같은 디자인을 쓰려면', '설계 기록 · 예시 글', '<p>버튼의 파란색과 다이어그램의 강조선을 따로 관리하면 테마를 바꿀 때 서로 다른 화면이 됩니다.</p><h3>값보다 역할을 공유하기</h3><p>본문, 보조 설명, 강조, 경계선처럼 쓰임을 먼저 정합니다. 각 화면은 같은 역할을 참조하고 실제 값은 하나의 테마가 소유합니다.</p><h3>연결되는 내용</h3><p>완성된 글에서는 문제, 통합 과정, 라이트·다크 검증과 남은 제약을 설명합니다. 이 문장은 화면 구성을 위한 예시입니다.</p><p><a href="#daphnis" data-page="daphnis">관련 프로젝트 · Daphnis</a></p>'],
  'clue-story': ['장애를 고치기 전에, 증거부터 모으는 이유', '문제 해결 · 예시 글', '<p>관찰한 사실과 원인에 대한 추정, 실제 변경을 구분하면 판단의 근거를 다시 확인할 수 있습니다.</p><h3>관찰과 변경 사이</h3><p>이 글의 예시 구조는 증상 → 수집한 증거 → 진단 기준 → 변경 제안 → 검증입니다. 실제 사건 기록과 측정값은 본문 작성 시 확인해 연결합니다.</p><p><a href="#clue" data-page="clue">관련 프로젝트 · K8s Clue</a></p>'],
  'sql-story': ['SQL 한 줄이 데이터에 닿기까지', '학습 기록 · 예시 글', '<p>쿼리를 해석하는 단계와 실제 데이터를 읽고 쓰는 단계를 나누어 보면 데이터베이스 내부의 책임이 드러납니다.</p><h3>작은 구현으로 따라가기</h3><p>쿼리 입력 → 해석 → 실행 → 저장 경로 순서로 예제와 코드를 보여줄 글의 시안입니다. 학습 구현의 범위와 제품 운영 경험은 구분합니다.</p><p><a href="#data" data-page="data">관련 위키 · Data</a></p>'],
};
for (const [id, title, description, paths] of topics) {
  document.querySelector('#topic-list').insertAdjacentHTML('beforeend', `<a class="docs-profile-topic" href="#${id}" data-page="${id}"><span class="docs-profile-topic-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${paths}</svg></span><div><h3>${title}</h3><p>${description}</p></div><span class="docs-profile-arrow" aria-hidden="true">↗</span></a>`);
  pages[id] = [title, description, `<p>이 분야의 개념을 한곳에서 정리하고, 실제 적용한 글과 프로젝트로 연결합니다.</p><h3>주제 탐색</h3><ul class="docs-profile-detail-list">${description.split(' · ').map(item => `<li>${item}</li>`).join('')}</ul><p>정식 위키에서는 왼쪽에 문서 계층, 가운데에 Markdown 본문, 오른쪽에 현재 문서의 목차를 표시합니다. 지금은 분야별 이동 구조를 보여주는 시안입니다.</p>`];
}
pages.wiki = ['개발 위키', '기초에서 구현과 운영까지', `<p>재사용할 개념은 한 번만 정리하고 관련 경험과 프로젝트에서 연결합니다.</p><ul class="docs-profile-detail-list">${topics.map(([id, title]) => `<li><a href="#${id}" data-page="${id}">${title}</a></li>`).join('')}</ul>`];
for (const [id, title, domain, description] of [
  ['python','Python','Programming','문법, 데이터 모델, 예외와 실행 흐름'],
  ['kotlin','Kotlin','Programming','타입, 널 안전성, 함수와 코루틴'],
  ['spring','Spring Boot','Backend','애플리케이션 구성, API와 데이터 처리'],
  ['react','React','Frontend','컴포넌트, 상태와 화면 갱신'],
  ['postgres','PostgreSQL','Data','SQL, 트랜잭션과 인덱스'],
  ['kubernetes','Kubernetes','DevOps','Workload, 접근 권한, 리소스 정책과 운영'],
]) pages[id] = [title, `위키 / ${domain} / ${title}`, `<p>${description}를 찾아가는 기술별 진입점입니다.</p><h3>이 페이지의 역할</h3><p>기술 이름으로 바로 들어와도 위키의 대표 부모는 ${domain}으로 유지됩니다. 관련 글과 프로젝트는 별도의 연결 목록으로 보여줍니다.</p><p>이 화면은 탐색 시안입니다. 실제 위키 본문이나 작성 예정 문서를 공개한 화면은 아닙니다.</p>`];

const dialog = document.querySelector('.docs-profile-dialog');
const detail = document.querySelector('#detail-content');
const menu = document.querySelector('.docs-profile-menu');
const mobile = document.querySelector('#mobile-menu');
let returnFocus;
function closeMenu() { mobile.hidden = true; menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { mobile.hidden = !mobile.hidden; menu.setAttribute('aria-expanded', String(!mobile.hidden)); });
mobile.addEventListener('click', closeMenu);
document.addEventListener('click', event => {
  const link = event.target.closest('[data-page]');
  if (!link) return;
  event.preventDefault();
  const page = pages[link.dataset.page];
  if (!page) return;
  const [title, subtitle, body] = page;
  detail.innerHTML = `<p class="docs-profile-meta">${subtitle}</p><h2 id="detail-title">${title}</h2>${body}`;
  if (!dialog.open) { returnFocus = link; dialog.showModal(); }
  dialog.scrollTop = 0;
  document.querySelector('.docs-profile-close').focus();
  closeMenu();
});
document.querySelector('.docs-profile-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => returnFocus?.focus());
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobile.hidden) { closeMenu(); menu.focus(); } });
const toggle = document.querySelector('[data-theme-toggle]');
// tokens-allow: 사용자의 테마 선택은 토큰의 light/dark 모드만 전환한다.
const scheme = matchMedia('(prefers-color-scheme: dark)'); // tokens-allow: 시스템 모드를 읽어 테마 전환 버튼의 접근성 이름에 반영한다.
function updateThemeLabel() {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : scheme.matches;
  toggle.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
  toggle.setAttribute('aria-pressed', String(dark));
}
toggle.addEventListener('click', () => {
  document.documentElement.dataset.theme = toggle.getAttribute('aria-pressed') === 'true' ? 'light' : 'dark';
  updateThemeLabel();
});
scheme.addEventListener('change', updateThemeLabel);
updateThemeLabel();
