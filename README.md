# Naver blog cover renderer

XLSX/CSV 대량 생성, JSON 1.0 단일 대표이미지, JSON 2.0 요약이미지 시리즈와 JSON 2.1 테마형 시리즈를 지원하는 PNG 렌더러입니다. 기존 단일·대량 이미지는 1200×1200, 시리즈는 1080×1080이며 입력 문구를 수정하거나 새로 만들지 않습니다.

## 요구 사항

- Node.js 20 이상
- npm

## 처음 한 번 설치

```bash
npm install
npx playwright install chromium
```

렌더러는 Playwright가 내려받은 Chromium을 사용합니다. 현재 macOS용 Playwright Chromium이 운영체제를 지원하지 않지만 Google Chrome, Chromium 또는 Microsoft Edge가 설치되어 있으면 해당 브라우저를 자동으로 사용합니다.

## 다른 Mac으로 이전하기

macOS 앱은 macOS 13 이상, Node.js 20 이상과 npm, Xcode Command Line Tools가 필요합니다. Command Line Tools가 없으면 `xcode-select --install`을 실행하고 설치를 완료하세요. 터미널에서 `node --version`과 `npm --version`이 정상적으로 실행되어야 합니다.

새 Mac의 터미널에서 다음을 실행합니다.

```bash
git clone https://github.com/hotcoldwater/blogimage.git
cd blogimage
npm ci
npx playwright install chromium
npm run build:app
open ./BlogImage.app
```

`npm ci`는 `package-lock.json`에 고정된 버전으로 라이브러리를 설치합니다. Chromium 설치가 운영체제 지원 문제로 실패하면 Google Chrome, Chromium 또는 Microsoft Edge를 `/Applications`에 설치한 뒤 앱 빌드를 진행할 수 있습니다.

`BlogImage.app`은 새 Mac에서 빌드하여 생성합니다. Intel Mac과 Apple Silicon Mac 모두 해당 Mac에서 빌드하며, 생성된 앱은 `package.json`이 있는 프로젝트 루트에 그대로 두세요. 앱만 응용 프로그램 폴더로 옮기면 렌더러를 찾지 못합니다. Dock에는 프로젝트 폴더의 앱을 등록할 수 있습니다.

기존 Mac과 같은 디자인으로 생성하려면 기존에 사용하던 Pretendard 글꼴도 새 Mac의 서체 관리자에 설치하세요. 글꼴 파일은 저장소에 포함하지 않으며, 설치하지 않으면 시스템의 다른 글꼴로 대체되어 줄바꿈이나 배치가 달라질 수 있습니다.

소스 코드, 템플릿, 아이콘, JSON 샘플과 XLSX 입력 파일은 저장소에 포함합니다. `node_modules/`, 빌드된 `BlogImage.app`, 생성 이미지(`output/`, `test-output/`)와 실행 보고서는 포함하지 않습니다. 이전에 만든 이미지도 필요하면 기존 Mac의 `output/` 폴더를 별도로 복사하세요.

## 가장 간단한 단일 생성 방법

### BlogImage macOS 앱

프로젝트 루트의 `BlogImage.app`을 더블클릭한 뒤 JSON을 입력하고 `생성` 버튼을 누릅니다. 앱은 `render:single` 명령을 호출하므로 CLI와 같은 검증, 테마·아이콘 매핑, 강제 줄바꿈, 자동 글자 크기 조정과 오버플로 차단을 사용합니다. 2.0/2.1 시리즈가 생성되면 이전·다음 버튼으로 카드를 이동할 수 있고 `Finder에서 보기`는 현재 카드를 엽니다.

앱을 다시 빌드하려면 다음을 실행합니다.

```bash
npm run build:app
```

`BlogImage.app`은 프로젝트의 렌더러와 `node_modules`를 사용하므로 프로젝트 루트에 둔 상태로 실행해야 합니다.
앱 아이콘 원본과 macOS 아이콘 번들은 각각 `macos/AppIcon.png`, `macos/AppIcon.icns`에서 관리합니다.

### 클립보드와 명령행

