# Markdown 글 작성

글은 `.md` 파일 하나이며 일반 Markdown만으로 쓴다. `ui:` 구성 요소는 복각 검토 화면용 선택 기능이고 글 작성에 필요하지 않다. 실제 렌더링은 미리보기의 `/articles/markdown-guide/`에서 확인한다. 원문은 `product/examples/markdown-guide.md`이며 `example: true`라 운영 빌드, 검색, RSS, 사이트맵에서 빠진다.

## 파일과 메타데이터

`product/publication/`(공개 입력)이나 `product/examples/`(예시)에 `.md` 파일을 둔다. 맨 위에 `---`로 감싼 YAML 또는 JSON을 쓰고 아래에 본문을 쓴다.

| 필드 | 필수 | 내용 |
|---|---|---|
| `id`, `slug` | 예 | 소문자 영문·숫자·하이픈. 댓글 연결과 주소에 쓰며 중복이면 빌드 오류 |
| `type` | 예 | `wiki` 또는 `blog` |
| `title`, `description` | 예 | 제목, 목록·검색·도입문에 쓰는 한두 문장 |
| `tags`, `field`, `topic` | 예 | `topics.json`에 있는 태그 1~5개, 분야, 대표 주제 |
| `contentIcon.name` | 예 | 테마의 콘텐츠 아이콘 이름 |
| `visibility` | 예 | `public` 또는 `draft` |
| `comments` | blog는 `true` | giscus 댓글 |
| `publishedAt`, `updatedAt` | blog는 발행일 | `YYYY-MM-DD` |
| `author` | 선택. 글 꼬리말 맨 위에 그대로 표시할 문구 | 문자열 |
| `parent` | 아니오 | 위키 부모 문서의 slug |
| `thumbnail` | 아니오 | `src`, `alt`, 선택 `position` |
| `example` | 아니오 | `true`면 미리보기 전용 |

본문의 첫 문단이 `description`과 같으면 그 문단이 도입문이 된다. 다르면 `description`이 도입문이고 본문은 그대로 이어진다.

## 화면 구조

블로그 상세는 Things 단일 글과 같다. 검색과 제목 아이콘이 없고 가운데 날짜, 가운데 제목, 도입문, 본문 순서이며 태그·댓글·관련 글은 본문 뒤에 둔다. 위키 상세는 검색, 아이콘 제목, 도입문, 날짜·태그, 접힌 문서 목록, 목차, 본문 순서이며 읽기 열은 680px 가운데에 고정한다. 문서 목록은 본문을 옆으로 밀지 않고 닫힌 `details`로 둔다.

본문의 `#`은 글 제목이 `h1`이므로 `h2`로, 피드에서는 한 단계씩 더 내려 출력한다. 쓴 단계는 `app-heading-N` 클래스로 남아 어느 위치에서도 같은 크기와 여백을 쓴다. 목차는 `##` 제목으로 만든다.

## 지원 문법

