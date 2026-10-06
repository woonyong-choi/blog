# 제품 소개와 지원 문서 예시

Things의 화면 구성을 참고한 검토용 정적 사이트다. 본문은 새로 작성한 더미 콘텐츠다. 개인 소개·블로그·포트폴리오 정보 설계는 이 구현을 검토한 다음 진행한다.

## 실행

```sh
npm ci
npm run build:product
npm run dev -- --host 127.0.0.1 --port 8794
```

- 홈: `/things/`
- 기능: `/things/features/`
- 지원: `/things/support/`
- 전체 문법: `/things/support/articles/4651820/`
- 블로그: `/things/blog/`

`dist/things/`을 정적 서버의 `/things/`에 배치한다. 기존 문서 사이트 빌드인 `npm run build`와 출력 위치를 분리한다.

## 정본

| 경로 | 역할 |
|---|---|
| `content/*.md` | 페이지 메타데이터와 본문 정본 |
| `markdown.mjs` | Markdown와 문서 구성 요소 변환 |
| `layout.mjs` | 내비게이션·검색·홈·문서·블로그 레이아웃 |
| `site.js` | 검색·탭·슬라이드·영상·복사·폼 동작 |
| `theme.config.json` | 사용하는 테마 ID |
| `vendor/theme/` | 디자인 토큰 저장소에서 가져온 해시 검증 사본 |
| `assets.json` | 참고 자산의 원본 URL·해시 |
| `assets/` | 로컬 참고 자산. 원본의 고유 색과 도형을 보존 |

스타일 정본은 design-tokens의 `themes/base/simple/`이다. `base`를 상속하고 단일 라이트 모드를 제공한다. 첨부한 토큰·CSS·디자인 설명은 그 안의 `reference/`에 보존한다. 이 사이트에서 임의로 스타일 값을 추가하지 않는다.

```sh
npm run theme:product -- /path/to/design-tokens
npm run build:product
```

동기화는 변조된 사본을 덮어쓰지 않는다. 기본 테마 갱신 후 이 명령으로 완성본을 다시 가져온다. 배포된 사이트는 원격 저장소의 미검증 변경을 자동 적용하지 않는다.

## 문서 작성

```markdown
---
title: 문서 제목
route: /things/support/articles/my-guide/
layout: article
icon: markdown
description: 문서의 짧은 소개
---
## 첫 번째 단계

본문을 작성합니다.
```

메타데이터는 YAML 또는 JSON이다. `route`는 `/things/` 아래의 소문자 영문·숫자·하이픈 경로이며 끝에 `/`를 둔다. 중복 경로, 빠진 자산, 깨진 내부 링크·목차, 중복 HTML ID는 빌드 오류다. `layout`은 home, support, features, article, post, blog다. post는 ISO 날짜 문자열 `date`를 지정한다.

기본 문법은 제목 1–6, 문단, 줄바꿈, 강조, 취소선, 인용, 목록·중첩 목록, 정적 체크 목록, 링크·참조 링크·자동 링크, 이미지, 구분선, 정렬 표, 코드·구문 강조, 각주다. HTML과 스크립트는 실행하지 않는다.

구성 요소는 `ui:이름` 코드 펜스에 YAML 또는 JSON으로 작성한다. `syntax: true`인 페이지는 구성 요소 아래에 작성 문법과 복사 버튼을 함께 표시한다. 실제 전체 예시는 `content/support-4651820.md`다.

| 이름 | 입력 |
|---|---|
| callout | title, body, tone: warning 선택 |
| details | title, body, open 선택 |
| figure | src, alt, caption, wide 선택 |
| video | src, poster, title, caption 선택 |
| device | src, title, video: true와 poster 선택 |
| gallery | slides: [{src, alt, label 선택}], wide 선택 |
| tabs | items: [{label, body}], title 선택 |
| cards | items: [{title, href, icon, description, compact 선택}], columns, split 선택 |
| definitions | items: [{term, body}] |
| speech | body |
| keys | label, keys: 문자열 배열 |
| tooltip | label, description |
| form | label, message: true 선택 |
| group | title, body |
| feature | title, icon, description, body, left, right |

body는 다시 Markdown으로 해석한다. gallery의 label을 생략하면 번호 버튼이 되고, 지정하면 Before/Now처럼 비교 버튼이 된다. src와 poster에는 assets 폴더의 파일명을 쓴다. 다수의 탭과 슬라이드는 서로의 상태를 변경하지 않는다.

## 검증

```sh
npm run check:product
npm run build:product
npm run build
```

폼은 브라우저 입력 형식 검사와 확인 메시지만 제공한다. 구독·문의·구매·계정 변경은 외부로 전송하지 않는다. 소셜 계정과 플랫폼 페이지도 검토용 더미 페이지다. 원본 사이트의 전체 아카이브 내용이나 서버 기능을 구현했다는 의미는 아니다.
