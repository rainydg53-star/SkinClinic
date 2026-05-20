import api from "./apiClient";

export const getChatbotWelcome = async () => {
  const response = await api.get("/api/chatbot/welcome");
  return response.data;
};

export const sendChatbotMessage = async ({ optionCode, message }) => {
  const payload = {};

  if (optionCode) {
    payload.optionCode = optionCode;
  }

  if (message) {
    payload.message = message;
  }

  const response = await api.post("/api/chatbot/messages", payload);
  return response.data;
};
