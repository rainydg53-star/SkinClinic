import { useEffect, useMemo, useState } from "react";
import {
  getAdminProcedureReviews,
  getProcedureSatisfactionStats,
} from "@/api/procedureReviewApi";
import { formatDateTime } from "@/utils/date";
import "@/pages/mypage/mypagesection.css";
import "./admin-procedure.css";

const CHART_COLORS = ["#8e4e31", "#d18352", "#d9ad7c", "#7c9aa5", "#b76e4d"];
const REVIEW_PAGE_SIZE = 5;

const getStrokeDasharray = (value, total) => {
  if (!total) return "0 100";
  return `${(value / total) * 100} 100`;
};

export default function AdminProcedureSatisfactionPage() {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedProcedureType, setSelectedProcedureType] = useState("ALL");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [memberKeyword, setMemberKeyword] = useState("");
  const [reviewPage, setReviewPage] = useState(1);

  useEffect(() => {
    Promise.all([getProcedureSatisfactionStats(), getAdminProcedureReviews()])
      .then(([statsData, reviewData]) => {
        setStats(statsData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    setReviewPage(1);
  }, [selectedProcedureType, selectedRating, memberKeyword]);

  const filteredReviews = useMemo(() => {
    const normalizedKeyword = memberKeyword.trim().toLowerCase();

    return reviews.filter((item) => {
      const matchesProcedure =
        selectedProcedureType === "ALL" || item.procedureType === selectedProcedureType;
      const matchesRating = selectedRating === "ALL" || item.rating === Number(selectedRating);
      const matchesMember =
        !normalizedKeyword ||
        String(item.memberName || "").toLowerCase().includes(normalizedKeyword);

      return matchesProcedure && matchesRating && matchesMember;
    });
  }, [reviews, selectedProcedureType, selectedRating, memberKeyword]);

  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE));
  const safeReviewPage = Math.min(reviewPage, totalReviewPages);
  const pagedReviews = filteredReviews.slice(
    (safeReviewPage - 1) * REVIEW_PAGE_SIZE,
    safeReviewPage * REVIEW_PAGE_SIZE,
  );

  if (!stats) {
    return (
      <div className="admin-page-shell">
        <section className="mypage-section-card admin-procedure-page">
          <h2>시술 만족도 통계</h2>
          <p>통계 데이터를 불러오는 중입니다...</p>
        </section>
      </div>
    );
  }

  const topProcedure = stats.procedureStats?.[0] || null;
  const totalReviews = (stats.procedureStats || []).reduce(
    (sum, item) => sum + item.reviewCount,
    0,
  );

  return (
    <div className="admin-page-shell">
      <section className="mypage-section-card admin-procedure-page">
        <div className="admin-procedure-hero">
          <span className="admin-procedure-badge">Procedure Insights</span>
          <h2>시술 만족도 통계</h2>
          <p className="notification-subtitle">
            회원 만족도 평가 데이터를 기준으로 시술별 반응과 리뷰를 확인할 수 있습니다.
          </p>
        </div>

        <div className="admin-procedure-summary">
          <div className="admin-procedure-stat">
            <span>총 평가 수</span>
            <strong>{stats.totalReviewCount}건</strong>
          </div>

          <div className="admin-procedure-stat">
            <span>집계 시술 수</span>
            <strong>{stats.procedureStats.length}종</strong>
          </div>

          <div className="admin-procedure-stat admin-procedure-stat-time">
            <span>생성 시각</span>
            <strong>{String(stats.generatedAt || "").replace("T", " ")}</strong>
          </div>
        </div>

        <div className="admin-procedure-emphasis-grid">
          <div className="mypage-section-item admin-procedure-emphasis-card">
            <strong>가장 만족도가 높은 시술</strong>
            {stats.highestRatedProcedure ? (
              <>
                <p>{stats.highestRatedProcedure.procedureName}</p>
                <p>평균 별점: {stats.highestRatedProcedure.averageRating.toFixed(2)}</p>
                <p>리뷰 수: {stats.highestRatedProcedure.reviewCount}건</p>
              </>
            ) : (
              <p>데이터 없음</p>
            )}
          </div>

          <div className="mypage-section-item admin-procedure-emphasis-card">
            <strong>가장 만족도가 낮은 시술</strong>
            {stats.lowestRatedProcedure ? (
              <>
                <p>{stats.lowestRatedProcedure.procedureName}</p>
                <p>평균 별점: {stats.lowestRatedProcedure.averageRating.toFixed(2)}</p>
                <p>리뷰 수: {stats.lowestRatedProcedure.reviewCount}건</p>
              </>
            ) : (
              <p>데이터 없음</p>
            )}
          </div>
        </div>

        <div className="admin-procedure-history">
          <div className="admin-history-header">
            <div>
              <h3>시술별 상세 통계</h3>
              <p className="admin-history-count">{stats.procedureStats.length}건</p>
            </div>
          </div>

          <div className="admin-procedure-visual-grid">
            <div className="mypage-section-item admin-procedure-visual-card">
              <div className="admin-procedure-visual-head">
                <strong>리뷰 비중</strong>
                <span>시술별 리뷰 수 분포</span>
              </div>

              {stats.procedureStats.length > 0 ? (
                <div className="admin-procedure-donut-layout">
                  <svg className="admin-procedure-donut" viewBox="0 0 42 42" aria-label="리뷰 비중">
                    <circle className="admin-procedure-donut-base" cx="21" cy="21" r="15.915" />
                    {stats.procedureStats.map((item, index) => {
                      const offset =
                        stats.procedureStats
                          .slice(0, index)
                          .reduce((sum, current) => sum + current.reviewCount, 0) / Math.max(totalReviews, 1);

                      return (
                        <circle
                          key={item.procedureType}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          strokeWidth="4"
                          strokeDasharray={getStrokeDasharray(item.reviewCount, totalReviews)}
                          strokeDashoffset={25 - offset * 100}
                        />
                      );
                    })}
                  </svg>

                  <div className="admin-procedure-donut-legend">
                    {stats.procedureStats.map((item, index) => (
                      <div key={item.procedureType} className="admin-procedure-legend-item">
                        <span
                          className="admin-procedure-legend-dot"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <div>
                          <strong>{item.procedureName}</strong>
                          <p>{item.reviewCount}건</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>데이터 없음</p>
              )}
            </div>

            <div className="mypage-section-item admin-procedure-visual-card">
              <div className="admin-procedure-visual-head">
                <strong>만족도 비교</strong>
                <span>평균 평점 기준 상대 비교</span>
              </div>

              {stats.procedureStats.length > 0 ? (
                <div className="admin-procedure-bar-chart">
                  {stats.procedureStats.map((item, index) => {
                    const ratio = topProcedure
                      ? (item.averageRating / Math.max(topProcedure.averageRating, 0.01)) * 100
                      : 0;

                    return (
                      <div key={item.procedureType} className="admin-procedure-bar-row">
                        <div className="admin-procedure-bar-label">
                          <strong>{item.procedureName}</strong>
                          <span>{item.averageRating.toFixed(2)}점</span>
                        </div>
                        <div className="admin-procedure-bar-track">
                          <div
                            className="admin-procedure-bar-fill"
                            style={{
                              width: `${Math.max(ratio, 8)}%`,
                              background: CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>데이터 없음</p>
              )}
            </div>
          </div>

          <div className="admin-procedure-history-grid">
            {stats.procedureStats.map((item) => (
              <div key={item.procedureType} className="mypage-section-item admin-procedure-history-card">
                <div className="admin-procedure-card-head">
                  <strong>{item.procedureName}</strong>
                  <div className="admin-procedure-card-rating">{item.averageRating.toFixed(2)}점</div>
                </div>

                <div className="admin-procedure-card-meta">
                  <div className="admin-procedure-card-meta-item">
                    <span>리뷰 수</span>
                    <strong>{item.reviewCount}건</strong>
                  </div>
                  <div className="admin-procedure-card-meta-item">
                    <span>평균 별점</span>
                    <strong>{item.averageRating.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="admin-procedure-score-list">
                  <div className="admin-procedure-score-item">
                    <span>효과 만족도</span>
                    <strong>{item.averageEffectSatisfaction.toFixed(2)}</strong>
                  </div>
                  <div className="admin-procedure-score-item">
                    <span>가격 만족도</span>
                    <strong>{item.averagePriceSatisfaction.toFixed(2)}</strong>
                  </div>
                  <div className="admin-procedure-score-item">
                    <span>상담 만족도</span>
                    <strong>{item.averageConsultationSatisfaction.toFixed(2)}</strong>
                  </div>
                  <div className="admin-procedure-score-item">
                    <span>재방문 의사</span>
                    <strong>{item.averageRevisitIntention.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-procedure-review-section">
            <div className="admin-history-header">
              <div>
                <h3>회원별 시술 후기</h3>
                <p className="admin-history-count">
                  {filteredReviews.length}건 · {safeReviewPage}/{totalReviewPages} 페이지
                </p>
              </div>

              <div className="admin-procedure-review-filters">
                <select
                  value={selectedProcedureType}
                  onChange={(event) => setSelectedProcedureType(event.target.value)}
                >
                  <option value="ALL">전체 시술</option>
                  {stats.procedureStats.map((item) => (
                    <option key={item.procedureType} value={item.procedureType}>
                      {item.procedureName}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRating}
                  onChange={(event) => setSelectedRating(event.target.value)}
                >
                  <option value="ALL">전체 별점</option>
                  {[5, 4, 3, 2, 1].map((score) => (
                    <option key={score} value={score}>
                      {score}점
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  className="admin-procedure-member-search-input"
                  placeholder="회원명 검색"
                  value={memberKeyword}
                  onChange={(event) => setMemberKeyword(event.target.value)}
                />
              </div>
            </div>

            <div className="admin-procedure-review-list">
              {pagedReviews.length > 0 ? (
                pagedReviews.map((review) => (
                  <div key={review.id} className="admin-procedure-review-row">
                    <div className="admin-procedure-review-row-top">
                      <div>
                        <strong>{review.memberName}</strong>
                        <p>
                          {review.procedureName} · 시술일 {review.treatedAt}
                        </p>
                      </div>
                      <div className="admin-procedure-review-badge">{review.rating}점</div>
                    </div>

                    <div className="admin-procedure-review-comment">"{review.shortComment}"</div>

                    <div className="admin-procedure-review-meta">
                      <span>효과 {review.effectSatisfaction ?? "-"}</span>
                      <span>가격 {review.priceSatisfaction ?? "-"}</span>
                      <span>상담 {review.consultationSatisfaction ?? "-"}</span>
                      <span>재방문 {review.revisitIntention ?? "-"}</span>
                      <span>{formatDateTime(review.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-member-empty">조건에 맞는 후기가 없습니다.</div>
              )}
            </div>

            {filteredReviews.length > REVIEW_PAGE_SIZE && (
              <div className="admin-procedure-pagination">
                <button
                  type="button"
                  className="admin-procedure-page-button"
                  onClick={() => setReviewPage((page) => Math.max(page - 1, 1))}
                  disabled={safeReviewPage === 1}
                >
                  이전
                </button>

                <span className="admin-procedure-page-indicator">
                  {safeReviewPage} / {totalReviewPages}
                </span>

                <button
                  type="button"
                  className="admin-procedure-page-button"
                  onClick={() => setReviewPage((page) => Math.min(page + 1, totalReviewPages))}
                  disabled={safeReviewPage === totalReviewPages}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}