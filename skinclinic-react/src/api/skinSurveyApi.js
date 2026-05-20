import api from "./apiClient";

// 피부 설문 저장
export const createSkinSurvey = async (surveyData) => {
  const response = await api.post("/api/skin-surveys", surveyData); // POST 요청 전송("주소", 바디 데이터)
  return response.data;
  // axios 응답 전체 중 실제 바디 데이터만 반환.
};

// 피부 설문 단건 조회
export const getSkinSurvey = async (id) => {
  const response = await api.get(`/api/skin-surveys/${id}`);
  // GET 메서드로 "/api/skin-surveys/{id}" 경로에 요청을 보냄.
  // 엔드의 @PathVariable Long id가 이 값을 받게 됩니다.

  return response.data;
};

export const getLatestSkinSurveyByUser = async (userId) => {
  const response = await api.get(`/api/skin-surveys/users/${userId}/latest`);
  return response.data;
};

export const getMyLatestSkinSurvey = async () => {
  const response = await api.get("/api/skin-surveys/me/latest");
  return response.data;
};

export const getSkinSurveysByUser = async (userId, page = 0, size = 1) => {
  const response = await api.get(`/api/skin-surveys/users/${userId}`, {
    params: { page, size },
  });
  return response.data;
};

// 이 파일은 백엔드 API 호출 전용 파일임.
