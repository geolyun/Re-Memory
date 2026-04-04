# 📖 Re:Memory (기억을 엮다)

> **BookPrint API Python SDK**를 활용해 만든 가족 회고록 제작 웹 서비스입니다.

---

## 1. 서비스 소개

### 한 줄 설명

부모님·조부모님의 인생 이야기를 질문 기반 인터뷰로 기록하고, 사진과 함께 **한 권의 실물 회고록 책**으로 제작해주는 웹 서비스입니다.

### 타겟 고객

- **1차**: 부모님·조부모님께 특별한 선물을 준비하고 싶은 20~40대 자녀 (어버이날, 환갑, 칠순)
- **2차**: 자신의 삶을 자서전 형태로 남기고 싶은 중장년층

### 주요 기능

| 기능 | 설명 |
|------|------|
| **인터뷰 위자드** | 챕터별 가이드 질문 따라 텍스트 답변 + 사진 업로드 (자동 저장) |
| **인터뷰 깊이 선택** | 빠르게(5문항) / 보통(10문항) / 깊이 있게(15문항) 중 선택 |
| **무작위 질문 선정** | 풀에서 매번 다른 질문 조합 — 프로젝트마다 새로운 인터뷰 |
| **자동 책 편집** | 답변·사진을 간지 → QnA 본문 → 빈내지 패딩 → 발행면 순으로 자동 구성 |
| **표지 자동 생성** | 책 제목·날짜·대표 사진으로 표지 생성 |
| **책 미리보기** | 완성된 회고록을 챕터별로 웹에서 확인 |
| **인생 타임라인** | 답변에 인생 시기를 태깅하면 시간 순 타임라인으로 시각화 |
| **공동 작성** | 공유 링크로 가족이 함께 답변 기여 (이름 표시) |
| **주문·배송** | 배송지 입력 → 충전금 결제 → 실물 책 주문 |
| **충전금 관리** | 잔액 조회 및 Sandbox 테스트 충전 |

---

## 2. 실행 방법

### 사전 요구사항

- Python **3.10** 이상
- Node.js **18** 이상
- BookPrint API **Sandbox Key** (가입 후 발급)

### 설치

아래 명령어를 **순서대로** 복사·붙여넣기하면 바로 실행됩니다.

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/bookprintapi-python-sdk.git
cd bookprintapi-python-sdk

# 2. 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate      # macOS / Linux
# .venv\Scripts\activate       # Windows PowerShell

# 3. Python 패키지 설치
pip install -r requirements.txt

