import { apiRequest } from "./api";

export const getIntegrations = async () => {
  return apiRequest("/integrations");
};

export const getIntegrationById = async (id) => {
  return apiRequest(`/integrations/${id}`);
};

export const createIntegration = async (integrationData) => {
  return apiRequest("/integrations", {
    method: "POST",
    body: JSON.stringify(integrationData),
  });
};

export const updateIntegration = async (id, integrationData) => {
  return apiRequest(`/integrations/${id}`, {
    method: "PUT",
    body: JSON.stringify(integrationData),
  });
};

export const deleteIntegration = async (id) => {
  return apiRequest(`/integrations/${id}`, {
    method: "DELETE",
  });
};