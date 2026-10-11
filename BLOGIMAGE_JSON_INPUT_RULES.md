# BlogImage JSON 생성 규칙

이 문서는 GPT가 BlogImage 렌더러에서 유효한 JSON을 생성하기 위한 입력 규칙이다.

## 1. 가장 중요한 출력 원칙

1. 반드시 유효한 JSON 객체 하나만 출력한다.
2. JSON 앞뒤에 설명, 인사말, 주석, Markdown 코드 블록 표시를 붙이지 않는다.
3. JSON에는 주석, 후행 쉼표, 작은따옴표를 사용하지 않는다.
4. 키와 문자열에는 JSON 표준 큰따옴표 `"`를 사용한다.
5. 단일 이미지와 시리즈 스키마를 혼합하지 않는다.
6. 필드명, 카테고리, 테마, 역할, 레이아웃, 아이콘 토큰의 대소문자와 문자를 정확히 지킨다.
7. 사용자가 제공한 문구를 임의로 수정·요약·보완하지 않는다.
8. 사용자가 지정하지 않은 카테고리·테마·아이콘을 추측하지 않는다.
9. 아이콘이 불필요하거나 확실하지 않으면 2.1의 선택 필드 `icon`을 생략한다.
10. 아래에 정의되지 않은 임의 필드는 출력하지 않는다.
11. 문자열 대신 숫자·불리언·`null`을 넣지 않는다.
12. 배열이어야 하는 필드를 단일 문자열로 출력하지 않는다.

버전과 작업은 다음 세 조합만 사용한다.

| 용도 | `schema_version` | `task` |
|---|---:|---|
| 단일 대표이미지 1장 | `"1.0"` | `"render_single"` |
| 기존 방식 시리즈 3~5장 | `"2.0"` | `"render_series"` |
| 테마형 시리즈 3~5장 | `"2.1"` | `"render_series"` |

## 2. JSON 1.0 단일 대표이미지

### 정확한 최상위 구조

다음 7개 필드를 사용한다.

```json
{
  "schema_version": "1.0",
  "task": "render_single",
  "post_title": "블로그 게시물 제목",
  "large_category": "투자",
  "small_category": "인사이트",
  "cover_title": ["첫 번째 줄", "두 번째 줄"],
  "subtitle": ["첫 번째 줄", "두 번째 줄"]
}
```

### `schema_version`

- 반드시 문자열 `"1.0"`이다.
- `1.0`, `"1"`, `"2.0"` 등은 허용하지 않는다.

### `task`

- 반드시 문자열 `"render_single"`이다.
- 오탈자 `render_singe`나 `"render_series"`는 허용하지 않는다.

### `post_title`

- 비어 있지 않은 문자열이어야 한다.
- 앞뒤 공백은 렌더러가 제거하지만 처음부터 공백 없이 출력한다.
- 단일 이미지의 실제 PNG 파일명은 `post_title`이 아니라 `cover_title`을 기준으로 생성된다.

### `large_category`, `small_category`

다음 조합만 허용한다.

| `large_category` | 허용 `small_category` |
|---|---|
| `투자` | `투자기초`, `인사이트`, `투자전략`, `기업분석`, `매크로분석`, `센티먼트분석`, `기술적분석` |
| `CPA` | `꿀팁`, `수험자료`, `정보` |
| `IT` | `AI뉴스`, `AI활용`, `프로젝트` |
| `스포츠` | `농구`, `축구` |
| `남수단` | `도감` |
| `기록` | `일상`, `건강`, `이슈`, `독서`, `생각` |

추가 규칙:

- `머무름`은 텍스트형 이미지 생성 대상이 아니므로 사용할 수 없다.
- 대분류와 소분류를 교차 조합하면 안 된다.
- 예를 들어 `large_category: "IT"`에 `small_category: "정보"`는 잘못된 조합이다.
- 단일 입력에는 `theme`과 `icon`을 넣지 않는다. 대분류·소분류를 바탕으로 렌더러가 자동 선택한다.

