import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  UserRound,
  LoaderCircle,
  Mail,
  Phone,
  ChevronRight,
  Users,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
} from "../../services/customerApi";

/* =========================
   CONSTANTS
========================= */

const CUSTOMER_TYPES = ["REGULAR", "WALK_IN", "CREDIT", "WHOLESALE"];

/* =========================
   AUTH HELPERS
========================= */

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
  window.location.href = "/login";
};

/* =========================
   CUSTOMERS
========================= */

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    customerType: "WALK_IN",
    creditLimit: "",
    notes: "",
    isActive: true,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers();
      const result = Array.isArray(data)
        ? data
        : data?.customers || data?.data?.customers || data?.data || [];

      setCustomers(Array.isArray(result) ? result : []);
    } catch (error) {
      setCustomers([]);

      if (
        error?.response?.status === 401 ||
        error?.status === 401
      ) {
        clearAuthAndRedirect();
        return;
      }

      setError(error?.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        customer.name?.toLowerCase().includes(searchValue) ||
        customer.email?.toLowerCase().includes(searchValue) ||
        customer.phone?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active"
          ? customer.isActive === true
          : customer.isActive === false);

      const matchesType =
        typeFilter === "All" ||
        customer.customerType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [customers, search, statusFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      customerType: "WALK_IN",
      creditLimit: "",
      notes: "",
      isActive: true,
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      customerType: customer.customerType || "WALK_IN",
      creditLimit:
        customer.creditLimit !== undefined &&
        customer.creditLimit !== null
          ? customer.creditLimit
          : "",
      notes: customer.notes || "",
      isActive: customer.isActive !== false,
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleActiveChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      isActive: event.target.value === "true",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        customerType: formData.customerType,
        notes: formData.notes.trim(),
        isActive: formData.isActive,
      };

      if (
        formData.creditLimit !== "" &&
        formData.creditLimit !== null &&
        formData.creditLimit !== undefined
      ) {
        payload.creditLimit = Number(formData.creditLimit);
      }

      if (editingCustomer) {
        const data = await updateCustomer(editingCustomer._id, payload);
        const updatedCustomer =
          data?.customer ||
          data?.data?.customer ||
          data?.data ||
          data;

        setCustomers((previous) =>
          previous.map((customer) =>
            customer._id === editingCustomer._id
              ? { ...customer, ...(updatedCustomer || {}) }
              : customer
          )
        );
      } else {
        const data = await createCustomer(payload);
        const newCustomer =
          data?.customer ||
          data?.data?.customer ||
          data?.data ||
          data;

        if (newCustomer) {
          setCustomers((previous) => [newCustomer, ...previous]);
        }
      }

      closeModal();
    } catch (error) {
      if (
        error?.response?.status === 401 ||
        error?.status === 401
      ) {
        clearAuthAndRedirect();
        return;
      }

      setError(error?.message || "Unable to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (customer) => {
    if (!customer?._id || customer.isActive === false) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${
        customer.name || "this customer"
      }?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setDeactivatingId(customer._id);

      const data = await updateCustomer(customer._id, {
        isActive: false,
      });

      const updatedCustomer =
        data?.customer ||
        data?.data?.customer ||
        data?.data ||
        data;

      setCustomers((previous) =>
        previous.map((item) =>
          item._id === customer._id
            ? { ...item, ...(updatedCustomer || {}), isActive: false }
            : item
        )
      );
    } catch (error) {
      if (
        error?.response?.status === 401 ||
        error?.status === 401
      ) {
        clearAuthAndRedirect();
        return;
      }

      setError(error?.message || "Unable to deactivate customer.");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleReactivate = async (customer) => {
    if (!customer?._id) return;

    try {
      setError("");
      setDeactivatingId(customer._id);

      const data = await updateCustomer(customer._id, {
        isActive: true,
      });

      const updatedCustomer =
        data?.customer ||
        data?.data?.customer ||
        data?.data ||
        data;

      setCustomers((previous) =>
        previous.map((item) =>
          item._id === customer._id
            ? { ...item, ...(updatedCustomer || {}), isActive: true }
            : item
        )
      );
    } catch (error) {
      if (
        error?.response?.status === 401 ||
        error?.status === 401
      ) {
        clearAuthAndRedirect();
        return;
      }

      setError(error?.message || "Unable to activate customer.");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <section className="min-h-full w-full bg-[#F8FAFC] px-3 pb-10 pt-3 transition-all duration-300 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8">
      {/* HEADER */}
      <div className="mb-6 flex animate-[fadeIn_0.4s_ease-out] flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:text-[11px] sm:px-3.5">
            <Sparkles size={13} />
            Customer Management
          </div>

          <h1 className="text-2xl font-black tracking-[-0.035em] text-[#17151F] sm:text-[38px]">
            Customers
          </h1>

          <p className="mt-1.5 max-w-xl text-sm font-medium leading-6 text-[#6E687A]">
            Manage your customer information and relationships seamlessly.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="button-press group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto"
        >
          <Plus
            size={17}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
          Add Customer
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 break-words rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* QUICK STATS */}
      {!loading && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <MiniStat
            icon={<Users size={20} />}
            label="Total Customers"
            value={customers.length}
            iconClass="bg-purple-100/80 text-[#5E52B7]"
          />

          <MiniStat
            icon={<UserRound size={20} />}
            label="Active Customers"
            value={
              customers.filter(
                (customer) => customer.isActive !== false
              ).length
            }
            iconClass="bg-emerald-100/80 text-emerald-600"
          />

          <MiniStat
            icon={<CreditCard size={20} />}
            label="Credit Customers"
            value={
              customers.filter(
                (customer) => customer.customerType === "CREDIT"
              ).length
            }
            iconClass="bg-amber-100/80 text-amber-600"
          />
        </div>
      )}

      {/* FILTERS */}
      <div className="mb-6 rounded-[22px] border border-purple-200/70 bg-white p-3 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_210px]">
          <div className="relative min-w-0 md:col-span-2 lg:col-span-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers by name, email or phone..."
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-sm font-medium text-[#333333] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-sm font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:px-4"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-sm font-medium text-[#55515F] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:px-4"
          >
            <option value="All">All Customer Types</option>
            {CUSTOMER_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatCustomerType(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="overflow-hidden rounded-[24px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-300 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)]">
        <div className="flex flex-col gap-3 border-b border-purple-50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm">
              <Users size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-black text-[#24212C] sm:text-[17px]">
                All Customers
              </h2>
              <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                {filteredCustomers.length} customer
                {filteredCustomers.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 self-start rounded-xl border border-purple-200/80 bg-purple-50/50 px-3.5 py-2 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-[#5E52B7]">
              Customers
            </span>
          </div>
        </div>

        {loading ? (
          <TableLoading />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState search={search} onAdd={openCreateModal} />
        ) : (
          <>
            {/* Mobile customer cards */}
            <div className="divide-y divide-purple-50 md:hidden">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer._id}
                  customer={customer}
                  onEdit={openEditModal}
                  onDeactivate={handleDeactivate}
                  onReactivate={handleReactivate}
                  deactivatingId={deactivatingId}
                />
              ))}
            </div>

            {/* Tablet and desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-purple-50 bg-purple-50/40">
                    <th className="px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697] lg:px-8">
                      Customer
                    </th>
                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Contact
                    </th>
                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Type
                    </th>
                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                      Purchases
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
                  {filteredCustomers.map((customer) => (
                    <CustomerRow
                      key={customer._id}
                      customer={customer}
                      onEdit={openEditModal}
                      onDeactivate={handleDeactivate}
                      onReactivate={handleReactivate}
                      deactivatingId={deactivatingId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <CustomerModal
          editingCustomer={editingCustomer}
          formData={formData}
          saving={saving}
          onChange={handleChange}
          onActiveChange={handleActiveChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .button-press:active {
          transform: scale(0.97);
        }
      `}</style>
    </section>
  );
};

/* =========================
   MINI STAT
========================= */

const MiniStat = ({ icon, label, value, iconClass }) => {
  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-[22px] border border-purple-200/75 bg-white px-4 py-4 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)] sm:gap-4 sm:px-6 sm:py-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 sm:h-12 sm:w-12 ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
          {label}
        </p>
        <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[#191720] sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
};

/* =========================
   CUSTOMER ROW
========================= */

const CustomerRow = ({
  customer,
  onEdit,
  onDeactivate,
  onReactivate,
  deactivatingId,
}) => {
  const isActive = customer.isActive !== false;
  const isProcessing = deactivatingId === customer._id;

  return (
    <tr className="group border-b border-purple-50 transition-all duration-200 last:border-0 hover:bg-purple-50/50">
      <td className="px-5 py-5 lg:px-8">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xs font-black text-[#5E52B7] transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
            {getInitials(customer.name)}
          </div>

          <div className="min-w-0">
            <p className="max-w-[180px] truncate text-sm font-bold text-[#33303A] transition-colors group-hover:text-[#5E52B7]">
              {customer.name || "—"}
            </p>

            {customer.createdAt && (
              <p className="mt-1 text-[11px] font-medium text-[#8C8697]">
                Joined {formatDate(customer.createdAt)}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-[#77737E]">
            <Mail size={14} className="shrink-0 text-[#5E52B7]" />
            <span className="max-w-[190px] truncate font-medium">
              {customer.email || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#8C8697]">
            <Phone size={13} className="shrink-0" />
            <span className="whitespace-nowrap">
              {customer.phone || "—"}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        <span className="inline-flex items-center rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-[11px] font-bold text-[#5E52B7]">
          {formatCustomerType(customer.customerType)}
        </span>
      </td>

      <td className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7]">
            <ShoppingBag size={14} />
          </div>

          <div>
            <p className="text-sm font-bold text-[#33303A]">
              {customer.totalPurchasesCount ?? 0}
            </p>
            <p className="text-[10px] font-medium text-[#8C8697]">
              purchases
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        <StatusBadge isActive={isActive} />
      </td>

      <td className="px-5 py-5 lg:px-8">
        <CustomerActions
          customer={customer}
          isActive={isActive}
          isProcessing={isProcessing}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onReactivate={onReactivate}
        />
      </td>
    </tr>
  );
};

/* =========================
   MOBILE CUSTOMER CARD
========================= */

const CustomerCard = ({
  customer,
  onEdit,
  onDeactivate,
  onReactivate,
  deactivatingId,
}) => {
  const isActive = customer.isActive !== false;
  const isProcessing = deactivatingId === customer._id;

  return (
    <div className="space-y-4 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xs font-black text-[#5E52B7]">
          {getInitials(customer.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-[#33303A]">
                {customer.name || "—"}
              </p>
              {customer.createdAt && (
                <p className="mt-1 text-[11px] font-medium text-[#8C8697]">
                  Joined {formatDate(customer.createdAt)}
                </p>
              )}
            </div>
            <StatusBadge isActive={isActive} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#FAFAFC] p-3">
        <div className="flex min-w-0 items-start gap-2 text-sm text-[#77737E]">
          <Mail size={15} className="mt-0.5 shrink-0 text-[#5E52B7]" />
          <span className="break-all">{customer.email || "—"}</span>
        </div>

        <div className="flex min-w-0 items-start gap-2 text-sm text-[#77737E]">
          <Phone size={15} className="mt-0.5 shrink-0 text-[#5E52B7]" />
          <span className="break-words">{customer.phone || "—"}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-[11px] font-bold text-[#5E52B7]">
            {formatCustomerType(customer.customerType)}
          </span>

          <div className="flex items-center gap-2 text-xs font-medium text-[#77737E]">
            <ShoppingBag size={15} className="text-[#5E52B7]" />
            {customer.totalPurchasesCount ?? 0} purchases
          </div>
        </div>
      </div>

      <CustomerActions
        customer={customer}
        isActive={isActive}
        isProcessing={isProcessing}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
        onReactivate={onReactivate}
        mobile
      />
    </div>
  );
};

/* =========================
   CUSTOMER ACTIONS
========================= */

const CustomerActions = ({
  customer,
  isActive,
  isProcessing,
  onEdit,
  onDeactivate,
  onReactivate,
  mobile = false,
}) => {
  return (
    <div
      className={`flex items-center gap-2 ${
        mobile ? "justify-end" : "justify-end"
      }`}
    >
      <Link
        to={`/customers/${customer._id}`}
        title="View customer"
        aria-label="View customer"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:scale-110 hover:bg-[#5E52B7] hover:text-white"
      >
        <Eye size={17} />
      </Link>

      <button
        type="button"
        onClick={() => onEdit(customer)}
        title="Edit customer"
        aria-label="Edit customer"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-600 hover:text-white"
      >
        <Pencil size={16} />
      </button>

      {isActive ? (
        <button
          type="button"
          onClick={() => onDeactivate(customer)}
          disabled={isProcessing}
          title="Deactivate customer"
          aria-label="Deactivate customer"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-all duration-200 hover:scale-110 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onReactivate(customer)}
          disabled={isProcessing}
          title="Activate customer"
          aria-label="Activate customer"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ChevronRight size={17} />
          )}
        </button>
      )}
    </div>
  );
};

/* =========================
   CUSTOMER MODAL
========================= */

const CustomerModal = ({
  editingCustomer,
  formData,
  saving,
  onChange,
  onActiveChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-2 backdrop-blur-[4px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content animate-[modalIn_0.25s_ease-out] my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:max-h-[90vh] sm:rounded-[26px]">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-purple-50 bg-white px-4 py-4 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7] sm:text-[11px]">
              <Users size={13} />
              Customer
            </div>

            <h2 className="text-lg font-black text-[#17151F] sm:text-xl">
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </h2>

            <p className="mt-1 text-xs font-medium leading-5 text-[#8C8697]">
              {editingCustomer
                ? "Update customer information."
                : "Add a new customer to your CRM."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100 sm:h-10 sm:w-10"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5 p-4 sm:p-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Name"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Enter name"
              required
            />

            <FormField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              placeholder="Enter phone"
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter email"
            />

            <FormField
              label="Address"
              name="address"
              value={formData.address}
              onChange={onChange}
              placeholder="Enter address"
            />

            <div className="min-w-0">
              <label className="mb-2 block text-xs font-bold text-[#55515F]">
                Customer Type
              </label>

              <select
                name="customerType"
                value={formData.customerType}
                onChange={onChange}
                className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
              >
                {CUSTOMER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatCustomerType(type)}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Credit Limit"
              name="creditLimit"
              type="number"
              min="0"
              step="0.01"
              value={formData.creditLimit}
              onChange={onChange}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[#55515F]">
              Status
            </label>

            <select
              value={formData.isActive ? "true" : "false"}
              onChange={onActiveChange}
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[#55515F]">
              Notes
            </label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={onChange}
              placeholder="Add notes..."
              rows={4}
              className="w-full resize-y rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 py-3 text-sm font-medium text-[#444444] outline-none placeholder:text-[#A09CA7] transition-all focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            />
          </div>

          {/* Form Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-purple-50 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="button-press w-full rounded-xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition-all duration-200 hover:bg-purple-50 hover:text-[#5E52B7] sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="button-press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving && (
                <LoaderCircle size={16} className="animate-spin" />
              )}
              {saving
                ? "Saving..."
                : editingCustomer
                  ? "Update Customer"
                  : "Create Customer"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
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
      `}</style>
    </div>
  );
};

/* =========================
   FORM FIELD
========================= */

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
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
        min={min}
        step={step}
        className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
};

/* =========================
   STATUS BADGE
========================= */

const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold shadow-sm sm:text-[11px] ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-gray-200 bg-gray-100 text-gray-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

/* =========================
   TABLE LOADING
========================= */

const TableLoading = () => {
  return (
    <>
      {/* Mobile loading skeleton */}
      <div className="divide-y divide-purple-50 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-purple-100/80" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-36 max-w-full animate-pulse rounded-md bg-purple-100/80" />
                <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50" />
              </div>
            </div>
            <div className="h-16 animate-pulse rounded-2xl bg-purple-50" />
            <div className="flex justify-end gap-2">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-purple-100/80" />
              <div className="h-9 w-9 animate-pulse rounded-xl bg-purple-100/80" />
              <div className="h-9 w-9 animate-pulse rounded-xl bg-purple-100/80" />
            </div>
          </div>
        ))}
      </div>

      {/* Tablet and desktop loading skeleton */}
      <div className="hidden divide-y divide-purple-50 md:block">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-5 py-5 lg:px-8"
          >
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-purple-100/80" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-36 animate-pulse rounded-md bg-purple-100/80" />
              <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50" />
            </div>
            <div className="hidden h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80 lg:block" />
            <div className="hidden h-6 w-20 animate-pulse rounded-full bg-purple-100/80 sm:block" />
            <div className="h-10 w-28 animate-pulse rounded-xl bg-purple-100/80" />
          </div>
        ))}
      </div>
    </>
  );
};

/* =========================
   EMPTY STATE
========================= */

const EmptyState = ({ search, onAdd }) => {
  const hasSearch = Boolean(search.trim());

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[380px] sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg sm:h-20 sm:w-20">
        <UserRound size={28} />
      </div>

      <h3 className="mt-6 text-base font-black text-[#333333]">
        {hasSearch ? "No customers found" : "No customers yet"}
      </h3>

      <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#999999]">
        {hasSearch
          ? "Try changing your search or filters."
          : "Start adding customers to manage your customer relationships."}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="button-press mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus size={16} />
          Add Customer
        </button>
      )}
    </div>
  );
};

/* =========================
   HELPERS
========================= */

const getInitials = (name) => {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCustomerType = (type) => {
  if (!type) return "—";

  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default Customers;