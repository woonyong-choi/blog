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
| hero | `description` 필수. `icon`, `image`(`{src, alt}`), `video`(`{src, title}` 필수, `poster` 선택), `action`(`{label, href}`) |
| projects | `items` 목록. 항목마다 `title`, `description` 필수와 `enabled`, `link`(`{label, href}`), `icon`, `image` |
| technologies | `items`는 아이콘 카탈로그 이름 목록. 아이콘은 같은 이름의 태그 글로 연결 |
| interviews | `items`: `id`, `question`, `quote`, `source` 필수, `url`(실제 인터뷰는 HTTPS 필수), `example` |
| contact | `mode`: `email` 또는 `newsletter` |

- hero: 영상이 있고 `action.href`가 없으면 재생 버튼(`action.label`은 처음 문구)이 된다. `href`를 쓰면 그 링크가 된다. `image`는 영상이 없을 때 소개 아래에 크게 보인다.
- projects: 항목 하나가 제목 → 소개 → 링크 → 큰 이미지 구간 하나다. 항목을 추가한 만큼 구간이 늘고, 목록이 비면 섹션이 없다. 기본값은 더미 2개다.
- interviews: `items`가 비면 미리보기에서만 예시 카드를 보인다. 카드의 출처 문구가 `url`로 연결된다. 외부 주소를 읽어 오지 않으므로 내용은 직접 적는다.
- contact `email`: `email` 필수, `title`, `description`, `button` 선택.
- contact `newsletter`: 위 필드에 `icon`, `endpoint`, `field`(입력 이름, 기본 `email`), `note`, `privacy`(`{label, href}`)가 더해지고 `email`은 직접 문의 대안으로 쓴다. `endpoint`(HTTPS)가 없으면 입력과 버튼이 비활성이고 `구독 서비스를 준비 중입니다`를 보이며 어떤 주소도 저장하거나 전송하지 않는다. `endpoint`가 있으면 이메일을 그 주소로 form POST할 뿐이며 사이트는 성공 화면을 만들지 않는다. 실제 수신과 발송은 구독 서비스가 맡는다. `privacy`와 `note`는 적은 경우에만 보인다.

## 값 규칙

- 링크 `href`: HTTPS 주소, `/`로 시작하는 사이트 경로, `#`으로 시작하는 페이지 안 연결만 허용한다. `javascript:`, `data:`, `//host`, 공백은 거부한다.
- 이미지와 영상: `/assets/`, `/media/` 아래 파일(빌드 전에 존재 확인) 또는 HTTPS 주소. 파일은 `product/assets/`, `product/media/`에 둔다. 확장자는 이미지 png·jpg·webp·gif·svg·avif, 영상 mp4·webm.
- 문자열 값이 숫자나 날짜로 읽히는 경우 따옴표로 감싼다.

## 더미 자산 출처

기본 프로젝트 예시 01·02는 배치 확인용이다. 아이콘 `fancysection-icon-features-io70.png`, `fancysection-icon-design-io70.png`, `fancysection-icon-newsletter-io70.png`, 이미지 `whatsnew-collage-io60.png`, `meettheallnewthings2-io75.jpg`는 Things 공식 사이트(https://culturedcode.com/things/)의 자산이며 `product/assets.json`에 원본 URL과 해시가 있다. 실제 프로젝트가 아니므로 공개 전에 교체한다. 구간의 구조와 배치는 홈의 Simply Powerful, Things Newsletter 구간(2026-10-09 확인)을 따르고 `simple` 테마의 `app-landing-*`, `app-newsletter` 규칙을 재사용한다.
