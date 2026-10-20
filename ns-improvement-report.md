# NS 개선 보고서

## 발견한 프로젝트

NS는 NestJS 서버 뼈대를 GUI로 만드는 pnpm 모노레포다.

- `apps/web`: Next.js 14 마법사. 프로젝트, 데이터베이스, 인증, 기능, 엔티티, 생성의 6단계.
- `apps/api`: NestJS 10 생성 API. 설정을 받아 파일 트리와 ZIP을 만든다.
- `packages/shared`: 양쪽이 쓰는 설정 타입.

실행은 `pnpm dev`다. 웹은 3000, API는 4000이다. 시작 시점에는 README, 테스트, CI가 없었다. 루트 `pnpm lint`는 패키지에 lint 스크립트가 없어 바로 실패했다. `pnpm --filter @ns/shared build` 다음 API `nest build`와 웹 `tsc`는 통과했다. 문제는 생성기가 만드는 결과물이었다.

## 반영한 변경

모두 `main`에 머지했다. 코드를 바꾸는 PR 중 열어 둔 것은 없다. 이 문서는 https://github.com/rjsgud49/NS/pull/15 에 있다.

| 브랜치 | PR | 상태 | 내용 |
| --- | --- | --- | --- |
| `cursor/fix-relation-queries-0613` | https://github.com/rjsgud49/NS/pull/1 | 머지 | 관계가 있으면 `findOne`/`findUnique`가 옵션 객체를 두 개 붙여 생성 코드가 파싱되지 않았다. 한 객체로 합쳤다. |
| `cursor/fix-prisma-client-module-0613` | https://github.com/rjsgud49/NS/pull/2 | 머지 | Prisma를 고르면 `PrismaModule`을 import만 하고 파일은 없었다. 서비스와 모듈을 만들고, 빈 엔티티 클래스를 타입 재수출로 바꿨다. |
| `cursor/fix-env-secret-stability-0613` | https://github.com/rjsgud49/NS/pull/3 | 머지 | `.env`와 `.env.example`이 서로 다른 JWT 시크릿을 가졌다. 실제 값은 `.env`만, 예시 파일은 `change-me`이다. |
| `cursor/fix-zip-path-safety-0613` | https://github.com/rjsgud49/NS/pull/4 | 머지 | ZIP 경로의 `../`와 절대 경로를 거절하고, 다운로드 파일명에서 따옴표와 개행을 제거한다. |
| `cursor/validate-generate-config-0613` | https://github.com/rjsgud49/NS/pull/5 | 머지 | `config`가 없거나 예약 필드 `id`를 쓰거나 없는 엔티티를 관계로 가리키면 생성 전에 400을 반환한다. |
| `cursor/add-mapped-types-dependency-0613` | https://github.com/rjsgud49/NS/pull/6 | 머지 | Update DTO가 쓰는 `@nestjs/mapped-types`를 Swagger를 꺼도 `package.json`에 넣는다. |
| `cursor/fix-mongodb-generation-0613` | https://github.com/rjsgud49/NS/pull/7 | 머지 | MongoDB TypeORM이 Postgres 포트 5432를 쓰던 것을 `DATABASE_URL`로 바꿨다. Prisma id는 ObjectId다. `mongodb` 드라이버를 추가했다. |
| `cursor/fix-rate-limit-guard-0613` | https://github.com/rjsgud49/NS/pull/8 | 머지 | Rate Limit을 켜면 `ThrottlerGuard`를 전역 가드로 등록한다. 모듈만 있을 때는 제한이 적용되지 않았다. |
| `cursor/escape-generated-strings-0613` | https://github.com/rjsgud49/NS/pull/9 | 머지 | 설명의 따옴표와 줄바꿈이 Swagger와 DB 기본값 문자열을 깨지 않도록 이스케이프한다. |
| `cursor/fix-rbac-token-roles-0613` | https://github.com/rjsgud49/NS/pull/10 | 머지 | `jwt-refresh-roles` 예시 토큰과 strategy가 `roles`를 넘겨 `RolesGuard`가 읽을 수 있다. |
| `cursor/fix-web-generate-errors-0613` | https://github.com/rjsgud49/NS/pull/11 | 머지 | 미리보기와 ZIP 다운로드 실패를 화면에 표시한다. API 주소는 `NEXT_PUBLIC_API_URL`이다. |
| `cursor/fix-local-cors-origins-0613` | https://github.com/rjsgud49/NS/pull/12 | 머지 | `http://127.0.0.1:3000`에서도 마법사 요청을 허용한다. 이전에는 `localhost`만 허용했다. |
| `cursor/docs-readme-0613` | https://github.com/rjsgud49/NS/pull/13 | 머지 | 설치, 실행, 생성 API, 아직 생성되지 않는 옵션을 README에 적었다. |
| `cursor/ci-test-and-build-0613` | https://github.com/rjsgud49/NS/pull/14 | 머지 | GitHub Actions가 `pnpm test`와 `pnpm build`를 실행한다. `pnpm lint`는 스크립트가 있는 패키지만 돈다. |

