import api from "@/api/apiClient";

export async function getProceduresForReservation() {
  const response = await api.get("/api/procedures");
  return response.data ?? [];
}

export async function createReservation(payload) {
  const response = await api.post("/api/reservations", payload);
  return response.data;
}

export async function getMyReservations() {
  const response = await api.get("/api/reservations/me");
  return response.data ?? [];
}

export async function cancelMyReservation(reservationId) {
  await api.post(`/api/reservations/me/${reservationId}/cancel`);
}

export async function getReservationAvailability(date) {
  const response = await api.get("/api/reservations/availability", {
    params: { date },
  });
  return response.data;
}

export async function adminGetClosedDays(from, to) {
  const response = await api.get("/api/admin/reservations/closed-days", {
    params: { from, to },
  });
  return response.data ?? [];
}

export async function adminAddClosedDay(date) {
  await api.post("/api/admin/reservations/closed-days", { date });
}

export async function adminRemoveClosedDay(date) {
  await api.delete(`/api/admin/reservations/closed-days/${date}`);
}

export async function adminGetReservationStats(date) {
  const response = await api.get("/api/admin/reservations/stats", {
    params: date ? { date } : undefined,
  });
  return response.data;
}

export async function adminGetAllReservations() {
  const response = await api.get("/api/admin/reservations/all");
  return response.data ?? [];
}

export async function adminGetReservationDetail(reservationId) {
  const response = await api.get(`/api/admin/reservations/${reservationId}`);
  return response.data;
}

export async function adminUpdateReservationStatus(reservationId, status) {
  await api.post(`/api/admin/reservations/${reservationId}/status`, { status });
}