# 4. 환경변수 파일 생성
cp rememory/.env.example rememory/.env
```

`rememory/.env` 파일을 열어 발급받은 API Key를 입력합니다:

```env
BOOKPRINT_API_KEY=SBxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOOKPRINT_BASE_URL=https://api-sandbox.sweetbook.com/v1
```

### 실행 (터미널 2개 필요)

**터미널 1 — FastAPI 백엔드 (포트 8000)**

```bash
cd rememory
python main.py
```

**터미널 2 — React 프론트엔드 (포트 5173)**

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

> **Vite 개발 서버**가 `/api`, `/uploads`, `/data` 요청을 자동으로 백엔드(8000)로 프록시합니다.
>
> **최초 실행 시** 샘플 프로젝트 2건이 자동 생성됩니다. 설치 직후 인터뷰 확인 → 타임라인 → 미리보기 → 주문 전체 흐름을 바로 체험할 수 있습니다.

---

## 3. 사용한 API 목록

### 필수 API

| Method | Endpoint | SDK 메서드 | 용도 |
|--------|----------|-----------|------|
| POST | `/Books` | `client.books.create()` | 새 책 생성 (draft) |
| GET | `/Books/{bookUid}` | `client.books.get()` | 책 상세 조회 |
| POST | `/Books/{bookUid}/finalization` | `client.books.finalize()` | 책 확정 |
| DELETE | `/Books/{bookUid}` | `client.books.delete()` | 책 삭제 |
| POST | `/orders/estimate` | `client.orders.estimate()` | 가격 견적 조회 |
| POST | `/orders` | `client.orders.create()` | 주문 생성 |
| GET | `/orders/{orderUid}` | `client.orders.get()` | 주문 상태 조회 |
| POST | `/orders/{orderUid}/cancel` | `client.orders.cancel()` | 주문 취소 |

### 추가 활용 API

| Method | Endpoint | SDK 메서드 | 용도 |
|--------|----------|-----------|------|
| POST | `/Books/{bookUid}/photos` | `client.photos.upload()` | 인터뷰 사진 업로드 |
| GET | `/Books/{bookUid}/photos` | `client.photos.list()` | 업로드 사진 목록 |
| DELETE | `/Books/{bookUid}/photos/{fileName}` | `client.photos.delete()` | 사진 삭제 |
| POST | `/Books/{bookUid}/cover` | `client.covers.create()` | 표지 생성 |
| GET | `/Books/{bookUid}/cover` | `client.covers.get()` | 표지 조회 |
| DELETE | `/Books/{bookUid}/cover` | `client.covers.delete()` | 표지 삭제 (재빌드 시) |
| POST | `/Books/{bookUid}/contents` | `client.contents.insert()` | 내지 삽입 (간지·QnA·빈내지·발행면) |
| DELETE | `/Books/{bookUid}/contents` | `client.contents.clear()` | 전체 내지 삭제 (재편집) |
| GET | `/credits` | `client.credits.get_balance()` | 충전금 잔액 조회 |
| GET | `/credits/transactions` | `client.credits.get_transactions()` | 거래 내역 |
| POST | `/credits/sandbox/charge` | `client.credits.sandbox_charge()` | Sandbox 테스트 충전 |

### API 호출 흐름

```
충전금 확인
  → 책 생성 (draft)
  → 사진 업로드
  → 표지 생성
  → 내지 삽입 (챕터 간지 → QnA 페이지 → 빈내지 패딩 → 발행면)
  → 책 확정 (finalization)
  → 가격 견적
  → 주문
