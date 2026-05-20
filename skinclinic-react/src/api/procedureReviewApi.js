import api from "./apiClient";

export const getProcedureReviewCandidates = async (userId) => {
  const response = await api.get(`/api/procedure-reviews/users/${userId}/candidates`);
  return response.data;
};

export const getUserProcedureReviews = async (userId) => {
  const response = await api.get(`/api/procedure-reviews/users/${userId}`);
  return response.data;
};

export const createProcedureReview = async (payload) => {
  const response = await api.post("/api/procedure-reviews", payload);
  return response.data;
};

export const getProcedureSatisfactionStats = async () => {
  const response = await api.get("/api/admin/procedure-review-stats");
  return response.data;
};

export const getAdminProcedureReviews = async () => {
  const response = await api.get("/api/admin/procedure-reviews");
  return response.data;
};
