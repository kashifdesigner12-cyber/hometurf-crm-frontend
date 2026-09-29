import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  UserRound,
  Briefcase,
  FileText,
  CircleCheck,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { getAppointmentById } from "../../services/appointmentApi";

const AppointmentDetails = () => {
  const { id } = useParams();

  const [appointment, setAppointment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async (
    isRefresh = false,
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data =
        await getAppointmentById(id);

      const result =
        data?.appointment ||
        data?.data ||
        data;

      setAppointment(result || null);
    } catch (error) {
      console.error(
        "Appointment details error:",
        error,
      );

      setAppointment(null);

      setError(
        error?.message ||
          "Unable to load appointment.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <DetailsLoading />;
  }

  if (!appointment) {
    return (
      <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-4 sm:pt-4 md:px-6 lg:px-7 xl:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Back */}

          <Link
            to="/appointments"
            className="group inline-flex min-h-[40px] items-center gap-2 text-sm font-bold text-[#6E687A] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#5E52B7]"
          >
            <ArrowLeft
              size={16}
              className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
            />

            <span>
              Back to Appointments
            </span>
          </Link>

          {/* Error / Not Found */}

          <div className="relative mt-5 flex min-h-[430px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-purple-200/60 bg-white px-4 py-10 text-center shadow-[0_10px_35px_rgba(94,82,183,0.04)] sm:mt-6 sm:rounded-[24px] sm:px-6">
            {/* Background decoration */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />

            <div className="relative flex h-16 w-16 animate-[scaleIn_.35s_ease-out_both] items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md sm:h-20 sm:w-20 sm:rounded-3xl">
              <CalendarDays
                size={24}
                className="sm:hidden"
              />

              <CalendarDays
                size={28}
                className="hidden sm:block"
              />
            </div>

            <h2 className="relative mt-5 text-lg font-black tracking-[-0.02em] text-[#17151F] sm:mt-6 sm:text-xl">
              Appointment not found
            </h2>

            <p className="relative mt-2 max-w-md break-words text-xs font-medium leading-relaxed text-[#8C8697] sm:text-sm">
              {error ||
                "The requested appointment could not be found."}
            </p>

            <div className="relative mt-6 flex w-full flex-col gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:justify-center">
              <Link
                to="/appointments"
                className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
              >
                <ArrowLeft
                  size={16}
                  className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
                />

                Back to Appointments
              </Link>

              <button
                type="button"
                onClick={() =>
                  loadAppointment(true)
                }
                disabled={refreshing}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin text-[#5E52B7]"
                      : ""
                  }
                />

                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /*
   * Backend Appointment:
   *
   * customer -> populated Customer
   * service  -> string
   * date     -> Date
   * time     -> String
   * status   -> status value
   */

  const customer =
    typeof appointment.customer ===
      "object" &&
    appointment.customer !== null
      ? appointment.customer
      : null;

  const customerName =
    customer?.name ||
    (typeof appointment.customer ===
    "string"
      ? appointment.customer
      : "");

  const customerEmail =
    customer?.email || "";

  const customerPhone =
    customer?.phone || "";

  const customerAddress =
    getCustomerAddress(customer);

  const serviceName =
    typeof appointment.service ===
    "object"
      ? appointment.service?.name
      : appointment.service;

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 transition-all duration-300 sm:px-4 sm:pt-4 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="animate-[fadeIn_.4s_ease-out_both]">
          <Link
            to="/appointments"
            className="group inline-flex min-h-[40px] items-center gap-2 text-sm font-bold text-[#6E687A] transition-all duration-300 hover:-translate-x-0.5 hover:text-[#5E52B7]"
          >
            <ArrowLeft
              size={16}
              className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
            />

            <span>
              Back to Appointments
            </span>
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:mt-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:px-3.5 sm:text-[11px]">
                <Sparkles
                  size={12}
                  className="shrink-0 animate-pulse sm:h-[13px] sm:w-[13px]"
                />

                Appointment
              </div>

              <h1 className="text-[26px] font-black tracking-[-0.035em] text-[#17151F] sm:text-[30px] md:text-[34px] lg:text-[36px]">
                Appointment Details
              </h1>

              <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
                View appointment information
                and schedule details.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <button
                type="button"
                onClick={() =>
                  loadAppointment(true)
                }
                disabled={refreshing}
                title="Refresh appointment"
                className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-2xl border border-purple-200/80 bg-white px-4 py-3 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[112px]"
              >
                <RefreshCw
                  size={16}
                  className={`shrink-0 transition-transform duration-500 ${
                    refreshing
                      ? "animate-spin text-[#5E52B7]"
                      : "group-hover:rotate-90"
                  }`}
                />

                <span>
                  Refresh
                </span>
              </button>

              <div className="flex justify-center sm:justify-start">
                <StatusBadge
                  status={
                    appointment.status
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-3">

          {/* ===================================================
              LEFT / MAIN
          =================================================== */}

          <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-2">

            {/* Appointment Information */}

            <div className="group animate-[slideUp_.45s_ease-out_both] min-w-0 overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

              <div className="relative overflow-hidden border-b border-purple-50 px-5 py-5 sm:px-7 sm:py-6 md:px-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />

                <div className="relative flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <CalendarDays
                      size={18}
                      className="sm:h-5 sm:w-5"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-[#24212C] sm:text-[17px]">
                      Appointment Information
                    </h2>

                    <p className="mt-0.5 text-[11px] font-medium text-[#8C8697] sm:text-xs">
                      Details about this appointment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:gap-y-7 sm:p-7 md:p-8">

                <InfoItem
                  icon={UserRound}
                  label="Customer"
                  value={
                    customerName
                  }
                />

                <InfoItem
                  icon={Briefcase}
                  label="Service"
                  value={
                    serviceName
                  }
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Date"
                  value={formatDisplayDate(
                    appointment.date,
                  )}
                />

                <InfoItem
                  icon={Clock}
                  label="Time"
                  value={
                    appointment.time
                  }
                />

                <InfoItem
                  icon={CircleCheck}
                  label="Status"
                  value={
                    appointment.status
                  }
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDisplayDate(
                    appointment.createdAt,
                  )}
                />
              </div>
            </div>

            {/* Notes */}

            <div className="group animate-[slideUp_.5s_ease-out_both] min-w-0 overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

              <div className="border-b border-purple-50 px-5 py-5 sm:px-7 sm:py-6 md:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <FileText
                      size={18}
                      className="sm:h-5 sm:w-5"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-black text-[#24212C] sm:text-[17px]">
                      Notes
                    </h2>

                    <p className="mt-0.5 text-[11px] font-medium text-[#8C8697] sm:text-xs">
                      Additional appointment information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7 md:p-8">
                {appointment.notes ? (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 sm:p-5">
                    <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-[#6E687A]">
                      {appointment.notes}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 px-4 py-6 text-center sm:px-5">
                    <p className="text-xs font-medium leading-5 text-[#8C8697] sm:text-sm">
                      No notes available for
                      this appointment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===================================================
              CUSTOMER CARD
          =================================================== */}

          <div className="min-w-0 animate-[slideUp_.55s_ease-out_both]">
            <div className="group min-w-0 overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

              <div className="relative overflow-hidden border-b border-purple-50 px-5 py-5 sm:px-7 sm:py-6">
                <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-purple-200/40 blur-3xl" />

                <div className="relative min-w-0">
                  <h2 className="text-base font-black text-[#24212C] sm:text-[17px]">
                    Customer
                  </h2>

                  <p className="mt-0.5 break-words text-[11px] font-medium leading-5 text-[#8C8697] sm:text-xs">
                    Customer connected to this
                    appointment.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-7">

                {/* Customer identity */}

                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-sm font-black text-[#5E52B7] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md sm:h-12 sm:w-12 sm:rounded-2xl">
                    {getInitials(
                      customerName,
                    )}

                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#33303A]">
                      {customerName ||
                        "—"}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-[#8C8697] sm:text-xs">
                      Customer
                    </p>
                  </div>
                </div>

                {/* Customer details */}

                <div className="mt-6 space-y-3 sm:mt-7 sm:space-y-4">

                  <DetailLine
                    icon={Mail}
                    label="Email"
                    value={
                      customerEmail
                    }
                  />

                  <DetailLine
                    icon={Phone}
                    label="Phone"
                    value={
                      customerPhone
                    }
                  />

                  {customerAddress && (
                    <DetailLine
                      icon={UserRound}
                      label="Address"
                      value={
                        customerAddress
                      }
                    />
                  )}
                </div>

                {/* Customer link */}

                {customer?._id && (
                  <Link
                    to={`/customers/${customer._id}`}
                    className="group/btn mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-purple-50/50 px-4 py-3 text-xs font-bold text-[#5E52B7] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-[#5E52B7] hover:text-white hover:shadow-sm sm:mt-7"
                  >
                    View Customer

                    <ArrowLeft
                      size={14}
                      className="rotate-180 transition-transform duration-300 group-hover/btn:translate-x-1"
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }

          to {
            opacity: 1;
            transform: scale(1);
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

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="group/item flex min-w-0 items-start gap-3 sm:gap-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-[#5E52B7] shadow-sm transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-[#5E52B7] group-hover/item:text-white sm:h-10 sm:w-10 sm:rounded-2xl">
        <Icon
          size={16}
          className="sm:h-[18px] sm:w-[18px]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:text-[11px]">
          {label}
        </p>

        <p className="mt-1.5 break-words text-sm font-bold leading-6 text-[#33303A]">
          {formatDisplayValue(value) ||
            "—"}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   DETAIL LINE
========================================================= */

const DetailLine = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-transparent p-2.5 transition-all duration-300 hover:border-purple-200/80 hover:bg-purple-50/50 sm:p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-[#5E52B7] sm:h-9 sm:w-9">
        <Icon
          size={15}
          className="sm:h-4 sm:w-4"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:text-[11px]">
          {label}
        </p>

        <p className="mt-1 break-words text-xs font-medium leading-5 text-[#55515F] sm:text-sm">
          {formatDisplayValue(value) ||
            "—"}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  status,
}) => {
  const normalizedStatus =
    String(status || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  const statusClasses = {
    scheduled:
      "border-blue-200 bg-blue-50 text-blue-800",

    pending:
      "border-amber-200 bg-amber-50 text-amber-800",

    confirmed:
      "border-emerald-200 bg-emerald-50 text-emerald-800",

    completed:
      "border-purple-200 bg-purple-50 text-[#5E52B7]",

    cancelled:
      "border-red-200 bg-red-50 text-red-700",

    no_show:
      "border-orange-200 bg-orange-50 text-orange-800",
  };

  const statusLabels = {
    scheduled: "Scheduled",
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };

  return (
    <span
      className={`inline-flex min-h-[34px] w-fit items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm transition-all duration-300 sm:min-h-[36px] sm:px-3.5 sm:text-[11px] ${
        statusClasses[
          normalizedStatus
        ] ||
        "border-purple-200 bg-purple-50 text-[#5E52B7]"
      }`}
    >
      {statusLabels[
        normalizedStatus
      ] ||
        formatDisplayValue(
          status,
        ) ||
        "—"}
    </span>
  );
};

/* =========================================================
   LOADING
========================================================= */

const DetailsLoading = () => {
  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-4 sm:pt-4 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* Back */}

        <div className="h-5 w-40 animate-pulse rounded-lg bg-purple-100/80" />

        {/* Header */}

        <div className="mt-5 space-y-3 sm:mt-6">
          <div className="h-6 w-28 animate-pulse rounded-lg bg-purple-100/80" />

          <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-purple-100/80 sm:h-9 sm:w-64" />

          <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-purple-50" />
        </div>

        {/* Content */}

        <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-2">
            <LoadingCard rows={6} />

            <LoadingCard rows={2} />
          </div>

          <LoadingCard rows={3} />
        </div>
      </div>
    </section>
  );
};

const LoadingCard = ({
  rows = 4,
}) => {
  return (
    <div className="min-w-0 rounded-[22px] border border-purple-200/60 bg-white p-5 shadow-[0_10px_35px_rgba(94,82,183,0.04)] sm:rounded-[24px] sm:p-7">
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-purple-100/80 sm:h-11 sm:w-11 sm:rounded-2xl" />

        <div className="min-w-0 space-y-2">
          <div className="h-4 w-36 max-w-full animate-pulse rounded-md bg-purple-100/80 sm:w-40" />

          <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50 sm:w-28" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-7 sm:grid-cols-2">
        {Array.from({
          length: Math.min(
            rows,
            6,
          ),
        }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 gap-3.5"
          >
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-purple-50 sm:h-10 sm:w-10 sm:rounded-2xl" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded-md bg-purple-50" />

              <div className="h-3.5 w-28 max-w-full animate-pulse rounded-md bg-purple-100/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const formatDisplayValue = (
  value,
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    return String(value);
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) =>
        formatDisplayValue(
          item,
        ),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (
    typeof value ===
    "object"
  ) {
    if (value.formatted) {
      return String(
        value.formatted,
      );
    }

    if (value.display) {
      return String(
        value.display,
      );
    }

    if (value.label) {
      return String(
        value.label,
      );
    }

    if (value.name) {
      return String(
        value.name,
      );
    }

    if (
      value.value !==
      undefined
    ) {
      return formatDisplayValue(
        value.value,
      );
    }

    const parts = [
      value.street,
      value.city,
      value.state,
      value.zipCode,
      value.country,
    ]
      .filter(
        (part) =>
          part !==
            null &&
          part !==
            undefined &&
          String(
            part,
          ).trim() !== "",
      )
      .map((part) =>
        String(part),
      );

    return parts.join(
      ", ",
    );
  }

  return String(value);
};

const getInitials = (
  name,
) => {
  if (!name) {
    return "?";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word[0],
    )
    .join("")
    .toUpperCase();
};

const getCustomerAddress = (
  customer,
) => {
  if (!customer?.address) {
    return "";
  }

  if (
    typeof customer.address ===
    "string"
  ) {
    return customer.address;
  }

  if (
    typeof customer.address ===
    "object"
  ) {
    if (
      customer.address.formatted
    ) {
      return String(
        customer.address.formatted,
      );
    }

    const parts = [
      customer.address.street,
      customer.address.city,
      customer.address.state,
      customer.address.zipCode,
      customer.address.country,
    ]
      .filter(
        (part) =>
          part !==
            null &&
          part !==
            undefined &&
          String(
            part,
          ).trim() !== "",
      )
      .map((part) =>
        String(part),
      );

    return parts.join(
      ", ",
    );
  }

  return String(
    customer.address,
  );
};

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
    return formatDisplayValue(
      date,
    );
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

export default AppointmentDetails;