### `cover_title`

- 문자열 1개 또는 2개의 배열이어야 한다.
- 각 배열 항목은 이미지에서 정확히 한 줄이 된다.
- 빈 문자열을 사용할 수 없다.
- 한 항목 안에 `\n`, `\r`, 실제 줄바꿈 또는 `|`를 넣을 수 없다.
- 줄바꿈은 배열 항목을 나누는 방식으로만 지정한다.
- 세 줄 이상은 허용하지 않는다.
- 명시적인 글자 수 상한은 없지만 최소 글자 크기에서도 영역을 넘으면 렌더링이 실패한다.
- GPT가 렌더링을 통과시키기 위해 사용자의 문구를 임의로 축약해서는 안 된다.

올바른 예:

```json
"cover_title": ["회계사 채용난", "정말 AI 때문일까?"]
```

잘못된 예:

```json
"cover_title": "회계사 채용난"
```

```json
"cover_title": ["회계사 채용난|정말 AI 때문일까?"]
```

```json
"cover_title": ["첫 줄", "둘째 줄", "셋째 줄"]
```

### `subtitle`

`cover_title`과 동일한 구조 규칙을 사용한다.

- 문자열 1~2개의 배열
- 각 항목은 비어 있지 않은 한 줄
- `|`, `\r`, `\n`, 실제 줄바꿈 금지

### 단일 이미지의 파일명과 충돌

- `cover_title`의 1~2줄을 공백으로 연결해 PNG 파일명을 만든다.
- `.png`가 자동으로 붙는다.
- `/ \ : * ? " < > |` 같은 문자는 `_`로 바뀐다.
- 같은 결과 파일이 이미 존재하면 덮어쓰지 않고 실패한다.

## 3. JSON 2.0 및 2.1 시리즈 공통 규칙

### JSON 2.0 최상위 구조

```json
{
  "schema_version": "2.0",
  "task": "render_series",
  "post_title": "게시물 제목",
  "large_category": "투자",
  "small_category": "인사이트",
  "canvas": {
    "width": 1080,
    "height": 1080
  },
  "cards": []
}
```

2.0에는 `theme`이나 카드별 `icon`을 출력하지 않는다.

### JSON 2.1 최상위 구조

```json
{
  "schema_version": "2.1",
  "task": "render_series",
  "theme": "jagak",
  "post_title": "게시물 제목",
  "large_category": "투자",
  "small_category": "인사이트",
  "canvas": {
    "width": 1080,
    "height": 1080
  },
  "cards": []
}
```

2.1에서는 `theme`이 필수다.

### 시리즈 문자열 공통 규칙

모든 문자열 필드에 다음 규칙이 적용된다.

- 비어 있으면 안 된다.
- 앞뒤 공백이 있으면 검증 실패한다.
- 탭, 줄바꿈 등 제어문자를 넣으면 안 된다.
- 배열형 문구에는 `|`, `\r`, `\n`을 넣으면 안 된다.
- 한 줄마다 별도의 배열 항목을 사용한다.
- 필드명과 허용 토큰의 대소문자를 변경하지 않는다.
- 글자 수는 JavaScript의 Unicode 코드 포인트 기준으로 계산한다.

### `post_title`

- 비어 있지 않은 문자열이어야 한다.
- 앞뒤 공백 및 제어문자를 넣지 않는다.
- 출력 폴더 이름의 원본으로 사용된다.
- `/ \ : * ? " < > |` 등은 폴더명 생성 과정에서 정리되거나 `" - "`로 치환된다.
- 폴더명은 최대 80자로 정리된다.
- 안전하게 사용하려면 한글·영문·숫자·일반 공백과 통상적인 문장부호 위주로 작성한다.
- 정제 결과가 빈 문자열이 되는 제목은 사용할 수 없다.
- 같은 정제 결과의 출력 폴더가 이미 존재하면 덮어쓰지 않고 실패한다.

