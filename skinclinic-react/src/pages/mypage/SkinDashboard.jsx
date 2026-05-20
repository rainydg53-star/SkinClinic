import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLatestSkinSurveyByUser } from "@/api/skinSurveyApi";
import { getRecommendationHistoriesByUser } from "@/api/recommendationApi";
import { getUserNotifications } from "@/api/notificationApi";
import { getMyMemberInfo } from "@/api/memberApi";
import { getMyReservations } from "@/api/reservationApi";
import { getSkinConcernLabel, getSkinTypeLabel } from "@/constants/skinSurveyOptions";
import { formatDateTime } from "@/utils/date";
import "./skindashboard.css";
import { API_BASE_URL } from '@/config/api'

const ITEMS_PER_PAGE = 3;
const MAX_PAGE_BUTTONS = 5;

export default function SkinDashboard() {
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [consultationSessions, setConsultationSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationPage, setReservationPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [consultationPage, setConsultationPage] = useState(1);
  const [treatmentPage, setTreatmentPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [pendingPaymentPage, setPendingPaymentPage] = useState(1);
  const [recommendationPage, setRecommendationPage] = useState(1);
  const [expandedSection, setExpandedSection] = useState(null);

  const consultationDisplayRows = useMemo(() => {
    if (!Array.isArray(consultationSessions) || consultationSessions.length === 0) {
      return [];
    }

    const sorted = [...consultationSessions].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      if (ta !== tb) return ta - tb;
      return (a.id || 0) - (b.id || 0);
    });

    return sorted.map((item, index) => ({
      ...item,
      displayNo: index + 1,
    }));
  }, [consultationSessions]);

  const pendingPaymentReservations = useMemo(
    () =>
      reservations.filter(
        (item) => item?.status === "PENDING" && item?.procedureId
      ),
    [reservations]
  );

  const getPaymentStatusLabel = (status) => {
    if (status === "PAID") return "결제 완료";
    if (status === "CANCELED") return "결제 취소";
    if (status === "FAILED") return "결제 실패";
    if (status === "READY") return "결제 대기";
    if (status === "EXPIRED") return "결제 만료";
    return status || "-";
  };

  const getReservationStatusLabel = (status) => {
    if (status === "PENDING") return "예약중";
    if (status === "CONFIRMED") return "예약 확정";
    if (status === "CANCELED") return "예약 취소";
    if (status === "COMPLETED") return "완료";
    return status || "-";
  };

  const getPageItems = (items, page) => {
    const safePage = Math.max(page, 1);
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= 0) return [];
    let start = Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2));
    let end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };

  const renderPagination = (items, currentPage, setPage) => {
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
      <div className="skin-dashboard-pagination">
        <button
          type="button"
          className="skin-dashboard-page-button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          이전
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            className={`skin-dashboard-page-button ${page === currentPage ? "active" : ""}`}
            onClick={() => setPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="skin-dashboard-page-button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </div>
    );
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  useEffect(() => {
    const fetchMyPageData = async () => {
      setLoading(true);

      try {
        const memberData = await getMyMemberInfo();
        setMember(memberData);

        const surveyData = await getLatestSkinSurveyByUser(memberData.id).catch(() => null);
        setSurvey(surveyData);

        const recommendationPageData = await getRecommendationHistoriesByUser(memberData.id, 0, 5).catch(() => ({ content: [] }));
        setRecommendations(recommendationPageData?.content || []);

        const reservationData = await getMyReservations().catch(() => []);
        setReservations(Array.isArray(reservationData) ? reservationData : []);

        const paymentResponse = await fetch(`${API_BASE_URL}/api/payments/me`, {
          credentials: "include",
        }).catch(() => null);

        if (paymentResponse?.ok) {
          const paymentData = await paymentResponse.json();
          setPayments(Array.isArray(paymentData) ? paymentData : []);
        } else {
          setPayments([]);
        }

        const treatmentResponse = await fetch(`${API_BASE_URL}/api/treatment-records/me`, {
          credentials: "include",
        }).catch(() => null);

        if (treatmentResponse?.ok) {
          const treatmentData = await treatmentResponse.json();
          setTreatmentRecords(Array.isArray(treatmentData) ? treatmentData : []);
        } else {
          setTreatmentRecords([]);
        }

        const consultationResponse = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
          credentials: "include",
        }).catch(() => null);

        if (consultationResponse?.ok) {
          const consultationData = await consultationResponse.json();
          setConsultationSessions(Array.isArray(consultationData) ? consultationData : []);
        } else {
          setConsultationSessions([]);
        }

        const notificationData = await getUserNotifications(memberData.id, "ALL").catch(() => []);
        setNotifications(Array.isArray(notificationData) ? notificationData : []);
      } catch (error) {
        console.error("스킨 대시보드 데이터를 불러오지 못했습니다.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPageData();
  }, []);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(recommendations.length / ITEMS_PER_PAGE));
    if (recommendationPage > maxPage) setRecommendationPage(maxPage);
  }, [recommendations, recommendationPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(reservations.length / ITEMS_PER_PAGE));
    if (reservationPage > maxPage) setReservationPage(maxPage);
  }, [reservations, reservationPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(payments.length / ITEMS_PER_PAGE));
    if (paymentPage > maxPage) setPaymentPage(maxPage);
  }, [payments, paymentPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(pendingPaymentReservations.length / ITEMS_PER_PAGE));
    if (pendingPaymentPage > maxPage) setPendingPaymentPage(maxPage);
  }, [pendingPaymentReservations, pendingPaymentPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(consultationDisplayRows.length / ITEMS_PER_PAGE));
    if (consultationPage > maxPage) setConsultationPage(maxPage);
  }, [consultationDisplayRows, consultationPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(treatmentRecords.length / ITEMS_PER_PAGE));
    if (treatmentPage > maxPage) setTreatmentPage(maxPage);
  }, [treatmentRecords, treatmentPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(notifications.length / ITEMS_PER_PAGE));
    if (notificationPage > maxPage) setNotificationPage(maxPage);
  }, [notifications, notificationPage]);

  if (loading) {
    return <div className="skin-dashboard">피부 대시보드 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="skin-dashboard">
      <div className="skin-dashboard-wrap">
        <section className="skin-dashboard-hero">
          <div className="skin-dashboard-hero-content">
            <p className="skin-dashboard-kicker">MY PAGE OVERVIEW</p>
            <h1>{member?.name || member?.loginId || "회원"}님의 피부 대시보드</h1>
            <p>
              내 피부 설문, 추천 시술, 예약과 결제, 상담 내역, 시술 기록과 알림까지
              한 화면에서 확인할 수 있어요.
            </p>

            <div className="skin-dashboard-widget-row">
              <div className="skin-dashboard-widget">
                <span className="skin-dashboard-widget-emoji">🧴</span>
                <div>
                  <strong>{survey ? getSkinTypeLabel(survey.skinType) : "진단 정보 없음"}</strong>
                  <p>현재 피부 타입 진단 결과</p>
                </div>
              </div>

              <div className="skin-dashboard-widget">
                <span className="skin-dashboard-widget-emoji">✨</span>
                <div>
                  <strong>{recommendations.length}건 추천</strong>
                  <p>
                    피부 진단을 바탕으로
                    <br />
                    추천된 시술 내역
                  </p>
                </div>
              </div>

              <div
                className={`skin-dashboard-widget ${notifications.length > 0 ? "skin-dashboard-list-item-clickable" : ""}`}
                role={notifications.length > 0 ? "button" : undefined}
                tabIndex={notifications.length > 0 ? 0 : undefined}
                onClick={() => {
                  if (notifications.length > 0) {
                    navigate("/mypage/notifications");
                  }
                }}
                onKeyDown={(event) => {
                  if (notifications.length > 0 && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    navigate("/mypage/notifications");
                  }
                }}
              >
                <span className="skin-dashboard-widget-emoji">🔔</span>
                <div>
                  <strong>{notifications.length}건 알림</strong>
                  <p>새로운 알림 내역 확인</p>
                </div>
              </div>
            </div>
          </div>

          <div className="skin-dashboard-hero-aside">
            <span>최근 피부 진단 결과</span>
            <strong>{survey ? getSkinTypeLabel(survey.skinType) : "진단 결과 없음"}</strong>
            <p>
              {recommendations.length > 0
                ? `${recommendations.length}건의 맞춤 추천 내역을 확인해보세요.`
                : "맞춤 추천 내역이 아직 없습니다."}
            </p>
          </div>
        </section>

        <section className="skin-dashboard-card">
          <h2>내 피부 진단 결과</h2>
          {survey ? (
            <>
              <p>
                <strong>피부 타입</strong> {getSkinTypeLabel(survey.skinType)}
              </p>
              <p>
                <strong>주요 고민</strong>{" "}
                {survey.concerns?.map(getSkinConcernLabel).join(", ") || "선택 항목 없음"}
              </p>
            </>
          ) : (
            <p>아직 피부 진단 결과가 없습니다.</p>
          )}
        </section>

        <section className="skin-dashboard-card">
          <button type="button" className="skin-dashboard-section-toggle" onClick={() => toggleSection("recommendations")}>
            <h2>추천 시술 내역</h2>
            <span>{expandedSection === "recommendations" ? "접기" : "보기"}</span>
          </button>

          {expandedSection === "recommendations" ? (
            <>
              {recommendations.length > 0 ? (
                <>
                  <div className="skin-dashboard-list">
                    {getPageItems(recommendations, recommendationPage).map((item) => (
                      <div
                        key={item.recommendationId}
                        className="skin-dashboard-list-item skin-dashboard-list-item-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/recommendations/${item.recommendationId}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(`/recommendations/${item.recommendationId}`);
                          }
                        }}
                      >
                        <strong>추천 #{item.recommendationId}</strong>
                        <p>{getSkinTypeLabel(item.skinTypeCode)}</p>
                        <p>{item.concernCodes?.map(getSkinConcernLabel).join(", ") || "고민 정보 없음"}</p>
                      </div>
                    ))}
                  </div>
                  {renderPagination(recommendations, recommendationPage, setRecommendationPage)}
                </>
              ) : (
                <p>추천 시술 내역이 없습니다.</p>
              )}
            </>
          ) : null}
        </section>

        <section className="skin-dashboard-card">
          <button type="button" className="skin-dashboard-section-toggle" onClick={() => toggleSection("reservations")}>
            <h2>내 예약 내역</h2>
            <span>{expandedSection === "reservations" ? "접기" : "보기"}</span>
          </button>

          {expandedSection === "reservations" ? (
            <>
              <div className="skin-dashboard-list">
                {reservations.length === 0 ? (
                  <p>예약 내역이 없습니다.</p>
                ) : (
                  getPageItems(reservations, reservationPage).map((item) => (
                    <div
                      key={item.reservationId}
                      className="skin-dashboard-list-item skin-dashboard-list-item-clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate("/reservations")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate("/reservations");
                        }
                      }}
                    >
                      <strong>예약 {item.procedureName}</strong>
                      <p>{formatDateTime(`${item.reservationDate} ${String(item.reservationTime).slice(0, 5)}`)}</p>
                      <p>{getReservationStatusLabel(item.status)}</p>
                    </div>
                  ))
                )}
              </div>
              {renderPagination(reservations, reservationPage, setReservationPage)}
            </>
          ) : null}
        </section>

        <section className="skin-dashboard-card">
          <button type="button" className="skin-dashboard-section-toggle" onClick={() => toggleSection("payments")}>
            <h2>결제 내역</h2>
            <span>{expandedSection === "payments" ? "접기" : "보기"}</span>
          </button>

          {expandedSection === "payments" ? (
            <>
              <h3 className="skin-dashboard-subtitle">결제 대기 중인 예약</h3>
              <div className="skin-dashboard-list">
                {pendingPaymentReservations.length === 0 ? (
                  <p>결제가 필요한 예약이 없습니다.</p>
                ) : (
                  getPageItems(pendingPaymentReservations, pendingPaymentPage).map((item) => (
                    <div key={item.reservationId} className="skin-dashboard-list-item">
                      <strong>결제 대기 {item.procedureName}</strong>
                      <p>
                        {formatDateTime(
                          `${item.reservationDate} ${String(item.reservationTime).slice(0, 5)}`
                        )}
                      </p>
                      <p>결제가 필요한 예약입니다.</p>
                      <button
                        type="button"
                        className="skin-dashboard-pay-button"
                        onClick={() =>
                          navigate(
                            `/payments/test/${item.procedureId}?reservationId=${item.reservationId}`
                          )
                        }
                      >
                        결제하러 가기
                      </button>
                    </div>
                  ))
                )}
              </div>
              {renderPagination(
                pendingPaymentReservations,
                pendingPaymentPage,
                setPendingPaymentPage
              )}

              <h3 className="skin-dashboard-subtitle">결제 기록</h3>
              <div className="skin-dashboard-list">
                {payments.length === 0 ? (
                  <p>결제 내역이 없습니다.</p>
                ) : (
                  getPageItems(payments, paymentPage).map((item) => (
                    <div key={item.id} className="skin-dashboard-list-item">
                      <strong>결제 {item.procedureName}</strong>
                      <p>{Number(item.amount || 0).toLocaleString()}원</p>
                      <p>{getPaymentStatusLabel(item.status)} / {formatDateTime(item.paidAt)}</p>
                    </div>
                  ))
                )}
              </div>
              {renderPagination(payments, paymentPage, setPaymentPage)}
            </>
          ) : null}
        </section>

        <section className="skin-dashboard-card">
          <button type="button" className="skin-dashboard-section-toggle" onClick={() => toggleSection("consultations")}>
            <h2>상담 내역</h2>
            <span>{expandedSection === "consultations" ? "접기" : "보기"}</span>
          </button>

          {expandedSection === "consultations" ? (
            <>
              <div className="skin-dashboard-list">
                {consultationDisplayRows.length === 0 ? (
                  <p>상담 내역이 없습니다.</p>
                ) : (
                  getPageItems(consultationDisplayRows, consultationPage).map((item) => (
                    <div
                      key={item.id}
                      className="skin-dashboard-list-item skin-dashboard-list-item-clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/mypage/consultations?sessionId=${item.id}&mode=history`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/mypage/consultations?sessionId=${item.id}&mode=history`);
                        }
                      }}
                    >
                      <strong>상담 #{item.displayNo}</strong>
                      <p>{item.status === "OPEN" ? "진행 중인 상담" : "종료된 상담"}</p>
                      <p>{formatDateTime(item.closedAt || item.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
              {renderPagination(consultationDisplayRows, consultationPage, setConsultationPage)}
            </>
          ) : null}
        </section>

        <section className="skin-dashboard-card">
          <button type="button" className="skin-dashboard-section-toggle" onClick={() => toggleSection("treatments")}>
            <h2>시술 기록</h2>
            <span>{expandedSection === "treatments" ? "접기" : "보기"}</span>
          </button>

          {expandedSection === "treatments" ? (
            <>
              <div className="skin-dashboard-list">
                {treatmentRecords.length === 0 ? (
                  <p>시술 기록이 없습니다.</p>
                ) : (
                  getPageItems(treatmentRecords, treatmentPage).map((item) => (
                    <div
                      key={item.id}
                      className="skin-dashboard-list-item skin-dashboard-list-item-clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate("/mypage/records")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate("/mypage/records");
                        }
                      }}
                    >
                      <strong>시술 기록 {item.procedureName}</strong>
                      <p>시술일 {formatDateTime(item.treatmentDate)}</p>
                      <p>
                        시술 전 {item.beforeImageUrl ? "이미지 있음" : "이미지 없음"} / 시술 후{" "}
                        {item.afterImageUrl ? "이미지 있음" : "이미지 없음"}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {renderPagination(treatmentRecords, treatmentPage, setTreatmentPage)}

              <div className="skin-dashboard-list" style={{ marginTop: 12 }}>
                <div
                  className="skin-dashboard-list-item skin-dashboard-list-item-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/mypage/reviews")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate("/mypage/reviews");
                    }
                  }}
                >
                  <strong>시술 리뷰 작성</strong>
                  <p>내가 받은 시술에 대한 후기를 남겨보세요.</p>
                </div>
              </div>
            </>
          ) : null}
        </section>

        <section className="skin-dashboard-card">
          <button type="button" className="skin-dashboard-section-toggle" onClick={() => toggleSection("notifications")}>
            <h2>알림 내역</h2>
            <span>{expandedSection === "notifications" ? "접기" : "보기"}</span>
          </button>

          {expandedSection === "notifications" ? (
            <>
              <div className="skin-dashboard-list">
                {notifications.length === 0 ? (
                  <p>알림 내역이 없습니다.</p>
                ) : (
                  getPageItems(notifications, notificationPage).map((item) => (
                    <div
                      key={item.id}
                      className="skin-dashboard-list-item skin-dashboard-list-item-clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate("/mypage/notifications")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate("/mypage/notifications");
                        }
                      }}
                    >
                      <strong>알림 [{item.type || "SYSTEM"}]</strong>
                      <p>{item.message || "-"}</p>
                      <p>{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
              {renderPagination(notifications, notificationPage, setNotificationPage)}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
