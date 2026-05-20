import { useEffect, useMemo, useState } from "react";
import {
  createProcedureReview,
  getProcedureReviewCandidates,
  getUserProcedureReviews,
} from "@/api/procedureReviewApi";
import { getMyMemberInfo } from "@/api/memberApi";
import { useAlertModal } from "@/components/useAlertModal";
import { formatDateTime } from "@/utils/date";
import "./mypagesection.css";

const SCORES = [1, 2, 3, 4, 5];
const SATISFACTION_FIELDS = [
  { name: "effectSatisfaction", label: "효과 만족도", icon: "★" },
  { name: "priceSatisfaction", label: "가격 만족도", icon: "₩" },
  { name: "consultationSatisfaction", label: "상담 만족도", icon: "✦" },
  { name: "revisitIntention", label: "재방문 의사", icon: "↺" },
];

const initialForm = {
  procedureRecordId: "",
  rating: 5,
  shortComment: "",
  effectSatisfaction: 5,
  priceSatisfaction: 5,
  consultationSatisfaction: 5,
  revisitIntention: 5,
};

export default function ProcedureRecordPageFull() {
  const { showAlert } = useAlertModal();
  const [userId, setUserId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);

  const loadData = async (resolvedUserId) => {
    const [candidateData, reviewData] = await Promise.all([
      getProcedureReviewCandidates(resolvedUserId),
      getUserProcedureReviews(resolvedUserId),
    ]);

    setCandidates(candidateData);
    setReviews(reviewData);

    const firstAvailable = candidateData.find((item) => !item.reviewed);
    if (firstAvailable) {
      setForm((prev) => ({
        ...prev,
        procedureRecordId: firstAvailable.procedureRecordId,
      }));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const member = await getMyMemberInfo();
        if (!member?.id) {
          throw new Error("회원 정보를 확인할 수 없습니다.");
        }
        setUserId(member.id);
        await loadData(member.id);
      } catch (error) {
        console.error(error);
        showAlert({
          title: "오류",
          message: "만족도 평가 정보를 불러오지 못했습니다.",
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const availableCandidates = useMemo(
    () => candidates.filter((item) => !item.reviewed),
    [candidates],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "shortComment"
          ? value
          : value === ""
            ? ""
            : Number(value),
    }));
  };

  const handleScoreSelect = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderStarRating = (name, value) => (
    <div className="procedure-review-star-selector" role="radiogroup" aria-label={name}>
      {SCORES.map((score) => {
        const active = score <= value;
        return (
          <button
            key={score}
            type="button"
            className={`procedure-review-star-button ${active ? "active" : ""}`}
            onClick={() => handleScoreSelect(name, score)}
            aria-label={`${score}점 선택`}
            aria-pressed={value === score}
          >
            ★
          </button>
        );
      })}
      <span className="procedure-review-star-value">{value}점</span>
    </div>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId) return;

    try {
      await createProcedureReview({
        userId,
        procedureRecordId: Number(form.procedureRecordId),
        rating: Number(form.rating),
        shortComment: form.shortComment.trim(),
        effectSatisfaction: Number(form.effectSatisfaction),
        priceSatisfaction: Number(form.priceSatisfaction),
        consultationSatisfaction: Number(form.consultationSatisfaction),
        revisitIntention: Number(form.revisitIntention),
      });

      showAlert({
        title: "등록 완료",
        message: "시술 만족도 평가가 등록되었습니다.",
      });
      setForm(initialForm);
      await loadData(userId);
    } catch (error) {
      console.error("시술 만족도 평가 등록 실패", error);
      showAlert({
        title: "오류",
        message: "시술 만족도 평가 등록에 실패했습니다.",
      });
    }
  };

  const renderReviewStars = (value) => {
    const safeValue = Number(value) || 0;
    return (
      <div className="procedure-review-static-stars" aria-label={`${safeValue}점`}>
        <div className="procedure-review-static-stars-track">
          {SCORES.map((score) => (
            <span
              key={score}
              className={`procedure-review-star-button procedure-review-static-star ${
                score <= safeValue ? "active" : ""
              }`}
              aria-hidden="true"
            >
              ★
            </span>
          ))}
        </div>
        <span className="procedure-review-static-stars-value">{safeValue}점</span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="mypage-section-card">
        <p>만족도 평가 정보를 불러오는 중...</p>
      </section>
    );
  }

  return (
    <section className="mypage-section-card">
      <div className="notification-header">
        <div>
          <h2>시술 만족도 평가</h2>
          <p className="notification-subtitle">
            완료된 시술 기록을 기반으로 만족도 점수와 후기를 남겨주세요.
          </p>
        </div>
      </div>

      <div className="procedure-review-candidate-list" style={{ marginBottom: 24 }}>
        {candidates.map((item) => (
          <div
            key={item.procedureRecordId}
            className="mypage-section-item procedure-review-candidate-card"
          >
            <div className="procedure-review-candidate-main">
              <strong>{item.procedureName}</strong>
              <div className="procedure-review-candidate-meta">
                <span>시술일 {formatDateTime(item.treatedAt)}</span>
                <span>{item.reviewed ? "작성 완료" : "작성 가능"}</span>
              </div>
            </div>

            {!item.reviewed && (
              <button
                type="button"
                className="notification-read-button procedure-review-candidate-button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    procedureRecordId: item.procedureRecordId,
                  }))
                }
              >
                이 시술 평가하기
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="procedure-review-form-grid">
        <div className="mypage-section-item procedure-review-top-card procedure-review-select-card">
          <p>평가할 시술</p>
          <select
            name="procedureRecordId"
            value={form.procedureRecordId}
            onChange={handleChange}
          >
            <option value="">시술 기록 선택</option>
            {availableCandidates.map((item) => (
              <option key={item.procedureRecordId} value={item.procedureRecordId}>
                {item.procedureName} / {formatDateTime(item.treatedAt)}
              </option>
            ))}
          </select>
        </div>

        <div className="mypage-section-item procedure-review-score-card procedure-review-top-card">
          <div className="procedure-review-score-head">
            <span className="procedure-review-score-icon" aria-hidden="true">★</span>
            <div>
              <p>시술 평가 점수</p>
              <span className="procedure-review-score-caption">
                전체 만족도를 가장 잘 나타내는 점수를 선택해 주세요
              </span>
            </div>
          </div>

          {renderStarRating("rating", form.rating)}
        </div>

        <div className="mypage-section-item procedure-review-wide">
          <p>한줄 후기</p>
          <textarea
            name="shortComment"
            value={form.shortComment}
            onChange={handleChange}
            rows={3}
            placeholder="예: 피부결이 훨씬 부드러워져서 만족해요."
          />
        </div>

        {SATISFACTION_FIELDS.map((field) => (
          <div key={field.name} className="mypage-section-item procedure-review-score-card">
            <div className="procedure-review-score-head">
              <span className="procedure-review-score-icon" aria-hidden="true">
                {field.icon}
              </span>
              <div>
                <p>{field.label}</p>
                <span className="procedure-review-score-caption">
                  가장 가까운 체감 점수를 선택해 주세요
                </span>
              </div>
            </div>

            <div className="procedure-review-score-selector">
              {SCORES.map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`procedure-review-score-chip ${form[field.name] === score ? "active" : ""}`}
                  onClick={() => handleScoreSelect(field.name, score)}
                >
                  {score}점
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="procedure-review-submit">
          <button
            type="submit"
            className="notification-read-button procedure-review-submit-button"
          >
            만족도 평가 등록
          </button>
        </div>
      </form>

      <div className="procedure-review-history-divider" style={{ marginTop: 28 }}>
        <div className="procedure-review-history-header">
          <h2 style={{ fontSize: 22, marginBottom: 0 }}>내가 남긴 만족도 평가</h2>
          <div className="procedure-review-history-count">{reviews.length}건</div>
        </div>

        <div className="mypage-section-list">
          {reviews.map((item) => (
            <div key={item.id} className="mypage-section-item procedure-review-history-card">
              <div className="procedure-review-card-top">
                <strong>{item.procedureName}</strong>
                <div className="procedure-review-rating-badge">{item.rating}점</div>
              </div>

              <div className="procedure-review-meta-grid">
                <div className="procedure-review-meta-item">
                  <span>시술일</span>
                  <strong>{formatDateTime(item.treatedAt)}</strong>
                </div>
                <div className="procedure-review-meta-item">
                  <span>시술 평가 점수</span>
                  {renderReviewStars(item.rating)}
                </div>
              </div>

              <div className="procedure-review-comment-box">
                <span>한줄 후기</span>
                <p>{item.shortComment}</p>
              </div>

              <div className="procedure-review-score-grid">
                <div className="procedure-review-score-item">
                  <span>효과 만족도</span>
                  {item.effectSatisfaction ? renderReviewStars(item.effectSatisfaction) : <strong>-</strong>}
                </div>
                <div className="procedure-review-score-item">
                  <span>가격 만족도</span>
                  {item.priceSatisfaction ? renderReviewStars(item.priceSatisfaction) : <strong>-</strong>}
                </div>
                <div className="procedure-review-score-item">
                  <span>상담 만족도</span>
                  {item.consultationSatisfaction ? renderReviewStars(item.consultationSatisfaction) : <strong>-</strong>}
                </div>
                <div className="procedure-review-score-item">
                  <span>재방문 의사</span>
                  {item.revisitIntention ? renderReviewStars(item.revisitIntention) : <strong>-</strong>}
                </div>
              </div>

              <div className="procedure-review-created-at">
                작성일 {formatDateTime(item.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
