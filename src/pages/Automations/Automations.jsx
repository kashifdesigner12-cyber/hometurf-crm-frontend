import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Zap,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TRIGGERS = [
  {
    value: "NEW_LEAD",
    label: "New Lead",
  },
  {
    value: "APPOINTMENT_CONFIRMED",
    label: "Appointment Confirmed",
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
    value: "REVIEW_FOLLOWUP",
    label: "Review Follow-up",
  },
];

const ACTIONS = [
  {
    value: "SEND_MESSAGE",
    label: "Send Message",
  },
  {
    value: "SEND_REVIEW_REQUEST",
    label: "Send Review Request",
  },
  {
    value: "NOTIFY_STAFF",
    label: "Notify Staff",
  },
];

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

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
      result?.message || `Request failed with status ${response.status}`
    );
  }

  return result;
};

const Automations = () => {
  const [automations, setAutomations] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    trigger: "NEW_LEAD",
    action: "SEND_MESSAGE",
    delay: 0,
    active: true,
    messageTemplate: "",
  });

  // =====================================================
  // LOAD AUTOMATIONS
  // =====================================================

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/automations");

      const automationData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setAutomations(automationData);
    } catch (err) {
      console.error("Load automations error:", err);

      setAutomations([]);
      setError(err?.message || "Failed to load automations.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredAutomations = useMemo(() => {
    return automations.filter((automation) => {
      const name = String(automation?.name || "");
      const trigger = String(automation?.trigger || "");
      const action = String(automation?.action || "");

      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(searchValue) ||
        trigger.toLowerCase().includes(searchValue) ||
        action.toLowerCase().includes(searchValue);

      const isActive = Boolean(automation?.active);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && isActive) ||
        (statusFilter === "Inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [automations, search, statusFilter]);

  // =====================================================
  // FORM
  // =====================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "delay" ? Math.max(0, Number(value)) : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      trigger: "NEW_LEAD",
      action: "SEND_MESSAGE",
      delay: 0,
      active: true,
      messageTemplate: "",
    });

    setEditingAutomation(null);
    setError("");
  };

  const handleAddAutomation = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditAutomation = (automation) => {
    setEditingAutomation(automation);

    setFormData({
      name: automation?.name || "",
      trigger: automation?.trigger || "NEW_LEAD",
      action: automation?.action || "SEND_MESSAGE",
      delay:
        automation?.delay !== undefined ? Number(automation.delay) : 0,
      active:
        automation?.active !== undefined
          ? Boolean(automation.active)
          : true,
      messageTemplate:
        automation?.messageTemplate?._id ||
        automation?.messageTemplate ||
        "",
    });

    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
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
      setError("Automation name is required.");
      return;
    }

    if (!formData.trigger) {
      setError("Please select a trigger.");
      return;
    }

    if (!formData.action) {
      setError("Please select an action.");
      return;
    }

    if (Number(formData.delay) < 0) {
      setError("Delay cannot be negative.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        name: formData.name.trim(),
        trigger: formData.trigger,
        action: formData.action,
        delay: Number(formData.delay) || 0,
        active: Boolean(formData.active),
      };

      if (formData.messageTemplate) {
        payload.messageTemplate = formData.messageTemplate.trim();
      }

      if (editingAutomation) {
        const response = await apiRequest(
          `/automations/${editingAutomation._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        const updatedAutomation = response?.data;

        if (updatedAutomation) {
          setAutomations((previous) =>
            previous.map((automation) =>
              automation._id === editingAutomation._id
                ? updatedAutomation
                : automation
            )
          );
        }

        setSuccessMessage("Automation updated successfully.");
      } else {
        const response = await apiRequest("/automations", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const newAutomation = response?.data;

        if (newAutomation) {
          setAutomations((previous) => [newAutomation, ...previous]);
        }

        setSuccessMessage("Automation created successfully.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save automation error:", err);

      setError(err?.message || "Failed to save automation.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this automation?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccessMessage("");

      await apiRequest(`/automations/${id}`, {
        method: "DELETE",
      });

      setAutomations((previous) =>
        previous.filter((automation) => automation._id !== id)
      );

      setSuccessMessage("Automation deleted successfully.");
    } catch (err) {
      console.error("Delete automation error:", err);

      setError(err?.message || "Failed to delete automation.");
    }
  };

  // =====================================================
  // TOGGLE ACTIVE STATUS
  // =====================================================

  const handleToggleStatus = async (automation) => {
    const newActive = !Boolean(automation.active);

    try {
      setError("");
      setSuccessMessage("");

      const response = await apiRequest(
        `/automations/${automation._id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            active: newActive,
          }),
        }
      );

      const updatedAutomation = response?.data;

      if (updatedAutomation) {
        setAutomations((previous) =>
          previous.map((item) =>
            item._id === automation._id ? updatedAutomation : item
          )
        );
      }

      setSuccessMessage(
        newActive
          ? "Automation activated."
          : "Automation paused."
      );
    } catch (err) {
      console.error("Toggle automation error:", err);

      setError(
        err?.message || "Failed to update automation status."
      );
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getStatusClass = (active) => {
    return active
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-gray-200 bg-gray-100 text-gray-700";
  };

  const getStatusText = (active) => {
    return active ? "Active" : "Inactive";
  };

  const getTriggerLabel = (trigger) => {
    const found = TRIGGERS.find((item) => item.value === trigger);

    return found?.label || trigger || "-";
  };

  const getActionLabel = (action) => {
    const found = ACTIONS.find((item) => item.value === action);

    return found?.label || action || "-";
  };

  const getTemplateName = (template) => {
    if (!template) return "-";

    if (typeof template === "object") {
      return template.name || "-";
    }

    return String(template);
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
            <Sparkles size={13} className="shrink-0" />
            <span className="truncate">Workflow Engine</span>
          </div>

          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] lg:text-[38px]">
            Automations
          </h1>

          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
            Manage automated workflows and actions from one central
            workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddAutomation}
          className="button-press group inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto"
        >
          <Plus
            size={17}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
          Add Automation
        </button>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm sm:px-5 sm:py-4 sm:text-sm">
          {successMessage}
        </div>
      )}

      {/* ERROR */}
      {error && !isModalOpen && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 sm:text-sm">
          <span className="break-words">{error}</span>

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
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search automations..."
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-sm font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 md:w-auto md:min-w-[160px]"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">
        {loading ? (
          <div className="divide-y divide-purple-50">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex min-w-0 animate-pulse items-center gap-3 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5"
              >
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-purple-100/80 sm:h-11 sm:w-11" />

                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="h-3.5 w-32 max-w-full rounded-md bg-purple-100/80 sm:w-40" />
                  <div className="h-3 w-24 max-w-full rounded-md bg-purple-50 sm:w-28" />
                </div>

                <div className="hidden h-3.5 w-28 rounded-md bg-purple-100/80 md:block" />
                <div className="hidden h-3.5 w-28 rounded-md bg-purple-100/80 lg:block" />

                <div className="h-9 w-20 shrink-0 rounded-xl bg-purple-100/80 sm:h-10 sm:w-28" />
              </div>
            ))}
          </div>
        ) : filteredAutomations.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[380px] sm:px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">
              <Zap size={25} className="sm:h-7 sm:w-7" />
            </div>

            <h3 className="mt-5 text-base font-black text-[#33303A] sm:mt-6">
              No automations found
            </h3>

            <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697]">
              Your automated workflows will appear here when they are
              available.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] sm:min-w-[1050px]">
              <thead>
                <tr className="border-b border-purple-50 bg-purple-50/40">
                  <th className="px-4 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Automation
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Trigger
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Action
                  </th>

                  <th className="px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Delay
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
                {filteredAutomations.map((automation) => (
                  <tr
                    key={automation._id}
                    className="transition hover:bg-purple-50/50"
                  >
                    {/* AUTOMATION */}
                    <td className="px-4 py-4 sm:px-8 sm:py-5">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm sm:h-11 sm:w-11">
                          <Zap size={17} className="sm:h-[18px] sm:w-[18px]" />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[170px] truncate text-sm font-bold text-[#33303A] sm:max-w-[220px]">
                            {automation.name || "-"}
                          </p>

                          <p className="mt-1 max-w-[170px] truncate text-xs font-medium text-[#8C8697] sm:max-w-[220px]">
                            {getTemplateName(automation.messageTemplate)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* TRIGGER */}
                    <td className="px-3 py-4 sm:px-4 sm:py-5">
                      <span className="inline-flex max-w-[190px] rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-[10px] font-bold leading-tight text-[#5E52B7] sm:text-[11px]">
                        {getTriggerLabel(automation.trigger)}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-3 py-4 sm:px-4 sm:py-5">
                      <span className="text-sm font-medium text-[#6E687A]">
                        {getActionLabel(automation.action)}
                      </span>
                    </td>

                    {/* DELAY */}
                    <td className="px-3 py-4 sm:px-4 sm:py-5">
                      <span className="whitespace-nowrap text-sm font-medium text-[#6E687A]">
                        {Number(automation.delay) || 0} min
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-4 sm:px-4 sm:py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm sm:px-3.5 sm:text-[11px] ${getStatusClass(
                          automation.active
                        )}`}
                      >
                        {getStatusText(automation.active)}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-4 sm:px-8 sm:py-5">
                      <div className="flex justify-end gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(automation)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] shadow-sm transition-all hover:scale-110 hover:bg-[#5E52B7] hover:text-white"
                          title={automation.active ? "Pause" : "Activate"}
                        >
                          {automation.active ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditAutomation(automation)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm transition-all hover:scale-110 hover:bg-blue-600 hover:text-white"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(automation._id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 shadow-sm transition-all hover:scale-110 hover:bg-red-500 hover:text-white"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  <Zap size={13} className="shrink-0" />
                  <span className="truncate">Automation Builder</span>
                </div>

                <h2 className="text-lg font-black text-[#17151F] sm:text-xl">
                  {editingAutomation ? "Edit Automation" : "Add Automation"}
                </h2>

                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#8C8697] sm:text-xs">
                  {editingAutomation
                    ? "Update automation workflow"
                    : "Create a new automated workflow"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
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
                  Automation Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter automation name"
                  required
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />
              </div>

              {/* TRIGGER */}
              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Trigger
                </label>

                <select
                  name="trigger"
                  value={formData.trigger}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                >
                  {TRIGGERS.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ACTION */}
              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Action
                </label>

                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                >
                  {ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DELAY */}
              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Delay (minutes)
                </label>

                <input
                  type="number"
                  name="delay"
                  min="0"
                  value={formData.delay}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />

                <p className="mt-1.5 text-xs font-medium text-[#8C8697]">
                  Enter 0 for immediate execution.
                </p>
              </div>

              {/* MESSAGE TEMPLATE ID */}
              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Message Template ID
                  <span className="ml-1 font-normal text-[#8C8697]">
                    (optional)
                  </span>
                </label>

                <input
                  type="text"
                  name="messageTemplate"
                  value={formData.messageTemplate}
                  onChange={handleInputChange}
                  placeholder="MongoDB MessageTemplate ID"
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />

                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#8C8697]">
                  Leave empty if this automation does not use a message
                  template.
                </p>
              </div>

              {/* ACTIVE */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-purple-200/80 bg-[#FAFAFB] p-3.5 sm:p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#33303A]">
                    Automation Status
                  </p>

                  <p className="mt-1 text-xs font-medium leading-relaxed text-[#8C8697]">
                    Enable or disable this automation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      active: !previous.active,
                    }))
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    formData.active ? "bg-[#5E52B7]" : "bg-[#D5D5D5]"
                  }`}
                  aria-label="Toggle automation status"
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      formData.active ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-2.5 border-t border-purple-50 pt-5 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {submitting
                    ? "Saving..."
                    : editingAutomation
                    ? "Update Automation"
                    : "Add Automation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Automations;