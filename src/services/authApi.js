import { apiRequest } from "./api";

export const loginUser = async (userData) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};