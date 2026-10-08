# 홈 설정 가이드

홈은 `product/home.config.yaml` 한 파일로 조립한다. `sections` 목록의 순서가 화면 순서이고, 각 항목의 `enabled: false`가 그 섹션을 끈다. 꺼진 섹션은 HTML, 복사할 자산, 스크립트에 남지 않는다.

```sh
npm run build:site        # 설정을 검증하고 dist/site를 만든다
npm run check:product     # 계약 테스트
```

잘못된 설정은 `home.config.yaml sections[1].items[0].link.href: ...`처럼 틀린 경로를 포함한 오류로 빌드를 멈춘다.

## 공통 필드

| 필드 | 설명 |
|---|---|
| `id` | 필수. 소문자로 시작하는 소문자, 숫자, `-`. 섹션 DOM id가 되며 `main`이나 다른 섹션과 겹치면 오류 |
| `type` | 필수. `hero`, `projects`, `technologies`, `interviews`, `contact` |
| `enabled` | 선택. 기본 `true` |

같은 종류를 여러 번 둘 수 있다. hero는 `<id>-video`, `<id>-player`, contact는 `<id>-title` 등 파생 id도 중복 검사에 포함한다.

## 복사해서 쓰는 예

```yaml
sections:
  - id: hero
    type: hero
    description: 소개 문장
    icon: { src: /assets/hero-logo-things-io90.png, alt: 로고 }
    video: { src: /media/intro.mp4, poster: /media/poster.png, title: 소개 영상 }
    action: { label: 영상 보기 }
  - id: projects
    type: projects
    items:
      - title: 프로젝트 이름
        description: |
          첫 문단.

          빈 줄로 나누면 둘째 문단.
        link: { label: 자세히 보기, href: https://example.com }
        icon: { src: /assets/fancysection-icon-features-io70.png }
        image: { src: /media/project.png, alt: 화면 모음 }
  - { id: technologies, type: technologies, items: [python, git] }
  - id: contact
    type: contact
    mode: email
    email: me@example.com
```

## 섹션

| 종류 | 필드 |
|---|---|
| hero | `description` 필수. `title`(선택. 페이지 제목과 아이콘 대체 글이고, `icon`이 없으면 아이콘 자리에 화면 제목으로 보인다), `icon`, `image`(`{src, alt}`), `video`(`{src, title}` 필수, `poster` 선택), `action`(`{label, href}`) |
| projects | `items` 목록. 항목마다 `title`, `description` 필수와 `enabled`, `link`(`{label, href}`), `icon`, `image` |
| technologies | 머리 `icon`, `title`(기본 `함께 쓰는 기술`), `description`(기본 `기술별 기록을 모았습니다.`). `items`는 아이콘 카탈로그 이름 목록이며 같은 이름의 태그 글로 연결 |
| interviews | 머리 `icon`, `title`(기본 `사람들이 하는 말`), `description`(기본 `동료평가 소개 섹션입니다.`), `links`(`{label, href?, icon?}`). `items`: `id`, `summary` 필수, `profile`(`{image?, title, subtitle?}`), `url`, `example` 선택 |
| contact | `mode`: `email` 또는 `newsletter` |

