import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createSkinSurvey } from "@/api/skinSurveyApi";
import { API_BASE_URL } from '@/config/api'
import {
  answerOptions,
  skinAreas,
  skinConcerns,
  skinTypes,
  surveyQuestions,
} from "@/constants/skinSurveyOptions";
import "./skin-survey.css";

const PENDING_SKIN_SURVEY_KEY = "pendingSkinSurveyPayload";

export default function SkinSurveyPage() {
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const submitSurvey = async (payload) => {
    const result = await createSkinSurvey(payload);
    const createdSurveyId = result?.id;

    if (!createdSurveyId) {
      throw new Error("설문 저장 응답이 올바르지 않습니다.");
    }

    sessionStorage.removeItem(PENDING_SKIN_SURVEY_KEY);
    setMessage("설문이 저장되었습니다.");
    navigate(`/result/${createdSurveyId}`);
  };

  const checkAuthenticated = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.authenticated === true;
  };

  useEffect(() => {
    const pendingRaw = sessionStorage.getItem(PENDING_SKIN_SURVEY_KEY);
    if (!pendingRaw) {
      return;
    }

    const resumePendingSurvey = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (!response.ok) {
          return;
        }

        const auth = await response.json();
        const isAuthenticated = auth.authenticated === true;
        if (!isAuthenticated) {
          return;
        }

        const payload = JSON.parse(pendingRaw);
        if (!payload?.skinType || !payload?.questionAnswers) {
          sessionStorage.removeItem(PENDING_SKIN_SURVEY_KEY);
          return;
        }

        const result = await createSkinSurvey(payload);
        const createdSurveyId = result?.id;
        if (!createdSurveyId) {
          throw new Error("설문 저장 응답이 올바르지 않습니다.");
        }

        sessionStorage.removeItem(PENDING_SKIN_SURVEY_KEY);
        setMessage("설문이 저장되었습니다.");
        navigate(`/result/${createdSurveyId}`);
      } catch (error) {
        console.error(error);
        setMessage("로그인 후 설문 저장에 실패했습니다. 다시 시도해주세요.");
      }
    };

    resumePendingSurvey();
  }, [navigate]);

  const handleConcernChange = (concernValue) => {
    setConcerns((prev) =>
      prev.includes(concernValue)
        ? prev.filter((item) => item !== concernValue)
        : [...prev, concernValue],
    );
  };

  const handleAreaChange = (areaValue) => {
    setSelectedAreas((prev) =>
      prev.includes(areaValue)
        ? prev.filter((item) => item !== areaValue)
        : [...prev, areaValue],
    );
  };

  const handleAnswerChange = (questionCode, answerValue) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionCode]: answerValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!skinType) {
      setMessage("피부 타입을 선택해주세요.");
      return;
    }

    if (Object.keys(questionAnswers).length !== surveyQuestions.length) {
      setMessage("추가 설문 10문항에 모두 답변해주세요.");
      return;
    }

    const payload = {
      skinType,
      concerns,
      skinAreas: selectedAreas,
      questionAnswers,
    };

    try {
      const isAuthenticated = await checkAuthenticated();
      if (!isAuthenticated) {
        sessionStorage.setItem(PENDING_SKIN_SURVEY_KEY, JSON.stringify(payload));
        navigate("/login?redirect=/skin-survey", { replace: true });
        return;
      }

      await submitSurvey(payload);
    } catch (error) {
      console.error(error);
      setMessage("설문 저장에 실패했습니다.");
    }
  };

  return (
    <div className="survey-page">
      <section className="survey-hero">
        <div className="survey-hero__content">
          <span className="survey-badge">SKIN CONSULTING</span>
          <h1 className="survey-hero__title">
            나에게 맞는
            <br />
            피부 솔루션 찾기
          </h1>
          <p className="survey-hero__desc">
            피부 타입, 고민, 부위별 상태, 추가 문진 10문항을 바탕으로 점수를
            합산해서 맞춤 시술을 추천해드려요.
          </p>
          <div className="survey-hero-widget-row">
            <div className="survey-hero-widget">
              <span className="survey-hero-widget__emoji">🧬</span>
              <div>
                <strong>피부 타입 분석</strong>
                <p>현재 피부 컨디션의 기본 축을 먼저 정리해요.</p>
              </div>
            </div>
            <div className="survey-hero-widget">
              <span className="survey-hero-widget__emoji">✨</span>
              <div>
                <strong>맞춤 추천 연결</strong>
                <p>응답을 모아서 우선순위 높은 시술만 선별해요.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="survey-hero__image">
          <div className="hero-image-card">
            <img
              src="/images/solution-consultation-hero.jpg"
              alt="Premium Care Routine"
              className="hero-image-card__photo"
            />
            <div className="hero-image-card__glow"></div>
            <div className="hero-image-card__text">
              <span>NURI CLINIC</span>
              <strong>Find my solution</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="survey-form-section">
        <div className="survey-form-wrap">
          <div className="survey-form-header">
            <p className="survey-section-kicker">1:1 피부 분석 설문</p>
            <h2>피부 상태를 선택해주세요</h2>
            <p>
              기본 정보와 추가 질문 점수를 합산해 5점 이상인 시술 중 상위 3개만
              추천해드려요.
            </p>
          </div>

          <form className="survey-form-card" onSubmit={handleSubmit}>
            <div className="survey-block">
              <div className="survey-block__top">
                <span className="survey-step">STEP 01</span>
                <h3>피부 타입 선택</h3>
                <p>가장 가까운 피부 타입 하나를 선택해주세요.</p>
              </div>

              <div className="survey-option-grid type-grid survey-type-grid-wrap">
                {skinTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`survey-option-card ${
                      skinType === type.value ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="skinType"
                      value={type.value}
                      checked={skinType === type.value}
                      onChange={(e) => setSkinType(e.target.value)}
                    />
                    <span className="survey-option-card__check"></span>
                    <span className="survey-option-card__label">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="survey-divider" />

            <div className="survey-block">
              <div className="survey-block__top">
                <span className="survey-step">STEP 02</span>
                <h3>피부 고민 선택</h3>
                <p>해당되는 고민을 여러 개 선택할 수 있어요.</p>
              </div>

              <div className="survey-chip-grid">
                {skinConcerns.map((concern) => (
                  <label
                    key={concern.value}
                    className={`survey-chip ${
                      concerns.includes(concern.value) ? "active" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={concerns.includes(concern.value)}
                      onChange={() => handleConcernChange(concern.value)}
                    />
                    <span>{concern.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="survey-divider" />

            <div className="survey-block">
              <div className="survey-block__top">
                <span className="survey-step">STEP 03</span>
                <h3>부위별 피부 상태 확인</h3>
                <p>고민이 느껴지는 부위를 여러 개 선택할 수 있어요.</p>
              </div>

              <div className="survey-chip-grid">
                {skinAreas.map((area) => (
                  <label
                    key={area.value}
                    className={`survey-chip ${
                      selectedAreas.includes(area.value) ? "active" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(area.value)}
                      onChange={() => handleAreaChange(area.value)}
                    />
                    <span>{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="survey-divider" />

            <div className="survey-block">
              <div className="survey-block__top">
                <span className="survey-step">STEP 04</span>
                <h3>추가 피부 문진</h3>
                <p>문항별 답변 점수가 누적되어 추천 시술 점수에 반영됩니다.</p>
              </div>

              <div className="survey-question-list">
                {surveyQuestions.map((question, index) => (
                  <div className="survey-question-card" key={question.code}>
                    <div className="survey-question-card__top">
                      <span className="survey-question-number">
                        Q{String(index + 1).padStart(2, "0")}
                      </span>
                      <h4>{question.title}</h4>
                      <p>{question.description}</p>
                    </div>

                    <div className="survey-answer-grid">
                      {answerOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`survey-answer-card ${
                            questionAnswers[question.code] === option.value
                              ? "active"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.code}
                            value={option.value}
                            checked={
                              questionAnswers[question.code] === option.value
                            }
                            onChange={() =>
                              handleAnswerChange(question.code, option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {message && <p className="survey-message">{message}</p>}

            <div className="survey-actions">
              <button type="submit" className="survey-submit-btn">
                결과 확인하기
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
