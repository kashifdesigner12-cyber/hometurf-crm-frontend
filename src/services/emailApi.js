const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apihometurf.localpro1.net/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getEmailConversations = async () => {
  const response = await fetch(
    `${API_BASE_URL}/emails/conversations`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to fetch email conversations."
    );
  }

  return data;
};

export const getEmailConversationById = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/emails/conversations/${id}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to fetch email conversation."
    );
  }

  return data;
};