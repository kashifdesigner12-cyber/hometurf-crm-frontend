import { apiRequest } from "./api";

export const getAppointments = async () => {
  return apiRequest("/appointments");
};

export const getAppointmentById = async (id) => {
  return apiRequest(`/appointments/${id}`);
};

export const createAppointment = async (appointmentData) => {
  return apiRequest("/appointments", {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });
};

export const updateAppointment = async (
  id,
  appointmentData,
) => {
  return apiRequest(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(appointmentData),
  });
};

export const deleteAppointment = async (id) => {
  return apiRequest(`/appointments/${id}`, {
    method: "DELETE",
  });
};