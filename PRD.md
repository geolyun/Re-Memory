# 📖 PRD: MemoryBook (기억한다)

### *"가족의 기억이 사라지기 전에, 인터뷰를 책으로 남기다"*

> **Version**: 4.0 Final (SDK 분석 반영)  
> **Last Updated**: 2026-04-01  
> **Tech Stack**: Python (FastAPI + Jinja2)  
> **SDK**: bookprintapi-python-sdk (v0.1.0)

---

## 1. 제품 개요 (Product Overview)

| 항목 | 내용 |
|------|------|
| **서비스명** | MemoryBook (기억한다) |
| **한 줄 소개** | 가족 인터뷰 질문에 답하고 사진을 올리면, 자동으로 챕터가 구성된 회고록 책을 제작하는 웹 서비스 |
| **타겟 사용자** | 부모님/조부모님께 특별한 선물을 하고 싶은 20~40대 자녀 세대 |
| **핵심 가치** | 가족의 이야기를 영구적인 물리책으로 보존하는 경험 |
| **연동 API** | Book Print API — Sandbox 환경 (`api-sandbox.sweetbook.com`) |
| **개발 형태** | Python 풀스택 단일 저장소 (Monorepo) |

### 제품 목표

1. 가족의 기억과 삶의 이야기를 질문 기반으로 쉽게 수집한다.
2. 수집된 인터뷰와 사진을 챕터별 책 구조로 자동 정리한다.
3. Book Print API를 통해 실제 책 제작 경험까지 연결한다.

---

## 2. 문제 정의 (Problem Statement)

### 해결하려는 문제

- 부모님·조부모님의 인생 이야기는 **구술로만 전해지다가 시간이 지나면 사라진다.**
- 가족 회고록을 만들고 싶어도 **어디서부터 시작해야 할지 모른다.**
- 전문 자서전 대행 서비스는 **수십~수백만 원**으로 비용 부담이 크다.
- 기존 포토북 서비스는 **사진 중심**이라 이야기 자체를 기록·보존하는 경험에 한계가 있다.

### 기회

- "어떤 질문을 하면 되는지"를 서비스가 안내해주면 진입 장벽이 사라진다.
- 답변 + 사진만 입력하면 자동으로 챕터가 구성되어 즉시 책으로 제작할 수 있다.
- 어버이날, 환갑, 칠순, 명절 등 **선물 시즌**에 강력한 수요가 존재한다.

---

## 3. 타겟 사용자 (Target Users)

### 주요 페르소나: 김민지 (29세, 직장인)

| 항목 | 내용 |
|------|------|
| **상황** | 올해 아버지 환갑, 특별한 선물을 준비하고 싶음 |
| **고민** | 아버지의 젊은 시절 이야기를 자녀들이 모른다는 걸 최근 깨달음 |
| **니즈** | 간단하게 아버지 이야기를 정리해서 가족 모두에게 나눠줄 수 있는 책 |
| **기술 수준** | 앱/웹 사용에 익숙, 복잡한 편집 도구는 부담 |
| **기대** | 질문 가이드로 쉽게 입력, 예쁘게 자동 편집, 바로 주문 |

### 보조 페르소나: 이서준 (34세, 프리랜서)

| 항목 | 내용 |
|------|------|
| **상황** | 돌아가신 할머니의 이야기를 기록해두지 못한 후회 |
| **니즈** | 어머니가 건강하실 때, 어머니의 인생 이야기를 책으로 남기고 싶음 |
| **기대** | 대화하듯 자연스럽게 기록할 수 있는 가이드 |

### 2차 타겟

- 자신의 삶을 정리해 자서전 형태로 남기고 싶은 중장년층
- 가족 행사·기념일을 위한 특별한 콘텐츠를 만들고 싶은 사용자

---

## 4. 핵심 가치 및 차별화 (Core Value Proposition)

| 구분 | 기존 포토북 서비스 | 자서전 대행 업체 | **MemoryBook** |
|------|-------------------|-----------------|----------------|
| 콘텐츠 | 사진 중심 | 전문 인터뷰 기반 | **질문 템플릿 기반 셀프 인터뷰** |
| 가격 | 2~5만원 | 50~200만원 | **저렴 (인쇄비만)** |
| 진입장벽 | 사진 선택·배치 필요 | 전문가 의존 | **질문에 답하기만 하면 끝** |
| 결과물 | 사진 앨범 | 텍스트 위주 자서전 | **이야기 + 사진 회고록** |
| 책의 당위성 | 낮음 (디지털로 충분) | 높음 | **높음 (기억 보존 = 책)** |

---

## 5. 스코프 정의 (Scope)

### MVP 포함 기능

- 인터뷰북 생성 (대상 정보 입력, 프로젝트 관리)
- 기본 질문 템플릿 제공 (6개 챕터, 6~8개 질문)
- 텍스트 답변 입력 + 사진 업로드
- 챕터 자동 구성, 표지 자동 생성, 발행면 삽입
- 최소 페이지(24p) 미달 시 빈내지 자동 패딩
- 책 미리보기 (웹 기반 페이지 뷰)
- Book Print API 연동 (책 생성 → 사진 업로드 → 내지 삽입 → 표지 → 확정 → 견적 → 주문)
- 충전금 잔액 확인 및 Sandbox 충전

### MVP 제외 기능