1. 블로그 작성 챗봇이 출력한 JSON 코드블록의 내용을 복사합니다.
2. 프로젝트 루트에서 실행합니다.

```bash
npm run render:clipboard
```

또는 Finder에서 `대표이미지_생성.command`를 더블클릭합니다. 성공하면 `output/` 폴더가 열립니다.

3. 생성된 PNG를 확인해 네이버 블로그에 첨부합니다.

### 단일 입력 JSON

```json
{
  "schema_version": "1.0",
  "task": "render_single",
  "post_title": "신입 공인회계사 채용난 | 선발 인원과 빅4 채용으로 본 진짜 원인",
  "large_category": "CPA",
  "small_category": "정보",
  "cover_title": ["회계사 채용난", "정말 AI 때문일까?"],
  "subtitle": ["선발 인원과 빅4 채용으로", "본 진짜 원인"]
}
```

`cover_title`과 `subtitle`은 각각 문자열 1~2개로 구성합니다. 배열 항목 하나가 이미지 한 줄이며, 렌더러는 줄을 합치거나 위치를 바꾸지 않습니다.

JSON 파일 입력:

```bash
npm run render:single -- --input ./single-input.json
```

표준입력과 macOS 클립보드 입력:

```bash
cat ./single-input.json | npm run render:single -- --stdin
pbpaste | npm run render:single -- --stdin
```

JSON 문자열 직접 입력도 지원합니다.

```bash
npm run render:single -- --json '{"schema_version":"1.0","task":"render_single","post_title":"투자 심리","large_category":"투자","small_category":"인사이트","cover_title":["수익보다 먼저","뇌가 망가진다"],"subtitle":["전망이론으로 보는","투자 심리"]}'
```

파일명은 `cover_title`의 두 줄을 공백으로 연결한 뒤 기존 PNG 파일명 정규화 함수를 적용합니다. 한글과 공백은 유지합니다. 같은 파일이 있으면 단일 생성기는 덮어쓰지 않고 오류를 냅니다.

## JSON 1.0, 2.0, 2.1

| 구분 | JSON 1.0 | JSON 2.0 | JSON 2.1 |
| --- | --- | --- | --- |
| 작업 | `render_single` | `render_series` | `render_series` |
| 결과 | 대표이미지 1장 | 대표이미지 포함 3~5장 | 테마형 시리즈 3~5장 |
| 크기 | 1200×1200 | 1080×1080 | 1080×1080 |
| 문구 | `cover_title`, `subtitle` | `cards`의 레이아웃별 필드 | 2.0 필드 + `theme`, 카드별 `icon` |
| 저장 | `output/{theme}/{제목}.png` | `output/{정제된 post_title}/{image_name}` | 2.0과 같음 |

세 버전 모두 같은 `npm run render:single` 명령, stdin, 클립보드, macOS 앱을 사용합니다. 렌더러가 `schema_version`과 `task`로 작업을 구분합니다. 1.0과 2.0의 검증·카테고리 테마·출력 경로는 변경하지 않았으며, 2.0 입력에 `theme`이나 `icon`이 없어도 기존 결과를 유지합니다.

### JSON 2.0 공통 필드

최상위 필수 필드는 다음과 같습니다.

- `schema_version`: 정확히 `"2.0"`
- `task`: 정확히 `"render_series"`
- `post_title`: 출력 폴더 이름의 원본이 되는 비어 있지 않은 문자열
- `large_category`, `small_category`: 기존 카테고리 표의 정확한 조합
- `canvas`: 정확히 `{ "width": 1080, "height": 1080 }`
- `cards`: 순서대로 렌더링할 3~5개 카드

모든 카드는 `card_no`, `role`, `layout`, `image_name`, `insert_token`, `title`이 필요합니다. `card_no`는 1부터 빠짐없이 연속이어야 하고 첫 역할은 `cover`, 둘째 역할은 `summary`, 마지막 역할은 `conclusion`이어야 합니다. 역할은 글의 의미적 분류이고 레이아웃은 화면 배치이므로 일대일로 고정되지 않습니다.

