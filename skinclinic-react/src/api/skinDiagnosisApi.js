import api from "@/api/apiClient";
import { API_BASE_URL } from '@/config/api'

export async function createSkinDiagnosis(payload) {
  const response = await api.post("/api/skin-diagnoses", payload);
  return response.data;
}

export async function getMySkinDiagnoses(memberId) {
  const response = await api.get("/api/skin-diagnoses/me", {
    params: memberId ? { memberId } : undefined,
  });
  return response.data ?? [];
}

export async function getMySkinDiagnosisDetail(diagnosisId, memberId) {
  const response = await api.get(`/api/skin-diagnoses/me/${diagnosisId}`, {
    params: memberId ? { memberId } : undefined,
  });
  return response.data;
}

export async function analyzeSkinPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/skin-diagnoses/analyze-photo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`사진 분석 요청 실패 (${response.status})`);
  }
  return response.json();
}

export async function adminGetSkinDiagnoses(memberId) {
  const response = await api.get("/api/admin/skin-diagnoses", {
    params: memberId ? { memberId } : undefined,
  });
  return response.data ?? [];
}

export async function adminGetSkinDiagnosisDetail(diagnosisId) {
  const response = await api.get(`/api/admin/skin-diagnoses/${diagnosisId}`);
  return response.data;
}
