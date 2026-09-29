import { apiRequest } from "./api";

// Get all leads
export const getLeads = async () => {
  return apiRequest("/leads");
};

// Get single lead
export const getLeadById = async (id) => {
  return apiRequest(`/leads/${id}`);
};

// Create lead
export const createLead = async (leadData) => {
  return apiRequest("/leads", {
    method: "POST",
    body: JSON.stringify(leadData),
  });
};

// Update lead
export const updateLead = async (id, leadData) => {
  return apiRequest(`/leads/${id}`, {
    method: "PUT",
    body: JSON.stringify(leadData),
  });
};

// Delete lead
export const deleteLead = async (id) => {
  return apiRequest(`/leads/${id}`, {
    method: "DELETE",
  });
};