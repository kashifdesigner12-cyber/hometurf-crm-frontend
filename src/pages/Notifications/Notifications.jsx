import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  MessageSquare,
  Phone,
  CalendarDays,
  UserPlus,
  Star,
  Briefcase,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [readFilter, setReadFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // TOKEN
  // ==========================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // ==========================================
  // API ERROR
  // ==========================================

  const handleApiError = async (response) => {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (data?.message) {
        message = data.message;
      }
    } catch {
      // Ignore invalid JSON
    }

    throw new Error(message);
  };

  // ==========================================
  // GET NOTIFICATIONS
  // ==========================================

  const loadNotifications = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications?limit=100`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        await handleApiError(response);
      }

      const result = await response.json();

      const data = Array.isArray(result?.data)
        ? result.data
        : [];

      setNotifications(data);

      setUnreadCount(
        Number(result?.unreadCount || 0)
      );
    } catch (err) {
      console.error(
        "Failed to load notifications:",
        err
      );

      setNotifications([]);
      setUnreadCount(0);

      setError(
        err?.message ||
          "Failed to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // ==========================================
  // MARK SINGLE AS READ
  // ==========================================

  const markAsRead = async (id) => {
    if (!id) return;

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        await handleApiError(response);
      }

      const result = await response.json();

      const updatedNotification =
        result?.data;

      if (updatedNotification?._id) {
        setNotifications((previous) =>
          previous.map((item) =>
            item._id ===
            updatedNotification._id
              ? updatedNotification
              : item
          )
        );
      } else {
        setNotifications((previous) =>
          previous.map((item) =>
            item._id === id
              ? {
                  ...item,
                  read: true,
                }
              : item
          )
        );
      }

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      setError(
        err?.message ||
          "Failed to mark notification as read."
      );
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        await handleApiError(response);
      }

      await response.json();

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          read: true,
        }))
      );

      setUnreadCount(0);

      setSuccess(
        "All notifications marked as read."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setError(
        err?.message ||
          "Failed to mark all notifications as read."
      );
    }
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filteredNotifications = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return notifications.filter((notification) => {
      const title =
        notification?.title || "";

      const message =
        notification?.message || "";

      const type =
        notification?.type || "";

      const referenceType =
        notification?.referenceType || "";

      const matchesSearch =
        !searchValue ||
        title
          .toLowerCase()
          .includes(searchValue) ||
        message
          .toLowerCase()
          .includes(searchValue) ||
        type
          .toLowerCase()
          .includes(searchValue) ||
        referenceType
          .toLowerCase()
          .includes(searchValue);

      const matchesType =
        typeFilter === "All" ||
        type === typeFilter;

      const matchesRead =
        readFilter === "All" ||
        (readFilter === "Unread" &&
          notification?.read === false) ||
        (readFilter === "Read" &&
          notification?.read === true);

      return (
        matchesSearch &&
        matchesType &&
        matchesRead
      );
    });
  }, [
    notifications,
    search,
    typeFilter,
    readFilter,
  ]);

  // ==========================================
  // TYPE LABEL
  // ==========================================

  const getTypeLabel = (type) => {
    const labels = {
      NEW_LEAD: "New Lead",
      NEW_MESSAGE: "New Message",
      NEW_CALL: "New Call",
      MISSED_CALL: "Missed Call",
      NEW_APPOINTMENT: "New Appointment",
      SERVICE_COMPLETED: "Service Completed",
      NEW_REVIEW: "New Review",
    };

    return labels[type] || "Notification";
  };

  // ==========================================
  // TYPE ICON
  // ==========================================

  const getTypeIcon = (type) => {
    switch (type) {
      case "NEW_LEAD":
        return <UserPlus size={18} />;

      case "NEW_MESSAGE":
        return <MessageSquare size={18} />;

      case "NEW_CALL":
      case "MISSED_CALL":
        return <Phone size={18} />;

      case "NEW_APPOINTMENT":
        return <CalendarDays size={18} />;

      case "SERVICE_COMPLETED":
        return <Briefcase size={18} />;

      case "NEW_REVIEW":
        return <Star size={18} />;

      default:
        return <Bell size={18} />;
    }
  };

  // ==========================================
  // TYPE COLOR
  // ==========================================

  const getTypeColor = (type) => {
    switch (type) {
      case "NEW_LEAD":
        return "bg-blue-100 text-blue-700";

      case "NEW_MESSAGE":
        return "bg-purple-100 text-purple-700";

      case "NEW_CALL":
        return "bg-emerald-100 text-emerald-700";

      case "MISSED_CALL":
        return "bg-red-100 text-red-700";

      case "NEW_APPOINTMENT":
        return "bg-amber-100 text-amber-700";

      case "SERVICE_COMPLETED":
        return "bg-green-100 text-green-700";

      case "NEW_REVIEW":
        return "bg-indigo-100 text-indigo-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==========================================
  // REFERENCE
  // ==========================================

  const getReference = (notification) => {
    if (!notification?.referenceId) {
      return null;
    }

    if (
      typeof notification.referenceId ===
      "object"
    ) {
      return (
        notification.referenceId?._id ||
        null
      );
    }

    return notification.referenceId;
  };

  // ==========================================
  // RELATIVE TIME
  // ==========================================

  const formatRelativeTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const now = new Date();

    const difference =
      now.getTime() -
      parsedDate.getTime();

    const seconds = Math.floor(
      difference / 1000
    );

    if (seconds < 60) {
      return "just now";
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes} minute${
        minutes === 1 ? "" : "s"
      } ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days} day${
        days === 1 ? "" : "s"
      } ago`;
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <section className="min-h-full w-full bg-[#f8f9fc] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1000px]">

        {/* ======================================
            MAIN NOTIFICATION CARD
        ====================================== */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_rgba(30,30,50,0.08)] sm:rounded-3xl">

          {/* ====================================
              HEADER
          ==================================== */}

          <div className="border-b border-gray-100 px-4 py-5 sm:px-7 sm:py-6 lg:px-9">
            <div className="flex flex-col gap-5">

              {/* HEADER TOP */}

              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5E52B7] text-white shadow-sm sm:h-11 sm:w-11">
                    <Bell size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-extrabold tracking-tight text-[#17151F] sm:text-2xl">
                        Notifications
                      </h1>

                      {unreadCount > 0 && (
                        <span className="inline-flex min-w-[24px] items-center justify-center rounded-md bg-[#5E52B7] px-2 py-0.5 text-xs font-extrabold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 hidden text-xs font-medium text-gray-400 sm:block">
                      Stay up to date with your latest
                      activity
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#6E687A] transition hover:text-[#5E52B7] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                >
                  <CheckCheck size={16} />

                  <span className="hidden sm:inline">
                    Mark all as read
                  </span>

                  <span className="sm:hidden">
                    Mark all
                  </span>
                </button>
              </div>

              {/* FILTERS */}

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search notifications..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-xs font-medium text-gray-700 outline-none transition focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-50 sm:flex-1 sm:text-sm"
                />

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-600 outline-none focus:border-[#5E52B7] focus:bg-white sm:min-w-[145px] sm:text-sm"
                >
                  <option value="All">
                    All types
                  </option>

                  <option value="NEW_LEAD">
                    New Lead
                  </option>

                  <option value="NEW_MESSAGE">
                    New Message
                  </option>

                  <option value="NEW_CALL">
                    New Call
                  </option>

                  <option value="MISSED_CALL">
                    Missed Call
                  </option>

                  <option value="NEW_APPOINTMENT">
                    New Appointment
                  </option>

                  <option value="SERVICE_COMPLETED">
                    Service Completed
                  </option>

                  <option value="NEW_REVIEW">
                    New Review
                  </option>
                </select>

                <select
                  value={readFilter}
                  onChange={(event) =>
                    setReadFilter(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-600 outline-none focus:border-[#5E52B7] focus:bg-white sm:min-w-[120px] sm:text-sm"
                >
                  <option value="All">
                    All
                  </option>

                  <option value="Unread">
                    Unread
                  </option>

                  <option value="Read">
                    Read
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    loadNotifications(false)
                  }
                  disabled={refreshing}
                  className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-gray-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-[#5E52B7] disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ====================================
              SUCCESS
          ==================================== */}

          {success && (
            <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 sm:px-7">
              {success}
            </div>
          )}

          {/* ====================================
              ERROR
          ==================================== */}

          {error && (
            <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 sm:px-7">
              <span className="break-words">
                {error}
              </span>

              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 font-bold hover:underline"
              >
                Close
              </button>
            </div>
          )}

          {/* ====================================
              LOADING
          ==================================== */}

          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="flex gap-3 px-4 py-5 sm:gap-4 sm:px-7 sm:py-6 lg:px-9"
                  >
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />

                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />

                      <div className="h-3 w-full max-w-[550px] animate-pulse rounded bg-gray-100" />

                      <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : filteredNotifications.length ===
            0 ? (
            /* ==================================
               EMPTY STATE
            ================================== */

            <div className="flex min-h-[350px] flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Bell size={28} />
              </div>

              <h3 className="mt-5 text-base font-extrabold text-[#17151F]">
                No notifications
              </h3>

              <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-gray-400 sm:text-sm">
                {search ||
                typeFilter !== "All" ||
                readFilter !== "All"
                  ? "No notifications match your current filters."
                  : "You're all caught up. New notifications will appear here."}
              </p>
            </div>
          ) : (
            /* ==================================
               NOTIFICATION LIST
            ================================== */

            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(
                (notification) => {
                  const isUnread =
                    notification.read === false;

                  const reference =
                    getReference(
                      notification
                    );

                  return (
                    <div
                      key={notification._id}
                      className={`relative flex gap-3 px-4 py-4 transition-colors duration-200 sm:gap-4 sm:px-7 sm:py-5 lg:px-9 ${
                        isUnread
                          ? "bg-[#f6f5ff] hover:bg-[#f1efff]"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >

                      {/* UNREAD BAR */}

                      {isUnread && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#5E52B7]" />
                      )}

                      {/* ICON */}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeIcon(
                          notification.type
                        )}
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        {/* TITLE + TIME */}

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`break-words text-xs leading-5 sm:text-sm ${
                                isUnread
                                  ? "font-extrabold text-[#17151F]"
                                  : "font-semibold text-[#4E4A55]"
                              }`}
                            >
                              {notification.title ||
                                "Notification"}
                            </p>
                          </div>

                          <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-gray-400 sm:text-xs">
                            {formatRelativeTime(
                              notification.createdAt
                            )}
                          </span>
                        </div>

                        {/* MESSAGE */}

                        <p
                          className={`mt-1 text-xs leading-5 sm:text-sm sm:leading-6 ${
                            isUnread
                              ? "font-medium text-[#5E5965]"
                              : "font-normal text-[#8C8891]"
                          }`}
                        >
                          {notification.message ||
                            "You have a new notification."}
                        </p>

                        {/* REFERENCE */}

                        {reference && (
                          <div className="mt-1">
                            <span className="break-all text-xs font-extrabold text-[#5E52B7]">
                              {reference}
                            </span>
                          </div>
                        )}

                        {/* BOTTOM */}

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${getTypeColor(
                              notification.type
                            )}`}
                          >
                            {getTypeIcon(
                              notification.type
                            )}

                            {getTypeLabel(
                              notification.type
                            )}
                          </span>

                          {notification.referenceType && (
                            <span className="text-[10px] font-medium text-gray-400 sm:text-xs">
                              {
                                notification.referenceType
                              }
                            </span>
                          )}

                          {isUnread ? (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification._id
                                )
                              }
                              className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#5E52B7] shadow-sm ring-1 ring-purple-100 transition hover:bg-[#5E52B7] hover:text-white sm:text-xs"
                            >
                              <Check size={13} />
                              Mark as read
                            </button>
                          ) : (
                            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 sm:text-xs">
                              <Check size={13} />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* ====================================
              FOOTER
          ==================================== */}

          {!loading &&
            notifications.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:px-7">
                <div className="flex flex-col gap-1 text-[10px] font-semibold text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
                  <span>
                    Showing{" "}
                    <strong className="text-gray-700">
                      {
                        filteredNotifications.length
                      }
                    </strong>{" "}
                    of{" "}
                    <strong className="text-gray-700">
                      {notifications.length}
                    </strong>{" "}
                    notifications
                  </span>

                  <span>
                    <strong className="text-[#5E52B7]">
                      {unreadCount}
                    </strong>{" "}
                    unread
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default Notifications;