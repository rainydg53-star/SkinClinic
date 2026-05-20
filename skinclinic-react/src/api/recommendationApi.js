import api from "./apiClient";

// 1. 전체 추천 이력 조회 (관리자용)
export const getAllRecommendations = async (page = 0, size = 10) => {
  const response = await api.get("/api/recommendations", {
    params: { page, size },
  });
  return response.data;
};

// 2. 특정 사용자(User) 기준 추천 이력 조회
// 관리자 페이지나 마이페이지에서 사용
export const getRecommendationHistoriesByUser = async (
  userId,
  page = 0,
  size = 10,
) => {
  const response = await api.get(`/api/recommendations/users/${userId}`, {
    params: { page, size },
  });
  return response.data;
};

// 3. 특정 설문(Survey) 기준 추천 이력 조회 (페이징)
export const getRecommendationHistoriesBySurvey = async (
  surveyId,
  page = 0,
  size = 5,
) => {
  const response = await api.get(`/api/recommendations/survey/${surveyId}`, {
    params: { page, size },
  });
  return response.data;
};

// 4. 맞춤 시술 추천 저장 (단건)
export const createRecommendation = async (surveyId) => {
  const response = await api.post("/api/recommendations", { surveyId });
  return response.data;
};

// 5. 맞춤 시술 추천 상세 조회 (단건)
export const getRecommendation = async (recommendationId) => {
  const response = await api.get(`/api/recommendations/${recommendationId}`);
  return response.data;
};
