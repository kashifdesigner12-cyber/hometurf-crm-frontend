import { apiRequest } from "./api";

export const getConversations = async () => {
  return apiRequest("/conversations");
};

export const getConversationById = async (id) => {
  return apiRequest(`/conversations/${id}`);
};

export const createConversation = async (conversationData) => {
  return apiRequest("/conversations", {
    method: "POST",
    body: JSON.stringify(conversationData),
  });
};

export const updateConversation = async (id, conversationData) => {
  return apiRequest(`/conversations/${id}`, {
    method: "PUT",
    body: JSON.stringify(conversationData),
  });
};

export const deleteConversation = async (id) => {
  return apiRequest(`/conversations/${id}`, {
    method: "DELETE",
  });
};