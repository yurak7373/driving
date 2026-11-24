# Phase 00 검수 보고서

**판정 · CONDITIONAL PASS**

2026-11-24에 GitHub Actions의 Ubuntu 24.04와 Node.js 22.23.5에서 아래 검사를 실행했습니다. [검수 실행 로그](https://github.com/yurak7373/driving/actions/runs/45340403879)

| 항목 | 실제 결과 |
| --- | --- |
| 의존성 설치 | 통과 · 지정한 버전으로 설치 |
| `npm audit --audit-level=high` | 통과 · 알려진 취약점 0건 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run test` | 통과 · Vitest 단위·통합 테스트 4건 |
| `npm run build` | 통과 · 배포 파일 생성 |
| `npm run check` | 통과 · 타입, 린트, 단위·통합 테스트, 빌드 |
| `npm run dev` | 통과 · Playwright가 Vite를 실행하고 HTTP 응답과 WebGL 렌더링 확인 |
| `npm run test:e2e` | 통과 · PC Chromium과 Pixel 7 에뮬레이션에서 총 4건 |
| 실제 Codespaces 5173 포워딩과 실제 Android·iOS 기기 | 미실행 |

## 확인된 문제와 조치

- 최초 의존성 감사에서 11건(치명적 1건, 높음 1건 포함)이 확인됐습니다. Vite, Vitest, ESLint, Playwright 등 개발 패키지를 업데이트하고 잠금 파일을 갱신한 뒤 감사에서 0건을 확인했습니다.
- 초기 CI에서 Ubuntu 시스템 패키지 설치가 지연됐습니다. 호스팅 러너에서는 Playwright Chromium 헤드리스 셸만 설치하도록 바꾼 뒤 브라우저 테스트를 통과했습니다.
- Codex Cloud 터미널은 환경에 연결된 GitHub 계정의 재인증 오류로 시작되지 않았습니다. 자동 검수는 GitHub Actions에서 실행했습니다.

## 다음 단계

Phase 01의 버스 모델 및 실내 제작을 시작할 수 있습니다. 사용자 Codespaces의 5173 포워딩과 실제 모바일 기기 조작은 [수동 검수 절차](TESTING.md)에 따라 확인이 필요합니다. 차량 조작, 차량 물리, 디버그 도구는 후속 단계 범위입니다.

[현재 브랜치 검수 이력](https://github.com/yurak7373/driving/actions/workflows/ci.yml?query=branch%3Aphase%2F00-development-qa)

## 독립 감사 후 Phase 00 보완

**판정 · CONDITIONAL PASS**

| 독립 감사 항목 | 상태 | 조치와 근거 |
| --- | --- | --- |
| 모바일 모서리에서 표식 화면 이탈 | FIXED | 390 × 900에서 사라졌던 `-4 / 6`을 포함해 네 모서리의 표식 전체 투영 범위를 확인합니다. PC 가로 화면, 모바일 세로·가로 화면, 사선·상단 시점을 검사합니다. |
| Codespaces Chromium 및 Linux 라이브러리 자동 준비 | NOT VERIFIED | 초기화와 CI에 Linux 설치 명령을 연결했습니다. 실제 신규 Codespaces 초기화와 재구축은 미실행입니다. 별도 Docker 실행도 이미지 레이어 저장 공간 부족으로 시작하지 못했습니다. |
| 화면 경계·키 매핑·카메라·배포 산출물 검사 공백 | FIXED | 각 키의 기대 방향, 실제 카메라의 방향, 표식 전체 투영 및 WebGL 렌더, 배포 번들 로드와 조작을 검사합니다. |
| 지속 조작 및 복수 입력 합성 | DEFERRED | Phase 02~03. 실제 차량 제어를 도입할 때 지속 입력, 장치별 합성, 포커스 상실 처리를 구현합니다. |
| 장면 및 차량 모델 수명 관리 | DEFERRED | Phase 01. 차량 모델을 연결할 때 장면·차량 교체와 자원 소유권·해제를 정의합니다. 반복 교체를 위한 확장 준비입니다. |
| 검수 서버 암묵적 재사용 | FIXED | 개발 5174, 배포 미리보기 4174를 사용합니다. 기본 모드의 포트 충돌 시 이미 실행 중인 서버를 검수에 사용하지 않고 오류를 표시함을 확인했습니다. |

수정 전 Node.js 22에서 `npm ci`, `npm run check`(Vitest 4건), `npm run test:e2e`(4건)가 통과했습니다. 수정 후 같은 검사에서 Vitest 4건 및 Playwright 8건이 통과했습니다. Playwright 8건에는 기존 4건과 모서리 회귀·배포 빌드 검사 각 2건이 포함됩니다. 모바일 실기기와 새 Codespaces의 포트 포워딩은 **NOT VERIFIED**입니다.

[Phase 00 브랜치의 GitHub Actions 실행 기록](https://github.com/yurak7373/driving/actions/workflows/ci.yml?query=branch%3Aphase%2F00-development-qa)

## Phase 01-A · 버스 외부 관찰

| 검사 | 실제 결과 |
| --- | --- |
| `npm ci` | Node.js 22.23.5, 잠금 파일로 설치 성공 |
| `npm run check` | 타입·린트·Vitest 9건·배포 빌드 통과. Vite는 공통 JavaScript 번들 크기 경고를 출력했습니다. |
| `npm run test:e2e` | Playwright 16건 통과. 기존 표식 검사 8건과 버스 검사 8건을 데스크톱 및 모바일 Chromium 에뮬레이션에서 실행했습니다. |
| 시각 확인 | Chromium에서 데스크톱 사선·전면·좌측, 390×900 모바일 초기 시점을 확인했습니다. 전면 LED 한글 및 차량 전체 표시를 확인했습니다. |
| 신규 Codespace, Android·iOS 실기기, 실기기 FPS | NOT VERIFIED · 로컬 Chromium과 모바일 에뮬레이션으로 검증했습니다. |

테스트는 실제 바퀴와 문·창문 노드, 도색 재질과 투영 범위, 반복 장면 전환 시 WebGL 컨텍스트 해제 및 차량 자원 처리를 확인합니다. 배포 환경의 버스 진입 및 한글 글꼴 로드도 검증했습니다. [Phase 01-A GitHub Actions](https://github.com/yurak7373/driving/actions/workflows/ci.yml?query=branch%3Aphase%2F01-a-bus-exterior)

## PHASE 01-A 독립 감사 보완

비교 기준은 감사 커밋 `b0450325cc0d350da3923522bacada652b0e0389`입니다.

| 항목 | 상태 | 검증 결과와 후속 작업 |
| --- | --- | --- |
| A-01 실제 좌우 | FIXED | 진행 +Z, 위 +Y에서 오른쪽 −X를 구합니다. 운전석 X −0.74 → +0.74m, 운전자 카메라 −0.74 → +0.74m, 두 문 +1.218 → −1.218m입니다. 승하차 기준점, 바퀴·미러·조명, 좌우 프리셋과 비대칭 외장을 같은 기준으로 검증했습니다. |
| A-02 타이어 간섭 | FIXED | 기존 전륜 Y 0.61m·Z 3.10m 단면의 바닥 겹침 약 0.22m를 제거했습니다. 다섯 조향 각도에서 바닥·덮개·휠아치·측면 패널·문틀·관련 하부 부품과 타이어 단면 겹침이 검출되지 않았습니다. 전륜 Y 0.91m와 후륜 복륜도 검사했습니다. |
| A-03 낮은 가로 화면 | FIXED | 900×390에서 첫 화면 차량 경계 하단이 Y 509px에서 약 Y 357px로 이동했습니다. 390×900, 340×780, 1440×900에서도 첫 화면 차량 전체를 검증했습니다. |
| A-04 차량 교체 연동 | DEFERRED | PHASE 01-B에서 크기·원점이 다른 모델 교체를 연결할 때 활성 모델, 카메라, 정보·도색·기준점과 자원 해제를 검증합니다. |
| A-05 초기화 실패 시 정리 | DEFERRED | PHASE 01-B에서 부분 초기화의 자원 정리와 실패 후 표식 장면 복귀를 검증합니다. |
| A-06 반복 부품 렌더링 비용 | DEFERRED | PHASE 01-B에서 실내 반복 부품을 추가할 때 실기기 측정과 인스턴싱을 검토합니다. 감사 기준 Draw Calls 399, 삼각형 42,044, 렌더러 Geometry 171, Texture 3, 광원 3입니다. |

Node.js 22.23.5에서 `npm ci`, `npm run check`(Vitest 15건), `CI=1 npm run test:e2e`(Playwright 18건)를 실행했습니다. 기존 표식·장면 반복 전환·배포 검사가 포함됩니다. Vite 공통 번들 크기 경고는 유지됩니다. 임시 복사본에서 운전석 반대 배치, 연속 바닥 복원, 가로 높이 보정 제거가 각각 신규 검사에 의해 검출됐습니다.

Chromium으로 요청된 시점 11개를 캡처했습니다. 운전석과 하부 단면은 실제 모델을 별도 검수 카메라와 클리핑 평면으로 렌더링했습니다. 신규 Codespaces, Android·iOS 실기기, 실기기 FPS, 현가장치 작동 중 간섭 및 27석의 실제 배치는 **NOT VERIFIED**입니다. [자동 검사 이력](https://github.com/yurak7373/driving/actions/workflows/ci.yml?query=branch%3Aphase%2F01-a-bus-exterior)
