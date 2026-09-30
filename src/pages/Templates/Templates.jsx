import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  Mail,
  CheckCircle2,
  Power,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =====================================================
// BACKEND TEMPLATE TYPES
// =====================================================

const TEMPLATE_TYPES = [
  {
    value: "WELCOME",
    label: "Welcome",
  },
  {
    value: "BOOKING_CONFIRMATION",
    label: "Booking Confirmation",
  },
  {
    value: "APPOINTMENT_CONFIRMATION",
    label: "Appointment Confirmation",
  },
  {
    value: "APPOINTMENT_REMINDER",
    label: "Appointment Reminder",
  },
  {
    value: "SERVICE_COMPLETED",
    label: "Service Completed",
  },
  {
    value: "THANK_YOU",
    label: "Thank You",
  },
  {
    value: "REVIEW_REQUEST",
    label: "Review Request",
  },
  {
    value: "REVIEW_REMINDER",
    label: "Review Reminder",
  },
  {
    value: "REVIEW_FOLLOWUP",
    label: "Review Follow-up",
  },
  {
    value: "CUSTOM",
    label: "Custom",
  },
];

// =====================================================
// AUTH TOKEN
// =====================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
};

// =====================================================
// API REQUEST
// =====================================================

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return result;
};

// =====================================================
// HELPERS
// =====================================================

const getTypeLabel = (type) => {
  const found = TEMPLATE_TYPES.find(
    (item) => item.value === type
  );

  return found?.label || type || "-";
};

const getTypeClass = (type) => {
  const value = String(type || "").toUpperCase();

  if (
    value === "WELCOME" ||
    value === "THANK_YOU"
  ) {
    return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  }

  if (
    value === "BOOKING_CONFIRMATION" ||
    value === "APPOINTMENT_CONFIRMATION" ||
    value === "APPOINTMENT_REMINDER"
  ) {
    return "bg-blue-50 text-blue-800 border border-blue-200";
  }

  if (
    value === "REVIEW_REQUEST" ||
    value === "REVIEW_REMINDER" ||
    value === "REVIEW_FOLLOWUP"
  ) {
    return "bg-purple-50 text-[#5E52B7] border border-purple-200";
  }

  if (value === "SERVICE_COMPLETED") {
    return "bg-amber-50 text-amber-800 border border-amber-200";
  }

  return "bg-purple-50 text-[#5E52B7] border border-purple-200";
};

const getTypeIcon = (type) => {
  const value = String(type || "").toUpperCase();

  if (
    value === "WELCOME" ||
    value === "THANK_YOU"
  ) {
    return <MessageSquare size={18} />;
  }

  if (
    value === "BOOKING_CONFIRMATION" ||
    value === "APPOINTMENT_CONFIRMATION" ||
    value === "APPOINTMENT_REMINDER"
  ) {
    return <Mail size={18} />;
  }

  return <FileText size={18} />;
};

// =====================================================
// COMPONENT
// =====================================================