허용 역할:

```text
cover, summary, key_point, comparison, process, cause_effect,
pros_cons, impact, risk, numbers, checklist, conclusion
```

지원 레이아웃과 추가 필드:

| 레이아웃 | 추가 필드와 개수 |
| --- | --- |
| `cover` | `subtitle`: 1~2줄 |
| `bullet_3` | `items`: 정확히 3개 |
| `compare_2col` | `left`, `right`: 각각 `label`과 `items` 2~3개 |
| `process_4` | `steps`: 문자열 3~4개 |
| `cause_effect` | `causes`, `effects`: 각각 2~3개 |
| `numbers` | `numbers`: `{ "value", "label" }` 객체 1~3개 |
| `conclusion` | `body` 1~2개 또는 `items` 3개 중 정확히 하나 |

`title`, `subtitle`, `body`의 배열 항목은 의도한 한 줄입니다. 목록 문구는 영역 안에서 한국어 단위로 자동 줄바꿈하고 긴 영문·숫자는 안전하게 줄바꿈합니다. 필드별 개수·문자 길이 제한과 브라우저 실측 최소 글자 크기를 모두 통과해야 하며, 넘치면 내용을 자르지 않고 카드 번호·레이아웃·필드·현재 측정값·허용값을 출력합니다.

### 토큰과 파일명

토큰은 카드 정보와 정확히 일치해야 합니다.

```text
[[IMAGE_{두 자리 card_no}:{대문자 role}:{image_name}]]
[[IMAGE_03:COMPARISON:03_comparison.png]]
```

`image_name`은 카드마다 고유한 `.png` 파일명이어야 합니다. 절대경로, `/`, `\\`, `..`, Windows 금지문자는 허용하지 않으므로 결과가 출력 폴더 밖에 기록되지 않습니다.

### 출력 폴더와 충돌 정책

시리즈는 다음처럼 저장합니다.

```text
output/
└── ISA 개편안 - 일본은 키우는데 한국은 왜 거꾸로 가나/
    ├── 01_cover.png
    ├── 02_summary.png
    └── 03_conclusion.png
```

`post_title`의 `/ \\ : * ? " < > |`와 제어문자를 제거·치환하고, 공백과 끝 마침표를 정리하며 폴더명은 80자로 제한합니다. 모든 카드를 임시 폴더에 먼저 만든 뒤 전부 성공할 때만 최종 폴더로 이동합니다. 하나라도 실패하면 임시 결과를 정리합니다. 같은 최종 폴더가 이미 있으면 기존 파일을 덮어쓰지 않고 오류를 내므로, 기존 폴더를 직접 정리하거나 `post_title`을 명시적으로 바꾼 뒤 다시 실행하세요.

### 시리즈 실행과 샘플

```bash
npm run render:single -- --input ./samples/series-3.json
npm run render:single -- --input ./samples/series-4.json
npm run render:single -- --input ./samples/series-5.json
cat ./samples/series-5.json | npm run render:single -- --stdin
```

`samples/single-v1.json`은 기존 1.0 예제입니다. 3·4·5장 샘플을 합치면 7개 레이아웃을 모두 확인할 수 있으며 자세한 매핑은 `samples/README.md`에 있습니다. CLI는 생성 예정 장수와 출력 폴더를 알리고, 각 카드의 순번·역할·레이아웃·파일명·성공 여부를 출력합니다.

검증 오류는 `잘못된 필드`, `현재 입력값`, `수정 방법` 순서로 표시합니다. 먼저 표시된 경로의 값과 개수 또는 토큰을 수정한 뒤 같은 명령을 다시 실행하세요. 알 수 없는 역할·레이아웃이나 카테고리를 임의 값으로 대체하지 않습니다.

### JSON 2.1 insurance theme

2.1은 2.0의 카드 개수, 역할 순서, 레이아웃별 데이터 구조, 토큰 및 파일명 규칙을 그대로 사용하고 테마와 아이콘만 추가합니다. 현재 지원하는 테마는 `insurance`, `jagak`, `yeobaek`입니다.

