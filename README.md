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
| **인터뷰 위자드** | 챕터별 가이드 질문에 텍스트 답변 + 사진 업로드 (자동 저장) |
| **인터뷰 깊이 선택** | 빠르게(5문항) / 보통(10문항) / 깊이 있게(15문항) 중 선택 |
| **무작위 질문 선정** | 풀에서 매번 다른 질문 조합 — 프로젝트마다 새로운 인터뷰 |
| **자동 책 편집** | 답변·사진을 간지 → QnA 본문 → 빈내지 패딩 → 발행면 순으로 자동 구성 |
| **사진 포함 인쇄** | 사진이 있는 질문은 사진 포함 템플릿으로 분기해 책 본문에 직접 인쇄 |
| **표지 자동 생성** | 책 제목·날짜·대표 사진으로 표지 생성 |
| **책 미리보기** | 완성된 회고록을 챕터별로 웹에서 확인 |
| **인생 타임라인** | 답변에 인생 시기를 태깅하면 시간 순 타임라인으로 시각화 |
| **공동 작성** | 공유 링크로 가족이 함께 답변 기여 (기여자 이름 표시, 원본 답변 보존) |
| **간지 커스터마이징** | 챕터별 간지 포함/제외 토글, 템플릿 선택 |
| **Demo 모드** | 샘플 회고록을 읽기 전용으로 체험 |
| **주문·배송** | 배송지 입력 → 크레딧 결제 → 실물 책 주문 (Sandbox 환경) |
| **크레딧 관리** | 잔액 조회 및 Sandbox 테스트 충전 |

---

## 2. 실행 방법

> **필요한 것**: Python 3.11+, Node.js 20+, BookPrint API Sandbox Key

### 설치

```bash
# 백엔드 패키지
pip install -r requirements.txt

# 프론트엔드 패키지
cd frontend && npm install && cd ..
```

### 환경변수 설정

```bash
cp rememory/.env.example rememory/.env
```

`rememory/.env` 파일에 아래 값을 입력합니다.

```env
BOOKPRINT_API_KEY=SBxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOOKPRINT_BASE_URL=https://api-sandbox.sweetbook.com/v1
```

<details>
<summary>템플릿 UID 및 추가 옵션 (파트너 포털에서 확인)</summary>

```env
BOOK_SPEC_UID=SQUAREBOOK_HC
TPL_COVER=79yjMH3qRPly
TPL_GANJI=5M3oo7GlWKGO
TPL_QNA=5B4ds6i0Rywx
TPL_QNA_WITH_PHOTO=46VqZhVNOfAp
TPL_BLANK=2mi1ao0Z4Vxl
TPL_PUBLISH=5nhOVBjTnIVE

# 간지 템플릿 여러 개일 때 (미리보기 드롭다운에 표시됨)
# GANJI_TEMPLATE_OPTIONS=5M3oo7GlWKGO:클래식,AbCdEfGhIjKl:모던
```
</details>

### 실행

```bash
# 터미널 1 — 백엔드 (포트 8000)
cd rememory && python main.py

# 터미널 2 — 프론트엔드 (포트 5173)
cd frontend && npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

> 최초 실행 시 샘플 프로젝트가 자동 생성됩니다. 설치 직후 인터뷰 → 타임라인 → 미리보기 → 주문 전체 흐름을 바로 체험할 수 있습니다.

---

## 3. 테스트

### 백엔드 통합 테스트

```bash
pip install -r requirements-dev.txt
pytest -q
```

BookPrint API와 빌드 파이프라인은 픽스처로 모킹되므로 **API 키 없이** 실행됩니다.

| 테스트 | 검증 내용 |
|--------|-----------|
| `test_full_primary_user_journey` | 프로젝트 생성 → 답변 → 사진 → 공유 → 빌드 → 확정 → 주문 → 취소 → 삭제 전체 플로우 |
| `test_build_requires_at_least_one_answer_and_supports_rebuild` | 답변 없는 빌드 차단, 재빌드 후 `book_uid` 리셋 검증 |
| `test_uploaded_photo_is_removed_when_deleted` | 사진 삭제 시 파일시스템·DB 동시 삭제 |
| `test_demo_project_is_listed_and_opened_read_only` | Demo 프로젝트 읽기 전용 접근 |
| `test_shared_answers_are_accumulated_without_overwriting_owner_answer` | 공동 작성 시 원본 답변 보존 확인 |
| `test_book_builder_uses_photo_qna_template_when_photo_exists` | 사진 있는 QnA → 사진 포함 템플릿 분기 검증 |
| `test_remaining_api_endpoints_and_representative_errors` | 간지 설정, 크레딧, 권한 오류, 상태 전이 오류, 사진 초과 등 |

### 프론트엔드 테스트

```bash
cd frontend

