import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  Briefcase,
  MessageSquare,
  Mail,
  Phone,
  Star,
  Zap,
  FileText,
  Bell,
  Plug,
  UserCog,
  Settings,
  Menu,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    name: "Leads",
    icon: Users,
    path: "/leads",
  },
  {
    name: "Customers",
    icon: UserRound,
    path: "/customers",
  },
  {
    name: "Appointments",
    icon: CalendarDays,
    path: "/appointments",
  },
  {
    name: "Services",
    icon: Briefcase,
    path: "/services",
  },
  {
    name: "Conversations",
    icon: MessageSquare,
    path: "/conversations",
  },
  {
    name: "Emails",
    icon: Mail,
    path: "/emails",
  },
  {
    name: "Calls",
    icon: Phone,
    path: "/calls",
  },
  {
    name: "Reviews",
    icon: Star,
    path: "/reviews",
  },
  {
    name: "Automations",
    icon: Zap,
    path: "/automations",
  },
  {
    name: "Templates",
    icon: FileText,
    path: "/templates",
  },
  {
    name: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  {
    name: "Integrations",
    icon: Plug,
    path: "/integrations",
  },
  {
    name: "Users",
    icon: UserCog,
    path: "/users",
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-white text-[#5E52B7] shadow-[0_4px_20px_rgba(0,0,0,0.12)] scale-[1.02]"
        : "text-purple-100 hover:bg-white/10 hover:text-white"
    }`;

  const iconClass = (isActive) =>
    `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
      isActive
        ? "bg-[#EDE9FE] text-[#5E52B7] font-bold shadow-sm scale-105"
        : "bg-white/10 text-purple-200 group-hover:bg-white/20 group-hover:text-white group-hover:scale-105"
    }`;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-[#5E52B7] text-white shadow-lg transition hover:bg-[#4F46A5] sm:left-4 sm:top-4 lg:hidden"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[70] flex h-screen h-[100dvh] w-[min(18rem,85vw)] flex-col border-r border-indigo-950/20 bg-[#5E52B7] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:w-64 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="relative flex h-24 shrink-0 items-center overflow-hidden border-b border-white/10 px-5 sm:px-6">
          {/* Decorative Background */}
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-indigo-300/10 blur-2xl" />

          <div className="relative z-10 flex min-w-0 items-center gap-3">
            {/* Professional Logo */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg">
              <div className="absolute inset-[3px] flex items-center justify-center rounded-[9px] bg-gradient-to-br from-[#6D5DD3] to-[#4F46A5]">
                <span className="text-sm font-black tracking-tight text-white">
                  LP
                </span>
              </div>
            </div>

            {/* Brand */}
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-extrabold tracking-tight text-white">
                Local Pro1
                <span className="ml-1 text-indigo-200">CRM</span>
              </h1>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />

                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-purple-200/80">
                  Business Management
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={closeSidebar}
            className="relative z-10 ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-purple-100 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-3 px-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-purple-200/50">
              Workspace
            </p>
          </div>

          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeSidebar}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      <div className={iconClass(isActive)}>
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 1.9}
                          className="transition-transform duration-300"
                        />
                      </div>

                      <span className="relative z-10 min-w-0 flex-1 truncate font-medium tracking-wide">
                        {item.name}
                      </span>

                      {isActive && (
                        <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#5E52B7] shadow-sm" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Settings */}
        <div className="shrink-0 border-t border-white/10 bg-purple-900/20 p-3 sm:p-4">
          <NavLink
            to="/settings"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            {({ isActive }) => (
              <>
                <div className={iconClass(isActive)}>
                  <Settings
                    size={18}
                    className="transition-transform duration-500 group-hover:rotate-90"
                  />
                </div>

                <span className="relative z-10 min-w-0 flex-1 truncate font-medium tracking-wide">
                  Settings
                </span>

                {isActive && (
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#5E52B7] shadow-sm" />
                )}
              </>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;