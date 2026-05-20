import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyLatestSkinSurvey, getSkinSurvey } from "@/api/skinSurveyApi";
import {
  getAnswerLabel,
  getQuestionTitle,
  getSkinAreaLabel,
  getSkinConcernLabel,
  getSkinTypeLabel,
} from "@/constants/skinSurveyOptions";
import "./skin-survey.css";
import { createRecommendation } from "@/api/recommendationApi";

export default function SkinSurveyResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  useEffect(() => {
    const fetchSurveyResult = async () => {
      try {
        const hasValidId = id && id !== "undefined";
        const data = hasValidId
          ? await getSkinSurvey(id)
          : await getMyLatestSkinSurvey();
        setResult(data);
        if (!hasValidId && data?.id) {
          navigate(`/result/${data.id}`, { replace: true });
        }
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "설문 결과를 불러오지 못했습니다. 로그인 상태를 확인해주세요.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyResult();
  }, [id, navigate]);

  const handleCreateRecommendation = async () => {
    try {
      setRecommendationLoading(true);
      const data = await createRecommendation(Number(id));
      navigate(`/recommendations/${data.recommendationId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("추천 결과 생성에 실패했습니다.");
    } finally {
      setRecommendationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="survey-page">
        <section className="result-page">
          <div className="result-wrap">
            <div className="result-skeleton skeleton-lg"></div>
            <div className="result-skeleton skeleton-md"></div>
            <div className="result-card">
              <div className="result-skeleton skeleton-sm"></div>
              <div className="result-skeleton skeleton-line"></div>
              <div className="result-skeleton skeleton-line"></div>
              <div className="result-skeleton skeleton-line short"></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (errorMessage || !result) {
    return (
      <div className="survey-page">
        <section className="result-page">
          <div className="result-wrap">
            <div className="result-card center">
              <p className="result-error">
                {errorMessage || "결과를 찾을 수 없습니다."}
              </p>
              <button
                className="survey-submit-btn"
                onClick={() => navigate("/")}
              >
                설문하러 가기
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="survey-page">
      <section className="result-page">
        <div className="result-wrap">
          <div className="result-hero">
            <div>
              <span className="survey-badge">RESULT REPORT</span>
              <h1>피부 진단 결과</h1>
              <p>
                입력한 피부 타입, 고민, 부위별 상태, 추가 문진 답변을
                정리했어요.
              </p>
            </div>
            <div className="result-hero__number">
              <span>Survey No.</span>
              <strong>#{result.id}</strong>
            </div>
          </div>

          <div className="result-grid result-grid--triple">
            <div className="result-card main">
              <p className="result-card__label">피부 타입</p>
              <h2>{getSkinTypeLabel(result.skinType)}</h2>
              <p className="result-card__desc">
                선택한 피부 타입은 추천 시술 점수의 기본 가중치로 반영돼요.
              </p>
            </div>

            <div className="result-card side">
              <p className="result-card__label">주요 피부 고민</p>
              <div className="result-chip-list">
                {result.concerns?.length > 0 ? (
                  result.concerns.map((concern) => (
                    <span className="result-chip" key={concern}>
                      {getSkinConcernLabel(concern)}
                    </span>
                  ))
                ) : (
                  <p className="result-empty">선택한 고민이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="result-card side">
              <p className="result-card__label">부위별 피부 고민</p>
              <div className="result-chip-list">
                {result.skinAreas?.length > 0 ? (
                  result.skinAreas.map((area) => (
                    <span className="result-chip" key={area}>
                      {getSkinAreaLabel(area)}
                    </span>
                  ))
                ) : (
                  <p className="result-empty">선택한 부위가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          <div className="result-card">
            <p className="result-card__label">추가 문진 답변</p>
            <div className="result-answer-list">
              {Object.entries(result.questionAnswers || {}).length > 0 ? (
                Object.entries(result.questionAnswers || {}).map(
                  ([code, value]) => (
                    <div className="result-answer-item" key={code}>
                      <strong>{getQuestionTitle(code)}</strong>
                      <span>{getAnswerLabel(value)}</span>
                    </div>
                  ),
                )
              ) : (
                <p className="result-empty">
                  저장된 추가 문진 답변이 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="result-card">
            <p className="result-card__label">요약</p>
            <div className="result-summary">
              <div className="summary-box">
                <span>피부 타입</span>
                <strong>{getSkinTypeLabel(result.skinType)}</strong>
              </div>
              <div className="summary-box">
                <span>고민 개수</span>
                <strong>{result.concerns?.length || 0}개</strong>
              </div>
              <div className="summary-box">
                <span>선택 부위</span>
                <strong>{result.skinAreas?.length || 0}개</strong>
              </div>
              <div className="summary-box">
                <span>추가 문항</span>
                <strong>
                  {Object.keys(result.questionAnswers || {}).length}개
                </strong>
              </div>
            </div>
          </div>

          <div className="survey-actions result-actions">
            <button
              className="survey-outline-btn"
              onClick={() => navigate("/skin-survey")}
            >
              다시 설문하기
            </button>
            <button
              className="survey-submit-btn"
              onClick={handleCreateRecommendation}
              disabled={recommendationLoading}
            >
              {recommendationLoading
                ? "추천 생성 중..."
                : "맞춤 시술 추천 받기"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
