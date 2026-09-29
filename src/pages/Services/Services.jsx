import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Briefcase,
  LoaderCircle,
  CalendarDays,
  UserRound,
  FileText,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "../../services/serviceApi";

import { getCustomers } from "../../services/customerApi";

const STATUS_OPTIONS = [
  "NEW",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const Services = () => {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] =
    useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [customerError, setCustomerError] =
    useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingService, setEditingService] =
    useState(null);

  const [formData, setFormData] = useState({
    customer: "",
    serviceName: "",
    description: "",
    status: "NEW",
    startDate: "",
    notes: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadInitialData = async () => {
    await Promise.all([
      loadServices(),
      loadCustomers(),
    ]);
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getServices();

      const result = Array.isArray(response)
        ? response
        : response?.data ||
          response?.services ||
          [];

      setServices(
        Array.isArray(result) ? result : [],
      );
    } catch (error) {
      console.error(
        "Services loading error:",
        error,
      );

      setServices([]);

      setError(
        error?.message ||
          "Unable to load services.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      setCustomerError("");

      const response = await getCustomers();

      const result = Array.isArray(response)
        ? response
        : response?.data ||
          response?.customers ||
          [];

      setCustomers(
        Array.isArray(result) ? result : [],
      );
    } catch (error) {
      console.error(
        "Customers loading error:",
        error,
      );

      setCustomers([]);

      setCustomerError(
        error?.message ||
          "Unable to load customers.",
      );
    } finally {
      setCustomersLoading(false);
    }
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    setError("");

    try {
      await Promise.all([
        loadServices(),
        loadCustomers(),
      ]);
    } catch (error) {
      console.error(
        "Refresh services error:",
        error,
      );
    }
  };

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredServices = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    return services.filter((service) => {
      const customerName =
        typeof service?.customer ===
        "object"
          ? service.customer?.name || ""
          : "";

      const serviceName =
        String(
          service?.serviceName || "",
        ).toLowerCase();

      const description =
        String(
          service?.description || "",
        ).toLowerCase();

      const notes =
        String(
          service?.notes || "",
        ).toLowerCase();

      const customerSearchName =
        String(
          customerName || "",
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        serviceName.includes(
          searchValue,
        ) ||
        description.includes(
          searchValue,
        ) ||
        notes.includes(
          searchValue,
        ) ||
        customerSearchName.includes(
          searchValue,
        );

      const matchesStatus =
        statusFilter === "All" ||
        String(
          service?.status || "",
        ).toUpperCase() ===
          statusFilter.toUpperCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    services,
    search,
    statusFilter,
  ]);

  /* =========================================================
     MODAL
  ========================================================= */

  const openCreateModal = () => {
    setEditingService(null);

    setFormData({
      customer: "",
      serviceName: "",
      description: "",
      status: "NEW",
      startDate: getTodayDate(),
      notes: "",
    });

    setError("");
    setCustomerError("");
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);

    setFormData({
      customer:
        typeof service?.customer ===
        "object"
          ? service.customer?._id || ""
          : service?.customer || "",

      serviceName:
        service?.serviceName || "",

      description:
        service?.description || "",

      status:
        service?.status || "NEW",

      startDate:
        formatDateForInput(
          service?.startDate,
        ),

      notes:
        service?.notes || "",
    });

    setError("");
    setCustomerError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingService(null);
  };

  /* =========================================================
     FORM
  ========================================================= */

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.customer) {
      setError(
        "Please select a customer.",
      );
      return;
    }

    if (
      !formData.serviceName.trim()
    ) {
      setError(
        "Please enter a service name.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const serviceData = {
        customer:
          formData.customer,

        serviceName:
          formData.serviceName.trim(),

        description:
          formData.description.trim(),

        status:
          formData.status,

        startDate:
          formData.startDate
            ? new Date(
                `${formData.startDate}T00:00:00`,
              ).toISOString()
            : null,

        notes:
          formData.notes.trim(),
      };

      if (editingService) {
        const response =
          await updateService(
            editingService._id,
            serviceData,
          );

        const updatedService =
          response?.data ||
          response?.service ||
          response;

        setServices((previous) =>
          previous.map(
            (service) =>
              service._id ===
              editingService._id
                ? updatedService
                : service,
          ),
        );
      } else {
        const response =
          await createService(
            serviceData,
          );

        const newService =
          response?.data ||
          response?.service ||
          response;

        if (newService) {
          setServices((previous) => [
            newService,
            ...previous,
          ]);
        }
      }

      setShowModal(false);
      setEditingService(null);

      await loadServices();
    } catch (error) {
      console.error(
        "Save service error:",
        error,
      );

      setError(
        error?.message ||
          "Unable to save service.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this service?",
      );

    if (!confirmed) return;

    try {
      setError("");

      await deleteService(id);

      setServices((previous) =>
        previous.filter(
          (service) =>
            service._id !== id,
        ),
      );
    } catch (error) {
      console.error(
        "Delete service error:",
        error,
      );

      setError(
        error?.message ||
          "Unable to delete service.",
      );
    }
  };

  return (
    <>
      <style>{`
        @keyframes serviceFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes serviceScaleIn {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .service-fade-in {
          animation:
            serviceFadeIn
            0.45s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .service-modal-animation {
          animation:
            serviceScaleIn
            0.28s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        @media (prefers-reduced-motion: reduce) {
          .service-fade-in,
          .service-modal-animation {
            animation: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 transition-all duration-300 sm:px-4 sm:px-6 sm:pt-4 md:px-6 lg:px-7 xl:px-8">

        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="service-fade-in flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:px-3.5 sm:py-1.5 sm:text-[11px]">
                <Sparkles
                  size={12}
                  className="shrink-0 sm:h-[13px] sm:w-[13px]"
                />

                CRM Services
              </div>

              <h1 className="text-[26px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[32px] md:text-[36px] lg:text-[38px]">
                Services
              </h1>

              <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
                Manage customer services and
                jobs from one central
                workspace.
              </p>

            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  loading ||
                  customersLoading
                }
                title="Refresh"
                className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-2xl border border-purple-200/80 bg-white px-4 py-3 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[112px]"
              >
                <RefreshCw
                  size={16}
                  className={`shrink-0 transition-transform duration-500 ${
                    loading ||
                    customersLoading
                      ? "animate-spin text-[#5E52B7]"
                      : "group-hover:rotate-90"
                  }`}
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto"
              >
                <Plus
                  size={17}
                  className="shrink-0 transition-transform duration-300 group-hover:rotate-90"
                />

                Add Service
              </button>

            </div>
          </div>

          {/* =====================================================
              ERROR
          ===================================================== */}

          {error && (
            <div className="service-fade-in flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700 shadow-sm sm:px-5 sm:py-4">

              <div className="mt-0.5 shrink-0">
                <X size={16} />
              </div>

              <p className="min-w-0 flex-1 break-words">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="shrink-0 rounded-lg p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-700"
              >
                <X size={16} />
              </button>

            </div>
          )}

          {/* =====================================================
              FILTERS
          ===================================================== */}

          <div className="service-fade-in rounded-[20px] border border-purple-200/70 bg-white p-4 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:rounded-[22px] sm:p-5">

            <div className="flex flex-col gap-3 md:flex-row">

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
                      event.target.value,
                    )
                  }
                  placeholder="Search services or customers..."
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-sm font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />

              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-4 text-sm font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 md:w-[210px] md:shrink-0"
              >
                <option value="All">
                  All Statuses
                </option>

                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(
                        status,
                      )}
                    </option>
                  ),
                )}
              </select>

            </div>
          </div>

          {/* =====================================================
              SERVICES CONTAINER
          ===================================================== */}

          <div className="service-fade-in overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

            {/* Header */}

            <div className="flex flex-col gap-4 border-b border-purple-50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 lg:px-8">

              <div className="min-w-0">
                <h2 className="text-base font-black text-[#24212C] sm:text-[17px]">
                  All Services
                </h2>

                <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                  {filteredServices.length} service
                  {filteredServices.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/50 px-3.5 py-2 sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                <span className="text-xs font-bold text-[#5E52B7]">
                  Service Management
                </span>
              </div>

            </div>

            {loading ? (
              <TableLoading />
            ) : filteredServices.length ===
              0 ? (
              <EmptyState
                search={search}
                onAdd={openCreateModal}
              />
            ) : (
              <>
                {/* Desktop / Tablet Table */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full min-w-[920px]">

                    <thead>
                      <tr className="border-b border-purple-50 bg-purple-50/40">

                        <th className="px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] lg:px-8">
                          Service
                        </th>

                        <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                          Customer
                        </th>

                        <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                          Start Date
                        </th>

                        <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] lg:px-8">
                          Actions
                        </th>

                      </tr>
                    </thead>

                    <tbody>
                      {filteredServices.map(
                        (
                          service,
                          index,
                        ) => (
                          <ServiceRow
                            key={
                              service?._id ||
                              index
                            }
                            service={
                              service
                            }
                            index={
                              index
                            }
                            onEdit={
                              openEditModal
                            }
                            onDelete={
                              handleDelete
                            }
                          />
                        ),
                      )}
                    </tbody>

                  </table>
                </div>

                {/* Mobile Cards */}

                <div className="block divide-y divide-purple-50 md:hidden">
                  {filteredServices.map(
                    (
                      service,
                      index,
                    ) => (
                      <MobileServiceCard
                        key={
                          service?._id ||
                          index
                        }
                        service={
                          service
                        }
                        index={
                          index
                        }
                        onEdit={
                          openEditModal
                        }
                        onDelete={
                          handleDelete
                        }
                      />
                    ),
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <ServiceModal
          editingService={
            editingService
          }
          customers={customers}
          customersLoading={
            customersLoading
          }
          customerError={
            customerError
          }
          formData={formData}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  );
};

/* ============================================================
   DESKTOP SERVICE ROW
============================================================ */

const ServiceRow = ({
  service,
  index,
  onEdit,
  onDelete,
}) => {
  const customer =
    typeof service?.customer ===
    "object"
      ? service.customer
      : null;

  const customerName =
    customer?.name || "—";

  const customerPhone =
    customer?.phone || "";

  return (
    <tr
      style={{
        animationDelay:
          `${index * 55}ms`,
      }}
      className="service-fade-in group border-b border-purple-50 transition-all duration-300 last:border-0 hover:bg-purple-50/50"
    >
      {/* Service */}

      <td className="px-5 py-5 lg:px-8">

        <div className="flex min-w-0 items-center gap-3">

          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md lg:h-11 lg:w-11 lg:rounded-2xl">

            <Briefcase
              size={17}
              className="lg:h-[18px] lg:w-[18px]"
            />

            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-emerald-500" />

          </div>

          <div className="min-w-0">

            <p className="max-w-[220px] truncate text-sm font-bold text-[#33303A] transition-colors group-hover:text-[#5E52B7] lg:max-w-[280px]">
              {service?.serviceName ||
                "—"}
            </p>

            {service?.description && (
              <p className="mt-1 max-w-[220px] truncate text-[11px] font-medium text-[#8C8697] lg:max-w-[280px]">
                {
                  service.description
                }
              </p>
            )}

          </div>

        </div>
      </td>

      {/* Customer */}

      <td className="px-4 py-5">

        <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-[#5E52B7] lg:h-9 lg:w-9">
            <UserRound
              size={15}
              className="lg:h-4 lg:w-4"
            />
          </div>

          <div className="min-w-0">

            <p className="max-w-[150px] truncate text-sm font-bold text-[#33303A] lg:max-w-[180px]">
              {customerName}
            </p>

            {customerPhone && (
              <p className="mt-0.5 max-w-[150px] truncate text-[11px] font-medium text-[#8C8697] lg:max-w-[180px]">
                {customerPhone}
              </p>
            )}

          </div>

        </div>
      </td>

      {/* Start Date */}

      <td className="px-4 py-5">

        <div className="flex items-center gap-2 text-sm font-medium text-[#6E687A]">

          <CalendarDays
            size={14}
            className="shrink-0 text-[#5E52B7]"
          />

          <span className="whitespace-nowrap">
            {service?.startDate
              ? formatDate(
                  service.startDate,
                )
              : "—"}
          </span>

        </div>
      </td>

      {/* Status */}

      <td className="px-4 py-5">
        <StatusBadge
          status={
            service?.status
          }
        />
      </td>

      {/* Actions */}

      <td className="px-5 py-5 lg:px-8">

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={() =>
              onEdit(service)
            }
            title="Edit service"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white hover:shadow-sm"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(
                service?._id,
              )
            }
            title="Delete service"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-all duration-300 hover:scale-110 hover:bg-red-500 hover:text-white hover:shadow-sm"
          >
            <Trash2 size={16} />
          </button>

        </div>
      </td>
    </tr>
  );
};

/* ============================================================
   MOBILE SERVICE CARD
============================================================ */

const MobileServiceCard = ({
  service,
  index,
  onEdit,
  onDelete,
}) => {
  const customer =
    typeof service?.customer ===
    "object"
      ? service.customer
      : null;

  const customerName =
    customer?.name || "—";

  const customerPhone =
    customer?.phone || "";

  return (
    <div
      style={{
        animationDelay:
          `${index * 55}ms`,
      }}
      className="service-fade-in p-4 transition-all duration-300 active:bg-purple-50/40"
    >
      <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-[0_5px_20px_rgba(94,82,183,0.035)]">

        {/* Top */}

        <div className="flex min-w-0 items-start justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7]">

              <Briefcase size={18} />

              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-emerald-500" />

            </div>

            <div className="min-w-0">

              <p className="break-words text-sm font-bold text-[#33303A]">
                {service?.serviceName ||
                  "—"}
              </p>

              {service?.description && (
                <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-5 text-[#8C8697]">
                  {
                    service.description
                  }
                </p>
              )}

            </div>

          </div>

          <StatusBadge
            status={
              service?.status
            }
          />

        </div>

        {/* Customer */}

        <div className="mt-4 rounded-xl bg-purple-50/50 p-3">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#5E52B7]">
              <UserRound size={16} />
            </div>

            <div className="min-w-0">

              <p className="truncate text-xs font-bold text-[#33303A]">
                {customerName}
              </p>

              {customerPhone && (
                <p className="mt-0.5 truncate text-[11px] font-medium text-[#8C8697]">
                  {customerPhone}
                </p>
              )}

            </div>

          </div>
        </div>

        {/* Date */}

        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#6E687A]">

          <CalendarDays
            size={15}
            className="shrink-0 text-[#5E52B7]"
          />

          <span>
            {service?.startDate
              ? formatDate(
                  service.startDate,
                )
              : "No start date"}
          </span>

        </div>

        {/* Actions */}

        <div className="mt-4 grid grid-cols-2 gap-2.5">

          <button
            type="button"
            onClick={() =>
              onEdit(service)
            }
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white active:scale-[0.98]"
          >
            <Pencil size={15} />
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(
                service?._id,
              )
            }
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-500 transition-all duration-300 hover:bg-red-500 hover:text-white active:scale-[0.98]"
          >
            <Trash2 size={15} />
            Delete
          </button>

        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SERVICE MODAL
============================================================ */

const ServiceModal = ({
  editingService,
  customers,
  customersLoading,
  customerError,
  formData,
  saving,
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
      <div className="service-modal-animation my-auto flex max-h-[96vh] w-full max-w-xl flex-col overflow-hidden rounded-[22px] border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:max-h-[92vh] sm:rounded-[26px]">

        {/* Header */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-purple-50 bg-white px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6">

          <div className="min-w-0">

            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:mb-2 sm:text-[11px]">
              <Briefcase
                size={12}
                className="sm:h-[13px] sm:w-[13px]"
              />

              Service
            </div>

            <h2 className="text-lg font-black text-[#17151F] sm:text-xl">
              {editingService
                ? "Edit Service"
                : "Add Service"}
            </h2>

            <p className="mt-1 max-w-[280px] text-[11px] font-medium leading-5 text-[#8C8697] sm:max-w-none sm:text-xs">
              {editingService
                ? "Update service information."
                : "Create a new customer service or job."}
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

        {/* Form */}

        <form
          onSubmit={onSubmit}
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-7"
        >

          <div className="space-y-4 sm:space-y-5">

            {/* Customer */}

            <div>

              <label className="mb-2 block text-xs font-bold text-[#55515F]">
                Customer
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <UserRound
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]"
                />

                <select
                  name="customer"
                  value={
                    formData.customer
                  }
                  onChange={onChange}
                  required
                  disabled={
                    customersLoading ||
                    saving
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-sm font-medium text-[#444444] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <option value="">
                    {customersLoading
                      ? "Loading customers..."
                      : "Select customer"}
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer?._id
                        }
                        value={
                          customer?._id
                        }
                      >
                        {customer?.name ||
                          "Unnamed Customer"}
                        {customer?.phone
                          ? ` — ${customer.phone}`
                          : ""}
                      </option>
                    ),
                  )}

                </select>

              </div>

              {customerError && (
                <p className="mt-2 break-words text-xs font-semibold text-red-600">
                  {customerError}
                </p>
              )}

              {!customersLoading &&
                !customerError &&
                customers.length ===
                  0 && (
                  <p className="mt-2 break-words text-xs font-semibold text-amber-600">
                    No customers found.
                    Create a customer
                    first.
                  </p>
                )}

            </div>

            {/* Service Name */}

            <FormField
              label="Service Name"
              name="serviceName"
              value={
                formData.serviceName
              }
              onChange={onChange}
              placeholder="Enter service name"
              required
            />

            {/* Description */}

            <div>

              <label className="mb-2 block text-xs font-bold text-[#55515F]">
                Description
              </label>

              <div className="relative">

                <FileText
                  size={16}
                  className="absolute left-3.5 top-3.5 text-[#8C8697]"
                />

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={onChange}
                  placeholder="Describe the service..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 py-3 pl-10 text-sm font-medium text-[#444444] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
                />

              </div>

            </div>

            {/* Status + Start Date */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

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
                  disabled={saving}
                  className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:opacity-60"
                >

                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(
                          status,
                        )}
                      </option>
                    ),
                  )}

                </select>

              </div>

              <FormField
                label="Start Date"
                name="startDate"
                type="date"
                value={
                  formData.startDate
                }
                onChange={onChange}
              />

            </div>

            {/* Notes */}

            <div>

              <label className="mb-2 block text-xs font-bold text-[#55515F]">
                Notes
              </label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={onChange}
                placeholder="Add internal notes..."
                rows={3}
                className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 py-3 text-sm font-medium text-[#444444] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
              />

            </div>

          </div>

          {/* Footer */}

          <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-purple-50 pt-4 sm:flex-row sm:justify-end sm:gap-3 sm:pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-[44px] w-full rounded-xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition-all duration-200 hover:bg-purple-50 hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                customersLoading ||
                customers.length === 0
              }
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[145px] sm:w-auto"
            >

              {saving && (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Saving..."
                : editingService
                  ? "Update Service"
                  : "Create Service"}

            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

/* ============================================================
   FORM FIELD
============================================================ */

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
    <div>

      <label className="mb-2 block text-xs font-bold text-[#55515F]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
      />

    </div>
  );
};

/* ============================================================
   STATUS BADGE
============================================================ */

const StatusBadge = ({
  status,
}) => {
  const normalizedStatus =
    String(status || "")
      .trim()
      .toUpperCase();

  const statusClasses = {
    NEW:
      "border-blue-200 bg-blue-50 text-blue-800",

    SCHEDULED:
      "border-purple-200 bg-purple-50 text-[#5E52B7]",

    IN_PROGRESS:
      "border-amber-200 bg-amber-50 text-amber-800",

    COMPLETED:
      "border-emerald-200 bg-emerald-50 text-emerald-800",

    CANCELLED:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex min-h-[30px] w-fit items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.04em] shadow-sm transition-all duration-200 sm:text-[11px] ${
        statusClasses[
          normalizedStatus
        ] ||
        "border-purple-200 bg-purple-50 text-[#5E52B7]"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
};

/* ============================================================
   LOADING
============================================================ */

const TableLoading = () => {
  return (
    <>
      {/* Desktop / Tablet */}

      <div className="hidden divide-y divide-purple-50 md:block">

        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-5 py-5 lg:px-8"
          >

            <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-purple-100/80" />

            <div className="min-w-0 flex-1 space-y-2.5">

              <div className="h-3.5 w-36 animate-pulse rounded-md bg-purple-100/80" />

              <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50" />

            </div>

            <div className="hidden h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80 lg:block" />

            <div className="hidden h-6 w-20 animate-pulse rounded-full bg-purple-100/80 sm:block" />

            <div className="h-9 w-20 animate-pulse rounded-xl bg-purple-100/80" />

          </div>
        ))}

      </div>

      {/* Mobile */}

      <div className="divide-y divide-purple-50 md:hidden">

        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="p-4"
          >

            <div className="rounded-2xl border border-purple-100 p-4">

              <div className="flex items-center gap-3">

                <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-purple-100/80" />

                <div className="flex-1 space-y-2">

                  <div className="h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80" />

                  <div className="h-3 w-20 animate-pulse rounded-md bg-purple-50" />

                </div>

                <div className="h-6 w-20 animate-pulse rounded-full bg-purple-100/80" />

              </div>

              <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-purple-50" />

              <div className="mt-3 h-4 w-28 animate-pulse rounded-md bg-purple-100/80" />

              <div className="mt-4 grid grid-cols-2 gap-2">

                <div className="h-10 animate-pulse rounded-xl bg-purple-100/80" />

                <div className="h-10 animate-pulse rounded-xl bg-purple-100/80" />

              </div>

            </div>

          </div>
        ))}

      </div>
    </>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({
  search,
  onAdd,
}) => {
  const hasSearch =
    Boolean(search.trim());

  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[380px] sm:px-6">

      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">

        <Briefcase
          size={24}
          className="sm:h-7 sm:w-7"
        />

      </div>

      <h3 className="mt-5 text-base font-black text-[#33303A] sm:mt-6">
        {hasSearch
          ? "No services found"
          : "No services yet"}
      </h3>

      <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697] sm:text-sm">
        {hasSearch
          ? "Try changing your search or status filter."
          : "Start adding customer services to manage your jobs."}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:mt-6"
        >
          <Plus size={16} />
          Add Service
        </button>
      )}

    </div>
  );
};

/* ============================================================
   HELPERS
============================================================ */

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "—";
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

const formatDateForInput = (
  date,
) => {
  if (!date) return "";

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

const getTodayDate = () => {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatStatus = (status) => {
  if (!status) return "—";

  return String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
};

export default Services;