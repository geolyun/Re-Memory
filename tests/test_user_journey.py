from pathlib import Path

import models


def _create_project(client, *, question_count=15):
    response = client.post(
        "/api/projects",
        data={
            "subject_name": "홍길동",
            "relationship_type": "부모님",
            "title": "우리 가족 이야기",
            "subtitle": "봄날의 기록",
            "template": "parents_memoir",
            "question_count": str(question_count),
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["project_id"]


def test_full_primary_user_journey(client, db_session, fake_bookprint, sample_image_bytes):
    project_id = _create_project(client, question_count=15)

    projects_response = client.get("/api/projects")
    assert projects_response.status_code == 200
    assert len(projects_response.json()) == 1
    assert projects_response.json()[0]["status"] == "writing"

    detail_response = client.get(f"/api/projects/{project_id}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["project"]["title"] == "우리 가족 이야기"
    assert len(detail["qnas"]) == 15

    first_qna = detail["qnas"][0]["id"]
    second_qna = detail["qnas"][1]["id"]

    save_answer = client.post(
        f"/api/projects/{project_id}/qna/{first_qna}",
        data={"answer": "아버지와 함께 걷던 봄날이 기억납니다.", "skipped": "false", "time_period": "청년기"},
    )
    assert save_answer.status_code == 200

    upload_cover = client.post(
        f"/api/projects/{project_id}/cover-photo",
        files={"file": ("cover.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert upload_cover.status_code == 200

    upload_qna_photo = client.post(
        f"/api/projects/{project_id}/qna/{first_qna}/photos",
        files={"file": ("memory.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert upload_qna_photo.status_code == 200

    share_token_response = client.post(f"/api/projects/{project_id}/share")
    assert share_token_response.status_code == 200
    share_token = share_token_response.json()["share_token"]

    shared_project = client.get(f"/api/share/{share_token}")
    assert shared_project.status_code == 200
    assert len(shared_project.json()["qnas"]) == 15

    shared_answer = client.post(
        f"/api/share/{share_token}/qna/{second_qna}",
        data={"answer": "함께 웃었던 여행 장면이 선명해요.", "time_period": "중장년기", "contributor_name": "딸"},
    )
    assert shared_answer.status_code == 200

    build_response = client.post(f"/api/projects/{project_id}/build")
    assert build_response.status_code == 200, build_response.text
    assert fake_bookprint["build_calls"]

    preview_detail = client.get(f"/api/projects/{project_id}").json()
    assert preview_detail["project"]["status"] == "preview_ready"
    assert any(qna["answer"] for qna in preview_detail["qnas"])

    finalize_response = client.post(f"/api/projects/{project_id}/finalize")
    assert finalize_response.status_code == 200, finalize_response.text

    finalized_project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    assert finalized_project.status == "finalized"
    assert finalized_project.page_count == 26

    estimate_response = client.get(f"/api/projects/{project_id}/estimate?quantity=2")
    assert estimate_response.status_code == 200
    estimate = estimate_response.json()
    assert estimate["pageCount"] == 26
    assert estimate["productsPrice"] == 40600
    assert estimate["deliveryFee"] == 3000
    assert estimate["totalPrice"] == 51260

    order_response = client.post(
        f"/api/projects/{project_id}/order",
        data={
            "recipient_name": "홍길동",
            "recipient_phone": "010-1111-2222",
            "postal_code": "06100",
            "address1": "서울시 강남구 테헤란로 1",
            "address2": "101호",
            "shipping_memo": "문 앞에 놓아주세요",
            "quantity": "1",
        },
    )
    assert order_response.status_code == 200, order_response.text
    order_uid = order_response.json()["order_uid"]

    db_session.expire_all()
    ordered_project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    assert ordered_project.status == "ordered"
    assert ordered_project.order_uid == order_uid

    order_detail_response = client.get(f"/api/projects/{project_id}/order-detail")
    assert order_detail_response.status_code == 200
    order_detail = order_detail_response.json()
    assert order_detail["balance"] == 401000
    assert order_detail["order"]["orderUid"] == order_uid
    assert order_detail["order"]["productPrice"] == 20300
    assert order_detail["order"]["deliveryFee"] == 3000

    cancel_response = client.post(
        f"/api/projects/{project_id}/order/cancel",
        data={"cancel_reason": "테스트 취소"},
    )
    assert cancel_response.status_code == 200

    db_session.expire_all()
    cancelled_project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    assert cancelled_project.status == "finalized"
    assert cancelled_project.order_uid is None

    revoke_share = client.delete(f"/api/projects/{project_id}/share")
    assert revoke_share.status_code == 200

    delete_response = client.delete(f"/api/projects/{project_id}")
    assert delete_response.status_code == 200
    assert db_session.query(models.Project).filter(models.Project.id == project_id).first() is None


def test_build_requires_at_least_one_answer_and_supports_rebuild(client, db_session, fake_bookprint):
    project_id = _create_project(client, question_count=15)

    no_answer_build = client.post(f"/api/projects/{project_id}/build")
    assert no_answer_build.status_code == 400
    assert no_answer_build.json()["detail"]

    detail = client.get(f"/api/projects/{project_id}").json()
    qna_id = detail["qnas"][0]["id"]
    save_answer = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}",
        data={"answer": "재빌드 테스트 답변", "skipped": "false", "time_period": ""},
    )
    assert save_answer.status_code == 200

    first_build = client.post(f"/api/projects/{project_id}/build")
    assert first_build.status_code == 200

    project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    first_book_uid = project.book_uid
    assert project.status == "preview_ready"
    assert first_book_uid == "bk_test_1"

    rebuild = client.post(f"/api/projects/{project_id}/rebuild")
    assert rebuild.status_code == 200

    db_session.expire_all()
    project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    assert project.status == "writing"
    assert project.book_uid is None

    second_build = client.post(f"/api/projects/{project_id}/build")
    assert second_build.status_code == 200

    db_session.expire_all()
    rebuilt_project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    assert rebuilt_project.status == "preview_ready"
    assert rebuilt_project.book_uid == "bk_test_2"
    assert len(fake_bookprint["create_book_calls"]) == 2


def test_uploaded_photo_is_removed_when_deleted(client, db_session, sample_image_bytes, fake_bookprint):
    project_id = _create_project(client, question_count=5)
    detail = client.get(f"/api/projects/{project_id}").json()
    qna_id = detail["qnas"][0]["id"]

    upload_response = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}/photos",
        files={"file": ("memory.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert upload_response.status_code == 200
    photo_id = upload_response.json()["photo"]["id"]

    photo = db_session.query(models.Photo).filter(models.Photo.id == photo_id).one()
    file_path = Path(photo.local_path)
    assert file_path.exists()

    delete_response = client.delete(f"/api/projects/{project_id}/photos/{photo_id}")
    assert delete_response.status_code == 200
    assert not file_path.exists()
    assert db_session.query(models.Photo).filter(models.Photo.id == photo_id).first() is None


def test_demo_project_is_listed_and_opened_read_only(client, db_session):
    demo_user = models.User(session_id="MEMORYBOOK_DEMO_v1")
    db_session.add(demo_user)
    db_session.flush()

    project = models.Project(
        user_id=demo_user.id,
        title="Demo Memoir",
        subject_name="Kim Young-hee",
        relationship_type="Parent",
        status="writing",
    )
    db_session.add(project)
    db_session.flush()

    chapter = models.Chapter(project_id=project.id, title="Childhood", order_index=1)
    db_session.add(chapter)
    db_session.flush()

    qna = models.QnA(
        chapter_id=chapter.id,
        question_text="What do you remember from childhood?",
        answer_text="Playing in the alley",
        order_index=1,
    )
    db_session.add(qna)
    db_session.commit()

    projects_response = client.get("/api/projects")
    assert projects_response.status_code == 200
    assert projects_response.json()[0]["is_demo"] is True
    assert projects_response.json()[0]["read_only"] is True

    detail_response = client.get(f"/api/projects/{project.id}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["project"]["is_demo"] is True
    assert detail["project"]["read_only"] is True
    assert detail["qnas"][0]["answer"] == "Playing in the alley"


def test_shared_answers_are_accumulated_without_overwriting_owner_answer(client, db_session, fake_bookprint):
    project_id = _create_project(client, question_count=5)
    detail = client.get(f"/api/projects/{project_id}").json()
    qna_id = detail["qnas"][0]["id"]

    owner_answer = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}",
        data={"answer": "The owner answer stays.", "skipped": "false", "time_period": "young_adult"},
    )
    assert owner_answer.status_code == 200

    share_token = client.post(f"/api/projects/{project_id}/share").json()["share_token"]

    contribution_1 = client.post(
        f"/api/share/{share_token}/qna/{qna_id}",
        data={"answer": "Weekend shopping memory.", "time_period": "young_adult", "contributor_name": "Daughter"},
    )
    assert contribution_1.status_code == 200

    contribution_2 = client.post(
        f"/api/share/{share_token}/qna/{qna_id}",
        data={"answer": "Rainy day umbrella memory.", "time_period": "", "contributor_name": "Son"},
    )
    assert contribution_2.status_code == 200

    db_session.expire_all()
    qna = db_session.query(models.QnA).filter(models.QnA.id == qna_id).one()
    assert qna.answer_text == "The owner answer stays."
    assert len(qna.contributions) == 2

    updated_detail = client.get(f"/api/projects/{project_id}").json()
    merged_answer = next(item["answer"] for item in updated_detail["qnas"] if item["id"] == qna_id)
    assert "The owner answer stays." in merged_answer
    assert "[Daughter] Weekend shopping memory." in merged_answer
    assert "[Son] Rainy day umbrella memory." in merged_answer


def test_book_builder_uses_photo_qna_template_when_photo_exists(client, db_session, sample_image_bytes, monkeypatch):
    from routes import projects
    from services import book_builder

    monkeypatch.setattr(projects.bookprint, "create_book", lambda title: "bk_photo_test")

    project_id = _create_project(client, question_count=5)
    detail = client.get(f"/api/projects/{project_id}").json()
    qna_id = detail["qnas"][0]["id"]

    save_answer = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}",
        data={"answer": "Answer with photo", "skipped": "false", "time_period": ""},
    )
    assert save_answer.status_code == 200

    upload_response = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}/photos",
        files={"file": ("memory.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert upload_response.status_code == 200

    upload_calls = []
    insert_calls = []
    publish_calls = []

    def fake_upload_photo(book_uid, local_path):
        upload_calls.append({"book_uid": book_uid, "local_path": local_path})
        return f"uploaded_{len(upload_calls)}"

    monkeypatch.setattr(book_builder.bookprint, "upload_photo", fake_upload_photo)
    monkeypatch.setattr(book_builder.bookprint, "create_cover", lambda *args, **kwargs: None)
    monkeypatch.setattr(book_builder.bookprint, "insert_ganji", lambda *args, **kwargs: None)
    monkeypatch.setattr(book_builder.bookprint, "insert_blank", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        book_builder.bookprint,
        "insert_publish",
        lambda book_uid, title, author, publish_date, photo_file_name=None: publish_calls.append(
            {
                "book_uid": book_uid,
                "title": title,
                "author": author,
                "publish_date": publish_date,
                "photo_file_name": photo_file_name,
            }
        ),
    )
    monkeypatch.setattr(
        book_builder.bookprint,
        "insert_qna",
        lambda book_uid, question, answer: insert_calls.append(
            {"kind": "text", "book_uid": book_uid, "question": question, "answer": answer}
        ),
    )
    monkeypatch.setattr(
        book_builder.bookprint,
        "insert_qna_with_photo",
        lambda book_uid, question, answer, photo_file_name: insert_calls.append(
            {
                "kind": "photo",
                "book_uid": book_uid,
                "question": question,
                "answer": answer,
                "photo_file_name": photo_file_name,
            }
        ),
    )

    db_session.expire_all()
    project = db_session.query(models.Project).filter(models.Project.id == project_id).one()
    book_builder.build_book(db_session, project)

    assert len(upload_calls) == 2
    assert insert_calls
    assert insert_calls[0]["kind"] == "photo"
    assert insert_calls[0]["photo_file_name"] == "uploaded_2"
    assert publish_calls
    assert publish_calls[0]["photo_file_name"] == "uploaded_1"


def test_remaining_api_endpoints_and_representative_errors(
    client,
    other_client,
    db_session,
    sample_image_bytes,
    fake_bookprint,
):
    templates_response = client.get("/api/ganji-templates")
    assert templates_response.status_code == 200
    assert isinstance(templates_response.json(), list)
    assert templates_response.json()

    balance_response = client.get("/api/credits/balance")
    assert balance_response.status_code == 200
    assert balance_response.json()["balance"] == 401000

    charge_response = client.post("/api/credits/charge", data={"amount": "100000"})
    assert charge_response.status_code == 200

    balance_after_charge = client.get("/api/credits/balance")
    assert balance_after_charge.status_code == 200
    assert balance_after_charge.json()["balance"] == 501000

    project_id = _create_project(client, question_count=5)
    detail = client.get(f"/api/projects/{project_id}").json()
    chapter_id = detail["chapters"][0]["id"]
    qna_id = detail["qnas"][0]["id"]

    update_ganji = client.patch(
        f"/api/projects/{project_id}/chapters/{chapter_id}/ganji",
        data={"use_ganji": "false", "ganji_tpl_uid": "custom_tpl"},
    )
    assert update_ganji.status_code == 200
    db_session.expire_all()
    chapter = db_session.query(models.Chapter).filter(models.Chapter.id == chapter_id).one()
    assert chapter.use_ganji is False
    assert chapter.ganji_tpl_uid == "custom_tpl"

    invalid_share_get = client.get("/api/share/not-a-real-token")
    assert invalid_share_get.status_code == 404

    invalid_share_post = client.post(
        f"/api/share/not-a-real-token/qna/{qna_id}",
        data={"answer": "테스트"},
    )
    assert invalid_share_post.status_code == 404

    unauthorized_project_detail = other_client.get(f"/api/projects/{project_id}")
    assert unauthorized_project_detail.status_code == 404

    unauthorized_rebuild = other_client.post(f"/api/projects/{project_id}/rebuild")
    assert unauthorized_rebuild.status_code == 403

    premature_finalize = client.post(f"/api/projects/{project_id}/finalize")
    assert premature_finalize.status_code == 400

    premature_order = client.post(
        f"/api/projects/{project_id}/order",
        data={
            "recipient_name": "홍길동",
            "recipient_phone": "010-0000-0000",
            "postal_code": "06100",
            "address1": "서울시 강남구",
            "quantity": "1",
        },
    )
    assert premature_order.status_code == 400

    premature_cancel = client.post(
        f"/api/projects/{project_id}/order/cancel",
        data={"cancel_reason": "아직 주문 전"},
    )
    assert premature_cancel.status_code == 400

    empty_order_detail = client.get(f"/api/projects/{project_id}/order-detail")
    assert empty_order_detail.status_code == 200
    assert empty_order_detail.json()["order"] == {}

    # 질문당 최대 1장 업로드 허용 — 1장은 200, 2번째는 400
    first_upload = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}/photos",
        files={"file": ("memory.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert first_upload.status_code == 200

    second_upload = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}/photos",
        files={"file": ("memory.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert second_upload.status_code == 400

    save_answer = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}",
        data={"answer": "확정 전 테스트 답변", "skipped": "false", "time_period": ""},
    )
    assert save_answer.status_code == 200

    build_response = client.post(f"/api/projects/{project_id}/build")
    assert build_response.status_code == 200

    finalize_response = client.post(f"/api/projects/{project_id}/finalize")
    assert finalize_response.status_code == 200

    edit_after_finalize = client.post(
        f"/api/projects/{project_id}/qna/{qna_id}",
        data={"answer": "수정 시도", "skipped": "false", "time_period": ""},
    )
    assert edit_after_finalize.status_code == 400

    upload_cover_after_finalize = client.post(
        f"/api/projects/{project_id}/cover-photo",
        files={"file": ("cover.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert upload_cover_after_finalize.status_code == 400

    share_token_response = client.post(f"/api/projects/{project_id}/share")
    assert share_token_response.status_code == 200
    share_token = share_token_response.json()["share_token"]

    shared_edit_after_finalize = client.post(
        f"/api/share/{share_token}/qna/{qna_id}",
        data={"answer": "공유 수정 시도", "time_period": "", "contributor_name": "딸"},
    )
    assert shared_edit_after_finalize.status_code == 400