```

---

## 4. AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|---------|-----------|
| ChatGPT (OpenAI) | PRD 작성 및 기술 아키텍처 설계 |
| Gemini (Google) | PRD 검토 및 초기 개발 환경 세팅 |
| ChatGPT Codex (OpenAI) | 백엔드 코드 로직 리뷰 및 초기 버그 수정 |
| Antigravity (Google) | React + Vite 프론트엔드 전환 및 Tailwind CSS UI 초안 구현 |
| Claude Code (Anthropic) | BookPrint API SDK 연동 및 파라미터 디버깅 |
| Claude Code (Anthropic) | FastAPI 라우트 구조 설계, SQLAlchemy 데이터 모델 설계 |
| Claude Code (Anthropic) | Book Builder 빌드 파이프라인 로직 구현 및 오류 수정 |
| Claude Code (Anthropic) | 타임라인·공동 작성·질문 깊이 선택 등 신기능 구현 |
| Claude Code (Anthropic) | 시드 데이터 생성, README 작성 |

---

## 5. 설계 의도

### 왜 이 서비스를 선택했는가?

**"포토북이 아니라 이야기책"** — 기존 포토북 서비스는 사진 배치가 핵심이지만, Re:Memory는 **가족의 이야기** 자체가 핵심입니다.

부모님의 어린 시절, 첫사랑, 인생의 전환점 같은 이야기는 사진만으로는 전달할 수 없습니다. 질문 기반 인터뷰로 이야기를 끌어내고, 챕터로 구조화하여 회고록 형태의 책으로 만드는 것이 이 서비스의 핵심 가치입니다.

"왜 굳이 책이어야 하는가?"에 대한 답도 명확합니다. 카카오톡 사진과 블로그 글은 플랫폼이 사라지면 함께 사라지지만, 물리적인 책은 가족의 책장에 영구히 남습니다. **가족의 기억을 보존한다는 감성적 가치**와 **실제 책 제작**이라는 BookPrint API의 목적이 가장 자연스럽게 맞닿는 서비스라고 판단했습니다.

### 비즈니스 가능성

- **반복 선물 수요**: 어버이날·환갑·칠순·명절 등 연간 반복되는 기념일 시장
- **감성 희소성**: "세상에 하나뿐인 책"이라는 가치 — 일반 선물과 차별화
- **가격 경쟁력**: 전문 자서전 대행(50~200만원) 대비 셀프서비스로 접근성 확보
- **확장 가능성**: 커플 스토리북, 친구 우정북, 반려동물 성장북 등 인터뷰 템플릿 확장

### 더 시간이 있었다면 추가했을 기능

| 기능 | 설명 | 기대 효과 |
|------|------|-----------|
| **AI 문체 보정** | 입력 답변을 자연스러운 회고록 문체로 자동 교정 | 결과물 품질 향상 |
| **음성 인터뷰** | 녹음 → STT → 텍스트 변환으로 입력 편의성 향상 | 고령 사용자 접근성 개선 |
| **Webhook 알림** | 제작·배송 상태를 카카오 알림톡으로 전송 | 주문 후 경험 완성 |
| **PDF 다운로드** | 인쇄 외 디지털 PDF 버전 제공 | 추가 수익 모델 |
| **책 스타일 프리셋** | 감성 에세이 / 인터뷰집 / 다큐 등 톤 선택 | 개인화 완성도 향상 |

---

## 기술 스택

| 계층 | 기술 |
|------|------|
| Backend | Python 3.10+ / FastAPI |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Database | SQLite + SQLAlchemy |
| API 연동 | bookprintapi-python-sdk (이 저장소) |
| 이미지 처리 | Pillow |

---

## 프로젝트 구조

```
bookprintapi-python-sdk/
├── bookprintapi/                # BookPrint API Python SDK
├── rememory/                    # FastAPI 백엔드 (포트 8000)
│   ├── main.py                  # 앱 진입점
│   ├── config.py                # 환경변수
│   ├── database.py              # DB 엔진 + 마이그레이션 + 시드
│   ├── models.py                # SQLAlchemy 모델
│   ├── seed.py                  # 더미 데이터 생성
│   ├── routes/
│   │   ├── projects.py          # 프로젝트 CRUD · 공유 토큰
│   │   ├── interviews.py        # 답변·사진 저장, 책 빌드
│   │   └── orders.py            # 확정·주문·크레딧
│   ├── services/
│   │   ├── bookprint.py         # SDK 래퍼 함수
│   │   └── book_builder.py      # DB → BookPrint API 파이프라인
│   ├── data/
│   │   ├── questions.json       # 챕터별 질문 풀 (템플릿 × 챕터 × 3문항)
│   │   ├── seed.json            # 더미 프로젝트 데이터
│   │   └── sample_photos/       # 자동 생성 샘플 이미지
│   ├── uploads/                 # 사용자 업로드 사진
│   ├── .env.example             # 환경변수 템플릿
│   └── requirements.txt
├── frontend/                    # React 18 + Vite 프론트엔드 (포트 5173)
│   └── src/
│       ├── App.jsx              # 라우터 정의
│       ├── lib/api.js           # API 클라이언트
│       └── pages/
│           ├── Landing.jsx      # 프로젝트 목록
│           ├── ProjectCreate.jsx # 프로젝트 생성 (템플릿·깊이 선택)
│           ├── Interview.jsx    # 인터뷰 위자드 + 공유 링크
│           ├── Timeline.jsx     # 인생 타임라인
│           ├── SharedInterview.jsx # 공동 작성 (공유 링크 참여)
│           ├── Preview.jsx      # 책 미리보기
│           ├── Order.jsx        # 주문 페이지
│           └── Complete.jsx     # 주문 완료
├── examples/                    # SDK 사용 예제
└── requirements.txt             # Python 의존성
```

---

## 라이선스

MIT License
