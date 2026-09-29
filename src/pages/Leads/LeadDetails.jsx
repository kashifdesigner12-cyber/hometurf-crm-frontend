import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Edit,
  UserRound,
  RefreshCw,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken") ||
  "";

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
    throw new Error(result?.message || "Your session has expired.");
  }

  if (!response.ok) {
    throw new Error(
      result?.message || "Unable to load lead details."
    );
  }

  return result;
};

const getLeadDetails = async (id) => {
  const result = await apiRequest(`/leads/${id}`);
  return result?.data || result?.lead || null;
};

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadLead = async () => {
    if (!id) {
      setError("Lead ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const data = await getLeadDetails(id);

      if (!data) {
        throw new Error("Lead details were not found.");
      }

      setLead(data);
    } catch (error) {
      setLead(null);
      setError(error?.message || "Unable to load lead details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadLead();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-full w-full bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-purple-100" />
              <div className="space-y-2">
                <div className="h-6 w-36 animate-pulse rounded-lg bg-purple-100" />
                <div className="h-3 w-48 max-w-full animate-pulse rounded bg-purple-50" />
              </div>
            </div>
            <div className="h-10 w-28 animate-pulse rounded-2xl bg-purple-100" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="animate-pulse rounded-3xl border border-purple-200/60 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2">
              <div className="h-5 w-40 rounded bg-purple-100" />
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index}>
                    <div className="h-3 w-16 rounded bg-purple-50" />
                    <div className="mt-3 h-4 w-40 max-w-full rounded bg-purple-100" />
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-pulse rounded-3xl border border-purple-200/60 bg-white p-5 shadow-sm sm:p-7">
              <div className="h-5 w-20 rounded bg-purple-100" />
              <div className="mt-5 space-y-3">
                <div className="h-3 w-full rounded bg-purple-50" />
                <div className="h-3 w-full rounded bg-purple-50" />
                <div className="h-3 w-3/4 rounded bg-purple-50" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !lead) {
    return (
      <section className="min-h-full w-full bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-6">
        <div className="rounded-3xl border border-purple-200/60 bg-white p-5 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <UserRound size={28} />
          </div>

          <h2 className="mt-5 text-lg font-black text-[#24212C]">
            Unable to load lead
          </h2>

          <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-[#8C8697]">
            {error || "The requested lead could not be found."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Try Again
            </button>

            <Link
              to="/leads"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-5 py-3 text-sm font-bold text-[#55515F] transition hover:bg-purple-50 hover:text-[#5E52B7] sm:w-auto"
            >
              <ArrowLeft size={16} />
              Back to Leads
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const leadName = lead?.name || "Unnamed Lead";
  const leadEmail = lead?.email || "";
  const leadPhone = lead?.phone || "";
  const leadSource = lead?.source || "Unknown";
  const leadStatus = lead?.status || "—";
  const leadNotes =
    lead?.notes || "No notes have been added for this lead yet.";
  const createdDate = formatDate(lead?.createdAt);
  const createdDateTime = formatDateTime(lead?.createdAt);
  const address = getAddress(lead);

  return (
    <section className="min-h-full w-full bg-[#F8FAFC] px-3 pb-10 pt-3 transition-all duration-300 sm:px-6 sm:pb-16 sm:pt-4">
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to="/leads"
              title="Back to leads"
              className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-200/80 bg-white text-[#77737E] shadow-sm transition hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] sm:h-11 sm:w-11"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#5E52B7] sm:text-[11px]">
                <Sparkles size={12} />
                Lead Profile
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[#17151F] sm:text-[34px]">
                Lead Details
              </h1>

              <p className="mt-1 text-sm font-medium text-[#6E687A]">
                View and manage complete lead information.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-purple-200/80 bg-white px-3 py-3 text-sm font-bold text-[#55515F] shadow-sm transition hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate("/leads")}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-3 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg sm:rounded-2xl sm:px-5"
            >
              <Edit size={16} />
              Edit Lead
            </button>
          </div>
        </div>

        {/* Lead Summary */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main Information */}
          <div className="min-w-0 overflow-hidden rounded-3xl border border-purple-200/60 bg-white shadow-sm transition hover:shadow-md lg:col-span-2">
            <div className="relative overflow-hidden border-b border-purple-50 px-4 py-5 sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />

              <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-lg font-black text-[#5E52B7] shadow-sm sm:h-14 sm:w-14">
                    {getInitials(leadName)}
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-black tracking-tight text-[#24212C] sm:text-xl">
                      {leadName}
                    </h2>
                    <p className="mt-1 break-all text-xs font-medium text-[#8C8697]">
                      Lead ID: #{lead?._id || id}
                    </p>
                  </div>
                </div>

                <div className="self-start sm:self-auto">
                  <StatusBadge status={leadStatus} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-4 py-6 sm:grid-cols-2 sm:px-7 sm:py-7">
              <InfoItem
                icon={Mail}
                label="Email"
                value={leadEmail || "—"}
                href={leadEmail ? `mailto:${leadEmail}` : undefined}
              />

              <InfoItem
                icon={Phone}
                label="Phone"
                value={leadPhone || "—"}
                href={leadPhone ? `tel:${leadPhone}` : undefined}
              />

              <InfoItem
                icon={FileText}
                label="Source"
                value={leadSource}
              />

              <InfoItem
                icon={CalendarDays}
                label="Created At"
                value={createdDate || "—"}
              />

              <div className="min-w-0 sm:col-span-2">
                <InfoItem
                  icon={MapPin}
                  label="Address"
                  value={address || "Not provided"}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="min-w-0 overflow-hidden rounded-3xl border border-purple-200/60 bg-white shadow-sm transition hover:shadow-md">
            <div className="border-b border-purple-50 px-4 py-5 sm:px-7 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100/80 text-[#5E52B7] shadow-sm">
                  <FileText size={18} />
                </div>

                <div>
                  <h2 className="text-[17px] font-black text-[#24212C]">
                    Notes
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                    Lead information
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-7">
              <p className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-[#6E687A]">
                {leadNotes}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Details */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <QuickCard
            icon={UserRound}
            label="Lead"
            value={leadName}
            delay="0ms"
          />

          <QuickCard
            icon={Clock3}
            label="Created"
            value={createdDate || "—"}
            delay="80ms"
          />

          <QuickCard
            icon={FileText}
            label="Source"
            value={leadSource}
            delay="160ms"
          />
        </div>

        {/* Activity */}
        <div className="overflow-hidden rounded-3xl border border-purple-200/60 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-purple-50 px-4 py-5 sm:px-7 sm:py-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600 shadow-sm">
              <Clock3 size={18} />
            </div>

            <div>
              <h2 className="text-[17px] font-black text-[#24212C]">
                Activity
              </h2>
              <p className="mt-0.5 text-xs font-medium text-[#8C8697]">
                Lead timeline
              </p>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-7 sm:py-7">
            <div className="relative">
              <div className="absolute bottom-4 left-[7px] top-4 w-px bg-purple-200/60" />

              <div className="relative flex gap-4">
                <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-[#5E52B7] shadow-[0_0_0_2px_rgba(94,82,183,0.2)]" />

                <div className="min-w-0 pb-7">
                  <p className="text-sm font-extrabold text-[#33303A]">
                    Lead created
                  </p>

                  <p className="mt-1 break-words text-sm font-medium leading-6 text-[#6E687A]">
                    Lead was added from{" "}
                    <span className="font-bold text-[#5E52B7]">
                      {leadSource}
                    </span>
                    .
                  </p>

                  {createdDateTime && (
                    <p className="mt-2 break-words text-[11px] font-semibold text-[#8C8697]">
                      {createdDateTime}
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
                    Lead status is currently{" "}
                    <span className="font-bold text-[#5E52B7]">
                      {leadStatus}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center pt-2">
          <Link
            to="/leads"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-200/80 bg-white px-6 py-3 text-sm font-bold text-[#55515F] shadow-sm transition hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] hover:shadow-md sm:w-auto"
          >
            <ArrowLeft size={16} />
            Back to Leads
          </Link>
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
            transform: translateY(16px);
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

/* Info Item */
const InfoItem = ({ icon: Icon, label, value, href }) => {
  const content = (
    <div className="group min-w-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
        {label}
      </p>

      <div className="mt-2.5 flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] shadow-sm transition group-hover:bg-[#5E52B7] group-hover:text-white">
          <Icon size={17} />
        </div>

        <p className="min-w-0 break-words text-sm font-bold text-[#33303A] transition-colors group-hover:text-[#5E52B7]">
          {value}
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
      className="block min-w-0 transition hover:-translate-y-0.5"
    >
      {content}
    </a>
  );
};

/* Quick Card */
const QuickCard = ({ icon: Icon, label, value, delay }) => {
  return (
    <div
      style={{ animationDelay: delay }}
      className="group min-w-0 rounded-3xl border border-purple-200/75 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-md sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100/80 text-[#5E52B7] transition group-hover:rotate-6">
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8C8697]">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-black text-[#33303A]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

/* Status Badge */
const StatusBadge = ({ status }) => {
  const normalized = status?.toLowerCase();

  const classes = {
    new: "border-blue-200 bg-blue-50 text-blue-800",
    contacted: "border-yellow-200 bg-yellow-50 text-yellow-800",
    qualified: "border-purple-200 bg-purple-50 text-[#5E52B7]",
    converted: "border-emerald-200 bg-emerald-50 text-emerald-800",
    lost: "border-red-200 bg-red-50 text-red-700",
  };

  const dotClasses = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    qualified: "bg-purple-500",
    converted: "bg-emerald-500",
    lost: "bg-red-500",
  };

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide shadow-sm sm:px-3.5 sm:text-[11px] ${
        classes[normalized] ||
        "border-purple-200 bg-purple-50 text-[#5E52B7]"
      }`}
    >
      <span
        className={`mr-2 h-2 w-2 shrink-0 rounded-full ${
          dotClasses[normalized] || "bg-gray-400"
        }`}
      />
      <span className="break-words">{status || "Unknown"}</span>
    </span>
  );
};

/* Helpers */
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

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAddress = (lead) => {
  if (!lead?.address) return "";

  if (typeof lead.address === "string") {
    return lead.address;
  }

  return (
    lead.address?.formatted ||
    lead.address?.street ||
    lead.address?.city ||
    ""
  );
};

export default LeadDetails;