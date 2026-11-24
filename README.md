# driving

한국형 3D 시내버스 운전 시뮬레이터입니다. Phase 00에서는 개발 환경과 검수 체계를 구성하고, 3D 테스트 장면에서 표식을 움직이거나 카메라 시점을 바꿀 수 있습니다.

## Codespaces에서 열기

1. GitHub 저장소에서 `phase/00-development-qa` 브랜치로 전환합니다. 이미 Codespace가 있다면 그 안에서 브랜치를 전환할 수 있습니다.
2. 저장소의 **Code → Codespaces**에서 Codespace를 열고, 파일과 터미널이 나타날 때까지 기다립니다.
3. 이미 만든 Codespace가 이전 설정으로 만들어졌다면 브랜치를 전환한 뒤 명령 팔레트에서 **Codespaces: Rebuild Container**를 실행합니다.
4. 터미널에서 `npm run dev`를 실행합니다. 설치가 완료되지 않았다면 아래의 설치 절차를 먼저 실행합니다.
5. **Ports(포트)** 탭에서 5173의 **Open in Browser(브라우저에서 열기)**를 선택합니다. 자동으로 표시되지 않으면 **Forward a Port**에 `5173`을 입력합니다. 기본 포트 가시성은 비공개입니다.

브라우저가 열리면 PC에서는 방향키나 WASD로 표식을 움직이고 C로 시점을 바꿉니다. 모바일에서는 화면의 방향 버튼과 **시점 전환** 버튼을 누릅니다. **초기화** 버튼으로 시작 상태로 돌아갑니다.

## 로컬에서 실행하기

Node.js 22 LTS(22.13 이상)와 npm 10 이상을 설치한 뒤, 터미널에서 프로젝트 폴더를 열고 아래 명령을 실행합니다.

```sh
npm ci
npm run dev
```

브라우저 주소창에 `http://localhost:5173`을 입력합니다. 서버를 종료하려면 터미널에서 Ctrl+C를 누릅니다.

## 검수 명령

| 명령 | 실행 내용 |
| --- | --- |
| `npm run typecheck` | TypeScript 타입을 검사합니다. |
| `npm run lint` | ESLint를 실행합니다. |
| `npm run test` | Vitest 단위·통합 테스트를 실행합니다. |
| `npm run test:e2e` | Playwright에서 개발 서버와 브라우저 동작을 테스트합니다. |
| `npm run build` | 배포 파일을 `dist/`에 생성합니다. |
| `npm run check` | 타입, 린트, 단위·통합 테스트, 빌드를 순서대로 실행합니다. |
| `npm run format` | Prettier로 파일을 정리합니다. |

브라우저 테스트를 처음 실행하기 전에 `npx playwright install chromium`을 실행합니다. Linux에서 시스템 패키지가 필요한 경우 [검수 문서](docs/TESTING.md)를 참고하세요.

- [모듈 구조](docs/ARCHITECTURE.md)
- [자동 및 수동 검수](docs/TESTING.md)
- [개발 기록](docs/DEVELOPMENT_LOG.md)
- [검수 결과](docs/QA_REPORT.md)
