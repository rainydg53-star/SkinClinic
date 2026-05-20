import { useEffect, useRef, useState } from "react";
import { getChatbotWelcome, sendChatbotMessage } from "@/api/chatbotApi";
import "./chatbot.css";

export default function ChatbotPage({
  isOpen: controlledOpen,
  onClose,
  hideTrigger = false,
  onMoveToConsultation,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [hasFreeformInteraction, setHasFreeformInteraction] = useState(false);
  const [optionsCollapsed, setOptionsCollapsed] = useState(false);

  const messageListRef = useRef(null);
  const pendingScrollTargetRef = useRef(null);
  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next) => {
    if (isControlled) {
      if (!next && typeof onClose === "function") {
        onClose();
      }
      return;
    }

    setInternalOpen(next);
  };

  useEffect(() => {
    if (!isOpen) return;

    pendingScrollTargetRef.current = null;

    const timer = setTimeout(() => {
      if (!messageListRef.current) return;

      messageListRef.current.scrollTo({
        top: 0,
        behavior: "auto",
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || initialized) return;

    const init = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getChatbotWelcome();

        setMessages([
          {
            role: "bot",
            title: data.answerTitle,
            text: data.answerBody,
            handoff: data.handoffRecommended,
            aiEnhanced: data.aiEnhanced,
          },
        ]);
        setOptions(data.suggestedOptions || []);
        setHasFreeformInteraction(false);
        setOptionsCollapsed(false);
        setInitialized(true);
      } catch (error) {
        console.error(error);
        setErrorMessage("챗봇 상담 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isOpen, initialized]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!messageListRef.current) return;

      if (pendingScrollTargetRef.current !== null) {
        const target = messageListRef.current.querySelector(
          `[data-message-index="${pendingScrollTargetRef.current}"]`
        );

        if (target) {
          const container = messageListRef.current;
          container.scrollTo({
            top: Math.max(target.offsetTop - 8, 0),
            behavior: "smooth",
          });
          pendingScrollTargetRef.current = null;
        }
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [messages, isOpen]);

  const handleClick = async (option) => {
    try {
      setSending(true);
      setErrorMessage("");
      setOptionsCollapsed(false);

      setMessages((prev) => {
        const nextMessages = [...prev, { role: "user", text: option.label }];
        pendingScrollTargetRef.current = nextMessages.length - 1;
        return nextMessages;
      });

      const data = await sendChatbotMessage({ optionCode: option.code });

      setMessages((prev) => {
        const nextMessages = [
          ...prev,
          {
            role: "bot",
            title: data.answerTitle,
            text: data.answerBody,
            handoff: data.handoffRecommended,
            aiEnhanced: data.aiEnhanced,
          },
        ];
        return nextMessages;
      });

      setOptions(data.suggestedOptions || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("상담 응답을 불러오지 못했습니다.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();
    if (!trimmedValue || sending) return;

    try {
      setSending(true);
      setErrorMessage("");
      setHasFreeformInteraction(true);
      setOptionsCollapsed(true);
      setMessages((prev) => {
        const nextMessages = [...prev, { role: "user", text: trimmedValue }];
        pendingScrollTargetRef.current = nextMessages.length - 1;
        return nextMessages;
      });
      setInputValue("");

      const data = await sendChatbotMessage({ message: trimmedValue });

      setMessages((prev) => {
        const nextMessages = [
          ...prev,
          {
            role: "bot",
            title: data.answerTitle,
            text: data.answerBody,
            handoff: data.handoffRecommended,
            aiEnhanced: data.aiEnhanced,
          },
        ];
        return nextMessages;
      });

      setOptions(data.suggestedOptions || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("상담 응답을 불러오지 못했습니다.");
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleMoveToConsultation = () => {
    if (typeof onMoveToConsultation === "function") {
      onMoveToConsultation();
      return;
    }

    setOpen(false);
  };

  if (hideTrigger && !isOpen) {
    return null;
  }

  return (
    <div className="chatbot-floating-wrap">
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <p className="chatbot-header__label">SKIN CHATBOT</p>
              <h2>챗봇 상담</h2>
            </div>
            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="chatbot-body">
            {loading ? (
              <div className="chatbot-empty-state">
                챗봇 상담을 불러오는 중입니다.
              </div>
            ) : (
              <>
                <div className="chatbot-message-list" ref={messageListRef}>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chatbot-bubble ${msg.role}`}
                      data-message-index={idx}
                    >
                      {msg.title ? (
                        <div className="chatbot-bubble__top">
                          <strong>{msg.title}</strong>
                          {msg.role === "bot" ? (
                            <span>{msg.aiEnhanced ? "Gemini" : "Basic"}</span>
                          ) : null}
                        </div>
                      ) : null}

                      <p>{msg.text}</p>

                      {msg.handoff ? (
                        <div className="chatbot-handoff-box">
                          더 자세한 문의는 관리자 1:1 상담으로 연결해주세요.
                          <button
                            type="button"
                            className="chatbot-handoff-button"
                            onClick={handleMoveToConsultation}
                          >
                            관리자 1:1 상담하러 가기
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {options.length > 0 ? (
                    <div className="chatbot-option-section">
                      <div className="chatbot-option-header">
                        <div className="chatbot-option-heading">빠른 선택</div>
                        {hasFreeformInteraction ? (
                          <button
                            type="button"
                            className="chatbot-option-toggle"
                            onClick={() => setOptionsCollapsed((prev) => !prev)}
                          >
                            {optionsCollapsed ? "펼치기" : "접기"}
                          </button>
                        ) : null}
                      </div>

                      {!optionsCollapsed ? (
                        <div className="chatbot-option-list">
                          {options.map((option) => (
                            <button
                              key={option.code}
                              type="button"
                              className="chatbot-option-button"
                              onClick={() => handleClick(option)}
                              disabled={sending}
                            >
                              <strong>{option.label}</strong>
                              <span>{option.description}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="chatbot-option-collapsed"
                          onClick={() => setOptionsCollapsed(false)}
                        >
                          빠른 선택 보기
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                {errorMessage ? (
                  <p className="chatbot-error">{errorMessage}</p>
                ) : null}

                <div className="chatbot-action-area">
                  <form className="chatbot-input-form" onSubmit={handleSubmit}>
                    <label className="chatbot-input-label" htmlFor="chatbot-input">
                      직접 입력 상담
                    </label>
                    <div className="chatbot-input-row">
                      <textarea
                        id="chatbot-input"
                        className="chatbot-input"
                        placeholder="증상, 시술, 예약, 비용 등 궁금한 내용을 직접 입력하세요."
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={handleInputKeyDown}
                        rows={2}
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        className="chatbot-send-button"
                        disabled={sending || !inputValue.trim()}
                      >
                        전송
                      </button>
                    </div>
                  </form>
                </div>
                {sending ? (
                  <div className="chatbot-option-collapsed">
                    응답을 불러오는 중입니다...
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}

      {!hideTrigger ? (
        <button
          type="button"
          className="chatbot-floating-btn"
          onClick={() => setOpen(!isOpen)}
        >
          챗봇 상담
        </button>
      ) : null}
    </div>
  );
}


