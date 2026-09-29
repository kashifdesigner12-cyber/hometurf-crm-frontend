import { apiRequest } from "./api";

export const getCalls = async () => {
  return apiRequest("/calls");
};

export const getCallById = async (id) => {
  return apiRequest(`/calls/${id}`);
};

export const createCall = async (callData) => {
  return apiRequest("/calls", {
    method: "POST",
    body: JSON.stringify(callData),
  });
};

export const updateCall = async (id, callData) => {
  return apiRequest(`/calls/${id}`, {
    method: "PUT",
    body: JSON.stringify(callData),
  });
};

export const deleteCall = async (id) => {
  return apiRequest(`/calls/${id}`, {
    method: "DELETE",
  });
};