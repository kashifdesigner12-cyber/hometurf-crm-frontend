import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apihometurf.localpro1.net/api";

const providers = [
  {
    key: "FACEBOOK",
    name: "Facebook",
    description: "Connect and manage your Facebook integration.",
    category: "Social Media",
    symbol: "f",
    symbolClass: "bg-blue-100 text-blue-600",
  },
  {
    key: "INSTAGRAM",
    name: "Instagram",
    description: "Manage your Instagram connected account.",
    category: "Social Media",
    symbol: "◎",
    symbolClass: "bg-pink-100 text-pink-600",
  },
  {
    key: "GOOGLE_BUSINESS",
    name: "Google Business",
    description: "Sync your Google Business reviews.",
    category: "Reviews",
    symbol: "G",
    symbolClass: "bg-green-100 text-green-600",
  },
  {
    key: "WHATSAPP",
    name: "WhatsApp",
    description: "Connect WhatsApp messaging services.",
    category: "Messaging",
    symbol: "◔",
    symbolClass: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "SMS",
    name: "SMS",
    description: "Connect SMS communication services.",
    category: "Messaging",
    symbol: "✉",
    symbolClass: "bg-purple-100 text-purple-600",
  },
  {
    key: "AI_CALL",
    name: "AI Call",
    description: "Connect AI-powered calling services.",
    category: "Communication",
    symbol: "☎",
    symbolClass: "bg-indigo-100 text-indigo-600",
  },
  {
    key: "CLICKY",
    name: "Clicky",
    description: "Sync reviews from Clicky.",
    category: "Reviews",
    symbol: "C",
    symbolClass: "bg-orange-100 text-orange-600",
  },
];

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const getStatusInfo = (status) => {
  if (status === "ACTIVE") {
    return {
      text: "Active",
      bg: "bg-emerald-50",
      textColor: "text-emerald-800",
      dot: "bg-emerald-500",
    };
  }

  if (status === "PENDING") {
    return {
      text: "Pending",
      bg: "bg-amber-50",
      textColor: "text-amber-800",
      dot: "bg-amber-500",
    };
  }

  return {
    text: "Inactive",
    bg: "bg-gray-100",
    textColor: "text-gray-700",
    dot: "bg-gray-400",
  };
};