# 단위 테스트만
npm run test:unit

# CI 전체 (빌드 검증 → 단위 → E2E)
npm run test:ci
```

`test:ci` 순서: `vite build` → `vitest run` → `playwright test` (빌드된 결과물로 E2E 실행)

---

## 4. 사용한 API 목록

### 책 / 콘텐츠

| Method | Endpoint | SDK 메서드 | 용도 |
|--------|----------|-----------|------|
| `POST` | `/Books` | `client.books.create()` | 새 책 생성 (draft) |
| `DELETE` | `/Books/{bookUid}` | `client.books.delete()` | 책 삭제 (재빌드 시) |
| `POST` | `/Books/{bookUid}/finalization` | `client.books.finalize()` | 책 확정 (PDF 생성) |
| `POST` | `/Books/{bookUid}/photos` | `client.photos.upload()` | 사진 업로드 |
| `POST` | `/Books/{bookUid}/cover` | `client.covers.create()` | 표지 생성 |
| `POST` | `/Books/{bookUid}/contents` | `client.contents.insert()` | 내지 삽입 (간지·QnA·빈내지·발행면) |

### 주문 / 크레딧

| Method | Endpoint | SDK 메서드 | 용도 |
|--------|----------|-----------|------|
| `POST` | `/orders/estimate` | `client.orders.estimate()` | 수량별 가격 견적 |
| `POST` | `/orders` | `client.orders.create()` | 주문 생성 |
| `GET` | `/orders/{orderUid}` | `client.orders.get()` | 주문 상태 조회 |
| `POST` | `/orders/{orderUid}/cancel` | `client.orders.cancel()` | 주문 취소 |
| `GET` | `/credits` | `client.credits.get_balance()` | 크레딧 잔액 조회 |
| `POST` | `/credits/sandbox/charge` | `client.credits.sandbox_charge()` | Sandbox 테스트 충전 |

### API 호출 흐름

```
크레딧 확인
  → 책 생성 (draft)
  → 사진 업로드
  → 표지 생성
  → 내지 삽입 (챕터 간지 → QnA 페이지 → 빈내지 패딩 → 발행면)
  → 책 확정 (finalization)
  → 가격 견적
  → 주문
