import { apiRequest } from "./api";

export const getAutomations = async () => {
  return apiRequest("/automations");
};

export const getAutomationById = async (id) => {
  return apiRequest(`/automations/${id}`);
};

export const createAutomation = async (automationData) => {
  return apiRequest("/automations", {
    method: "POST",
    body: JSON.stringify(automationData),
  });
};

export const updateAutomation = async (id, automationData) => {
  return apiRequest(`/automations/${id}`, {
    method: "PUT",
    body: JSON.stringify(automationData),
  });
};

export const deleteAutomation = async (id) => {
  return apiRequest(`/automations/${id}`, {
    method: "DELETE",
  });
};