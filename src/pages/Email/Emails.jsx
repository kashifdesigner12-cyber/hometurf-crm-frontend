import { useEffect, useMemo, useState } from "react";

import {
  Mail,
  RefreshCw,
  Search,
  UserRound,
  Clock3,
  ArrowDownLeft,
  ArrowUpRight,
  LoaderCircle,
  AlertCircle,
  ChevronRight,
  Inbox,
  ArrowLeft,
  Send,
  Trash2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apihometurf.localpro1.net/api";

const getHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const formatDate = (date) => {
  if (!date) return "";

  try {
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const getInitials = (name = "") => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

/*
|--------------------------------------------------------------------------
| Extract Conversations From API Response
|--------------------------------------------------------------------------
*/

const extractConversations = (result) => {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.data?.conversations)) {
    return result.data.conversations;
  }

  if (Array.isArray(result?.conversations)) {
    return result.conversations;
  }

  return [];
};

const Emails = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);
  const [selectedConversationId, setSelectedConversationId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Reply states
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState("");

  // Delete state
  const [deletingConversation, setDeletingConversation] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Sync Gmail Inbox
  |--------------------------------------------------------------------------
  */

  const syncGmailInbox = async () => {
    try {
      setSyncing(true);

      const response = await fetch(
        `${API_BASE_URL}/emails/google/sync`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to sync Gmail inbox."
        );
      }

      console.log(
        "Gmail inbox sync result:",
        result
      );

      return result;
    } catch (err) {
      console.error(
        "Gmail sync error:",
        err
      );

      throw new Error(
        err?.message ||
          "Unable to sync Gmail inbox."
      );
    } finally {
      setSyncing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Single Conversation
  |--------------------------------------------------------------------------
  */

  const loadConversation = async (id) => {
    if (!id) return;

    try {
      setConversationLoading(true);
      setError("");
      setReplyError("");
      setReplySuccess("");
      setReplyText("");
      setSelectedConversationId(id);

      const response = await fetch(
        `${API_BASE_URL}/emails/conversations/${id}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to load email conversation."
        );
      }

      setSelectedConversation(
        result?.data || null
      );
    } catch (err) {
      console.error(
        "Email conversation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load email conversation."
      );

      setSelectedConversation(null);
    } finally {
      setConversationLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Conversations
  |--------------------------------------------------------------------------
  */

  const loadConversations = async (
    isRefresh = false,
    shouldSync = false
  ) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      /*
      |--------------------------------------------------------------------------
      | Sync Gmail First
      |--------------------------------------------------------------------------
      */

      if (shouldSync) {
        try {
          await syncGmailInbox();
        } catch (syncError) {
          console.error(
            "Gmail sync failed:",
            syncError
          );

          /*
          |--------------------------------------------------------------------------
          | Do not stop CRM conversation loading if sync fails.
          |--------------------------------------------------------------------------
          */

          if (!isRefresh) {
            setError(
              syncError?.message ||
                "Gmail sync failed."
            );
          }
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Get CRM Conversations
      |--------------------------------------------------------------------------
      */

      const response = await fetch(
        `${API_BASE_URL}/emails/conversations`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to load email conversations."
        );
      }

      const data =
        extractConversations(result);

      setConversations(data);

      /*
      |--------------------------------------------------------------------------
      | No Conversations
      |--------------------------------------------------------------------------
      */

      if (data.length === 0) {
        setSelectedConversation(null);
        setSelectedConversationId(null);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Keep Current Conversation
      |--------------------------------------------------------------------------
      */

      const currentConversationExists =
        data.some(
          (item) =>
            item?._id ===
            selectedConversationId
        );

      if (
        !selectedConversationId ||
        !currentConversationExists
      ) {
        await loadConversation(
          data[0]._id
        );
      }
    } catch (err) {
      console.error(
        "Email conversations error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load email conversations."
      );

      setConversations([]);
      setSelectedConversation(null);
      setSelectedConversationId(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Page Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadConversations(
      false,
      true
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredConversations = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    if (!searchText) {
      return conversations;
    }

    return conversations.filter(
      (item) => {
        const customerName =
          item?.customerName?.toLowerCase() ||
          "";

        const customerEmail =
          item?.customerEmail?.toLowerCase() ||
          "";

        const subject =
          item?.subject?.toLowerCase() ||
          "";

        const lastMessage =
          item?.lastMessage?.toLowerCase() ||
          "";

        return (
          customerName.includes(
            searchText
          ) ||
          customerEmail.includes(
            searchText
          ) ||
          subject.includes(
            searchText
          ) ||
          lastMessage.includes(
            searchText
          )
        );
      }
    );
  }, [
    conversations,
    search,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Delete Email Conversation
  |--------------------------------------------------------------------------
  */

  const handleDeleteConversation = async () => {
    const conversationId =
      selectedConversation
        ?.conversation?._id ||
      selectedConversationId;

    if (!conversationId) {
      setError(
        "No email conversation selected."
      );

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this email conversation? This will remove it from the CRM database."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingConversation(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/emails/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to delete email conversation."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Remove From Frontend List
      |--------------------------------------------------------------------------
      */

      setConversations(
        (previousConversations) =>
          previousConversations.filter(
            (conversation) =>
              conversation?._id !==
              conversationId
          )
      );

      /*
      |--------------------------------------------------------------------------
      | Clear Selected Conversation
      |--------------------------------------------------------------------------
      */

      setSelectedConversation(null);
      setSelectedConversationId(null);

      /*
      |--------------------------------------------------------------------------
      | Clear Reply States
      |--------------------------------------------------------------------------
      */

      setReplyText("");
      setReplyError("");
      setReplySuccess("");

      console.log(
        "Email conversation deleted:",
        result
      );
    } catch (err) {
      console.error(
        "Delete email conversation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete email conversation."
      );
    } finally {
      setDeletingConversation(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Send Manual Reply
  |--------------------------------------------------------------------------
  */

  const handleSendReply = async () => {
    const message =
      replyText.trim();

    if (!message) {
      setReplyError(
        "Please enter a message before sending."
      );

      return;
    }

    const conversationId =
      selectedConversation
        ?.conversation?._id ||
      selectedConversationId;

    if (!conversationId) {
      setReplyError(
        "No email conversation selected."
      );

      return;
    }

    try {
      setSendingReply(true);
      setReplyError("");
      setReplySuccess("");

      const response = await fetch(
        `${API_BASE_URL}/emails/conversations/${conversationId}/reply`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            text: message,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to send email reply."
        );
      }

      setReplyText("");

      setReplySuccess(
        "Reply sent successfully."
      );

      await loadConversation(
        conversationId
      );

      const conversationsResponse =
        await fetch(
          `${API_BASE_URL}/emails/conversations`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

      const conversationsResult =
        await conversationsResponse.json();

      if (
        conversationsResponse.ok
      ) {
        const updatedConversations =
          extractConversations(
            conversationsResult
          );

        setConversations(
          updatedConversations
        );
      }

      setTimeout(() => {
        setReplySuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Send email reply error:",
        err
      );

      setReplyError(
        err?.message ||
          "Unable to send email reply."
      );
    } finally {
      setSendingReply(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Enter To Send
  |--------------------------------------------------------------------------
  */

  const handleReplyKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!sendingReply) {
        handleSendReply();
      }
    }
  };

  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#F8FAFC] px-3 pb-3 pt-16 sm:px-5 sm:pb-5 sm:pt-20 lg:px-6 lg:pb-6 lg:pt-6">
      {/* Header */}

      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#5E52B7] sm:h-11 sm:w-11">
            <Mail size={21} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              Emails
            </h1>

            <p className="truncate text-xs text-slate-500 sm:text-sm">
              Manage customer email conversations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            loadConversations(
              true,
              true
            )
          }
          disabled={
            refreshing ||
            syncing
          }
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5E52B7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4F46A5] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={
              refreshing ||
              syncing
                ? "animate-spin"
                : ""
            }
          />

          {syncing
            ? "Syncing..."
            : refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Error */}

      {error && (
        <div className="mb-4 flex shrink-0 items-start gap-3 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 sm:p-4">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="min-w-0">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 break-words text-xs sm:text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Main Email Container */}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* ================= LEFT ================= */}

        <div
          className={`min-h-0 min-w-0 flex-col border-slate-200 lg:flex lg:border-r ${
            selectedConversation
              ? "hidden lg:flex"
              : "flex"
          }`}
        >
          {/* Search */}

          <div className="shrink-0 border-b border-slate-200 p-3 sm:p-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search emails..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#8B80D8] focus:bg-white focus:ring-2 focus:ring-[#5E52B7]/10"
              />
            </div>
          </div>

          {/* Conversation List */}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />

                  Loading emails...
                </div>
              </div>
            ) : filteredConversations.length ===
              0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox size={25} />
                </div>

                <h3 className="font-semibold text-slate-800">
                  No emails found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Customer email conversations will
                  appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map(
                (conversation) => {
                  const isSelected =
                    selectedConversationId ===
                    conversation?._id;

                  return (
                    <button
                      key={
                        conversation?._id
                      }
                      type="button"
                      onClick={() =>
                        loadConversation(
                          conversation?._id
                        )
                      }
                      className={`w-full border-b border-slate-100 p-3 text-left transition sm:p-4 ${
                        isSelected
                          ? "bg-[#F5F3FF]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE9FE] text-sm font-bold text-[#5E52B7]">
                          {getInitials(
                            conversation?.customerName
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">
                              {conversation?.customerName ||
                                "Unknown Customer"}
                            </h3>

                            <ChevronRight
                              size={16}
                              className={`mt-0.5 shrink-0 ${
                                isSelected
                                  ? "text-[#5E52B7]"
                                  : "text-slate-300"
                              }`}
                            />
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {conversation?.customerEmail ||
                              "No email"}
                          </p>

                          <p className="mt-2 truncate text-sm font-medium text-slate-700">
                            {conversation?.subject ||
                              "No Subject"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {conversation?.lastMessage ||
                              "No message"}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                conversation?.status ===
                                "NEW"
                                  ? "bg-blue-50 text-blue-600"
                                  : conversation?.status ===
                                    "CLOSED"
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-purple-50 text-purple-600"
                              }`}
                            >
                              {conversation?.status ||
                                "NEW"}
                            </span>

                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock3
                                size={11}
                              />

                              {formatDate(
                                conversation?.lastMessageAt
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>

        {/* ================= RIGHT ================= */}

        <div
          className={`min-h-0 min-w-0 flex-col ${
            selectedConversation
              ? "flex"
              : "hidden lg:flex"
          }`}
        >
          {!selectedConversation ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#5E52B7]">
                <Mail size={30} />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                {loading
                  ? "Loading emails..."
                  : "Select an email"}
              </h2>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Select a customer conversation from the
                list to view the complete email thread.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}

              <div className="shrink-0 border-b border-slate-200 bg-white p-3 sm:p-5">
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Mobile Back */}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConversation(
                        null
                      );

                      setSelectedConversationId(
                        null
                      );

                      setReplyText("");
                      setReplyError("");
                      setReplySuccess("");
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
                    aria-label="Back to emails"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE9FE] font-bold text-[#5E52B7] sm:h-11 sm:w-11">
                    {getInitials(
                      selectedConversation
                        ?.conversation
                        ?.customerName
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-base font-bold leading-6 text-slate-900 sm:text-lg">
                      {selectedConversation
                        ?.conversation
                        ?.subject ||
                        "No Subject"}
                    </h2>

                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex min-w-0 max-w-full items-center gap-1">
                        <UserRound
                          size={13}
                          className="shrink-0"
                        />

                        <span className="truncate">
                          {selectedConversation
                            ?.conversation
                            ?.customerName ||
                            "Unknown Customer"}
                        </span>
                      </span>

                      <span className="max-w-full break-all">
                        {selectedConversation
                          ?.conversation
                          ?.customerEmail ||
                          ""}
                      </span>
                    </div>
                  </div>

                  {/* Status + Delete */}

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 sm:block">
                      {selectedConversation
                        ?.conversation
                        ?.status || "NEW"}
                    </span>

                    <button
                      type="button"
                      onClick={
                        handleDeleteConversation
                      }
                      disabled={
                        deletingConversation
                      }
                      title="Delete conversation"
                      aria-label="Delete email conversation"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingConversation ? (
                        <>
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />

                          <span className="hidden sm:inline">
                            Deleting...
                          </span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />

                          <span className="hidden sm:inline">
                            Delete
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8FAFC] p-3 sm:p-5 lg:p-6">
                {conversationLoading ? (
                  <div className="flex min-h-[240px] items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <LoaderCircle
                        size={20}
                        className="animate-spin"
                      />

                      Loading conversation...
                    </div>
                  </div>
                ) : !Array.isArray(
                    selectedConversation?.messages
                  ) ||
                  selectedConversation.messages
                    .length === 0 ? (
                  <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
                    No messages found.
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-4xl space-y-5">
                    {selectedConversation.messages.map(
                      (
                        message,
                        index
                      ) => {
                        const isIncoming =
                          message?.direction ===
                          "INCOMING";

                        return (
                          <div
                            key={
                              message?._id ||
                              `${message?.direction}-${index}`
                            }
                            className={`flex w-full ${
                              isIncoming
                                ? "justify-start"
                                : "justify-end"
                            }`}
                          >
                            <div className="w-full max-w-2xl min-w-0">
                              {/* Message Meta */}

                              <div
                                className={`mb-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 ${
                                  !isIncoming
                                    ? "justify-end"
                                    : ""
                                }`}
                              >
                                {isIncoming ? (
                                  <>
                                    <ArrowDownLeft
                                      size={13}
                                    />

                                    <span>
                                      Customer
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span>
                                      HomeTurf
                                    </span>

                                    <ArrowUpRight
                                      size={13}
                                    />
                                  </>
                                )}

                                <span>
                                  •
                                </span>

                                <span>
                                  {formatDate(
                                    message?.createdAt
                                  )}
                                </span>
                              </div>

                              {/* Message */}

                              <div
                                className={`min-w-0 overflow-hidden rounded-2xl border p-3 shadow-sm sm:p-4 ${
                                  isIncoming
                                    ? "rounded-tl-md border-slate-200 bg-white"
                                    : "rounded-tr-md border-[#DCD7FA] bg-[#F1EFFF]"
                                }`}
                              >
                                <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
                                  <p className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-800">
                                    {message?.subject ||
                                      "Email"}
                                  </p>

                                  {!isIncoming &&
                                    message?.isAutoReply && (
                                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#5E52B7]">
                                        Auto Reply
                                      </span>
                                    )}
                                </div>

                                <div className="break-words whitespace-pre-wrap text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">
                                  {message?.text ||
                                    "No text content."}
                                </div>

                                <div className="mt-4 border-t border-slate-200/70 pt-3 text-[10px] text-slate-400">
                                  <p className="break-all">
                                    From:{" "}
                                    {message?.senderEmail ||
                                      "-"}
                                  </p>

                                  <p className="mt-1 break-all">
                                    To:{" "}
                                    {message?.recipientEmail ||
                                      "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Reply Area */}

              <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                {replyError && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0"
                    />

                    <span className="break-words">
                      {replyError}
                    </span>
                  </div>
                )}

                {replySuccess && (
                  <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-medium text-green-700">
                    {replySuccess}
                  </div>
                )}

                <div className="mx-auto w-full max-w-4xl">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail
                        size={16}
                        className="shrink-0 text-[#5E52B7]"
                      />

                      <span className="text-sm font-semibold text-slate-800">
                        Reply to customer
                      </span>
                    </div>

                    <span className="hidden text-[10px] text-slate-400 sm:block">
                      Enter to send • Shift + Enter for new line
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <textarea
                      value={replyText}
                      onChange={(e) => {
                        setReplyText(
                          e.target.value
                        );

                        setReplyError("");
                        setReplySuccess("");
                      }}
                      onKeyDown={
                        handleReplyKeyDown
                      }
                      disabled={
                        sendingReply
                      }
                      rows={3}
                      placeholder="Write your reply to the customer..."
                      className="min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#8B80D8] focus:bg-white focus:ring-2 focus:ring-[#5E52B7]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[88px] sm:flex-1"
                    />

                    <button
                      type="button"
                      onClick={
                        handleSendReply
                      }
                      disabled={
                        sendingReply ||
                        !replyText.trim()
                      }
                      className="inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5E52B7] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4F46A5] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {sendingReply ? (
                        <>
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />

                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={17} />

                          Send Reply
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-400 sm:hidden">
                    Enter to send • Shift + Enter for new line
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Emails;