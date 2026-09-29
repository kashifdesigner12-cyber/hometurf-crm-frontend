import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Users,
  LoaderCircle,
  RefreshCw,
  Mail,
  Phone,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
} from "../../services/leadApi";

/* =========================================================
    LEADS PAGE
========================================================= */

const Leads = () => {
  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "New",
    notes: "",
  });

  const [refreshing, setRefreshing] = useState(false);

  /* =========================================================
     LOAD LEADS
  ========================================================= */

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getLeads();

      const result = Array.isArray(data)
        ? data
        : data?.leads ||
          data?.data ||
          [];

      setLeads(Array.isArray(result) ? result : []);
    } catch (error) {
      setLeads([]);

      setError(
        error?.message ||
          "Unable to load leads.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await loadLeads();
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     FILTER LEADS
  ========================================================= */

  const filteredLeads = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    return leads.filter((lead) => {
      const matchesSearch =
        !searchValue ||
        lead?.name
          ?.toLowerCase()
          .includes(searchValue) ||
        lead?.email
          ?.toLowerCase()
          .includes(searchValue) ||
        lead?.phone
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        lead?.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesSource =
        sourceFilter === "All" ||
        lead?.source?.toLowerCase() ===
          sourceFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    sourceFilter,
  ]);

  /* =========================================================
     SOURCES
  ========================================================= */

  const sources = useMemo(() => {
    return [
      ...new Set(
        leads
          .map((lead) => lead?.source)
          .filter(Boolean),
      ),
    ];
  }, [leads]);

  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  const openCreateModal = () => {
    setError("");
    setEditingLead(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: "New",
      notes: "",
    });

    setShowModal(true);
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEditModal = (lead) => {
    setError("");
    setEditingLead(lead);

    setFormData({
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      source: lead?.source || "",
      status: lead?.status || "New",
      notes: lead?.notes || "",
    });

    setShowModal(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingLead(null);
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingLead) {
        const data = await updateLead(
          editingLead._id,
          formData,
        );

        const updatedLead =
          data?.lead ||
          data?.data ||
          data;

        if (updatedLead) {
          setLeads((previous) =>
            previous.map((lead) =>
              lead?._id === editingLead?._id
                ? updatedLead
                : lead,
            ),
          );
        }
      } else {
        const data =
          await createLead(formData);

        const newLead =
          data?.lead ||
          data?.data ||
          data;

        if (newLead) {
          setLeads((previous) => [
            newLead,
            ...previous,
          ]);
        }
      }

      setShowModal(false);
      setEditingLead(null);
    } catch (error) {
      setError(
        error?.message ||
          "Unable to save lead.",
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
        "Are you sure you want to delete this lead?",
      );

    if (!confirmed) return;

    try {
      setError("");

      await deleteLead(id);

      setLeads((previous) =>
        previous.filter(
          (lead) => lead?._id !== id,
        ),
      );
    } catch (error) {
      setError(
        error?.message ||
          "Unable to delete lead.",
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="min-h-full w-full min-w-0 bg-[#F8FAFC] px-3 pb-10 pt-2 transition-all duration-300 sm:px-6 sm:pb-16">

      {/* =====================================================
          SOFT BACKGROUND DECORATION
      ===================================================== */}

      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-purple-200/50 blur-3xl animate-[float_7s_ease-in-out_infinite]" />

        <div className="absolute -left-24 top-28 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl animate-[float_9s_ease-in-out_infinite_reverse]" />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex min-w-0 animate-[slideDown_.45s_ease-out_both] flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-300/80 bg-purple-50/80 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7]">
            <Sparkles size={13} />
            Lead Management
          </div>

          <h1 className="text-[32px] font-black tracking-[-0.035em] text-[#17151F] sm:text-[38px]">
            Leads
          </h1>

          <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#6E687A] font-medium">
            Manage and track your potential customers
            from one central workspace.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 min-[420px]:flex-row sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-4 py-3 text-sm font-bold sm:w-auto sm:px-4.5 text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={`transition-transform duration-500 ${
                refreshing
                  ? "animate-spin text-[#5E52B7]"
                  : "group-hover:rotate-90"
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold sm:w-auto text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)]"
          >
            <Plus
              size={17}
              className="transition-transform duration-300 group-hover:rotate-90"
            />

            Add Lead
          </button>

        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-6 animate-[fadeIn_.3s_ease-out_both] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* =====================================================
          QUICK SUMMARY
      ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <QuickInfoCard
          icon={Users}
          label="Total Leads"
          value={leads.length}
          description="All leads"
          delay="0ms"
        />

        <QuickInfoCard
          icon={CalendarDays}
          label="Showing"
          value={filteredLeads.length}
          description="Matching filters"
          delay="70ms"
        />

        <QuickInfoCard
          icon={Sparkles}
          label="Sources"
          value={sources.length}
          description="Lead sources"
          delay="140ms"
        />

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="mb-6 animate-[slideUp_.45s_ease-out_.08s_both] rounded-[22px] border border-purple-200/70 bg-white p-3 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:p-5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)]">

        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-[#3A3742]">
              Search & Filters
            </p>

            <p className="mt-0.5 text-[10px] font-medium text-[#8C8697]">
              Find leads quickly
            </p>
          </div>

          {(search ||
            statusFilter !== "All" ||
            sourceFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setSourceFilter("All");
              }}
              className="text-[11px] font-bold text-[#5E52B7] transition-colors hover:text-purple-800"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(150px,0.35fr)_minmax(150px,0.35fr)]">

          {/* Search */}

          <div className="group relative flex-1">

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697] transition-colors duration-200 group-focus-within:text-[#5E52B7]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email or phone..."
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-sm text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            />

          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-sm font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="New">
              New
            </option>

            <option value="Contacted">
              Contacted
            </option>

            <option value="Qualified">
              Qualified
            </option>

            <option value="Converted">
              Converted
            </option>

            <option value="Lost">
              Lost
            </option>
          </select>

          {/* Source */}

          <select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value)
            }
            className="h-12 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-sm font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
          >
            <option value="All">
              All Sources
            </option>

            {sources.map((source) => (
              <option
                key={source}
                value={source}
              >
                {source}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="min-w-0 animate-[slideUp_.5s_ease-out_.12s_both] overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-300 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)]">

        {/* Table Header */}

        <div className="flex flex-col gap-3 border-b border-purple-50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm">
                <Users size={18} />
              </div>

              <div>
                <h2 className="text-[17px] font-black text-[#24212C]">
                  All Leads
                </h2>

                <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                  Manage your potential customers
                </p>
              </div>

            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/50 px-3.5 py-2 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

            <span className="text-xs font-bold text-[#5E52B7]">
              {filteredLeads.length}{" "}
              {filteredLeads.length === 1
                ? "Lead"
                : "Leads"}
            </span>
          </div>

        </div>

        {/* Content */}

        {loading ? (
          <TableLoading />
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            search={search}
            onAdd={openCreateModal}
          />
        ) : (
          <div className="w-full overflow-x-auto overscroll-x-contain">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-purple-50 bg-purple-50/40">

                  <th className="px-8 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                    Lead
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                    Contact
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                    Source
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                    Status
                  </th>

                  <th className="px-8 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredLeads.map(
                  (lead, index) => (
                    <LeadRow
                      key={
                        lead?._id ||
                        `lead-${index}`
                      }
                      lead={lead}
                      index={index}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ),
                )}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <LeadModal
          editingLead={editingLead}
          formData={formData}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* =====================================================
          PAGE ANIMATIONS
      ===================================================== */}

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translate3d(0, 0, 0);
            }

            50% {
              transform: translate3d(0, 16px, 0);
            }
          }
        `}
      </style>

    </section>
  );
};

/* =========================================================
   QUICK INFO CARD
========================================================= */

const QuickInfoCard = ({
  icon: Icon,
  label,
  value,
  description,
  delay,
}) => {
  return (
    <div
      style={{
        animationDelay: delay,
      }}
      className="group relative animate-[slideUp_.45s_ease-out_both] overflow-hidden rounded-[22px] border border-purple-200/75 bg-white px-6 py-5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)]"
    >

      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-purple-200/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between">

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#191720] transition-transform duration-300 group-hover:translate-x-0.5">
            {value ?? 0}
          </p>

          <p className="mt-1 text-[11px] font-medium text-[#9E98A6]">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100/80 text-[#5E52B7] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
          <Icon size={20} />
        </div>

      </div>
    </div>
  );
};

/* =========================================================
   LEAD ROW
========================================================= */

const LeadRow = ({
  lead,
  index,
  onEdit,
  onDelete,
}) => {
  return (
    <tr
      style={{
        animationDelay: `${index * 55}ms`,
      }}
      className="group animate-[fadeIn_.4s_ease-out_both] border-b border-purple-50 transition-all duration-200 last:border-0 hover:bg-purple-50/50"
    >

      {/* Lead */}

      <td className="px-8 py-5">

        <div className="flex items-center gap-3.5">

          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xs font-black text-[#5E52B7] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">

            {getInitials(
              lead?.name,
            )}

            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />

          </div>

          <div className="min-w-0">

            <p className="max-w-[190px] truncate text-sm font-bold text-[#33303A] group-hover:text-[#5E52B7] transition-colors">
              {lead?.name || "—"}
            </p>

            {lead?.createdAt && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#8C8697]">
                <CalendarDays size={13} className="text-[#5E52B7]" />
                {formatDate(
                  lead.createdAt,
                )}
              </div>
            )}

          </div>

        </div>

      </td>

      {/* Contact */}

      <td className="px-4 py-5">

        <div className="space-y-1.5">

          <div className="flex items-center gap-2 text-sm text-[#77737E]">
            <Mail
              size={14}
              className="shrink-0 text-[#5E52B7]"
            />

            <span className="max-w-[210px] truncate font-medium">
              {lead?.email || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#8C8697]">
            <Phone
              size={13}
              className="shrink-0"
            />

            <span>
              {lead?.phone || "—"}
            </span>
          </div>

        </div>

      </td>

      {/* Source */}

      <td className="px-4 py-5">

        <span className="inline-flex rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-[11px] font-bold text-[#5E52B7] transition-all duration-200 group-hover:border-[#5E52B7] group-hover:bg-[#5E52B7] group-hover:text-white">
          {lead?.source || "—"}
        </span>

      </td>

      {/* Status */}

      <td className="px-4 py-5">
        <StatusBadge
          status={lead?.status}
        />
      </td>

      {/* Actions */}

      <td className="px-8 py-5">

        <div className="flex justify-end gap-2">

          <Link
            to={`/leads/${lead?._id}`}
            title="View lead"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-300 hover:scale-110 hover:bg-[#5E52B7] hover:text-white hover:shadow-sm"
          >
            <Eye size={17} />
          </Link>

          <button
            type="button"
            onClick={() =>
              onEdit(lead)
            }
            title="Edit lead"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white hover:shadow-sm"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(
                lead?._id,
              )
            }
            title="Delete lead"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-all duration-300 hover:scale-110 hover:bg-red-500 hover:text-white hover:shadow-sm"
          >
            <Trash2 size={16} />
          </button>

        </div>

      </td>

    </tr>
  );
};

/* =========================================================
   LEAD MODAL
========================================================= */

const LeadModal = ({
  editingLead,
  formData,
  saving,
  onChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-[fadeIn_.2s_ease-out_both] items-center justify-center overflow-y-auto bg-black/45 p-2 backdrop-blur-[4px] sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-lg animate-[modalIn_.3s_ease-out_both] overflow-y-auto rounded-[20px] border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)]">

        {/* Header */}

        <div className="relative overflow-hidden border-b border-purple-50 px-4 py-5 sm:px-7 sm:py-6">

          <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-purple-200/50 blur-2xl" />

          <div className="relative flex items-center justify-between">

            <div>

              <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5E52B7]">
                <Users size={13} />

                Lead
              </div>

              <h2 className="text-xl font-black text-[#17151F]">
                {editingLead
                  ? "Edit Lead"
                  : "Add Lead"}
              </h2>

              <p className="mt-1 text-xs font-medium text-[#8C8697]">
                {editingLead
                  ? "Update lead information."
                  : "Add a new lead to your CRM."}
              </p>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100"
            >
              <X size={19} />
            </button>

          </div>
        </div>

        {/* Form */}

        <form
          onSubmit={onSubmit}
          className="space-y-4 p-4 sm:space-y-5 sm:p-7"
        >

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
              label="Source"
              name="source"
              value={formData.source}
              onChange={onChange}
              placeholder="e.g. Facebook"
            />

          </div>

          {/* Status */}

          <div>
            <label className="mb-2 block text-xs font-bold text-[#55515F]">
              Status
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="h-12 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-sm font-medium text-[#444444] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            >
              <option value="New">
                New
              </option>

              <option value="Contacted">
                Contacted
              </option>

              <option value="Qualified">
                Qualified
              </option>

              <option value="Converted">
                Converted
              </option>

              <option value="Lost">
                Lost
              </option>
            </select>
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
              placeholder="Add notes..."
              rows={4}
              className="w-full resize-none rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 py-3 text-sm font-medium text-[#444444] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100"
            />
          </div>

          {/* Buttons */}

          <div className="flex flex-col-reverse gap-2 border-t border-purple-50 pt-5 min-[420px]:flex-row min-[420px]:justify-end min-[420px]:gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full rounded-xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold min-[420px]:w-auto text-[#55515F] transition-all duration-200 hover:bg-purple-50 hover:text-[#5E52B7] disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Saving..."
                : editingLead
                  ? "Update Lead"
                  : "Create Lead"}
            </button>

          </div>

        </form>
      </div>

      <style>
        {`
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: translateY(15px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

    </div>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

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

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const normalizedStatus =
    status?.toLowerCase();

  const statusClasses = {
    new: "border-blue-200 bg-blue-50 text-blue-800",
    contacted:
      "border-amber-200 bg-amber-50 text-amber-800",
    qualified:
      "border-purple-200 bg-purple-50 text-[#5E52B7]",
    converted:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    lost:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold transition-all duration-200 shadow-sm ${
        statusClasses[
          normalizedStatus
        ] ||
        "border-purple-200 bg-purple-50 text-[#5E52B7]"
      }`}
    >
      {status || "—"}
    </span>
  );
};

