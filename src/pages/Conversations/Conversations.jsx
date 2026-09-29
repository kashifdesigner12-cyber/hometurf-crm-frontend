import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Send,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  User,
  Phone,
  Mail,
  MessageSquare,
  Radio,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

import { getConversations } from "../../services/conversationApi";
import {
  getMessages,
  sendMessage,
} from "../../services/messageApi";

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sendingMessage, setSendingMessage] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD CONVERSATIONS
  |--------------------------------------------------------------------------
  */

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      setError("");

      const response = await getConversations();

      const conversationData = Array.isArray(response)
        ? response
        : response?.data ||
          response?.conversations ||
          [];

      const safeConversations = Array.isArray(
        conversationData
      )
        ? conversationData
        : [];

      setConversations(safeConversations);

      if (selectedConversation?._id) {
        const updatedConversation =
          safeConversations.find(
            (conversation) =>
              conversation?._id ===
              selectedConversation._id
          );

        if (updatedConversation) {
          setSelectedConversation(
            updatedConversation
          );
        }
      }
    } catch (error) {
      console.error(
        "Conversations loading error:",
        error
      );

      setConversations([]);

      setError(
        error?.message ||
          "Unable to load conversations."
      );
    } finally {
      setLoadingConversations(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadConversations();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD MESSAGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([]);
      return;
    }

    const loadConversationMessages = async () => {
      try {
        setLoadingMessages(true);
        setError("");

        const response = await getMessages(
          selectedConversation._id
        );

        const messageData = Array.isArray(response)
          ? response
          : response?.data ||
            response?.messages ||
            [];

        setMessages(
          Array.isArray(messageData)
            ? messageData
            : []
        );
      } catch (error) {
        console.error(
          "Messages loading error:",
          error
        );

        setMessages([]);

        setError(
          error?.message ||
            "Unable to load messages."
        );
      } finally {
        setLoadingMessages(false);
      }
    };

    loadConversationMessages();
  }, [selectedConversation?._id]);

  /*
  |--------------------------------------------------------------------------
  | SELECT CONVERSATION
  |--------------------------------------------------------------------------
  */

  const handleSelectConversation = (
    conversation
  ) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | BACK TO CONVERSATION LIST - MOBILE
  |--------------------------------------------------------------------------
  */

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setMessages([]);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE
  |--------------------------------------------------------------------------
  */

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      !selectedConversation?._id ||
      sendingMessage
    ) {
      return;
    }

    try {
      setSendingMessage(true);
      setError("");

      const response = await sendMessage(
        selectedConversation._id,
        {
          conversationId:
            selectedConversation._id,

          content: trimmedMessage,

          channel:
            selectedConversation.channel,
        }
      );

      const newMessage =
        response?.data ||
        response?.message ||
        response;

      if (newMessage) {
        setMessages(
          (previousMessages) => [
            ...previousMessages,
            newMessage,
          ]
        );
      }

      setMessage("");

      const updatedTime =
        new Date().toISOString();

      setConversations(
        (previousConversations) =>
          previousConversations.map(
            (conversation) =>
              conversation._id ===
              selectedConversation._id
                ? {
                    ...conversation,
                    lastMessage:
                      trimmedMessage,
                    lastMessageAt:
                      updatedTime,
                  }
                : conversation
          )
      );

      setSelectedConversation(
        (previous) =>
          previous
            ? {
                ...previous,
                lastMessage:
                  trimmedMessage,
                lastMessageAt:
                  updatedTime,
              }
            : previous
      );
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      setError(
        error?.message ||
          "Unable to send message."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      await loadConversations();

      if (selectedConversation?._id) {
        const response = await getMessages(
          selectedConversation._id
        );

        const messageData =
          Array.isArray(response)
            ? response
            : response?.data ||
              response?.messages ||
              [];

        setMessages(
          Array.isArray(messageData)
            ? messageData
            : []
        );
      }
    } catch (error) {
      console.error(
        "Conversation refresh error:",
        error
      );

      setError(
        error?.message ||
          "Unable to refresh conversations."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER CONVERSATIONS
  |--------------------------------------------------------------------------
  */

  const filteredConversations = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return conversations;
    }

    return conversations.filter(
      (conversation) => {
        const customerName =
          conversation?.customer?.name ||
          "";

        const customerPhone =
          conversation?.customer?.phone ||
          "";

        const customerEmail =
          conversation?.customer?.email ||
          "";

        const leadName =
          conversation?.lead?.name ||
          "";

        const leadPhone =
          conversation?.lead?.phone ||
          "";

        const lastMessage =
          conversation?.lastMessage ||
          "";

        return [
          customerName,
          customerPhone,
          customerEmail,
          leadName,
          leadPhone,
          lastMessage,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(searchValue)
        );
      }
    );
  }, [conversations, search]);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const getCustomerName = (
    conversation
  ) => {
    return (
      conversation?.customer?.name ||
      conversation?.lead?.name ||
      "Customer"
    );
  };

  const getCustomerPhone = (
    conversation
  ) => {
    return (
      conversation?.customer?.phone ||
      conversation?.lead?.phone ||
      ""
    );
  };

  const getCustomerEmail = (
    conversation
  ) => {
    return (
      conversation?.customer?.email ||
      conversation?.lead?.email ||
      ""
    );
  };

  const getLastMessage = (
    conversation
  ) => {
    return conversation?.lastMessage || "";
  };

  const getChannelLabel = (
    channel
  ) => {
    if (!channel) {
      return "Conversation";
    }

    return String(channel)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  };

  const getChannelClasses = (
    channel
  ) => {
    switch (
      String(channel || "").toUpperCase()
    ) {
      case "WHATSAPP":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";

      case "FACEBOOK":
        return "bg-blue-50 text-blue-700 border border-blue-200";

      case "INSTAGRAM":
        return "bg-pink-50 text-pink-700 border border-pink-200";

      case "SMS":
        return "bg-amber-50 text-amber-700 border border-amber-200";

      case "EMAIL":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";

      default:
        return "bg-purple-50 text-[#5E52B7] border border-purple-200";
    }
  };

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleString(
      [],
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const isOutgoingMessage = (
    chatMessage
  ) => {
    return (
      String(
        chatMessage?.direction || ""
      ).toUpperCase() ===
      "OUTGOING"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <section className="min-h-full w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] px-3 pb-12 pt-2 sm:px-4 sm:pb-16 md:px-6 lg:px-8">

      {/* HEADER */}
      <div className="animate-[fadeIn_.45s_ease-out_both] flex flex-col gap-4 py-2 sm:gap-5 md:flex-row md:items-center md:justify-between">

        <div className="min-w-0">

          <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:px-3.5 sm:text-[11px]">

            <Sparkles
              size={13}
              className="shrink-0"
            />

            <span className="truncate">
              Customer Communication
            </span>

          </div>

          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
            Conversations
          </h1>

          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:text-sm">
            Manage customer conversations and
            send messages from one central
            workspace.
          </p>

        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="group inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-purple-200/80 bg-white px-4 py-3 text-sm font-bold text-[#55515F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5E52B7] hover:bg-purple-50/80 hover:text-[#5E52B7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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

      </div>

      {/* ERROR */}
      {error && (
        <div className="animate-[fadeIn_.3s_ease-out_both] mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-xs font-semibold text-red-700 shadow-sm sm:px-5 sm:py-4 sm:text-sm">

          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />

          <p className="min-w-0 break-words">
            {error}
          </p>

        </div>
      )}

      {/* CHAT PANEL */}
      <div className="animate-[slideUp_.5s_ease-out_both] w-full overflow-hidden rounded-[20px] border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] sm:rounded-[24px] md:h-[calc(100vh-15rem)] md:min-h-[560px]">

        {/* ================================================================
            MOBILE
        ================================================================= */}

        <div className="flex h-[calc(100vh-13.5rem)] min-h-[520px] w-full flex-col md:hidden">

          {!selectedConversation ? (
            <ConversationList
              conversations={conversations}
              filteredConversations={
                filteredConversations
              }
              loadingConversations={
                loadingConversations
              }
              search={search}
              setSearch={setSearch}
              selectedConversation={
                selectedConversation
              }
              handleSelectConversation={
                handleSelectConversation
              }
              getCustomerName={
                getCustomerName
              }
              getLastMessage={
                getLastMessage
              }
              formatTime={formatTime}
              getChannelLabel={
                getChannelLabel
              }
              getChannelClasses={
                getChannelClasses
              }
            />
          ) : (
            <MobileConversationView
              selectedConversation={
                selectedConversation
              }
              messages={messages}
              message={message}
              setMessage={setMessage}
              loadingMessages={
                loadingMessages
              }
              sendingMessage={
                sendingMessage
              }
              onSend={handleSendMessage}
              onBack={
                handleBackToConversations
              }
              getCustomerName={
                getCustomerName
              }
              getCustomerPhone={
                getCustomerPhone
              }
              getCustomerEmail={
                getCustomerEmail
              }
              getChannelLabel={
                getChannelLabel
              }
              getChannelClasses={
                getChannelClasses
              }
              isOutgoingMessage={
                isOutgoingMessage
              }
              formatDateTime={
                formatDateTime
              }
            />
          )}

        </div>

        {/* ================================================================
            TABLET / DESKTOP
        ================================================================= */}

        <div className="hidden h-full min-w-0 md:flex">

          {/* LEFT SIDE */}
          <aside className="flex w-[300px] shrink-0 flex-col border-r border-purple-50 bg-white lg:w-[340px] xl:w-[380px] 2xl:w-[400px]">

            <ConversationList
              conversations={conversations}
              filteredConversations={
                filteredConversations
              }
              loadingConversations={
                loadingConversations
              }
              search={search}
              setSearch={setSearch}
              selectedConversation={
                selectedConversation
              }
              handleSelectConversation={
                handleSelectConversation
              }
              getCustomerName={
                getCustomerName
              }
              getLastMessage={
                getLastMessage
              }
              formatTime={formatTime}
              getChannelLabel={
                getChannelLabel
              }
              getChannelClasses={
                getChannelClasses
              }
            />

          </aside>

          {/* RIGHT SIDE */}
          <section className="flex min-w-0 flex-1 flex-col">

            {!selectedConversation ? (
              <EmptyConversationSelection />
            ) : (
              <DesktopConversationView
                selectedConversation={
                  selectedConversation
                }
                messages={messages}
                message={message}
                setMessage={setMessage}
                loadingMessages={
                  loadingMessages
                }
                sendingMessage={
                  sendingMessage
                }
                onSend={handleSendMessage}
                getCustomerName={
                  getCustomerName
                }
                getCustomerPhone={
                  getCustomerPhone
                }
                getCustomerEmail={
                  getCustomerEmail
                }
                getChannelLabel={
                  getChannelLabel
                }
                getChannelClasses={
                  getChannelClasses
                }
                isOutgoingMessage={
                  isOutgoingMessage
                }
                formatDateTime={
                  formatDateTime
                }
              />
            )}

          </section>

        </div>

      </div>
    </section>
  );
};

/* ==========================================================================
   CONVERSATION LIST
========================================================================== */

const ConversationList = ({
  conversations,
  filteredConversations,
  loadingConversations,
  search,
  setSearch,
  selectedConversation,
  handleSelectConversation,
  getCustomerName,
  getLastMessage,
  formatTime,
  getChannelLabel,
  getChannelClasses,
}) => {
  return (
    <>
      {/* LIST HEADER */}
      <div className="shrink-0 border-b border-purple-50 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">

        <div className="flex items-center justify-between gap-3">

          <div className="min-w-0">

            <h2 className="text-base font-black tracking-tight text-[#24212C] sm:text-[17px]">
              Messages
            </h2>

            <p className="mt-0.5 text-[11px] font-medium text-[#8C8697] sm:text-xs">
              {conversations.length}{" "}
              conversation
              {conversations.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm sm:h-11 sm:w-11">
            <MessageCircle
              size={19}
            />
          </div>

        </div>

        {/* SEARCH */}
        <div className="relative mt-4 sm:mt-5">

          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697]"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search conversations..."
            className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-xs font-medium text-[#33303A] outline-none transition-all duration-300 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
          />

        </div>

      </div>

      {/* LIST */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

        {loadingConversations ? (
          <ConversationSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="flex min-h-[300px] h-full flex-col items-center justify-center px-6 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-50 text-[#5E52B7] sm:h-16 sm:w-16">
              <MessageCircle
                size={26}
              />
            </div>

            <h3 className="mt-4 text-sm font-black text-[#55515F]">
              No conversations found
            </h3>

            <p className="mt-1.5 max-w-[250px] text-xs font-medium leading-relaxed text-[#8C8697]">
              {search.trim()
                ? "Try another search term."
                : "Customer conversations will appear here when available."}
            </p>

          </div>
        ) : (
          filteredConversations.map(
            (
              conversation,
              index
            ) => {
              const customerName =
                getCustomerName(
                  conversation
                );

              const lastMessage =
                getLastMessage(
                  conversation
                );

              const isSelected =
                selectedConversation?._id ===
                conversation._id;

              return (
                <button
                  key={
                    conversation._id
                  }
                  type="button"
                  onClick={() =>
                    handleSelectConversation(
                      conversation
                    )
                  }
                  style={{
                    animationDelay: `${
                      index * 45
                    }ms`,
                  }}
                  className={`group w-full border-b border-purple-50 px-4 py-3.5 text-left transition-all duration-300 animate-[fadeIn_.4s_ease-out_both] sm:px-5 sm:py-4 ${
                    isSelected
                      ? "border-l-4 border-l-[#5E52B7] bg-gradient-to-r from-purple-100/70 to-indigo-50/50"
                      : "hover:bg-purple-50/30"
                  }`}
                >

                  <div className="flex min-w-0 gap-3">

                    {/* AVATAR */}
                    <div
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black transition-all duration-300 sm:h-11 sm:w-11 ${
                        isSelected
                          ? "bg-[#5E52B7] text-white shadow-md"
                          : "bg-purple-100/80 text-[#5E52B7] group-hover:scale-105"
                      }`}
                    >
                      {customerName
                        .charAt(0)
                        .toUpperCase()}

                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      )}

                    </div>

                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">

                      <div className="flex min-w-0 items-start justify-between gap-2">

                        <h3 className="min-w-0 truncate text-xs font-bold text-[#33303A] sm:text-sm">
                          {customerName}
                        </h3>

                        <span className="shrink-0 text-[9px] font-semibold text-[#8C8697] sm:text-[10px]">
                          {formatTime(
                            conversation.lastMessageAt ||
                              conversation.updatedAt
                          )}
                        </span>

                      </div>

                      <p className="mt-1 truncate text-[11px] font-medium text-[#6E687A] sm:text-xs">
                        {lastMessage ||
                          "No messages yet"}
                      </p>

                      <div className="mt-2.5 flex min-w-0 items-center gap-2">

                        <span
                          className={`inline-flex max-w-[65%] min-w-0 items-center gap-1 truncate rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide sm:text-[10px] ${getChannelClasses(
                            conversation.channel
                          )}`}
                        >
                          <Radio
                            size={10}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {getChannelLabel(
                              conversation.channel
                            )}
                          </span>

                        </span>

                        <span className="shrink-0 truncate text-[9px] font-bold uppercase text-[#8C8697] sm:text-[10px]">
                          {conversation.status ||
                            "OPEN"}
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
    </>
  );
};

/* ==========================================================================
   DESKTOP / TABLET CONVERSATION VIEW
========================================================================== */

const DesktopConversationView = ({
  selectedConversation,
  messages,
  message,
  setMessage,
  loadingMessages,
  sendingMessage,
  onSend,
  getCustomerName,
  getCustomerPhone,
  getCustomerEmail,
  getChannelLabel,
  getChannelClasses,
  isOutgoingMessage,
  formatDateTime,
}) => {
  return (
    <>
      {/* CHAT HEADER */}
      <header className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-purple-50 bg-white px-4 sm:px-5 lg:px-6">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-sm font-black text-[#5E52B7] shadow-sm sm:h-11 sm:w-11">
            {getCustomerName(
              selectedConversation
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">

            <h2 className="truncate text-sm font-black text-[#24212C] sm:text-[15px]">
              {getCustomerName(
                selectedConversation
              )}
            </h2>

            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">

              <span
                className={`inline-flex max-w-[180px] items-center gap-1 truncate rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide sm:text-[10px] ${getChannelClasses(
                  selectedConversation.channel
                )}`}
              >
                <Radio
                  size={10}
                  className="shrink-0"
                />

                <span className="truncate">
                  {getChannelLabel(
                    selectedConversation.channel
                  )}
                </span>

              </span>

              <span className="text-[9px] font-bold uppercase text-[#8C8697] sm:text-[10px]">
                {selectedConversation.status ||
                  "OPEN"}
              </span>

            </div>

          </div>

        </div>

        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:bg-purple-100 sm:h-10 sm:w-10"
          title="Conversation options"
        >
          <MoreVertical
            size={17}
          />
        </button>

      </header>

      {/* CUSTOMER INFO */}
      {(getCustomerPhone(
        selectedConversation
      ) ||
        getCustomerEmail(
          selectedConversation
        )) && (
        <div className="shrink-0 border-b border-purple-50 bg-purple-50/20 px-4 py-2.5 sm:px-5 lg:px-6">

          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">

            {getCustomerPhone(
              selectedConversation
            ) && (
              <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold text-[#6E687A] sm:text-xs">

                <Phone
                  size={13}
                  className="shrink-0 text-[#5E52B7]"
                />

                <span className="truncate">
                  {getCustomerPhone(
                    selectedConversation
                  )}
                </span>

              </div>
            )}

            {getCustomerEmail(
              selectedConversation
            ) && (
              <div className="flex min-w-0 max-w-full items-center gap-2 text-[11px] font-bold text-[#6E687A] sm:text-xs">

                <Mail
                  size={13}
                  className="shrink-0 text-[#5E52B7]"
                />

                <span className="min-w-0 truncate break-all">
                  {getCustomerEmail(
                    selectedConversation
                  )}
                </span>

              </div>
            )}

          </div>

        </div>
      )}

      {/* MESSAGES */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8FAFC] px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">

        {loadingMessages ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-100/80 text-[#5E52B7] shadow-sm sm:h-16 sm:w-16">
              <MessageSquare
                size={26}
              />
            </div>

            <h3 className="mt-4 text-sm font-black text-[#55515F]">
              No messages yet
            </h3>

            <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697]">
              Send the first message to start
              this conversation.
            </p>

          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl space-y-3 sm:space-y-4">

            {messages.map(
              (
                chatMessage,
                index
              ) => {
                const outgoing =
                  isOutgoingMessage(
                    chatMessage
                  );

                return (
                  <div
                    key={
                      chatMessage._id ||
                      `${chatMessage.sentAt}-${index}`
                    }
                    style={{
                      animationDelay: `${
                        index * 35
                      }ms`,
                    }}
                    className={`flex animate-[fadeIn_.35s_ease-out_both] ${
                      outgoing
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex min-w-0 max-w-[90%] flex-col sm:max-w-[78%] lg:max-w-[70%] ${
                        outgoing
                          ? "items-end"
                          : "items-start"
                      }`}
                    >

                      <div
                        className={`max-w-full px-3.5 py-3 shadow-sm transition-all duration-200 hover:shadow-md sm:px-4 sm:py-3.5 ${
                          outgoing
                            ? "rounded-2xl rounded-br-md bg-gradient-to-r from-[#5E52B7] to-indigo-600 font-medium text-white"
                            : "rounded-2xl rounded-bl-md border border-purple-200/60 bg-white font-medium text-[#33303A]"
                        }`}
                      >

                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
                          {chatMessage.content ||
                            chatMessage.message ||
                            ""}
                        </p>

                      </div>

                      <div
                        className={`mt-1.5 px-1 text-[9px] font-semibold text-[#8C8697] sm:text-[10px] ${
                          outgoing
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {formatDateTime(
                          chatMessage.sentAt ||
                            chatMessage.createdAt
                        )}
                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* INPUT */}
      <MessageInput
        message={message}
        setMessage={setMessage}
        sendingMessage={
          sendingMessage
        }
        onSend={onSend}
        channel={selectedConversation.channel}
        getChannelLabel={
          getChannelLabel
        }
        desktop
      />
    </>
  );
};

/* ==========================================================================
   MOBILE CONVERSATION VIEW
========================================================================== */

const MobileConversationView = ({
  selectedConversation,
  messages,
  message,
  setMessage,
  loadingMessages,
  sendingMessage,
  onSend,
  onBack,
  getCustomerName,
  getCustomerPhone,
  getCustomerEmail,
  getChannelLabel,
  getChannelClasses,
  isOutgoingMessage,
  formatDateTime,
}) => {
  return (
    <>
      {/* MOBILE HEADER */}
      <header className="flex min-h-[68px] shrink-0 items-center gap-2 border-b border-purple-50 bg-white px-3 sm:px-4">

        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition hover:bg-purple-100 active:scale-95"
          title="Back to conversations"
        >
          <ArrowLeft
            size={18}
          />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-xs font-black text-[#5E52B7] sm:h-10 sm:w-10">
            {getCustomerName(
              selectedConversation
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">

            <h2 className="truncate text-xs font-black text-[#24212C] sm:text-sm">
              {getCustomerName(
                selectedConversation
              )}
            </h2>

            <div className="mt-1 flex min-w-0 items-center gap-1.5">

              <span
                className={`inline-flex max-w-[130px] items-center gap-1 truncate rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase ${getChannelClasses(
                  selectedConversation.channel
                )}`}
              >
                <Radio
                  size={9}
                  className="shrink-0"
                />

                <span className="truncate">
                  {getChannelLabel(
                    selectedConversation.channel
                  )}
                </span>

              </span>

              <span className="shrink-0 text-[9px] font-bold uppercase text-[#8C8697]">
                {selectedConversation.status ||
                  "OPEN"}
              </span>

            </div>

          </div>

        </div>

        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7]"
          title="Conversation options"
        >
          <MoreVertical
            size={17}
          />
        </button>

      </header>

      {/* CUSTOMER INFO */}
      {(getCustomerPhone(
        selectedConversation
      ) ||
        getCustomerEmail(
          selectedConversation
        )) && (
        <div className="shrink-0 border-b border-purple-50 bg-purple-50/20 px-3 py-2.5 sm:px-4">

          <div className="flex min-w-0 flex-col gap-1.5">

            {getCustomerPhone(
              selectedConversation
            ) && (
              <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold text-[#6E687A] sm:text-xs">

                <Phone
                  size={12}
                  className="shrink-0 text-[#5E52B7]"
                />

                <span className="truncate">
                  {getCustomerPhone(
                    selectedConversation
                  )}
                </span>

              </div>
            )}

            {getCustomerEmail(
              selectedConversation
            ) && (
              <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold text-[#6E687A] sm:text-xs">

                <Mail
                  size={12}
                  className="shrink-0 text-[#5E52B7]"
                />

                <span className="min-w-0 truncate break-all">
                  {getCustomerEmail(
                    selectedConversation
                  )}
                </span>

              </div>
            )}

          </div>

        </div>
      )}

      {/* MESSAGES */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8FAFC] px-3 py-4 sm:px-4 sm:py-5">

        {loadingMessages ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-100/80 text-[#5E52B7]">
              <MessageCircle
                size={26}
              />
            </div>

            <p className="mt-3 text-xs font-medium text-[#8C8697] sm:text-sm">
              No messages yet.
            </p>

          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-3.5 sm:space-y-4">

            {messages.map(
              (
                chatMessage,
                index
              ) => {
                const outgoing =
                  isOutgoingMessage(
                    chatMessage
                  );

                return (
                  <div
                    key={
                      chatMessage._id ||
                      `${chatMessage.sentAt}-${index}`
                    }
                    className={`flex ${
                      outgoing
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex min-w-0 max-w-[90%] flex-col ${
                        outgoing
                          ? "items-end"
                          : "items-start"
                      }`}
                    >

                      <div
                        className={`max-w-full px-3.5 py-3 shadow-sm sm:px-4 ${
                          outgoing
                            ? "rounded-2xl rounded-br-md bg-gradient-to-r from-[#5E52B7] to-indigo-600 font-medium text-white"
                            : "rounded-2xl rounded-bl-md border border-purple-200/60 bg-white font-medium text-[#33303A]"
                        }`}
                      >

                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
                          {chatMessage.content ||
                            chatMessage.message ||
                            ""}
                        </p>

                      </div>

                      <p
                        className={`mt-1.5 px-1 text-[9px] font-semibold text-[#8C8697] sm:text-[10px] ${
                          outgoing
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {formatDateTime(
                          chatMessage.sentAt ||
                            chatMessage.createdAt
                        )}
                      </p>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* MOBILE INPUT */}
      <MessageInput
        message={message}
        setMessage={setMessage}
        sendingMessage={
          sendingMessage
        }
        onSend={onSend}
        channel={selectedConversation.channel}
        getChannelLabel={
          getChannelLabel
        }
      />
    </>
  );
};

/* ==========================================================================
   MESSAGE INPUT
========================================================================== */

const MessageInput = ({
  message,
  setMessage,
  sendingMessage,
  onSend,
  channel,
  getChannelLabel,
  desktop = false,
}) => {
  return (
    <form
      onSubmit={onSend}
      className={`shrink-0 border-t border-purple-50 bg-white ${
        desktop
          ? "p-3 sm:p-4"
          : "p-2.5 sm:p-3"
      }`}
    >

      <div className="mx-auto w-full max-w-5xl">

        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-purple-200/80 bg-[#FAFAFB] px-2.5 py-2 transition-all duration-300 focus-within:border-[#5E52B7] focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-100 sm:px-3.5 sm:py-2.5">

          {desktop && (
            <User
              size={16}
              className="ml-1 hidden shrink-0 text-[#8C8697] sm:block"
            />
          )}

          <input
            type="text"
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            placeholder="Type a message..."
            disabled={sendingMessage}
            className="h-10 min-w-0 flex-1 bg-transparent px-1 text-xs font-medium text-[#33303A] outline-none placeholder:text-[#A09CA7] disabled:cursor-not-allowed sm:text-sm"
          />

          <button
            type="submit"
            disabled={
              !message.trim() ||
              sendingMessage
            }
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sendingMessage ? (
              <RefreshCw
                size={16}
                className="animate-spin"
              />
            ) : (
              <Send
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            )}
          </button>

        </div>

        <p className="mt-1.5 px-1 text-[9px] font-semibold text-[#8C8697] sm:mt-2 sm:text-[10px]">
          Channel:{" "}
          {getChannelLabel(channel)}
        </p>

      </div>

    </form>
  );
};

/* ==========================================================================
   EMPTY CONVERSATION SELECTION
========================================================================== */

const EmptyConversationSelection = () => {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-5 text-center">

      <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm sm:h-20 sm:w-20 sm:rounded-[24px]">

        <MessageCircle
          size={29}
          className="animate-pulse sm:h-[34px] sm:w-[34px]"
        />

        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#5E52B7] sm:h-4 sm:w-4 sm:border-4" />

      </div>

      <h2 className="mt-5 text-base font-black text-[#33303A] sm:mt-6 sm:text-lg">
        Select a conversation
      </h2>

      <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-[#8C8697] sm:text-sm">
        Choose a customer conversation from
        the list to view messages and continue
        the conversation.
      </p>

    </div>
  );
};

/* ==========================================================================
   CONVERSATION SKELETON
========================================================================== */

const ConversationSkeleton = () => {
  return (
    <div className="space-y-1 p-2">

      {[1, 2, 3, 4, 5, 6].map(
        (item) => (
          <div
            key={item}
            className="flex animate-pulse gap-3 rounded-2xl p-3 sm:gap-3.5 sm:p-3.5"
          >

            <div className="h-10 w-10 shrink-0 rounded-2xl bg-purple-100/80 sm:h-11 sm:w-11" />

            <div className="min-w-0 flex-1">

              <div className="flex justify-between gap-2">

                <div className="h-3.5 w-20 rounded-md bg-purple-100/80 sm:w-24" />

                <div className="h-3 w-9 shrink-0 rounded-md bg-purple-50 sm:w-10" />

              </div>

              <div className="mt-2.5 h-3 w-28 rounded-md bg-purple-100/60 sm:w-36" />

              <div className="mt-2.5 h-5 w-16 rounded-lg bg-purple-50" />

            </div>

          </div>
        )
      )}

    </div>
  );
};

/* ==========================================================================
   MESSAGE SKELETON
========================================================================== */

const MessageSkeleton = () => {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">

      <div className="flex justify-start">
        <div className="h-14 w-40 animate-pulse rounded-2xl border border-purple-200/40 bg-white shadow-sm sm:h-16 sm:w-48" />
      </div>

      <div className="flex justify-end">
        <div className="h-16 w-48 animate-pulse rounded-2xl bg-purple-200/60 sm:h-20 sm:w-56" />
      </div>

      <div className="flex justify-start">
        <div className="h-12 w-52 animate-pulse rounded-2xl border border-purple-200/40 bg-white shadow-sm sm:h-14 sm:w-64" />
      </div>

      <div className="flex justify-end">
        <div className="h-14 w-36 animate-pulse rounded-2xl bg-purple-200/60 sm:h-16 sm:w-44" />
      </div>

    </div>
  );
};

export default Conversations;