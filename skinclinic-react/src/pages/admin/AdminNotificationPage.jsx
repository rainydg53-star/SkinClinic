import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/utils/date";
import {
  getAllNotifications,
  getNotificationMembers,
  triggerNotificationEvent,
} from "@/api/notificationApi";
import "@/pages/mypage/mypagesection.css";
import "./admin-notification.css";

const initialForm = {
  userId: 1,
  type: "RESERVATION",
  title: "",
  message: "",
  eventReference: "",
};

const TYPE_LABEL = {
  RESERVATION: "예약",
  PAYMENT: "결제",
  CONSULTATION: "상담",
  CANCELLATION: "취소",
};

const getDefaultTitlePreview = (memberName, type) => {
  if (!memberName) return "";

  switch (type) {
    case "RESERVATION":
      return `${memberName}님 예약 안내`;
    case "PAYMENT":
      return `${memberName}님 결제 완료 안내`;
    case "CONSULTATION":
      return `${memberName}님 1:1 상담 안내`;
    case "CANCELLATION":
      return `${memberName}님 취소 안내`;
    default:
      return "";
  }
};

const getDefaultMessagePreview = (memberName, type, eventReference) => {
  if (!memberName) return "";

  const reference =
    eventReference?.trim() || "상세 정보는 마이페이지에서 확인해주세요.";

  switch (type) {
    case "RESERVATION":
      return `${memberName}님의 예약 이벤트가 발생했습니다. ${reference}`;
    case "PAYMENT":
      return `${memberName}님의 결제 이벤트가 발생했습니다. ${reference}`;
    case "CONSULTATION":
      return `${memberName}님의 1:1 상담 이벤트가 발생했습니다. ${reference}`;
    case "CANCELLATION":
      return `${memberName}님의 취소 이벤트가 발생했습니다. ${reference}`;
    default:
      return "";
  }
};

const getMemberOptionLabel = (member) =>
  `${member.memberName} - ${member.phone || "휴대폰 없음"}`;

const buildDeliveryModalState = (notification) => {
  const lastAttempt = notification?.attempts?.at(-1);
  const success = Boolean(notification?.kakaoSent || notification?.smsSent);

  if (success) {
    return {
      open: true,
      title: "전송 완료",
      message:
        notification?.deliverySummary ||
        lastAttempt?.detail ||
        "메시지 전송이 완료되었습니다.",
      tone: "success",
    };
  }

  return {
    open: true,
    title: "전송 실패",
    message:
      lastAttempt?.detail ||
      notification?.deliverySummary ||
      "메시지 전송 중 문제가 발생했습니다. 설정과 발송 이력을 확인해주세요.",
    tone: "warning",
  };
};