```json
{
  "schema_version": "2.1",
  "task": "render_series",
  "theme": "insurance",
  "post_title": "최종 제목",
  "large_category": "보험",
  "small_category": "보험기초",
  "canvas": { "width": 1080, "height": 1080 },
  "cards": []
}
```

`large_category`는 정확히 `보험`이어야 합니다. 허용 `small_category`와 cover fallback 아이콘은 다음과 같습니다.

| small_category | fallback icon |
| --- | --- |
| 보험기초 | `book-open` |
| 보험이야기 | `message-circle` |
| 보장정보 | `shield-check` |
| 보험점검 | `clipboard-check` |
| 아카이브 | `archive` |

카드의 `icon`은 선택 사항입니다. 지정하면 아래 whitelist에 포함돼야 하며, 생략하면 cover는 `small_category` 아이콘을, 나머지는 역할별 아이콘을 사용합니다. fallback이 없는 역할은 아이콘 없이 렌더링합니다.

```text
book-open, message-circle, shield-check, clipboard-check, archive,
list-checks, key-round, arrow-left-right, list-ordered, arrow-right,
scale, circle-dot, triangle-alert, calculator, circle-check
```

| role | fallback icon |
| --- | --- |
| `summary` | `list-checks` |
| `key_point` | `key-round` |
| `comparison` | `arrow-left-right` |
| `process` | `list-ordered` |
| `cause_effect` | `arrow-right` |
| `pros_cons` | `scale` |
| `impact` | `circle-dot` |
| `risk` | `triangle-alert` |
| `numbers` | `calculator` |
| `checklist` | `clipboard-check` |
| `conclusion` | `circle-check` |

insurance 팔레트는 테마 레지스트리에서 한 번만 관리합니다.

| token | color |
| --- | --- |
| `background` | `#FAFAF7` |
| `surface` | `#FFFFFF` |
| `primary` | `#263B55` |
| `secondary` | `#7894AE` |
| `soft` | `#EAF1F6` |
| `text` | `#34383D` |
| `muted` | `#747B84` |
| `border` | `#DDE3E8` |
| `conclusion_text` | `#FFFFFF` |

밝은 카드에는 warm white, white, soft blue만 사용하며 outline 아이콘과 넓은 여백을 유지합니다. cover와 conclusion에는 `이은옥의 보험이야기` 브랜드 라벨이 표시되고, conclusion만 전체 네이비 배경과 흰 텍스트로 마무리합니다. `compare_2col`의 `left`와 `right`는 2.0과 동일하게 `{ "label", "items" }` 객체여야 하며 구형 배열형은 허용하지 않습니다.

완성 예제와 3·5장 회귀 예제:

```bash
npm run render:single -- --input ./samples/insurance-series-4.json
npm run render:single -- --input ./samples/insurance-series-3.json
npm run render:single -- --input ./samples/insurance-series-5.json
```

### JSON 2.1 jagak theme

자각 5.0 신규 입력은 `theme: "jagak"`을 사용합니다. 기존 JSON 2.0 카테고리는 migration하지 않으며, 2.1 jagak에서만 아래 `(large_category, small_category)` 조합을 검증합니다.

```json
{
  "schema_version": "2.1",
  "task": "render_series",
  "theme": "jagak",
  "post_title": "최종 제목",
  "large_category": "부동산",
  "small_category": "부동산제도",
  "canvas": { "width": 1080, "height": 1080 },
  "cards": []
}
```

| 대분류 | 허용 소분류와 cover fallback icon |
| --- | --- |
| 투자 | 투자기초 `book-open`, 인사이트 `key-round`, 시장분석 `chart-line`, 기업분석 `building-2`, 투자전략 `target` |
| 부동산 | 부동산기초 `house`, 인사이트 `key-round`, 시장분석 `chart-line`, 지역분석 `map-pin`, 부동산제도 `scale`, 청약·분양 `building` |
| CPA | 수험생활 `book-open`, 취업·커리어 `briefcase`, 업계·실무 `clipboard-check` |
| IT | TechNews `newspaper`, AI·Coding `code-2`, Projects `blocks` |