- 음성 녹음 업로드 / STT 변환
- AI 기반 답변 요약 / 문체 보정
- 다중 사용자 공동 편집
- 결제 시스템 자체 구현 (Sandbox 충전금 사용)
- 소셜 공유 기능
- 자유 레이아웃 편집

---

## 6. 사용자 시나리오 (User Scenario)

### 시나리오: 어버이날 선물

> 민지는 올해 아버지 환갑을 맞아 특별한 선물을 준비하고 싶다.  
> MemoryBook에 접속해 "새 인터뷰북 만들기"를 시작한다.  
> "아버지", "김영수"를 입력하고, 기본 질문 템플릿을 선택한다.  
> "어린 시절 가장 행복했던 기억은?" 같은 질문에 아버지와 대화하며 답변을 입력한다.  
> 오래된 가족 사진도 함께 업로드한다.  
> 모든 질문에 답한 뒤, 미리보기에서 자동으로 구성된 챕터를 확인한다.  
> "아버지의 시간"이라는 제목의 표지를 확인하고, 제작 요청을 완료한다.

---

## 7. 사용자 플로우 (User Flow)

```
[랜딩 페이지 접속]
       │
       ▼
[① 프로젝트 생성] ─── 대상 이름, 관계, 책 제목, 대표 사진
       │                → Backend: DB 저장
       │                → API: client.books.create()  ← bookUid 확보
       ▼
[② 인터뷰 작성] ───── 질문별 텍스트 답변 + 사진 업로드
       │                (스텝 위자드, 6~8개 질문)
       │                → Backend: 답변/사진 DB 임시 저장
       ▼
[③ 책 빌드] ────────── 일괄 API 호출 파이프라인
       │                → API: client.photos.upload() × N
       │                → API: client.contents.insert() × N (간지 + QnA)
       │                → API: 빈내지 패딩 (최소 24p 충족)
       │                → API: 발행면 삽입
       │                → API: client.covers.create()
       ▼
[④ 미리보기] ──────── 페이지별 미리보기 확인
       │                → 수정 시: contents.clear() 후 ② 복귀
       ▼
[⑤ 책 확정] ──────── 수정 불가 상태로 전환
       │                → API: client.books.finalize()
       │                → 페이지 부족 시 빈내지 추가 후 재시도
       ▼
[⑥ 주문] ─────────── 충전금 확인 → 견적 → 배송지 입력 → 주문
       │                → API: client.credits.get_balance()
       │                → API: client.orders.estimate()
       │                → API: client.orders.create()
       ▼
[⑦ 완료 화면] ─────── 주문 번호, 상태 확인
                        → API: client.orders.get()
```

---

## 8. 기능 요구사항 (Functional Requirements)

### 8.1 인터뷰북 생성

| 항목 | 상세 |
|------|------|
| **설명** | 새 회고록 프로젝트를 시작한다 |
| **입력** | 인터뷰 대상 이름, 관계 (부모/조부모/기타), 책 제목 (자동 추천 + 직접 입력), 부제 (선택), 대표 사진 (선택) |
| **출력** | 프로젝트 생성 + Book Print API에 draft 상태 책 생성 → `bookUid` DB 매핑 |
| **우선순위** | P0 |

### 8.2 질문 템플릿 제공

| 챕터 | 대표 질문 | 의도 |
|------|-----------|------|
| 1. 어린 시절 | "어린 시절 가장 행복했던 기억은 무엇인가요?" | 도입부, 따뜻한 시작 |
| 2. 학창 시절 | "학교 다닐 때 가장 기억에 남는 순간이 있나요?" | 성장 과정 |
| 3. 첫 사회생활 | "처음 돈을 벌었을 때 어떤 기분이었나요?" | 독립과 책임 |
| 4. 사랑과 가족 | "배우자를 처음 만났을 때 이야기를 들려주세요." | 감성적 하이라이트 |
| 5. 인생의 전환점 | "살면서 가장 힘들었지만 극복한 순간은?" | 깊이와 울림 |
| 6. 지금, 하고 싶은 말 | "가족에게 전하고 싶은 이야기가 있다면?" | 마무리 메시지 |

### 8.3 답변 입력

- 사용자는 각 질문에 텍스트 답변을 입력할 수 있어야 한다.
- 질문을 건너뛰고 다음 단계로 이동할 수 있어야 한다.
- 작성 중 **임시 저장**이 가능해야 한다 (자동 저장 권장).
- 건너뛴 질문은 최종 책에서 자동 제외된다.

### 8.4 사진 업로드

- 각 챕터/질문별로 사진을 0~5장 업로드할 수 있어야 한다.
- 업로드된 사진은 썸네일 미리보기가 가능해야 한다.
- 사진 없이도 책 제작이 가능해야 한다.
- 서버 사이드에서 Pillow로 리사이즈 처리 (최대 2MB/장, JPEG/PNG 지원).

### 8.5 챕터 자동 구성 + 빈내지 패딩

- 시스템은 답변과 사진을 챕터별로 자동 정리해야 한다.
- 각 챕터는 **간지(구분 페이지) → 질문/답변 본문 → 사진 배치**로 구성된다.
- 입력되지 않은 질문은 최종 책에서 제외하여 빈 페이지가 없도록 한다.
- **최소 24페이지 충족 필요**: 간지 + 내지 합계가 24p 미만이면 빈내지 템플릿으로 패딩한다.
- **발행면(Publish page)**: 모든 내지 마지막에 발행면을 삽입한다 (제목, 발행일, 저자).

### 8.6 표지 자동 생성

