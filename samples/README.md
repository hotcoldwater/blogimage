# 입력 샘플

- `single-v1.json`: 기존 JSON 1.0 단일 이미지
- `series-3.json`: 3장 시리즈와 `cover`, `bullet_3`, `conclusion`
- `series-4.json`: 4장 시리즈와 `numbers`, `cause_effect`
- `series-5.json`: 5장 시리즈와 `compare_2col`, `process_4`
- `insurance-series-3.json`: JSON 2.1 insurance 3장과 category/role icon fallback
- `insurance-series-4.json`: JSON 2.1 insurance 완성 예제와 명시적 icon
- `insurance-series-5.json`: JSON 2.1 insurance 5장과 비교·프로세스 레이아웃
- `jagak-investment-series-3.json`: JSON 2.1 jagak 투자 3장과 category/role fallback
- `jagak-realestate-series-4.json`: JSON 2.1 jagak 부동산 red 4장 완성 예제
- `jagak-cpa-series-5.json`: JSON 2.1 jagak CPA 5장과 기존 CPA palette 회귀
- `jagak-it-series-4.json`: JSON 2.1 jagak IT burnt orange 4장
- `yeobaek-sports-series-4.json`: JSON 2.1 yeobaek 스포츠 4장, E스포츠 category icon fallback과 burnt orange palette
- `yeobaek_entertainment_issue.json`: JSON 2.1 yeobaek 연예·콘텐츠/연예이슈 3장과 `newspaper` fallback
- `yeobaek_broadcast_ott.json`: JSON 2.1 yeobaek 연예·콘텐츠/방송·OTT 3장과 `tv` fallback
- `yeobaek_film_performance.json`: JSON 2.1 yeobaek 연예·콘텐츠/영화·공연 3장과 `clapperboard` fallback
- `yeobaek_kpop_music.json`: JSON 2.1 yeobaek 연예·콘텐츠/K팝·음악 3장과 `music-2` fallback

기존 세 시리즈 샘플을 합치면 지원하는 7개 레이아웃을 모두 실제 입력으로 확인할 수 있습니다. insurance 샘플은 3·4·5장 검증과 아이콘 fallback을, jagak 샘플은 투자·부동산·CPA·IT의 category pair와 팔레트를, yeobaek 샘플은 E스포츠 및 연예·콘텐츠 category icon과 conclusion palette를 확인합니다. 각 파일은 그대로 `npm run render:single -- --input <파일>`에 전달할 수 있습니다.