| 구분 | 문법 | 비고 |
|---|---|---|
| 제목 | `#`~`######` | 제목 ID는 글 ID를 앞에 붙이고 겹치면 번호를 올린다 |
| 문단·줄바꿈 | 빈 줄, 줄 끝 공백 둘 또는 `\` | |
| 강조 | `*기울임*` `**굵게**` `***둘 다***` `~~취소선~~` | |
| 표시 | `==표시==` `::표시::` | `<mark>` |
| 첨자 | `H~2~O` `x^2^` | 공백 없는 낱말만. `~5분 ~10분`처럼 공백이 끼면 글자 그대로 |
| 인라인 코드 | `` `코드` `` | 백틱이 있으면 바깥에 둘 |
| 링크 | `[글](주소 "제목")` `[글][참조]` `<주소>` 본문 주소 | `http(s)`, `mailto`, 사이트 안 경로, 앵커만. `javascript:`·`data:`·`vbscript:`·`file:`은 링크가 되지 않는다 |
| 이미지 | `![대체](경로 "제목")` | 지연 로딩, 본문 폭 제한 |
| 인용 | `>` | 중첩 가능 |
| 목록 | `-` `*` `+` `1.` | 중첩·문단 포함 가능 |
| 작업 목록 | `- [ ]` `- [x]` `- [~]` | 읽기 전용, `[~]`는 취소 |
| 표 | GFM 표, `:--` `:-:` `--:` 정렬 | 좁은 화면에서 표만 가로 스크롤 |
| 구분선 | `---` `***` `___` | |
| 이스케이프 | `\*` `\_` `\#` 등 | |
| 각주 | `[^이름]` `[^이름]: 본문` `^[인라인]` | 글마다 ID가 분리된다 |
| 정의 목록 | 용어 줄 다음 `: 설명` | `markdown-it-deflist`의 의미를 따른다. 여러 문단과 블록 포함 가능 |
| 접기 | `<details>`(`open` 선택), `<summary>글자</summary>` | 속성이 없는 두 태그만. 안은 Markdown이며 펜스 코드 안의 `</details>`는 짝이 아니다 |
| 수식 | `$...$`, `$$...$$` | KaTeX. 아래 절 |
| 도표 | ` ```mermaid ` | Mermaid. 아래 절 |
| 키·메뉴 | `:kbd[⌘ K]` `:menu[파일]` | |
| 아이콘·설명 | `:icon[search]` `:tip[글]{text="설명"}` | 아래 "구성 블록" 절 |
| 구성 블록 | `:::tabs` `:::note` `:::steps` 등 | 아래 "구성 블록" 절 |
| 코드 블록 | 펜스와 언어, 4칸 들여쓰기 | 아래 절. 들여쓴 블록은 plaintext로 같은 머리글·복사 |

HTML은 글자로 출력하고 실행하지 않는다. `<details>`와 `<summary>`만 위 조건에서 구조로 받아들인다. 속성이 있거나 닫히지 않은 `<details>`, 태그가 섞인 `<summary>`는 글자로 남는다.

### 원본 글 요소

Things 블로그 글의 작은 글씨 문단과 이미지 묶음은 선택 구성 요소로 쓴다. 임의 HTML은 받지 않는다.

- `ui:fineprint`: `body` 한 문단(인라인 Markdown 허용). 원본 `p.fineprint` 값을 쓴다.
- `ui:figure-grid`: `items`의 `src`, `alt`, `caption`, `href`, `rounded`. `columns`(1~6)와 `size`(`small`, `large`)는 원본 `newgrid`의 `has-N-columns`, `is-small`, `is-large`와 같다. 지정하지 않으면 원본 기본처럼 열 최소 너비 210px로 늘고 준다.
- 링크 `href`는 `https://`, `mailto:`, `#`, 또는 `/articles/foo/`처럼 `/`로 시작하는 사이트 경로만 받는다. `//`로 시작하는 주소, 역슬래시, 공백·제어 문자, `javascript:`는 빌드 오류다.

````markdown
```ui:fineprint
body: 이 글은 평소보다 기술적입니다. [요약](#summary)만 읽어도 됩니다.
```

```ui:figure-grid
columns: 2
items:
  - { src: 2-today-mac.png, alt: 오늘 화면, caption: 첫 캡션, href: /articles/foo/, rounded: true }
  - { src: 10-reminders-mac.png, alt: 알림 화면, caption: 둘째 캡션 }
```
````

작성자는 글 메타데이터에 `"author": "Posted by 이름"`으로 쓴다.

- `ui:figure`도 `href`와 `rounded`를 받는다. `rounded` 이미지는 원본 글의 인라인 1em 곡률이다.

### 수식