const formatDate = (date) => {
  if (!date) {
    return "Never";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Never";
  }

  return value.toLocaleString();
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [syncing, setSyncing] = useState("");

  const [details, setDetails] = useState(null);

  /*
   * -----------------------------------------
   * AUTH HEADERS
   * -----------------------------------------
   */

  const getHeaders = () => {
    const token = getToken();

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  /*
   * -----------------------------------------
   * API REQUEST
   * -----------------------------------------
   */

  const request = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Server error: ${response.status}`
      );
    }

    return data;
  };

  /*
   * -----------------------------------------
   * LOAD INTEGRATIONS
   * -----------------------------------------
   */

  const loadIntegrations = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await request("/integrations");

      const backendData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setIntegrations(backendData);
    } catch (err) {
      console.error("Integrations API Error:", err);

      setError(
        err?.message ||
          "Unable to load integrations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  /*
   * -----------------------------------------
   * COMBINE BACKEND DATA WITH UI DATA
   * -----------------------------------------
   */

  const allIntegrations = useMemo(() => {
    return providers.map((provider) => {
      const backendIntegration = integrations.find(
        (item) => item?.provider === provider.key
      );

      return {
        ...provider,

        status:
          backendIntegration?.status ||
          "INACTIVE",

        configured:
          backendIntegration?.configured ||
          false,

        lastSyncedAt:
          backendIntegration?.lastSyncedAt ||
          null,
      };
    });
  }, [integrations]);

  /*
   * -----------------------------------------
   * FILTER
   * -----------------------------------------
   */

  const filteredIntegrations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allIntegrations.filter((item) => {
      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query);

      const categoryMatch =
        category === "All" ||
        item.category === category;

      const statusMatch =
        status === "All" ||
        item.status === status;

      return (
        searchMatch &&
        categoryMatch &&
        statusMatch
      );
    });
  }, [
    allIntegrations,
    search,
    category,
    status,
  ]);

  /*
   * -----------------------------------------
   * COUNTERS
   * -----------------------------------------
   */

  const activeCount = allIntegrations.filter(
    (item) => item.status === "ACTIVE"
  ).length;

  const configuredCount =
    allIntegrations.filter(
      (item) => item.configured
    ).length;

  const pendingCount = allIntegrations.filter(
    (item) => item.status === "PENDING"
  ).length;

  /*
   * -----------------------------------------
   * PROVIDER NAME
   * -----------------------------------------
   */

  const getProviderName = (provider) => {
    const item = providers.find(
      (p) => p.key === provider
    );

    return item?.name || provider;
  };

  /*
   * -----------------------------------------
   * SYNC
   * -----------------------------------------
   */

  const syncIntegration = async (provider) => {
    if (
      provider !== "GOOGLE_BUSINESS" &&
      provider !== "CLICKY"
    ) {
      setError(
        `${getProviderName(
          provider
        )} does not have a sync endpoint in the backend.`
      );

      return;
    }

    setSyncing(provider);
    setError("");
    setSuccess("");

    try {
      let endpoint = "";

      if (provider === "GOOGLE_BUSINESS") {
        endpoint =
          "/integrations/google-business/sync";
      }

      if (provider === "CLICKY") {
        endpoint =
          "/integrations/clicky/sync";
      }

      const response = await request(endpoint, {
        method: "POST",
      });

      setSuccess(
        response?.message ||
          `${getProviderName(
            provider
          )} synced successfully.`
      );

      await loadIntegrations(true);
    } catch (err) {
      console.error(
        "Integration Sync Error:",
        err
      );

      setError(
        err?.message ||
          `Unable to sync ${getProviderName(
            provider
          )}.`
      );
    } finally {
      setSyncing("");
    }
  };

  /*
   * -----------------------------------------
   * RENDER
   * -----------------------------------------
   */

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-5 sm:pt-4 md:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6 lg:space-y-7">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:px-3.5 sm:py-1 sm:text-[11px] sm:tracking-[0.14em]">
              <span className="truncate">
                Connected Services
              </span>
            </div>

            <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
              Integrations
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:mt-2 sm:text-sm">
              Connect your social media and business
              services from one central workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadIntegrations(true)
            }
            disabled={refreshing}
            className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-purple-200/80 bg-white px-4 py-2.5 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:rounded-2xl sm:px-4 sm:py-3"
          >
            <span
              className={
                refreshing
                  ? "inline-block animate-spin text-[#5E52B7]"
                  : "transition-transform duration-500 group-hover:rotate-90"
              }
            >
              ↻
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
            <span className="min-w-0 break-words">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 font-bold hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
            <span className="min-w-0 break-words">
              {success}
            </span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="shrink-0 font-bold hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {/* TOTAL */}

          <div className="min-w-0 rounded-2xl border border-purple-200/75 bg-white p-4 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)] sm:rounded-[22px] sm:p-5 md:p-6">
            <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
              Total Services
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-3">
              <p className="text-xl font-black tracking-[-0.03em] text-[#191720] sm:text-2xl">
                {allIntegrations.length}
              </p>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-base text-[#5E52B7] sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                ◎
              </div>
            </div>
          </div>

          {/* ACTIVE */}

          <div className="min-w-0 rounded-2xl border border-purple-200/75 bg-white p-4 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)] sm:rounded-[22px] sm:p-5 md:p-6">
            <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
              Active
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-3">
              <p className="text-xl font-black tracking-[-0.03em] text-[#191720] sm:text-2xl">
                {activeCount}
              </p>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-base text-emerald-800 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
                ✓
              </div>
            </div>
          </div>

          {/* CONFIGURED */}

          <div className="min-w-0 rounded-2xl border border-purple-200/75 bg-white p-4 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)] sm:rounded-[22px] sm:p-5 md:p-6">
            <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
              Configured
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-3">
              <p className="text-xl font-black tracking-[-0.03em] text-[#191720] sm:text-2xl">
                {configuredCount}
              </p>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-base text-blue-800 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
                ⚡
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className="min-w-0 rounded-2xl border border-purple-200/75 bg-white p-4 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_35px_rgba(94,82,183,0.08)] sm:rounded-[22px] sm:p-5 md:p-6">
            <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
              Pending
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2 sm:mt-3">
              <p className="text-xl font-black tracking-[-0.03em] text-[#191720] sm:text-2xl">
                {pendingCount}
              </p>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-base text-amber-800 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
                ◷
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH / FILTER */}

        <div className="rounded-2xl border border-purple-200/70 bg-white p-3.5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:rounded-[22px] sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_170px]">
            <div className="relative min-w-0">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search integrations..."
                className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
              />
            </div>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="h-11 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
            >
              <option value="All">
                All Categories
              </option>

              <option value="Social Media">
                Social Media
              </option>

              <option value="Reviews">
                Reviews
              </option>

              <option value="Messaging">
                Messaging
              </option>

              <option value="Communication">
                Communication
              </option>
            </select>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="h-11 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
            >
              <option value="All">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-purple-200/60 bg-white p-5 shadow-[0_10px_35px_rgba(94,82,183,0.04)] sm:rounded-[24px] sm:p-7"
                >
                  <div className="animate-pulse">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-purple-100/80 sm:h-14 sm:w-14" />

                      <div className="h-6 w-20 rounded-full bg-purple-100/80" />
                    </div>

                    <div className="mt-5 h-5 w-32 rounded bg-purple-100/80" />

                    <div className="mt-3 h-4 w-full rounded bg-purple-50" />

                    <div className="mt-2 h-4 w-2/3 rounded bg-purple-50" />

                    <div className="mt-6 h-11 rounded-xl bg-purple-100/80 sm:h-12 sm:rounded-2xl" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* CARDS */

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {filteredIntegrations.map(
              (integration) => {
                const statusInfo =
                  getStatusInfo(
                    integration.status
                  );

                const canSync =
                  integration.key ===
                    "GOOGLE_BUSINESS" ||
                  integration.key ===
                    "CLICKY";

                const isSyncing =
                  syncing === integration.key;

                return (
                  <div
                    key={integration.key}
                    className="group flex min-w-0 flex-col rounded-2xl border border-purple-200/60 bg-white p-5 shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5E52B7] hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px] sm:p-6 md:p-7"
                  >
                    {/* CARD TOP */}

                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl ${integration.symbolClass}`}
                      >
                        {integration.symbol}
                      </div>

                      <span
                        className={`inline-flex max-w-[110px] shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusInfo.bg} ${statusInfo.textColor} border-current/20 shadow-sm sm:max-w-none sm:px-3 sm:text-xs`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${statusInfo.dot}`}
                        />

                        <span className="truncate">
                          {statusInfo.text}
                        </span>
                      </span>
                    </div>

                    {/* NAME */}

                    <div className="mt-5 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="min-w-0 break-words text-base font-black text-[#17151F] sm:text-lg">
                          {integration.name}
                        </h2>

                        {integration.configured && (
                          <span
                            className="shrink-0 text-sm font-black text-emerald-600"
                            title="Configured"
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
                        {integration.category}
                      </p>

                      <p className="mt-3 min-h-0 text-xs font-medium leading-relaxed text-[#6E687A] sm:min-h-[42px] sm:text-sm">
                        {integration.description}
                      </p>
                    </div>

                    {/* SYNC INFO */}

                    <div className="mt-5 rounded-xl border border-purple-100/60 bg-purple-50/50 px-3 py-3 sm:rounded-2xl sm:px-4">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="text-[10px] font-bold text-[#8C8697] sm:text-xs">
                          Last synced
                        </span>

                        <span className="break-words text-[10px] font-extrabold text-[#55515F] sm:text-right sm:text-xs">
                          {formatDate(
                            integration.lastSyncedAt
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setDetails(
                            integration
                          )
                        }
                        className="min-h-[44px] w-full rounded-xl border border-purple-200/80 bg-white px-3 py-2.5 text-xs font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:border-[#5E52B7] hover:bg-purple-50 hover:text-[#5E52B7] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                      >
                        View Details
                      </button>

                      {canSync ? (
                        <button
                          type="button"
                          onClick={() =>
                            syncIntegration(
                              integration.key
                            )
                          }
                          disabled={isSyncing}
                          className="min-h-[44px] w-full rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                        >
                          {isSyncing
                            ? "Syncing..."
                            : "Sync Now"}
                        </button>
                      ) : (
                        <div className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-purple-50/70 px-3 py-2.5 text-xs font-bold text-[#8C8697] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                          Connected
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* NO RESULTS */}

        {!loading &&
          filteredIntegrations.length ===
            0 && (
            <div className="rounded-2xl border border-purple-200/60 bg-white px-5 py-10 text-center shadow-sm sm:rounded-[24px] sm:p-12">
              <div className="text-3xl sm:text-4xl">
                🔍
              </div>

              <h3 className="mt-4 text-sm font-black text-[#17151F] sm:text-base">
                No integrations found
              </h3>

              <p className="mt-1 text-xs font-medium text-[#6E687A] sm:text-sm">
                Try changing your search or
                filters.
              </p>
            </div>
          )}
      </div>

      {/* DETAILS MODAL */}

      {details && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 px-3 py-4 backdrop-blur-[4px] sm:px-4 sm:py-6"
          onClick={() => setDetails(null)}
        >
          <div
            className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[26px]"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-purple-50 px-4 py-4 sm:px-7 sm:py-6">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-black text-[#17151F] sm:text-xl">
                  {details.name}
                </h2>

                <p className="mt-1 text-[10px] font-medium text-[#8C8697] sm:text-xs">
                  Integration Details
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetails(null)
                }
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100 sm:h-10 sm:w-10"
              >
                ×
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-7 sm:py-6">
              <div className="rounded-xl border border-purple-100/60 bg-purple-50/50 p-3.5 sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
                  Provider
                </p>

                <p className="mt-1 break-all text-xs font-black text-[#17151F] sm:text-sm">
                  {details.key}
                </p>
              </div>

              <div className="rounded-xl border border-purple-100/60 bg-purple-50/50 p-3.5 sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
                  Status
                </p>

                <p className="mt-1 text-xs font-black text-[#17151F] sm:text-sm">
                  {
                    getStatusInfo(
                      details.status
                    ).text
                  }
                </p>
              </div>

              <div className="rounded-xl border border-purple-100/60 bg-purple-50/50 p-3.5 sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
                  Configuration
                </p>

                <p
                  className={`mt-1 text-xs font-black sm:text-sm ${
                    details.configured
                      ? "text-emerald-600"
                      : "text-gray-500"
                  }`}
                >
                  {details.configured
                    ? "Configured"
                    : "Not Configured"}
                </p>
              </div>

              <div className="rounded-xl border border-purple-100/60 bg-purple-50/50 p-3.5 sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:text-[11px] sm:tracking-[0.14em]">
                  Last Synced
                </p>

                <p className="mt-1 break-words text-xs font-black text-[#55515F] sm:text-sm">
                  {formatDate(
                    details.lastSyncedAt
                  )}
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-stretch border-t border-purple-50 bg-purple-50/20 px-4 py-3 sm:justify-end sm:px-7 sm:py-4">
              <button
                type="button"
                onClick={() =>
                  setDetails(null)
                }
                className="w-full rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg sm:w-auto sm:rounded-2xl sm:py-3 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Integrations;