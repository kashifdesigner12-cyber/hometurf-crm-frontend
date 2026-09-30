import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apihometurf.localpro1.net/api";

const Calls = () => {
  const [calls, setCalls] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCall, setEditingCall] = useState(null);

  const [formData, setFormData] = useState({
    customer: "",
    phoneNumber: "",
    direction: "INCOMING",
    status: "COMPLETED",
    duration: "",
    summary: "",
    notes: "",
    outcome: "",
    recordingUrl: "",
    startedAt: "",
    endedAt: "",
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    });

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
  // LOAD CALLS
  // ============================================================

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/calls");

      const callData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : response?.calls || [];

      setCalls(callData);
    } catch (error) {
      console.error("Load calls error:", error);
      setCalls([]);
      setError(error.message || "Failed to load calls.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const customerName =
        call.customer?.name ||
        call.customerName ||
        "";

      const phoneNumber =
        call.phoneNumber ||
        call.phone ||
        call.customer?.phone ||
        "";

      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        customerName.toLowerCase().includes(searchValue) ||
        phoneNumber.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        call.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [calls, search, statusFilter]);

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
      phoneNumber: "",
      direction: "INCOMING",
      status: "COMPLETED",
      duration: "",
      summary: "",
      notes: "",
      outcome: "",
      recordingUrl: "",
      startedAt: "",
      endedAt: "",
    });

    setEditingCall(null);
  };

  // ============================================================
  // ADD
  // ============================================================

  const handleAddCall = () => {
    setError("");
    setSuccess("");
    resetForm();
    setIsModalOpen(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEditCall = (call) => {
    setError("");
    setSuccess("");

    setEditingCall(call);

    setFormData({
      customer:
        call.customer?._id ||
        call.customer ||
        "",

      phoneNumber:
        call.phoneNumber ||
        call.phone ||
        call.customer?.phone ||
        "",

      direction:
        call.direction ||
        "INCOMING",

      status:
        call.status ||
        "COMPLETED",

      duration:
        call.duration !== undefined &&
        call.duration !== null
          ? String(call.duration)
          : "",

      summary:
        call.summary ||
        "",

      notes:
        call.notes ||
        "",

      outcome:
        call.outcome ||
        "",

      recordingUrl:
        call.recordingUrl ||
        "",

      startedAt:
        call.startedAt
          ? convertDateForInput(call.startedAt)
          : "",

      endedAt:
        call.endedAt
          ? convertDateForInput(call.endedAt)
          : "",
    });

    setIsModalOpen(true);
  };

  // ============================================================
  // DATE INPUT
  // ============================================================

  const convertDateForInput = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    const hours = String(
      parsedDate.getHours()
    ).padStart(2, "0");

    const minutes = String(
      parsedDate.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

    if (
      !formData.customer.trim() &&
      !formData.phoneNumber.trim()
    ) {
      setError(
        "Customer ID or phone number is required."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        phoneNumber:
          formData.phoneNumber.trim(),

        direction:
          formData.direction,

        status:
          formData.status,

        duration:
          formData.duration
            ? Number(formData.duration)
            : 0,

        summary:
          formData.summary.trim(),

        notes:
          formData.notes.trim(),

        outcome:
          formData.outcome.trim(),

        recordingUrl:
          formData.recordingUrl.trim(),
      };

      if (formData.customer.trim()) {
        payload.customer =
          formData.customer.trim();
      }

      if (formData.startedAt) {
        payload.startedAt =
          new Date(
            formData.startedAt
          ).toISOString();
      }

      if (formData.endedAt) {
        payload.endedAt =
          new Date(
            formData.endedAt
          ).toISOString();
      }

      if (editingCall) {
        const response = await apiRequest(
          `/calls/${editingCall._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        const updatedCall =
          response?.data ||
          response?.call ||
          response;

        setCalls((previous) =>
          previous.map((call) =>
            call._id === editingCall._id
              ? updatedCall
              : call
          )
        );

        setSuccess(
          "Call updated successfully."
        );
      } else {
        const response = await apiRequest(
          "/calls",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        const newCall =
          response?.data ||
          response?.call ||
          response;

        if (newCall) {
          setCalls((previous) => [
            newCall,
            ...previous,
          ]);
        }

        setSuccess(
          "Call created successfully."
        );
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(
        "Save call error:",
        error
      );

      setError(
        error.message ||
          "Failed to save call."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getCustomerName = (call) => {
    return (
      call.customer?.name ||
      call.customerName ||
      "Unknown Customer"
    );
  };

  const getPhoneNumber = (call) => {
    return (
      call.phoneNumber ||
      call.phone ||
      call.customer?.phone ||
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

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatDuration = (duration) => {
    if (
      duration === undefined ||
      duration === null ||
      duration === ""
    ) {
      return "-";
    }

    const seconds = Number(duration);

    if (Number.isNaN(seconds)) {
      return duration;
    }

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  };

  const getCallIcon = (
    direction,
    status
  ) => {
    if (status === "MISSED") {
      return PhoneMissed;
    }

    if (direction === "OUTGOING") {
      return PhoneOutgoing;
    }

    return PhoneIncoming;
  };

  const getStatusLabel = (status) => {
    const labels = {
      COMPLETED: "Completed",
      MISSED: "Missed",
      IN_PROGRESS: "In Progress",
      TRANSFERRED: "Transferred",
      FAILED: "Failed",
    };

    return labels[status] || status || "-";
  };

  const getStatusClass = (status) => {
    if (status === "COMPLETED") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "MISSED") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (status === "IN_PROGRESS") {
      return "border-blue-200 bg-blue-50 text-blue-800";
    }

    if (status === "TRANSFERRED") {
      return "border-purple-200 bg-purple-50 text-[#5E52B7]";
    }

    if (status === "FAILED") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-purple-200 bg-purple-50 text-[#5E52B7]";
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
            <Sparkles size={13} className="shrink-0" />
            <span className="truncate">
              Voice Communications
            </span>
          </div>

          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
            Calls
          </h1>

          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
            Manage customer call records and logs
            from one central workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCall}
          className="button-press group inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto"
        >
          <Plus
            size={17}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
          Add Call
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

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">

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
              placeholder="Search customer or phone..."
              className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:w-auto sm:min-w-[170px] sm:text-sm"
          >
            <option value="All">
              All Status
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="MISSED">
              Missed
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="TRANSFERRED">
              Transferred
            </option>

            <option value="FAILED">
              Failed
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
                    <div className="h-3 w-20 max-w-full rounded-md bg-purple-50 sm:w-24" />
                  </div>

                  <div className="hidden h-3.5 w-24 rounded-md bg-purple-100/80 md:block" />
                  <div className="hidden h-3.5 w-20 rounded-md bg-purple-100/80 lg:block" />

                  <div className="h-9 w-16 shrink-0 rounded-xl bg-purple-100/80 sm:h-10 sm:w-20" />
                </div>
              )
            )}
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[380px] sm:px-6">

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">
              <Phone size={25} className="sm:h-7 sm:w-7" />
            </div>

            <h3 className="mt-5 text-sm font-black text-[#33303A] sm:mt-6 sm:text-base">
              No calls found
            </h3>

            <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697]">
              Call records will appear here when they are available.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto overscroll-x-contain">

            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-purple-50 bg-purple-50/40">

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:tracking-[0.14em]">
                    Customer
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Phone
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Direction
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697]">
                    Duration
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

                {filteredCalls.map(
                  (call) => {
                    const CallIcon =
                      getCallIcon(
                        call.direction,
                        call.status
                      );

                    return (
                      <tr
                        key={call._id}
                        className="transition hover:bg-purple-50/50"
                      >

                        {/* CUSTOMER */}

                        <td className="px-4 py-4 sm:px-8 sm:py-5">
                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm sm:h-11 sm:w-11">
                              <CallIcon size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#33303A]">
                                {getCustomerName(
                                  call
                                )}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-[#8C8697]">
                                {formatTime(
                                  call.startedAt ||
                                    call.createdAt
                                )}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* PHONE */}

                        <td className="max-w-[170px] px-4 py-5 text-sm font-medium text-[#6E687A]">
                          <span className="block truncate">
                            {getPhoneNumber(
                              call
                            )}
                          </span>
                        </td>

                        {/* DIRECTION */}

                        <td className="px-4 py-5">

                          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#55515F]">

                            {call.direction ===
                            "OUTGOING" ? (
                              <PhoneOutgoing
                                size={15}
                                className="shrink-0 text-[#5E52B7]"
                              />
                            ) : (
                              <PhoneIncoming
                                size={15}
                                className="shrink-0 text-[#5E52B7]"
                              />
                            )}

                            {call.direction ===
                            "OUTGOING"
                              ? "Outgoing"
                              : "Incoming"}

                          </span>

                        </td>

                        {/* DURATION */}

                        <td className="px-4 py-5">

                          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#6E687A]">
                            <Clock
                              size={14}
                              className="shrink-0 text-[#5E52B7]"
                            />

                            {formatDuration(
                              call.duration
                            )}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-5">

                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm sm:text-[11px] ${getStatusClass(
                              call.status
                            )}`}
                          >
                            {getStatusLabel(
                              call.status
                            )}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-4 py-5 text-sm font-medium text-[#6E687A]">
                          {formatDate(
                            call.startedAt ||
                              call.createdAt
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-5 sm:px-8">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleEditCall(
                                  call
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm transition-all hover:scale-110 hover:bg-blue-600 hover:text-white"
                              title="Edit"
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
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

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-purple-50 bg-white px-4 py-4 sm:px-7 sm:py-6">

              <div className="min-w-0 pr-3">
                <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:mb-2 sm:text-[11px] sm:tracking-[0.14em]">
                  <Phone size={13} />
                  Call Record
                </div>

                <h2 className="truncate text-lg font-black text-[#17151F] sm:text-xl">
                  {editingCall
                    ? "Edit Call"
                    : "Add Call"}
                </h2>

                <p className="mt-1 truncate text-[11px] font-medium text-[#8C8697] sm:text-xs">
                  {editingCall
                    ? "Update call information"
                    : "Add a new call record"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
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

              {/* CUSTOMER ID */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Customer ID
                </label>

                <input
                  type="text"
                  name="customer"
                  value={formData.customer}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter MongoDB customer ID"
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />

                <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-[#8C8697] sm:text-xs">
                  Optional if phone number is provided.
                </p>
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phoneNumber"
                  value={
                    formData.phoneNumber
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="+92..."
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />
              </div>

              {/* DIRECTION */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Call Direction
                </label>

                <select
                  name="direction"
                  value={
                    formData.direction
                  }
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                >
                  <option value="INCOMING">
                    Incoming
                  </option>

                  <option value="OUTGOING">
                    Outgoing
                  </option>
                </select>
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                >
                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="MISSED">
                    Missed
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="TRANSFERRED">
                    Transferred
                  </option>

                  <option value="FAILED">
                    Failed
                  </option>
                </select>
              </div>

              {/* DURATION */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Duration (seconds)
                </label>

                <input
                  type="number"
                  min="0"
                  name="duration"
                  value={
                    formData.duration
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. 330"
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />
              </div>

              {/* SUMMARY */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Summary
                </label>

                <textarea
                  name="summary"
                  value={
                    formData.summary
                  }
                  onChange={
                    handleInputChange
                  }
                  rows={3}
                  placeholder="Call summary..."
                  className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 py-3 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:text-sm"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={
                    handleInputChange
                  }
                  rows={3}
                  placeholder="Add call notes..."
                  className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 py-3 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:text-sm"
                />
              </div>

              {/* OUTCOME */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Outcome
                </label>

                <input
                  type="text"
                  name="outcome"
                  value={
                    formData.outcome
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. Customer interested"
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />
              </div>

              {/* RECORDING URL */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Recording URL
                </label>

                <input
                  type="url"
                  name="recordingUrl"
                  value={
                    formData.recordingUrl
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />
              </div>

              {/* STARTED AT */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Started At
                </label>

                <input
                  type="datetime-local"
                  name="startedAt"
                  value={
                    formData.startedAt
                  }
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />
              </div>

              {/* ENDED AT */}

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55515F]">
                  Ended At
                </label>

                <input
                  type="datetime-local"
                  name="endedAt"
                  value={
                    formData.endedAt
                  }
                  onChange={
                    handleInputChange
                  }
                  className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-xs font-medium text-[#444444] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
                />
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
                    : editingCall
                    ? "Update Call"
                    : "Add Call"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Calls;