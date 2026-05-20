import { useEffect, useState } from "react";
import { getMyMemberInfo } from "@/api/memberApi";
import { getRecommendationHistoriesByUser } from "@/api/recommendationApi";
import { getSkinConcernLabel, getSkinTypeLabel } from "@/constants/skinSurveyOptions";
import { formatDateTime } from "@/utils/date";
import "./mypagesection.css";

const procedureVisualMap = {
  HYDRATION_CARE: { emoji: "💧", tone: "aqua" },
  PORE_SEBUM_CARE: { emoji: "🫧", tone: "mint" },
  BARRIER_REPAIR_CARE: { emoji: "🛡️", tone: "sand" },
  SOOTHING_CARE: { emoji: "🌿", tone: "sage" },
  ACNE_CARE: { emoji: "✨", tone: "rose" },
  REDNESS_CALMING_CARE: { emoji: "🌷", tone: "peach" },
  LOW_IRRITATION_CARE: { emoji: "🕊️", tone: "cloud" },
  LIFTING_FIRMING_CARE: { emoji: "💫", tone: "gold" },
  BRIGHTENING_CARE: { emoji: "🌟", tone: "sun" },
};

function getProcedureVisual(procedureCode) {
  return procedureVisualMap[procedureCode] || { emoji: "🧴", tone: "sand" };
}

export default function RecommendationPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const member = await getMyMemberInfo();
        const response = await getRecommendationHistoriesByUser(member.id, page, 1);
        setRecommendations(response.content || []);
        setTotalPages(response.totalPages || 0);
      } catch (error) {
        console.error(error);
        setErrorMessage("맞춤 추천 데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecommendations();
  }, [page]);

  return (
    <section className="mypage-section-card">
      <div className="mypage-report-hero recommendation-hero">
        <div>
          <p className="mypage-report-kicker">Personalized Procedures</p>
          <h2>맞춤 추천</h2>
          <p className="mypage-report-copy">
            피부 타입과 고민, 문진 답변을 바탕으로 우선순위가 높은 시술을 선별해
            보여드려요.
          </p>
        </div>
        <div className="mypage-report-badge-card recommendation-badge-card">
          <span>{page === 0 ? "최신 추천" : `이전 추천 #${page + 1}`}</span>
          <strong>{recommendations[0]?.recommendations?.[0]?.procedureName || "-"}</strong>
        </div>
      </div>

      {isLoading ? <p>맞춤 추천을 불러오는 중입니다...</p> : null}
      {!isLoading && errorMessage ? <p>{errorMessage}</p> : null}
      {!isLoading && !errorMessage && recommendations.length === 0 ? (
        <p>추천 시술 내역이 없습니다.</p>
      ) : null}
      {!isLoading && recommendations.length > 0 ? (
        <div className="recommendation-stack">
          {recommendations.map((item, index) => {
            const topRecommendation = item.recommendations?.[0];

            return (
              <article
                key={item.recommendationId}
                className={`recommendation-card ${
                  index === 0 ? "recommendation-card-featured" : ""
                }`}
              >
                <div className="recommendation-card-head">
                  <div>
                    <p className="recommendation-card-kicker">
                      Recommendation #{item.recommendationId}
                    </p>
                    <h3>{topRecommendation?.procedureName || "추천 결과"}</h3>
                  </div>
                  <span className="recommendation-rank-chip">
                    {page === 0 && index === 0 ? "가장 최근 추천" : `${page + 1}번째 기록`}
                  </span>
                </div>

                <div className="recommendation-meta-row">
                  <span className="recommendation-meta-pill">
                    피부 타입 {getSkinTypeLabel(item.skinTypeCode)}
                  </span>
                  <span className="recommendation-meta-pill">
                    고민 {item.concernCodes?.map(getSkinConcernLabel).join(", ") || "없음"}
                  </span>
                  <span className="recommendation-meta-pill">
                    생성일 {formatDateTime(item.createdAt)}
                  </span>
                </div>

                {item.recommendations?.length > 0 ? (
                  <div className="recommendation-procedure-grid">
                    {item.recommendations.map((recommendation, recommendationIndex) => (
                      <div
                        key={recommendation.procedureCode}
                        className={`recommendation-procedure-card recommendation-procedure-card-${
                          getProcedureVisual(recommendation.procedureCode).tone
                        }`}
                      >
                        <div className="recommendation-procedure-top">
                          <div className="recommendation-procedure-topline">
                            <span className="recommendation-procedure-rank">
                              TOP {recommendationIndex + 1}
                            </span>
                            <span className="recommendation-procedure-emoji">
                              {getProcedureVisual(recommendation.procedureCode).emoji}
                            </span>
                          </div>
                          <strong>{recommendation.procedureName}</strong>
                        </div>
                        <p className="recommendation-procedure-description">
                          {recommendation.description}
                        </p>
                        <div className="recommendation-reason-list">
                          {(recommendation.reasons || []).slice(0, 3).map((reason) => (
                            <span key={reason} className="recommendation-reason-chip">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>추천 시술 데이터가 없습니다.</p>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
      {!isLoading && totalPages > 1 ? (
        <div className="diagnosis-pagination recommendation-pagination">
          <p className="diagnosis-pagination-label">이전 추천 기록</p>
          <div className="diagnosis-pagination-list">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                className={`diagnosis-page-button ${page === index ? "active" : ""}`}
                onClick={() => setPage(index)}
                disabled={isLoading || page === index}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