### `canvas`

다음 값과 자료형이 정확해야 한다.

```json
"canvas": {
  "width": 1080,
  "height": 1080
}
```

- `"1080"`처럼 문자열로 출력하면 안 된다.
- 다른 크기는 허용하지 않는다.

### `cards`

- 정확히 3~5개의 카드 객체 배열이어야 한다.
- 2장 이하 또는 6장 이상은 허용하지 않는다.
- 배열 순서가 곧 카드 순서다.
- 첫 번째 카드의 `role`은 반드시 `"cover"`이다.
- 두 번째 카드의 `role`은 반드시 `"summary"`이다.
- 마지막 카드의 `role`은 반드시 `"conclusion"`이다.
- 중간 카드 역할은 허용 목록에서 선택할 수 있으며 반복도 기술적으로 가능하다.

## 4. 모든 카드의 공통 필드

모든 카드에는 다음 필드가 필요하다.

```json
{
  "card_no": 1,
  "role": "cover",
  "layout": "cover",
  "image_name": "01_cover.png",
  "insert_token": "[[IMAGE_01:COVER:01_cover.png]]",
  "title": ["첫 번째 줄", "두 번째 줄"]
}
```

### `card_no`

- JSON 숫자형 정수여야 한다.
- 문자열 `"1"`은 안 된다.
- 배열 순서에 맞춰 1부터 연속되어야 한다.
- 첫 카드 `1`, 둘째 카드 `2`, 셋째 카드 `3` 형식이다.
- 번호 누락, 중복, 0, 음수, 소수는 허용하지 않는다.

### `role`

허용값은 다음 12개다.

```text
cover
summary
key_point
comparison
process
cause_effect
pros_cons
impact
risk
numbers
checklist
conclusion
```

역할과 레이아웃은 검증상 일대일 고정은 아니지만 의미가 맞는 조합을 사용해야 한다. 일반적으로 다음 조합을 권장한다.

- `cover` → `cover`
- `summary` → `bullet_3` 또는 `numbers`
- `comparison`, `pros_cons` → `compare_2col`
- `process` → `process_4`
- `cause_effect` → `cause_effect`
- `numbers` → `numbers`
- `conclusion` → `conclusion`

### `layout`

허용값은 다음 7개다.

```text
cover
bullet_3
compare_2col
process_4
cause_effect
numbers
conclusion
```

각 레이아웃에는 아래에서 정한 전용 필드를 반드시 사용한다.

### `image_name`

- 비어 있지 않은 문자열이어야 한다.
- 앞뒤 공백을 넣지 않는다.
- 카드마다 고유해야 한다.
- 반드시 정확히 소문자 `.png`로 끝나야 한다.
- `.PNG`, `.jpg`, 확장자 없음은 허용하지 않는다.
- 파일명만 입력하고 경로는 입력하지 않는다.
- `/`, `\`, `..`, 절대경로, 드라이브 경로를 사용할 수 없다.
- `< > : " | ? *`를 사용할 수 없다.
- 권장 형식은 `{두 자리 번호}_{role 또는 layout}.png`이다.

예:

```text
01_cover.png
02_summary.png
03_comparison.png
04_conclusion.png
```

### `insert_token`

다음 공식으로 정확히 생성한다.

```text
[[IMAGE_{두 자리 card_no}:{role의 대문자 변환}:{image_name}]]
```

예:

```json
{
  "card_no": 3,
  "role": "cause_effect",
  "image_name": "03_cause_effect.png",
  "insert_token": "[[IMAGE_03:CAUSE_EFFECT:03_cause_effect.png]]"
}
```

주의 사항:

- `card_no`는 두 자리로 만든다: `01`~`05`.
- `role`은 정확히 대문자로 바꾼다.
- 밑줄은 유지한다: `key_point` → `KEY_POINT`.
- `image_name`은 카드의 실제 값과 글자 하나까지 같아야 한다.
- 공백을 추가하면 안 된다.
- 괄호 수와 콜론 위치가 정확해야 한다.

### `title`

- 모든 카드에서 필수다.
- 문자열 1~2개의 배열이어야 한다.
- 각 항목은 최대 22자다.
- 각 항목에 `|`, 줄바꿈, 제어문자를 넣지 않는다.
- 앞뒤 공백을 넣지 않는다.

## 5. 레이아웃별 필수 필드와 길이 제한

| `layout` | 필수 데이터 |
|---|---|
| `cover` | `subtitle`: 1~2개, 각 26자 이하 |
| `bullet_3` | `items`: 정확히 3개, 각 32자 이하 |
| `compare_2col` | `left`, `right` 객체 |
| `process_4` | `steps`: 3~4개, 각 28자 이하 |
| `cause_effect` | `causes`: 2~3개, `effects`: 2~3개, 각각 28자 이하 |
| `numbers` | `numbers`: 객체 1~3개 |
| `conclusion` | `body` 또는 `items` 중 정확히 하나 |

### `cover`

```json
{
  "layout": "cover",
  "title": ["제목 첫 줄", "제목 둘째 줄"],
  "subtitle": ["부제 첫 줄", "부제 둘째 줄"]
}
```

- `subtitle`: 1~2개
- 각 항목 최대 26자

### `bullet_3`

```json
{
  "layout": "bullet_3",
  "title": ["핵심 요약"],
  "items": ["첫 번째 항목", "두 번째 항목", "세 번째 항목"]
}
```

- `items`: 정확히 3개
- 각 항목 최대 32자

### `compare_2col`

```json
{
  "layout": "compare_2col",
  "title": ["두 대상을 비교합니다"],
  "left": {
    "label": "왼쪽 대상",
    "items": ["왼쪽 항목 1", "왼쪽 항목 2"]
  },
  "right": {
    "label": "오른쪽 대상",
    "items": ["오른쪽 항목 1", "오른쪽 항목 2"]
  }
}
```

- `left`, `right`는 배열이 아니라 객체여야 한다.
- 각 객체에는 `label`, `items`가 필요하다.
- `label`: 최대 16자
- `items`: 2~3개
- 각 `items` 항목: 최대 26자

### `process_4`

```json
{
  "layout": "process_4",
  "title": ["확인하는 순서"],
  "steps": ["첫 단계", "둘째 단계", "셋째 단계", "넷째 단계"]
}
```

- `steps`: 3~4개
- 각 항목 최대 28자

### `cause_effect`

```json
{
  "layout": "cause_effect",
  "title": ["원인과 결과"],
  "causes": ["첫 번째 원인", "두 번째 원인"],
  "effects": ["첫 번째 결과", "두 번째 결과"]
}
```

- `causes`: 2~3개
- `effects`: 2~3개
- 각 항목 최대 28자

### `numbers`

```json
{
  "layout": "numbers",
  "title": ["숫자로 보는 변화"],
  "numbers": [
    {
      "value": "40%",
      "label": "변화 비율"
    },
    {
      "value": "3년",
      "label": "관찰 기간"
    }
  ]
}
```

- `numbers`: 1~3개의 객체
- 각 객체에 `value`, `label` 필수
- `value`: 비어 있지 않은 문자열, 최대 14자
- `label`: 비어 있지 않은 문자열, 최대 24자
- `value`는 JSON 숫자가 아니라 문자열이어야 한다.

### `conclusion`

두 형식 중 정확히 하나만 사용한다.

본문형:

```json
{
  "layout": "conclusion",
  "title": ["마지막 결론"],
  "body": ["결론 첫 줄", "결론 둘째 줄"]
}
```

- `body`: 1~2개
- 각 항목 최대 34자
- `items`를 함께 넣으면 안 된다.

