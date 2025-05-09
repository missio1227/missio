# Server Manager Backend

## 소개

이 프로젝트는 서버 접속 정보를 관리하는 풀스택 앱의 백엔드입니다. Node.js, Express, SQLite를 사용하며, JWT 인증과 bcrypt 비밀번호 암호화를 지원합니다.

## 설치 및 실행

1. 의존성 설치

```bash
npm install
```

2. 서버 실행

```bash
npm start
```

- 서버는 기본적으로 `http://localhost:4000` 에서 실행됩니다.
- 데이터베이스 파일은 `backend/data/database.sqlite`에 생성됩니다.

## 주요 API

- `POST /api/register` : 회원가입
- `POST /api/login` : 로그인(JWT 발급)
- `POST /api/pin-login` : 모바일용 PIN 로그인
- `GET /api/servers` : 서버 목록 조회 (인증 필요)
- `POST /api/servers` : 서버 추가
- `PUT /api/servers/:id` : 서버 수정
- `DELETE /api/servers/:id` : 서버 삭제
- `PUT /api/servers/:id/favorite` : 즐겨찾기 토글
- `POST /api/set-pin` : 모바일 PIN 저장

## 환경 변수
- JWT 시크릿 등 민감 정보는 실제 배포시 환경변수로 관리하세요. 