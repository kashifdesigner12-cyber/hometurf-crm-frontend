import { apiRequest } from "./api";

export const getNotifications = async () => {
  return apiRequest("/notifications");
};

export const getNotificationById = async (id) => {
  return apiRequest(`/notifications/${id}`);
};

export const createNotification = async (notificationData) => {
  return apiRequest("/notifications", {
    method: "POST",
    body: JSON.stringify(notificationData),
  });
};

export const updateNotification = async (id, notificationData) => {
  return apiRequest(`/notifications/${id}`, {
    method: "PUT",
    body: JSON.stringify(notificationData),
  });
};

export const deleteNotification = async (id) => {
  return apiRequest(`/notifications/${id}`, {
    method: "DELETE",
  });
};