export default function AdminNotificationPage() {
  const [form, setForm] = useState(initialForm);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberLoadError, setMemberLoadError] = useState("");
  const [notificationLoadError, setNotificationLoadError] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showMemberNoResult, setShowMemberNoResult] = useState(false);
  const [modalState, setModalState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "success",
  });

  const loadPage = async () => {
    setIsLoadingMembers(true);
    setMemberLoadError("");
    setNotificationLoadError("");

    const [memberResult, notificationResult] = await Promise.allSettled([
      getNotificationMembers(),
      getAllNotifications(),
    ]);

    if (memberResult.status === "fulfilled") {
      const memberData = memberResult.value;
      setMembers(memberData);

      if (memberData.length > 0) {
        const preferredMemberId =
          memberData.find((item) => item.memberId === form.userId)?.memberId ??
          memberData[0].memberId;

        setForm((prev) => ({
          ...prev,
          userId:
            memberData.some((item) => item.memberId === prev.userId)
              ? prev.userId
              : preferredMemberId,
        }));
      }
    } else {
      console.error("회원 목록 조회 실패", memberResult.reason);
      setMembers([]);
      setMemberLoadError(
        memberResult.reason?.response?.data?.message ||
          "회원 목록을 불러오지 못했습니다. 관리자 권한과 서버 응답을 확인해주세요.",
      );
    }

    if (notificationResult.status === "fulfilled") {
      setNotifications(notificationResult.value);
    } else {
      console.error("알림 이력 조회 실패", notificationResult.reason);
      setNotifications([]);
      setNotificationLoadError(
        notificationResult.reason?.response?.data?.message ||
          "알림 이력을 불러오지 못했습니다.",
      );
    }

    setIsLoadingMembers(false);
  };

  useEffect(() => {
    loadPage().catch((error) => console.error(error));
  }, []);

  const selectedMember = useMemo(
    () => members.find((item) => item.memberId === form.userId),
    [members, form.userId],
  );

  const selectedHistory = useMemo(
    () => notifications.filter((item) => item.userId === form.userId),
    [notifications, form.userId],
  );

  const filteredMembers = useMemo(() => {
    const keyword = memberQuery.trim().toLowerCase();

    if (!keyword) {
      return members;
    }

    return members.filter((member) => {
      const haystack = [
        String(member.memberId),
        member.memberName,
        member.memberType,
        member.phone || "",
        getMemberOptionLabel(member),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [members, memberQuery]);

  const defaultTitlePreview = useMemo(
    () => getDefaultTitlePreview(selectedMember?.memberName, form.type),
    [selectedMember, form.type],
  );

  const defaultMessagePreview = useMemo(
    () =>
      getDefaultMessagePreview(
        selectedMember?.memberName,
        form.type,
        form.eventReference,
      ),
    [selectedMember, form.type, form.eventReference],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "userId" ? Number(value) : value,
    }));
  };

  const handleMemberQueryChange = (event) => {
    const value = event.target.value;
    setMemberQuery(value);
    setIsMemberDropdownOpen(true);
    setShowMemberNoResult(false);

    const matchedMember = members.find(
      (member) => getMemberOptionLabel(member) === value,
    );

    if (matchedMember) {
      setForm((prev) => ({
        ...prev,
        userId: matchedMember.memberId,
      }));
    }
  };

  const handleMemberSelect = (member) => {
    setMemberQuery(getMemberOptionLabel(member));
    setForm((prev) => ({
      ...prev,
      userId: member.memberId,
    }));
    setIsMemberDropdownOpen(false);
    setShowMemberNoResult(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedMember) {
      setModalState({
        open: true,
        title: "대상 회원 확인",
        message: "먼저 회원검색에서 대상 회원을 선택해주세요.",
        tone: "warning",
      });
      return;
    }

    try {
      const data = await triggerNotificationEvent({
        userId: form.userId,
        type: form.type,
        title: form.title.trim() || null,
        message: form.message.trim() || null,
        eventReference: form.eventReference.trim() || null,
      });

      setLastResult(data);
      setForm((prev) => ({
        ...prev,
        title: "",
        message: "",
        eventReference: "",
      }));

      await loadPage();
      setModalState(buildDeliveryModalState(data));
    } catch (error) {
      console.error("자동 알림 생성 실패", error);
      setModalState({
        open: true,
        title: "전송 실패",
        message:
          error?.response?.data?.message ||
          "메시지 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        tone: "warning",
      });
    }
  };

  return (
    <section className="mypage-section-card admin-notification-page">
      {modalState.open ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() =>
            setModalState((current) => ({ ...current, open: false }))
          }
        >
          <div
            className={`admin-modal admin-modal-${modalState.tone}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="admin-modal-kicker">
              {modalState.tone === "success" ? "Notification Sent" : "Check Required"}
            </span>
            <h3 id="admin-modal-title">{modalState.title}</h3>
            <p>{modalState.message}</p>
            <button
              type="button"
              className="admin-modal-button"
              onClick={() =>
                setModalState((current) => ({ ...current, open: false }))
              }
            >
              확인
            </button>
          </div>
        </div>
      ) : null}

      <div className="notification-header admin-notification-hero">
        <div>
          <span className="admin-notification-badge">Notification Control</span>
          <h2>예약/결제/상담 자동 알림 관리</h2>
          <p className="notification-subtitle">
            회원을 검색해 선택한 뒤 예약, 결제, 상담 알림을 전송할 수 있습니다.
          </p>
        </div>
        <div className="admin-notification-hero-meta">
          <div className="admin-hero-stat">
            <span>대상 회원</span>
            <strong>{members.length}명</strong>
          </div>
          <div className="admin-hero-stat">
            <span>알림 이력</span>
            <strong>{selectedHistory.length}건</strong>
          </div>
        </div>
      </div>

      {memberLoadError ? (
        <div className="admin-notification-feedback admin-notification-feedback-error">
          회원 목록 오류: {memberLoadError}
        </div>
      ) : null}

      {notificationLoadError ? (
        <div className="admin-notification-feedback admin-notification-feedback-warning">
          알림 이력 오류: {notificationLoadError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mypage-section-list admin-form">
        <div className="mypage-section-item admin-form-card admin-search-inline-card">
          <p>회원검색</p>
          <div className="notification-member-search-wrap">
            <input
              className="notification-member-search-input"
              value={memberQuery}
              onChange={handleMemberQueryChange}
              placeholder="이름, 회원 번호, 휴대폰 번호 검색"
              disabled={isLoadingMembers || members.length === 0}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                if (filteredMembers.length === 0) {
                  setIsMemberDropdownOpen(false);
                  setShowMemberNoResult(true);
                  return;
                }

                setIsMemberDropdownOpen(true);
                setShowMemberNoResult(false);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsMemberDropdownOpen(false);
                }, 120);
              }}
            />
            <button
              type="button"
              className={`notification-member-toggle ${isMemberDropdownOpen ? "open" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsMemberDropdownOpen((prev) => !prev)}
              disabled={isLoadingMembers || members.length === 0}
              aria-label="회원 목록 펼치기"
            >
              <span className="notification-member-toggle-icon" />
            </button>
            {isLoadingMembers ? (
              <div className="notification-member-empty notification-member-overlay-empty">
                회원 목록을 불러오는 중입니다.
              </div>
            ) : isMemberDropdownOpen && filteredMembers.length > 0 ? (
              <div className="notification-member-list">
                {filteredMembers.map((member) => (
                  <button
                    key={member.memberId}
                    type="button"
                    className={`notification-member-list-item ${form.userId === member.memberId ? "active" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleMemberSelect(member)}
                  >
                    <span className="notification-member-list-label">
                      {getMemberOptionLabel(member)}
                    </span>
                  </button>
                ))}
              </div>
            ) : showMemberNoResult ? (
              <div className="notification-member-empty notification-member-overlay-empty">
                검색 조건에 맞는 회원이 없습니다.
              </div>
            ) : members.length === 0 ? (
              <div className="notification-member-empty notification-member-overlay-empty">
                불러온 회원이 없습니다. 회원가입된 계정이 있는지 확인해주세요.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mypage-section-item admin-form-card">
          <p>대상 회원</p>
          <input
            type="text"
            value={selectedMember ? getMemberOptionLabel(selectedMember) : ""}
            readOnly
            placeholder="회원검색에서 선택한 회원이 표시됩니다"
          />
        </div>

        <div className="mypage-section-item admin-form-card">
          <p>이벤트 유형</p>
          <div className="admin-select-wrap">
            <button
              type="button"
              className="admin-select-trigger"
              disabled={!selectedMember}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsTypeDropdownOpen(false);
                }, 120);
              }}
            >
              {TYPE_LABEL[form.type]}
            </button>
            <span
              className={`admin-select-icon ${isTypeDropdownOpen ? "open" : ""}`}
              aria-hidden="true"
            />
            {isTypeDropdownOpen ? (
              <div className="admin-select-list">
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`admin-select-list-item ${form.type === value ? "active" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, type: value }));
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mypage-section-item admin-form-card admin-form-card-wide">
          <p>알림 상세 내용</p>
          <input
            name="eventReference"
            value={form.eventReference}
            onChange={handleChange}
            placeholder="예: 2026-03-25 14:00 예약 확정"
          />
        </div>

        <div className="mypage-section-item admin-form-card admin-form-card-wide">
          <p>직접 입력할 제목(선택)</p>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder={`비우면 자동 제목 사용: ${defaultTitlePreview}`}
          />
          <span className="admin-form-help">
            기본 제목: {defaultTitlePreview}
          </span>
        </div>

        <div className="mypage-section-item admin-form-card admin-form-card-wide">
          <p>직접 입력할 메시지(선택)</p>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder={`비우면 자동 메시지 사용: ${defaultMessagePreview}`}
          />
          <span className="admin-form-help admin-form-help-block">
            기본 메시지: {defaultMessagePreview}
          </span>
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            className="notification-read-button admin-submit-button"
          >
            알림 전송하기
          </button>
        </div>
      </form>

      <div className="admin-status-grid">
        {lastResult && (
          <div className="mypage-section-item admin-status-card admin-result-card">
            <span className="admin-status-label">최근 처리 결과</span>
            <strong>
              [{TYPE_LABEL[lastResult.type]}] {lastResult.title}
            </strong>
            <p>{lastResult.message}</p>
            <p>최종 요약: {lastResult.deliverySummary}</p>
            <p>최종 채널: {lastResult.lastDeliveryChannel || "없음"}</p>
          </div>
        )}
      </div>

      <div className="admin-notification-history">
        <div className="admin-history-header">
          <div>
            <h3>선택 회원 알림 이력</h3>
            <p className="admin-history-count">{selectedHistory.length}건</p>
          </div>
        </div>

        <div className="mypage-section-list">
          {selectedHistory.map((item) => (
            <div
              key={item.id}
              className="mypage-section-item admin-history-card"
            >
              <div className="admin-history-card-top">
                <strong>
                  [{TYPE_LABEL[item.type]}] {item.title}
                </strong>
                <span className="notification-channel">
                  {item.lastDeliveryChannel || "미발송"}
                </span>
              </div>
              <p>{item.message}</p>
              <div className="admin-history-meta">
                <span>요약: {item.deliverySummary}</span>
                <span>생성일: {formatDateTime(item.createdAt)}</span>
              </div>
              <div className="admin-attempt-list">
                {item.attempts?.map((attempt) => (
                  <p
                    key={`${item.id}-${attempt.sequence}`}
                    className="admin-attempt-item"
                  >
                    {attempt.sequence}. {attempt.channel} / {attempt.status} /{" "}
                    {attempt.failureReason} / {attempt.detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