- 입력한 책 제목, 부제, 대표 사진을 기반으로 표지를 생성한다.
- 사용자는 표지 제목을 수정할 수 있어야 한다.
- 표지 사진은 `photos.upload()`로 먼저 업로드 후 `covers.create()`에서 참조한다.

### 8.7 책 미리보기

- 생성된 회고록을 웹 화면에서 페이지별로 미리볼 수 있어야 한다.
- 표지 → 목차 → 챕터별 콘텐츠 순서로 확인 가능해야 한다.
- 수정이 필요하면 `contents.clear()` 후 인터뷰 작성 화면으로 돌아갈 수 있어야 한다.
- 고정 템플릿 기반으로 단순화하고, 자유 편집 기능은 제외한다.

### 8.8 Book Print API 연동

- 최종 미리보기 확인 후 책 제작 요청을 보낼 수 있어야 한다.
- 시스템은 DB 데이터를 Book Print API 요청 형식으로 변환해야 한다.
- `books.finalize()` 호출 시 페이지 부족 에러가 발생하면 빈내지를 추가 후 재시도한다.
- API 요청 성공/실패 결과를 사용자에게 명확히 보여줘야 한다.
- Sandbox 환경에서 동작하며, 실제 인쇄·배송은 이루어지지 않는다.

### 8.9 충전금 관리

- 주문 전 `credits.get_balance()`로 잔액을 확인한다.
- 잔액 부족 시 `credits.sandbox_charge()`로 테스트 충전을 안내한다.
- 견적 결과의 `creditSufficient` 값으로 주문 가능 여부를 판단한다.

---

## 9. Book Print API 연동 상세 (Python SDK 기반)

> **SDK 버전**: bookprintapi-python-sdk v0.1.0  
> **SDK 소스 분석 결과를 반영한 정확한 명세입니다.**

### SDK 설치 및 초기화

```python
# 설치 (프로젝트 루트에 SDK 디렉토리 배치 후)
# 방법 1: editable install
pip install -e ./bookprintapi-python-sdk

# 방법 2: sys.path 직접 추가
import sys
sys.path.insert(0, "./bookprintapi-python-sdk")
```

```python
from bookprintapi import Client, ApiError

# .env에서 BOOKPRINT_API_KEY, BOOKPRINT_BASE_URL 자동 로드
client = Client()

# 또는 직접 지정
client = Client(
    api_key="SBxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    environment="sandbox"  # → api-sandbox.sweetbook.com/v1
)
```

### .env 환경변수

```env
BOOKPRINT_API_KEY=SBxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOOKPRINT_BASE_URL=https://api-sandbox.sweetbook.com/v1
```

---

### Step 1. 충전금 확인 & 충전 (최초 1회)

```python
# 잔액 확인
credit = client.credits.get_balance()
balance = credit["data"]["balance"]
print(f"잔액: {balance:,.0f}원")

# Sandbox 테스트 충전 (잔액 부족 시)
client.credits.sandbox_charge(100000, memo="테스트 충전")
```

### Step 2. 책 생성 (프로젝트 시작 시)

```python
book = client.books.create(
    book_spec_uid="SQUAREBOOK_HC",  # 정사각 하드커버
    title="어머니의 회고록",
    creation_type="TEST"            # ⚠️ Sandbox에서는 반드시 "TEST"
)
book_uid = book["data"]["bookUid"]  # ⚠️ dict 접근, DB에 저장
```

> **주의**: `creation_type`은 Sandbox에서 `"TEST"`, 운영에서 `"NORMAL"` 사용

### Step 3. 사진 업로드

```python
upload = client.photos.upload(
    book_uid,
    "/path/to/family_photo.jpg"
)
file_name = upload["data"]["fileName"]  # ⚠️ dict 접근, DB에 저장

# 여러 장 업로드
results = client.photos.upload_multiple(
    book_uid,
    ["/path/to/img1.jpg", "/path/to/img2.jpg"]
)
```

### Step 4. 표지 생성

```python
# 표지 사진은 Step 3에서 업로드한 fileName으로 참조
client.covers.create(
    book_uid,
    template_uid="COVER_TEMPLATE_UID",  # ⚠️ 실제 UID는 API 문서에서 확인
    parameters={
        "title": "어머니의 회고록",
        "frontPhoto": file_name           # 업로드된 사진 파일명 참조
    }
)

# 또는 파일을 직접 업로드하며 표지 생성 ($upload 플레이스홀더 사용)
client.covers.create(
    book_uid,
    template_uid="COVER_TEMPLATE_UID",
    parameters={
        "title": "어머니의 회고록",
        "frontPhoto": "$upload"           # 파일 직접 첨부 시
    },
    files=["cover_photo.jpg"]             # 실제 파일 경로
)
```

### Step 5. 내지 삽입 (책 빌드 시 일괄 처리)

```python
import time

# 챕터 간지 삽입
client.contents.insert(
    book_uid,
    template_uid="GANJI_TEMPLATE_UID",    # ⚠️ 실제 UID 확인 필요
    parameters={
        "title": "1장. 어린 시절"
    }
)
time.sleep(0.5)  # API rate limit 고려

# 질문-답변 페이지 삽입
client.contents.insert(
    book_uid,
    template_uid="CONTENT_TEMPLATE_UID",  # ⚠️ 실제 UID 확인 필요
    parameters={
        "question": "어린 시절 가장 행복했던 기억은?",
        "answer": "사용자 답변 텍스트...",
        "photo": file_name                # 업로드된 사진 파일명 (없으면 생략)
    },
    break_before="page"                   # 새 페이지에서 시작
)
time.sleep(0.5)
```