`$...$`(한 줄)와 `$$...$$`(블록)를 쓴다. 빌드할 때 `@vscode/markdown-it-katex`와 KaTeX가 HTML과 MathML로 만들어 두므로 읽는 쪽에서 스크립트를 실행하지 않는다. 숫자 앞의 `$5`, 공백으로 끝나는 `$` 쌍, 코드 범위와 코드 블록 안의 `$`, `\$`는 수식이 아니다. 틀린 수식은 빌드를 멈추지 않고 원문을 흐린 점선 밑줄(`katex-error`)로 보여 준다. `trust`를 끄고 있어 `\href`, `\includegraphics`, `\htmlClass` 등은 링크나 요소를 만들지 못하고 글자로 남는다. 긴 수식은 `.katex-block` 안에서 가로로 스크롤한다. 수식이 있는 페이지만 `/katex/katex.css`(font-display swap)와 필요한 woff2 글꼴을 싣는다. 글꼴은 모두 로컬이고 woff·ttf는 배포하지 않는다.

### 도표

` ```mermaid ` 블록은 Mermaid 도표다. 블록 하나는 `figure.app-diagram`으로 나온다. 도표 자리, 열린 `details`의 원문(`app-code` 블록과 복사 버튼), 상태 문구로 이루어진다. 도표가 있는 페이지에만 `mermaid-loader.js`를 연결하고, 도표가 화면 300px 안에 들어오면 로컬 렌더러(`/mermaid/render.js`와 도표 종류별 조각, 필요한 조각만 내려받음)를 한 번 불러와 그린다. 외부 서버나 CDN은 쓰지 않는다. 렌더러는 `securityLevel: 'strict'`로 라벨의 HTML을 인코딩하고 `click`·`javascript:` 링크를 막으며, `secure` 목록으로 글 안의 `%%{init}%%`가 보안 수준과 테마를 바꾸지 못하게 한다. 글꼴과 색은 테마 토큰(`--site-font`, `--site-ink`, `--site-muted`, `--site-soft`, `--site-card`)을 읽는다. 그리기에 성공하면 원문을 접고, 스크립트가 없거나 실패하면 원문이 열린 채 남아 읽고 복사할 수 있다. 도표 ID는 글 ID에 번호를 붙여 페이지 안에서 겹치지 않는다. 문법 오류는 `check:product`가 콘텐츠의 모든 `mermaid` 블록을 구문 분석해 잡는다. 실제 그림은 브라우저에서 확인한다.

### 지원하지 않는 것

- 임의 HTML, 인라인 스타일, 스크립트, iframe.
- KaTeX가 신뢰하지 않는 명령, Mermaid의 `click`과 `%%{init}%%` 보안·테마 변경.
- ` ```math ` 펜스(수식은 `$$`로 쓴다), Mermaid의 아이콘 팩과 외부 URL 로딩.

## 구성 블록

