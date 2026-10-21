# NS 개선 보고서 (2026-10-21)

## 기준

`main`은 이전 라운드 PR 1–15가 머지된 상태였다. 관계 조회 문법 수정은 https://github.com/rjsgud49/NS/pull/1 에 있다. 이번 라운드는 그 위에서 생성 결과가 컴파일되고 선택한 기능이 실제로 붙는지를 봤다.

## 반영한 변경

모두 `main`에 머지했다. 코드를 바꾸는 PR 중 열어 둔 것은 없다. 이 문서는 https://github.com/rjsgud49/NS/pull/20 에 있다. `pnpm test`와 `pnpm build`를 로컬에서 통과시킨 뒤 머지했고, 각 PR의 GitHub Actions `verify`도 통과했다.

| PR | 상태 | 내용 |
| --- | --- | --- |
| https://github.com/rjsgud49/NS/pull/16 | 머지 | 관계를 한쪽만 적으면 TypeORM `tsc`와 `prisma validate`가 실패했다. 양쪽을 하나씩만 적은 관계는 그 필드를 잇고, Prisma는 없는 반대편을 만든다. TypeORM 1:N은 반대편 N:1을 만들고, N:1은 없는 프로퍼티를 추측하지 않는다. |
| https://github.com/rjsgud49/NS/pull/17 | 머지 | MongoDB ObjectId를 `ParseIntPipe`가 앞자리 정수로 잘랐다. 컨트롤러와 Prisma 서비스는 문자열 id를 쓰고, TypeORM은 `ObjectIdColumn`과 `_id` 조회로 바꾼다. |
| https://github.com/rjsgud49/NS/pull/18 | 머지 | `jwt-refresh-roles`를 골라도 `RolesGuard`가 라우트에 없었다. CRUD 컨트롤러에 `JwtAuthGuard` 다음으로 붙인다. `@Roles()`가 없으면 인증만 요구한다. |
| https://github.com/rjsgud49/NS/pull/19 | 머지 | 예외 필터가 `HttpException`만 잡았다. 그 밖의 예외도 같은 JSON으로 감싸고, 상태 코드는 500이다. |

PR 16은 마법사 엔티티 단계에서 Post → User N:1 추가와 안내 문구를 확인했다. PR 18은 인증 단계에서 RBAC을 고르면 안내가 보이고 JWT로 되돌리면 사라지는 것을 확인했다. Prisma 스키마는 `prisma validate`, TypeORM 엔티티와 MongoDB 서비스, 예외 필터는 생성 코드를 `tsc`로 확인했다.

## 고치지 않은 것

- 아키텍처(clean, hexagonal, CQRS, DDD, microservices)와 프론트엔드/UI 프레임워크는 설정에만 저장된다. 생성기는 layered NestJS 모듈만 만든다.
- 로그인은 사용자 저장소를 조회하지 않고 어떤 이메일과 비밀번호에도 토큰을 발급한다. User 엔티티와 비밀번호 해시 규칙을 정해야 해서 이번 수정에 넣지 않았다.
- `isArray`는 공유 타입과 검증에만 있고, 마법사에는 체크박스가 없으며 엔티티, DTO, Prisma 스키마에 반영되지 않는다.
- 미리보기는 파일 내용 전체를 돌려준다. `.env`의 JWT 시크릿이 응답에 포함된다. 웹은 경로만 쓰므로 응답에서 내용을 빼면 지금 화면은 깨지지 않는다. API 응답 형식을 바꾸는 일이라 이번 라운드에서는 두지 않았다.
- 생성된 앱의 기본 포트는 마법사와 같은 3000이다.
- 리프레시 토큰은 `RefreshDto` 본문이 아니라 Authorization 헤더로 읽는다.
- 패키지별 ESLint는 없다. `pnpm lint`는 스크립트가 있는 패키지만 실행하므로 지금은 할 일이 없다.
- 같은 두 모델 사이에 관계가 둘 이상이면 하나로 합치지 않는다. 어느 쪽이 짝인지 알 수 없어 각각 반대편을 만든다.

## 다음 단계

1. User 엔티티에 email과 password가 있으면 로그인 예시가 그 저장소를 조회하고 비밀번호를 비교하게 한다. 없으면 토큰을 발급하지 않는다.
2. 미리보기 응답에서 파일 내용을 빼고 경로만 반환한다. 시크릿은 ZIP에만 둔다.
3. `isArray`를 마법사에 노출하고 Prisma 배열과 TypeORM 배열 컬럼으로 생성한다.
4. 아키텍처나 프론트엔드가 layered 이외일 때 아직 생성되지 않는다고 화면에 밝히거나, 한 패턴부터 폴더 구조를 만든다.
5. API와 웹에 ESLint를 넣고 CI의 lint 단계에 연결한다.
6. 리프레시 흐름이 `RefreshDto` 본문과 Authorization 헤더 중 하나를 일관되게 쓰게 한다.