`인사이트`와 `시장분석`처럼 같은 소분류 이름이 있어도 대분류와의 pair로 검증하고 팔레트를 선택합니다. `매크로분석`, `정보`, `AI뉴스` 등 구형 명칭은 2.0 legacy 입력에서만 유지되며 2.1 jagak에서는 오류입니다.

| 대분류 | primary | secondary | soft |
| --- | --- | --- | --- |
| 투자 | `#062D5B` | `#FF6847` | `#E8EEF4` |
| 부동산 | `#B42318` | `#D65A4A` | `#FDECEA` |
| CPA | `#1F5A45` | `#8FB89B` | `#E8F0EC` |
| IT | `#B45309` | `#D97706` | `#FFF0DC` |

투자와 CPA의 primary/secondary는 기존 BlogImage 테마 값을 그대로 참조해 회귀 테스트합니다. shared background와 conclusion text도 기존 값 `#F7F2E9`, `#F6F1E8`을 유지합니다. 부동산은 editorial red, IT는 burnt orange를 사용합니다. 색상은 항상 `large_category`가 결정하며 JSON에서 직접 받지 않습니다.

카드 `icon`이 있으면 jagak whitelist 안에서 우선 사용합니다. 생략하면 cover는 위 category icon을, 나머지는 insurance와 같은 role fallback을 사용합니다. cover는 기존 자각의 상·하단 분할 구조를 유지하고, small category badge·outline icon·`자각: 기록의 온도` 브랜드 라벨을 적용합니다. conclusion은 해당 대분류 primary 배경으로 마무리합니다.

샘플 렌더:

```bash
npm run render:single -- --input ./samples/jagak-investment-series-3.json
npm run render:single -- --input ./samples/jagak-realestate-series-4.json
npm run render:single -- --input ./samples/jagak-cpa-series-5.json
npm run render:single -- --input ./samples/jagak-it-series-4.json
```

### JSON 2.1 yeobaek theme

네이버 블로그 「여백: 지금을 읽다」 카드 시리즈는 `theme: "yeobaek"`을 사용합니다. 색상은 JSON에서 받지 않고 `large_category`로 선택하며, `small_category`는 해당 대분류에 속한 값만 허용합니다. 2.1의 카드 수(3~5장), role 순서, layout별 필드, `image_name`, `insert_token`, `compare_2col` 객체 형식은 그대로 유지됩니다.

```json
{
  "schema_version": "2.1",
  "task": "render_series",
  "theme": "yeobaek",
  "post_title": "여백 스포츠 E스포츠 4장 예제",
  "large_category": "스포츠",
  "small_category": "E스포츠",
  "canvas": { "width": 1080, "height": 1080 },
  "cards": []
}
```

대분류별 허용 소분류와 cover fallback icon은 다음과 같습니다.

| 대분류 | 허용 소분류와 cover fallback icon |
| --- | --- |
| 사회·문화 | 사회이슈 `users-round`, 교육 `graduation-cap`, 인구·세대 `users`, 문화·생활 `sparkles` |
| 정치·정책 | 정치 `landmark`, 정책 `file-text`, 선거 `vote`, 여론·쟁점 `messages-square` |
| 민생·경제 | 민생 `wallet`, 노동·고용 `briefcase`, 복지·지원 `hand-heart`, 생활경제 `receipt` |
| 법·제도 | 사건·수사 `search`, 재판·판결 `gavel`, 법률·제도 `scale`, 권리·분쟁 `shield-check` |
| 국제·정세 | 국제정치 `globe-2`, 전쟁·안보 `shield`, 국제경제 `chart-no-axes-combined`, 해외이슈 `earth` |
| 스포츠 | 축구 `football`, 야구 `baseball`, 농구 `basketball`, E스포츠 `gamepad-2`, 기타스포츠 `medal` |
| 연예·콘텐츠 | 연예이슈 `newspaper`, 방송·OTT `tv`, 영화·공연 `clapperboard`, K팝·음악 `music-2` |