> **⚠️ 템플릿 UID**: SDK 예제에서 확인된 실제 형식은 `"79yjMH3qRPly"`, `"5M3oo7GlWKGO"` 같은 영숫자 12자리입니다. 정확한 UID는 api.sweetbook.com 파트너 포털에서 확인해야 합니다.

### Step 6. 빈내지 패딩 + 발행면

```python
# 현재 페이지 수 계산: 간지(2p) + 내지 N개 + 발행면(1p)
current_pages = total_ganji_pages + total_content_pages
min_pages = 24
needed = min_pages - current_pages - 1  # 발행면 1p 제외

# 빈내지로 패딩
if needed > 0:
    for _ in range(needed):
        client.contents.insert(
            book_uid,
            template_uid="BLANK_TEMPLATE_UID",
            break_before="page"
        )
        time.sleep(0.5)

# 발행면 (마지막에 삽입)
client.contents.insert(
    book_uid,
    template_uid="PUBLISH_TEMPLATE_UID",
    parameters={
        "title": "어머니의 회고록",
        "publishDate": "2026.04.01",
        "author": "김민지"
    }
)
```

### Step 7. 책 확정 (Finalize)

```python
# 페이지 부족 시 자동 재시도 패턴
for attempt in range(5):
    try:
        result = client.books.finalize(book_uid)
        page_count = result["data"].get("pageCount", "?")
        print(f"확정 완료! {page_count}p")
        break
    except ApiError as e:
        if "최소 페이지 미달" in str(e.details):
            # 빈내지 4장 추가 후 재시도
            for _ in range(4):
                client.contents.insert(
                    book_uid,
                    template_uid="BLANK_TEMPLATE_UID",
                    break_before="page"
                )
                time.sleep(0.5)
        else:
            raise  # 다른 에러는 그대로 전파
```

> **중요**: finalize 후에는 내용 수정이 불가합니다. 미리보기에서 수정이 필요하면 `contents.clear(book_uid)`로 내지를 모두 삭제하고 다시 삽입해야 합니다.

### Step 8. 견적 조회

```python
estimate = client.orders.estimate(
    [{"bookUid": book_uid, "quantity": 1}]
)
est_data = estimate["data"]

paid_amount = est_data["paidCreditAmount"]      # 결제금액 (VAT 포함)
is_sufficient = est_data.get("creditSufficient") # 충전금 충분 여부

print(f"결제금액: {paid_amount:,.0f}원")
if not is_sufficient:
    print("충전금 부족! 충전 필요.")
```

### Step 9. 주문 생성

```python
order = client.orders.create(
    items=[{"bookUid": book_uid, "quantity": 1}],
    shipping={
        "recipientName": "김민지",
        "recipientPhone": "010-1234-5678",
        "postalCode": "06123",
        "address1": "서울특별시 강남구 테헤란로 123",
        "address2": "4층",
        "memo": "부재 시 경비실"
    },
    external_ref="MEMORYBOOK-001"  # 내부 주문 참조 ID (선택)
)
order_uid = order["data"]["orderUid"]
paid = order["data"]["paidCreditAmount"]
print(f"주문 완료: {order_uid}, 결제: {paid:,.0f}원")
```

### Step 10. 주문 상태 확인

```python
detail = client.orders.get(order_uid)
d = detail["data"]
print(f"상태: {d['orderStatusDisplay']} ({d['orderStatus']})")
print(f"수령인: {d['recipientName']}")
```

### 주문 상태 코드

| 상태 | 코드 | 설명 | 취소 가능 | 배송지 변경 |
|------|:----:|------|:---------:|:----------:|
| PAID | 20 | 결제 완료 | O | O |
| PDF_READY | 25 | PDF 생성 완료 | O | O |
| CONFIRMED | 30 | 제작 확정 | X | O |
| IN_PRODUCTION | 40 | 인쇄 중 | X | X |
| PRODUCTION_COMPLETE | 50 | 인쇄 완료 | X | X |
| SHIPPED | 60 | 발송 완료 | X | X |
| DELIVERED | 70 | 배송 완료 | X | X |
| CANCELLED | 80/81 | 취소됨 | — | — |

### 에러 처리

```python
from bookprintapi import Client, ApiError

try:
    client.orders.create(...)
except ApiError as e:
    print(f"오류: {e}")                 # [400] Bad Request
    print(f"상태코드: {e.status_code}")  # 400
    print(f"상세: {e.details}")          # ["Book을 찾을 수 없습니다: bk_invalid"]

    if e.status_code == 402:
        print("충전금 부족! 충전 후 다시 시도하세요.")
```

### API 빌드 파이프라인 요약