목록형:

```json
{
  "layout": "conclusion",
  "title": ["마지막 결론"],
  "items": ["첫 번째 결론", "두 번째 결론", "세 번째 결론"]
}
```

- `items`: 정확히 3개
- 각 항목 최대 30자
- `body`를 함께 넣으면 안 된다.

## 6. JSON 2.0 카테고리

2.0은 단일 1.0과 같은 기존 카테고리 조합을 사용한다.

| 대분류 | 허용 소분류 |
|---|---|
| `투자` | `투자기초`, `인사이트`, `투자전략`, `기업분석`, `매크로분석`, `센티먼트분석`, `기술적분석` |
| `CPA` | `꿀팁`, `수험자료`, `정보` |
| `IT` | `AI뉴스`, `AI활용`, `프로젝트` |
| `스포츠` | `농구`, `축구` |
| `남수단` | `도감` |
| `기록` | `일상`, `건강`, `이슈`, `독서`, `생각` |

- `머무름`은 허용하지 않는다.
- 2.0에는 `theme`을 넣지 않는다.
- 2.0 카드에는 `icon`을 넣지 않는다.

## 7. JSON 2.1 테마와 카테고리

2.1의 `theme`은 다음 세 값 중 하나다.

```text
insurance
jagak
yeobaek
```

테마별 카테고리를 섞으면 안 된다.

### `insurance`

```json
"theme": "insurance",
"large_category": "보험"
```

허용 소분류:

| 소분류 | 기본 cover 아이콘 |
|---|---|
| `보험기초` | `book-open` |
| `보험이야기` | `message-circle` |
| `보장정보` | `shield-check` |
| `보험점검` | `clipboard-check` |
| `아카이브` | `archive` |

### `jagak`

| 대분류 | 허용 소분류 |
|---|---|
| `투자` | `투자기초`, `인사이트`, `시장분석`, `기업분석`, `투자전략` |
| `부동산` | `부동산기초`, `인사이트`, `시장분석`, `지역분석`, `부동산제도`, `청약·분양` |
| `CPA` | `수험생활`, `취업·커리어`, `업계·실무` |
| `IT` | `TechNews`, `AI·Coding`, `Projects` |

주의:

- `TechNews`, `Projects`의 영문 대소문자를 그대로 지킨다.
- 가운데점 `·`을 일반 마침표나 하이픈으로 바꾸지 않는다.
- 2.0의 `매크로분석`, `정보`, `AI뉴스`를 2.1 jagak에 사용하면 안 된다.

### `yeobaek`

| 대분류 | 허용 소분류 |
|---|---|
| `사회·문화` | `사회이슈`, `교육`, `인구·세대`, `문화·생활` |
| `정치·정책` | `정치`, `정책`, `선거`, `여론·쟁점` |
| `민생·경제` | `민생`, `노동·고용`, `복지·지원`, `생활경제` |
| `법·제도` | `사건·수사`, `재판·판결`, `법률·제도`, `권리·분쟁` |
| `국제·정세` | `국제정치`, `전쟁·안보`, `국제경제`, `해외이슈` |
| `스포츠` | `축구`, `야구`, `농구`, `E스포츠`, `기타스포츠` |
| `연예·콘텐츠` | `연예이슈`, `방송·OTT`, `영화·공연`, `K팝·음악` |

`연예·콘텐츠` 확장 후에도 JSON schema version은 `2.1`이며 기존 schema, 카드 수, role, layout 제한은 변경되지 않는다. `연예/콘텐츠`, `연예`, `연예계`, `방송/OTT`, `K팝/음악`은 JSON 허용값이 아닌 alias이므로 입력에 사용하지 않는다.

yeobaek 공통 색상은 background `#F8F8F6`, surface `#FFFFFF`, main text `#242424`, sub text `#707070`, border `#E1E1DE`이다. 대분류 palette는 다음과 같다.

