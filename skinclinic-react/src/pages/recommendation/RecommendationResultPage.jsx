import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRecommendation } from "@/api/recommendationApi";
import {
  getAnswerLabel,
  getQuestionTitle,
  getSkinConcernLabel,
  getSkinTypeLabel,
} from "@/constants/skinSurveyOptions";
import "./recommendation.css";

export default function RecommendationResultPage() {
  const { recommendationId } = useParams();
  const navigate = useNavigate();

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const recommendationData = await getRecommendation(recommendationId);
        setRecommendation(recommendationData);
      } catch (error) {
        console.error(error);
        setErrorMessage("추천 결과를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [recommendationId]);

  if (loading) {
    return (
      <div className="recommendation-page">
        <div className="recommendation-wrap">
          <div className="recommendation-header-card">
            <h1>추천 결과 불러오는 중...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !recommendation) {
    return (
      <div className="recommendation-page">
        <div className="recommendation-wrap">
          <div className="recommendation-header-card">
            <p>{errorMessage || "추천 결과가 없습니다."}</p>
            <div
              className="recommendation-actions"
              style={{ marginTop: "20px" }}
            >
              <button onClick={() => navigate("/")}>메인으로 이동</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-page">
      <div className="recommendation-wrap">
        <div className="recommendation-header-card">
          <p className="recommendation-kicker">CUSTOM PROCEDURE</p>
          <h1>맞춤 시술 추천 결과</h1>
          <p className="recommendation-subtitle">
            피부 타입, 고민, 추가 문진 점수를 합산해 5점 이상인 시술 중 상위
            3개만 추천합니다.
          </p>
        </div>

        <div className="recommendation-summary-grid">
          <div className="recommendation-summary-card">
            <span>추천 번호</span>
            <strong>{recommendation.recommendationId}</strong>
          </div>
          <div className="recommendation-summary-card">
            <span>설문 번호</span>
            <strong>{recommendation.surveyId}</strong>
          </div>
          <div className="recommendation-summary-card">
            <span>피부 타입</span>
            <strong>{getSkinTypeLabel(recommendation.skinTypeCode)}</strong>
          </div>
        </div>

        <div className="recommendation-meta-card">
          <h3>피부 고민</h3>
          <div className="chip-wrap">
            {recommendation.concernCodes?.length > 0 ? (
              recommendation.concernCodes.map((code) => (
                <span key={code} className="chip">
                  {getSkinConcernLabel(code)}
                </span>
              ))
            ) : (
              <p>선택된 피부 고민이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="recommendation-meta-card">
          <h3>추가 문진 답변</h3>
          <div className="recommendation-answer-list">
            {Object.entries(recommendation.questionAnswers || {}).length > 0 ? (
              Object.entries(recommendation.questionAnswers || {}).map(
                ([code, value]) => (
                  <div className="recommendation-answer-item" key={code}>
                    <strong>{getQuestionTitle(code)}</strong>
                    <span>{getAnswerLabel(value)}</span>
                  </div>
                ),
              )
            ) : (
              <p>저장된 추가 문진 답변이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="recommendation-list-card">
          <h2>추천 시술 목록</h2>
          {recommendation.recommendations?.length > 0 ? (
            <div className="procedure-list">
              {recommendation.recommendations.map((item, index) => (
                <div className="procedure-card" key={item.procedureCode}>
                  <div className="procedure-card-top">
                    <div>
                      <p className="procedure-rank">TOP {index + 1}</p>
                      <p className="procedure-code">{item.procedureCode}</p>
                      <h3>{item.procedureName}</h3>
                    </div>
                    <div className="procedure-score">점수 {item.score}</div>
                  </div>

                  <p className="procedure-description">{item.description}</p>

                  <div className="procedure-reasons">
                    <strong>추천 이유</strong>
                    <ul>
                      {item.reasons?.map((reason, reasonIndex) => (
                        <li key={reasonIndex}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>5점 이상인 추천 시술이 없습니다.</p>
          )}
        </div>

        <div className="recommendation-actions">
          <button
            onClick={() => navigate(`/result/${recommendation.surveyId}`)}
          >
            설문 결과로 돌아가기
          </button>
          <button onClick={() => navigate("/mypage/recommendation")}>
            내 맞춤 추천 보기
          </button>
          <button onClick={() => navigate("/")}>메인으로 이동</button>
        </div>
      </div>
    </div>
  );
}