```

### 템플릿 매핑

| 용도 | 템플릿 UID |
|------|-----------|
| 표지 | `79yjMH3qRPly` |
| 간지 | `5M3oo7GlWKGO` |
| QnA 본문 (텍스트 전용) | `5B4ds6i0Rywx` |
| QnA 본문 (사진 포함) | `46VqZhVNOfAp` |
| 빈 내지 | `2mi1ao0Z4Vxl` |
| 발행면 | `5nhOVBjTnIVE` |

---

## 5. AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|---------|-----------|
| ChatGPT (OpenAI) | PRD 작성 및 기술 아키텍처 설계 |
| Gemini (Google) | PRD 검토 및 초기 개발 환경 세팅 |
| ChatGPT Codex (OpenAI) | 백엔드 코드 로직 리뷰 및 초기 버그 수정 |
| Antigravity (Google) | React + Vite 프론트엔드 전환 및 Tailwind CSS UI 초안 구현 |
| Claude Code (Anthropic) | BookPrint API SDK 연동 및 템플릿 파라미터 디버깅 |
| Claude Code (Anthropic) | FastAPI 라우트 구조 설계, SQLAlchemy 데이터 모델 설계 |
| Claude Code (Anthropic) | Book Builder 빌드 파이프라인 구현 및 오류 수정 |
| Claude Code (Anthropic) | 공동 작성 보호, Demo 모드, 사진 인쇄 분기 등 신기능 구현 |
| Claude Code (Anthropic) | 예외 처리 보강, 시드 데이터 생성, README 작성 |

---

## 6. 설계 의도

### 왜 이 서비스를 선택했는가?

**"포토북이 아니라 이야기책"** — 기존 포토북 서비스는 사진 배치가 핵심이지만, Re:Memory는 **가족의 이야기** 자체가 핵심입니다.

부모님의 어린 시절, 첫사랑, 인생의 전환점 같은 이야기는 사진만으로는 전달할 수 없습니다. 질문 기반 인터뷰로 이야기를 끌어내고, 챕터로 구조화하여 회고록 형태의 책으로 만드는 것이 핵심 가치입니다.

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
| **AI 인터뷰어** | 답변 내용을 바탕으로 후속 질문 자동 생성 | 회고록 깊이 향상 |
| **판형 선택, 템플릿 선택 추가** | 사용자가 판형, 템플릿을 선택 가능 | 가지각색의 책 생성 가능 |

---

## 기술 스택

| 계층 | 기술 |
|------|------|
| Backend | Python 3.11+ / FastAPI |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS |
| Database | SQLite + SQLAlchemy |
| API 연동 | bookprintapi-python-sdk (이 저장소) |
| 이미지 처리 | Pillow |
| 테스트 | pytest · Vitest · Playwright |

---

## 프로젝트 구조

```
bookprintapi-python-sdk/
├── bookprintapi/                # BookPrint API Python SDK
├── rememory/                    # FastAPI 백엔드 (포트 8000)
│   ├── main.py                  # 앱 진입점
│   ├── config.py                # 환경변수 (API Key, 템플릿 UID, 간지 옵션)
│   ├── database.py              # DB 엔진 + 마이그레이션 + 시드
│   ├── models.py                # SQLAlchemy 모델 (Project, Chapter, QnA, Photo, Contribution)
│   ├── seed.py                  # 더미 데이터 생성
│   ├── routes/
│   │   ├── projects.py          # 프로젝트 CRUD · 간지 설정 · 공유 토큰
│   │   ├── interviews.py        # 답변·사진 저장, 책 빌드
│   │   └── orders.py            # 확정·재빌드·주문·크레딧
│   ├── services/
│   │   ├── bookprint.py         # SDK 래퍼 함수
│   │   ├── book_builder.py      # DB → BookPrint API 빌드 파이프라인
│   │   └── qna_merge.py         # 공동 작성 답변 병합 로직
│   └── data/
│       ├── questions.json       # 질문 템플릿
│       ├── seed.json            # 더미 프로젝트 데이터
│       └── sample_photos/       # 자동 생성 샘플 이미지
├── frontend/                    # React 19 + Vite 프론트엔드 (포트 5173)
│   └── src/pages/
│       ├── Landing.jsx          # 프로젝트 목록 + 삭제
│       ├── ProjectCreate.jsx    # 프로젝트 생성 (템플릿·깊이 선택)
│       ├── Interview.jsx        # 인터뷰 위자드 + 공유 링크
│       ├── Timeline.jsx         # 인생 타임라인
│       ├── SharedInterview.jsx  # 공동 작성 (공유 링크 참여)
│       ├── Preview.jsx          # 책 미리보기 + 간지 커스터마이징
│       ├── Order.jsx            # 주문 페이지
│       └── Complete.jsx         # 주문 완료
├── tests/
│   ├── conftest.py              # 픽스처 (격리 DB, BookPrint API 모킹)
│   └── test_user_journey.py     # 7개 통합 테스트
├── requirements.txt
├── requirements-dev.txt
└── examples/                    # SDK 사용 예제
```

---

## 7. 트러블슈팅 & 트레이드오프

개발 과정에서 마주친 주요 문제와 의사결정을 기록합니다.

---

### 1. Preview 30p vs Order 26p — 페이지 수 불일치

**문제**
미리보기에서는 30페이지로 표시되는데 결제 상세에서는 26페이지가 표시됐습니다.

**원인**
미리보기는 현재 DB의 답변·간지 설정을 기반으로 프론트에서 계산한 예측값이고, 결제 상세는 마지막 빌드·확정 시 BookPrint API가 반환한 실제값입니다. 빌드 이후 간지 설정을 바꾸면 두 값이 달라집니다.

**해결 & 트레이드오프**
예상 페이지 수 표시 자체를 제거하고, 간지 포함 여부에 따른 +2p / −2p 변화 지표만 남겼습니다. 확정 시 `ganjiDirty` 상태를 체크해 설정이 바뀐 경우 "재생성 후 확정" 옵션을 제공합니다.
> 트레이드오프: 확정 전에 정확한 페이지 수를 미리 볼 수 없게 됐지만, 잘못된 숫자로 인한 혼란을 제거했습니다.

---

### 2. finalize 502 오류 — 최소 페이지 미달

**문제**
간지를 모두 끄면 페이지 수가 적어져 BookPrint API가 400을 반환하고 서버가 502로 전달했습니다.

**원인**
재시도 조건이 오류 메시지에서 `"최소 페이지"` 텍스트를 찾는 방식이었는데, API가 영어 메시지를 반환하면 조건에 걸리지 않았습니다. 또한 `book_builder`에 API 최소 페이지 요건(20p)이 반영되지 않아 빌드 단계부터 페이지가 부족했습니다.

**해결**
재시도 조건을 `status_code == 400` 체크로 변경하고, `book_builder`에 `API_MIN_PAGES = 20` 하한선을 추가해 빌드 단계에서 미리 빈 페이지를 채웁니다.

---

### 3. estimate 502 오류 — book_uid = None

**문제**
rebuild 직후 estimate API를 호출하면 502가 발생했습니다.

**원인**
`rebuild_book`이 `book_uid`를 `None`으로 초기화합니다. 이 상태에서 estimate 엔드포인트가 `None`을 BookPrint API에 그대로 전달했습니다.

**해결**
estimate 엔드포인트에서 `book_uid` None 체크를 추가해 404를 조기 반환합니다.

---

### 4. 취소 후 라우팅 — order vs preview

**문제**
주문 취소 후 어디로 보내야 하는지 결정이 필요했습니다.

**분석**
`finalized` 상태에서는 `rebuild` 엔드포인트가 막혀 있어 Preview 페이지로 이동해도 rebuild가 400 에러를 냅니다. 기술적으로 rebuild를 허용할 수 있지만, 이는 BookPrint에 완전히 새 책을 만드는 작업이라 "뒤로 가기"가 아닌 "새 책 제작"에 해당합니다.

**결론**
취소 후에는 동일한 확정 책으로 재주문할 수 있도록 `/order`로 이동하는 흐름을 유지했습니다. 내용을 변경하고 싶다면 홈에서 프로젝트를 삭제하고 새로 만드는 것이 의미상 올바른 흐름입니다.

---

### 5. E2E 테스트가 실제 빌드를 검증하지 않음

**문제**
Playwright E2E가 `npm run dev`(소스 기반 개발 서버) 위에서 실행되고 있었습니다.

**원인**
`playwright.config.js`의 `webServer`가 `npm run dev`로 설정되어 실제 배포 빌드 결과물과 다를 수 있었습니다.

**해결 & 트레이드오프**
`npm run preview`(빌드 결과물 서빙)로 변경했습니다.
> 트레이드오프: 테스트 실행 전 빌드가 필요해 CI 시간이 늘어나지만, 실제 배포 환경에 가까운 검증이 가능합니다.

---

### 6. 시드 샘플 사진 삭제 버그

**문제**
홈에서 데모 프로젝트를 삭제하면 `data/sample_photos/` 안의 파일이 모두 삭제됐습니다.

**원인**
`delete_project`가 `photo.local_path`를 경로 검사 없이 `os.remove()`했습니다. 사용자 업로드 사진(`uploads/`)과 시드 사진(`data/sample_photos/`)을 구분하지 않았습니다.

**해결**
`os.path.realpath()`로 경로를 정규화한 뒤 `UPLOAD_DIR` 하위 파일만 삭제하도록 수정했습니다.

---

### 7. Idempotency-Key 헤더 변경

**문제**
SDK가 중복 요청 방지를 위해 `X-Transaction-ID` 헤더를 사용하고 있었는데 BookPrint API 스펙이 `Idempotency-Key`로 변경됐습니다.

**해결**
SDK 내 헤더명을 `Idempotency-Key`로 일괄 변경했습니다. 외부 API 스펙 변화에 SDK가 직접 노출되는 구조적 취약점이기도 합니다.

---

## 라이선스

MIT License
