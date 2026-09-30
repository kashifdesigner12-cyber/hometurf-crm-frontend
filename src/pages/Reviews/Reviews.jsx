import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  MessageSquare,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apihometurf.localpro1.net/api";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const [formData, setFormData] = useState({
    customer: "",
    service: "",
    rating: "5",
    reviewText: "",
    source: "GOOGLE",
    reviewUrl: "",
    status: "RECEIVED",
  });

  // ============================================================
  // AUTH
  // ============================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  // ============================================================
  // API REQUEST
  // ============================================================

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),

          ...(options.headers || {}),
        },
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  // ============================================================
  // LOAD REVIEWS
  // ============================================================

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/reviews");

      const reviewData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : response?.reviews || [];

      setReviews(reviewData);
    } catch (error) {
      console.error("Load reviews error:", error);

      setReviews([]);

      setError(
        error.message ||
          "Failed to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const customerName =
        review.customer?.name ||
        review.customerName ||
        "";

      const reviewText =
        review.reviewText ||
        review.comment ||
        "";

      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        customerName
          .toLowerCase()
          .includes(searchValue) ||
        reviewText
          .toLowerCase()
          .includes(searchValue);

      const matchesRating =
        ratingFilter === "All" ||
        String(review.rating) ===
          ratingFilter;

      const matchesStatus =
        statusFilter === "All" ||
        review.status === statusFilter;

      return (
        matchesSearch &&
        matchesRating &&
        matchesStatus
      );
    });
  }, [
    reviews,
    search,
    ratingFilter,
    statusFilter,
  ]);

  // ============================================================
  // FORM
  // ============================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      customer: "",
      service: "",
      rating: "5",
      reviewText: "",
      source: "GOOGLE",
      reviewUrl: "",
      status: "RECEIVED",
    });

    setEditingReview(null);
  };

  // ============================================================
  // ADD REVIEW
  // ============================================================

  const handleAddReview = () => {
    setError("");
    setSuccess("");

    resetForm();

    setIsModalOpen(true);
  };

  // ============================================================
  // EDIT REVIEW
  // ============================================================

  const handleEditReview = (review) => {
    setError("");
    setSuccess("");

    setEditingReview(review);

    setFormData({
      customer:
        review.customer?._id ||
        review.customer ||
        "",

      service:
        review.service?._id ||
        review.service ||
        "",

      rating:
        review.rating !== null &&
        review.rating !== undefined
          ? String(review.rating)
          : "",

      reviewText:
        review.reviewText ||
        review.comment ||
        "",

      source:
        review.source ||
        "GOOGLE",

      reviewUrl:
        review.reviewUrl ||
        "",

      status:
        review.status ||
        "RECEIVED",
    });

    setIsModalOpen(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const handleCloseModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    resetForm();
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.customer.trim()) {
      setError(
        "Customer ID is required."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer:
          formData.customer.trim(),

        rating:
          formData.rating
            ? Number(formData.rating)
            : null,

        reviewText:
          formData.reviewText.trim(),

        source:
          formData.source,

        reviewUrl:
          formData.reviewUrl.trim(),

        status:
          formData.status,
      };

      if (formData.service.trim()) {
        payload.service =
          formData.service.trim();
      }

      if (editingReview) {
        const response =
          await apiRequest(
            `/reviews/${editingReview._id}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            }
          );

        const updatedReview =
          response?.data ||
          response?.review ||
          response;

        setReviews((previous) =>
          previous.map((review) =>
            review._id ===
            editingReview._id
              ? updatedReview
              : review
          )
        );

        setSuccess(
          "Review updated successfully."
        );
      } else {
        const response =
          await apiRequest(
            "/reviews",
            {
              method: "POST",
              body: JSON.stringify(payload),
            }
          );

        const newReview =
          response?.data ||
          response?.review ||
          response;

        if (newReview) {
          setReviews((previous) => [
            newReview,
            ...previous,
          ]);
        }

        setSuccess(
          "Review created successfully."
        );
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(
        "Save review error:",
        error
      );

      setError(
        error.message ||
          "Failed to save review."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/reviews/${id}`,
        {
          method: "DELETE",
        }
      );

      setReviews((previous) =>
        previous.filter(
          (review) =>
            review._id !== id
        )
      );

      setSuccess(
        "Review deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      setError(
        error.message ||
          "Failed to delete review."
      );
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getCustomerName = (review) => {
    return (
      review.customer?.name ||
      review.customerName ||
      "Unknown Customer"
    );
  };

  const getServiceName = (review) => {
    return (
      review.service?.serviceName ||
      review.serviceName ||
      "-"
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString();
  };

  const getStatusLabel = (status) => {
    const labels = {
      NOT_REQUESTED:
        "Not Requested",

      REQUESTED:
        "Requested",

      RECEIVED:
        "Received",

      FOLLOW_UP:
        "Follow Up",
    };

    return (
      labels[status] ||
      status ||
      "-"
    );
  };

  const getStatusClass = (status) => {
    if (status === "RECEIVED") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "REQUESTED") {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (status === "FOLLOW_UP") {
      return "border-blue-200 bg-blue-50 text-blue-800";
    }

    return "border-purple-200 bg-purple-50 text-[#5E52B7]";
  };

  // ============================================================
  // RATING STARS
  // ============================================================

  const RatingStars = ({
    rating,
  }) => {
    const numericRating =
      Number(rating) || 0;

    return (
      <div className="flex shrink-0 items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <Star
              key={star}
              size={15}
              fill={
                star <= numericRating
                  ? "currentColor"
                  : "none"
              }
              className={
                star <= numericRating
                  ? "text-yellow-500"
                  : "text-[#D8D8D8]"
              }
            />
          )
        )}
      </div>
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] px-3 pb-12 pt-2 sm:px-4 sm:pb-14 md:px-6 lg:px-7 xl:px-8">

      {/* HEADER */}

      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="min-w-0">

          <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:px-3.5 sm:text-[11px] sm:tracking-[0.14em]">
            <Sparkles
              size={13}
              className="shrink-0"
            />
            <span className="truncate">
              Customer Feedback
            </span>
          </div>

          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
            Reviews
          </h1>

          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
            Manage customer reviews and feedback
            from one central workspace.
          </p>

        </div>

        <button
          type="button"
          onClick={handleAddReview}
          className="button-press group inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto"
        >
          <Plus
            size={17}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
          Add Review
        </button>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-700 shadow-sm sm:px-5 sm:py-4 sm:text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-800 shadow-sm sm:px-5 sm:py-4 sm:text-sm">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <div className="mt-5 rounded-[20px] border border-purple-200/70 bg-white p-3.5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:rounded-[22px] sm:p-5">

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row">

          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search customer or review..."
              className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
            />

          </div>

          {/* RATING */}

          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm lg:w-auto lg:min-w-[150px]"
          >
            <option value="All">
              All Ratings
            </option>

            <option value="5">
              5 Stars
            </option>

            <option value="4">
              4 Stars
            </option>

            <option value="3">
              3 Stars
            </option>

            <option value="2">
              2 Stars
            </option>

            <option value="1">
              1 Star
            </option>
          </select>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm lg:w-auto lg:min-w-[175px]"
          >
            <option value="All">
              All Status
            </option>

            <option value="NOT_REQUESTED">
              Not Requested
            </option>

            <option value="REQUESTED">
              Requested
            </option>

            <option value="RECEIVED">
              Received
            </option>

            <option value="FOLLOW_UP">
              Follow Up
            </option>
          </select>

        </div>
      </div>

      {/* TABLE */}

      <div className="mt-5 w-full min-w-0 overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

        {loading ? (
          <div className="divide-y divide-purple-50">

            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-3 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5"
                >
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-purple-100/80 sm:h-11 sm:w-11" />

                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="h-3.5 w-28 max-w-full rounded-md bg-purple-100/80 sm:w-32" />
                    <div className="h-3 w-40 max-w-full rounded-md bg-purple-50 sm:w-52" />
                  </div>

                  <div className="hidden h-3.5 w-24 rounded-md bg-purple-100/80 md:block" />

                  <div className="h-9 w-16 shrink-0 rounded-xl bg-purple-100/80 sm:h-10 sm:w-20" />
                </div>
              )
            )}

          </div>
        ) : filteredReviews.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[380px] sm:px-6">

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">
              <MessageSquare
                size={25}
                className="sm:h-7 sm:w-7"
              />
            </div>

            <h3 className="mt-5 text-sm font-black text-[#33303A] sm:mt-6 sm:text-base">
              No reviews found
            </h3>

            <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697]">
              Customer reviews will appear here when they are available.
            </p>

          </div>

        ) : (

          <div className="w-full overflow-x-auto overscroll-x-contain">

            <table className="w-full min-w-[1000px]">

              <thead>

                <tr className="border-b border-purple-50 bg-purple-50/40">

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:tracking-[0.14em]">
                    Customer
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Service
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Rating
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Review
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Source
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Status
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Date
                  </th>

                  <th className="px-4 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:tracking-[0.14em]">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-purple-50">

                {filteredReviews.map(
                  (review) => (
                    <tr
                      key={review._id}
                      className="transition hover:bg-purple-50/50"
                    >

                      {/* CUSTOMER */}

                      <td className="px-4 py-4 sm:px-8 sm:py-5">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xs font-black text-[#5E52B7] shadow-sm sm:h-11 sm:w-11">
                            {getCustomerName(
                              review
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <p className="max-w-[180px] truncate text-sm font-bold text-[#33303A]">
                            {getCustomerName(
                              review
                            )}
                          </p>

                        </div>

                      </td>

                      {/* SERVICE */}

                      <td className="max-w-[170px] px-4 py-5 text-sm font-medium text-[#6E687A]">
                        <span className="block truncate">
                          {getServiceName(
                            review
                          )}
                        </span>
                      </td>

                      {/* RATING */}

                      <td className="px-4 py-5">

                        <div className="flex items-center gap-2 whitespace-nowrap">

                          <RatingStars
                            rating={
                              review.rating
                            }
                          />

                          <span className="text-xs font-bold text-[#6E687A]">
                            {review.rating ||
                              0}
                            /5
                          </span>

                        </div>

                      </td>

                      {/* REVIEW */}

                      <td className="max-w-[350px] px-4 py-5">

                        <p
                          className="truncate text-sm font-medium text-[#6E687A]"
                          title={
                            review.reviewText ||
                            "-"
                          }
                        >
                          {review.reviewText ||
                            "-"}
                        </p>

                      </td>

                      {/* SOURCE */}

                      <td className="px-4 py-5">

                        <span className="inline-flex whitespace-nowrap rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-[11px] font-bold text-[#5E52B7]">
                          {review.source ||
                            "-"}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-5">

                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm sm:text-[11px] ${getStatusClass(
                            review.status
                          )}`}
                        >
                          {getStatusLabel(
                            review.status
                          )}
                        </span>

                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap px-4 py-5 text-sm font-medium text-[#6E687A]">
                        {formatDate(
                          review.createdAt
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-5 sm:px-8">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEditReview(
                                review
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm transition-all hover:scale-110 hover:bg-blue-600 hover:text-white"
                            title="Edit"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                review._id
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 shadow-sm transition-all hover:scale-110 hover:bg-red-500 hover:text-white"
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* MODAL */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-3 backdrop-blur-[4px] sm:p-4">

          <div className="my-auto flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:max-h-[90vh] sm:rounded-[26px]">

            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-purple-50 bg-white px-4 py-4 sm:px-7 sm:py-6">

              <div className="min-w-0 pr-3">

                <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:mb-2 sm:text-[11px] sm:tracking-[0.14em]">
                  <Star size={13} />
                  Review Record
                </div>

                <h2 className="truncate text-lg font-black text-[#17151F] sm:text-xl">
                  {editingReview
                    ? "Edit Review"
                    : "Add Review"}
                </h2>

                <p className="mt-1 truncate text-[11px] font-medium text-[#8C8697] sm:text-xs">
                  {editingReview
                    ? "Update customer review"
                    : "Add a customer review"}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={saving}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100 disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-7"
            >

              {/* CUSTOMER */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Customer ID
                </label>

                <input
                  type="text"
                  name="customer"
                  value={
                    formData.customer
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter MongoDB customer ID"
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                  required
                />

                <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-[#8C8697] sm:text-xs">
                  Customer ID is required by the backend.
                </p>

              </div>

              {/* SERVICE */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Service ID
                </label>

                <input
                  type="text"
                  name="service"
                  value={
                    formData.service
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Optional service ID"
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />

              </div>

              {/* RATING */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Rating
                </label>

                <select
                  name="rating"
                  value={
                    formData.rating
                  }
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                >
                  <option value="">
                    No Rating
                  </option>

                  <option value="5">
                    5 Stars
                  </option>

                  <option value="4">
                    4 Stars
                  </option>

                  <option value="3">
                    3 Stars
                  </option>

                  <option value="2">
                    2 Stars
                  </option>

                  <option value="1">
                    1 Star
                  </option>
                </select>

              </div>

              {/* REVIEW TEXT */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Review
                </label>

                <textarea
                  name="reviewText"
                  value={
                    formData.reviewText
                  }
                  onChange={
                    handleInputChange
                  }
                  rows={5}
                  placeholder="Write customer review..."
                  className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 py-3 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:text-sm"
                />

              </div>

              {/* SOURCE */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Source
                </label>

                <select
                  name="source"
                  value={
                    formData.source
                  }
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                >

                  <option value="GOOGLE">
                    Google
                  </option>

                  <option value="CLICKY">
                    Clicky
                  </option>

                </select>

              </div>

              {/* REVIEW URL */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Review URL
                </label>

                <input
                  type="url"
                  name="reviewUrl"
                  value={
                    formData.reviewUrl
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Status
                </label>

                <select
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                >

                  <option value="NOT_REQUESTED">
                    Not Requested
                  </option>

                  <option value="REQUESTED">
                    Requested
                  </option>

                  <option value="RECEIVED">
                    Received
                  </option>

                  <option value="FOLLOW_UP">
                    Follow Up
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-purple-50 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition-all hover:bg-purple-50 hover:text-[#5E52B7] disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >

                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingReview
                    ? "Update Review"
                    : "Add Review"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </section>
  );
};

export default Reviews;