import { apiRequest } from "./api";

export const getMessages = async (conversationId) => {
  return apiRequest(`/messages/conversation/${conversationId}`);
};

export const sendMessage = async (conversationId, messageData) => {
  return apiRequest(`/messages/send`, {
    method: "POST",
    body: JSON.stringify({
      ...messageData,
      conversationId,
    }),
  });
};