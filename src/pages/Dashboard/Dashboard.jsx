import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  CalendarDays,
  Star,
  ArrowRight,
  Plus,
  Clock3,
  Mail,
  ChevronRight,
  RefreshCw,
  Phone,
  CheckCircle2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";

/* =========================================================
   API CONFIG & HELPERS
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

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
      result?.message || "Something went wrong while loading dashboard data."
    );
  }

  return result;
};

const getDashboardSummary = async () => {
  const result = await apiRequest("/dashboard");
  return result?.data || {};
};

const getRecentLeads = async () => {
  const result = await apiRequest("/leads");
  const leads = Array.isArray(result?.data) ? result.data : [];

  return [...leads]
    .sort((a, b) => {
      const dateA = new Date(
        a?.createdAt || a?.updatedAt || 0
      ).getTime();

      const dateB = new Date(
        b?.createdAt || b?.updatedAt || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);
};

const getUpcomingAppointments = async () => {
  const result = await apiRequest("/appointments?status=PENDING");

  const appointments = Array.isArray(result?.data)
    ? result.data
    : [];

  const now = new Date();

  let confirmedAppointments = [];

  try {
    const confirmedResult = await apiRequest(
      "/appointments?status=CONFIRMED"
    );

    confirmedAppointments = Array.isArray(confirmedResult?.data)
      ? confirmedResult.data
      : [];
  } catch (error) {
    console.warn(
      "Could not load confirmed appointments:",
      error
    );
  }

  const combined = [
    ...appointments,
    ...confirmedAppointments,
  ];

  const uniqueAppointments = Array.from(
    new Map(
      combined.map((appt) => [appt?._id, appt])
    ).values()
  );

  return uniqueAppointments
    .filter((appt) => {
      if (!appt?.date) return true;

      const apptDate = new Date(appt.date);

      return (
        !Number.isNaN(apptDate.getTime()) &&
        apptDate >=
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          )
      );
    })
    .sort(
      (a, b) =>
        new Date(a?.date || 0) -
        new Date(b?.date || 0)
    )
    .slice(0, 5);
};

/* =========================================================
   DASHBOARD COMPONENT
========================================================= */

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] =
    useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingAppointments, setLoadingAppointments] =
    useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setDashboardError("");

    await Promise.allSettled([
      loadSummary(),
      loadRecentLeads(),
      loadUpcomingAppointments(),
    ]);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);

      const data = await getDashboardSummary();

      setSummary(data);
    } catch (error) {
      console.error("Dashboard summary error:", error);

      setSummary(null);

      setDashboardError(
        error?.message ||
          "Unable to load dashboard summary."
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadRecentLeads = async () => {
    try {
      setLoadingLeads(true);

      const leads = await getRecentLeads();

      setRecentLeads(leads);
    } catch (error) {
      console.error("Recent leads error:", error);

      setRecentLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const appointments =
        await getUpcomingAppointments();

      setUpcomingAppointments(appointments);
    } catch (error) {
      console.error(
        "Upcoming appointments error:",
        error
      );

      setUpcomingAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const stats = [
    {
      title: "Total Leads",
      value: summary?.totalLeads,
      icon: Users,
      iconBg: "bg-purple-100/80",
      iconColor: "text-[#5E52B7]",
      glow: "group-hover:bg-purple-300/40",
    },
    {
      title: "Customers",
      value: summary?.totalCustomers,
      icon: UserRound,
      iconBg: "bg-blue-100/80",
      iconColor: "text-blue-600",
      glow: "group-hover:bg-blue-300/40",
    },
    {
      title: "Appointments",
      value: summary?.totalAppointments,
      icon: CalendarDays,
      iconBg: "bg-amber-100/80",
      iconColor: "text-amber-600",
      glow: "group-hover:bg-amber-300/40",
    },
    {
      title: "Reviews",
      value: summary?.reviewsReceived,
      icon: Star,
      iconBg: "bg-pink-100/80",
      iconColor: "text-pink-600",
      glow: "group-hover:bg-pink-300/40",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes dashboardFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes dashboardSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .dashboard-fade-in {
          animation: dashboardFadeIn
            0.6s
            cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .dashboard-slide-up {
          animation: dashboardSlideUp
            0.65s
            cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .pulse-glow-effect {
          animation: pulseGlow 4s ease-in-out infinite;
        }

        .dashboard-delay-1 {
          animation-delay: 100ms;
        }

        .dashboard-delay-2 {
          animation-delay: 200ms;
        }

        .dashboard-delay-3 {
          animation-delay: 300ms;
        }

        .dashboard-delay-4 {
          animation-delay: 400ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-fade-in,
          .dashboard-slide-up,
          .pulse-glow-effect {
            animation: none !important;
          }
        }
      `}</style>

      <section
        className="
          min-h-full
          w-full
          overflow-x-hidden
          bg-[#F8FAFC]
          px-3
          pb-16
          pt-2
          transition-all
          duration-300
          sm:px-4
          md:px-6
          lg:px-7
          xl:px-8
          2xl:px-10
        "
      >
        {/* =====================================================
            HEADER SECTION
        ====================================================== */}

        <div
          className="
            dashboard-fade-in
            mx-auto
            mb-5
            w-full
            max-w-[1800px]
            overflow-hidden
            rounded-[20px]
            border
            border-purple-200/60
            bg-white
            shadow-[0_15px_50px_rgba(94,82,183,0.08)]
            backdrop-blur-xl
            sm:mb-7
            sm:rounded-[24px]
            lg:rounded-[28px]
          "
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="
                  pulse-glow-effect
                  absolute
                  -right-20
                  -top-20
                  h-56
                  w-56
                  rounded-full
                  bg-purple-200/55
                  blur-3xl
                  sm:-right-16
                  sm:-top-20
                  sm:h-72
                  sm:w-72
                "
              />

              <div
                className="
                  pulse-glow-effect
                  absolute
                  -bottom-20
                  left-[35%]
                  h-52
                  w-52
                  rounded-full
                  bg-indigo-200/40
                  blur-3xl
                  sm:h-64
                  sm:w-64
                "
              />
            </div>

            <div
              className="
                relative
                px-4
                py-6
                sm:px-6
                sm:py-7
                md:px-7
                md:py-8
                lg:px-10
                lg:py-9
                xl:py-10
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-6
                  xl:flex-row
                  xl:items-center
                  xl:justify-between
                  xl:gap-8
                "
              >
                {/* HEADER TEXT */}

                <div className="min-w-0 max-w-3xl">
                  <h1
                    className="
                      text-[26px]
                      font-black
                      leading-[1.15]
                      tracking-[-0.045em]
                      text-[#17151F]
                      sm:text-[31px]
                      md:text-[36px]
                      lg:text-[40px]
                      xl:text-[42px]
                    "
                  >
                    Welcome back,
                    <span
                      className="
                        ml-1.5
                        inline
                        bg-gradient-to-r
                        from-[#5E52B7]
                        via-indigo-600
                        to-purple-800
                        bg-clip-text
                        text-transparent
                        sm:ml-2.5
                      "
                    >
                      HomeTurf
                    </span>
                  </h1>

                  <p
                    className="
                      mt-3
                      max-w-2xl
                      text-[12px]
                      font-medium
                      leading-relaxed
                      text-[#6E687A]
                      sm:mt-3.5
                      sm:text-[14px]
                      md:text-[15px]
                    "
                  >
                    Manage your leads, customers,
                    appointments and customer
                    relationships seamlessly from one
                    central workspace.
                  </p>

                  {dashboardError && (
                    <div
                      className="
                        mt-4
                        flex
                        max-w-full
                        items-start
                        gap-2
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-3
                        py-3
                        text-xs
                        font-semibold
                        text-red-600
                        shadow-sm
                        sm:mt-5
                        sm:px-4
                      "
                    >
                      <Activity
                        size={16}
                        className="mt-0.5 shrink-0"
                      />

                      <span className="break-words">
                        {dashboardError}
                      </span>
                    </div>
                  )}
                </div>

                {/* HEADER ACTIONS */}

                <div
                  className="
                    grid
                    w-full
                    grid-cols-1
                    gap-2.5
                    sm:grid-cols-2
                    sm:gap-3
                    xl:flex
                    xl:w-auto
                    xl:shrink-0
                  "
                >
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="
                      group
                      inline-flex
                      min-h-[46px]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      whitespace-nowrap
                      rounded-2xl
                      border
                      border-purple-200/80
                      bg-white
                      px-4
                      py-3
                      text-sm
                      font-bold
                      text-[#55515F]
                      shadow-sm
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:border-[#5E52B7]
                      hover:bg-purple-50/80
                      hover:text-[#5E52B7]
                      hover:shadow-md
                      active:scale-95
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      sm:px-5
                      xl:w-auto
                    "
                  >
                    <RefreshCw
                      size={17}
                      className={`transition-transform duration-700 ${
                        refreshing
                          ? "animate-spin text-[#5E52B7]"
                          : "group-hover:rotate-180"
                      }`}
                    />

                    <span>Refresh Data</span>
                  </button>

                  <Link
                    to="/appointments"
                    className="
                      group
                      inline-flex
                      min-h-[46px]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      whitespace-nowrap
                      rounded-2xl
                      border
                      border-purple-200/80
                      bg-white
                      px-4
                      py-3
                      text-sm
                      font-bold
                      text-[#55515F]
                      shadow-sm
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:border-[#5E52B7]
                      hover:bg-purple-50/80
                      hover:text-[#5E52B7]
                      hover:shadow-md
                      active:scale-95
                      sm:px-5
                      xl:w-auto
                    "
                  >
                    <CalendarDays
                      size={17}
                      className="text-[#5E52B7]"
                    />

                    <span>Appointments</span>
                  </Link>

                  <Link
                    to="/leads"
                    className="
                      group
                      relative
                      inline-flex
                      min-h-[46px]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      overflow-hidden
                      whitespace-nowrap
                      rounded-2xl
                      bg-gradient-to-r
                      from-[#5E52B7]
                      to-indigo-600
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      shadow-[0_10px_25px_rgba(94,82,183,0.3)]
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:shadow-[0_15px_35px_rgba(94,82,183,0.45)]
                      active:scale-95
                      sm:col-span-2
                      sm:px-6
                      xl:w-auto
                    "
                  >
                    <span
                      className="
                        absolute
                        inset-0
                        -translate-x-full
                        bg-gradient-to-r
                        from-transparent
                        via-white/25
                        to-transparent
                        transition-transform
                        duration-700
                        group-hover:translate-x-full
                      "
                    />

                    <Plus
                      size={18}
                      className="
                        relative
                        shrink-0
                        transition-transform
                        duration-500
                        group-hover:rotate-180
                      "
                    />

                    <span className="relative tracking-wide">
                      Add New Lead
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <div
          className="
            mx-auto
            mb-5
            grid
            w-full
            max-w-[1800px]
            grid-cols-1
            gap-3.5
            sm:mb-7
            sm:grid-cols-2
            sm:gap-4
            md:gap-5
            lg:gap-6
            xl:grid-cols-4
          "
        >
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
              className="dashboard-slide-up min-w-0"
            >
              <StatCard
                {...stat}
                loading={loadingSummary}
              />
            </div>
          ))}
        </div>

        {/* =====================================================
            EXTRA METRICS
        ====================================================== */}

        {!loadingSummary && summary && (
          <div
            className="
              mx-auto
              mb-5
              grid
              w-full
              max-w-[1800px]
              grid-cols-1
              gap-3.5
              sm:mb-7
              sm:grid-cols-2
              sm:gap-4
              md:gap-5
              lg:grid-cols-4
              lg:gap-6
            "
          >
            <div className="dashboard-slide-up dashboard-delay-1">
              <MetricMiniCard
                title="New Leads"
                value={summary.newLeads}
                description="Currently new"
                icon={TrendingUp}
              />
            </div>

            <div className="dashboard-slide-up dashboard-delay-2">
              <MetricMiniCard
                title="Completed Services"
                value={summary.completedServices}
                description="Completed appointments"
                icon={CheckCircle2}
              />
            </div>

            <div className="dashboard-slide-up dashboard-delay-3">
              <MetricMiniCard
                title="Total Calls"
                value={summary.totalCalls}
                description="All recorded calls"
                icon={Phone}
              />
            </div>

            <div className="dashboard-slide-up dashboard-delay-4">
              <MetricMiniCard
                title="Pending Reviews"
                value={summary.pendingReviews}
                description="Reviews requiring action"
                icon={Star}
              />
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1800px]
            grid-cols-1
            gap-5
            lg:gap-6
            xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]
            xl:gap-8
          "
        >
          {/* ===================================================
              RECENT LEADS
          ==================================================== */}

          <div
            className="
              dashboard-slide-up
              min-w-0
              overflow-hidden
              rounded-[20px]
              border
              border-purple-200/60
              bg-white
              shadow-[0_10px_35px_rgba(94,82,183,0.05)]
              sm:rounded-[24px]
            "
          >
            {/* SECTION HEADER */}

            <div
              className="
                flex
                flex-col
                gap-3
                border-b
                border-purple-50
                px-4
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-6
                sm:py-5
                lg:px-8
                lg:py-6
              "
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-purple-100
                      to-indigo-100
                      text-[#5E52B7]
                      sm:h-11
                      sm:w-11
                    "
                  >
                    <Users size={20} />
                  </div>

                  <h2
                    className="
                      truncate
                      text-[15px]
                      font-black
                      text-[#24212C]
                      sm:text-[17px]
                    "
                  >
                    Recent Leads
                  </h2>
                </div>

                <p
                  className="
                    mt-1.5
                    pl-[52px]
                    text-[10px]
                    font-medium
                    text-[#9995A3]
                    sm:pl-[56px]
                    sm:text-xs
                  "
                >
                  Latest leads added to your CRM
                </p>
              </div>

              <Link
                to="/leads"
                className="
                  inline-flex
                  w-fit
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-xl
                  px-3.5
                  py-2
                  text-xs
                  font-bold
                  text-[#5E52B7]
                  transition-colors
                  hover:bg-purple-100/60
                "
              >
                View all
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* LOADING */}

            {loadingLeads ? (
              <TableSkeleton />
            ) : recentLeads.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No leads found"
                description="New leads will appear here when they are added."
              />
            ) : (
              <>
                {/* =============================================
                    DESKTOP TABLE
                ============================================== */}

                <div className="hidden w-full overflow-x-auto md:block">
                  <table className="w-full min-w-[650px]">
                    <thead>
                      <tr className="border-b border-purple-50 bg-purple-50/40">
                        <th
                          className="
                            px-5
                            py-4
                            text-left
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.14em]
                            text-[#8C8697]
                            sm:px-8
                          "
                        >
                          Lead
                        </th>

                        <th
                          className="
                            px-4
                            py-4
                            text-left
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.14em]
                            text-[#8C8697]
                          "
                        >
                          Email
                        </th>

                        <th
                          className="
                            px-4
                            py-4
                            text-left
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.14em]
                            text-[#8C8697]
                          "
                        >
                          Source
                        </th>

                        <th
                          className="
                            px-4
                            py-4
                            text-left
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.14em]
                            text-[#8C8697]
                          "
                        >
                          Status
                        </th>

                        <th
                          className="
                            px-5
                            py-4
                            text-right
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.14em]
                            text-[#8C8697]
                            sm:px-8
                          "
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentLeads.map((lead, index) => (
                        <LeadRow
                          key={lead._id}
                          lead={lead}
                          index={index}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* =============================================
                    MOBILE LEAD CARDS
                ============================================== */}

                <div className="divide-y divide-purple-50 md:hidden">
                  {recentLeads.map((lead, index) => (
                    <MobileLeadCard
                      key={lead._id}
                      lead={lead}
                      index={index}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ===================================================
              UPCOMING APPOINTMENTS
          ==================================================== */}

          <div
            className="
              dashboard-slide-up
              dashboard-delay-2
              min-w-0
              overflow-hidden
              rounded-[20px]
              border
              border-purple-200/60
              bg-white
              shadow-[0_10px_35px_rgba(94,82,183,0.05)]
              sm:rounded-[24px]
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                border-b
                border-purple-50
                px-4
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-6
                sm:py-5
                lg:px-8
                lg:py-6
              "
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-blue-100
                      to-purple-100
                      text-[#5E52B7]
                      sm:h-11
                      sm:w-11
                    "
                  >
                    <CalendarDays size={20} />
                  </div>

                  <h2
                    className="
                      truncate
                      text-[15px]
                      font-black
                      text-[#24212C]
                      sm:text-[17px]
                    "
                  >
                    Upcoming Appointments
                  </h2>
                </div>

                <p
                  className="
                    mt-1.5
                    pl-[52px]
                    text-[10px]
                    font-medium
                    text-[#9995A3]
                    sm:pl-[56px]
                    sm:text-xs
                  "
                >
                  Your next customer appointments
                </p>
              </div>

              <Link
                to="/appointments"
                className="
                  inline-flex
                  w-fit
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-xl
                  px-3.5
                  py-2
                  text-xs
                  font-bold
                  text-[#5E52B7]
                  transition-colors
                  hover:bg-purple-100/60
                "
              >
                View all
                <ArrowRight size={15} />
              </Link>
            </div>

            {loadingAppointments ? (
              <AppointmentSkeleton />
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Upcoming appointments will appear here."
              />
            ) : (
              <div className="divide-y divide-purple-50">
                {upcomingAppointments.map(
                  (appointment, index) => (
                    <AppointmentItem
                      key={appointment._id}
                      appointment={appointment}
                      index={index}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  glow,
  loading,
}) => (
  <div
    className="
      group
      relative
      min-h-[145px]
      overflow-hidden
      rounded-[20px]
      border
      border-purple-200/70
      bg-white
      p-4
      shadow-[0_6px_25px_rgba(94,82,183,0.04)]
      transition-all
      duration-500
      hover:-translate-y-2
      hover:border-[#5E52B7]
      sm:min-h-[165px]
      sm:rounded-[22px]
      sm:p-6
      lg:p-7
    "
  >
    <div
      className={`
        absolute
        -right-12
        -top-12
        h-36
        w-36
        rounded-full
        opacity-0
        blur-3xl
        transition-all
        duration-700
        group-hover:opacity-100
        ${glow}
      `}
    />

    <div
      className="
        absolute
        left-0
        right-0
        top-0
        h-[3px]
        origin-left
        scale-x-0
        bg-gradient-to-r
        from-[#5E52B7]
        via-indigo-500
        to-purple-700
        transition-transform
        duration-500
        group-hover:scale-x-100
      "
    />

    <div className="relative flex h-full items-start justify-between gap-3">
      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-extrabold
            uppercase
            tracking-[0.14em]
            text-[#8C8697]
            sm:text-[11px]
          "
        >
          {title}
        </p>

        {loading ? (
          <div
            className="
              mt-4
              h-9
              w-20
              animate-pulse
              rounded-xl
              bg-purple-100/80
              sm:h-10
              sm:w-24
            "
          />
        ) : (
          <p
            className="
              mt-3
              text-[27px]
              font-black
              tracking-[-0.04em]
              text-[#191720]
              sm:text-[32px]
              md:text-[34px]
            "
          >
            {value ?? "0"}
          </p>
        )}

        <div
          className="
            mt-3
            flex
            min-w-0
            items-center
            gap-1.5
            text-[9px]
            font-semibold
            text-[#8C8697]
            sm:mt-4
            sm:text-[11px]
          "
        >
          <Activity
            size={12}
            className="
              shrink-0
              animate-pulse
              text-[#5E52B7]
            "
          />

          <span className="truncate">
            Live data updated
          </span>
        </div>
      </div>

      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-2xl
          ${iconBg}
          ${iconColor}
          shadow-sm
          sm:h-14
          sm:w-14
        `}
      >
        <Icon
          size={21}
          strokeWidth={2.2}
          className="sm:h-[22px] sm:w-[22px]"
        />
      </div>
    </div>
  </div>
);

/* =========================================================
   MINI METRIC CARD
========================================================= */

const MetricMiniCard = ({
  title,
  value,
  description,
  icon: Icon = TrendingUp,
}) => (
  <div
    className="
      group
      relative
      min-h-[115px]
      overflow-hidden
      rounded-[20px]
      border
      border-purple-200/75
      bg-white
      px-4
      py-4
      shadow-[0_6px_25px_rgba(94,82,183,0.035)]
      transition-all
      duration-400
      hover:-translate-y-1.5
      hover:border-[#5E52B7]
      sm:min-h-[130px]
      sm:rounded-[22px]
      sm:px-6
      sm:py-5
      lg:px-7
      lg:py-6
    "
  >
    <div className="relative flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p
          className="
            truncate
            text-[9px]
            font-extrabold
            uppercase
            tracking-[0.14em]
            text-[#8C8697]
            sm:text-[11px]
          "
        >
          {title}
        </p>

        <p
          className="
            mt-2
            text-[24px]
            font-black
            tracking-[-0.03em]
            text-[#191720]
            sm:text-[28px]
          "
        >
          {value ?? 0}
        </p>

        <p
          className="
            mt-1
            truncate
            text-[9px]
            font-medium
            text-[#9E98A6]
            sm:text-[11px]
          "
        >
          {description}
        </p>
      </div>

      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-purple-100/80
          text-[#5E52B7]
          sm:h-12
          sm:w-12
        "
      >
        <Icon size={19} />
      </div>
    </div>
  </div>
);

/* =========================================================
   DESKTOP LEAD ROW
========================================================= */

const LeadRow = ({ lead, index }) => {
  const name = lead?.name || "—";

  return (
    <tr
      style={{
        animationDelay: `${index * 70}ms`,
      }}
      className="
        dashboard-fade-in
        group
        border-b
        border-purple-50
        transition-all
        duration-300
        hover:bg-purple-50/50
      "
    >
      <td className="px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3.5">
          <div
            className="
              relative
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-purple-100
              to-indigo-100
              text-[12px]
              font-black
              text-[#5E52B7]
              sm:h-11
              sm:w-11
            "
          >
            {getInitials(name)}
          </div>

          <div className="min-w-0">
            <p
              className="
                max-w-[180px]
                truncate
                text-sm
                font-bold
                text-[#33303A]
                group-hover:text-[#5E52B7]
              "
            >
              {name}
            </p>

            {lead?.phone && (
              <p
                className="
                  mt-0.5
                  truncate
                  text-[11px]
                  font-medium
                  text-[#A09CA7]
                "
              >
                {lead.phone}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="flex items-center gap-2 text-sm text-[#77737E]">
          <Mail
            size={15}
            className="shrink-0 text-[#5E52B7]"
          />

          <span className="max-w-[180px] truncate font-medium">
            {lead?.email || "—"}
          </span>
        </div>
      </td>

      <td className="px-4 py-5">
        <span
          className="
            inline-flex
            max-w-[130px]
            truncate
            rounded-xl
            border
            border-purple-200/80
            bg-purple-50/70
            px-3
            py-1.5
            text-[11px]
            font-bold
            text-[#5E52B7]
          "
        >
          {formatSource(lead?.source)}
        </span>
      </td>

      <td className="px-4 py-5">
        <StatusBadge status={lead?.status} />
      </td>

      <td className="px-5 py-5 text-right sm:px-8">
        <Link
          to={`/leads/${lead?._id}`}
          className="
            inline-flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-purple-50
            text-[#5E52B7]
            transition-all
            duration-200
            hover:bg-[#5E52B7]
            hover:text-white
            active:scale-95
          "
        >
          <ChevronRight size={18} />
        </Link>
      </td>
    </tr>
  );
};

/* =========================================================
   MOBILE LEAD CARD
========================================================= */

const MobileLeadCard = ({ lead, index }) => {
  const name = lead?.name || "—";

  return (
    <div
      style={{
        animationDelay: `${index * 70}ms`,
      }}
      className="
        dashboard-fade-in
        px-4
        py-4
        transition-all
        duration-300
        active:bg-purple-50/50
        sm:px-6
      "
    >
      <div className="flex min-w-0 items-start gap-3">
        {/* Avatar */}

        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-purple-100
            to-indigo-100
            text-[12px]
            font-black
            text-[#5E52B7]
          "
        >
          {getInitials(name)}
        </div>

        {/* Main Content */}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-sm
                  font-extrabold
                  text-[#33303A]
                "
              >
                {name}
              </p>

              {lead?.phone && (
                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    font-medium
                    text-[#A09CA7]
                  "
                >
                  {lead.phone}
                </p>
              )}
            </div>

            <Link
              to={`/leads/${lead?._id}`}
              className="
                inline-flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-purple-50
                text-[#5E52B7]
                transition-all
                active:scale-95
              "
            >
              <ChevronRight size={17} />
            </Link>
          </div>

          {/* Email */}

          <div className="mt-2 flex min-w-0 items-center gap-1.5">
            <Mail
              size={13}
              className="shrink-0 text-[#5E52B7]"
            />

            <span
              className="
                min-w-0
                truncate
                text-[10px]
                font-medium
                text-[#77737E]
              "
            >
              {lead?.email || "No email"}
            </span>
          </div>

          {/* Source + Status */}

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            <span
              className="
                max-w-[140px]
                truncate
                rounded-xl
                border
                border-purple-200/80
                bg-purple-50/70
                px-2.5
                py-1
                text-[9px]
                font-bold
                text-[#5E52B7]
              "
            >
              {formatSource(lead?.source)}
            </span>

            <StatusBadge status={lead?.status} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   APPOINTMENT ITEM
========================================================= */

const AppointmentItem = ({
  appointment,
  index,
}) => {
  const customerName =
    appointment?.customer?.name || "—";

  const serviceName =
    appointment?.service || "—";

  const date = formatDate(appointment?.date);
  const time = appointment?.time || "—";

  return (
    <div
      style={{
        animationDelay: `${index * 70}ms`,
      }}
      className="
        dashboard-fade-in
        group
        px-4
        py-4
        transition-all
        duration-300
        hover:bg-purple-50/50
        sm:px-6
        sm:py-5
        lg:px-8
        lg:py-6
      "
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {/* Icon */}

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-purple-100
            to-blue-100
            text-[#5E52B7]
            sm:h-12
            sm:w-12
          "
        >
          <CalendarDays
            size={18}
            className="sm:h-5 sm:w-5"
          />
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className="
                  truncate
                  text-sm
                  font-extrabold
                  text-[#33303A]
                  group-hover:text-[#5E52B7]
                "
              >
                {customerName}
              </h3>

              <p
                className="
                  mt-1
                  truncate
                  text-[11px]
                  font-semibold
                  text-[#77737E]
                  sm:text-xs
                "
              >
                {serviceName}
              </p>
            </div>

            <StatusBadge
              status={appointment?.status}
            />
          </div>

          {/* Date / Time */}

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-x-3
              gap-y-2
              text-[10px]
              font-medium
              text-[#8C8697]
              sm:gap-x-4
              sm:text-[11px]
            "
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays
                size={13}
                className="shrink-0 text-[#5E52B7]"
              />

              <span>{date}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3
                size={13}
                className="shrink-0 text-[#5E52B7]"
              />

              <span>{time}</span>
            </span>
          </div>
        </div>

        {/* Action */}

        <Link
          to={`/appointments/${appointment?._id}`}
          className="
            inline-flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-purple-50
            text-[#5E52B7]
            transition-all
            hover:bg-[#5E52B7]
            hover:text-white
            active:scale-95
            sm:h-10
            sm:w-10
          "
        >
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();

  const statusClasses = {
    NEW: "bg-blue-100/70 text-blue-800 border-blue-200",
    CONTACTED:
      "bg-yellow-100/70 text-yellow-800 border-yellow-200",
    BOOKED:
      "bg-purple-100/70 text-purple-800 border-purple-200",
    IN_PROGRESS:
      "bg-indigo-100/70 text-indigo-800 border-indigo-200",
    COMPLETED:
      "bg-emerald-100/70 text-emerald-800 border-emerald-200",
    CANCELLED:
      "bg-red-100/70 text-red-800 border-red-200",
    PENDING:
      "bg-yellow-100/70 text-yellow-800 border-yellow-200",
    CONFIRMED:
      "bg-emerald-100/70 text-emerald-800 border-emerald-200",
    NO_SHOW:
      "bg-orange-100/70 text-orange-800 border-orange-200",
  };

  return (
    <span
      className={`
        inline-flex
        max-w-full
        whitespace-nowrap
        rounded-full
        border
        px-2
        py-1
        text-[9px]
        font-extrabold
        shadow-sm
        sm:px-3
        sm:text-[11px]
        ${
          statusClasses[normalizedStatus] ||
          "border-purple-200 bg-purple-50 text-[#5E52B7]"
        }
      `}
    >
      {formatStatus(status)}
    </span>
  );
};

/* =========================================================
   TABLE SKELETON
========================================================= */

const TableSkeleton = () => (
  <div className="divide-y divide-purple-50">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="
          flex
          items-center
          gap-4
          px-4
          py-4
          sm:gap-5
          sm:px-8
          sm:py-5
        "
      >
        <div
          className="
            h-10
            w-10
            shrink-0
            animate-pulse
            rounded-2xl
            bg-purple-100/80
            sm:h-11
            sm:w-11
          "
        />

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80" />

          <div className="h-3 w-24 animate-pulse rounded-md bg-purple-50" />
        </div>

        <div className="hidden h-7 w-20 animate-pulse rounded-xl bg-purple-50 sm:block" />
      </div>
    ))}
  </div>
);

/* =========================================================
   APPOINTMENT SKELETON
========================================================= */

const AppointmentSkeleton = () => (
  <div className="divide-y divide-purple-50">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="
          flex
          gap-3
          px-4
          py-4
          sm:gap-4
          sm:px-8
          sm:py-6
        "
      >
        <div
          className="
            h-10
            w-10
            shrink-0
            animate-pulse
            rounded-2xl
            bg-purple-100/80
            sm:h-12
            sm:w-12
          "
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3.5 w-32 animate-pulse rounded-md bg-purple-100/80" />

          <div className="h-3 w-28 animate-pulse rounded-md bg-purple-50" />

          <div className="h-3 w-36 animate-pulse rounded-md bg-purple-50" />
        </div>
      </div>
    ))}
  </div>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  icon: Icon,
  title,
  description,
}) => (
  <div
    className="
      flex
      min-h-[260px]
      flex-col
      items-center
      justify-center
      px-5
      text-center
      sm:min-h-[320px]
      sm:px-6
      lg:min-h-[350px]
    "
  >
    <div
      className="
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-3xl
        bg-gradient-to-br
        from-purple-100
        to-indigo-100
        text-[#5E52B7]
        shadow-md
        sm:h-20
        sm:w-20
      "
    >
      <Icon
        size={27}
        className="sm:h-7 sm:w-7"
      />
    </div>

    <h3
      className="
        mt-5
        text-base
        font-extrabold
        text-[#33303A]
        sm:mt-6
      "
    >
      {title}
    </h3>

    <p
      className="
        mt-2
        max-w-xs
        text-[11px]
        font-medium
        leading-relaxed
        text-[#9995A3]
        sm:text-xs
      "
    >
      {description}
    </p>
  </div>
);

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name) => {
  if (!name) return "?";

  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const formatSource = (source) => {
  if (!source) return "—";

  const sourceMap = {
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    GOOGLE: "Google",
    PHONE: "Phone",
    MANUAL: "Manual",
  };

  return (
    sourceMap[source] ||
    String(source)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

const formatStatus = (status) => {
  if (!status) return "—";

  return String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default Dashboard;