```
┌─ 사전 준비 ─────────────────────────────────────────┐
│  credits.get_balance()         → 잔액 확인           │
│  credits.sandbox_charge()      → 부족 시 테스트 충전  │
└─────────────────────────────────────────────────────┘
         │
┌─ 책 생성 ──────────────────────────────────────────┐
│  books.create(creation_type="TEST")  → bookUid 확보 │
└─────────────────────────────────────────────────────┘
         │
┌─ 콘텐츠 구성 (일괄 처리) ──────────────────────────┐
│  photos.upload() × N           → fileName 확보      │
│  covers.create()               → 표지 생성          │
│  contents.insert() × N         → 간지 + QnA 페이지  │
│  contents.insert() × padding   → 빈내지 (24p 충족)  │
│  contents.insert()             → 발행면             │
└─────────────────────────────────────────────────────┘
         │
┌─ 확정 ────────────────────────────────────────────┐
│  books.finalize()              → 수정 불가 상태     │
│  (페이지 부족 시 빈내지 추가 후 재시도)              │
└─────────────────────────────────────────────────────┘
         │
┌─ 주문 ────────────────────────────────────────────┐
│  orders.estimate()             → 가격 확인          │
│  orders.create()               → 주문 완료          │
│  orders.get()                  → 상태 확인          │
└─────────────────────────────────────────────────────┘
```

---

## 10. 화면 설계 (Key Screens)

### 10.1 랜딩 페이지 (홈)

- 히어로 섹션: "가족의 이야기를 한 권의 책으로" + CTA 버튼
- 3단계 안내: ① 질문에 답하기 → ② 자동 편집 → ③ 책으로 받기
- 예시 책 이미지
- 저장된 인터뷰북 목록 (재접속 시)
- 충전금 잔액 표시 (관리자용)

### 10.2 프로젝트 생성 화면

- 입력: 인터뷰 대상 이름, 관계 (드롭다운), 책 제목 (자동 추천 + 직접 입력), 부제, 대표 사진
- "시작하기" 버튼

### 10.3 인터뷰 작성 화면 (위자드)

- 상단: 진행률 바 (1/6 ~ 6/6)
- 중앙: 질문 텍스트 (큰 폰트, 감성적 톤)
- 하단: 텍스트 입력 영역 + 사진 업로드 (드래그앤드롭)
- 버튼: "이전", "다음", "건너뛰기"
- 자동 임시 저장 표시

### 10.4 미리보기 화면

- 좌측: 페이지 썸네일 네비게이션
- 중앙: 현재 페이지 확대 뷰 (표지 → 목차 → 챕터)
- 하단: "수정하기" / "제작 요청" 버튼
- 총 페이지 수 표시

### 10.5 주문 화면

- 충전금 잔액 표시
- 견적 금액 표시 (상품금액, 배송비, VAT 포함 결제금액)
- 배송지 입력 폼 (이름, 전화번호, 우편번호, 주소1, 주소2, 메모)
- "주문하기" 버튼

### 10.6 완료 화면

- 주문 번호 및 상태 표시
- 결제 금액 및 잔여 충전금 표시
- "주문 상태 확인" / "주문 취소" 버튼

---

## 11. 데이터 모델 (Data Model)

### ERD 개요

```
User ─┬─< Project ─┬─< Chapter ─< QnA ─< Photo
      │             ├── book_uid (API)
      │             └── order_uid (API)
```

### User (사용자)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer, PK | 사용자 고유 ID |
| email | String | 이메일 |
| name | String | 이름 |
| created_at | DateTime | 가입일 |

### Project (프로젝트)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer, PK | 프로젝트 고유 ID |
| user_id | FK → User | 소유자 |
| title | String | 책 제목 |
| subtitle | String (nullable) | 부제 |
| subject_name | String | 인터뷰 대상 이름 |
| relationship_type | String | 관계 (부모/조부모/기타) |
| cover_image_url | String (nullable) | 대표 사진 로컬 경로 |
| cover_api_filename | String (nullable) | **표지 사진 API 업로드 파일명** |
| book_uid | String (nullable) | **Book Print API 책 UID** (예: `bk_xxxx`) |
| order_uid | String (nullable) | **Book Print API 주문 UID** (예: `or_xxxx`) |
| status | String | draft / writing / building / finalized / ordered |
| page_count | Integer (nullable) | **확정 후 총 페이지 수** |
| created_at | DateTime | 생성일 |
| updated_at | DateTime | 수정일 |

### Chapter (챕터)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer, PK | 챕터 고유 ID |
| project_id | FK → Project | 소속 프로젝트 |
| title | String | 챕터 제목 (예: "1장. 어린 시절") |
| order_index | Integer | 정렬 순서 |

### QnA (질문/답변)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer, PK | QnA 고유 ID |
| chapter_id | FK → Chapter | 소속 챕터 |
| question_text | Text | 질문 내용 |
| answer_text | Text (nullable) | 답변 내용 |
| order_index | Integer | 정렬 순서 |
| skipped | Boolean | 건너뛰기 여부 |

### Photo (사진)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | Integer, PK | 사진 고유 ID |
| qna_id | FK → QnA | 소속 QnA |
| project_id | FK → Project | 소속 프로젝트 |
| image_url | String | 로컬 저장 경로 |
| api_file_name | String (nullable) | **Book Print API 업로드 후 fileName** |
| caption | String (nullable) | 사진 설명 |

### SQLAlchemy 모델

