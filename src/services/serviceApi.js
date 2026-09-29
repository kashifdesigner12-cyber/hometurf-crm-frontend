import { apiRequest } from "./api";

export const getServices = async () => {
  return apiRequest("/services");
};

export const getServiceById = async (id) => {
  return apiRequest(`/services/${id}`);
};

export const createService = async (serviceData) => {
  return apiRequest("/services", {
    method: "POST",
    body: JSON.stringify(serviceData),
  });
};

export const updateService = async (id, serviceData) => {
  return apiRequest(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(serviceData),
  });
};

export const deleteService = async (id) => {
  return apiRequest(`/services/${id}`, {
    method: "DELETE",
  });
};