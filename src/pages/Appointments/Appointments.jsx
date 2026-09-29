import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  CalendarDays,
  LoaderCircle,
  UserRound,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../../services/appointmentApi";

/*
|--------------------------------------------------------------------------
| BACKEND APPOINTMENT STATUSES
|--------------------------------------------------------------------------
*/

const APPOINTMENT_STATUSES = [
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "NO_SHOW",
    label: "No Show",
  },
];

/*
|--------------------------------------------------------------------------
| INITIAL FORM
|--------------------------------------------------------------------------
*/

const EMPTY_FORM = {
  customer: "",
  service: "",
  date: "",
  time: "",
  notes: "",
  status: "PENDING",
};

const Appointments = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  /*
  |--------------------------------------------------------------------------
  | LOAD APPOINTMENTS
  |--------------------------------------------------------------------------
  */

  const loadAppointments = async ({
    silent = false,
  } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const data = await getAppointments();

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.appointments)
          ? data.appointments
          : Array.isArray(data?.data?.appointments)
            ? data.data.appointments
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setAppointments(result);
    } catch (err) {
      const message =
        err?.message ||
        "Unable to load appointments.";

      if (
        String(message)
          .toLowerCase()
          .includes("401") ||
        String(message)
          .toLowerCase()
          .includes("unauthorized") ||
        String(message)
          .toLowerCase()
          .includes("token")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");

        navigate("/login");

        return;
      }

      setAppointments([]);
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadAppointments();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SUCCESS MESSAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  /*
  |--------------------------------------------------------------------------
  | FILTER APPOINTMENTS
  |--------------------------------------------------------------------------
  */

  const filteredAppointments = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    return appointments.filter((appointment) => {
      const customerName =
        typeof appointment?.customer === "object"
          ? appointment?.customer?.name || ""
          : appointment?.customer || "";

      const customerEmail =
        typeof appointment?.customer === "object"
          ? appointment?.customer?.email || ""
          : "";

      const serviceName =
        typeof appointment?.service === "string"
          ? appointment.service
          : appointment?.service?.name || "";

      const appointmentStatus =
        String(
          appointment?.status || "",
        ).toUpperCase();

      const matchesSearch =
        !searchValue ||
        customerName
          .toLowerCase()
          .includes(searchValue) ||
        customerEmail
          .toLowerCase()
          .includes(searchValue) ||
        serviceName
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        appointmentStatus ===
          statusFilter.toUpperCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    appointments,
    search,
    statusFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE MODAL
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    setEditingAppointment(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setError("");
    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);

    const customerValue =
      typeof appointment?.customer === "object"
        ? appointment?.customer?._id || ""
        : appointment?.customer || "";

    const serviceValue =
      typeof appointment?.service === "string"
        ? appointment.service
        : appointment?.service?.name || "";

    setFormData({
      customer: customerValue,

      service: serviceValue,

      date: appointment?.date
        ? formatDateForInput(
            appointment.date,
          )
        : "",

      time: appointment?.time || "",

      notes: appointment?.notes || "",

      status:
        appointment?.status || "PENDING",
    });

    setError("");
    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingAppointment(null);

    setFormData({
      ...EMPTY_FORM,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!formData.customer.trim()) {
      setError(
        "Customer is required.",
      );
      return;
    }

    if (!formData.service.trim()) {
      setError(
        "Service is required.",
      );
      return;
    }

    if (!formData.date) {
      setError(
        "Appointment date is required.",
      );
      return;
    }

    if (!formData.time) {
      setError(
        "Appointment time is required.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer:
          formData.customer.trim(),

        service:
          formData.service.trim(),

        date:
          formData.date,

        time:
          formData.time,

        notes:
          formData.notes.trim(),

        status:
          formData.status,
      };

      if (editingAppointment) {
        const data =
          await updateAppointment(
            editingAppointment._id,
            payload,
          );

        const updatedAppointment =
          data?.appointment ||
          data?.data?.appointment ||
          data?.data ||
          data;

        if (!updatedAppointment) {
          throw new Error(
            "Appointment was updated but no appointment data was returned.",
          );
        }

        setAppointments((previous) =>
          previous.map(
            (appointment) =>
              appointment._id ===
              editingAppointment._id
                ? {
                    ...appointment,
                    ...updatedAppointment,
                  }
                : appointment,
          ),
        );

        setSuccessMessage(
          "Appointment updated successfully.",
        );
      } else {
        const data =
          await createAppointment(
            payload,
          );

        const newAppointment =
          data?.appointment ||
          data?.data?.appointment ||
          data?.data ||
          data;

        if (!newAppointment) {
          throw new Error(
            "Appointment was created but no appointment data was returned.",
          );
        }

        setAppointments((previous) => [
          newAppointment,
          ...previous,
        ]);

        setSuccessMessage(
          "Appointment created successfully.",
        );
      }

      setShowModal(false);
      setEditingAppointment(null);

      setFormData({
        ...EMPTY_FORM,
      });
    } catch (err) {
      const message =
        err?.message ||
        "Unable to save appointment.";

      if (
        String(message)
          .toLowerCase()
          .includes("401") ||
        String(message)
          .toLowerCase()
          .includes("unauthorized")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");

        navigate("/login");

        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this appointment?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      await deleteAppointment(id);

      setAppointments((previous) =>
        previous.filter(
          (appointment) =>
            appointment._id !== id,
        ),
      );

      setSuccessMessage(
        "Appointment deleted successfully.",
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete appointment.",
      );
    } finally {
      setDeletingId("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      setError("");

      await loadAppointments({
        silent: true,
      });

      setSuccessMessage(
        "Appointments refreshed.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-4 sm:pt-4 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-6 flex animate-[fadeIn_.45s_ease-out_both] flex-col gap-5 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:px-3.5 sm:py-1.5 sm:text-[11px]">
              <Sparkles size={12} />

              CRM Schedule
            </div>

            <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
              Appointments
            </h1>

            <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
              Manage customer appointments,
              schedules and service bookings
              from one central workspace.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-3 py-2.5 text-xs font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3 sm:text-sm"
            >
              <RefreshCw
                size={15}
                className={`transition-transform duration-500 ${
                  refreshing
                    ? "animate-spin text-[#5E52B7]"
                    : "group-hover:rotate-90"
                }`}
              />

              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:px-5 sm:py-3 sm:text-sm"
            >
              <Plus
                size={16}
                className="transition-transform duration-300 group-hover:rotate-90"
              />

              <span>Add Appointment</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs font-bold text-emerald-800 shadow-sm sm:mb-6 sm:px-5 sm:py-4 sm:text-sm">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span className="break-words">
              {successMessage}
            </span>
          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-xs font-semibold text-red-700 shadow-sm sm:mb-6 sm:px-5 sm:py-4 sm:text-sm">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1 break-words">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-xl p-1 text-red-400 transition hover:bg-red-100 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="mb-5 rounded-[22px] border border-purple-200/70 bg-white p-3.5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:mb-6 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative min-w-0">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search customer, email or service..."
                className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:text-sm"
            >
              <option value="All">
                All Statuses
              </option>

              {APPOINTMENT_STATUSES.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">
          <div className="flex flex-col gap-3 border-b border-purple-50 px-4 py-5 sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm">
                  <CalendarDays size={18} />
                </div>

                <h2 className="text-base font-black text-[#24212C] sm:text-[17px]">
                  All Appointments
                </h2>
              </div>

              <p className="mt-1 pl-0 text-[11px] font-medium text-[#8C8697] sm:pl-[52px] sm:text-xs">
                {filteredAppointments.length}{" "}
                appointment
                {filteredAppointments.length !==
                1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/50 px-3 py-2 text-[11px] font-bold text-[#5E52B7] sm:text-xs">
              <UserRound size={14} />

              {appointments.length} total
            </div>
          </div>

          {loading ? (
            <TableLoading />
          ) : filteredAppointments.length ===
            0 ? (
            <EmptyState
              search={search}
              statusFilter={statusFilter}
              onAdd={openCreateModal}
              onClear={() => {
                setSearch("");
                setStatusFilter("All");
              }}
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead>
                  <tr className="border-b border-purple-50 bg-purple-50/40">
                    <th className="px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:px-6 md:px-8">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Service
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Date & Time
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:px-6 md:px-8">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map(
                    (
                      appointment,
                      index,
                    ) => (
                      <AppointmentRow
                        key={
                          appointment?._id ||
                          index
                        }
                        appointment={
                          appointment
                        }
                        index={index}
                        onEdit={
                          openEditModal
                        }
                        onDelete={
                          handleDelete
                        }
                        deletingId={
                          deletingId
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <AppointmentModal
          editingAppointment={
            editingAppointment
          }
          formData={formData}
          saving={saving}
          error={error}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
};

/*
|--------------------------------------------------------------------------
| APPOINTMENT ROW
|--------------------------------------------------------------------------
*/

const AppointmentRow = ({
  appointment,
  index,
  onEdit,
  onDelete,
  deletingId,
}) => {
  const customer =
    typeof appointment?.customer ===
    "object"
      ? appointment.customer
      : null;

  const customerName =
    customer?.name ||
    appointment?.customer ||
    "—";

  const customerEmail =
    customer?.email || "";

  const customerPhone =
    customer?.phone || "";

  const serviceName =
    typeof appointment?.service ===
    "string"
      ? appointment.service
      : appointment?.service?.name ||
        "—";

  const isDeleting =
    deletingId ===
    appointment?._id;

  return (
    <tr
      style={{
        animationDelay: `${
          index * 45
        }ms`,
      }}
      className="group animate-[fadeIn_.4s_ease-out_both] border-b border-purple-50 transition-all duration-200 last:border-0 hover:bg-purple-50/50"
    >
      {/* Customer */}

      <td className="px-5 py-5 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xs font-black text-[#5E52B7] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md sm:h-11 sm:w-11">
            <UserRound size={17} />
          </div>

          <div className="min-w-0">
            <p className="max-w-[180px] truncate text-sm font-bold text-[#33303A] transition-colors group-hover:text-[#5E52B7] sm:max-w-[220px]">
              {customerName}
            </p>

            {customerEmail ? (
              <p className="mt-0.5 max-w-[180px] truncate text-[10px] font-medium text-[#8C8697] sm:max-w-[190px] sm:text-[11px]">
                {customerEmail}
              </p>
            ) : customerPhone ? (
              <p className="mt-0.5 text-[10px] font-medium text-[#8C8697] sm:text-[11px]">
                {customerPhone}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      {/* Service */}

      <td className="px-4 py-5">
        <div className="inline-flex max-w-[200px] items-center rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 shadow-sm sm:max-w-[220px]">
          <span className="truncate text-xs font-bold text-[#5E52B7]">
            {serviceName}
          </span>
        </div>
      </td>

      {/* Date / Time */}

      <td className="px-4 py-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#55515F]">
            <CalendarDays
              size={14}
              className="shrink-0 text-[#5E52B7]"
            />

            <span className="whitespace-nowrap">
              {formatDisplayDate(
                appointment?.date,
              )}
            </span>
          </div>

          {appointment?.time && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#8C8697]">
              <Clock size={13} />

              <span className="whitespace-nowrap">
                {formatTime(
                  appointment.time,
                )}
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Status */}

      <td className="px-4 py-5">
        <StatusBadge
          status={
            appointment?.status
          }
        />
      </td>

      {/* Actions */}

      <td className="px-5 py-5 sm:px-6 md:px-8">
        <div className="flex justify-end gap-2">
          <Link
            to={`/appointments/${appointment?._id}`}
            title="View appointment"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-300 hover:scale-110 hover:bg-[#5E52B7] hover:text-white hover:shadow-sm"
          >
            <Eye size={17} />
          </Link>

          <button
            type="button"
            onClick={() =>
              onEdit(appointment)
            }
            title="Edit appointment"
            disabled={isDeleting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(
                appointment?._id,
              )
            }
            title="Delete appointment"
            disabled={isDeleting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-all duration-300 hover:scale-110 hover:bg-red-500 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

/*
|--------------------------------------------------------------------------
| APPOINTMENT MODAL
|--------------------------------------------------------------------------
*/

const AppointmentModal = ({
  editingAppointment,
  formData,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-2 backdrop-blur-[4px] sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="my-2 flex max-h-[96vh] w-full max-w-xl flex-col overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:my-4 sm:max-h-[92vh] sm:rounded-[26px]">
        {/* Modal Header */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-purple-50 bg-white px-4 py-4 sm:px-6 sm:py-6 md:px-7">
          <div className="min-w-0">
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:mb-2 sm:text-[11px]">
              <CalendarDays size={12} />

              Appointment
            </div>

            <h2 className="text-lg font-black text-[#17151F] sm:text-xl">
              {editingAppointment
                ? "Edit Appointment"
                : "Add Appointment"}
            </h2>

            <p className="mt-1 text-[11px] font-medium leading-5 text-[#8C8697] sm:text-xs">
              {editingAppointment
                ? "Update appointment information."
                : "Create a new customer appointment."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && (
            <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700 shadow-sm sm:mx-6 sm:mt-5 sm:px-4 sm:py-3">
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
              />

              <span className="break-words">
                {error}
              </span>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="space-y-4 p-4 sm:space-y-5 sm:p-6 md:p-7"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Customer ID"
                name="customer"
                value={
                  formData.customer
                }
                onChange={onChange}
                placeholder="Enter customer ID"
                required
              />

              <FormField
                label="Service"
                name="service"
                value={
                  formData.service
                }
                onChange={onChange}
                placeholder="e.g. Home Cleaning"
                required
              />

              <FormField
                label="Date"
                name="date"
                type="date"
                value={
                  formData.date
                }
                onChange={onChange}
                required
              />

              <FormField
                label="Time"
                name="time"
                type="time"
                value={
                  formData.time
                }
                onChange={onChange}
                required
              />
            </div>

            {/* Status */}

            <div>
              <label className="mb-2 block text-xs font-bold text-[#55515F]">
                Status
              </label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={onChange}
                className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
              >
                {APPOINTMENT_STATUSES.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {status.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Notes */}

            <div>
              <label className="mb-2 block text-xs font-bold text-[#55515F]">
                Notes
              </label>

              <textarea
                name="notes"
                value={
                  formData.notes
                }
                onChange={onChange}
                placeholder="Add appointment notes..."
                rows={4}
                className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 py-3 text-sm font-medium text-[#444444] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
              />
            </div>

            {/* Footer */}

            <div className="flex flex-col-reverse gap-2.5 border-t border-purple-50 pt-4 sm:flex-row sm:justify-end sm:gap-3 sm:pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="min-h-[44px] rounded-xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition-all duration-200 hover:bg-purple-50 hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                )}

                {saving
                  ? "Saving..."
                  : editingAppointment
                    ? "Update Appointment"
                    : "Create Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| FORM FIELD
|--------------------------------------------------------------------------
*/

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-xs font-bold text-[#55515F]">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({
  status,
}) => {
  const normalizedStatus =
    String(status || "")
      .trim()
      .toUpperCase();

  const statusClasses = {
    PENDING:
      "border-amber-200 bg-amber-50 text-amber-800",

    CONFIRMED:
      "border-emerald-200 bg-emerald-50 text-emerald-800",

    COMPLETED:
      "border-blue-200 bg-blue-50 text-blue-800",

    CANCELLED:
      "border-red-200 bg-red-50 text-red-800",

    NO_SHOW:
      "border-orange-200 bg-orange-50 text-orange-800",
  };

  const statusLabels = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-extrabold shadow-sm transition-all duration-200 group-hover:scale-105 sm:px-3.5 sm:text-[11px] ${
        statusClasses[
          normalizedStatus
        ] ||
        "border-purple-200 bg-purple-50 text-[#5E52B7]"
      }`}
    >
      {statusLabels[
        normalizedStatus
      ] ||
        status ||
        "—"}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| TABLE LOADING
|--------------------------------------------------------------------------
*/

const TableLoading = () => {
  return (
    <div className="divide-y divide-purple-50">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-5 py-5 sm:px-6 md:px-8"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-purple-100/80 sm:h-11 sm:w-11" />

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-3.5 w-36 max-w-full animate-pulse rounded-md bg-purple-100/80" />

            <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50" />
          </div>

          <div className="hidden h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80 sm:block" />

          <div className="hidden h-6 w-20 animate-pulse rounded-full bg-purple-100/80 md:block" />

          <div className="h-9 w-24 animate-pulse rounded-xl bg-purple-100/80 sm:h-10 sm:w-28" />
        </div>
      ))}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

const EmptyState = ({
  search,
  statusFilter,
  onAdd,
  onClear,
}) => {
  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "All";

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[380px] sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">
        <CalendarDays size={25} />
      </div>

      <h3 className="mt-5 text-sm font-black text-[#33303A] sm:mt-6 sm:text-base">
        {hasFilters
          ? "No appointments found"
          : "No appointments yet"}
      </h3>

      <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697]">
        {hasFilters
          ? "Try changing your search or status filter."
          : "Create your first appointment to start managing the customer schedule."}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-2xl border border-purple-200/80 bg-white px-5 py-3 text-xs font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] sm:mt-6"
        >
          Clear Filters
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:mt-6"
        >
          <Plus size={16} />

          Add Appointment
        </button>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| DATE FORMAT
|--------------------------------------------------------------------------
*/

const formatDisplayDate = (
  date,
) => {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return String(date);
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

/*
|--------------------------------------------------------------------------
| DATE INPUT FORMAT
|--------------------------------------------------------------------------
*/

const formatDateForInput = (
  date,
) => {
  if (!date) {
    return "";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "";
  }

  const year =
    parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/*
|--------------------------------------------------------------------------
| TIME FORMAT
|--------------------------------------------------------------------------
*/

const formatTime = (time) => {
  if (!time) {
    return "—";
  }

  if (
    /am|pm/i.test(
      String(time),
    )
  ) {
    return time;
  }

  const match =
    String(time).match(
      /^(\d{1,2}):(\d{2})/,
    );

  if (!match) {
    return time;
  }

  let hours =
    Number(match[1]);

  const minutes =
    match[2];

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  hours =
    hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
};

export default Appointments;