```python
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    projects = relationship("Project", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    subtitle = Column(String, nullable=True)
    subject_name = Column(String)
    relationship_type = Column(String)
    cover_image_url = Column(String, nullable=True)
    cover_api_filename = Column(String, nullable=True)
    book_uid = Column(String, nullable=True)       # API 책 UID
    order_uid = Column(String, nullable=True)       # API 주문 UID
    status = Column(String, default="draft")
    page_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="projects")
    chapters = relationship("Chapter", back_populates="project", order_by="Chapter.order_index")

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String)
    order_index = Column(Integer)
    project = relationship("Project", back_populates="chapters")
    qnas = relationship("QnA", back_populates="chapter", order_by="QnA.order_index")

class QnA(Base):
    __tablename__ = "qnas"
    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    question_text = Column(Text)
    answer_text = Column(Text, nullable=True)
    order_index = Column(Integer)
    skipped = Column(Boolean, default=False)
    chapter = relationship("Chapter", back_populates="qnas")
    photos = relationship("Photo", back_populates="qna")

class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    qna_id = Column(Integer, ForeignKey("qnas.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    image_url = Column(String)
    api_file_name = Column(String, nullable=True)  # API 업로드 후 fileName
    caption = Column(String, nullable=True)
    qna = relationship("QnA", back_populates="photos")
```

---

## 12. 기술 아키텍처 (Technical Architecture)

### 12.1 기술 스택

| 계층 | 기술 | 선정 이유 |
|------|------|-----------|
| **백엔드** | Python 3.10+ / FastAPI | 비동기 지원, 자동 API 문서, SDK와 동일 언어 |
| **템플릿 엔진** | Jinja2 | FastAPI 내장 지원, 서버 사이드 렌더링 |
| **스타일링** | Tailwind CSS (CDN) | 빌드 도구 없이 바로 사용, 빠른 UI 개발 |
| **프론트 인터랙션** | Vanilla JS (Fetch API) | 별도 빌드 불필요, 가벼운 AJAX 처리 |
| **데이터베이스** | SQLite + SQLAlchemy | 별도 서버 불필요, 파일 기반 경량 DB |
| **이미지 처리** | Pillow | 리사이즈, 포맷 변환 |
| **파일 저장** | 로컬 파일시스템 (uploads/) | 과제 범위 내 간단 구현 |
| **API 연동** | bookprintapi-python-sdk v0.1.0 | 공식 SDK (requests 기반) |
| **환경변수** | python-dotenv | API Key 관리 |

### 12.2 프로젝트 디렉토리 구조

```
memorybook/
├── bookprintapi-python-sdk/     # SDK (서브디렉토리 or pip install -e)
│   └── bookprintapi/
│       ├── __init__.py          # Client, ApiError 등
│       ├── client.py
│       ├── books.py
│       ├── photos.py
│       ├── covers.py
│       ├── contents.py
│       ├── orders.py
│       ├── credits.py
│       └── webhook.py
│
├── main.py                      # FastAPI 앱 진입점
├── config.py                    # 설정 (환경변수 로드)
├── database.py                  # SQLAlchemy 엔진 & 세션
├── models.py                    # DB 모델
│
├── routes/
│   ├── __init__.py
│   ├── pages.py                 # HTML 페이지 라우트 (Jinja2)
│   ├── projects.py              # 프로젝트 CRUD API
│   ├── interviews.py            # 인터뷰 답변/사진 저장 API
│   └── orders.py                # 책 빌드/확정/주문 API
│
├── services/
│   ├── __init__.py
│   ├── bookprint_service.py     # Book Print API SDK 래핑
│   └── book_builder.py          # DB → API 일괄 호출 파이프라인
│
├── templates/                   # Jinja2 HTML 템플릿
│   ├── base.html
│   ├── index.html
│   ├── project_create.html
│   ├── interview.html
│   ├── preview.html
│   ├── order.html
│   └── complete.html
│
├── static/
│   ├── css/custom.css
│   ├── js/interview.js
│   └── images/
│
├── uploads/                     # 사용자 업로드 사진
├── data/
│   └── questions.json           # 기본 질문 템플릿
│
├── .env                         # BOOKPRINT_API_KEY, BOOKPRINT_BASE_URL
├── .env.example
├── requirements.txt
└── README.md
```

### 12.3 시스템 구성도

```
┌─────────────────────────────────────────────────┐
│              Client (Browser)                    │
│   Jinja2 HTML + Tailwind CSS + Vanilla JS        │
│                                                  │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐      │
│   │  Landing  │ │ Interview │ │ Preview  │      │
│   │   Page    │ │  Wizard   │ │  Viewer  │      │
│   └──────────┘ └───────────┘ └──────────┘      │
│   ┌──────────┐ ┌───────────┐                    │
│   │  Order   │ │ Complete  │                    │
│   │   Form   │ │   Page    │                    │
│   └──────────┘ └───────────┘                    │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (Form Submit / Fetch API)
┌──────────────────▼──────────────────────────────┐
│              FastAPI Server (Python)              │
│                                                  │
│   ┌──────────┐ ┌───────────────┐ ┌──────────┐  │
│   │  Routes   │ │   Services    │ │  Models   │  │
│   │ (pages,   │ │(bookprint_svc,│ │(SQLAlchemy│  │
│   │  API)     │ │ book_builder) │ │  + SQLite)│  │
│   └──────────┘ └───────┬───────┘ └──────────┘  │
│                         │                        │
│               ┌─────────▼─────────┐              │
│               │ bookprintapi SDK  │              │
│               │ (Client, ApiError)│              │
│               └─────────┬─────────┘              │
│                         │                        │
│   ┌──────────┐ ┌───────┴───┐                    │
│   │  SQLite  │ │  uploads/  │                    │
│   └──────────┘ └───────────┘                    │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS (requests 라이브러리)
          ┌────────▼─────────┐
          │  Book Print API  │
          │   (Sandbox)      │
          │ api-sandbox      │
          │ .sweetbook.com   │
          └──────────────────┘
```

### 12.4 백엔드 API 엔드포인트

