import { apiRequest } from "./api";

export const getReviews = async () => {
  return apiRequest("/reviews");
};

export const getReviewById = async (id) => {
  return apiRequest(`/reviews/${id}`);
};

export const createReview = async (reviewData) => {
  return apiRequest("/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
};

export const updateReview = async (id, reviewData) => {
  return apiRequest(`/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(reviewData),
  });
};

export const deleteReview = async (id) => {
  return apiRequest(`/reviews/${id}`, {
    method: "DELETE",
  });
};