/* =========================================================
   TABLE LOADING
========================================================= */

const TableLoading = () => {
  return (
    <div className="divide-y divide-purple-50">

      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          style={{
            animationDelay: `${index * 70}ms`,
          }}
          className="flex animate-[fadeIn_.35s_ease-out_both] items-center gap-4 px-8 py-5"
        >

          <div className="h-11 w-11 animate-pulse rounded-2xl bg-purple-100/80" />

          <div className="flex-1 space-y-2.5">

            <div className="h-3.5 w-36 animate-pulse rounded-md bg-purple-100/80" />

            <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50" />

          </div>

          <div className="hidden h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80 md:block" />

          <div className="hidden h-6 w-20 animate-pulse rounded-full bg-purple-100/80 sm:block" />

          <div className="h-10 w-28 animate-pulse rounded-xl bg-purple-100/80" />

        </div>
      ))}

    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  search,
  onAdd,
}) => {
  const hasSearch =
    Boolean(search.trim());

  return (
    <div className="flex min-h-[380px] animate-[fadeIn_.4s_ease-out_both] flex-col items-center justify-center px-6 text-center">

      <div className="group flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <Users
          size={28}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <h3 className="mt-6 text-base font-black text-[#333333]">
        {hasSearch
          ? "No leads found"
          : "No leads yet"}
      </h3>

      <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#999999]">
        {hasSearch
          ? "Try changing your search or filters."
          : "Start adding leads to manage your potential customers."}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="group mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus
            size={16}
            className="transition-transform duration-300 group-hover:rotate-90"
          />

          Add Lead
        </button>
      )}

    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name) => {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const formatDate = (date) => {
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

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

export default Leads;