| Method | Endpoint | 설명 | SDK 호출 |
|--------|----------|------|----------|
| GET | `/` | 랜딩 페이지 | — |
| GET | `/credits` | 충전금 잔액 확인 | `credits.get_balance()` |
| POST | `/api/credits/charge` | Sandbox 충전 | `credits.sandbox_charge()` |
| GET | `/projects/new` | 프로젝트 생성 폼 | — |
| POST | `/api/projects` | 새 프로젝트 생성 | `books.create()` |
| GET | `/projects/{id}` | 프로젝트 상세 | — |
| GET | `/projects/{id}/interview` | 인터뷰 위자드 | — |
| POST | `/api/projects/{id}/qna/{qna_id}` | 답변 저장 | — (DB만) |
| POST | `/api/projects/{id}/qna/{qna_id}/photos` | 사진 업로드 | — (로컬 저장) |
| POST | `/api/projects/{id}/build` | 책 빌드 (일괄) | `photos.upload()` → `contents.insert()` × N → `covers.create()` |
| GET | `/projects/{id}/preview` | 미리보기 | `books.get()` |
| POST | `/api/projects/{id}/rebuild` | 내지 초기화 후 재빌드 | `contents.clear()` → 재빌드 |
| POST | `/api/projects/{id}/finalize` | 책 확정 | `books.finalize()` |
| GET | `/projects/{id}/order` | 주문 폼 | `orders.estimate()` |
| POST | `/api/projects/{id}/order` | 주문 생성 | `orders.create()` |
| GET | `/projects/{id}/complete` | 완료 페이지 | `orders.get()` |
| POST | `/api/projects/{id}/order/cancel` | 주문 취소 | `orders.cancel()` |

---

## 13. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 요구사항 |
|------|----------|
| **반응형** | 데스크톱 우선 반응형 웹 (Tailwind 반응형 유틸리티) |
| **이미지 처리** | Pillow 리사이즈 (최대 2MB/장), JPEG/PNG |
| **에러 처리** | `ApiError` catch + 사용자 친화적 메시지, 재시도 안내 |
| **데이터 보존** | JS fetch 디바운싱 자동 임시 저장 |
| **보안** | API Key `.env` 서버 사이드 관리, 클라이언트 노출 금지 |
| **API 속도 제한** | `contents.insert()` 간 `time.sleep(0.5)` 적용 |
| **최소 페이지** | 24p 미만 시 빈내지 자동 패딩 |
| **데이터 격리** | user_id 기반 분리 저장 |

---

## 14. 마일스톤 및 일정 (Timeline)

### 1인 개발 기준 (4주)

| 주차 | 단계 | 작업 내용 |
|------|------|-----------|
| **Week 1** | 환경 세팅 + SDK 검증 | GitHub 저장소, Python venv, FastAPI 초기화, SDK 설치 (`pip install -e .`), **Sandbox Key 발급 + 테스트 충전**, SDK examples (`simple_books.py`, `simple_orders.py`) 실행하여 **실제 API 동작 확인**, DB 스키마 설계, 질문 JSON 작성 |
| **Week 2** | 백엔드 + API 파이프라인 | CRUD 라우트, 파일 업로드 (Pillow), **book_builder.py 작성** (DB→API 일괄 변환: 사진 업로드→간지→내지→빈내지 패딩→발행면→표지), **finalize 재시도 로직**, 견적/주문 라우트 |
| **Week 3** | 프론트엔드 | Jinja2 템플릿 (base, index, interview, preview, order, complete), Tailwind 스타일링, interview.js 위자드, 사진 드래그앤드롭 |
| **Week 4** | 연동 + 마무리 | 전체 플로우 연동, **Sandbox 실주문 테스트** (최소 1건 성공), UI 다듬기, 에러 처리, README 작성, GitHub 제출 |

### requirements.txt

```
fastapi>=0.104.0
uvicorn>=0.24.0
jinja2>=3.1.0
sqlalchemy>=2.0.0
python-dotenv>=1.0.0
python-multipart>=0.0.6
pillow>=10.0.0
aiofiles>=23.0.0
requests>=2.31.0
```

> **Note**: bookprintapi SDK는 `pip install -e ./bookprintapi-python-sdk`로 별도 설치하거나, `sys.path.insert`로 직접 참조

---

## 15. 성공 지표 (Success Metrics)

| 지표 | 목표 |
|------|------|
| **API 연동 완료** | Sandbox에서 책 생성 → 사진 업로드 → 내지 삽입 → 표지 → 빈내지 패딩 → 발행면 → 확정 → 견적 → 주문까지 정상 동작 |
| **핵심 플로우** | 프로젝트 생성 → 인터뷰 → 미리보기 → 주문 전 과정 시연 가능 |
| **코드 품질** | 구조화된 코드 (routes/services/models 분리), README에 실행 방법 명시 |
| **기획 의도** | "왜 이 서비스가 필요한가"가 랜딩 페이지에서 전달 |
| **UI/UX 완성도** | 직관적 위자드, 반응형 대응 |
| **Sandbox 시연** | 최소 1개 완성된 주문 흐름 시연 가능 |

---