기기별 탭, 단계, 영상, 질문과 답, 카드 링크는 `:::` 블록으로 쓴다. 안쪽은 일반 Markdown이라 JSON이나 이스케이프한 문자열이 필요 없다. 기존 ` ```ui:이름 ` 블록은 그대로 동작하고 둘을 섞어 쓸 수 있다. 완성된 글은 `product/examples/document-composition.md`이고 미리보기의 `/articles/document-composition/`에서 본다.

````markdown
::::platform
:::tab[Mac]
:::steps
1. :menu[파일]을 열고 :kbd[⌘ N]을 누릅니다.
2. 사이드바의 :icon[document] 표시를 확인합니다.
:::

::video{src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt="Mac 화면" caption="목록을 만드는 과정"}

:::note
일반 Markdown **안내문**
:::
:::
:::tab[iPhone]
설명
:::
::::
````

### 문법

| 형태 | 의미 |
|---|---|
| `:::이름[라벨]{속성}` … `:::` | 본문이 있는 블록. 여는 줄과 닫는 줄의 콜론 수가 같아야 한다 |
| `::이름{속성}` | 본문이 없는 한 줄 블록(리프). 속성은 필수 |
| `:이름[글]{속성}` | 문장 안 표기 |

- 이름은 소문자 영문·숫자·`-`. 블록 줄은 줄 맨 앞에서 시작하고 들여쓰기 4칸 이상은 코드다.
- 안쪽 블록은 바깥보다 콜론을 적게 써도, 같게 써도 된다. 닫는 줄은 가장 안쪽에 열린 블록부터 짝을 맞춘다. 읽기 쉽도록 바깥 블록의 콜론을 더 길게(`::::`) 쓰기를 권한다.
- 라벨은 `[...]` 안의 한 줄 글자(1~80자, `]` 불가). 속성은 `{키=값 키="공백 있는 값" 플래그}`. 값 안의 따옴표는 `\"`, 역슬래시는 `\\`. 플래그만 쓰면 `true`다. 속성은 12개, 값은 300자까지.
- 코드 펜스(` ``` `, `~~~`)와 4칸 이상 들여쓴 코드 안의 `:::` 줄은 블록으로 읽지 않는다.
- 기존 `::표시::`(mark)와는 충돌하지 않는다. 리프 줄은 `::소문자이름{`으로 시작할 때만 블록이다.

### 블록

| 블록 | 라벨 | 속성 | 놓는 곳 | 본문 |
|---|---|---|---|---|
| `tabs` | 선택(접근성 이름) | 없음 | 문서 바로 아래 | `:::tab`만 1개 이상(옛 형식). `@tab` 형식은 아래 "탭: `@tab` 형식" |
| `platform` | 선택(기본 "기기별 안내") | 없음 | 문서 바로 아래 | `tab`만. 같은 문서의 아래 `platform`이 같은 이름의 탭을 따라 고른다 |
| `tab` | 필수, 같은 묶음에서 겹치지 않음 | 없음 | `tabs`·`platform` 안 | Markdown, `note`·`steps`·`video` 등 |
| `note`, `warning` | 선택(기본 "참고", "주의") | 없음 | 문서 바로 아래, `tab` 안 | Markdown. 다른 블록은 둘 수 없음 |
| `fineprint` | 없음 | 없음 | 문서 바로 아래, `tab` 안 | 문단만. 작은 글씨 |
| `steps` | 없음 | 없음 | 문서 바로 아래, `tab` 안 | 목록만. 항목 사이를 넓힌다 |
| `qa` | 없음 | 없음 | 문서 바로 아래, `tab` 안 | 정의 목록(`질문` 다음 줄 `: 답`)만 |
| `cards` | 없음 | `variant`(`related`, `centered`, `grouped`, `inline`), `columns`(`1`, `2`) | 문서 바로 아래, `tab` 안 | `card`만 1개 이상 |
| `card`(리프) | 없음 | `title`·`href` 필수, `description`, `icon` | `cards` 안 | 없음 |
| `gallery`(옛 형식) | 없음 | `title`(접근성 이름), `width` | 문서 바로 아래, `tab` 안 | `slide`만 1개 이상. 새 글에는 `:::tabs selector-numbers`를 권한다. 탭 구성 요소를 그대로 쓰므로 `ui:gallery`와 같은 마크업·스크립트 |
| `slide`(리프) | 없음 | `src`·`alt` 필수, `caption` | `gallery` 안 | 없음 |
| `figure`(리프) | 없음 | `src`·`alt` 필수, `caption`, `href`, `rounded`, `width` | 문서 바로 아래, `tab` 안 | 없음 |
| `video`(리프) | 없음 | `src`·`poster`·`alt` 필수, `caption`, `controls`, `frame`(`none`, `iphone`), `width` | 문서 바로 아래, `tab` 안 | 없음 |

- 블록 중첩은 3단계까지다(`tabs` > `tab` > `note` 등). 목록과 인용 안에서는 블록을 쓸 수 없다.
- `tab`, `note`, `warning` 안에서는 제목, 각주, 코드 블록, 이미지 등 일반 Markdown을 쓸 수 있다. `fineprint`, `steps`, `qa`, `cards`는 위 표의 본문 제한을 따른다. 제목과 각주 ID는 글 전체에서 겹치지 않는다. 숨은 탭 안의 `##`도 목차에 들어간다.
- `src`와 `poster`는 `product/assets/`에 있는 파일 이름만 쓴다. 경로, `..`, 없는 파일은 오류다.
- `href`는 위 "원본 글 요소"와 같은 규칙이다(`https://`, `mailto:`, `#`, `/`로 시작하는 사이트 경로).
- `cards`의 글 끝 "이어서 읽을 글"에는 `variant=related`를 권한다. 글 하단 "함께 읽기"와 같은 카드(왼쪽 아이콘, 제목, 최대 3줄 요약, 행마다 같은 높이, 태그 없음)로 그려진다. 나머지 변형은 다른 용도의 기존 표현이다.
- `icon`은 테마의 콘텐츠 아이콘 이름이다. 글 앞의 `contentIcon.name`과 같은 목록이다.

### 탭: `@tab` 형식

`:::tabs`와 `@tab 이름` 줄로 탭을 쓴다. 탭 본문은 일반 Markdown이고 `:::end`로 닫는다. 그림은 보통의 `![대체](경로)`와 캡션 문단으로 쓴다. 옵션 없이 쓰면 상자 없이 둥근 단추 줄이 패널 아래에 오고, 기본을 벗어나는 모양만 공백으로 구분한 옵션으로 적는다.

````markdown
:::tabs selector-segmented
@tab 변경 전

![변경 전 화면](/things/assets/repeating-comparison-1-io80.png)

기존 화면입니다.

@tab 변경 후

![변경 후 화면](/things/assets/repeating-comparison-2-io80.png)

개선한 화면입니다.

:::end
````

| 묶음 | 기본 | 기본을 벗어나는 옵션 |
|---|---|---|
| 상자 | 없음 | `frame-panel` |
| 선택 줄 위치 | 패널 아래 | `position-top` |
| 선택 줄 모양 | 둥근 단추(`Mac` `iPhone & iPad` `Watch` 같은 모양) | `selector-segmented`(분할 선택 줄), `selector-numbers`(번호) |
| 폭 | 본문 폭 | `width-wide`(탭 묶음 전체) |

- 옵션은 서로 독립이라 순서가 없다. 기본값(`frame-none`, `position-bottom`, `selector-buttons`, `width-content`)을 적어도 받지만 쓰지 않은 것과 같고, 기본값에는 클래스가 붙지 않는다. `frame=panel` 같은 `이름=값` 형식도 받는다.
- 같은 묶음 옵션을 둘 쓰거나 같은 옵션을 겹쳐 쓰거나 모르는 옵션을 쓰면 오류다. 폭은 탭 묶음 전체에만 걸리고 바깥 문단은 본문 폭이다.
- `@tab` 줄에는 이름이 필요하다. `selector-numbers`만 이름을 생략할 수 있고, 이때 버튼에는 번호가 나오며 이름을 쓰면 접근성 이름이 된다. 이름은 묶음 안에서 겹치지 않는다.
- 첫 `@tab` 줄 앞에는 본문을 둘 수 없고, `@tab`이 하나도 없거나 탭 본문이 비었거나 `:::end`가 없으면 오류다. 오류에는 줄 번호가 붙는다.
- 코드 펜스와 4칸 이상 들여쓴 코드 안의 `@tab`, `:::end`, `:::tabs` 줄은 해석하지 않는다. 탭 본문 안의 다른 블록(`:::note` 등) 안의 `@tab`도 탭을 나누지 않는다.
- 옵션 없는 `:::tabs`는 다음 내용 줄이 `@tab`일 때 이 형식이다. 옵션이 있으면 항상 이 형식이다.
- 보이는 패널만 높이를 차지한다. 그림 높이가 달라도 선택 줄은 지금 보이는 내용 바로 옆에 있다. 분할 선택 줄은 내용에 맞는 폭이고 이름마다 자기 길이만큼 자리를 차지하며 긴 이름은 줄바꿈된다.
- 선택 줄의 방향키·Home·End와 영상 정지는 기존 탭 스크립트 하나가 처리한다. 갤러리도 이 탭이다(`selector-numbers`, `::figure`로 캡션).
- 옛 형식은 그대로 동작한다. `:::platform`은 상자, 위, 둥근 단추(기기 이름 동기화)이고, `::::tabs`+`:::tab[이름]`과 `ui:tabs`는 선택 줄이 위에 오는 분할 모양이다.

### 블록 폭

그림, 영상, 갤러리, 코드 블록은 같은 폭 규칙을 쓴다. 문단은 항상 본문 폭이다.

| `width` | 폭 | 쓰는 곳 |
|---|---|---|
| `content`(기본) | 본문 폭 | 모두 |
| `narrow` | 좁은 미디어 폭(테마의 `width-narrow`) 이하로 가운데 | 작은 화면 캡처 |
| `wide` | 넓은 미디어 폭(`width-wide`: 최대 900px, 좁은 화면에서는 양쪽 여백을 남김)으로 본문 밖까지 | 넓은 그림, 갤러리, 긴 코드 |

- 쓰는 법: `::figure{width=narrow}`, `::video{width=wide}`, `:::gallery{width=wide}`(탭은 `:::tabs width-wide`), 코드 펜스는 정보 문자열에 ` ```js width=wide `. `ui:figure`·`ui:gallery`의 `width`도 같다.
- 옛 표기 `wide`(참/거짓), `size=compact`는 `width=wide`, `width=narrow`와 같다. 같이 쓰면서 값이 다르면 오류다. `ui:video`의 `width`·`height`·`wide`는 플레이어 속성이라 그대로다.
- 폭은 구성 요소가 클래스(`app-width-narrow`, `app-width-wide`)로 정하고 값은 테마 토큰이다. 글마다 폭을 따로 정하는 스타일은 없다.
- `tab` 안에서도 같은 규칙이지만 기기 탭 상자는 본문 폭이라 `wide`가 상자 밖으로 나온다. 탭 안에서는 `content`를 권한다.

### 문장 안 표기

| 표기 | 출력 |
|---|---|
| `:kbd[⌘ K]`, `:menu[파일]` | 키캡, 메뉴 이름 |
| `:icon[이름]` | 문장 속 작은 콘텐츠 아이콘. 장식이라 읽어 주지 않으므로 뜻을 글로도 쓴다 |
| `:tip[글]{text="설명"}` | 글 아래 점선, 누르면 열리는 설명. 키보드로 열 수 있고 Esc나 바깥 누름으로 닫힌다. 설명은 글자만(Markdown 없음) |

속성은 `icon`·`tip`만 받는다. 이름이 목록에 없는 `:이름[...]`은 그대로 글자로 남는다. 코드 범위와 코드 블록 안은 해석하지 않는다.

### 오류

잘못된 블록은 빌드를 멈추고 `문서ID 본문 N줄 :이름: 내용` 형식으로 알린다. 줄은 글 본문의 첫 줄이 1이다. 닫히지 않은 블록, 여는 줄 없는 닫는 줄, 콜론 수 불일치, 알 수 없는 이름, 허용하지 않거나 겹치는 속성, 필수 속성 누락, 잘못된 주소, 없는 자산·아이콘, 놓을 수 없는 자리, 본문에 둘 수 없는 요소, 탭 이름 중복이 모두 같은 형식이다. 블록처럼 보이는 줄(`:::`로 시작)이 형식에 맞지 않아도 글자로 두지 않고 오류로 알린다.

### 호환성

`:::` 블록은 같은 `app-*` 클래스와 마크업을 낸다. 스타일은 `:::steps`의 `.app-steps`와 `:icon`의 `.app-inline-icon`만 테마에 더했다. 동작은 기존 `document.js`(탭 화살표·Home·End, 팝오버 설명)와 `video.js`를 그대로 쓴다. `ui:` 블록은 변경이 없고 `:::` 블록 안에서도, 반대로도 쓸 수 있다.

탭, 강조 상자, 카드, 갤러리, 코드 블록, 설명의 HTML은 테마의 구성 요소 모듈(`product/vendor/theme/assets/components.mjs`, 정의는 design-tokens `docs/styles.md`의 "구성 요소 모듈")이 한 번만 정의하고, `ui:` 블록과 `:::` 블록, 글 하단 함께 읽기가 같은 함수를 가져다 쓴다. 이 저장소의 `markdown.mjs`, `directive-blocks.mjs`, `publication-layout.mjs`, `blog-layout.mjs`, `home-sections.mjs`, `post-article.mjs`, `article-toc.mjs`는 입력을 정리해 넘기는 어댑터다. 홈 히어로 영상, 섹션 머리, 가로 흐름 목록, 블로그 카드, 쪽 이동, 태그 목록, 목차, 글 틀, 검색 결과 줄은 서버와 브라우저(`search-view.mjs`)가 같은 모듈을 쓰고, 브라우저는 구성 요소 출력만 `<template>`로 DOM에 옮긴다. 소비자에 남은 것의 분류는 design-tokens `docs/styles.md`의 "소비자가 소유하는 것"에 있다.

구현은 `product/directives.mjs`(markdown-it 블록·인라인 규칙), `directive-syntax.mjs`(줄 분류, 속성 읽기, 검사), `directive-blocks.mjs`(블록 정의표)다. 새 블록은 정의표에 허용 속성, 놓을 자리, 본문 규칙, 출력을 한 항목으로 추가한다.

## 코드 블록

펜스 첫 낱말이 언어이며 대소문자를 구분하지 않는다. highlight.js에 등록된 193개 언어와 모든 별칭을 쓴다. 대표 언어는 JavaScript(`js`), TypeScript(`ts`), Python(`py`), C, C++(`cpp`, `c++`), C#(`cs`, `c#`), Java, Kotlin(`kt`), Rust(`rs`), Go(`golang`), Swift, Bash(`sh`, `zsh`), SQL, JSON, YAML(`yml`), HTML(`xml`), CSS, Dockerfile(`docker`), Markdown(`md`)이다. 등록되지 않은 언어, 언어 없는 블록, `text`는 `plaintext`로 원문을 이스케이프해 보여 준다.

블록 위 머리글에 언어 이름이 왼쪽, 복사 아이콘 단추가 오른쪽에 있다(이름은 `aria-label`, 결과는 상태 영역과 `data-state`로 알린다). 구문 색은 테마의 의미 색(`syntax-*`)을 따른다. 코드는 블록 폭에 맞춰 줄바꿈하고(`pre-wrap`, 공백 없는 긴 낱말은 `overflow-wrap: anywhere`) 가로 스크롤은 없다. 줄바꿈은 화면 표시일 뿐이라 복사 원문에는 영향이 없다. 머리글은 `pre` 밖에 있어 항상 고정이고 탭 너비는 4다. 복사는 렌더된 코드의 텍스트를 그대로 쓰므로 주석, 탭, 줄 끝 공백, 빈 줄이 보존된다. 스크립트가 없으면 버튼은 숨겨진 채 남는다. 복사에 실패하면 버튼과 상태 영역이 실패와 재시도를 알린다.

파일 이름이 꼭 필요할 때만 정보 문자열에 `filename=이름` 또는 `filename="공백 있는 이름"`을 덧붙이면 언어 이름 옆에 `TypeScript · main.ts`로 표시한다. 코드를 서버에서 실행하지 않는다.

안쪽 펜스를 보여 줄 때는 바깥 펜스를 더 길게 쓴다. ` ```ui:이름 ` 구성 요소와 안쪽 코드 블록도 같은 규칙을 따른다.

## 검증

`npm run check:product`는 CommonMark·GFM 구성 요소, 확장 문법, URL·HTML 이스케이프, plaintext 대체, 모든 등록 언어와 별칭, 복사 원문과 클라이언트 성공·실패, 제목·각주 ID 충돌, 피드와 상세 구조, 예시 글의 코드 블록 원문 왕복, 테마 토큰이 만드는 본문 치수, 수식 이스케이프·오류 복구·신뢰 차단, 도표 원문 보존과 ID, 수식·도표 자산의 페이지별 선택, 도표 렌더러의 보안 설정과 로더 상태 전환, 구성 블록의 중첩 구조·속성 검사·오류 위치·인라인 이스케이프·ID 중복(`directives.test.mjs`)을 확인한다. 브라우저에서 보이는 모양은 이 시험이 보장하지 않으며 해당 URL에서 직접 확인한다.
