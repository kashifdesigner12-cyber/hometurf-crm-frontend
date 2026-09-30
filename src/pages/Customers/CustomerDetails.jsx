import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Edit,
  Briefcase,
  LoaderCircle,
  UserRound,
  CreditCard,
  ShoppingBag,
  RefreshCw,
  Sparkles,
  Clock3,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

/* =========================================================
   API CONFIG
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://apihometurf.localpro1.net/api";

/* =========================================================
   AUTH TOKEN
========================================================= */

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

/* =========================================================
   CLEAR AUTH
========================================================= */

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");

  window.location.href = "/login";
};

/* =========================================================
   API REQUEST
========================================================= */

const apiRequest = async (
  endpoint,
  options = {}
) => {
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

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (response.status === 401) {
    clearAuthAndRedirect();

    throw new Error(
      result?.message ||
        "Your session has expired."
    );
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        "Something went wrong."
    );
  }

  return result;
};

/* =========================================================
   GET CUSTOMER
========================================================= */

const getCustomerDetails = async (id) => {
  const result = await apiRequest(
    `/customers/${id}`
  );

  return (
    result?.data ||
    result?.customer ||
    null
  );
};

/* =========================================================
   GET APPOINTMENTS
========================================================= */

const getAppointments = async () => {
  const result = await apiRequest(
    "/appointments"
  );

  return Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.appointments)
      ? result.appointments
      : [];
};

/* =========================================================
   PAGE
========================================================= */

const CustomerDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [customer, setCustomer] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [appointmentsLoading, setAppointmentsLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [statusUpdating, setStatusUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD CUSTOMER
  ======================================================= */

  const loadCustomer = async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const data =
        await getCustomerDetails(id);

      if (!data) {
        throw new Error(
          "Customer details were not found."
        );
      }

      setCustomer(data);
    } catch (err) {
      console.error(
        "Customer details error:",
        err
      );

      setCustomer(null);

      setError(
        err?.message ||
          "Unable to load customer details."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD APPOINTMENTS
  ======================================================= */

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);

      const data =
        await getAppointments();

      setAppointments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Appointments error:",
        err
      );

      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadCustomer();
    loadAppointments();
  }, [id]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadCustomer(),
        loadAppointments(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     TOGGLE STATUS
  ======================================================= */

  const handleToggleStatus = async () => {
    if (!customer?._id && !customer?.id) {
      return;
    }

    try {
      setStatusUpdating(true);

      const customerId =
        customer?._id ||
        customer?.id ||
        id;

      const currentStatus =
        normalizeBooleanStatus(
          customer?.isActive ??
            customer?.active ??
            customer?.status
        );

      const nextStatus =
        !currentStatus;

      const result = await apiRequest(
        `/customers/${customerId}`,
        {
          method: "PUT",

          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      const updatedCustomer =
        result?.data ||
        result?.customer;

      if (updatedCustomer) {
        setCustomer(updatedCustomer);
      } else {
        setCustomer((previous) => ({
          ...previous,
          isActive: nextStatus,
        }));
      }
    } catch (err) {
      console.error(
        "Customer status update error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update customer status."
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  /* =======================================================
     CUSTOMER APPOINTMENTS
  ======================================================= */

  const customerAppointments =
    useMemo(() => {
      if (!customer) {
        return [];
      }

      const customerId =
        customer?._id ||
        customer?.id ||
        id;

      return appointments
        .filter((appointment) => {
          return (
            getRelatedCustomerId(
              appointment
            ) === String(customerId)
          );
        })
        .sort((a, b) => {
          const dateA =
            getAppointmentDate(a);

          const dateB =
            getAppointmentDate(b);

          return (
            new Date(dateB || 0) -
            new Date(dateA || 0)
          );
        });
    }, [
      appointments,
      customer,
      id,
    ]);

  /* =======================================================
     APPOINTMENT STATS
  ======================================================= */

  const appointmentStats =
    useMemo(() => {
      const total =
        customerAppointments.length;

      const completed =
        customerAppointments.filter(
          (appointment) =>
            normalizeStatus(
              appointment?.status
            ) === "completed"
        ).length;

      const cancelled =
        customerAppointments.filter(
          (appointment) =>
            normalizeStatus(
              appointment?.status
            ) === "cancelled"
        ).length;

      const upcoming =
        customerAppointments.filter(
          (appointment) => {
            const status =
              normalizeStatus(
                appointment?.status
              );

            if (
              status === "completed" ||
              status === "cancelled"
            ) {
              return false;
            }

            const date =
              getAppointmentDate(
                appointment
              );

            if (!date) {
              return true;
            }

            const parsed =
              new Date(date);

            return (
              !Number.isNaN(
                parsed.getTime()
              ) &&
              parsed >= new Date()
            );
          }
        ).length;

      return {
        total,
        completed,
        cancelled,
        upcoming,
      };
    }, [customerAppointments]);

  /* =======================================================
     CUSTOMER VALUES
  ======================================================= */

  const customerName =
    customer?.name ||
    customer?.fullName ||
    customer?.customerName ||
    "Unnamed Customer";

  const customerEmail =
    customer?.email || "";

  const customerPhone =
    customer?.phone ||
    customer?.mobile ||
    customer?.phoneNumber ||
    "";

  const customerSource =
    customer?.source ||
    customer?.leadSource ||
    "Manual";

  const customerType =
    formatCustomerType(
      customer?.customerType ||
        customer?.type
    );

  const customerNotes =
    customer?.notes ||
    "No notes have been added for this customer yet.";

  const customerAddress =
    formatAddress(
      customer?.address
    );

  const customerCreatedDate =
    formatDate(
      customer?.createdAt
    );

  const customerCreatedDateTime =
    formatDateTime(
      customer?.createdAt
    );

  const customerId =
    customer?._id ||
    customer?.id ||
    id;

  const isActive =
    normalizeBooleanStatus(
      customer?.isActive ??
        customer?.active ??
        customer?.status
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DetailsLoading />
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !customer) {
    return (
      <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-4 md:px-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-xl rounded-[24px] border border-purple-200/70 bg-white p-6 text-center shadow-[0_10px_35px_rgba(94,82,183,0.05)] sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <UserRound size={28} />
              </div>

              <h2 className="mt-5 text-xl font-black text-[#24212C]">
                Unable to load customer
              </h2>

              <p className="mx-auto mt-2 max-w-md break-words text-sm font-medium leading-6 text-[#8C8697]">
                {error}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Try Again
                </button>

                <Link
                  to="/customers"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition hover:bg-purple-50 hover:text-[#5E52B7] sm:w-auto"
                >
                  <ArrowLeft size={16} />

                  Back to Customers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 transition-all duration-300 sm:px-4 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to="/customers"
              className="group mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-200/80 bg-white text-[#77737E] shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] sm:h-11 sm:w-11"
              title="Back to customers"
            >
              <ArrowLeft
                size={18}
              />
            </Link>

            <div className="min-w-0">
              <div className="mb-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:text-[11px]">
                <Sparkles
                  size={11}
                />

                Customer Profile
              </div>

              <h1 className="text-2xl font-black tracking-[-0.035em] text-[#17151F] sm:text-[30px] md:text-[34px]">
                Customer Details
              </h1>

              <p className="mt-1 text-xs font-medium text-[#6E687A] sm:text-sm">
                View complete customer information and history.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-4 py-3 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/customers"
                )
              }
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
            >
              <Edit size={16} />

              Edit Customer
            </button>
          </div>
        </div>

        {/* ===================================================
            ERROR NOTICE
        =================================================== */}

        {error && customer && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ===================================================
            CUSTOMER SUMMARY
        =================================================== */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* CUSTOMER INFORMATION */}

          <div className="min-w-0 overflow-hidden rounded-[24px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] lg:col-span-2">

            {/* PROFILE HEADER */}

            <div className="relative overflow-hidden border-b border-purple-50 px-4 py-5 sm:px-6 sm:py-6 md:px-7">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-lg font-black text-[#5E52B7] shadow-sm sm:h-16 sm:w-16 sm:text-xl">
                    {getInitials(
                      customerName
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black tracking-[-0.025em] text-[#24212C] sm:text-xl">
                      {customerName}
                    </h2>

                    <p className="mt-1 break-all text-[11px] font-medium text-[#8C8697] sm:text-xs">
                      Customer ID: #
                      {customerId || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge
                    status={isActive}
                    active={isActive}
                  />

                  <button
                    type="button"
                    onClick={
                      handleToggleStatus
                    }
                    disabled={
                      statusUpdating
                    }
                    className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-200/80 bg-white px-3 py-2 text-xs font-bold text-[#55515F] transition hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {statusUpdating ? (
                      <LoaderCircle
                        size={14}
                        className="animate-spin"
                      />
                    ) : null}

                    {isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>
              </div>
            </div>

            {/* INFORMATION */}

            <div className="grid grid-cols-1 gap-x-8 gap-y-7 px-4 py-6 sm:grid-cols-2 sm:px-6 sm:py-7 md:px-7">

              <InfoItem
                icon={Mail}
                label="Email"
                value={
                  customerEmail ||
                  "—"
                }
                href={
                  customerEmail
                    ? `mailto:${customerEmail}`
                    : undefined
                }
              />

              <InfoItem
                icon={Phone}
                label="Phone"
                value={
                  customerPhone ||
                  "—"
                }
                href={
                  customerPhone
                    ? `tel:${customerPhone}`
                    : undefined
                }
              />

              <InfoItem
                icon={Briefcase}
                label="Customer Type"
                value={
                  customerType
                }
              />

              <InfoItem
                icon={ShoppingBag}
                label="Source"
                value={
                  customerSource
                }
              />

              <div className="min-w-0 sm:col-span-2">
                <InfoItem
                  icon={MapPin}
                  label="Address"
                  value={
                    customerAddress ||
                    "Not provided"
                  }
                />
              </div>

              <InfoItem
                icon={CalendarDays}
                label="Created At"
                value={
                  customerCreatedDate ||
                  "—"
                }
              />

              <InfoItem
                icon={CreditCard}
                label="Customer Status"
                value={
                  isActive
                    ? "Active"
                    : "Inactive"
                }
              />
            </div>
          </div>

          {/* NOTES */}

          <div className="min-w-0 overflow-hidden rounded-[24px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)]">

            <div className="border-b border-purple-50 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100/80 text-[#5E52B7] shadow-sm">
                  <FileIcon />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[17px] font-black text-[#24212C]">
                    Notes
                  </h2>

                  <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                    Customer information
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-7">
              <p className="break-words text-sm font-medium leading-7 text-[#6E687A]">
                {customerNotes}
              </p>

              {customerCreatedDateTime && (
                <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <Clock3
                      size={16}
                      className="mt-0.5 shrink-0 text-[#5E52B7]"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                        Customer Since
                      </p>

                      <p className="mt-1 break-words text-sm font-bold text-[#33303A]">
                        {customerCreatedDateTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================
            QUICK STATS
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <MiniStat
            icon={CalendarDays}
            label="Total Appointments"
            value={
              appointmentStats.total
            }
          />

          <MiniStat
            icon={Clock3}
            label="Upcoming"
            value={
              appointmentStats.upcoming
            }
          />

          <MiniStat
            icon={UserRound}
            label="Completed"
            value={
              appointmentStats.completed
            }
          />

          <MiniStat
            icon={CreditCard}
            label="Cancelled"
            value={
              appointmentStats.cancelled
            }
          />
        </div>

        {/* ===================================================
            APPOINTMENT HISTORY
        =================================================== */}

        <div className="min-w-0 overflow-hidden rounded-[24px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)]">

          <div className="flex flex-col gap-3 border-b border-purple-50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 md:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600 shadow-sm">
                <CalendarDays
                  size={18}
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-black text-[#24212C]">
                  Appointment History
                </h2>

                <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                  Customer appointments
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-extrabold text-[#5E52B7]">
              {appointmentStats.total}{" "}
              {appointmentStats.total ===
              1
                ? "Appointment"
                : "Appointments"}
            </span>
          </div>

          {appointmentsLoading ? (
            <AppointmentLoading />
          ) : customerAppointments.length ===
            0 ? (
            <EmptyAppointments />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-purple-50 bg-purple-50/40">
                    <th className="px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:px-6 md:px-7">
                      Service
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Date
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Time
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:px-6 md:px-7">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customerAppointments.map(
                    (
                      appointment,
                      index
                    ) => (
                      <tr
                        key={
                          appointment?._id ||
                          appointment?.id ||
                          index
                        }
                        className="border-b border-purple-50 transition-colors last:border-0 hover:bg-[#FCFBFF]"
                      >
                        <td className="px-5 py-4 sm:px-6 md:px-7">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7]">
                              <Briefcase
                                size={16}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-bold text-[#33303A]">
                                {getServiceName(
                                  appointment
                                )}
                              </p>

                              {getAppointmentLocation(
                                appointment
                              ) && (
                                <p className="mt-1 max-w-[220px] truncate text-[11px] font-medium text-[#8C8697]">
                                  {getAppointmentLocation(
                                    appointment
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#55515F]">
                          {formatAppointmentDate(
                            appointment
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#55515F]">
                          {getAppointmentTime(
                            appointment
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <AppointmentStatus
                            status={
                              appointment?.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap text-sm font-black text-[#33303A] sm:px-6 md:px-7">
                          {formatAmount(
                            appointment?.amount ??
                              appointment?.price ??
                              appointment?.total
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===================================================
            ACTIVITY
        =================================================== */}

        <div className="min-w-0 overflow-hidden rounded-[24px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)]">

          <div className="flex items-center gap-3 border-b border-purple-50 px-5 py-5 sm:px-6 sm:py-6 md:px-7">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600 shadow-sm">
              <Clock3 size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[17px] font-black text-[#24212C]">
                Activity
              </h2>

              <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                Customer timeline
              </p>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6 sm:py-7 md:px-7">
            <div className="relative">

              <div className="absolute bottom-4 left-[7px] top-4 w-px bg-purple-200/60" />

              <div className="relative flex gap-4">
                <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-[#5E52B7] shadow-[0_0_0_2px_rgba(94,82,183,0.2)]" />

                <div className="min-w-0 pb-7">
                  <p className="text-sm font-extrabold text-[#33303A]">
                    Customer created
                  </p>

                  <p className="mt-1 break-words text-sm font-medium leading-6 text-[#6E687A]">
                    Customer profile was added to the CRM.
                  </p>

                  {customerCreatedDateTime && (
                    <p className="mt-2 text-[11px] font-semibold text-[#8C8697]">
                      {customerCreatedDateTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative flex gap-4">
                <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]" />

                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#33303A]">
                    Current status
                  </p>

                  <p className="mt-1 break-words text-sm font-medium leading-6 text-[#6E687A]">
                    Customer status is currently{" "}
                    <span className="font-bold text-[#5E52B7]">
                      {isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            BACK
        =================================================== */}

        <div className="flex justify-center pt-1">
          <Link
            to="/customers"
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] hover:shadow-md"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />

            Back to Customers
          </Link>
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

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
  href,
}) => {
  /*
   * IMPORTANT:
   * Backend address can be an object:
   *
   * {
   *   street,
   *   city,
   *   state,
   *   zipCode,
   *   formatted
   * }
   *
   * Never render that object directly.
   */

  const displayValue =
    formatDisplayValue(value);

  const content = (
    <div className="group min-w-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:text-[11px]">
        {label}
      </p>

      <div className="mt-2.5 flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-[#5E52B7] group-hover:text-white">
          <Icon size={17} />
        </div>

        <p className="min-w-0 break-words pt-1 text-sm font-bold leading-6 text-[#33303A] transition-colors group-hover:text-[#5E52B7]">
          {displayValue || "—"}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      className="block min-w-0 transition-all duration-200 hover:-translate-y-0.5"
    >
      {content}
    </a>
  );
};

/* =========================================================
   MINI STAT
========================================================= */

const MiniStat = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="group min-w-0 rounded-[22px] border border-purple-200/70 bg-white p-5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)] sm:p-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100/80 text-[#5E52B7] transition-all duration-300 group-hover:scale-105">
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] sm:text-[11px]">
            {label}
          </p>

          <p className="mt-1 text-xl font-black text-[#33303A]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  status,
  active,
}) => {
  const isActive =
    typeof active === "boolean"
      ? active
      : normalizeBooleanStatus(
          status
        );

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm sm:px-3.5 sm:text-[11px] ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`mr-2 h-2 w-2 shrink-0 rounded-full ${
          isActive
            ? "bg-emerald-500"
            : "bg-red-500"
        }`}
      />

      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
};

/* =========================================================
   APPOINTMENT STATUS
========================================================= */

const AppointmentStatus = ({
  status,
}) => {
  const normalized =
    normalizeStatus(status);

  const styles = {
    pending:
      "border-yellow-200 bg-yellow-50 text-yellow-800",
    confirmed:
      "border-blue-200 bg-blue-50 text-blue-800",
    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    cancelled:
      "border-red-200 bg-red-50 text-red-700",
    canceled:
      "border-red-200 bg-red-50 text-red-700",
    in_progress:
      "border-purple-200 bg-purple-50 text-[#5E52B7]",
    booked:
      "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.04em] ${
        styles[normalized] ||
        "border-purple-200 bg-purple-50 text-[#5E52B7]"
      }`}
    >
      {formatStatus(
        status
      )}
    </span>
  );
};

/* =========================================================
   DETAILS LOADING
========================================================= */

const DetailsLoading = () => {
  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-4 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-purple-100" />

            <div className="space-y-2">
              <div className="h-7 w-40 animate-pulse rounded-lg bg-purple-100" />
              <div className="h-3 w-56 animate-pulse rounded bg-purple-50" />
            </div>
          </div>

          <div className="h-11 w-full animate-pulse rounded-2xl bg-purple-100 sm:w-32" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="animate-pulse rounded-[24px] border border-purple-200/60 bg-white p-6 lg:col-span-2">
            <div className="flex items-center gap-4 border-b border-purple-50 pb-6">
              <div className="h-16 w-16 rounded-2xl bg-purple-100" />

              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-purple-100" />
                <div className="h-3 w-52 rounded bg-purple-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-7 pt-7 sm:grid-cols-2">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div key={index}>
                  <div className="h-3 w-20 rounded bg-purple-50" />
                  <div className="mt-3 h-5 w-44 rounded bg-purple-100" />
                </div>
              ))}
            </div>
          </div>

          <div className="animate-pulse rounded-[24px] border border-purple-200/60 bg-white p-6">
            <div className="h-5 w-24 rounded bg-purple-100" />

            <div className="mt-6 space-y-4">
              <div className="h-3 w-full rounded bg-purple-50" />
              <div className="h-3 w-full rounded bg-purple-50" />
              <div className="h-3 w-3/4 rounded bg-purple-50" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[22px] bg-white"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-[24px] bg-white" />
      </div>
    </section>
  );
};

/* =========================================================
   APPOINTMENT LOADING
========================================================= */

const AppointmentLoading = () => {
  return (
    <div className="divide-y divide-purple-50">
      {Array.from({
        length: 4,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-5 py-5 sm:px-6 md:px-7"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-purple-100" />

          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-purple-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-purple-50" />
          </div>

          <div className="hidden h-5 w-20 animate-pulse rounded bg-purple-50 sm:block" />
        </div>
      ))}
    </div>
  );
};

/* =========================================================
   EMPTY APPOINTMENTS
========================================================= */

const EmptyAppointments = () => {
  return (
    <div className="px-5 py-14 text-center sm:px-6 md:px-7">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#5E52B7]">
        <CalendarDays size={24} />
      </div>

      <h3 className="mt-4 text-sm font-black text-[#33303A]">
        No appointments found
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-5 text-[#8C8697]">
        This customer does not have any appointments yet.
      </p>
    </div>
  );
};

/* =========================================================
   FILE ICON
========================================================= */

const FileIcon = () => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
};

/* =========================================================
   INITIALS
========================================================= */

const getInitials = (
  name
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
        word[0]
    )
    .join("")
    .toUpperCase();
};

/* =========================================================
   NORMALIZE STATUS
========================================================= */

const normalizeStatus = (
  status
) => {
  if (
    status === null ||
    status === undefined
  ) {
    return "";
  }

  if (
    typeof status ===
    "object"
  ) {
    return String(
      status?.name ||
        status?.status ||
        status?.value ||
        ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
};

/* =========================================================
   BOOLEAN STATUS
========================================================= */

const normalizeBooleanStatus = (
  value
) => {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  if (
    typeof value ===
    "object"
  ) {
    return normalizeBooleanStatus(
      value?.value ??
        value?.status ??
        value?.isActive
    );
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    [
      "inactive",
      "in_active",
      "disabled",
      "blocked",
      "false",
      "0",
      "deactivated",
    ].includes(
      normalized
    )
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   FORMAT STATUS
========================================================= */

const formatStatus = (
  status
) => {
  if (
    status === null ||
    status === undefined ||
    status === ""
  ) {
    return "Unknown";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

/* =========================================================
   FORMAT CUSTOMER TYPE
========================================================= */

const formatCustomerType = (
  type
) => {
  if (!type) {
    return "Customer";
  }

  if (
    typeof type ===
    "object"
  ) {
    return formatCustomerType(
      type?.name ||
        type?.type ||
        type?.value
    );
  }

  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

/* =========================================================
   FORMAT DISPLAY VALUE
========================================================= */

const formatDisplayValue = (
  value
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
          item
        )
      )
      .filter(Boolean)
      .join(", ");
  }

  if (
    typeof value ===
    "object"
  ) {
    if (
      value.formatted
    ) {
      return String(
        value.formatted
      );
    }

    if (
      value.display
    ) {
      return String(
        value.display
      );
    }

    if (
      value.label
    ) {
      return String(
        value.label
      );
    }

    if (
      value.name
    ) {
      return String(
        value.name
      );
    }

    if (
      value.value !==
      undefined
    ) {
      return formatDisplayValue(
        value.value
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
          part !== null &&
          part !== undefined &&
          String(part).trim() !==
            ""
      )
      .map((part) =>
        String(part)
      );

    if (parts.length) {
      return parts.join(", ");
    }

    return "";
  }

  return String(value);
};

/* =========================================================
   FORMAT ADDRESS
========================================================= */

const formatAddress = (
  address
) => {
  if (!address) {
    return "";
  }

  if (
    typeof address ===
    "string"
  ) {
    return address;
  }

  if (
    typeof address ===
    "object"
  ) {
    if (
      address.formatted
    ) {
      return String(
        address.formatted
      );
    }

    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ]
      .filter(
        (part) =>
          part !== null &&
          part !== undefined &&
          String(part).trim() !==
            ""
      )
      .map((part) =>
        String(part)
      );

    return parts.join(", ");
  }

  return String(address);
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (
  date
) => {
  if (!date) {
    return "";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

/* =========================================================
   FORMAT DATE TIME
========================================================= */

const formatDateTime = (
  date
) => {
  if (!date) {
    return "";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  return parsedDate.toLocaleString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

/* =========================================================
   FORMAT AMOUNT
========================================================= */

const formatAmount = (
  amount
) => {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "—";
  }

  if (
    typeof amount ===
    "object"
  ) {
    const objectAmount =
      amount?.amount ??
      amount?.value ??
      amount?.total;

    if (
      objectAmount ===
        null ||
      objectAmount ===
        undefined
    ) {
      return "—";
    }

    amount =
      objectAmount;
  }

  const numericAmount =
    Number(amount);

  if (
    Number.isNaN(
      numericAmount
    )
  ) {
    return String(amount);
  }

  return `PKR ${numericAmount.toLocaleString(
    "en-PK"
  )}`;
};

/* =========================================================
   RELATED CUSTOMER ID
========================================================= */

const getRelatedCustomerId = (
  appointment
) => {
  if (!appointment) {
    return "";
  }

  const possibleValues = [
    appointment?.customer,
    appointment?.customerId,
    appointment?.customer_id,
    appointment?.customer?._id,
    appointment?.customer?.id,
    appointment?.client,
    appointment?.clientId,
    appointment?.client?._id,
    appointment?.client?.id,
  ];

  for (
    const value of possibleValues
  ) {
    const resolved =
      resolveId(value);

    if (resolved) {
      return resolved;
    }
  }

  return "";
};

/* =========================================================
   RESOLVE ID
========================================================= */

const resolveId = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return String(value);
  }

  if (
    typeof value ===
    "object"
  ) {
    if (
      value.$oid
    ) {
      return String(
        value.$oid
      );
    }

    if (
      value._id
    ) {
      return resolveId(
        value._id
      );
    }

    if (
      value.id
    ) {
      return resolveId(
        value.id
      );
    }

    if (
      value.customerId
    ) {
      return resolveId(
        value.customerId
      );
    }

    if (
      value.customer_id
    ) {
      return resolveId(
        value.customer_id
      );
    }
  }

  return "";
};

/* =========================================================
   GET SERVICE NAME
========================================================= */

const getServiceName = (
  appointment
) => {
  const service =
    appointment?.service;

  if (
    typeof service ===
    "string"
  ) {
    return service;
  }

  if (
    typeof service ===
    "object"
  ) {
    return (
      service?.name ||
      service?.title ||
      service?.serviceName ||
      "Service"
    );
  }

  return (
    appointment?.serviceName ||
    appointment?.serviceTitle ||
    appointment?.title ||
    "Service"
  );
};

/* =========================================================
   GET APPOINTMENT DATE
========================================================= */

const getAppointmentDate = (
  appointment
) => {
  if (!appointment) {
    return "";
  }

  return (
    appointment?.date ||
    appointment?.appointmentDate ||
    appointment?.scheduledDate ||
    appointment?.startDate ||
    appointment?.startTime ||
    ""
  );
};

/* =========================================================
   FORMAT APPOINTMENT DATE
========================================================= */

const formatAppointmentDate = (
  appointment
) => {
  const date =
    getAppointmentDate(
      appointment
    );

  return date
    ? formatDate(date) ||
        "—"
    : "—";
};

/* =========================================================
   GET APPOINTMENT TIME
========================================================= */

const getAppointmentTime = (
  appointment
) => {
  if (!appointment) {
    return "—";
  }

  const time =
    appointment?.time ||
    appointment?.appointmentTime ||
    appointment?.scheduledTime ||
    appointment?.startTime;

  if (!time) {
    return "—";
  }

  if (
    typeof time ===
    "string"
  ) {
    return time;
  }

  if (
    typeof time ===
    "object"
  ) {
    return (
      time?.formatted ||
      time?.value ||
      "—"
    );
  }

  return String(time);
};

/* =========================================================
   GET APPOINTMENT LOCATION
========================================================= */

const getAppointmentLocation = (
  appointment
) => {
  if (!appointment) {
    return "";
  }

  return formatDisplayValue(
    appointment?.address ||
      appointment?.location ||
      appointment?.serviceLocation ||
      ""
  );
};

export default CustomerDetails;