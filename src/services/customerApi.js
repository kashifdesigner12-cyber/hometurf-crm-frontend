import { apiRequest } from "./api";

export const getCustomers = async () => {
  return apiRequest("/customers");
};

export const getCustomerById = async (id) => {
  return apiRequest(`/customers/${id}`);
};

export const createCustomer = async (customerData) => {
  return apiRequest("/customers", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
};

export const updateCustomer = async (id, customerData) => {
  return apiRequest(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customerData),
  });
};

export const deleteCustomer = async (id) => {
  return apiRequest(`/customers/${id}`, {
    method: "DELETE",
  });
};