API 테스트 26건, 웹 테스트 3건, `pnpm build`가 통과했다. PR 14의 Actions `verify`도 통과했다. 웹 변경은 `http://localhost:3000`에서 6단계까지 진행해 파일 트리의 `package.json`과 ZIP 다운로드를 확인했다. `127.0.0.1`로 열었을 때의 연결 실패 경고를 본 뒤 CORS를 고쳤다.

## 고치지 않은 것

- 아키텍처(clean, hexagonal, CQRS, DDD, microservices)와 프론트엔드/UI 프레임워크는 설정에만 저장된다. 생성기는 계속 layered NestJS 모듈만 만든다. 구조를 실제로 나누는 일은 제품 범위를 바꾸는 작업이라 이번 수정에 넣지 않았다.
- 로그인 예시는 여전히 사용자 저장소를 조회하지 않고 토큰을 발급한다. 역할 클레임만 가드와 맞게 고쳤다. 비밀번호 검증을 넣으려면 User 엔티티와의 연결 방식을 정해야 한다.
- 필드 `isArray`는 엔티티, DTO, Prisma 스키마에 반영되지 않는다. 배열 컬럼 규칙을 DB별로 정하는 별도 작업이다.
- Prisma의 다대다는 양쪽 모델에 배열 필드가 있어야 하는데, 지금 생성기는 사용자가 추가한 쪽만 적는다. 반대쪽을 자동으로 만들면 관계 의미가 바뀐다.
- TypeORM 관계의 반대편 프로퍼티 이름은 엔티티 이름에서 추정한다. 사용자가 지은 필드명과 다를 수 있다.
- 미리보기는 파일 내용 전체를 돌려준다. 그 안에 `.env`의 JWT 시크릿이 있다. 로컬 도구라 경로만 반환하도록 바꾸지는 않았다.
- 생성된 `HttpExceptionFilter`는 `HttpException`만 잡는다. 그 밖의 예외는 Nest 기본 응답으로 나간다.
- 패키지별 ESLint는 없다. `pnpm lint`는 지금은 할 일이 없어 성공만 한다.
- 생성 앱의 기본 포트는 마법사와 같은 3000이다. 기본값을 바꾸면 기존 사용 흐름이 달라져 README에만 적었다.
- 리프레시 토큰은 `RefreshDto` 본문이 아니라 Authorization 헤더로 읽는다. 흐름을 다시 설계하지 않았다.

## 다음 단계

1. 로그인 예시를 User 엔티티가 있을 때 그 저장소로 연결하고, 없을 때는 토큰을 발급하지 않게 한다.
2. 미리보기 응답에서 파일 내용을 빼고 경로만 반환한다. 다운로드 ZIP에만 시크릿을 둔다.
3. `isArray`와 Prisma 다대다의 반대편 필드를 생성 규칙으로 정한다.
4. 아키텍처 선택이 layered 이외일 때 화면에서 아직 생성되지 않는다고 밝히거나, 한 패턴부터 실제 폴더 구조를 만든다.
5. API와 웹에 ESLint를 넣고 CI의 lint 단계에 연결한다.
6. 생성된 예외 필터가 HTTP가 아닌 예외도 같은 JSON 형식으로 감싸게 한다.
