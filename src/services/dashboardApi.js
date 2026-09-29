import { apiRequest } from "./api";

const unwrapResponse = (response) => {
  if (!response) return null;

  // Common API response formats:
  // { success: true, data: ... }
  // { data: ... }
  // Direct object or array

  if (response.data !== undefined) {
    return response.data;
  }

  return response;
};

export const getDashboardSummary = async () => {
  const response = await apiRequest("/dashboard/summary");
  return unwrapResponse(response);
};

export const getRecentLeads = async () => {
  const response = await apiRequest("/leads/recent");
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.leads)) {
    return data.leads;
  }

  if (Array.isArray(data?.recentLeads)) {
    return data.recentLeads;
  }

  return [];
};

export const getUpcomingAppointments = async () => {
  const response = await apiRequest("/appointments/upcoming");
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.appointments)) {
    return data.appointments;
  }

  if (Array.isArray(data?.upcomingAppointments)) {
    return data.upcomingAppointments;
  }

  return [];
};