`연예·콘텐츠`를 포함한 yeobaek 입력도 JSON schema version `2.1`을 그대로 사용합니다. `연예/콘텐츠`, `연예`, `연예계`, `방송/OTT`, `K팝/음악` 같은 alias는 JSON 허용값이 아닙니다.

base 색상은 background `#F8F8F6`, surface `#FFFFFF`, main text `#242424`, sub text `#707070`, border `#E1E1DE`입니다. 대분류 accent palette는 아래처럼 고정됩니다.

| 대분류 | primary | soft |
| --- | --- | --- |
| 사회·문화 | `#2F7D73` | `#E7F1EE` |
| 정치·정책 | `#5D4E86` | `#EEEAF5` |
| 민생·경제 | `#9A7425` | `#F5EFD9` |
| 법·제도 | `#813F4A` | `#F4E8EA` |
| 국제·정세 | `#356A92` | `#E7EEF4` |
| 스포츠 | `#C45A2A` | `#F7E9E2` |
| 연예·콘텐츠 | `#9B5C7C` | `#F4EAF0` |

카드 `icon`을 명시하면 yeobaek whitelist 안에서 우선 사용합니다. 생략하면 cover는 위 category icon을, 나머지는 공통 role fallback(`list-checks`, `key-round`, `arrow-left-right`, `list-ordered`, `arrow-right`, `scale`, `circle-dot`, `triangle-alert`, `calculator`, `clipboard-check`, `circle-check`)을 사용합니다. `football`, `baseball`, `basketball`을 포함한 모든 아이콘은 `assets/icons/`의 monochrome `currentColor` SVG이며 런타임 네트워크 요청이 없습니다.

cover는 warm white 바탕, charcoal 제목, small category badge, category icon과 `여백: 지금을 읽다` 브랜드 라벨을 사용합니다. 중간 카드는 같은 대분류의 primary/soft/neutral만 사용하고, conclusion은 해당 primary 전체 배경과 흰 텍스트로 마무리합니다. 정치·정책은 red/blue 대립색이 아닌 deep purple을 사용합니다.

완성 샘플 렌더:

```bash
npm run render:single -- --input ./samples/yeobaek-sports-series-4.json
npm run render:single -- --input ./samples/yeobaek_entertainment_issue.json
npm run render:single -- --input ./samples/yeobaek_kpop_music.json
```

## 단일 생성 카테고리

| 대분류 | 테마 | 소분류와 아이콘 |
| --- | --- | --- |
| 투자 | `investment` | 투자기초 `lightbulb`, 인사이트 `brain`, 투자전략 `compass`, 기업분석 `file-search`, 매크로분석 `globe-2`, 센티먼트분석 `gauge`, 기술적분석 `chart-candlestick` |
| CPA | `cpa` | 꿀팁 `calculator`, 수험자료 `book-open`, 정보 `file-search` |
| IT | `it` | AI뉴스 `newspaper`, AI활용 `workflow`, 프로젝트 `folder-kanban` |
| 스포츠 | `sports` | 농구 `basketball`, 축구 `football` |
| 남수단 | `south-sudan` | 도감 `map` |
| 기록 | `record` | 일상 `notebook-pen`, 건강 `heart-pulse`, 이슈 `newspaper`, 독서 `book-open`, 생각 `brain` |

`머무름`은 실제 사진을 사용하므로 텍스트형 대표이미지를 생성하지 않습니다. 목록에 없는 대분류·소분류 조합은 임의 추측 없이 오류로 처리합니다.

## 대량 입력 파일

`.xlsx` 또는 `.csv` 파일은 먼저 `./input/`에서 찾고, 그곳에 하나도 없으면 프로젝트 루트에서 찾습니다. 발견한 모든 파일을 처리하며 XLSX는 첫 번째 워크시트를 사용합니다.

필수 열:

```text
id, post_title, post_url, large_category, small_category, cover_title,
subtitle, theme, icon, file_name, generation_status, upload_status, notes
```

