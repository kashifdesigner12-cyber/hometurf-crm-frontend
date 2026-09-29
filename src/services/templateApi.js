import { apiRequest } from "./api";

export const getTemplates = async () => {
  return apiRequest("/templates");
};

export const getTemplateById = async (id) => {
  return apiRequest(`/templates/${id}`);
};

export const createTemplate = async (templateData) => {
  return apiRequest("/templates", {
    method: "POST",
    body: JSON.stringify(templateData),
  });
};

export const updateTemplate = async (id, templateData) => {
  return apiRequest(`/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(templateData),
  });
};

export const deleteTemplate = async (id) => {
  return apiRequest(`/templates/${id}`, {
    method: "DELETE",
  });
};