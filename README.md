# NS

GUI로 NestJS 서버 뼈대를 만드는 모노레포입니다. 웹 마법사에서 데이터베이스, ORM, 인증, 엔티티를 고르면 API가 프로젝트 파일 트리와 ZIP을 만들어 줍니다.

## 구성

| 패키지 | 역할 |
| --- | --- |
| `apps/web` | Next.js 마법사. 기본 주소는 http://localhost:3000 |
| `apps/api` | NestJS 생성 API. 기본 주소는 http://localhost:4000 |
| `packages/shared` | 웹과 API가 공유하는 프로젝트 설정 타입 |

생성기는 지금 layered NestJS 모듈(컨트롤러, 서비스, DTO, ORM 설정)을 만듭니다. 마법사의 아키텍처와 프론트엔드 선택은 설정에 저장되지만 아직 다른 구조의 코드를 만들지는 않습니다.

## 요구 사항

- Node.js 20 이상
- pnpm 10 이상

## 실행

```bash
pnpm install
pnpm dev
```

`pnpm dev`는 `@ns/shared`를 먼저 빌드한 뒤 웹과 API를 함께 띄웁니다. 마법사는 `http://localhost:3000` 또는 `http://127.0.0.1:3000`에서 열 수 있습니다. API는 그 두 출처의 브라우저 요청만 허용합니다.

다른 API 주소를 쓰려면 웹을 빌드하기 전에 `NEXT_PUBLIC_API_URL`을 지정합니다.

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter @ns/web dev
```

## 테스트와 빌드

```bash
pnpm test
pnpm build
```

`pnpm test`는 공유 패키지를 빌드한 다음 API와 웹의 단위 테스트를 실행합니다. `pnpm build`는 워크스페이스 패키지를 의존 순서대로 빌드합니다.

## 생성 API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `POST` | `/api/generate/preview` | `{ config }`를 받아 생성될 파일 목록을 반환합니다. |
| `POST` | `/api/generate/download` | 같은 설정으로 ZIP을 반환합니다. |

`config`가 비어 있거나 엔티티 이름이 잘못된 요청은 `400`입니다. 다운로드 파일명과 ZIP 안의 경로는 상위 경로와 헤더 구분자를 제거합니다.

생성된 프로젝트의 기본 포트는 마법사와 같은 `3000`입니다. 마법사를 켠 채로 생성 결과를 실행하려면 포트를 바꿔 두세요.

## 알아둘 제한

- 인증 로그인은 사용자 저장소를 조회하지 않는 예시입니다. `jwt-refresh-roles`에서는 예시 토큰에 `user` 역할을 넣어 `RolesGuard`와 맞춥니다. 운영 전에 실제 사용자 조회로 바꿔야 합니다.
- 필드 옵션 `isArray`는 설정에만 있고 생성 코드에는 반영되지 않습니다.
- Rate Limit을 켜면 전역 `ThrottlerGuard`로 60초당 100회를 적용합니다.
- `.env.example`의 JWT 값은 자리표시자입니다. 실제 시크릿은 `.env`에만 있습니다.
