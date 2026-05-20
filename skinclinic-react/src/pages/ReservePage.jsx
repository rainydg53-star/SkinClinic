import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from '@/config/api'
import {
  cancelMyReservation,
  createReservation,
  getMyReservations,
  getProceduresForReservation,
  getReservationAvailability,
} from "@/api/reservationApi";
import "./ReservePage.css";

function buildTimeSlots() {
  const slots = [];
  for (let hour = 10; hour <= 18; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 18 && minute === 30) continue;
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

function normalizeTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function todayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nowHm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getReservationStatusLabel(status) {
  if (status === "PENDING") return "예약 대기";
  if (status === "CONFIRMED") return "예약 확정";
  if (status === "CANCELED") return "예약 취소";
  if (status === "COMPLETED") return "시술 완료";
  return status || "-";
}

export default function ReservePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [procedures, setProcedures] = useState([]);
  const [procedureId, setProcedureId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState(null);
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [myReservations, setMyReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("reserve");
  const requestedProcedureId = searchParams.get("procedureId");

  const currentDate = useMemo(() => todayYmd(), []);
  const currentTime = useMemo(() => nowHm(), []);
  const loginRedirectPath = "/reservations";

  const ensureAuthenticated = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        navigate(`/login?redirect=${encodeURIComponent(loginRedirectPath)}`);
        return false;
      }

      const auth = await response.json();
      if (auth.authenticated !== true) {
        navigate(`/login?redirect=${encodeURIComponent(loginRedirectPath)}`);
        return false;
      }

      return true;
    } catch {
      navigate(`/login?redirect=${encodeURIComponent(loginRedirectPath)}`);
      return false;
    }
  };

  const byDate = useMemo(() => {
    const map = {};
    for (const reservation of myReservations) {
      const date = reservation.reservationDate;
      if (!map[date]) {
        map[date] = [];
      }
      map[date].push(reservation);
    }

    for (const list of Object.values(map)) {
      list.sort((a, b) => String(a.reservationTime).localeCompare(String(b.reservationTime)));
    }

    return Object.keys(map)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: map[key] }), {});
  }, [myReservations]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const procedureList = await getProceduresForReservation();
        setProcedures(procedureList);
        if (procedureList.length > 0) {
          const hasRequestedProcedure = requestedProcedureId
            ? procedureList.some((item) => String(item.id) === String(requestedProcedureId))
            : false;
          setProcedureId(
            hasRequestedProcedure ? String(requestedProcedureId) : String(procedureList[0].id)
          );
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [requestedProcedureId]);

  useEffect(() => {
    if (!reservationDate) {
      setAvailableTimeSlots(null);
      setIsClosedDay(false);
      return;
    }

    getReservationAvailability(reservationDate)
      .then((data) => {
        setIsClosedDay(Boolean(data?.closedDay));
        if (!data?.slots) {
          setAvailableTimeSlots(null);
          return;
        }
        const available = data.slots
          .filter((slot) => slot.available)
          .map((slot) => normalizeTime(slot.time));
        setAvailableTimeSlots(available);
      })
      .catch((e) => {
        setIsClosedDay(false);
        setError(e.message);
      });
  }, [reservationDate]);

  const refreshMyData = async () => {
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    const reservationsData = await getMyReservations().catch(() => []);
    setMyReservations(Array.isArray(reservationsData) ? reservationsData : []);
  };

  useEffect(() => {
    if (view !== "schedule") {
      return;
    }

    refreshMyData();
  }, [view]);

  const handleReserve = async () => {
    try {
      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) {
        return;
      }

      setLoading(true);
      setError("");
      await createReservation({
        procedureId: Number(procedureId),
        reservationDate,
        reservationTime,
      });
      await refreshMyData();
      setView("schedule");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    try {
      setLoading(true);
      setError("");
      await cancelMyReservation(reservationId);
      await refreshMyData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isSlotDisabled = (slot) => {
    if (!reservationDate) return true;
    if (reservationDate < currentDate) return true;
    if (reservationDate === currentDate && slot < currentTime) return true;
    if (Array.isArray(availableTimeSlots)) {
      return !availableTimeSlots.includes(slot);
    }
    return false;
  };

  return (
    <div className="reserve-page">
      <header className="reserve-header">
        <h1>시술 예약</h1>
        <div className="reserve-tabs">
          <button
            type="button"
            className={view === "reserve" ? "active" : ""}
            onClick={() => setView("reserve")}
          >
            예약하기
          </button>
          <button
            type="button"
            className={view === "schedule" ? "active" : ""}
            onClick={async () => {
              const isAuthenticated = await ensureAuthenticated();
              if (!isAuthenticated) {
                return;
              }
              setView("schedule");
            }}
          >
            내 일정
          </button>
        </div>
      </header>

      {error ? (
        <div className="reserve-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>닫기</button>
        </div>
      ) : null}

      {view === "reserve" ? (
        <section className="reserve-panel">
          <h2>예약 생성</h2>
          <div className="reserve-grid">
            <label>
              <span>시술</span>
              <select
                value={procedureId}
                onChange={(e) => setProcedureId(e.target.value)}
                disabled={loading}
              >
                {procedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>날짜</span>
              <input
                type="date"
                value={reservationDate}
                min={currentDate}
                onChange={(e) => setReservationDate(e.target.value)}
                disabled={loading}
              />
            </label>

            <label>
              <span>시간</span>
              <select
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                disabled={loading || !reservationDate}
              >
                <option value="">시간 선택</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot} disabled={isSlotDisabled(slot)}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {reservationDate && isClosedDay ? (
            <p className="reserve-empty">해당 날짜는 휴진일이라 예약할 수 없습니다.</p>
          ) : null}

          <div className="reserve-actions">
            <button
              type="button"
              onClick={handleReserve}
              disabled={loading || !procedureId || !reservationDate || !reservationTime || isClosedDay}
            >
              {loading ? "예약 중..." : "예약하기"}
            </button>
          </div>
        </section>
      ) : (
        <section className="reserve-panel">
          <h2>내 일정</h2>
          <div className="reserve-actions">
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError("");
                  await refreshMyData();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              일정 새로고침
            </button>
          </div>

          {myReservations.length === 0 ? (
            <p className="reserve-empty">예약 내역이 없습니다.</p>
          ) : (
            <div className="reserve-schedule">
              {Object.entries(byDate).map(([date, list]) => (
                <div key={date} className="reserve-day">
                  <h3>{date}</h3>
                  <ul>
                    {list.map((reservation) => {
                      const showPaymentState = ["PENDING", "CONFIRMED"].includes(
                        reservation.status
                      );
                      const paymentLabel =
                        reservation.status === "PENDING" ? "결제필요" : "결제완료";
                      return (
                        <li key={reservation.reservationId}>
                          <span>{normalizeTime(reservation.reservationTime)}</span>
                          <span>{reservation.procedureName}</span>
                          <span>{getReservationStatusLabel(reservation.status)}</span>
                          {showPaymentState ? (
                            <span
                              className={`payment-state ${
                                reservation.status === "PENDING" ? "unpaid" : "paid"
                              }`}
                            >
                              {paymentLabel}
                            </span>
                          ) : (
                            <span />
                          )}
                          {reservation.status === "PENDING" ? (
                            <button
                              type="button"
                              className="pay"
                              onClick={() =>
                                navigate(
                                  `/payments/test/${reservation.procedureId}?reservationId=${reservation.reservationId}`
                                )
                              }
                            >
                              결제하기
                            </button>
                          ) : null}
                          {["PENDING", "CONFIRMED"].includes(reservation.status) ? (
                            <button
                              type="button"
                              className="danger"
                              disabled={loading}
                              onClick={() => handleCancel(reservation.reservationId)}
                            >
                              취소
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
