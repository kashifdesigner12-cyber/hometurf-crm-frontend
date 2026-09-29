import { apiRequest } from "./api";

export const getUsers = async () => {
  return apiRequest("/users");
};

export const getUserById = async (id) => {
  return apiRequest(`/users/${id}`);
};

export const createUser = async (userData) => {
  return apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (id, userData) => {
  return apiRequest(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (id) => {
  return apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
};