## 16. 리스크 및 대응 (Risks & Mitigations)

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 템플릿 UID를 모름 | 높음 | Week 1에서 파트너 포털 확인 + SDK examples 실행으로 사용 가능 템플릿 목록 확보 |
| `contents.insert()` 호출 간 rate limit | 중간 | 각 호출 사이 `time.sleep(0.5)` 적용 |
| finalize 시 최소 페이지 미달 | 중간 | 빈내지 자동 패딩 + 재시도 로직 (최대 5회) |
| 질문 수가 적으면 페이지 부족 | 중간 | 건너뛴 질문 수에 따라 패딩량 자동 계산 |
| 사진 용량 초과 | 낮음 | Pillow 서버 리사이즈 + 프론트 파일 크기 제한 |
| 충전금 부족 | 낮음 | 주문 전 잔액 확인 + Sandbox 자동 충전 안내 |

---

## 17. 향후 확장 계획 (Future Enhancements)

| 기능 | 설명 |
|------|------|
| Webhook 알림 | `webhook_receiver.py` 참고, 제작/배송 상태 알림 연동 |
| 음성 인터뷰 | STT → 텍스트 자동 변환 |
| AI 문체 보정 | 답변을 회고록 문체로 자동 교정 |
| 질문 커스터마이징 | 사용자가 질문 추가/수정/삭제 |
| 다중 기여자 | 가족 여러 명 각자 답변 |
| PDF 다운로드 | 디지털 PDF 버전 제공 |
| 주문 취소/배송지 변경 | `orders.cancel()`, `orders.update_shipping()` 활용 |

---

## 18. 발표 전략 팁

1. **"왜 책이어야 하는가"를 먼저 말하라** — "디지털은 사라지지만, 책은 남습니다."
2. **Sandbox 주문 라이브 시연** — 실제 동작을 보여주면 확실한 임팩트.
3. **Webhook 아키텍처 언급** — SDK에 `webhook.py`(서명 검증) + `webhook_receiver.py`(Flask 예제)가 있으므로 "배송 알림까지 설계했다"고 어필.
4. **실제 데이터 시연** — 가족 사진과 이야기가 담긴 샘플 데이터로 감동 극대화.
5. **SDK 구조 이해도 어필** — "SDK 내부를 분석해서 최적의 파이프라인을 설계했다"고 말하면 기술 이해도 증명.

---

## 부록 A: 질문 템플릿 (questions.json)

```json
{
  "chapters": [
    {
      "title": "어린 시절",
      "order_index": 1,
      "questions": [
        { "text": "어린 시절 가장 행복했던 기억은 무엇인가요?", "order_index": 1 }
      ]
    },
    {
      "title": "학창 시절",
      "order_index": 2,
      "questions": [
        { "text": "학교 다닐 때 가장 기억에 남는 순간이 있나요?", "order_index": 1 }
      ]
    },
    {
      "title": "첫 사회생활",
      "order_index": 3,
      "questions": [
        { "text": "처음 돈을 벌었을 때 어떤 기분이었나요?", "order_index": 1 }
      ]
    },
    {
      "title": "사랑과 가족",
      "order_index": 4,
      "questions": [
        { "text": "배우자를 처음 만났을 때 이야기를 들려주세요.", "order_index": 1 }
      ]
    },
    {
      "title": "인생의 전환점",
      "order_index": 5,
      "questions": [
        { "text": "살면서 가장 힘들었지만 극복한 순간은?", "order_index": 1 }
      ]
    },
    {
      "title": "지금, 하고 싶은 말",
      "order_index": 6,
      "questions": [
        { "text": "가족에게 전하고 싶은 이야기가 있다면?", "order_index": 1 }
      ]
    }
  ]
}
```

## 부록 B: SDK 핵심 메서드 요약 (Quick Reference)

```python
from bookprintapi import Client, ApiError

client = Client()  # .env 자동 로드

# ── Books ──
client.books.list(status="finalized")
client.books.create(book_spec_uid="SQUAREBOOK_HC", title="...", creation_type="TEST")
client.books.get("bk_xxxx")
client.books.finalize("bk_xxxx")
client.books.delete("bk_xxxx")                # draft만 가능

# ── Photos ──
client.photos.upload("bk_xxxx", "image.jpg")   # → ["data"]["fileName"]
client.photos.upload_multiple("bk_xxxx", ["a.jpg", "b.jpg"])
client.photos.list("bk_xxxx")
client.photos.delete("bk_xxxx", "photo_filename.jpg")

# ── Covers ──
client.covers.create("bk_xxxx", template_uid="...", parameters={...})
client.covers.create("bk_xxxx", template_uid="...", parameters={...}, files=["cover.jpg"])
client.covers.get("bk_xxxx")
client.covers.delete("bk_xxxx")

# ── Contents ──
client.contents.insert("bk_xxxx", template_uid="...", parameters={...}, break_before="page")
client.contents.insert("bk_xxxx", template_uid="...", parameters={...}, files=["img.jpg"])
client.contents.clear("bk_xxxx")               # 전체 내지 삭제 (표지 유지)

# ── Orders ──
client.orders.estimate([{"bookUid": "bk_xxxx", "quantity": 1}])
client.orders.create(items=[...], shipping={...}, external_ref="...")
client.orders.list(status=20)
client.orders.get("or_xxxx")
client.orders.cancel("or_xxxx", "취소 사유")
client.orders.update_shipping("or_xxxx", recipient_phone="010-...")

# ── Credits ──
client.credits.get_balance()                    # → ["data"]["balance"]
client.credits.get_transactions()
client.credits.sandbox_charge(100000, memo="...")

# ── Webhook ──
from bookprintapi.webhook import verify_signature
verify_signature(body, signature, timestamp, secret)
```