| 대분류 | primary | soft |
|---|---|---|
| `사회·문화` | `#2F7D73` | `#E7F1EE` |
| `정치·정책` | `#5D4E86` | `#EEEAF5` |
| `민생·경제` | `#9A7425` | `#F5EFD9` |
| `법·제도` | `#813F4A` | `#F4E8EA` |
| `국제·정세` | `#356A92` | `#E7EEF4` |
| `스포츠` | `#C45A2A` | `#F7E9E2` |
| `연예·콘텐츠` | `#9B5C7C` | `#F4EAF0` |

## 8. JSON 2.1 카드 아이콘

`icon`은 카드별 선택 필드다. 확실하지 않으면 생략한다.

생략 시:

- cover는 선택된 소분류의 기본 아이콘을 사용한다.
- 나머지 카드는 역할별 fallback 아이콘을 사용한다.
- fallback이 없는 역할은 아이콘 없이 렌더링될 수 있다.

공통 역할 fallback:

| 역할 | 아이콘 |
|---|---|
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

명시적인 `icon`은 선택한 테마의 다음 집합 안에 있어야 한다.

- `insurance`: insurance 카테고리 아이콘 + 공통 역할 아이콘
- `jagak`: jagak 카테고리 아이콘 + 공통 역할 아이콘
- `yeobaek`: yeobaek 카테고리 아이콘 + 공통 역할 아이콘

yeobaek `연예·콘텐츠`의 category icon은 다음과 같다.

| 소분류 | 기본 cover 아이콘 |
|---|---|
| `연예이슈` | `newspaper` |
| `방송·OTT` | `tv` |
| `영화·공연` | `clapperboard` |
| `K팝·음악` | `music-2` |

다른 테마의 아이콘을 가져오거나 임의의 Lucide 아이콘명을 만들어서는 안 된다.

## 9. GPT가 출력 전에 수행해야 하는 자체 검증

JSON을 출력하기 전에 내부적으로 다음을 검사한다.

1. 루트가 객체 하나인지 확인한다.
2. 버전과 `task` 조합이 정확한지 확인한다.
3. 필요한 필드가 전부 있는지 확인한다.
4. 카테고리 pair가 정확한지 확인한다.
5. 2.1이면 `theme`과 카테고리가 일치하는지 확인한다.
6. 시리즈 카드가 3~5장인지 확인한다.
7. `card_no`가 배열 순서대로 1부터 연속인지 확인한다.
8. 첫 role이 `cover`, 둘째가 `summary`, 마지막이 `conclusion`인지 확인한다.
9. 모든 `image_name`이 고유하고 `.png`로 끝나는지 확인한다.
10. 모든 `insert_token`을 카드 정보로 다시 계산해 정확히 일치하는지 확인한다.
11. 모든 카드에 `title` 1~2줄이 있는지 확인한다.
12. 레이아웃 전용 필드의 배열 개수와 최대 글자 수를 확인한다.
13. `conclusion`에 `body`와 `items`가 동시에 있지 않은지 확인한다.
14. 배열 항목 안에 `|`, 줄바꿈, 앞뒤 공백이 없는지 확인한다.
15. 정의되지 않은 필드와 임의 토큰을 제거한다.
16. 최종 응답이 설명 없는 JSON 객체 하나인지 확인한다.

현재 구현은 일부 알 수 없는 추가 필드를 무시할 수 있지만 그 동작에 의존하지 말고 위에서 정의한 필드만 출력한다.

## 10. 실제 구현 기준 파일

- 단일 입력 검증: `src/singleInputSchema.ts`
- 시리즈 입력 검증: `src/seriesInputSchema.ts`
- 기존 카테고리 매핑: `src/categoryMappings.ts`
- JSON 2.1 테마·카테고리·아이콘 매핑: `src/themes.ts`
- 시리즈 출력 경로 정규화: `src/seriesPaths.ts`
- 공식 입력 예제: `samples/`
