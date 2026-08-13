# Jarvis Assistant 웹앱 — 설정 가이드

## 1. Google Cloud OAuth 클라이언트 발급 (직접 해야 하는 단계)

Google이 2024년에 "OAuth 동의 화면"을 **"Google Auth Platform"**으로 개편해서, 지금은 Branding / Audience / Clients / Data Access 4개 탭 구조야. 아래는 현재(2026) 기준 순서.

1. https://console.cloud.google.com 접속 → 새 프로젝트 생성 (예: `jarvis-assistant`)
2. 좌측 메뉴 "APIs & Services" → "Library"에서 아래 두 API를 각각 검색해서 **Enable**:
   - Google Calendar API
   - Gmail API
3. "APIs & Services" → **"Google Auth Platform"** (예전 "OAuth consent screen") → 처음이면 "Get started" 마법사가 뜸
   - User Type: **External** 선택 — ⚠️ 나중에 못 바꾸니 꼭 External로. (개인 Gmail 계정 3개는 전부 외부 취급됨)
   - 앱 이름/지원 이메일 등 기본 정보 입력
   - **Audience 탭**에서 Test users 섹션에 아래 3개 이메일 전부 추가:
     - donggyu.main@gmail.com
     - donggyu.biz@gmail.com
     - bang2brew@gmail.com
   - **게시 상태는 "Testing"으로 계속 둬도 됨** — 구글 심사(verification) 안 받아도 테스트 사용자로 등록된 계정끼리는 무기한 정상 동작함
4. **Clients 탭** → "Create Client" → 애플리케이션 유형: **Web application**
   - Authorized redirect URIs에 추가 (⚠️ Vercel의 **프리뷰용 해시 URL이 아니라 고정 프로덕션 도메인**으로 — Vercel 프로젝트의 Domains 탭에서 확인):
     `https://<고정 프로덕션 도메인>/api/auth/google/callback`
   - 생성되면 **Client ID**와 **Client secret**이 발급됨 → 아래 3번의 env 변수에 사용

## 2. Supabase 값 확인

- 프로젝트: `jarvis-assistant-app` (이미 생성됨, region: ap-northeast-2)
- URL: `https://ycvifxzedtysqrrxcbic.supabase.co`
- anon key: `.env.example`에 채워둔 값 그대로 사용
- **service role key**는 보안상 나(Claude)는 조회할 수 없음 → Supabase 대시보드 → 프로젝트 → Settings → API → "service_role" 비밀 키를 직접 복사

### 첫 로그인 계정 만들기 (앱 전용 ID/PW)
Supabase 대시보드 → Authentication → Users → "Add user" → 이메일/비밀번호 직접 지정.
(회원가입 페이지는 따로 안 만들었음 — 어차피 1인 전용 앱이라 대시보드에서 한 번만 만들면 됨)

## 3. Vercel 환경변수 설정

Vercel 프로젝트 → Settings → Environment Variables에 아래를 등록:

| 이름 | 값 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ycvifxzedtysqrrxcbic.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (`.env.example` 참고) |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase 대시보드에서 복사) |
| `GOOGLE_CLIENT_ID` | (1번에서 발급) |
| `GOOGLE_CLIENT_SECRET` | (1번에서 발급) |
| `GOOGLE_REDIRECT_URI` | `https://<실제 배포 도메인>/api/auth/google/callback` |
| `CRON_SECRET` | 아무 랜덤 문자열 (직접 생성해서 등록) |

등록 후 재배포하면 반영돼.

## 4. 구글 계정 3개 연결

배포된 앱에 로그인 → 설정 페이지 → 라벨(업무/개인/취미/통합) 선택 후 "구글 계정 연결" → 각 계정으로 로그인/동의 3번 반복.

## 5. 브리핑 크론 확인

`vercel.json`에 이미 등록됨 (Vercel Cron은 항상 UTC 기준):
- 일간: `0 22 * * *` (UTC) = 매일 07:00 KST
- 주간: `0 12 * * 0` (UTC, 일요일) = 매주 일요일 21:00 KST

Vercel 대시보드 → 프로젝트 → Cron Jobs 탭에서 수동 실행("Run")도 가능 — 처음엔 한 번 수동 실행해서 정상 동작하는지 확인 추천.
