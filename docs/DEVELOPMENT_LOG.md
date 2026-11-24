# 개발 기록

## 2026-11-24 · Phase 00

- 초기 저장소에 있던 README 제목을 유지하면서 Codespaces 실행 절차를 추가했습니다.
- Three.js, TypeScript, Vite, ESLint, Prettier, Vitest 및 Playwright를 구성했습니다.
- PC 키보드와 모바일 화면 버튼이 같은 방식으로 제어하는 3D 테스트 장면을 만들었습니다.
- GitHub Actions와 한국어 작업 원칙, 구조 및 검수 문서를 추가했습니다.
- 잠금 파일을 커밋해 Codespaces와 CI에서 `npm ci`로 같은 의존성을 설치하도록 구성했습니다.
- 최초 의존성 감사에서 발견한 문제를 해결하기 위해 개발 도구를 업데이트했습니다. Node.js 22.13 이상이 필요합니다.
- 환경 실행 및 검수 결과는 [QA 보고서](QA_REPORT.md)에서 확인합니다.

## Phase 01 예정

버스 외부와 실내 모델을 만들고 차량 모듈에서 불러옵니다. 주행 제어와 물리 구현은 별도 단계에서 진행합니다.
