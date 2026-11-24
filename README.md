# driving

한국형 3D 시내버스 운전 시뮬레이터입니다. Phase 01-A에서는 흰색·녹색의 가상 대형 시내버스 외부를 둘러보고 도색과 바퀴 움직임을 검수할 수 있습니다. 기존 3D 표식 시험 장면도 첫 화면에서 실행됩니다.

## Codespaces에서 열기

1. GitHub 저장소에서 `phase/01-a-bus-exterior` 브랜치로 전환합니다. 이미 Codespace가 있다면 그 안에서 브랜치를 전환할 수 있습니다.
2. 저장소의 **Code → Codespaces**에서 Codespace를 열고, 파일과 터미널이 나타날 때까지 기다립니다.
3. 이미 만든 Codespace가 이전 설정으로 만들어졌다면 브랜치를 전환한 뒤 명령 팔레트에서 **Codespaces: Rebuild Container**를 실행합니다.
4. 컨테이너 초기화가 끝날 때까지 기다립니다. 초기화 과정에서 npm 패키지, Playwright Chromium 헤드리스 셸, Linux 시스템 라이브러리를 설치합니다. 초기화가 실패하면 오류를 확인하고 컨테이너를 재구축합니다.
5. 터미널에서 `npm run dev`를 실행합니다.
6. **Ports(포트)** 탭에서 5173의 **Open in Browser(브라우저에서 열기)**를 선택합니다. 자동으로 표시되지 않으면 **Forward a Port**에 `5173`을 입력합니다. 기본 포트 가시성은 비공개입니다.

브라우저에서 **버스 외부 살펴보기**를 선택합니다. 여섯 가지 카메라 시점과 자유 회전, 확대·축소, 도색 선택, 전륜 조향과 바퀴 회전을 확인할 수 있습니다. 이 화면은 외부 모델 검수용입니다. 자세한 순서는 [검수 문서](docs/TESTING.md#버스-외부-수동-검수)를 참고하세요.

**표식 시험 장면**으로 돌아가면 PC에서는 방향키나 WASD로 표식을 움직이고 C로 시점을 바꿀 수 있습니다. 모바일에서는 화면의 방향 버튼과 **시점 전환** 버튼을 사용합니다. **초기화**는 표식과 카메라를 시작 상태로 되돌립니다.

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

Codespaces 초기화가 끝나면 아래 두 명령으로 검수할 수 있습니다.

```sh
npm run check
npm run test:e2e
```

로컬 환경에서 브라우저 테스트를 준비하려면 Linux는 `npm run test:e2e:install:linux`, macOS와 Windows는 `npm run test:e2e:install`을 실행하세요. 브라우저 검사는 개발용 5173과 별도로 5174와 4174를 사용합니다. [검수 문서](docs/TESTING.md)에서 포트 충돌과 설치 오류의 확인 방법을 볼 수 있습니다.

- [모듈 구조](docs/ARCHITECTURE.md)
- [자동 및 수동 검수](docs/TESTING.md)
- [개발 기록](docs/DEVELOPMENT_LOG.md)
- [검수 결과](docs/QA_REPORT.md)