렌더링에는 `id`, `large_category`, `small_category`, `cover_title`, `subtitle`, `theme`, `icon`, `file_name`을 사용합니다. `generation_status`, `upload_status`, `notes`는 변경하지 않습니다.

기존 `investment`, `cpa` 테마 색상은 그대로 유지되며 `it`, `sports`, `south-sudan`, `record` 테마가 추가되어 있습니다. 알 수 없는 대량 입력 테마는 기존처럼 `output/misc/`에 저장됩니다.

## 대량 생성 실행

먼저 입력과 문구 길이를 검사합니다.

```bash
npm run validate
```

전체 이미지를 생성합니다. 렌더링이 끝나면 갤러리도 자동으로 갱신됩니다.

```bash
npm run render
```

이미 생성된 결과로 갤러리만 다시 만듭니다.

```bash
npm run preview
```

타입 검사:

```bash
npm run typecheck
```

### 선택 인자

`render`는 `--input`, `--theme`, `--limit`, `--output-dir`를 지원합니다. `validate`는 `--input`을, `preview`는 기존 세 인자를 지원합니다. `npm run` 뒤 인자는 `--` 다음에 씁니다. `--output-dir`를 지정하면 이미지와 렌더 보고서를 해당 테스트/별도 폴더에 만들고 기본 갤러리와 보고서는 변경하지 않습니다.

```bash
npm run render -- --input ./input/투자_대표이미지_데이터.xlsx
npm run render -- --theme investment --limit 3
npm run render -- --input ./투자_대표이미지_데이터.xlsx --limit 1 --output-dir /tmp/blogimage-batch-test
npm run validate -- --input ./CPA_대표이미지_데이터.xlsx
npm run preview -- --theme cpa
```

기존 대량 입력의 `file_name` 규칙은 변경하지 않았습니다. `.png`가 없으면 자동으로 붙이고 폴더 경로가 포함되어 있어도 안전한 파일명만 사용합니다.

## 결과 위치

- 투자 이미지: `output/investment/`
- CPA 이미지: `output/cpa/`
- IT 이미지: `output/it/`
- 스포츠 이미지: `output/sports/`
- 남수단 이미지: `output/south-sudan/`
- 기록 이미지: `output/record/`
- JSON 2.0 시리즈: `output/{정제된 post_title}/`
- JSON 2.1 insurance 시리즈: `output/{정제된 post_title}/`
- JSON 2.1 jagak 시리즈: `output/{정제된 post_title}/`
- JSON 2.1 yeobaek 시리즈: `output/{정제된 post_title}/`
- 알 수 없는 테마: `output/misc/`
- 미리보기 갤러리: `preview/index.html`
- 입력 검증: `reports/validation.json`, `reports/validation.md`
- 렌더링 상세 및 실제 레이아웃 측정: `reports/render-report.json`
- 갤러리용 결과 목록: `reports/render-manifest.json`

## 디자인과 유지보수

- 기존 및 JSON 2.1 테마 색상·fallback: `src/themes.ts`
- 레이아웃/CSS: `src/styles.css`
- 시리즈 레이아웃/CSS: `src/renderSeriesCard.ts`, `src/seriesStyles.css`
- HTML 구조: `src/template.html`
- SVG 아이콘: `assets/icons/`
- 글자 크기는 정해진 최대 크기에서 시작해 강제 줄바꿈을 유지하면서 지정 영역에 들어가는 가장 큰 크기로 자동 조절됩니다.
- 검증의 길이 경고는 사전 휴리스틱이며, 렌더링 보고서의 `layout_warning_count`는 브라우저가 실제 요소 크기를 측정한 결과입니다.

단일 생성과 대량 생성은 `src/renderOne.ts`, `src/template.html`, `src/styles.css`의 동일한 핵심 렌더링 경로를 사용합니다. 최소 글자 크기에서도 문구가 넘치면 PNG를 만들지 않고 해당 영역과 측정값을 출력합니다.

문구를 수정할 때는 Excel을 원본으로 유지한 뒤 다시 렌더링하세요. 생성기가 문구를 요약하거나 보완하지 않습니다.
