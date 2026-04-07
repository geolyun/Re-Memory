# Re:Memory

BookPrint API Python SDK를 사용해 만든 가족 회고록 제작 서비스입니다.

## 서비스 개요

Re:Memory는 부모님 또는 조부모님의 이야기를 질문형 인터뷰로 모으고, 사진과 함께 한 권의 회고록으로 만드는 서비스입니다.

현재 구현 기준:
- 질문/답변 텍스트 기반 회고록 생성
- 표지 사진 반영
- 질문별 사진 첨부
- 사진이 있는 질문은 사진 포함 본문 템플릿 사용
- 가족 공동 작성 링크 공유
- 책 빌드, 미리보기, 확정, 견적, 주문

중요한 제약:
- 질문당 사진은 최대 1장 업로드할 수 있습니다.
- 업로드된 사진은 책 본문에 그대로 반영됩니다.

## 로컬 실행

필수 환경:
- Python 3.11+
- Node.js 20+
- BookPrint Sandbox API Key

### 1. 백엔드 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 변수 파일 준비

```bash
copy rememory\\.env.example rememory\\.env
```

`rememory/.env`에서 최소 아래 값을 확인하세요.

```env
BOOKPRINT_API_KEY=SBxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOOKPRINT_ENV=sandbox
BOOKPRINT_BASE_URL=https://api-sandbox.sweetbook.com/v1

BOOK_SPEC_UID=SQUAREBOOK_HC
TPL_COVER=79yjMH3qRPly
TPL_GANJI=5M3oo7GlWKGO
TPL_QNA=5B4ds6i0Rywx
TPL_QNA_WITH_PHOTO=46VqZhVNOfAp
TPL_BLANK=2mi1ao0Z4Vxl
TPL_PUBLISH=5nhOVBjTnIVE
```

### 3. 프론트 의존성 설치

```bash
cd frontend
npm install
cd ..
```

### 4. 서버 실행

루트에서 바로 실행할 수 있습니다.

```bash
python run_rememory.py
```

새 터미널에서 프론트 서버를 실행합니다.

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173`로 접속합니다.

## 테스트

### 백엔드

```bash
pip install -r requirements-dev.txt
pytest -q
```

### 프론트

```bash
cd frontend
npm run test:unit
npm run test:ci
```

`test:ci`는 아래 순서로 실행됩니다.
- `vite build`
- `vitest run`
- `playwright test`

## 실제 사용 중인 BookPrint API

현재 코드에서 직접 사용하는 API는 아래입니다.

### 책/콘텐츠
- `POST /Books`
- `DELETE /Books/{bookUid}`
- `POST /Books/{bookUid}/photos`
- `POST /Books/{bookUid}/cover`
- `DELETE /Books/{bookUid}/cover`
- `POST /Books/{bookUid}/contents`
- `POST /Books/{bookUid}/finalization`

### 주문/크레딧
- `POST /orders/estimate`
- `POST /orders`
- `GET /orders/{orderUid}`
- `POST /orders/{orderUid}/cancel`
- `GET /credits`
- `POST /credits/sandbox/charge`

## 템플릿 매핑

현재 서비스는 일기장A 계열 템플릿을 기준으로 맞춰져 있습니다.

- 표지: `79yjMH3qRPly`
- 사진 있는 QnA 본문: `46VqZhVNOfAp`
- 사진 없는 QnA 본문: `5B4ds6i0Rywx`
- 간지: `5M3oo7GlWKGO`
- 빈 내지: `2mi1ao0Z4Vxl`
- 발행면: `5nhOVBjTnIVE`

## 현재 동작 정리

- 질문에 사진이 없으면 텍스트 전용 본문 템플릿을 사용합니다.
- 질문에 사진이 있으면 사진 포함 본문 템플릿을 사용합니다.
- 발행면에는 대표 사진 1장이 들어갑니다.
- demo 프로젝트는 읽기 전용으로만 열립니다.
- 공동 작성 답변은 기존 답변을 덮어쓰지 않고 누적됩니다.
