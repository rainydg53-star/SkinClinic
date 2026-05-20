import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getUnreadNotificationCount,
  getUserNotifications,
  markNotificationAsRead,
  triggerMyNotification,
} from "@/api/notificationApi";
import { getMyMemberInfo } from "@/api/memberApi";
import { formatDateTime } from "@/utils/date";
import "./mypagesection.css";

const TYPE_LABEL = {
  RESERVATION: "예약",
  PAYMENT: "결제",
  CONSULTATION: "상담",
  CANCELLATION: "취소",
};

const FILTERS = [
  { label: "전체", value: "ALL" },
  { label: "예약", value: "RESERVATION" },
  { label: "결제", value: "PAYMENT" },
  { label: "상담", value: "CONSULTATION" },
  { label: "취소", value: "CANCELLATION" },
];

export default function NotificationPage() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [unreadCount, setUnreadCount] = useState(0);
  const [testType, setTestType] = useState("RESERVATION");
  const [isTriggering, setIsTriggering] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      try {
        const member = await getMyMemberInfo();
        if (!active) return;
        setCurrentUserId(member?.id ?? null);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setCurrentUserId(null);
      } finally {
        if (active) {
          setIsAuthLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  const loadNotifications = useCallback(async (currentFilter = filter) => {
    if (!currentUserId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const [notificationData, unreadData] = await Promise.all([
      getUserNotifications(currentUserId, currentFilter),
      getUnreadNotificationCount(currentUserId),
    ]);

    const visibleNotifications = (Array.isArray(notificationData) ? notificationData : [])
      .filter((item) => !item.read);
    setNotifications(visibleNotifications);
    setUnreadCount(unreadData.unreadCount);
  }, [currentUserId, filter]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    loadNotifications().catch((error) => console.error(error));
  }, [isAuthLoading, loadNotifications]);

  const handleRead = async (notificationId) => {
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    await markNotificationAsRead(notificationId);
    await loadNotifications();
  };

  const lastNotification = notifications[0] ?? null;

  const activeTypeLabel = useMemo(
    () => TYPE_LABEL[testType],
    [testType],
  );

  const handleTriggerMyNotification = async () => {
    setIsTriggering(true);
    setStatusMessage("");

    try {
      const notification = await triggerMyNotification({
        type: testType,
        eventReference: `${formatDateTime(new Date().toISOString())} 테스트 알림`,
      });

      const lastAttempt = notification?.attempts?.at(-1);
      const deliveryResult =
        notification.kakaoSent || notification.smsSent
          ? notification.deliverySummary ||
            lastAttempt?.detail ||
            "메시지 전송이 완료되었습니다."
          : lastAttempt?.detail ||
            notification.deliverySummary ||
            "알림은 저장됐지만 발송은 실패했습니다.";

      setStatusMessage(`${activeTypeLabel} 테스트 완료: ${deliveryResult}`);
      await loadNotifications();
    } catch (error) {
      console.error(error);
      setStatusMessage(
        error?.response?.data?.message || "테스트 알림 전송 중 문제가 발생했습니다.",
      );
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <section className="mypage-section-card">
      <div className="notification-header">
        <div>
          <h2>알림 내역</h2>
          <p className="notification-subtitle">안 읽은 알림 {unreadCount}건</p>
        </div>
      </div>


      <div className="notification-filter-row">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`notification-filter-button ${filter === item.value ? "active" : ""}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mypage-section-list">
        {notifications.length === 0 ? (
          <div className="mypage-section-item notification-item read">
            <p>확인할 알림이 없습니다.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`mypage-section-item notification-item ${item.read ? "read" : "unread"}`}
            >
              <div className="notification-item-top">
                <strong>
                  [{TYPE_LABEL[item.type]}] {item.title}
                </strong>
                {!item.read && <span className="notification-channel">새 알림</span>}
              </div>

              <p>{item.message}</p>

              <div className="notification-item-bottom">
                <span>{formatDateTime(item.createdAt)}</span>
                <span className="notification-delivery-summary">
                  {item.deliverySummary || "발송 결과 없음"}
                </span>

                <div className="notification-action-row">
                  {!item.read && (
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() => handleRead(item.id)}
                    >
                      확인
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
