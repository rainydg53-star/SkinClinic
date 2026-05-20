import { useEffect, useMemo, useState } from "react";
import {
  adminAddClosedDay,
  adminGetAllReservations,
  adminGetClosedDays,
  adminGetReservationDetail,
  adminGetReservationStats,
  adminRemoveClosedDay,
  adminUpdateReservationStatus,
} from "@/api/reservationApi";
import { useAlertModal } from "@/components/useAlertModal";
import "./admin-reservations.css";

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const DOT_COLOR = {
  PENDING: "#f1a43c",
  CONFIRMED: "#d14b4b",
  CANCELED: "#9e9e9e",
  COMPLETED: "#3d7ab5",
};

function getMonthRange(year, month) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const toYmd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: toYmd(from), to: toYmd(to) };
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days = last.getDate();
  const arr = [];
  for (let i = 0; i < startPad; i += 1) arr.push(null);
  for (let d = 1; d <= days; d += 1) arr.push(d);
  return arr;
}

function toYMD(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getStatusLabel(status) {
  if (status === "PENDING") return "예약중";
  if (status === "CONFIRMED") return "확정";
  if (status === "CANCELED") return "취소";
  if (status === "COMPLETED") return "완료";
  return status || "-";
}

export default function AdminReservationsPage() {
  const { showAlert, showConfirm } = useAlertModal();
  const [allReservations, setAllReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [closedDaySet, setClosedDaySet] = useState(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [reservations, statsData] = await Promise.all([
        adminGetAllReservations(),
        adminGetReservationStats(),
      ]);
      setAllReservations(reservations);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
      setAllReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClosedDaysForMonth = async (year, month) => {
    try {
      const { from, to } = getMonthRange(year, month);
      const data = await adminGetClosedDays(from, to);
      setClosedDaySet(new Set((Array.isArray(data) ? data : []).map((item) => item.date)));
    } catch (err) {
      setError(err.message);
      setClosedDaySet(new Set());
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadClosedDaysForMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const reservationsByDate = useMemo(() => {
    const map = {};
    for (const reservation of allReservations) {
      const date = reservation.reservationDate;
      if (!map[date]) map[date] = [];
      map[date].push(reservation);
    }
    return map;
  }, [allReservations]);

  const statusesByDate = useMemo(() => {
    const map = {};
    for (const [date, list] of Object.entries(reservationsByDate)) {
      const set = new Set(list.map((reservation) => reservation.status));
      map[date] = Array.from(set);
    }
    return map;
  }, [reservationsByDate]);

  const selectedList = useMemo(() => {
    if (!selectedDate) return [];
    return (reservationsByDate[selectedDate] || []).sort((a, b) =>
      String(a.reservationTime).localeCompare(String(b.reservationTime))
    );
  }, [selectedDate, reservationsByDate]);

  const selectedDateIsClosed = selectedDate ? closedDaySet.has(selectedDate) : false;

  const days = getDaysInMonth(viewYear, viewMonth);
  const todayYMD = toYMD(new Date());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
      return;
    }
    setViewMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
      return;
    }
    setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day) => {
    if (day == null) return;
    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(ymd);
  };

  const handleDetail = async (id) => {
    try {
      const detail = await adminGetReservationDetail(id);
      showAlert({
        title: `예약 #${detail.reservationId}`,
        message:
          `회원: ${detail.memberName ?? "-"} (ID: ${detail.memberId})\n` +
          `시술: ${detail.procedureName}\n` +
          `일시: ${detail.reservationDate} ${String(detail.reservationTime).slice(0, 5)}\n` +
          `상태: ${getStatusLabel(detail.status)}`,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = (id, status) => {
    const label = status === "CANCELED" ? "취소" : "완료";
    showConfirm({
      title: "예약 상태 변경",
      message: `해당 예약을 ${label} 처리할까요?`,
      confirmText: "변경",
      cancelText: "닫기",
      onConfirm: async () => {
        try {
          await adminUpdateReservationStatus(id, status);
          await loadAll();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  };

  const handleToggleClosedDay = async () => {
    if (!selectedDate) return;

    try {
      if (selectedDateIsClosed) {
        await adminRemoveClosedDay(selectedDate);
      } else {
        await adminAddClosedDay(selectedDate);
      }
      await loadClosedDaysForMonth(viewYear, viewMonth);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-reservations-page">
      <header className="admin-reservations-header">
        <h2>예약 관리</h2>
        <button type="button" onClick={loadAll} disabled={loading}>
          새로고침
        </button>
      </header>

      {stats ? (
        <div className="admin-reservations-stats">
          <div>
            <span>오늘 예약</span>
            <strong>{stats.todayCount}</strong>
          </div>
          <div>
            <span>전체 예약</span>
            <strong>{stats.totalCount}</strong>
          </div>
        </div>
      ) : null}

      {error ? <div className="admin-reservations-error">{error}</div> : null}

      <section className="admin-reservations-calendar">
        <div className="admin-reservations-calendar-header">
          <button type="button" onClick={handlePrevMonth} aria-label="이전 달">&lt;</button>
          <h3>{viewYear}년 {MONTHS[viewMonth]}</h3>
          <button type="button" onClick={handleNextMonth} aria-label="다음 달">&gt;</button>
        </div>

        <div className="admin-reservations-legend">
          <span><i style={{ backgroundColor: DOT_COLOR.PENDING }} />예약중</span>
          <span><i style={{ backgroundColor: DOT_COLOR.CONFIRMED }} />확정</span>
          <span><i style={{ backgroundColor: DOT_COLOR.COMPLETED }} />완료</span>
          <span><i style={{ backgroundColor: DOT_COLOR.CANCELED }} />취소</span>
          <span><b className="closed-chip">휴진</b></span>
        </div>

        <div className="admin-reservations-dow">
          {DOW.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="admin-reservations-grid">
          {days.map((day, i) => {
            if (day == null) return <div key={`empty-${i}`} className="empty-cell" />;

            const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const statuses = statusesByDate[ymd] || [];
            const isSelected = selectedDate === ymd;
            const isToday = todayYMD === ymd;
            const isClosedDay = closedDaySet.has(ymd);

            return (
              <button
                key={ymd}
                type="button"
                className={`day-cell ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${isClosedDay ? "closed" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <span>{day}</span>
                <div className="day-footer">
                  {isClosedDay ? <em>휴진</em> : null}
                  {statuses.length > 0 ? (
                    <div className="dots">
                      {statuses.map((status) => (
                        <i key={status} style={{ backgroundColor: DOT_COLOR[status] ?? "#999" }} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedDate ? (
        <section className="admin-reservations-list">
          <div className="admin-reservations-list-header">
            <h3>{selectedDate} 예약</h3>
            <button
              type="button"
              className={`closed-toggle-btn ${selectedDateIsClosed ? "active" : ""}`}
              onClick={handleToggleClosedDay}
            >
              {selectedDateIsClosed ? "휴진 해제" : "휴진 설정"}
            </button>
          </div>

          {selectedList.length === 0 ? (
            <p className="empty-text">해당 날짜의 예약이 없습니다.</p>
          ) : (
            <div className="list-table">
              <div className="row head">
                <div>예약번호</div>
                <div>시간</div>
                <div>시술</div>
                <div>상태</div>
                <div />
              </div>
              {selectedList.map((reservation) => (
                <div key={reservation.reservationId} className="row">
                  <div>{reservation.reservationId}</div>
                  <div>{String(reservation.reservationTime).slice(0, 5)}</div>
                  <div>{reservation.procedureName}</div>
                  <div>
                    <span className={`status-badge ${reservation.status.toLowerCase()}`}>
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>
                  <div className="actions">
                    <button type="button" className="secondary" onClick={() => handleDetail(reservation.reservationId)}>
                      상세
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={!["PENDING", "CONFIRMED"].includes(reservation.status)}
                      onClick={() => handleUpdateStatus(reservation.reservationId, "CANCELED")}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={reservation.status !== "CONFIRMED"}
                      onClick={() => handleUpdateStatus(reservation.reservationId, "COMPLETED")}
                    >
                      완료
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}