- hero: 영상이 있고 `action.href`가 없으면 재생 버튼(`action.label`은 처음 문구)이 된다. `href`를 쓰면 그 링크가 된다. `image`는 영상이 없을 때 소개 아래에 크게 보인다. 재생 버튼의 문구는 항상 `action.label`로 고정이고 아이콘만 재생과 일시정지 두 가지다. 영상이 끝나면 재생 아이콘으로 돌아가며 다시 누르면 처음부터 재생한다. 영상은 크롬 등에서 색이 어긋나지 않도록 `yuv420p`, BT.709 H.264로 둔다(변환 방법은 `product/media/README.md`).
- projects: 링크 문구는 `link.label`, 이동 주소는 `link.href`이며 둘 다 직접 정한다(예: `label: 기능 보기`, `href: /wiki/`). 기본 예시는 `자세히 보기`다. 항목 하나가 제목 → 소개 → 링크 → 큰 이미지 구간 하나다. 항목을 추가한 만큼 구간이 늘고, 목록이 비면 섹션이 없다. 기본값은 더미 2개이며 자체 placeholder 이미지(`project-placeholder.svg`)와 아이콘(`project-placeholder-icon.svg`)을 쓴다. 두 아이콘과 기술 섹션의 키캡 아이콘(`technology-keycap-icon.svg`)은 원본 PNG처럼 64px 안에서 그림 영역을 x11..53, y12..53(약 42x41)에 맞춘다. 공통 CSS가 투명 패딩을 전제로 마진을 주기 때문이다.
- technologies, interviews, contact(newsletter)는 projects와 같은 머리(아이콘, 제목, 설명)를 쓰고 그 아래에 기술 로고 흐름, 인터뷰 카드 흐름, 구독 입력이 이어진다. 머리 바탕과 간격은 섹션 종류가 정한다.
- interviews: `links`는 제목 아래의 링크 행이다. `icon`은 내장 이름(`github`, `rss`, `linkedin`) 또는 이미지 파일이고 생략하면 `label`이 글자로 보인다. 내장 아이콘은 `href`를 비워 둘 수 있으며 그러면 아이콘만 보이고 링크도 클릭도 없다(`aria-label`은 `<label> · 주소 준비 중`). 주소가 생기면 `href`만 채운다. 어떤 계정 주소도 추정해 넣지 않는다.
- interviews 요약 링크: `summary` 안에서 `[@만난 곳](https://...)` 문법의 링크만 읽는다. 주소는 링크 `href`와 같은 규칙(HTTPS 또는 `/`로 시작하는 사이트 경로, `#` 페이지 안 연결)이고 `javascript:`, `data:`, `//host`는 설정 오류다. 라벨의 `@`는 글자 그대로이고 `@word`만 쓰면 링크도 주소 추정도 없다. 라벨 안의 `[`, `]`는 `\[`, `\]`로 쓰며 한 요약에 링크를 여러 개 넣을 수 있다. HTML, 이미지, 강조 등 다른 문법은 해석하지 않고 글자로 보인다. 프로필 세 자리와 별개인 본문 기능이다.
- interviews 카드: 요약 아래는 `profile`의 이미지, 제목, 부제목 세 자리뿐이다. 회사형이면 회사 아이콘, 회사명, 직무이고 플랫폼형이면 프로필 이미지, 아이디, 날짜처럼 같은 자리를 바꿔 쓴다. 두 값을 겹쳐 쌓지 않으며 `title`, `subtitle`은 의미가 없는 문자열이다. `url`(HTTPS)이 있으면 `title`이 링크가 되고 별도 줄은 생기지 않는다. `image`가 없으면 그 자리는 비지 않고 왼쪽 여백도 없으며, `profile`이 없으면 요약만 보인다. `image`는 `/assets/`, `/media/` 또는 HTTPS 이미지다. `items`가 비면 미리보기에서만 예시 카드(`회사명`, `직무`)를 보인다. 외부 계정을 읽어 오지 않으므로 값은 직접 적는다.
- contact `email`: `email` 필수, `title`, `description`, `button` 선택.
- contact `newsletter`: 위 필드에 `icon`, `endpoint`, `field`(입력 이름, 기본 `email`), `note`, `privacy`(`{label, href}`)가 더해지고 `email`은 직접 문의 대안으로 쓴다. `endpoint`(HTTPS)가 없으면 입력과 버튼이 비활성이고 `구독 서비스를 준비 중입니다`를 보이며 어떤 주소도 저장하거나 전송하지 않는다. `endpoint`가 있으면 이메일을 그 주소로 form POST할 뿐이며 사이트는 성공 화면을 만들지 않는다. 실제 수신과 발송은 구독 서비스가 맡는다. `privacy`와 `note`는 적은 경우에만 보인다.

## 인터뷰 항목 예

회사형과 플랫폼형은 같은 세 자리를 다르게 채울 뿐이다. 주소는 모두 자리 표시 값이다.

```yaml
links:
  - { label: GitHub, href: "https://github.com/github-id", icon: github }
  - { label: LinkedIn, icon: linkedin }   # href가 없으면 아이콘만 보인다
items:
  - id: company-card
    summary: "[@커뮤니티](https://example.com/community)에서 함께했습니다."
    profile: { image: { src: /assets/company.png, alt: "" }, title: 회사명, subtitle: 직무 }
  - id: platform-card
    summary: 선별해 정리한 요약문
    profile: { image: { src: /assets/profile.png, alt: "" }, title: "@github-id", subtitle: "2026-01-15" }
    url: https://github.com/github-id/repo/discussions/1
  - { id: summary-only, summary: 직접 들은 이야기의 요약 }
```

## 값 규칙

- 링크 `href`: HTTPS 주소, `/`로 시작하는 사이트 경로, `#`으로 시작하는 페이지 안 연결만 허용한다. `javascript:`, `data:`, `//host`, 공백은 거부한다.
- 이미지와 영상: `/assets/`, `/media/` 아래 파일(빌드 전에 존재 확인) 또는 HTTPS 주소. 파일은 `product/assets/`, `product/media/`에 둔다. 확장자는 이미지 png·jpg·webp·gif·svg·avif, 영상 mp4·webm.
- 문자열 값이 숫자나 날짜로 읽히는 경우 따옴표로 감싼다.

## 더미 자산 출처

기본 프로젝트 예시 01·02는 배치 확인용이다. 아이콘 `fancysection-icon-features-io70.png`, `fancysection-icon-design-io70.png`, `fancysection-icon-newsletter-io70.png`, 이미지 `whatsnew-collage-io60.png`, `meettheallnewthings2-io75.jpg`는 Things 공식 사이트(https://culturedcode.com/things/)의 자산이며 `product/assets.json`에 원본 URL과 해시가 있다. 실제 프로젝트가 아니므로 공개 전에 교체한다. 구간의 구조와 배치는 홈의 Simply Powerful, Things Newsletter 구간(2026-10-09 확인)을 따르고 `simple` 테마의 `app-landing-*`, `app-newsletter` 규칙을 재사용한다.