const Templates = () => {
  const [templates, setTemplates] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingTemplate, setEditingTemplate] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOM",
    subject: "",
    content: "",
    active: true,
  });

  // =====================================================
  // LOAD TEMPLATES
  // =====================================================

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(
        "/message-templates"
      );

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setTemplates(data);
    } catch (err) {
      console.error(
        "Load templates error:",
        err
      );

      setTemplates([]);

      setError(
        err?.message ||
          "Failed to load templates."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const name = String(
        template?.name || ""
      );

      const content = String(
        template?.content || ""
      );

      const subject = String(
        template?.subject || ""
      );

      const type = String(
        template?.type || ""
      );

      const searchValue =
        search.trim().toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(searchValue) ||
        content
          .toLowerCase()
          .includes(searchValue) ||
        subject
          .toLowerCase()
          .includes(searchValue);

      const matchesType =
        typeFilter === "All" ||
        type.toUpperCase() ===
          typeFilter.toUpperCase();

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" &&
          Boolean(template?.active)) ||
        (statusFilter === "Inactive" &&
          !Boolean(template?.active));

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    templates,
    search,
    typeFilter,
    statusFilter,
  ]);

  // =====================================================
  // FORM
  // =====================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "CUSTOM",
      subject: "",
      content: "",
      active: true,
    });

    setEditingTemplate(null);
    setError("");
  };

  const handleAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);

    setFormData({
      name: template?.name || "",
      type: template?.type || "CUSTOM",
      subject: template?.subject || "",
      content: template?.content || "",
      active:
        template?.active !== undefined
          ? Boolean(template.active)
          : true,
    });

    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setIsModalOpen(false);
    resetForm();
  };

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Template name is required.");
      return;
    }

    if (!formData.type) {
      setError("Please select a template type.");
      return;
    }

    if (!formData.content.trim()) {
      setError("Template content is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        name: formData.name.trim(),
        type: String(formData.type)
          .trim()
          .toUpperCase(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        active: Boolean(formData.active),
      };

      // UPDATE
      if (editingTemplate) {
        const response = await apiRequest(
          `/message-templates/${editingTemplate._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        const updatedTemplate =
          response?.data;

        if (updatedTemplate) {
          setTemplates((previous) =>
            previous.map((item) =>
              item._id ===
              editingTemplate._id
                ? updatedTemplate
                : item
            )
          );
        }

        setSuccessMessage(
          "Template updated successfully."
        );
      }

      // CREATE
      else {
        const response = await apiRequest(
          "/message-templates",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        const createdTemplate =
          response?.data;

        if (createdTemplate) {
          setTemplates((previous) => [
            createdTemplate,
            ...previous,
          ]);
        }

        setSuccessMessage(
          "Template created successfully."
        );
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(
        "Save template error:",
        err
      );

      setError(
        err?.message ||
          "Failed to save template."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccessMessage("");

      await apiRequest(
        `/message-templates/${id}`,
        {
          method: "DELETE",
        }
      );

      setTemplates((previous) =>
        previous.filter(
          (item) => item._id !== id
        )
      );

      setSuccessMessage(
        "Template deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete template error:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete template."
      );
    }
  };

  // =====================================================
  // TOGGLE ACTIVE
  // =====================================================

  const handleToggleActive = async (
    template
  ) => {
    const newActive =
      !Boolean(template.active);

    try {
      setError("");
      setSuccessMessage("");

      const response = await apiRequest(
        `/message-templates/${template._id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            active: newActive,
          }),
        }
      );

      const updatedTemplate =
        response?.data;

      if (updatedTemplate) {
        setTemplates((previous) =>
          previous.map((item) =>
            item._id === template._id
              ? updatedTemplate
              : item
          )
        );
      }

      setSuccessMessage(
        newActive
          ? "Template activated."
          : "Template deactivated."
      );
    } catch (err) {
      console.error(
        "Toggle template error:",
        err
      );

      setError(
        err?.message ||
          "Failed to update template status."
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-10 pt-2 transition-all duration-300 sm:px-4 sm:pb-12 md:px-6 lg:pb-16 space-y-4 sm:space-y-5 lg:space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:px-3.5 sm:text-[11px] sm:tracking-[0.14em]">
            <Sparkles
              size={13}
              className="shrink-0"
            />
            <span className="truncate">
              Messaging Library
            </span>
          </div>

          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] lg:text-[38px]">
            Templates
          </h1>

          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
            Manage reusable message templates
            from one central workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="button-press group inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto"
        >
          <Plus
            size={17}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
          Add Template
        </button>
      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm sm:items-center sm:px-5 sm:py-4 sm:text-sm">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 sm:mt-0"
          />
          <span className="break-words">
            {successMessage}
          </span>
        </div>
      )}

      {/* ERROR */}

      {error && !isModalOpen && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 sm:text-sm">
          <span className="break-words">
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
            className="self-start font-bold hover:underline sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* FILTERS */}

      <div className="rounded-[20px] border border-purple-200/70 bg-white p-3.5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:rounded-[22px] sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
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
                setSearch(event.target.value)
              }
              placeholder="Search templates..."
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-sm font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            />
          </div>

          {/* TYPE */}

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 md:w-auto md:min-w-[170px]"
          >
            <option value="All">
              All Types
            </option>

            {TEMPLATE_TYPES.map((type) => (
              <option
                key={type.value}
                value={type.value}
              >
                {type.label}
              </option>
            ))}
          </select>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 md:w-auto md:min-w-[160px]"
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">
        {loading ? (
          <div className="divide-y divide-purple-50">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="flex min-w-0 animate-pulse items-center gap-3 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5"
                >
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-purple-100/80 sm:h-11 sm:w-11" />

                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="h-3.5 w-32 max-w-full rounded-md bg-purple-100/80 sm:w-40" />

                    <div className="h-3 w-48 max-w-full rounded-md bg-purple-50 sm:w-64" />
                  </div>

                  <div className="h-9 w-20 shrink-0 rounded-xl bg-purple-100/80 sm:h-10 sm:w-28" />
                </div>
              )
            )}
          </div>
        ) : filteredTemplates.length ===
          0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[380px] sm:px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">
              <FileText
                size={25}
                className="sm:h-7 sm:w-7"
              />
            </div>

            <h3 className="mt-5 text-base font-black text-[#33303A] sm:mt-6">
              No templates found
            </h3>

            <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697]">
              Your message templates will
              appear here.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] sm:min-w-[1050px]">
              <thead>
                <tr className="border-b border-purple-50 bg-purple-50/40">
                  <th className="px-4 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Template
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Type
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Subject
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Content
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Status
                  </th>

                  <th className="px-4 py-3.5 text-right text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-purple-50">
                {filteredTemplates.map(
                  (template) => (
                    <tr
                      key={template._id}
                      className="transition hover:bg-purple-50/50"
                    >
                      {/* TEMPLATE */}

                      <td className="px-4 py-4 sm:px-8 sm:py-5">
                        <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-11 sm:w-11 ${getTypeClass(
                              template.type
                            )}`}
                          >
                            {getTypeIcon(
                              template.type
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-bold text-[#33303A] sm:max-w-[220px]">
                              {template.name ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#8C8697]">
                              Message template
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* TYPE */}

                      <td className="px-3 py-4 sm:px-4 sm:py-5">
                        <span className="inline-flex max-w-[190px] rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-[10px] font-bold leading-tight text-[#5E52B7] sm:text-[11px]">
                          {getTypeLabel(
                            template.type
                          )}
                        </span>
                      </td>

                      {/* SUBJECT */}

                      <td className="max-w-[220px] px-3 py-4 sm:px-4 sm:py-5">
                        <span className="block max-w-[180px] truncate text-sm font-medium text-[#6E687A] sm:max-w-[220px]">
                          {template.subject ||
                            "-"}
                        </span>
                      </td>

                      {/* CONTENT */}

                      <td className="max-w-[350px] px-3 py-4 sm:px-4 sm:py-5">
                        <span className="block max-w-[260px] truncate text-sm font-medium text-[#6E687A] sm:max-w-[350px]">
                          {template.content ||
                            "-"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="px-3 py-4 sm:px-4 sm:py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm sm:px-3.5 sm:text-[11px] ${
                            template.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-gray-200 bg-gray-100 text-gray-700"
                          }`}
                        >
                          {template.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4 sm:px-8 sm:py-5">
                        <div className="flex justify-end gap-1.5 sm:gap-2">
                          {/* TOGGLE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(
                                template
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm transition-all hover:scale-110 hover:bg-emerald-600 hover:text-white"
                            title={
                              template.active
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            <Power
                              size={16}
                            />
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                template
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm transition-all hover:scale-110 hover:bg-blue-600 hover:text-white"
                            title="Edit"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                template._id
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

      {/* =====================================================
          MODAL
      ===================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 backdrop-blur-[4px] sm:p-4">
          <div className="flex max-h-[96vh] w-full max-w-lg flex-col overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:max-h-[92vh] sm:rounded-[26px]">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-purple-50 bg-white px-4 py-4 sm:px-7 sm:py-6">
              <div className="min-w-0">
                <div className="mb-2 inline-flex max-w-full items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:text-[11px] sm:tracking-[0.14em]">
                  <FileText
                    size={13}
                    className="shrink-0"
                  />
                  <span className="truncate">
                    Template Builder
                  </span>
                </div>

                <h2 className="text-lg font-black text-[#17151F] sm:text-xl">
                  {editingTemplate
                    ? "Edit Template"
                    : "Add Template"}
                </h2>

                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#8C8697] sm:text-xs">
                  Create a reusable message
                  template
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL ERROR */}

            {error && (
              <div className="mx-4 mt-4 shrink-0 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-700 shadow-sm sm:mx-7 sm:mt-5 sm:text-sm">
                {error}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 sm:space-y-5 sm:p-7"
            >
              {/* NAME */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Template Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter template name"
                  required
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />
              </div>

              {/* TYPE */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Template Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                >
                  {TEMPLATE_TYPES.map(
                    (type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* SUBJECT */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Subject
                  <span className="ml-1 font-normal text-[#8C8697]">
                    (optional)
                  </span>
                </label>

                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter subject"
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />
              </div>

              {/* CONTENT */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Content
                </label>

                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write template content..."
                  rows={7}
                  required
                  className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 py-3 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />

                <p className="mt-2 text-xs font-medium leading-relaxed text-[#8C8697]">
                  You can use dynamic placeholders
                  such as {"{{customerName}}"} and{" "}
                  {"{{serviceName}}"}.
                </p>
              </div>

              {/* ACTIVE */}

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-purple-200/80 bg-[#FAFAFB] p-3.5 sm:p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#33303A]">
                    Template Status
                  </p>

                  <p className="mt-1 text-xs font-medium leading-relaxed text-[#8C8697]">
                    Enable or disable this
                    template.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData(
                      (previous) => ({
                        ...previous,
                        active:
                          !previous.active,
                      })
                    )
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    formData.active
                      ? "bg-[#5E52B7]"
                      : "bg-[#D5D5D5]"
                  }`}
                  aria-label="Toggle template status"
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      formData.active
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-2.5 border-t border-purple-50 pt-5 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="w-full rounded-xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition-all hover:bg-purple-50 hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[130px] sm:w-auto"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {submitting
                    ? "Saving..."
                    : editingTemplate
                    ? "Update Template"
                    : "Add Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Templates;